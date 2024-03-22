use anchor_lang::{prelude::*, solana_program::pubkey};

mod instructions;
mod state;

use instructions::*;

pub const METAPLEX_RULE_SET: Pubkey = pubkey!("eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9");
pub const FEES_WALLET: Pubkey = pubkey!("4dm8ndfR78PcQudJrS7TXM7R4qM3GAHpY87UtHnxovpa");

declare_id!("CNVRTNSn2fcmaVKRYRyXHFQaASXXDf1kvewfqTotve9c");

#[program]
pub mod convert {
    use self::instructions::init_handler;

    use super::*;

    pub fn init(
        ctx: Context<Init>,
        name: String,
        slug: String,
        logo: Option<String>,
        bg: Option<String>,
    ) -> Result<()> {
        init_handler(ctx, name, slug, logo, bg)
    }

    pub fn convert(ctx: Context<Convert>) -> Result<()> {
        convert_handler(ctx)
    }

    pub fn init_program_config(ctx: Context<InitProgramConfig>, convert_fee: u64) -> Result<()> {
        init_program_config_handler(ctx, convert_fee)
    }

    pub fn delete_converter(ctx: Context<DeleteConverter>) -> Result<()> {
        delete_converter_handler(ctx)
    }

    pub fn toggle_active(ctx: Context<ToggleActive>, active: bool) -> Result<()> {
        toggle_active_handler(ctx, active)
    }

    pub fn update_convert_fee(ctx: Context<UpdateConvertFee>, convert_fee: u64) -> Result<()> {
        update_convert_fee_handler(ctx, convert_fee)
    }
}

#[error_code]
pub enum ConvertError {
    #[msg("Invalid collection")]
    InvalidCollection,
    #[msg("Incorrect collection authority")]
    IncorrectCollectionAuthority,
    #[msg("Mint mismatch")]
    MintMismatch,
    #[msg("Only the UA can create a converter")]
    UnauthorisedUA,
    #[msg("Slug can only be a maximum of 50 chars")]
    SlugTooLong,
    #[msg("Slug is required")]
    SlugRequired,
    #[msg("Project name can only be a maximum of 50 chars")]
    NameTooLong,
    #[msg("Project name is required")]
    NameRequired,
    #[msg("Slug can only contain valid URL slug chars")]
    InvalidSlug,
    #[msg("Slug already exists")]
    SlugExists,
    #[msg("Logo URI max length 63")]
    LogoTooLong,
    #[msg("Bg URI max length 63")]
    BgTooLong,
    #[msg("This is an admin only action")]
    AdminOnly,
    #[msg("Invalid ruleSet, either pass in a valid ruleset or omit for Metaplex default ruleset")]
    InvalidRuleSet,
    #[msg("This converter is currently inactive")]
    ConverterInactive,
}
