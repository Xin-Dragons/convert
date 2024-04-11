use anchor_lang::prelude::*;
use nifty_asset::{
    extensions::{ExtensionBuilder, Grouping, GroupingBuilder},
    instructions::UpdateCpiBuilder,
    state::Asset,
    types::{ExtensionInput, ExtensionType},
    ID as NiftyID,
};

use crate::{
    program::Convert,
    state::{AssetType, Converter, ProgramConfig},
    ConvertError,
};

#[derive(Accounts)]
pub struct CloseNiftyConverter<'info> {
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

    /// CHECK: address from converter, also checked in CPI
    #[account(mut, address = converter.destination_collection)]
    collection: AccountInfo<'info>,

    system_program: Program<'info, System>,

    /// CHECK: pinned to an address
    #[account(address = NiftyID)]
    nifty_program: AccountInfo<'info>,
}

pub fn close_nifty_converter_handler(ctx: Context<CloseNiftyConverter>) -> Result<()> {
    let converter = &ctx.accounts.converter;
    let collection = &ctx.accounts.collection.to_account_info();
    let nifty_program = &ctx.accounts.nifty_program.to_account_info();
    let authority = &ctx.accounts.authority.to_account_info();

    let slugs: Vec<String> = ctx.accounts.program_config.slugs.clone();

    if !matches!(converter.asset_type, AssetType::Nifty) {
        return err!(ConvertError::InvalidInstruction);
    }

    let data = ctx.accounts.collection.data.borrow();

    let prev_grouping = Asset::get::<Grouping>(&data).unwrap();

    let mut grouping = GroupingBuilder::default();
    grouping.set(
        prev_grouping
            .max_size
            .value()
            .map(|val| u64::from_le_bytes(val.to_le_bytes())),
        None,
    );
    let grouping_data = grouping.data();

    drop(data);

    UpdateCpiBuilder::new(nifty_program)
        .asset(collection)
        .authority(authority)
        .extension(ExtensionInput {
            extension_type: ExtensionType::Grouping,
            length: grouping_data.len() as u32,
            data: Some(grouping_data),
        })
        .invoke()?;

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
