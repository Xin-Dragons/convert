use anchor_lang::{prelude::*, solana_program::pubkey};

mod instructions;
mod state;

use instructions::*;

pub const METAPLEX_RULE_SET: Pubkey = pubkey!("eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9");
pub const FEES_WALLET: Pubkey = pubkey!("4dm8ndfR78PcQudJrS7TXM7R4qM3GAHpY87UtHnxovpa");
pub const CORE_CONVERT_FEE: u64 = 5982000;
pub const NIFTY_CONVERT_FEE: u64 = 6834720;
pub const TOKEN_RECORD_RENT: u64 = 1447680;

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

    pub fn init_core(
        ctx: Context<InitCore>,
        name: String,
        slug: String,
        uri: String,
        logo: Option<String>,
        bg: Option<String>,
    ) -> Result<()> {
        init_core_handler(ctx, name, slug, uri, logo, bg)
    }

    pub fn init_nifty(
        ctx: Context<InitNifty>,
        name: String,
        description: String,
        slug: String,
        uri: String,
        logo: Option<String>,
        bg: Option<String>,
        max_size: Option<u64>,
    ) -> Result<()> {
        init_nifty_handler(ctx, name, description, slug, uri, logo, bg, max_size)
    }

    pub fn convert(ctx: Context<Convert>) -> Result<()> {
        convert_handler(ctx)
    }

    pub fn convert_core(ctx: Context<ConvertCore>) -> Result<()> {
        convert_core_handler(ctx)
    }

    pub fn convert_nifty(ctx: Context<ConvertNifty>) -> Result<()> {
        convert_nifty_handler(ctx)
    }

    pub fn close_core_converter(ctx: Context<CloseCoreConverter>) -> Result<()> {
        close_core_converter_handler(ctx)
    }

    pub fn close_nifty_converter(ctx: Context<CloseNiftyConverter>) -> Result<()> {
        close_nifty_converter_handler(ctx)
    }

    pub fn init_program_config(ctx: Context<InitProgramConfig>, convert_fee: u64) -> Result<()> {
        init_program_config_handler(ctx, convert_fee)
    }

    pub fn toggle_free_mode(ctx: Context<ToggleFreeMode>, is_free: bool) -> Result<()> {
        toggle_free_mode_handler(ctx, is_free)
    }

    pub fn close_converter(ctx: Context<CloseConverter>) -> Result<()> {
        close_converter_handler(ctx)
    }

    pub fn toggle_active(ctx: Context<ToggleActive>, active: bool) -> Result<()> {
        toggle_active_handler(ctx, active)
    }

    pub fn update_convert_fee(ctx: Context<UpdateConvertFee>, convert_fee: u64) -> Result<()> {
        update_convert_fee_handler(ctx, convert_fee)
    }

    pub fn update_converter(
        ctx: Context<UpdateConverter>,
        name: Option<String>,
        logo: Option<String>,
        bg: Option<String>,
    ) -> Result<()> {
        update_converter_hander(ctx, name, logo, bg)
    }

    pub fn toggle_approved(ctx: Context<ToggleApproved>, approved: bool) -> Result<()> {
        toggle_approved_handler(ctx, approved)
    }
}

#[error_code]
pub enum ConvertError {
    #[msg("Unable to subtract the given numbers")]
    ProgramSubError,
    #[msg("Collection mint must be either a MCC or FVC")]
    InvalidCollectionMint,
    #[msg("Invalid collection")]
    InvalidCollection,
    #[msg("Incorrect collection authority")]
    IncorrectCollectionAuthority,
    #[msg("Mint mismatch")]
    MintMismatch,
    #[msg("Only the UA or the system admin can create a converter")]
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
    #[msg("The collection metadata account is required for pNFT comnversions")]
    CollectionMetadataRequired,
    #[msg("The collection delegate record account is required for pNFT comnversions")]
    CollectionDelegateRecordRequired,
    #[msg("Incorrect account owner for this account")]
    IncorrectAccountOwner,
    #[msg("This asset type is not yet supported")]
    UnsupportedAssetType,
    #[msg("Delegate record not expected for this asset type")]
    UnexpectedDelegateRecord,
    #[msg("Collection metadata not expected for this asset type")]
    UnexpectedCollectionMetadata,
    #[msg("This converter has not yet been approved")]
    ConverterNotApproved,
    #[msg("This instruction cannot be used with this converter")]
    InvalidInstruction,
    #[msg("Could not add the given numbers")]
    ProgramAddError,
}
