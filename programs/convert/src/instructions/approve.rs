use anchor_lang::prelude::*;

use crate::{program::Convert, state::Converter, ConvertError};

#[derive(Accounts)]
pub struct Approve<'info> {
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

pub fn approve_handler(ctx: Context<Approve>) -> Result<()> {
    let converter = &mut ctx.accounts.converter;

    converter.source_collection = ctx.accounts.collection_identifier.key();
    Ok(())
}
