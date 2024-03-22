use anchor_lang::prelude::*;

use crate::state::Converter;

#[derive(Accounts)]
pub struct ToggleActive<'info> {
    #[account(
        mut,
        seeds = [
            b"CONVERT",
            converter.source_collection.as_ref()
        ],
        bump = converter.bump,
        has_one = authority
    )]
    converter: Account<'info, Converter>,

    authority: Signer<'info>,
}

pub fn toggle_active_handler(ctx: Context<ToggleActive>, active: bool) -> Result<()> {
    let converter = &mut ctx.accounts.converter;

    converter.active = active;
    Ok(())
}
