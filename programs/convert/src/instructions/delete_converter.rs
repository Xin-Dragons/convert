use anchor_lang::prelude::*;

use crate::{
    program::Convert,
    state::{Converter, ProgramConfig},
    ConvertError,
};

#[derive(Accounts)]
pub struct DeleteConverter<'info> {
    #[account(
        mut,
        seeds = [
            b"program-config"
        ],
        bump,
        realloc = program_config.current_len() - 50 - 4,
        realloc::payer = authority,
        realloc::zero = false,
    )]
    pub program_config: Account<'info, ProgramConfig>,

    #[account(
        mut,
        close = authority
    )]
    pub converter: Account<'info, Converter>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        constraint = program.programdata_address()? == Some(program_data.key()) @ ConvertError::AdminOnly
    )]
    pub program: Program<'info, Convert>,

    #[account(
        constraint = program_data.upgrade_authority_address == Some(authority.key()) @ ConvertError::AdminOnly
    )]
    pub program_data: Account<'info, ProgramData>,

    pub system_program: Program<'info, System>,
}

pub fn delete_converter_handler(ctx: Context<DeleteConverter>) -> Result<()> {
    let converter = &ctx.accounts.converter;
    let slugs: Vec<String> = ctx.accounts.program_config.slugs.clone();

    let program_config = &mut ctx.accounts.program_config;

    program_config.slugs = slugs
        .into_iter()
        .filter(|slug| slug != &converter.slug)
        .collect();

    Ok(())
}
