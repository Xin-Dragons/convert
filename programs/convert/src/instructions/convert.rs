use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        mpl_token_metadata::{
            accounts::Metadata as MetadataAccountStruct,
            instructions::{
                BurnV1CpiBuilder, CreateV1CpiBuilder, MintV1CpiBuilder, UpdateV1CpiBuilder,
                VerifyCollectionV1CpiBuilder,
            },
            types::{Collection, Creator, PrintSupply, RuleSetToggle, TokenStandard},
        },
        MasterEditionAccount, Metadata, MetadataAccount,
    },
    token::{Mint, Token, TokenAccount},
};

use crate::{
    state::{Converter, ProgramConfig},
    ConvertError, FEES_WALLET, METAPLEX_RULE_SET,
};

#[derive(Accounts)]
pub struct Convert<'info> {
    #[account(
        seeds = [b"program-config"],
        bump = program_config.bump
    )]
    program_config: Account<'info, ProgramConfig>,

    #[account(
        seeds = [
            b"CONVERT",
            converter.source_collection.as_ref(),
        ],
        bump = converter.bump,
        constraint = converter.active @ ConvertError::ConverterInactive,
    )]
    converter: Account<'info, Converter>,

    #[account(mut, address = FEES_WALLET)]
    fees_wallet: SystemAccount<'info>,

    #[account(mut)]
    nft_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [
            b"metadata",
            Metadata::id().as_ref(),
            nft_mint.key().as_ref()
        ],
        seeds::program = Metadata::id(),
        bump,
    )]
    nft_metadata: Box<Account<'info, MetadataAccount>>,

    #[account(mut)]
    master_edition: Box<Account<'info, MasterEditionAccount>>,

    #[account(
        mut,
        seeds = [
            b"metadata",
            Metadata::id().as_ref(),
            converter.source_collection.key().as_ref()
        ],
        seeds::program = Metadata::id(),
        bump,
    )]
    collection_metadata: Option<Box<Account<'info, MetadataAccount>>>,

    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = payer
    )]
    nft_source: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    new_mint: Signer<'info>,

    /// CHECK: account checked in CPI
    #[account(mut)]
    new_token: UncheckedAccount<'info>,

    /// CHECK: account created in CPI
    #[account(mut)]
    token_record: UncheckedAccount<'info>,

    /// CHECK: account created in CPI
    #[account(mut)]
    new_metadata: UncheckedAccount<'info>,

    /// CHECK: account created in CPI
    #[account(mut)]
    new_master_edition: UncheckedAccount<'info>,

    #[account(mut)]
    payer: Signer<'info>,

    /// CHECK: checked in CPI
    new_collection_mint: UncheckedAccount<'info>,

    /// CHECK: checked in cpi
    #[account(mut)]
    new_collection_metadata: UncheckedAccount<'info>,

    /// CHECK: checked in cpi
    collection_delegate_record: UncheckedAccount<'info>,

    /// CHECK: checked in cpi
    new_collection_master_edition: UncheckedAccount<'info>,

    metadata_program: Program<'info, Metadata>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,
    /// CHECK: checked in CPI
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    sysvar_instructions: UncheckedAccount<'info>,
}

impl<'info> Convert<'info> {
    fn burn_nft(&self) -> Result<()> {
        let metadata_program = &self.metadata_program.to_account_info();
        let metadata = &self.nft_metadata.as_ref().to_account_info();
        let mint = &self.nft_mint.to_account_info();
        let token = &self.nft_source.to_account_info();
        let token_owner = &self.payer.to_account_info();
        let master_edition = &self.master_edition.to_account_info();
        let nft_collection_metadata = &self
            .collection_metadata
            .as_ref()
            .map(|coll| coll.to_owned().to_account_info());
        let system_program = &self.system_program.to_account_info();
        let sysvar_instructions = &self.sysvar_instructions.to_account_info();
        let spl_token_program = &self.token_program.to_account_info();

        let mut cpi_burn = BurnV1CpiBuilder::new(&metadata_program);

        cpi_burn
            .authority(token_owner)
            .collection_metadata(nft_collection_metadata.as_ref())
            .edition(Some(master_edition))
            .metadata(metadata)
            .mint(mint)
            .token(token)
            .system_program(system_program)
            .sysvar_instructions(sysvar_instructions)
            .spl_token_program(spl_token_program)
            .amount(1);

        cpi_burn.invoke()?;

        Ok(())
    }

    pub fn mint_pnft(&self) -> Result<()> {
        let converter_acc = &self.converter;
        let converter = &converter_acc.to_account_info();
        let nft_metadata = &self.nft_metadata;
        let new_metadata = &self.new_metadata.to_account_info();
        let new_mint = &self.new_mint.to_account_info();
        let authority = &self.payer.to_account_info();
        let metadata_program = &self.metadata_program.to_account_info();
        let token_program = &self.token_program.to_account_info();
        let system_program = &self.system_program.to_account_info();
        let sysvar_instructions = &self.sysvar_instructions.to_account_info();
        let new_token = &self.new_token.to_account_info();
        let token_record = &self.token_record.to_account_info();
        let new_master_edition = &self.new_master_edition.to_account_info();
        let associated_token_program = &self.associated_token_program.to_account_info();

        let collection_delegate_record = &self.collection_delegate_record.to_account_info();
        let new_collection_mint = &self.new_collection_mint.to_account_info();
        let new_collection_metadata = &self.new_collection_metadata.to_account_info();
        let new_collection_master_edition = &self.new_collection_master_edition.to_account_info();

        let uri = &nft_metadata.uri;
        let symbol = &nft_metadata.symbol;
        let name = &nft_metadata.name;

        let authority_seeds = [
            &b"CONVERT"[..],
            &self.converter.source_collection.as_ref(),
            &[self.converter.bump],
        ];

        let collection_metadata: MetadataAccountStruct =
            MetadataAccountStruct::try_from(new_collection_metadata)?;

        let original_creators_without_fvc = nft_metadata
            .creators
            .as_ref()
            .unwrap()
            .iter()
            .filter(|creator| !(creator.verified && creator.share == 0));

        // add a new FVC to identify the collection
        let mut creators: Vec<Creator> = vec![Creator {
            address: converter.key(),
            share: 0,
            verified: true,
        }];

        for c in original_creators_without_fvc {
            creators.push(Creator {
                address: c.address,
                share: c.share,
                verified: false,
            });
        }

        CreateV1CpiBuilder::new(&metadata_program)
            .authority(converter)
            .collection(Collection {
                verified: false,
                key: new_collection_mint.key(),
            })
            .print_supply(PrintSupply::Zero)
            .creators(creators)
            .is_mutable(true)
            .metadata(new_metadata)
            .master_edition(Some(new_master_edition))
            .mint(new_mint, new_mint.is_signer)
            .name(name.to_owned())
            .payer(authority)
            .primary_sale_happened(true)
            .seller_fee_basis_points(nft_metadata.seller_fee_basis_points)
            .spl_token_program(token_program)
            .symbol(symbol.to_owned())
            .system_program(system_program)
            .sysvar_instructions(sysvar_instructions)
            .token_standard(TokenStandard::ProgrammableNonFungible)
            .update_authority(converter, true)
            .uri(uri.to_owned())
            .invoke_signed(&[&authority_seeds])?;

        MintV1CpiBuilder::new(metadata_program)
            .token(new_token)
            .token_owner(Some(authority))
            .metadata(&new_metadata)
            .master_edition(Some(new_master_edition))
            .mint(new_mint)
            .payer(authority)
            .authority(converter)
            .token_record(Some(token_record))
            .system_program(system_program)
            .sysvar_instructions(sysvar_instructions)
            .spl_token_program(token_program)
            .spl_ata_program(associated_token_program)
            .amount(1)
            .invoke_signed(&[&authority_seeds])?;

        UpdateV1CpiBuilder::new(metadata_program)
            .authority(converter)
            .token(Some(new_token))
            .metadata(new_metadata)
            .edition(Some(new_master_edition))
            .mint(new_mint)
            .payer(authority)
            .system_program(system_program)
            .sysvar_instructions(sysvar_instructions)
            .primary_sale_happened(true)
            .new_update_authority(collection_metadata.update_authority)
            .rule_set(RuleSetToggle::Set(
                converter_acc.rule_set.unwrap_or(METAPLEX_RULE_SET),
            ))
            .invoke_signed(&[&authority_seeds])?;

        VerifyCollectionV1CpiBuilder::new(&metadata_program)
            .authority(converter)
            .delegate_record(Some(collection_delegate_record))
            .metadata(new_metadata)
            .collection_mint(new_collection_mint)
            .collection_metadata(Some(new_collection_metadata))
            .collection_master_edition(Some(new_collection_master_edition))
            .system_program(system_program)
            .sysvar_instructions(sysvar_instructions)
            .invoke_signed(&[&authority_seeds])?;

        Ok(())
    }
}

pub fn convert_handler(ctx: Context<Convert>) -> Result<()> {
    let converter = &ctx.accounts.converter;
    let program_config = &ctx.accounts.program_config;
    let fees_wallet = &ctx.accounts.fees_wallet;
    let nft_metadata = &ctx.accounts.nft_metadata;

    if nft_metadata.collection.is_some() && nft_metadata.collection.as_ref().unwrap().verified {
        let collection = nft_metadata.collection.as_ref().unwrap();
        require_keys_eq!(
            collection.key,
            converter.source_collection,
            ConvertError::InvalidCollection
        )
    } else {
        let fvc = nft_metadata
            .creators
            .as_ref()
            .expect("No creators, and no collection, cannot set up converter")
            .iter()
            .find(|creator| creator.verified)
            .expect("no verified creator")
            .address;

        require_keys_eq!(
            fvc,
            converter.source_collection,
            ConvertError::InvalidCollection
        );
    }

    ctx.accounts.burn_nft()?;
    ctx.accounts.mint_pnft()?;

    if program_config.convert_fee > 0 {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.payer.key(),
            &fees_wallet.key(),
            program_config.convert_fee,
        );

        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.payer.to_account_info(),
                fees_wallet.to_account_info(),
            ],
        )?;
    }
    Ok(())
}
