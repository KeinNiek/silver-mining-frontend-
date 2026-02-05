import { PublicKey } from '@solana/web3.js';

// UPDATED: Correct mainnet program ID
export const PROGRAM_ID = new PublicKey('CiKNKPpdC55EpnVD5nDF5kSHVUHu1Q3kiKUstdsHPmtV');
export const ADMIN_WALLET = new PublicKey('G1MfDRETA6zuCSHV7vkB82HFL5XCz2Pb9rKy1JZ9PCmk');
export const AUTHORITY_WALLET = new PublicKey('629HQAktPmCazs3Y8Q9a1j7hNha9Wmm4rJcyvxrd434v');
export const WARCHEST_WALLET = new PublicKey('2YaT2cNFDHTg8YcjGbjgyUFDLYSdKk4fh9qY9Q2YMkg3');

export const LAMPORTS_PER_SOL = 1_000_000_000;
export const TOKEN_DECIMALS = 9;
export const ROUND_DURATION = 30;
export const LARGE_BET_THRESHOLD = 1; // 1 SOL

export const EMISSIONS = [1, 2, 4, 8, 16];
export const UNLOCK_THRESHOLDS = [0, 15, 50, 100, 200];
export const MINE_NAMES = ['Copper Pit', 'Iron Quarry', 'Gold Vein', 'Diamond Deep', 'Motherlode'];

export const STAKING_APR = 20;
export const MAX_POOL_FEE = 5;
export const MAX_POOL_MEMBERS = 25;

export const SOCIAL_LINKS = {
  twitter: 'https://x.com/silversupplyo?s=21',
  discord: 'https://discord.gg/9exmAHRHV',
  telegram: 'https://t.me/silversupply',
};

// Claim-all optimization: scan last N rounds by default (30s each = ~16.7h of rounds)
export const DEFAULT_SCAN_RANGE = 2000;

// AutoMiner crank fee in lamports (~0.00151 SOL)
export const CRANK_FEE_LAMPORTS = 1_510_000;

// AutoMiner gas fee estimate per round (priority fee + base tx fee in lamports)
export const AUTOMINER_GAS_PER_ROUND = 10_000;

// CoinGecko SOL price endpoint (no API key needed)
export const SOL_PRICE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

// SILVER token mint (community-confirmed)
export const SILVER_MINT_ADDRESS = 'ELXUqFZwPMmgQepCXSyq6YTRR3gXLWmB1Etr4g4stUHq';
export const SILVER_PRICE_URL = `https://api.jup.ag/price/v2?ids=${SILVER_MINT_ADDRESS}`;

// Solscan base URLs
export const SOLSCAN_TX_URL = 'https://solscan.io/tx/';
export const SOLSCAN_ACCOUNT_URL = 'https://solscan.io/account/';

// Claim-all optimization: localStorage key for last scanned round
export const LAST_CLAIM_SCAN_KEY = 'silver_last_claim_scan';

export const formatAmount = (amount: number | bigint, decimals = 2): string => {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  return (num / Math.pow(10, TOKEN_DECIMALS)).toFixed(decimals);
};

export const formatSOL = (lamports: number | bigint, decimals = 4): string => {
  const num = typeof lamports === 'bigint' ? Number(lamports) : lamports;
  return (num / LAMPORTS_PER_SOL).toFixed(decimals);
};

export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};
