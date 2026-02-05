// Silver Mining V3.7 IDL - Generated from deployed program (31 instructions)
export const IDL = {
  "address": "CiKNKPpdC55EpnVD5nDF5kSHVUHu1Q3kiKUstdsHPmtV",
  "metadata": {
    "name": "silver_mining",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Silver Mining Protocol - PoW Mining on Solana"
  },
  "instructions": [
    {
      "name": "admin_mint_silver",
      "discriminator": [
        31,
        68,
        129,
        57,
        104,
        33,
        73,
        185
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "silver_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  105,
                  108,
                  118,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "destination",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claim_bet_silver",
      "discriminator": [
        46,
        247,
        85,
        163,
        116,
        213,
        125,
        230
      ],
      "accounts": [
        {
          "name": "claimer",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "claimer"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "round",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  117,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "bet.round",
                "account": "Bet"
              }
            ]
          }
        },
        {
          "name": "bet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "claimer"
              },
              {
                "kind": "account",
                "path": "bet.round",
                "account": "Bet"
              }
            ]
          }
        },
        {
          "name": "unrefined_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  110,
                  114,
                  101,
                  102,
                  105,
                  110,
                  101,
                  100
                ]
              }
            ]
          }
        },
        {
          "name": "claimer_ata",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "claim_redistribution",
      "discriminator": [
        173,
        164,
        210,
        153,
        207,
        123,
        195,
        29
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "silver_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  105,
                  108,
                  118,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "owner_silver",
          "writable": true
        },
        {
          "name": "owner_unrefined",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "claim_silver",
      "discriminator": [
        204,
        246,
        108,
        28,
        241,
        72,
        133,
        32
      ],
      "accounts": [
        {
          "name": "claimer",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "claimer"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "unrefined_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  110,
                  114,
                  101,
                  102,
                  105,
                  110,
                  101,
                  100
                ]
              }
            ]
          }
        },
        {
          "name": "claimer_ata",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "claim_sol",
      "docs": [
        "Claim SOL winnings. Also enters claimer into motherlode raffle."
      ],
      "discriminator": [
        139,
        113,
        179,
        189,
        190,
        30,
        132,
        195
      ],
      "accounts": [
        {
          "name": "claimer",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "claimer"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "round",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  117,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "bet.round",
                "account": "Bet"
              }
            ]
          }
        },
        {
          "name": "bet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "claimer"
              },
              {
                "kind": "account",
                "path": "bet.round",
                "account": "Bet"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "claim_staking_rewards",
      "discriminator": [
        229,
        141,
        170,
        69,
        111,
        94,
        6,
        72
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "silver_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  105,
                  108,
                  118,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "owner_silver",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "collect_motherlode",
      "docs": [
        "Pays ONE winner. Permissionless \u2014 anyone calls after 1-hour window."
      ],
      "discriminator": [
        166,
        90,
        74,
        83,
        243,
        57,
        155,
        27
      ],
      "accounts": [
        {
          "name": "caller",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "round",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  117,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "config.motherlode_round_number",
                "account": "Config"
              }
            ]
          }
        },
        {
          "name": "winner",
          "writable": true
        },
        {
          "name": "winner_miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "winner"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "crank_autominer",
      "docs": [
        "FIX #2: Crank reimburses cranker full Bet rent + tip from autominer balance."
      ],
      "discriminator": [
        141,
        112,
        153,
        229,
        204,
        66,
        30,
        56
      ],
      "accounts": [
        {
          "name": "cranker",
          "writable": true,
          "signer": true
        },
        {
          "name": "autominer_owner"
        },
        {
          "name": "miner",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "autominer_owner"
              }
            ]
          }
        },
        {
          "name": "autominer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  111,
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "autominer_owner"
              }
            ]
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "round",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  117,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "config.current_round",
                "account": "Config"
              }
            ]
          }
        },
        {
          "name": "bet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "autominer_owner"
              },
              {
                "kind": "account",
                "path": "config.current_round",
                "account": "Config"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "create_pool",
      "discriminator": [
        233,
        146,
        209,
        142,
        207,
        104,
        64,
        188
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              },
              {
                "kind": "account",
                "path": "config.total_pools",
                "account": "Config"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "fee_bps",
          "type": "u16"
        },
        {
          "name": "mine_level",
          "type": "u8"
        }
      ]
    },
    {
      "name": "create_token_metadata",
      "discriminator": [
        221,
        80,
        176,
        37,
        153,
        188,
        160,
        68
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "metadata",
          "writable": true
        },
        {
          "name": "mint"
        },
        {
          "name": "token_metadata_program"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "deposit_autominer",
      "discriminator": [
        204,
        117,
        73,
        39,
        163,
        139,
        28,
        53
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "autominer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  111,
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "disable_autominer",
      "discriminator": [
        251,
        149,
        151,
        36,
        36,
        144,
        62,
        90
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "autominer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  111,
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "finalize_round",
      "discriminator": [
        239,
        160,
        254,
        11,
        254,
        144,
        53,
        148
      ],
      "accounts": [
        {
          "name": "settler",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "round",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  117,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "config.current_round",
                "account": "Config"
              }
            ]
          }
        },
        {
          "name": "warchest",
          "writable": true
        },
        {
          "name": "admin_wallet",
          "writable": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "silver_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  105,
                  108,
                  118,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "unrefined_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  110,
                  114,
                  101,
                  102,
                  105,
                  110,
                  101,
                  100
                ]
              }
            ]
          }
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initialize_miner",
      "discriminator": [
        170,
        106,
        254,
        94,
        49,
        203,
        51,
        79
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initialize_round",
      "discriminator": [
        43,
        135,
        19,
        93,
        14,
        225,
        131,
        188
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "round",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  117,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "config.current_round",
                "account": "Config"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "join_pool",
      "discriminator": [
        14,
        65,
        62,
        16,
        116,
        17,
        195,
        107
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "leave_pool",
      "discriminator": [
        249,
        99,
        213,
        170,
        247,
        191,
        36,
        115
      ],
      "accounts": [
        {
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "member"
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "pause",
      "discriminator": [
        211,
        22,
        221,
        251,
        74,
        121,
        193,
        47
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "place_bet",
      "discriminator": [
        222,
        62,
        67,
        220,
        63,
        166,
        126,
        33
      ],
      "accounts": [
        {
          "name": "bettor",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "bettor"
              }
            ]
          }
        },
        {
          "name": "config",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "round",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  111,
                  117,
                  110,
                  100
                ]
              },
              {
                "kind": "account",
                "path": "config.current_round",
                "account": "Config"
              }
            ]
          }
        },
        {
          "name": "bet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "bettor"
              },
              {
                "kind": "account",
                "path": "config.current_round",
                "account": "Config"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "mine_level",
          "type": "u8"
        },
        {
          "name": "blocks",
          "type": {
            "array": [
              "bool",
              5
            ]
          }
        },
        {
          "name": "sol_per_block",
          "type": "u64"
        }
      ]
    },
    {
      "name": "refine",
      "discriminator": [
        253,
        171,
        192,
        242,
        33,
        7,
        78,
        49
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "unrefined_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  110,
                  114,
                  101,
                  102,
                  105,
                  110,
                  101,
                  100
                ]
              }
            ]
          }
        },
        {
          "name": "silver_mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  105,
                  108,
                  118,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "owner_unrefined",
          "writable": true
        },
        {
          "name": "owner_silver",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "setup_autominer",
      "discriminator": [
        128,
        197,
        154,
        65,
        118,
        242,
        30,
        103
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "autominer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  111,
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "mine_level",
          "type": "u8"
        },
        {
          "name": "auto_reload",
          "type": "bool"
        },
        {
          "name": "sol_per_block",
          "type": "u64"
        }
      ]
    },
    {
      "name": "stake",
      "discriminator": [
        206,
        176,
        202,
        18,
        200,
        209,
        179,
        108
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "owner_silver",
          "writable": true
        },
        {
          "name": "staking_vault",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "trigger_motherlode",
      "docs": [
        "Manual trigger (backward compat). Now uses weighted-random system."
      ],
      "discriminator": [
        38,
        104,
        241,
        178,
        123,
        113,
        114,
        194
      ],
      "accounts": [
        {
          "name": "winner",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "winner"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "unpause",
      "discriminator": [
        169,
        144,
        4,
        38,
        10,
        141,
        188,
        255
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "unstake",
      "discriminator": [
        90,
        95,
        107,
        42,
        205,
        124,
        50,
        225
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "owner_silver",
          "writable": true
        },
        {
          "name": "staking_vault",
          "writable": true
        },
        {
          "name": "token_program",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "update_autominer",
      "discriminator": [
        217,
        167,
        7,
        97,
        251,
        108,
        107,
        52
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "miner",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "autominer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  111,
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "mine_level",
          "type": "u8"
        },
        {
          "name": "auto_reload",
          "type": "bool"
        },
        {
          "name": "sol_per_block",
          "type": "u64"
        },
        {
          "name": "enabled",
          "type": "bool"
        }
      ]
    },
    {
      "name": "update_staking_apr",
      "discriminator": [
        136,
        151,
        185,
        2,
        102,
        217,
        106,
        153
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "new_apr",
          "type": "u16"
        }
      ]
    },
    {
      "name": "withdraw_autominer",
      "discriminator": [
        24,
        21,
        63,
        118,
        223,
        56,
        127,
        115
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "autominer",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  111,
                  109,
                  105,
                  110,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw_autominer_treasury",
      "discriminator": [
        182,
        71,
        156,
        39,
        116,
        109,
        254,
        237
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw_motherlode_fees",
      "discriminator": [
        9,
        135,
        208,
        85,
        163,
        14,
        27,
        30
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "AutoMiner",
      "discriminator": [
        48,
        148,
        141,
        250,
        248,
        159,
        16,
        132
      ]
    },
    {
      "name": "Bet",
      "discriminator": [
        147,
        23,
        35,
        59,
        15,
        75,
        155,
        32
      ]
    },
    {
      "name": "Config",
      "discriminator": [
        155,
        12,
        170,
        224,
        30,
        250,
        204,
        130
      ]
    },
    {
      "name": "Miner",
      "discriminator": [
        223,
        113,
        15,
        54,
        123,
        122,
        140,
        100
      ]
    },
    {
      "name": "Pool",
      "discriminator": [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    },
    {
      "name": "Round",
      "discriminator": [
        87,
        127,
        165,
        51,
        73,
        78,
        116,
        174
      ]
    }
  ],
  "events": [
    {
      "name": "AutoMinerBetPlaced",
      "discriminator": [
        124,
        16,
        85,
        208,
        185,
        152,
        29,
        209
      ]
    },
    {
      "name": "AutoMinerDeposit",
      "discriminator": [
        212,
        139,
        223,
        108,
        101,
        87,
        88,
        55
      ]
    },
    {
      "name": "AutoMinerSetup",
      "discriminator": [
        92,
        248,
        38,
        131,
        169,
        188,
        246,
        36
      ]
    },
    {
      "name": "AutoMinerWithdraw",
      "discriminator": [
        212,
        109,
        6,
        121,
        212,
        181,
        83,
        79
      ]
    },
    {
      "name": "BetPlaced",
      "discriminator": [
        88,
        88,
        145,
        226,
        126,
        206,
        32,
        0
      ]
    },
    {
      "name": "FeesDistributed",
      "discriminator": [
        209,
        24,
        174,
        200,
        236,
        90,
        154,
        55
      ]
    },
    {
      "name": "MinerInitialized",
      "discriminator": [
        93,
        124,
        2,
        254,
        199,
        202,
        90,
        88
      ]
    },
    {
      "name": "MotherlodeTriggered",
      "discriminator": [
        50,
        253,
        50,
        221,
        28,
        36,
        74,
        109
      ]
    },
    {
      "name": "PoolCreated",
      "discriminator": [
        202,
        44,
        41,
        88,
        104,
        220,
        157,
        82
      ]
    },
    {
      "name": "PoolJoined",
      "discriminator": [
        79,
        207,
        125,
        205,
        4,
        167,
        178,
        115
      ]
    },
    {
      "name": "PoolLeft",
      "discriminator": [
        99,
        100,
        26,
        233,
        89,
        230,
        153,
        253
      ]
    },
    {
      "name": "ProtocolInitialized",
      "discriminator": [
        173,
        122,
        168,
        254,
        9,
        118,
        76,
        132
      ]
    },
    {
      "name": "RedistributionClaimed",
      "discriminator": [
        80,
        175,
        101,
        241,
        58,
        133,
        101,
        42
      ]
    },
    {
      "name": "Refined",
      "discriminator": [
        99,
        137,
        123,
        244,
        229,
        213,
        120,
        241
      ]
    },
    {
      "name": "RoundFinalized",
      "discriminator": [
        43,
        187,
        17,
        193,
        36,
        241,
        48,
        82
      ]
    },
    {
      "name": "SilverClaimed",
      "discriminator": [
        159,
        145,
        90,
        132,
        67,
        158,
        13,
        246
      ]
    },
    {
      "name": "SolClaimed",
      "discriminator": [
        112,
        80,
        238,
        167,
        120,
        101,
        47,
        207
      ]
    },
    {
      "name": "Staked",
      "discriminator": [
        11,
        146,
        45,
        205,
        230,
        58,
        213,
        240
      ]
    },
    {
      "name": "StakingRewardsClaimed",
      "discriminator": [
        251,
        169,
        50,
        96,
        7,
        92,
        141,
        137
      ]
    },
    {
      "name": "Unstaked",
      "discriminator": [
        27,
        179,
        156,
        215,
        47,
        71,
        195,
        7
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    },
    {
      "code": 6001,
      "name": "InvalidAmount",
      "msg": "Invalid amount"
    },
    {
      "code": 6002,
      "name": "InsufficientBalance",
      "msg": "Insufficient balance"
    },
    {
      "code": 6003,
      "name": "InsufficientStake",
      "msg": "Insufficient stake"
    },
    {
      "code": 6004,
      "name": "RoundNotFinalized",
      "msg": "Round not finalized"
    },
    {
      "code": 6005,
      "name": "RoundAlreadyFinalized",
      "msg": "Round already finalized"
    },
    {
      "code": 6006,
      "name": "BettingClosed",
      "msg": "Betting closed"
    },
    {
      "code": 6007,
      "name": "NoBlocksSelected",
      "msg": "No blocks selected"
    },
    {
      "code": 6008,
      "name": "AlreadyClaimed",
      "msg": "Already claimed"
    },
    {
      "code": 6009,
      "name": "NothingToClaim",
      "msg": "Nothing to claim"
    },
    {
      "code": 6010,
      "name": "PoolFull",
      "msg": "Pool full"
    },
    {
      "code": 6011,
      "name": "AlreadyInPool",
      "msg": "Already in pool"
    },
    {
      "code": 6012,
      "name": "NotInPool",
      "msg": "Not in pool"
    },
    {
      "code": 6013,
      "name": "PoolNotFound",
      "msg": "Pool not found"
    },
    {
      "code": 6014,
      "name": "InvalidFee",
      "msg": "Invalid fee"
    },
    {
      "code": 6015,
      "name": "InvalidMineLevel",
      "msg": "Invalid mine level"
    },
    {
      "code": 6016,
      "name": "MineNotUnlocked",
      "msg": "Mine not unlocked"
    },
    {
      "code": 6017,
      "name": "MotherlodeNotTriggered",
      "msg": "Motherlode not triggered"
    },
    {
      "code": 6018,
      "name": "NothingToRefine",
      "msg": "Nothing to refine"
    },
    {
      "code": 6019,
      "name": "Overflow",
      "msg": "Overflow"
    },
    {
      "code": 6020,
      "name": "InvalidParameter",
      "msg": "Invalid parameter"
    },
    {
      "code": 6021,
      "name": "AlreadyInitialized",
      "msg": "Already initialized"
    },
    {
      "code": 6022,
      "name": "DailyLimitExceeded",
      "msg": "Daily withdrawal limit exceeded"
    },
    {
      "code": 6023,
      "name": "AutoMinerNotEnabled",
      "msg": "AutoMiner not enabled"
    },
    {
      "code": 6024,
      "name": "AutoMinerAlreadyExists",
      "msg": "AutoMiner already exists"
    },
    {
      "code": 6025,
      "name": "PoolMustBetAllBlocks",
      "msg": "Pool must bet all 5 blocks"
    },
    {
      "code": 6026,
      "name": "RoundNotEnded",
      "msg": "Round has not ended yet"
    },
    {
      "code": 6027,
      "name": "ProtocolPaused",
      "msg": "Protocol is paused"
    },
    {
      "code": 6028,
      "name": "AutoMinerInsufficientBalance",
      "msg": "AutoMiner insufficient balance for bet"
    },
    {
      "code": 6029,
      "name": "AutoMinerAlreadyBetThisRound",
      "msg": "AutoMiner already bet this round"
    }
  ],
  "types": [
    {
      "name": "AutoMiner",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "enabled",
            "type": "bool"
          },
          {
            "name": "mine_level",
            "type": "u8"
          },
          {
            "name": "auto_reload",
            "type": "bool"
          },
          {
            "name": "balance",
            "type": "u64"
          },
          {
            "name": "sol_per_block",
            "type": "u64"
          },
          {
            "name": "daily_withdrawn",
            "type": "u64"
          },
          {
            "name": "last_withdrawal_day",
            "type": "i64"
          },
          {
            "name": "total_bets_placed",
            "type": "u64"
          },
          {
            "name": "total_winnings",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "AutoMinerBetPlaced",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u64"
          },
          {
            "name": "total_sol",
            "type": "u64"
          },
          {
            "name": "cranker",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "AutoMinerDeposit",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "AutoMinerSetup",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "mine_level",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "AutoMinerWithdraw",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Bet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "miner",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u64"
          },
          {
            "name": "mine_level",
            "type": "u8"
          },
          {
            "name": "blocks",
            "type": {
              "array": [
                "bool",
                5
              ]
            }
          },
          {
            "name": "sol_per_block",
            "type": "u64"
          },
          {
            "name": "total_sol",
            "type": "u64"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "silver_claimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "BetPlaced",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "miner",
            "type": "pubkey"
          },
          {
            "name": "round",
            "type": "u64"
          },
          {
            "name": "total_sol",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Config",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "silver_mint",
            "type": "pubkey"
          },
          {
            "name": "unrefined_mint",
            "type": "pubkey"
          },
          {
            "name": "current_round",
            "type": "u64"
          },
          {
            "name": "round_start_time",
            "type": "i64"
          },
          {
            "name": "total_unrefined_supply",
            "type": "u64"
          },
          {
            "name": "total_silver_supply",
            "type": "u64"
          },
          {
            "name": "total_staked",
            "type": "u64"
          },
          {
            "name": "total_pools",
            "type": "u64"
          },
          {
            "name": "motherlode_balance",
            "type": "u64"
          },
          {
            "name": "motherlode_target",
            "type": "u64"
          },
          {
            "name": "staking_apr",
            "type": "u16"
          },
          {
            "name": "autominer_treasury",
            "type": "u64"
          },
          {
            "name": "redistribution_pool",
            "type": "u64"
          },
          {
            "name": "total_unrefined_holders",
            "type": "u64"
          },
          {
            "name": "config_bump",
            "type": "u8"
          },
          {
            "name": "silver_bump",
            "type": "u8"
          },
          {
            "name": "unrefined_bump",
            "type": "u8"
          },
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "paused",
            "type": "bool"
          },
          {
            "name": "admin_minted_silver",
            "type": "u64"
          },
          {
            "name": "motherlode_round_number",
            "type": "u64"
          },
          {
            "name": "motherlode_prize",
            "type": "u64"
          },
          {
            "name": "motherlode_winner_key",
            "type": "pubkey"
          },
          {
            "name": "motherlode_best_score",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "FeesDistributed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "round",
            "type": "u64"
          },
          {
            "name": "warchest",
            "type": "u64"
          },
          {
            "name": "motherlode",
            "type": "u64"
          },
          {
            "name": "admin",
            "type": "u64"
          },
          {
            "name": "autominer_treasury",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Miner",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "current_mine",
            "type": "u8"
          },
          {
            "name": "total_sol_won",
            "type": "u64"
          },
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "is_in_pool",
            "type": "bool"
          },
          {
            "name": "staked_amount",
            "type": "u64"
          },
          {
            "name": "pending_rewards",
            "type": "u64"
          },
          {
            "name": "last_stake_time",
            "type": "i64"
          },
          {
            "name": "pending_unrefined",
            "type": "u64"
          },
          {
            "name": "last_redistribution_claim",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "MinerInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "MotherlodeTriggered",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "winner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "mine_level",
            "type": "u8"
          },
          {
            "name": "fee_bps",
            "type": "u16"
          },
          {
            "name": "member_count",
            "type": "u8"
          },
          {
            "name": "members",
            "type": {
              "array": [
                "pubkey",
                25
              ]
            }
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "PoolCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "PoolJoined",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "PoolLeft",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pool",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "ProtocolInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "RedistributionClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "miner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Refined",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "miner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "redistributed",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Round",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "round_number",
            "type": "u64"
          },
          {
            "name": "start_time",
            "type": "i64"
          },
          {
            "name": "end_time",
            "type": "i64"
          },
          {
            "name": "finalized",
            "type": "bool"
          },
          {
            "name": "winning_block",
            "type": "u8"
          },
          {
            "name": "is_solo",
            "type": "bool"
          },
          {
            "name": "solo_winner",
            "type": "pubkey"
          },
          {
            "name": "solo_seed",
            "type": "u64"
          },
          {
            "name": "solo_best_score",
            "type": "u64"
          },
          {
            "name": "total_pot",
            "type": "u64"
          },
          {
            "name": "block_totals",
            "type": {
              "array": [
                "u64",
                5
              ]
            }
          },
          {
            "name": "winner_pot",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "RoundFinalized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "round",
            "type": "u64"
          },
          {
            "name": "winning_block",
            "type": "u8"
          },
          {
            "name": "total_pot",
            "type": "u64"
          },
          {
            "name": "is_solo",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "SilverClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "miner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "is_solo",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "SolClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "miner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Staked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "miner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "StakingRewardsClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "miner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Unstaked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "miner",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
};

// PDA seeds
export const SEEDS = {
  CONFIG: Buffer.from("config"),
  MINER: Buffer.from("miner"),
  POOL: Buffer.from("pool"),
  ROUND: Buffer.from("round"),
  BET: Buffer.from("bet"),
  SILVER: Buffer.from("silver"),
  UNREFINED: Buffer.from("unrefined"),
  AUTOMINER: Buffer.from("autominer"),
};

// Instruction discriminators (from IDL)
export const DISCRIMINATORS = {
  adminMintSilver: Buffer.from([31, 68, 129, 57, 104, 33, 73, 185]),
  adminResetMotherlode: Buffer.from([246, 165, 18, 244, 7, 193, 124, 42]),
  claimBetSilver: Buffer.from([46, 247, 85, 163, 116, 213, 125, 230]),
  claimRedistribution: Buffer.from([173, 164, 210, 153, 207, 123, 195, 29]),
  claimSilver: Buffer.from([204, 246, 108, 28, 241, 72, 133, 32]),
  claimSol: Buffer.from([139, 113, 179, 189, 190, 30, 132, 195]),
  claimStakingRewards: Buffer.from([229, 141, 170, 69, 111, 94, 6, 72]),
  collectMotherlode: Buffer.from([166, 90, 74, 83, 243, 57, 155, 27]),
  crankAutominer: Buffer.from([141, 112, 153, 229, 204, 66, 30, 56]),
  createPool: Buffer.from([233, 146, 209, 142, 207, 104, 64, 188]),
  createTokenMetadata: Buffer.from([221, 80, 176, 37, 153, 188, 160, 68]),
  depositAutominer: Buffer.from([204, 117, 73, 39, 163, 139, 28, 53]),
  disableAutominer: Buffer.from([251, 149, 151, 36, 36, 144, 62, 90]),
  finalizeRound: Buffer.from([239, 160, 254, 11, 254, 144, 53, 148]),
  initialize: Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]),
  initializeMiner: Buffer.from([170, 106, 254, 94, 49, 203, 51, 79]),
  initializeRound: Buffer.from([43, 135, 19, 93, 14, 225, 131, 188]),
  joinPool: Buffer.from([14, 65, 62, 16, 116, 17, 195, 107]),
  leavePool: Buffer.from([249, 99, 213, 170, 247, 191, 36, 115]),
  pause: Buffer.from([211, 22, 221, 251, 74, 121, 193, 47]),
  placeBet: Buffer.from([222, 62, 67, 220, 63, 166, 126, 33]),
  refine: Buffer.from([253, 171, 192, 242, 33, 7, 78, 49]),
  setupAutominer: Buffer.from([128, 197, 154, 65, 118, 242, 30, 103]),
  stake: Buffer.from([206, 176, 202, 18, 200, 209, 179, 108]),
  triggerMotherlode: Buffer.from([38, 104, 241, 178, 123, 113, 114, 194]),
  unpause: Buffer.from([169, 144, 4, 38, 10, 141, 188, 255]),
  unstake: Buffer.from([90, 95, 107, 42, 205, 124, 50, 225]),
  updateAutominer: Buffer.from([217, 167, 7, 97, 251, 108, 107, 52]),
  updateStakingApr: Buffer.from([136, 151, 185, 2, 102, 217, 106, 153]),
  withdrawAutominer: Buffer.from([24, 21, 63, 118, 223, 56, 127, 115]),
  withdrawAutominerTreasury: Buffer.from([182, 71, 156, 39, 116, 109, 254, 237]),
  withdrawMotherlodeFees: Buffer.from([9, 135, 208, 85, 163, 14, 27, 30]),
};

// Account discriminators
export const ACCOUNT_DISCRIMINATORS = {
  autoMiner: Buffer.from([48, 148, 141, 250, 248, 159, 16, 132]),
  bet: Buffer.from([147, 23, 35, 59, 15, 75, 155, 32]),
  config: Buffer.from([155, 12, 170, 224, 30, 250, 204, 130]),
  miner: Buffer.from([223, 113, 15, 54, 123, 122, 140, 100]),
  pool: Buffer.from([241, 154, 109, 4, 17, 177, 109, 188]),
  round: Buffer.from([87, 127, 165, 51, 73, 78, 116, 174]),
};
