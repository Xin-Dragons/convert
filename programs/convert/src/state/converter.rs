use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum AssetType {
    Pnft,
    Core,
    Nifty,
}

#[account]
pub struct Converter {
    /// authority wallet (32)
    pub authority: Pubkey,
    /// slug, max 50 chars (4 + 50)
    pub slug: String,
    /// name of the project, max 50 chars (4 + 50)
    pub name: String,
    /// metaplex collection (32)
    pub source_collection: Pubkey,
    /// new collection (32)
    pub destination_collection: Pubkey,
    /// optional ruleset, defaults to metaplex (1 + 32)
    pub rule_set: Option<Pubkey>,
    /// is the converter active (1)
    pub active: bool,
    /// optional logo (1 + 4 + 52)
    pub logo: Option<String>,
    /// optional bg (1 + 4 + 52)
    pub bg: Option<String>,
    /// optional custom domain, max 50 chars (1 + 4 + 50),
    pub custom_domain: Option<String>,
    /// the bump of the converter (1)
    pub bump: u8,
    /// the asset type of the output (1)
    pub asset_type: AssetType,
    /// is this converter approved for use (1)
    pub approved: bool,
    /// is this converter free to use for holders (1)
    pub free: bool,
}

impl Converter {
    pub const LEN: usize = 8
        + 32
        + (4 + 50)
        + (4 + 50)
        + 32
        + 32
        + (1 + 32)
        + 1
        + (1 + 4 + 52)
        + (1 + 4 + 52)
        + (1 + 4 + 50)
        + 1
        + 1
        + 1
        + 1;

    pub fn init(
        name: String,
        slug: String,
        logo: Option<String>,
        bg: Option<String>,
        authority: Pubkey,
        source_collection: Pubkey,
        destination_collection: Pubkey,
        rule_set: Option<Pubkey>,
        bump: u8,
        asset_type: AssetType,
        approved: bool,
    ) -> Self {
        Self {
            name,
            slug,
            logo,
            bg,
            authority,
            custom_domain: None,
            source_collection,
            destination_collection,
            active: false,
            rule_set,
            bump,
            asset_type,
            approved,
            free: false,
        }
    }
}
