use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{
        mpl_token_metadata::instructions::RevokeCollectionV1CpiBuilder, Metadata, MetadataAccount,
    },
    token::Mint,
};
use mpl_candy_machine_core::constants::MPL_TOKEN_AUTH_RULES_PROGRAM;
use solana_program::sysvar;

use crate::{
    program::Convert,
    state::{Converter, ProgramConfig},
    ConvertError,
};

#[derive(Accounts)]
pub struct DeleteConverter<'info> {
    #[account(
        mut,
        seeds = [
            b"program-config"
        ],
        bump
    )]
    program_config: Account<'info, ProgramConfig>,

    #[account(
        mut,
        close = authority
    )]
    converter: Account<'info, Converter>,

    #[account(
        mut,
        constraint = if converter.authority != authority.key() {
            program_data.is_some()
        } else {
            true
        }
    )]
    authority: Signer<'info>,

    #[account(
        constraint = program.programdata_address()? == Some(program_data.as_ref().unwrap().key()) @ ConvertError::AdminOnly
    )]
    program: Option<Program<'info, Convert>>,

    #[account(
        constraint = program_data.upgrade_authority_address == Some(authority.key()) @ ConvertError::AdminOnly
    )]
    program_data: Option<Account<'info, ProgramData>>,

    #[account(address = converter.destination_collection)]
    collection_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [
            b"metadata",
            Metadata::id().as_ref(),
            collection_mint.key().as_ref()
        ],
        seeds::program = Metadata::id(),
        bump,
    )]
    collection_metadata: Account<'info, MetadataAccount>,
    /// CHECK: checked in CPI
    #[account(mut)]
    collection_delegate_record: UncheckedAccount<'info>,

    /// CHECK: checked in CPI
    authorization_rules: Option<AccountInfo<'info>>,

    /// CHECK: checked in CPI
    #[account(address = MPL_TOKEN_AUTH_RULES_PROGRAM)]
    authorization_rules_program: Option<AccountInfo<'info>>,

    system_program: Program<'info, System>,
    token_metadata_program: Program<'info, Metadata>,
    /// CHECK: account constraint checked in account trait
    #[account(address = sysvar::instructions::id())]
    sysvar_instructions: UncheckedAccount<'info>,
}

pub fn delete_converter_handler(ctx: Context<DeleteConverter>) -> Result<()> {
    let converter = &ctx.accounts.converter;
    let slugs: Vec<String> = ctx.accounts.program_config.slugs.clone();

    // if signer is UA, revoke the metadata auth. If not, they can do it later
    if ctx.accounts.collection_metadata.update_authority == ctx.accounts.authority.key() {
        RevokeCollectionV1CpiBuilder::new(&ctx.accounts.token_metadata_program)
            .delegate_record(Some(&ctx.accounts.collection_delegate_record))
            .delegate(&ctx.accounts.converter.to_account_info())
            .mint(&ctx.accounts.collection_mint.to_account_info())
            .metadata(&ctx.accounts.collection_metadata.to_account_info())
            .payer(&ctx.accounts.authority)
            .authority(&ctx.accounts.authority)
            .system_program(&ctx.accounts.system_program)
            .sysvar_instructions(&ctx.accounts.sysvar_instructions)
            .authorization_rules(ctx.accounts.authorization_rules.as_ref())
            .authorization_rules_program(ctx.accounts.authorization_rules_program.as_ref())
            .invoke()?;
    }

    let program_config = &mut ctx.accounts.program_config;

    program_config.slugs = slugs
        .into_iter()
        .filter(|slug| slug != &converter.slug)
        .collect();

    let bal = program_config.get_lamports();
    let new_size = program_config
        .to_account_info()
        .data_len()
        .checked_sub(54)
        .ok_or(ConvertError::ProgramSubError)?;
    let rent_required = Rent::get().unwrap().minimum_balance(new_size);
    let to_refund = bal
        .checked_sub(rent_required)
        .ok_or(ConvertError::ProgramSubError)?;

    program_config.to_account_info().realloc(new_size, false)?;

    if to_refund > 0 {
        program_config.sub_lamports(to_refund)?;
        ctx.accounts.authority.add_lamports(to_refund)?;
    }

    Ok(())
}
