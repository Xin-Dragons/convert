use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{Metadata, MetadataAccount},
    token::Mint,
};
use mpl_core::{
    instructions::CreateCollectionV1CpiBuilder,
    types::{Creator, PluginAuthority, PluginAuthorityPair, Royalties, RuleSet, UpdateDelegate},
    ID as CoreID,
};
use proc_macro_regex::regex;

use crate::{
    state::{AssetType, Converter, ProgramConfig},
    ConvertError,
};

regex!(regex_slug "^(?:[_a-z0-9]+)*$");

#[derive(Accounts)]
pub struct InitCore<'info> {
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
    program_config: Account<'info, ProgramConfig>,

    #[account(
        init,
        seeds = [
            b"CONVERT",
            collection_identifier.key().as_ref()
        ],
        bump,
        space = Converter::LEN,
        payer = authority
    )]
    converter: Account<'info, Converter>,

    #[account(
        mint::decimals = 0,
        constraint = nft_mint.supply == 1
    )]
    nft_mint: Account<'info, Mint>,

    #[account(
        seeds = [
            b"metadata",
            Metadata::id().as_ref(),
            nft_mint.key().as_ref()
        ],
        seeds::program = Metadata::id(),
        bump,
    )]
    nft_metadata: Account<'info, MetadataAccount>,

    /// CHECK: checked in instruction
    collection_identifier: UncheckedAccount<'info>,

    #[account(mut)]
    destination_collection: Signer<'info>,

    /// CHECK: address checked
    #[account(address = CoreID)]
    core_program: AccountInfo<'info>,

    #[account(mut)]
    authority: Signer<'info>,

    system_program: Program<'info, System>,
}

pub fn init_core_handler(
    ctx: Context<InitCore>,
    name: String,
    slug: String,
    uri: String,
    logo: Option<String>,
    bg: Option<String>,
) -> Result<()> {
    let converter = &ctx.accounts.converter.to_account_info();
    let core_program = &ctx.accounts.core_program.to_account_info();
    let collection = &ctx.accounts.destination_collection.to_account_info();
    let authority = &ctx.accounts.authority.to_account_info();
    let system_program = &ctx.accounts.system_program.to_account_info();
    let nft_metadata = &ctx.accounts.nft_metadata;

    let basis_points = nft_metadata.seller_fee_basis_points;

    let creators = nft_metadata
        .creators
        .as_ref()
        .unwrap()
        .iter()
        .filter(|c| c.share > 0)
        .map(|c| Creator {
            address: c.address,
            percentage: c.share,
        })
        .collect();

    let mut plugins = vec![PluginAuthorityPair {
        plugin: mpl_core::types::Plugin::UpdateDelegate(UpdateDelegate {
            additional_delegates: vec![],
        }),
        authority: Some(PluginAuthority::Address {
            address: converter.key(),
        }),
    }];

    if basis_points > 0 {
        plugins.push(PluginAuthorityPair {
            plugin: mpl_core::types::Plugin::Royalties(Royalties {
                basis_points,
                creators,
                rule_set: RuleSet::None,
            }),
            authority: Some(PluginAuthority::UpdateAuthority),
        })
    }

    CreateCollectionV1CpiBuilder::new(&core_program)
        .collection(collection)
        .name(name.to_owned())
        .uri(uri)
        .payer(authority)
        .update_authority(Some(authority))
        .system_program(system_program)
        .plugins(plugins)
        .invoke()?;

    require!(regex_slug(&slug), ConvertError::InvalidSlug);

    let program_config = &mut ctx.accounts.program_config;

    let existing_slugs = &program_config.slugs;
    require!(!existing_slugs.contains(&slug), ConvertError::SlugExists);

    program_config.slugs.push(slug.clone());

    let metadata = &ctx.accounts.nft_metadata;
    let collection_identifier = &ctx.accounts.collection_identifier;

    if metadata.collection.is_some() && metadata.collection.as_ref().unwrap().verified {
        let collection = metadata.collection.as_ref().unwrap();
        require_keys_eq!(
            collection.key,
            collection_identifier.key(),
            ConvertError::InvalidCollection
        )
    }

    let converter = &mut ctx.accounts.converter;

    **converter = Converter::init(
        name,
        slug,
        logo,
        bg,
        authority.key(),
        collection_identifier.key(),
        collection.key(),
        None,
        ctx.bumps.converter,
        AssetType::Core,
        ctx.accounts.nft_metadata.update_authority.key() == authority.key(),
    );

    Ok(())
}
