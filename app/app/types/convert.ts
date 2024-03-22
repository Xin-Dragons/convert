export type Convert = {
  "version": "0.1.0",
  "name": "convert",
  "instructions": [
    {
      "name": "init",
      "accounts": [
        {
          "name": "programConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceCollectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sourceCollectionMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationCollectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationCollectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionDelegateRecord",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Metadata delegate record. The delegate is used to verify NFTs.",
            ""
          ]
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ruleSet",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "sysvarInstructions",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Instructions sysvar account.",
            ""
          ]
        },
        {
          "name": "authorizationRulesProgram",
          "isMut": false,
          "isSigner": false,
          "isOptional": true,
          "docs": [
            "Token Authorization Rules program.",
            ""
          ]
        },
        {
          "name": "authorizationRules",
          "isMut": false,
          "isSigner": false,
          "isOptional": true,
          "docs": [
            "Token Authorization rules account for the collection metadata (if any).",
            ""
          ]
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "slug",
          "type": "string"
        },
        {
          "name": "logo",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "bg",
          "type": {
            "option": "string"
          }
        }
      ]
    },
    {
      "name": "convert",
      "accounts": [
        {
          "name": "programConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "converter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feesWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftSource",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newMint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newMasterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newCollectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "newCollectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionDelegateRecord",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "newCollectionMasterEdition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sysvarInstructions",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initProgramConfig",
      "accounts": [
        {
          "name": "programConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programData",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "convertFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "deleteConverter",
      "accounts": [
        {
          "name": "programConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programData",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "toggleActive",
      "accounts": [
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "active",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "converter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "authority wallet (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "slug",
            "docs": [
              "slug, max 50 chars (4 + 50)"
            ],
            "type": "string"
          },
          {
            "name": "name",
            "docs": [
              "name of the project, max 50 chars (4 + 50)"
            ],
            "type": "string"
          },
          {
            "name": "sourceCollection",
            "docs": [
              "metaplex collection (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "destinationCollection",
            "docs": [
              "new collection (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "ruleSet",
            "docs": [
              "optional ruleset, defaults to metaplex (1 + 32)"
            ],
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "active",
            "docs": [
              "is the converter active (1)"
            ],
            "type": "bool"
          },
          {
            "name": "logo",
            "docs": [
              "optional logo (1 + 4 + 52)"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "bg",
            "docs": [
              "optional bg (1 + 4 + 52)"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "customDomain",
            "docs": [
              "optional custom domain, max 50 chars (1 + 4 + 50),"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "bump",
            "docs": [
              "the bump of the converter (1)"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "programConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "convertFee",
            "docs": [
              "the amount in sol to convert (8)"
            ],
            "type": "u64"
          },
          {
            "name": "slugs",
            "docs": [
              "a vector storing all slugs (4)"
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "bump",
            "docs": [
              "the bump of the program_config account (1)"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidCollection",
      "msg": "Invalid collection"
    },
    {
      "code": 6001,
      "name": "IncorrectCollectionAuthority",
      "msg": "Incorrect collection authority"
    },
    {
      "code": 6002,
      "name": "MintMismatch",
      "msg": "Mint mismatch"
    },
    {
      "code": 6003,
      "name": "UnauthorisedUA",
      "msg": "Only the UA can create a converter"
    },
    {
      "code": 6004,
      "name": "SlugTooLong",
      "msg": "Slug can only be a maximum of 50 chars"
    },
    {
      "code": 6005,
      "name": "SlugRequired",
      "msg": "Slug is required"
    },
    {
      "code": 6006,
      "name": "NameTooLong",
      "msg": "Project name can only be a maximum of 50 chars"
    },
    {
      "code": 6007,
      "name": "NameRequired",
      "msg": "Project name is required"
    },
    {
      "code": 6008,
      "name": "InvalidSlug",
      "msg": "Slug can only contain valid URL slug chars"
    },
    {
      "code": 6009,
      "name": "SlugExists",
      "msg": "Slug already exists"
    },
    {
      "code": 6010,
      "name": "LogoTooLong",
      "msg": "Logo URI max length 63"
    },
    {
      "code": 6011,
      "name": "BgTooLong",
      "msg": "Bg URI max length 63"
    },
    {
      "code": 6012,
      "name": "AdminOnly",
      "msg": "This is an admin only action"
    },
    {
      "code": 6013,
      "name": "InvalidRuleSet",
      "msg": "Invalid ruleSet, either pass in a valid ruleset or omit for Metaplex default ruleset"
    },
    {
      "code": 6014,
      "name": "ConverterInactive",
      "msg": "This converter is currently inactive"
    }
  ]
};

export const IDL: Convert = {
  "version": "0.1.0",
  "name": "convert",
  "instructions": [
    {
      "name": "init",
      "accounts": [
        {
          "name": "programConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "sourceCollectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sourceCollectionMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationCollectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationCollectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionDelegateRecord",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Metadata delegate record. The delegate is used to verify NFTs.",
            ""
          ]
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ruleSet",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "sysvarInstructions",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Instructions sysvar account.",
            ""
          ]
        },
        {
          "name": "authorizationRulesProgram",
          "isMut": false,
          "isSigner": false,
          "isOptional": true,
          "docs": [
            "Token Authorization Rules program.",
            ""
          ]
        },
        {
          "name": "authorizationRules",
          "isMut": false,
          "isSigner": false,
          "isOptional": true,
          "docs": [
            "Token Authorization rules account for the collection metadata (if any).",
            ""
          ]
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "slug",
          "type": "string"
        },
        {
          "name": "logo",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "bg",
          "type": {
            "option": "string"
          }
        }
      ]
    },
    {
      "name": "convert",
      "accounts": [
        {
          "name": "programConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "converter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feesWallet",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "updateAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nftSource",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newMint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newToken",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "newMasterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newCollectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "newCollectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionDelegateRecord",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "newCollectionMasterEdition",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadataProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "sysvarInstructions",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initProgramConfig",
      "accounts": [
        {
          "name": "programConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programData",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "convertFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "deleteConverter",
      "accounts": [
        {
          "name": "programConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "programData",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "toggleActive",
      "accounts": [
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "active",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "converter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "authority wallet (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "slug",
            "docs": [
              "slug, max 50 chars (4 + 50)"
            ],
            "type": "string"
          },
          {
            "name": "name",
            "docs": [
              "name of the project, max 50 chars (4 + 50)"
            ],
            "type": "string"
          },
          {
            "name": "sourceCollection",
            "docs": [
              "metaplex collection (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "destinationCollection",
            "docs": [
              "new collection (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "ruleSet",
            "docs": [
              "optional ruleset, defaults to metaplex (1 + 32)"
            ],
            "type": {
              "option": "publicKey"
            }
          },
          {
            "name": "active",
            "docs": [
              "is the converter active (1)"
            ],
            "type": "bool"
          },
          {
            "name": "logo",
            "docs": [
              "optional logo (1 + 4 + 52)"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "bg",
            "docs": [
              "optional bg (1 + 4 + 52)"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "customDomain",
            "docs": [
              "optional custom domain, max 50 chars (1 + 4 + 50),"
            ],
            "type": {
              "option": "string"
            }
          },
          {
            "name": "bump",
            "docs": [
              "the bump of the converter (1)"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "programConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "convertFee",
            "docs": [
              "the amount in sol to convert (8)"
            ],
            "type": "u64"
          },
          {
            "name": "slugs",
            "docs": [
              "a vector storing all slugs (4)"
            ],
            "type": {
              "vec": "string"
            }
          },
          {
            "name": "bump",
            "docs": [
              "the bump of the program_config account (1)"
            ],
            "type": "u8"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidCollection",
      "msg": "Invalid collection"
    },
    {
      "code": 6001,
      "name": "IncorrectCollectionAuthority",
      "msg": "Incorrect collection authority"
    },
    {
      "code": 6002,
      "name": "MintMismatch",
      "msg": "Mint mismatch"
    },
    {
      "code": 6003,
      "name": "UnauthorisedUA",
      "msg": "Only the UA can create a converter"
    },
    {
      "code": 6004,
      "name": "SlugTooLong",
      "msg": "Slug can only be a maximum of 50 chars"
    },
    {
      "code": 6005,
      "name": "SlugRequired",
      "msg": "Slug is required"
    },
    {
      "code": 6006,
      "name": "NameTooLong",
      "msg": "Project name can only be a maximum of 50 chars"
    },
    {
      "code": 6007,
      "name": "NameRequired",
      "msg": "Project name is required"
    },
    {
      "code": 6008,
      "name": "InvalidSlug",
      "msg": "Slug can only contain valid URL slug chars"
    },
    {
      "code": 6009,
      "name": "SlugExists",
      "msg": "Slug already exists"
    },
    {
      "code": 6010,
      "name": "LogoTooLong",
      "msg": "Logo URI max length 63"
    },
    {
      "code": 6011,
      "name": "BgTooLong",
      "msg": "Bg URI max length 63"
    },
    {
      "code": 6012,
      "name": "AdminOnly",
      "msg": "This is an admin only action"
    },
    {
      "code": 6013,
      "name": "InvalidRuleSet",
      "msg": "Invalid ruleSet, either pass in a valid ruleset or omit for Metaplex default ruleset"
    },
    {
      "code": 6014,
      "name": "ConverterInactive",
      "msg": "This converter is currently inactive"
    }
  ]
};