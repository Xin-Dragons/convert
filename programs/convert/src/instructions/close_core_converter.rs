use anchor_lang::prelude::*;
use mpl_core::{instructions::RemoveCollectionPluginV1CpiBuilder, ID as CoreID};

use crate::{
    program::Convert,
    state::{AssetType, Converter, ProgramConfig},
    ConvertError,
};

#[derive(Accounts)]
pub struct CloseCoreConverter<'info> {
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
    #[account(address = CoreID)]
    core_program: AccountInfo<'info>,
}

pub fn close_core_converter_handler(ctx: Context<CloseCoreConverter>) -> Result<()> {
    let converter = &ctx.accounts.converter;
    let collection = &ctx.accounts.collection;
    let system_program = &ctx.accounts.system_program;
    let slugs: Vec<String> = ctx.accounts.program_config.slugs.clone();

    if !matches!(converter.asset_type, AssetType::Core) {
        return err!(ConvertError::InvalidInstruction);
    }

    let authority_seeds = [
        &b"CONVERT"[..],
        &converter.source_collection.as_ref(),
        &[converter.bump],
    ];

    let payer = &ctx.accounts.authority;

    // let collection_account = BaseCollectionV1::try_from(collection)?;

    // if collection_account.num_minted == 0 && collection_account.current_size == 0 {
    //     // this functionality is currently broken in the Core library
    //     // // if no items have been minted, burn the collection
    //     // BurnCollectionV1CpiBuilder::new(&ctx.accounts.core_program)
    //     //     .collection(collection)
    //     //     .authority(Some(&converter.to_account_info()))
    //     //     .payer(payer)
    //     //     .invoke_signed(&[&authority_seeds])?;
    // } else {
    // if items have been minted, revoke the update delegate
    RemoveCollectionPluginV1CpiBuilder::new(&ctx.accounts.core_program)
        .collection(collection)
        .authority(Some(&converter.to_account_info()))
        .payer(payer)
        .system_program(system_program)
        .plugin_type(mpl_core::types::PluginType::UpdateDelegate)
        .invoke_signed(&[&authority_seeds])?;
    // }

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
