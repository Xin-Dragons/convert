use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{Metadata, MetadataAccount},
    token::Mint,
};
use mpl_candy_machine_core::{
    approve_metadata_delegate, constants::MPL_TOKEN_AUTH_RULES_PROGRAM,
    ApproveMetadataDelegateHelperAccounts,
};
use solana_program::sysvar;

use crate::{
    state::{Converter, ProgramConfig},
    ConvertError,
};

use proc_macro_regex::regex;

regex!(regex_slug "^(?:[_a-z0-9]+)*$");

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(
        mut,
        seeds = [
            b"program-config"
        ],
        bump = program_config.bump,
        realloc = program_config.current_len() + 50 + 4,
        realloc::payer = authority,
        realloc::zero = false,
    )]
    pub program_config: Account<'info, ProgramConfig>,

    #[account(
        init,
        seeds = [
            b"CONVERT",
            source_collection_mint.key().as_ref(),
        ],
        bump,
        space = Converter::LEN,
        payer = authority
    )]
    converter: Account<'info, Converter>,

    source_collection_mint: Account<'info, Mint>,

    #[account(
        seeds = [
            b"metadata",
            Metadata::id().as_ref(),
            source_collection_mint.key().as_ref()
        ],
        seeds::program = Metadata::id(),
        bump,
    )]
    source_collection_metadata: Account<'info, MetadataAccount>,

    destination_collection_mint: Account<'info, Mint>,

    #[account(mut)]
    destination_collection_metadata: Account<'info, MetadataAccount>,

    /// Metadata delegate record. The delegate is used to verify NFTs.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    collection_delegate_record: UncheckedAccount<'info>,

    #[account(
        mut,
        constraint = source_collection_metadata.update_authority == authority.key() @ ConvertError::UnauthorisedUA
    )]
    authority: Signer<'info>,

    system_program: Program<'info, System>,

    token_metadata_program: Program<'info, Metadata>,

    #[account(owner = MPL_TOKEN_AUTH_RULES_PROGRAM @ ConvertError::InvalidRuleSet)]
    rule_set: Option<UncheckedAccount<'info>>,

    /// Instructions sysvar account.
    ///
    /// CHECK: account constraint checked in account trait
    #[account(address = sysvar::instructions::id())]
    sysvar_instructions: UncheckedAccount<'info>,

    /// Token Authorization Rules program.
    ///
    /// CHECK: account constraint checked in account trait
    #[account(address = MPL_TOKEN_AUTH_RULES_PROGRAM)]
    authorization_rules_program: Option<UncheckedAccount<'info>>,

    /// Token Authorization rules account for the collection metadata (if any).
    ///
    /// CHECK: account checked in CPI
    #[account(owner = MPL_TOKEN_AUTH_RULES_PROGRAM)]
    authorization_rules: Option<UncheckedAccount<'info>>,
}

pub fn init_handler(
    ctx: Context<Init>,
    name: String,
    slug: String,
    logo: Option<String>,
    bg: Option<String>,
) -> Result<()> {
    require_gte!(50, slug.len(), ConvertError::SlugTooLong);
    require_gt!(slug.len(), 0, ConvertError::SlugRequired);
    require_gte!(50, name.len(), ConvertError::NameTooLong);
    require_gt!(name.len(), 0, ConvertError::NameRequired);

    if logo.is_some() {
        require_gte!(52, logo.as_ref().unwrap().len(), ConvertError::LogoTooLong);
    }

    if bg.is_some() {
        require_gte!(52, bg.as_ref().unwrap().len(), ConvertError::BgTooLong);
    }

    require!(regex_slug(&slug), ConvertError::InvalidSlug);

    let program_config = &mut ctx.accounts.program_config;

    let existing_slugs = &program_config.slugs;
    require!(!existing_slugs.contains(&slug), ConvertError::SlugExists);

    program_config.slugs.push(slug.clone());

    // approves the metadata delegate so the candy machine can verify minted NFTs
    let delegate_accounts = ApproveMetadataDelegateHelperAccounts {
        token_metadata_program: ctx.accounts.token_metadata_program.to_account_info(),
        authority_pda: ctx.accounts.converter.to_account_info(),
        collection_metadata: ctx
            .accounts
            .destination_collection_metadata
            .to_account_info(),
        collection_mint: ctx.accounts.destination_collection_mint.to_account_info(),
        collection_update_authority: ctx.accounts.authority.to_account_info(),
        delegate_record: ctx.accounts.collection_delegate_record.to_account_info(),
        payer: ctx.accounts.authority.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
        authorization_rules_program: ctx
            .accounts
            .authorization_rules_program
            .as_ref()
            .map(|authorization_rules_program| authorization_rules_program.to_account_info()),
        authorization_rules: ctx
            .accounts
            .authorization_rules
            .as_ref()
            .map(|authorization_rules| authorization_rules.to_account_info()),
    };

    approve_metadata_delegate(delegate_accounts);

    let converter = &mut ctx.accounts.converter;

    **converter = Converter::init(
        name,
        slug,
        logo,
        bg,
        ctx.accounts.authority.key(),
        ctx.accounts.source_collection_mint.key(),
        ctx.accounts.destination_collection_mint.key(),
        ctx.accounts
            .rule_set
            .as_ref()
            .map(|rule_set| rule_set.key()),
        ctx.bumps.converter,
    );
    Ok(())
}
