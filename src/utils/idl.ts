// Silver Mining V3 IDL - Fixed for deployed contract
// FIXES: Added solo_seed/solo_best_score to Round, paused to Config, members[100] to Pool
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
      "name": "claim_bet_silver",
      "docs": ["Claim SILVER (UNREFINED) for a winning bet - handles solo/split"],
      "discriminator": [46, 247, 85, 163, 116, 213, 125, 230],
      "accounts": [
        { "name": "claimer", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "claimer" }] } },
        { "name": "config", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "round", "pda": { "seeds": [{ "kind": "const", "value": [114, 111, 117, 110, 100] }, { "kind": "account", "path": "bet.round", "account": "Bet" }] } },
        { "name": "bet", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [98, 101, 116] }, { "kind": "account", "path": "claimer" }, { "kind": "account", "path": "bet.round", "account": "Bet" }] } },
        { "name": "unrefined_mint", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [117, 110, 114, 101, 102, 105, 110, 101, 100] }] } },
        { "name": "claimer_ata", "writable": true },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
      ],
      "args": []
    },
    {
      "name": "claim_redistribution",
      "docs": ["Claim share of redistribution pool based on unrefined holdings"],
      "discriminator": [173, 164, 210, 153, 207, 123, 195, 29],
      "accounts": [
        { "name": "owner", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } },
        { "name": "config", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "silver_mint", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [115, 105, 108, 118, 101, 114] }] } },
        { "name": "owner_silver", "writable": true },
        { "name": "owner_unrefined", "writable": true },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
      ],
      "args": []
    },
    {
      "name": "claim_silver",
      "docs": ["Legacy claim_silver for pending unrefined"],
      "discriminator": [204, 246, 108, 28, 241, 72, 133, 32],
      "accounts": [
        { "name": "claimer", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "claimer" }] } },
        { "name": "config", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "unrefined_mint", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [117, 110, 114, 101, 102, 105, 110, 101, 100] }] } },
        { "name": "claimer_ata", "writable": true },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
      ],
      "args": []
    },
    {
      "name": "claim_sol",
      "discriminator": [139, 113, 179, 189, 190, 30, 132, 195],
      "accounts": [
        { "name": "claimer", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "claimer" }] } },
        { "name": "config", "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "round", "pda": { "seeds": [{ "kind": "const", "value": [114, 111, 117, 110, 100] }, { "kind": "account", "path": "bet.round", "account": "Bet" }] } },
        { "name": "bet", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [98, 101, 116] }, { "kind": "account", "path": "claimer" }, { "kind": "account", "path": "bet.round", "account": "Bet" }] } },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "claim_staking_rewards",
      "discriminator": [229, 141, 170, 69, 111, 94, 6, 72],
      "accounts": [
        { "name": "owner", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } },
        { "name": "config", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "silver_mint", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [115, 105, 108, 118, 101, 114] }] } },
        { "name": "owner_silver", "writable": true },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
      ],
      "args": []
    },
    {
      "name": "crank_autominer",
      "discriminator": [141, 112, 153, 229, 204, 66, 30, 56],
      "accounts": [
        { "name": "cranker", "writable": true, "signer": true },
        { "name": "autominer_owner" },
        { "name": "miner", "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "autominer_owner" }] } },
        { "name": "autominer", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [97, 117, 116, 111, 109, 105, 110, 101, 114] }, { "kind": "account", "path": "autominer_owner" }] } },
        { "name": "config", "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "round", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [114, 111, 117, 110, 100] }, { "kind": "account", "path": "config.current_round", "account": "Config" }] } },
        { "name": "bet", "writable": true },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "create_pool",
      "discriminator": [233, 146, 209, 142, 207, 104, 64, 188],
      "accounts": [
        { "name": "creator", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "creator" }] } },
        { "name": "config", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "pool", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [112, 111, 111, 108] }, { "kind": "account", "path": "config.total_pools", "account": "Config" }] } },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "fee_bps", "type": "u16" },
        { "name": "mine_level", "type": "u8" }
      ]
    },
    {
      "name": "deposit_autominer",
      "discriminator": [204, 117, 73, 39, 163, 139, 28, 53],
      "accounts": [
        { "name": "owner", "writable": true, "signer": true },
        { "name": "autominer", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [97, 117, 116, 111, 109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "disable_autominer",
      "discriminator": [251, 149, 151, 36, 36, 144, 62, 90],
      "accounts": [
        { "name": "owner", "writable": true, "signer": true },
        { "name": "autominer", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [97, 117, 116, 111, 109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } }
      ],
      "args": []
    },
    {
      "name": "finalize_round",
      "discriminator": [239, 160, 254, 11, 254, 144, 53, 148],
      "accounts": [
        { "name": "settler", "writable": true, "signer": true },
        { "name": "config", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "round", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [114, 111, 117, 110, 100] }, { "kind": "account", "path": "config.current_round", "account": "Config" }] } },
        { "name": "warchest", "writable": true },
        { "name": "admin_wallet", "writable": true },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [175, 175, 109, 31, 13, 152, 155, 237],
      "accounts": [
        { "name": "authority", "writable": true, "signer": true },
        { "name": "config", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "silver_mint", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [115, 105, 108, 118, 101, 114] }] } },
        { "name": "unrefined_mint", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [117, 110, 114, 101, 102, 105, 110, 101, 100] }] } },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { "name": "system_program", "address": "11111111111111111111111111111111" },
        { "name": "rent", "address": "SysvarRent111111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "initialize_miner",
      "discriminator": [170, 106, 254, 94, 49, 203, 51, 79],
      "accounts": [
        { "name": "owner", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "initialize_round",
      "discriminator": [43, 135, 19, 93, 14, 225, 131, 188],
      "accounts": [
        { "name": "payer", "writable": true, "signer": true },
        { "name": "config", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "round", "writable": true },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": []
    },
    {
      "name": "join_pool",
      "discriminator": [14, 65, 62, 16, 116, 17, 195, 107],
      "accounts": [
        { "name": "owner", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } },
        { "name": "pool", "writable": true }
      ],
      "args": []
    },
    {
      "name": "leave_pool",
      "discriminator": [249, 99, 213, 170, 247, 191, 36, 115],
      "accounts": [
        { "name": "owner", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } },
        { "name": "pool", "writable": true }
      ],
      "args": []
    },
    {
      "name": "place_bet",
      "discriminator": [222, 62, 67, 220, 63, 166, 126, 33],
      "accounts": [
        { "name": "bettor", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "bettor" }] } },
        { "name": "config", "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "round", "writable": true },
        { "name": "bet", "writable": true },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "mine_level", "type": "u8" },
        { "name": "blocks", "type": { "array": ["bool", 5] } },
        { "name": "sol_per_block", "type": "u64" }
      ]
    },
    {
      "name": "refine",
      "discriminator": [253, 171, 192, 242, 33, 7, 78, 49],
      "accounts": [
        { "name": "owner", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } },
        { "name": "config", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "unrefined_mint", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [117, 110, 114, 101, 102, 105, 110, 101, 100] }] } },
        { "name": "silver_mint", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [115, 105, 108, 118, 101, 114] }] } },
        { "name": "owner_unrefined", "writable": true },
        { "name": "owner_silver", "writable": true },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
      ],
      "args": []
    },
    {
      "name": "setup_autominer",
      "discriminator": [128, 197, 154, 65, 118, 242, 30, 103],
      "accounts": [
        { "name": "owner", "writable": true, "signer": true },
        { "name": "miner", "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } },
        { "name": "autominer", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [97, 117, 116, 111, 109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "mine_level", "type": "u8" },
        { "name": "auto_reload", "type": "bool" },
        { "name": "sol_per_block", "type": "u64" }
      ]
    },
    {
      "name": "stake",
      "discriminator": [206, 176, 202, 18, 200, 209, 179, 108],
      "accounts": [
        { "name": "owner", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } },
        { "name": "config", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "owner_silver", "writable": true },
        { "name": "staking_vault", "writable": true },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
      ],
      "args": [
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "trigger_motherlode",
      "discriminator": [38, 104, 241, 178, 123, 113, 114, 194],
      "accounts": [
        { "name": "triggerer", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "triggerer" }] } },
        { "name": "config", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } }
      ],
      "args": []
    },
    {
      "name": "unstake",
      "discriminator": [90, 95, 107, 42, 205, 124, 50, 225],
      "accounts": [
        { "name": "owner", "writable": true, "signer": true },
        { "name": "miner", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } },
        { "name": "config", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [99, 111, 110, 102, 105, 103] }] } },
        { "name": "owner_silver", "writable": true },
        { "name": "staking_vault", "writable": true },
        { "name": "token_program", "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }
      ],
      "args": [
        { "name": "amount", "type": "u64" }
      ]
    },
    {
      "name": "update_autominer",
      "discriminator": [217, 167, 7, 97, 251, 108, 107, 52],
      "accounts": [
        { "name": "owner", "writable": true, "signer": true },
        { "name": "miner", "pda": { "seeds": [{ "kind": "const", "value": [109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } },
        { "name": "autominer", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [97, 117, 116, 111, 109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } }
      ],
      "args": [
        { "name": "mine_level", "type": "u8" },
        { "name": "auto_reload", "type": "bool" },
        { "name": "sol_per_block", "type": "u64" },
        { "name": "enabled", "type": "bool" }
      ]
    },
    {
      "name": "withdraw_autominer",
      "discriminator": [24, 21, 63, 118, 223, 56, 127, 115],
      "accounts": [
        { "name": "owner", "writable": true, "signer": true },
        { "name": "autominer", "writable": true, "pda": { "seeds": [{ "kind": "const", "value": [97, 117, 116, 111, 109, 105, 110, 101, 114] }, { "kind": "account", "path": "owner" }] } },
        { "name": "system_program", "address": "11111111111111111111111111111111" }
      ],
      "args": [
        { "name": "amount", "type": "u64" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "AutoMiner",
      "discriminator": [48, 148, 141, 250, 248, 159, 16, 132],
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "owner", "type": "pubkey" },
          { "name": "enabled", "type": "bool" },
          { "name": "mine_level", "type": "u8" },
          { "name": "auto_reload", "type": "bool" },
          { "name": "balance", "type": "u64" },
          { "name": "sol_per_block", "type": "u64" },
          { "name": "daily_withdrawn", "type": "u64" },
          { "name": "last_withdrawal_day", "type": "i64" },
          { "name": "total_bets_placed", "type": "u64" },
          { "name": "total_winnings", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    },
    {
      "name": "Bet",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "miner", "type": "pubkey" },
          { "name": "round", "type": "u64" },
          { "name": "mine_level", "type": "u8" },
          { "name": "blocks", "type": { "array": ["bool", 5] } },
          { "name": "sol_per_block", "type": "u64" },
          { "name": "total_sol", "type": "u64" },
          { "name": "claimed", "type": "bool" },
          { "name": "silver_claimed", "type": "bool" },
          { "name": "bump", "type": "u8" }
        ]
      }
    },
    {
      "name": "Config",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "authority", "type": "pubkey" },
          { "name": "silver_mint", "type": "pubkey" },
          { "name": "unrefined_mint", "type": "pubkey" },
          { "name": "current_round", "type": "u64" },
          { "name": "round_start_time", "type": "i64" },
          { "name": "total_unrefined_supply", "type": "u64" },
          { "name": "total_silver_supply", "type": "u64" },
          { "name": "total_staked", "type": "u64" },
          { "name": "total_pools", "type": "u64" },
          { "name": "motherlode_balance", "type": "u64" },
          { "name": "motherlode_target", "type": "u64" },
          { "name": "staking_apr", "type": "u16" },
          { "name": "autominer_treasury", "type": "u64" },
          { "name": "redistribution_pool", "type": "u64" },
          { "name": "total_unrefined_holders", "type": "u64" },
          { "name": "config_bump", "type": "u8" },
          { "name": "silver_bump", "type": "u8" },
          { "name": "unrefined_bump", "type": "u8" },
          { "name": "initialized", "type": "bool" },
          { "name": "paused", "type": "bool" }
        ]
      }
    },
    {
      "name": "Miner",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "owner", "type": "pubkey" },
          { "name": "current_mine", "type": "u8" },
          { "name": "total_sol_won", "type": "u64" },
          { "name": "pool", "type": "pubkey" },
          { "name": "is_in_pool", "type": "bool" },
          { "name": "staked_amount", "type": "u64" },
          { "name": "pending_rewards", "type": "u64" },
          { "name": "last_stake_time", "type": "i64" },
          { "name": "pending_unrefined", "type": "u64" },
          { "name": "last_redistribution_claim", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    },
    {
      "name": "Pool",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "creator", "type": "pubkey" },
          { "name": "mine_level", "type": "u8" },
          { "name": "fee_bps", "type": "u16" },
          { "name": "member_count", "type": "u8" },
          { "name": "members", "type": { "array": ["pubkey", 100] } },
          { "name": "active", "type": "bool" },
          { "name": "bump", "type": "u8" }
        ]
      }
    },
    {
      "name": "Round",
      "type": {
        "kind": "struct",
        "fields": [
          { "name": "round_number", "type": "u64" },
          { "name": "start_time", "type": "i64" },
          { "name": "end_time", "type": "i64" },
          { "name": "finalized", "type": "bool" },
          { "name": "winning_block", "type": "u8" },
          { "name": "is_solo", "type": "bool" },
          { "name": "solo_winner", "type": "pubkey" },
          { "name": "solo_seed", "type": "u64" },
          { "name": "solo_best_score", "type": "u64" },
          { "name": "total_pot", "type": "u64" },
          { "name": "block_totals", "type": { "array": ["u64", 5] } },
          { "name": "winner_pot", "type": "u64" },
          { "name": "bump", "type": "u8" }
        ]
      }
    }
  ]
} as const;

// PDA Seeds
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

// Instruction discriminators
export const DISCRIMINATORS = {
  initialize: Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]),
  initializeMiner: Buffer.from([170, 106, 254, 94, 49, 203, 51, 79]),
  initializeRound: Buffer.from([43, 135, 19, 93, 14, 225, 131, 188]),
  placeBet: Buffer.from([222, 62, 67, 220, 63, 166, 126, 33]),
  finalizeRound: Buffer.from([239, 160, 254, 11, 254, 144, 53, 148]),
  claimSol: Buffer.from([139, 113, 179, 189, 190, 30, 132, 195]),
  claimSilver: Buffer.from([204, 246, 108, 28, 241, 72, 133, 32]),
  claimBetSilver: Buffer.from([46, 247, 85, 163, 116, 213, 125, 230]),
  claimRedistribution: Buffer.from([173, 164, 210, 153, 207, 123, 195, 29]),
  createPool: Buffer.from([233, 146, 209, 142, 207, 104, 64, 188]),
  joinPool: Buffer.from([14, 65, 62, 16, 116, 17, 195, 107]),
  leavePool: Buffer.from([249, 99, 213, 170, 247, 191, 36, 115]),
  refine: Buffer.from([253, 171, 192, 242, 33, 7, 78, 49]),
  stake: Buffer.from([206, 176, 202, 18, 200, 209, 179, 108]),
  unstake: Buffer.from([90, 95, 107, 42, 205, 124, 50, 225]),
  claimStakingRewards: Buffer.from([229, 141, 170, 69, 111, 94, 6, 72]),
  triggerMotherlode: Buffer.from([38, 104, 241, 178, 123, 113, 114, 194]),
  setupAutominer: Buffer.from([128, 197, 154, 65, 118, 242, 30, 103]),
  updateAutominer: Buffer.from([217, 167, 7, 97, 251, 108, 107, 52]),
  depositAutominer: Buffer.from([204, 117, 73, 39, 163, 139, 28, 53]),
  withdrawAutominer: Buffer.from([24, 21, 63, 118, 223, 56, 127, 115]),
  disableAutominer: Buffer.from([251, 149, 151, 36, 36, 144, 62, 90]),
  crankAutominer: Buffer.from([141, 112, 153, 229, 204, 66, 30, 56]),
};

// Account discriminators
export const ACCOUNT_DISCRIMINATORS = {
  config: Buffer.from([155, 12, 170, 224, 30, 250, 204, 130]),
  miner: Buffer.from([223, 113, 15, 54, 123, 122, 140, 100]),
  pool: Buffer.from([241, 154, 109, 4, 17, 177, 109, 188]),
  round: Buffer.from([87, 127, 165, 51, 73, 78, 116, 174]),
  bet: Buffer.from([147, 23, 35, 59, 15, 75, 155, 32]),
  autominer: Buffer.from([48, 148, 141, 250, 248, 159, 16, 132]),
};
