use anchor_lang::prelude::*;

use crate::{program::Convert, state::Converter, ConvertError};

#[derive(Accounts)]
pub struct ToggleApproved<'info> {
    #[account(
        mut,
        seeds = [
            b"CONVERT",
            collection_identifier.key().as_ref()
        ],
        bump = converter.bump
    )]
    converter: Account<'info, Converter>,

    /// CHECK: only system admin can assign this
    collection_identifier: UncheckedAccount<'info>,

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

pub fn toggle_approved_handler(ctx: Context<ToggleApproved>, approved: bool) -> Result<()> {
    let converter = &mut ctx.accounts.converter;

    converter.approved = approved;
    Ok(())
}
