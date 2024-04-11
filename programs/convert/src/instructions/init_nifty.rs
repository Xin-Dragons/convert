use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{Metadata, MetadataAccount},
    token::Mint,
};
use nifty_asset::{
    constraints::EmptyBuilder,
    extensions::{
        Creator, CreatorsBuilder, ExtensionBuilder, GroupingBuilder, MetadataBuilder,
        RoyaltiesBuilder,
    },
    instructions::CreateCpiBuilder,
    types::{ExtensionInput, ExtensionType, Standard},
    ID as NiftyID,
};
use proc_macro_regex::regex;

use crate::{
    state::{AssetType, Converter, ProgramConfig},
    ConvertError,
};

regex!(regex_slug "^(?:[_a-z0-9]+)*$");

#[derive(Accounts)]
pub struct InitNifty<'info> {
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
    #[account(address = NiftyID)]
    nifty_program: AccountInfo<'info>,

    #[account(mut)]
    authority: Signer<'info>,

    system_program: Program<'info, System>,
}

pub fn init_nifty_handler(
    ctx: Context<InitNifty>,
    name: String,
    description: String,
    slug: String,
    uri: String,
    logo: Option<String>,
    bg: Option<String>,
    max_size: Option<u64>,
) -> Result<()> {
    let converter = &ctx.accounts.converter;
    let nifty_program = &ctx.accounts.nifty_program.to_account_info();
    let collection = &ctx.accounts.destination_collection.to_account_info();
    let authority = &ctx.accounts.authority.to_account_info();
    let system_program = &ctx.accounts.system_program.to_account_info();
    let nft_metadata = &ctx.accounts.nft_metadata;

    let basis_points = nft_metadata.seller_fee_basis_points;

    let prev_creators: Vec<Creator> = nft_metadata
        .creators
        .as_ref()
        .unwrap()
        .iter()
        .filter(|c| c.share > 0)
        .map(|c| Creator {
            address: c.address,
            share: c.share,
            verified: false.into(),
        })
        .collect();

    // set the converter as the group authority, to allow minting assets into collection
    let mut grouping = GroupingBuilder::default();
    grouping.set(max_size, Some(&converter.key()));
    let grouping_data = grouping.data();

    let mut metadata = MetadataBuilder::default();
    metadata.set(Some(&nft_metadata.symbol), Some(&description), Some(&uri));
    let metadata_data = metadata.data();

    let mut royalties = RoyaltiesBuilder::default();
    royalties.set(basis_points as u64, &mut EmptyBuilder::default());
    let royalties_data = royalties.data();

    let mut creators = CreatorsBuilder::default();
    for creator in prev_creators {
        creators.add(&creator.address, creator.verified.into(), creator.share);
    }
    let creators_data = creators.data();

    CreateCpiBuilder::new(nifty_program)
        .asset(collection)
        .name(name.to_owned())
        .mutable(true)
        .standard(Standard::NonFungible)
        .extensions(vec![
            ExtensionInput {
                extension_type: ExtensionType::Grouping,
                length: grouping_data.len() as u32,
                data: Some(grouping_data),
            },
            ExtensionInput {
                extension_type: ExtensionType::Metadata,
                length: metadata_data.len() as u32,
                data: Some(metadata_data),
            },
            ExtensionInput {
                extension_type: ExtensionType::Royalties,
                length: royalties_data.len() as u32,
                data: Some(royalties_data),
            },
            ExtensionInput {
                extension_type: ExtensionType::Creators,
                length: creators_data.len() as u32,
                data: Some(creators_data),
            },
        ])
        .owner(authority)
        .payer(Some(authority))
        .authority(authority, true)
        .system_program(Some(system_program))
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
        AssetType::Nifty,
        ctx.accounts.nft_metadata.update_authority.key() == authority.key(),
    );

    Ok(())
}
