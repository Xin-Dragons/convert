use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        mpl_token_metadata::instructions::BurnV1CpiBuilder, MasterEditionAccount, Metadata,
        MetadataAccount, TokenRecordAccount,
    },
    token::{Mint, Token, TokenAccount},
};

use nifty_asset::{
    extensions::{ExtensionBuilder, MetadataBuilder},
    instructions::CreateCpiBuilder,
    types::{ExtensionInput, ExtensionType},
    ID as NiftyID,
};

use crate::{
    state::{AssetType, Converter},
    ConvertError, FEES_WALLET, NIFTY_CONVERT_FEE, TOKEN_RECORD_RENT,
};

#[derive(Accounts)]
pub struct ConvertNifty<'info> {
    #[account(
        mut,
        seeds = [
            b"CONVERT",
            converter.source_collection.as_ref(),
        ],
        bump = converter.bump,
        constraint = converter.authority == update_authority.key(),
        constraint = converter.active @ ConvertError::ConverterInactive,
        constraint = converter.approved @ ConvertError::ConverterNotApproved
    )]
    converter: Account<'info, Converter>,

    /// CHECK: constrained to single address
    #[account(address = converter.authority)]
    update_authority: AccountInfo<'info>,

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

    #[account(mut)]
    token_record: Option<Box<Account<'info, TokenRecordAccount>>>,

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

    #[account(mut)]
    payer: Signer<'info>,

    /// CHECK: checked in CPI
    #[account(mut, address = converter.destination_collection)]
    new_collection_mint: UncheckedAccount<'info>,

    metadata_program: Program<'info, Metadata>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    associated_token_program: Program<'info, AssociatedToken>,

    /// CHECK constrained to single programId
    #[account(address = NiftyID)]
    nifty_program: AccountInfo<'info>,
    /// CHECK: checked in CPI
    #[account(address = anchor_lang::solana_program::sysvar::instructions::ID)]
    sysvar_instructions: UncheckedAccount<'info>,
}

impl<'info> ConvertNifty<'info> {
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
        let token_record = &self.token_record.as_ref().map(|acc| acc.to_account_info());

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
            .token_record(token_record.as_ref())
            .amount(1);

        cpi_burn.invoke()?;

        Ok(())
    }

    pub fn mint_nifty_nft(&self) -> Result<()> {
        let converter = &self.converter.to_account_info();
        let nft_metadata = &self.nft_metadata;
        let asset = &self.new_mint.to_account_info();
        let collection = &self.new_collection_mint.to_account_info();
        let payer = &self.payer.to_account_info();
        let system_program = &self.system_program.to_account_info();
        let nifty_program = &self.nifty_program.to_account_info();
        let update_authority = &self.update_authority.to_account_info();

        let authority_seeds = [
            &b"CONVERT"[..],
            &self.converter.source_collection.as_ref(),
            &[self.converter.bump],
        ];

        let name = &nft_metadata.name;
        let uri = &nft_metadata.uri;

        let mut metadata = MetadataBuilder::default();
        metadata.set(Some(&nft_metadata.symbol), None, Some(&uri));
        let metadata_data = metadata.data();

        CreateCpiBuilder::new(nifty_program)
            .name(name.to_owned())
            .extensions(vec![ExtensionInput {
                extension_type: ExtensionType::Metadata,
                length: metadata_data.len() as u32,
                data: Some(metadata_data),
            }])
            .asset(asset)
            .group(Some(collection))
            .authority(update_authority, false)
            .group_authority(Some(converter))
            .payer(Some(payer))
            .owner(payer)
            .system_program(Some(system_program))
            .invoke_signed(&[&authority_seeds])?;

        Ok(())
    }
}

pub fn convert_nifty_handler(ctx: Context<ConvertNifty>) -> Result<()> {
    let converter = &ctx.accounts.converter;
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

    if !matches!(converter.asset_type, AssetType::Nifty) {
        return err!(ConvertError::InvalidInstruction);
    }

    ctx.accounts.burn_nft()?;
    ctx.accounts.mint_nifty_nft()?;

    if !converter.free {
        let mut fee = NIFTY_CONVERT_FEE;

        if ctx.accounts.token_record.is_some() {
            fee = fee
                .checked_add(TOKEN_RECORD_RENT)
                .ok_or(ConvertError::ProgramAddError)?;
        }

        if fee > 0 {
            let ix = anchor_lang::solana_program::system_instruction::transfer(
                &ctx.accounts.payer.key(),
                &fees_wallet.key(),
                fee,
            );

            anchor_lang::solana_program::program::invoke(
                &ix,
                &[
                    ctx.accounts.payer.to_account_info(),
                    fees_wallet.to_account_info(),
                ],
            )?;
        }
    }

    Ok(())
}
