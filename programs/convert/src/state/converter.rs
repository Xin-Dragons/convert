use anchor_lang::prelude::*;

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
}

impl Converter {
    pub const LEN: usize =
        8 + 32 + (4 + 50) + (4 + 50) + 32 + 32 + 1 + (1 + 4 + 52) + (1 + 4 + 52) + (1 + 4 + 50) + 1;

    pub fn init(
        name: String,
        slug: String,
        logo: Option<String>,
        bg: Option<String>,
        authority: Pubkey,
        source_collection: Pubkey,
        destination_collection: Pubkey,
        bump: u8,
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
            bump,
        }
    }
}
