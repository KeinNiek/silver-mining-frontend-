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
export const MAX_POOL_MEMBERS = 100;

export const SOCIAL_LINKS = {
  twitter: 'https://x.com/silversupplyo?s=21',
  discord: 'https://discord.gg/9exmAHRHV',
};

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
