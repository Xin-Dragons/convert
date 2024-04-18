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
          "name": "collectionIdentifier",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
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
      "name": "initCore",
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
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionIdentifier",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationCollection",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "coreProgram",
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
          "name": "name",
          "type": "string"
        },
        {
          "name": "slug",
          "type": "string"
        },
        {
          "name": "uri",
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
      "name": "initNifty",
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
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionIdentifier",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationCollection",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "niftyProgram",
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
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "slug",
          "type": "string"
        },
        {
          "name": "uri",
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
        },
        {
          "name": "maxSize",
          "type": {
            "option": "u64"
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
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
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
          "name": "payer",
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
      "name": "convertCore",
      "accounts": [
        {
          "name": "programConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "updateAuthority",
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
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenRecord",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
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
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newCollectionMint",
          "isMut": true,
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
          "name": "coreProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "CHECK constrained to single programId"
          ]
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
      "name": "convertNifty",
      "accounts": [
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "updateAuthority",
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
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenRecord",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
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
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newCollectionMint",
          "isMut": true,
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
          "name": "niftyProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "CHECK constrained to single programId"
          ]
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
      "name": "closeCoreConverter",
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
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "programData",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "collection",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "coreProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "closeNiftyConverter",
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
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "programData",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "collection",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "niftyProgram",
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
      "name": "toggleFreeMode",
      "accounts": [
        {
          "name": "converter",
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
        }
      ],
      "args": [
        {
          "name": "isFree",
          "type": "bool"
        }
      ]
    },
    {
      "name": "closeConverter",
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
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "programData",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "collectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionDelegateRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorizationRules",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "authorizationRulesProgram",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
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
          "name": "sysvarInstructions",
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
    },
    {
      "name": "updateConvertFee",
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
      "name": "updateConverter",
      "accounts": [
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ruleSet",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "name",
          "type": {
            "option": "string"
          }
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
      "name": "toggleApproved",
      "accounts": [
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionIdentifier",
          "isMut": false,
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
        }
      ],
      "args": [
        {
          "name": "approved",
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
          },
          {
            "name": "assetType",
            "docs": [
              "the asset type of the output (1)"
            ],
            "type": {
              "defined": "AssetType"
            }
          },
          {
            "name": "approved",
            "docs": [
              "is this converter approved for use (1)"
            ],
            "type": "bool"
          },
          {
            "name": "free",
            "docs": [
              "is this converter free to use for holders (1)"
            ],
            "type": "bool"
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
  "types": [
    {
      "name": "AssetType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Pnft"
          },
          {
            "name": "Core"
          },
          {
            "name": "Nifty"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "ProgramSubError",
      "msg": "Unable to subtract the given numbers"
    },
    {
      "code": 6001,
      "name": "InvalidCollectionMint",
      "msg": "Collection mint must be either a MCC or FVC"
    },
    {
      "code": 6002,
      "name": "InvalidCollection",
      "msg": "Invalid collection"
    },
    {
      "code": 6003,
      "name": "IncorrectCollectionAuthority",
      "msg": "Incorrect collection authority"
    },
    {
      "code": 6004,
      "name": "MintMismatch",
      "msg": "Mint mismatch"
    },
    {
      "code": 6005,
      "name": "UnauthorisedUA",
      "msg": "Only the UA or the system admin can create a converter"
    },
    {
      "code": 6006,
      "name": "SlugTooLong",
      "msg": "Slug can only be a maximum of 50 chars"
    },
    {
      "code": 6007,
      "name": "SlugRequired",
      "msg": "Slug is required"
    },
    {
      "code": 6008,
      "name": "NameTooLong",
      "msg": "Project name can only be a maximum of 50 chars"
    },
    {
      "code": 6009,
      "name": "NameRequired",
      "msg": "Project name is required"
    },
    {
      "code": 6010,
      "name": "InvalidSlug",
      "msg": "Slug can only contain valid URL slug chars"
    },
    {
      "code": 6011,
      "name": "SlugExists",
      "msg": "Slug already exists"
    },
    {
      "code": 6012,
      "name": "LogoTooLong",
      "msg": "Logo URI max length 63"
    },
    {
      "code": 6013,
      "name": "BgTooLong",
      "msg": "Bg URI max length 63"
    },
    {
      "code": 6014,
      "name": "AdminOnly",
      "msg": "This is an admin only action"
    },
    {
      "code": 6015,
      "name": "InvalidRuleSet",
      "msg": "Invalid ruleSet, either pass in a valid ruleset or omit for Metaplex default ruleset"
    },
    {
      "code": 6016,
      "name": "ConverterInactive",
      "msg": "This converter is currently inactive"
    },
    {
      "code": 6017,
      "name": "CollectionMetadataRequired",
      "msg": "The collection metadata account is required for pNFT comnversions"
    },
    {
      "code": 6018,
      "name": "CollectionDelegateRecordRequired",
      "msg": "The collection delegate record account is required for pNFT comnversions"
    },
    {
      "code": 6019,
      "name": "IncorrectAccountOwner",
      "msg": "Incorrect account owner for this account"
    },
    {
      "code": 6020,
      "name": "UnsupportedAssetType",
      "msg": "This asset type is not yet supported"
    },
    {
      "code": 6021,
      "name": "UnexpectedDelegateRecord",
      "msg": "Delegate record not expected for this asset type"
    },
    {
      "code": 6022,
      "name": "UnexpectedCollectionMetadata",
      "msg": "Collection metadata not expected for this asset type"
    },
    {
      "code": 6023,
      "name": "ConverterNotApproved",
      "msg": "This converter has not yet been approved"
    },
    {
      "code": 6024,
      "name": "InvalidInstruction",
      "msg": "This instruction cannot be used with this converter"
    },
    {
      "code": 6025,
      "name": "ProgramAddError",
      "msg": "Could not add the given numbers"
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
          "name": "collectionIdentifier",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
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
      "name": "initCore",
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
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionIdentifier",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationCollection",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "coreProgram",
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
          "name": "name",
          "type": "string"
        },
        {
          "name": "slug",
          "type": "string"
        },
        {
          "name": "uri",
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
      "name": "initNifty",
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
          "name": "nftMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nftMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionIdentifier",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationCollection",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "niftyProgram",
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
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "slug",
          "type": "string"
        },
        {
          "name": "uri",
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
        },
        {
          "name": "maxSize",
          "type": {
            "option": "u64"
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
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
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
          "name": "payer",
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
      "name": "convertCore",
      "accounts": [
        {
          "name": "programConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "updateAuthority",
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
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenRecord",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
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
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newCollectionMint",
          "isMut": true,
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
          "name": "coreProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "CHECK constrained to single programId"
          ]
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
      "name": "convertNifty",
      "accounts": [
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "updateAuthority",
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
          "name": "masterEdition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenRecord",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
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
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "newCollectionMint",
          "isMut": true,
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
          "name": "niftyProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "CHECK constrained to single programId"
          ]
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
      "name": "closeCoreConverter",
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
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "programData",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "collection",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "coreProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "closeNiftyConverter",
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
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "programData",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "collection",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "niftyProgram",
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
      "name": "toggleFreeMode",
      "accounts": [
        {
          "name": "converter",
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
        }
      ],
      "args": [
        {
          "name": "isFree",
          "type": "bool"
        }
      ]
    },
    {
      "name": "closeConverter",
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
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "programData",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "collectionMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "collectionMetadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionDelegateRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorizationRules",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "authorizationRulesProgram",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
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
          "name": "sysvarInstructions",
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
    },
    {
      "name": "updateConvertFee",
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
      "name": "updateConverter",
      "accounts": [
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "ruleSet",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "name",
          "type": {
            "option": "string"
          }
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
      "name": "toggleApproved",
      "accounts": [
        {
          "name": "converter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "collectionIdentifier",
          "isMut": false,
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
        }
      ],
      "args": [
        {
          "name": "approved",
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
          },
          {
            "name": "assetType",
            "docs": [
              "the asset type of the output (1)"
            ],
            "type": {
              "defined": "AssetType"
            }
          },
          {
            "name": "approved",
            "docs": [
              "is this converter approved for use (1)"
            ],
            "type": "bool"
          },
          {
            "name": "free",
            "docs": [
              "is this converter free to use for holders (1)"
            ],
            "type": "bool"
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
  "types": [
    {
      "name": "AssetType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Pnft"
          },
          {
            "name": "Core"
          },
          {
            "name": "Nifty"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "ProgramSubError",
      "msg": "Unable to subtract the given numbers"
    },
    {
      "code": 6001,
      "name": "InvalidCollectionMint",
      "msg": "Collection mint must be either a MCC or FVC"
    },
    {
      "code": 6002,
      "name": "InvalidCollection",
      "msg": "Invalid collection"
    },
    {
      "code": 6003,
      "name": "IncorrectCollectionAuthority",
      "msg": "Incorrect collection authority"
    },
    {
      "code": 6004,
      "name": "MintMismatch",
      "msg": "Mint mismatch"
    },
    {
      "code": 6005,
      "name": "UnauthorisedUA",
      "msg": "Only the UA or the system admin can create a converter"
    },
    {
      "code": 6006,
      "name": "SlugTooLong",
      "msg": "Slug can only be a maximum of 50 chars"
    },
    {
      "code": 6007,
      "name": "SlugRequired",
      "msg": "Slug is required"
    },
    {
      "code": 6008,
      "name": "NameTooLong",
      "msg": "Project name can only be a maximum of 50 chars"
    },
    {
      "code": 6009,
      "name": "NameRequired",
      "msg": "Project name is required"
    },
    {
      "code": 6010,
      "name": "InvalidSlug",
      "msg": "Slug can only contain valid URL slug chars"
    },
    {
      "code": 6011,
      "name": "SlugExists",
      "msg": "Slug already exists"
    },
    {
      "code": 6012,
      "name": "LogoTooLong",
      "msg": "Logo URI max length 63"
    },
    {
      "code": 6013,
      "name": "BgTooLong",
      "msg": "Bg URI max length 63"
    },
    {
      "code": 6014,
      "name": "AdminOnly",
      "msg": "This is an admin only action"
    },
    {
      "code": 6015,
      "name": "InvalidRuleSet",
      "msg": "Invalid ruleSet, either pass in a valid ruleset or omit for Metaplex default ruleset"
    },
    {
      "code": 6016,
      "name": "ConverterInactive",
      "msg": "This converter is currently inactive"
    },
    {
      "code": 6017,
      "name": "CollectionMetadataRequired",
      "msg": "The collection metadata account is required for pNFT comnversions"
    },
    {
      "code": 6018,
      "name": "CollectionDelegateRecordRequired",
      "msg": "The collection delegate record account is required for pNFT comnversions"
    },
    {
      "code": 6019,
      "name": "IncorrectAccountOwner",
      "msg": "Incorrect account owner for this account"
    },
    {
      "code": 6020,
      "name": "UnsupportedAssetType",
      "msg": "This asset type is not yet supported"
    },
    {
      "code": 6021,
      "name": "UnexpectedDelegateRecord",
      "msg": "Delegate record not expected for this asset type"
    },
    {
      "code": 6022,
      "name": "UnexpectedCollectionMetadata",
      "msg": "Collection metadata not expected for this asset type"
    },
    {
      "code": 6023,
      "name": "ConverterNotApproved",
      "msg": "This converter has not yet been approved"
    },
    {
      "code": 6024,
      "name": "InvalidInstruction",
      "msg": "This instruction cannot be used with this converter"
    },
    {
      "code": 6025,
      "name": "ProgramAddError",
      "msg": "Could not add the given numbers"
    }
  ]
};
