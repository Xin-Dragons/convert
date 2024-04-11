use anchor_lang::prelude::*;

use crate::{program::Convert, state::Converter, ConvertError};

#[derive(Accounts)]
pub struct ToggleFreeMode<'info> {
    #[account(mut, seeds = [b"CONVERT", converter.source_collection.as_ref()], bump = converter.bump)]
    converter: Account<'info, Converter>,

    #[account(
        constraint = program.programdata_address()? == Some(program_data.key()) @ ConvertError::AdminOnly
    )]
    program: Program<'info, Convert>,

    #[account(
        constraint = program_data.upgrade_authority_address == Some(authority.key()) @ ConvertError::AdminOnly
    )]
    program_data: Account<'info, ProgramData>,

    #[account(mut)]
    authority: Signer<'info>,
}

pub fn toggle_free_mode_handler(ctx: Context<ToggleFreeMode>, is_free: bool) -> Result<()> {
    let converter = &mut ctx.accounts.converter;
    converter.free = is_free;
    Ok(())
}
