use anchor_lang::prelude::*;

#[account]
pub struct ProgramConfig {
    /// the amount in sol to convert (8)
    pub convert_fee: u64,
    /// a vector storing all slugs (4)
    pub slugs: Vec<String>,
    /// the bump of the program_config account (1)
    pub bump: u8,
}

impl ProgramConfig {
    pub const LEN: usize = 8 + 8 + 4 + 1;

    pub fn current_len(&self) -> usize {
        ProgramConfig::LEN + (4 + 50) * self.slugs.len()
    }

    pub fn init(convert_fee: u64, bump: u8) -> Self {
        Self {
            convert_fee,
            slugs: vec![],
            bump,
        }
    }
}
