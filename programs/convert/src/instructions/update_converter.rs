use anchor_lang::prelude::*;
use mpl_candy_machine_core::constants::MPL_TOKEN_AUTH_RULES_PROGRAM;

use crate::{state::Converter, ConvertError};

#[derive(Accounts)]
pub struct UpdateConverter<'info> {
    #[account(
        mut,
        seeds = [
            b"CONVERT",
            converter.source_collection.as_ref(),
        ],
        bump = converter.bump,
        has_one = authority
    )]
    pub converter: Account<'info, Converter>,

    #[account(
        owner = MPL_TOKEN_AUTH_RULES_PROGRAM
    )]
    pub rule_set: Option<UncheckedAccount<'info>>,

    pub authority: Signer<'info>,
}

pub fn update_converter_hander(
    ctx: Context<UpdateConverter>,
    name: Option<String>,
    logo: Option<String>,
    bg: Option<String>,
) -> Result<()> {
    let converter = &mut ctx.accounts.converter;

    if logo.is_some() {
        require_gte!(52, logo.as_ref().unwrap().len(), ConvertError::LogoTooLong);
        converter.logo = logo;
    }

    if bg.is_some() {
        require_gte!(52, bg.as_ref().unwrap().len(), ConvertError::BgTooLong);
        converter.bg = bg;
    }

    if name.is_some() {
        let name = name.unwrap();
        require_gt!(name.len(), 0, ConvertError::NameRequired);
        require_gte!(50, name.len(), ConvertError::NameTooLong);
        converter.name = name
    }

    converter.rule_set = ctx
        .accounts
        .rule_set
        .as_ref()
        .map(|rule_set| rule_set.key());

    Ok(())
}
