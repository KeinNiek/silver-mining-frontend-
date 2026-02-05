import { create } from 'zustand';
import { PublicKey } from '@solana/web3.js';

export type TabType = 'mine' | 'refine' | 'stake' | 'pool' | 'autominer';

interface Balances {
  sol: number;
  silver: number;
  unrefined: number;
}

interface MinerData {
  owner: PublicKey;
  currentMine: number;
  totalSolWon: number;
  pool: PublicKey;
  isInPool: boolean;
  stakedAmount: number;
  pendingRewards: number;
  lastStakeTime: number;
  pendingUnrefined: number;
  lastRedistributionClaim: number;
  bump: number;
}

interface ConfigData {
  authority: PublicKey;
  silverMint: PublicKey;
  unrefinedMint: PublicKey;
  currentRound: number;
  roundStartTime: number;
  totalUnrefinedSupply: number;
  totalSilverSupply: number;
  totalStaked: number;
  totalPools: number;
  motherlodeBalance: number;
  motherlodeTarget: number;
  stakingApr: number;
  autominerTreasury: number;
  redistributionPool: number;
  totalUnrefinedHolders: number;
  configBump: number;
  silverBump: number;
  unrefinedBump: number;
  initialized: boolean;
  paused: boolean;
  // v2 fields
  adminMintedSilver: number;
  motherlodeRoundNumber: number;
  motherlodePrize: number;
  motherlodeWinnerKey: PublicKey;
  motherlodeBestScore: number;
}

interface PoolData {
  creator: PublicKey;
  mineLevel: number;
  feeBps: number;
  memberCount: number;
  members: PublicKey[];
  active: boolean;
  bump: number;
  poolId: number;
}

interface RoundData {
  roundNumber: number;
  startTime: number;
  endTime: number;
  finalized: boolean;
  winningBlock: number;
  isSolo: boolean;
  soloWinner: PublicKey | null;
  totalPot: number;
  blockTotals: number[];
  winnerPot: number;
  bump: number;
}

interface AutoMinerData {
  owner: PublicKey;
  enabled: boolean;
  mineLevel: number;
  autoReload: boolean;
  balance: number;
  solPerBlock: number;
  dailyWithdrawn: number;
  lastWithdrawalDay: number;
  totalBetsPlaced: number;
  totalWinnings: number;
  bump: number;
}

interface BetData {
  miner: PublicKey;
  round: number;
  mineLevel: number;
  blocks: boolean[];
  solPerBlock: number;
  totalSol: number;
  claimed: boolean;
  silverClaimed: boolean;
  bump: number;
}

interface AppState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  balances: Balances;
  setBalances: (balances: Balances) => void;
  miner: MinerData | null;
  setMiner: (miner: MinerData | null) => void;
  config: ConfigData | null;
  setConfig: (config: ConfigData | null) => void;
  pool: PoolData | null;
  setPool: (pool: PoolData | null) => void;
  round: RoundData | null;
  setRound: (round: RoundData | null) => void;
  autominer: AutoMinerData | null;
  setAutominer: (autominer: AutoMinerData | null) => void;
  currentBet: BetData | null;
  setCurrentBet: (bet: BetData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  solPrice: number;
  setSolPrice: (price: number) => void;
  silverPrice: number;
  setSilverPrice: (price: number) => void;
}

export const useStore = create<AppState>((set) => ({
  activeTab: 'mine',
  setActiveTab: (tab) => set({ activeTab: tab }),
  balances: { sol: 0, silver: 0, unrefined: 0 },
  setBalances: (balances) => set({ balances }),
  miner: null,
  setMiner: (miner) => set({ miner }),
  config: null,
  setConfig: (config) => set({ config }),
  pool: null,
  setPool: (pool) => set({ pool }),
  round: null,
  setRound: (round) => set({ round }),
  autominer: null,
  setAutominer: (autominer) => set({ autominer }),
  currentBet: null,
  setCurrentBet: (currentBet) => set({ currentBet }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  solPrice: 0,
  setSolPrice: (solPrice) => set({ solPrice }),
  silverPrice: 0,
  setSilverPrice: (silverPrice) => set({ silverPrice }),
}));
