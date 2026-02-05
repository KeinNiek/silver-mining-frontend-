import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { useStore } from '../hooks/useStore';
import { useProgram } from '../hooks/useProgram';
import { formatSOL, formatAmount, MINE_NAMES, EMISSIONS, STAKING_APR, MAX_POOL_MEMBERS, shortenAddress, ROUND_DURATION, LARGE_BET_THRESHOLD, PROGRAM_ID, UNLOCK_THRESHOLDS, CRANK_FEE_LAMPORTS, SOCIAL_LINKS, SOL_PRICE_URL, SILVER_PRICE_URL } from '../utils/constants';
import { 
  PickaxeIcon, GemIcon, FlameIcon, TrophyIcon, ClockIcon, UsersIcon, BoltIcon,
  ChartIcon, WalletIcon, BlockIcon, RefreshIcon, AlertIcon, CheckIcon, PlusIcon,
  InfoIcon, SlotMachineIcon, WrenchIcon, DiceIcon, GasIcon, StarIcon, HistoryIcon,
  DiscordIcon, XTwitterIcon, TelegramIcon, ExternalLinkIcon, SearchIcon
} from './Icons';

export default function Dashboard() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { balances, miner, config, round, pool, autominer, isLoading, solPrice, setSolPrice, silverPrice, setSilverPrice } = useStore();
  const { 
    placeBet, stake, unstake, refine, createPool, joinPool, leavePool,
    finalizeRound, initializeMiner, setupAutominer, updateAutominer,
    depositAutominer, withdrawAutominer, disableAutominer,
    fetchConfig, fetchBalances, fetchMiner, fetchRound, fetchBet, fetchPool,
    claimSol, collectMotherlode, triggerMotherlode,
    claimAllRewards, adminResetMotherlode,
  } = useProgram();

  const [activeTab, setActiveTab] = useState('mine');
  const [selectedBlocks, setSelectedBlocks] = useState([true, true, true, true, true]);
  const [solPerBlock, setSolPerBlock] = useState('0.1');
  const [currentBet, setCurrentBet] = useState<any>(null);
  const [previousRoundBet, setPreviousRoundBet] = useState<any>(null);
  const [previousRoundData, setPreviousRoundData] = useState<any>(null);
  const [, setDisplayedRoundBet] = useState<any>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [poolFee, setPoolFee] = useState('2.5');
  const [poolMineLevel, setPoolMineLevel] = useState(0);
  const [availablePools, setAvailablePools] = useState<any[]>([]);
  const [loadingPools, setLoadingPools] = useState(false);
  const [showLargeBetConfirm, setShowLargeBetConfirm] = useState(false);
  const [autoMineLevel, setAutoMineLevel] = useState(0);
  const [autoSolPerBlock, setAutoSolPerBlock] = useState('0.1');
  const autoReload = false;
  const [autoDepositAmount, setAutoDepositAmount] = useState('');
  const [autoWithdrawAmount, setAutoWithdrawAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);
  const [showClaimConfirm, setShowClaimConfirm] = useState(false);

  const blocksCount = selectedBlocks.filter(b => b).length;
  const totalBet = blocksCount * parseFloat(solPerBlock || '0');
  const winChance = (blocksCount / 5) * 100;

  // Staking validation helpers
  const silverBalance = balances.silver / Math.pow(10, 9);
  const stakedBalance = miner ? miner.stakedAmount / Math.pow(10, 9) : 0;
  const stakeAmountNum = parseFloat(stakeAmount || '0');
  const unstakeAmountNum = parseFloat(unstakeAmount || '0');
  const showStakeOverflow = stakeAmountNum > 0 && balances.silver > 0 && stakeAmountNum > silverBalance;
  const showUnstakeOverflow = unstakeAmountNum > 0 && !!miner && unstakeAmountNum > stakedBalance;
  const stakeDisabled = !stakeAmount || stakeAmountNum <= 0 || isLoading || balances.silver === 0;
  const unstakeDisabled = !unstakeAmount || unstakeAmountNum <= 0 || isLoading || !miner || miner.stakedAmount === 0;

  // Round timer
  useEffect(() => {
    if (!config?.roundStartTime) return;
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, ROUND_DURATION - (now - config.roundStartTime));
      setTimeLeft(remaining);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [config?.roundStartTime]);

  // Refresh data every 3s
  useEffect(() => {
    if (!wallet.publicKey) return;
    const refreshAll = async () => {
      try {
        await fetchConfig();
        await fetchBalances();
        await fetchMiner();
        const currentConfig = useStore.getState().config;
        if (currentConfig?.currentRound && currentConfig.currentRound > 0) {
          await fetchRound(currentConfig.currentRound);
        }
      } catch (e) { console.error('Refresh error:', e); }
    };
    refreshAll();
    const interval = setInterval(refreshAll, 3000);
    return () => clearInterval(interval);
  }, [wallet.publicKey]);

  // Fetch SOL price every 60s
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(SOL_PRICE_URL);
        const data = await res.json();
        if (data?.solana?.usd) setSolPrice(data.solana.usd);
      } catch { /* price fetch is best-effort */ }
      // SILVER price from Jupiter
      try {
        const res = await fetch(SILVER_PRICE_URL);
        const data = await res.json();
        // Jupiter returns { data: { [mintAddress]: { price: "X.XX" } } }
        const prices = data?.data;
        if (prices) {
          const firstKey = Object.keys(prices)[0];
          if (firstKey && prices[firstKey]?.price) {
            setSilverPrice(parseFloat(prices[firstKey].price));
          }
        }
      } catch { /* price fetch is best-effort */ }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, [setSolPrice, setSilverPrice]);

  // Fetch round data when config changes
  useEffect(() => {
    if (config?.currentRound && config.currentRound > 0) fetchRound(config.currentRound);
  }, [config?.currentRound, fetchRound]);

  // Fetch bets
  useEffect(() => {
    const loadBets = async () => {
      if (config?.currentRound && wallet.publicKey) {
        const bet = await fetchBet(config.currentRound);
        setCurrentBet(bet);
        if (round?.roundNumber) {
          const displayedBet = await fetchBet(round.roundNumber);
          setDisplayedRoundBet(displayedBet);
        }
        if (config.currentRound > 1) {
          const prevBet = await fetchBet(config.currentRound - 1);
          setPreviousRoundBet(prevBet);
          const prevRoundNum = config.currentRound - 1;
          const [prevRoundPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('round'), Buffer.from(new BigUint64Array([BigInt(prevRoundNum)]).buffer)],
            PROGRAM_ID
          );
          const prevRoundAccount = await connection.getAccountInfo(prevRoundPDA);
          if (prevRoundAccount) {
            const data = prevRoundAccount.data;
            let offset = 8; // discriminator
            offset += 8; // roundNum
            offset += 8; // startTime
            offset += 8; // endTime
            const finalized = data.readUInt8(offset) === 1; offset += 1;
            const winningBlock = data.readUInt8(offset); offset += 1;
            const isSolo = data.readUInt8(offset) === 1; offset += 1;
            const soloWinner = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
            offset += 8; // solo_seed
            offset += 8; // solo_best_score
            const totalPot = Number(data.readBigUInt64LE(offset)); offset += 8;
            const blockTotals: number[] = [];
            for (let i = 0; i < 5; i++) { blockTotals.push(Number(data.readBigUInt64LE(offset))); offset += 8; }
            const winnerPot = Number(data.readBigUInt64LE(offset));
            setPreviousRoundData({
              finalized, winningBlock, isSolo,
              soloWinner: isSolo ? soloWinner.toBase58() : null,
              totalPot, winnerPot, blockTotals,
            });
          }
        }
      }
    };
    loadBets();
  }, [config?.currentRound, round?.roundNumber, wallet.publicKey, fetchBet]);

  const bettingOpen = timeLeft > 0;

  // Load pools
  useEffect(() => {
    const loadPools = async () => {
      if (!config?.totalPools || config.totalPools === 0) { setAvailablePools([]); return; }
      setLoadingPools(true);
      try {
        const pools: any[] = [];
        const total = Math.min(Number(config.totalPools), 20);
        for (let i = 0; i < total; i++) {
          const poolData = await fetchPool(i);
          if (poolData && poolData.active) pools.push({ id: i, ...poolData });
        }
        setAvailablePools(pools);
      } catch (e) { console.error('Failed to load pools:', e); }
      finally { setLoadingPools(false); }
    };
    if (config?.totalPools !== undefined) loadPools();
  }, [config?.totalPools, activeTab, fetchPool]);

  const handleBlockToggle = (index: number) => {
    const newBlocks = [...selectedBlocks];
    newBlocks[index] = !newBlocks[index];
    if (newBlocks.filter(b => b).length > 0) setSelectedBlocks(newBlocks);
  };

  const handlePlaceBet = async () => {
    if (!miner) { await initializeMiner(); return; }
    const totalBetAmount = selectedBlocks.filter(b => b).length * parseFloat(solPerBlock);
    if (totalBetAmount > LARGE_BET_THRESHOLD && !showLargeBetConfirm) { setShowLargeBetConfirm(true); return; }
    setShowLargeBetConfirm(false);
    await placeBet(miner.currentMine, selectedBlocks, parseFloat(solPerBlock));
    if (config?.currentRound) { const bet = await fetchBet(config.currentRound); setCurrentBet(bet); }
  };
  const cancelLargeBet = () => setShowLargeBetConfirm(false);
  const handleStake = async () => { if (!stakeAmount || parseFloat(stakeAmount) <= 0) return; await stake(parseFloat(stakeAmount)); setStakeAmount(''); };
  const handleUnstake = async () => { if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) return; await unstake(parseFloat(unstakeAmount)); setUnstakeAmount(''); };
  const handleRefine = async () => { await refine(); };
  const handleCreatePool = async () => {
    const feeBps = Math.floor(parseFloat(poolFee) * 100);
    await createPool(feeBps, poolMineLevel);
    await new Promise(r => setTimeout(r, 1000));
    await fetchConfig(); await fetchMiner();
    await new Promise(r => setTimeout(r, 500));
    await loadAllPools();
  };
  const loadAllPools = async () => {
    if (!config?.totalPools) return;
    setLoadingPools(true);
    try {
      const pools: any[] = [];
      for (let i = 0; i < Math.min(Number(config.totalPools), 20); i++) {
        const poolData = await fetchPool(i);
        if (poolData && poolData.active) pools.push({ id: i, ...poolData });
      }
      setAvailablePools(pools);
    } catch (e) { console.error('Failed to load pools:', e); }
    finally { setLoadingPools(false); }
  };
  const handleLeavePool = async () => { await leavePool(); };
  const handleFinalizeRound = async () => { await finalizeRound(); };
  const handleSetupAutominer = async () => { await setupAutominer(autoMineLevel, autoReload, parseFloat(autoSolPerBlock)); };
  const handleUpdateAutominer = async () => { await updateAutominer(autoMineLevel, autoReload, parseFloat(autoSolPerBlock), true); };
  const handleDepositAutominer = async () => { if (!autoDepositAmount || parseFloat(autoDepositAmount) <= 0) return; await depositAutominer(parseFloat(autoDepositAmount)); setAutoDepositAmount(''); };
  const handleWithdrawAutominer = async () => { if (!autoWithdrawAmount || parseFloat(autoWithdrawAmount) <= 0) return; await withdrawAutominer(parseFloat(autoWithdrawAmount)); setAutoWithdrawAmount(''); };
  const handleDisableAutominer = async () => { await disableAutominer(); };

  // Mine progress helper
  const currentMine = miner?.currentMine || 0;
  const nextMine = currentMine < 4 ? currentMine + 1 : null;
  const nextThreshold = nextMine !== null ? UNLOCK_THRESHOLDS[nextMine] : 0;
  const currentThreshold = UNLOCK_THRESHOLDS[currentMine];
  // totalSolWon is used as a proxy for "total unrefined refined" for mine progression
  // In the actual contract, mine unlocking is based on total_refined amount
  const totalRefined = miner?.totalSolWon ? Number(formatAmount(miner.totalSolWon, 0)) : 0;

  // Estimated staking rewards (live calculation between on-chain updates)
  const estimatedStakingRewards = (() => {
    if (!miner || miner.stakedAmount <= 0) return '0.00';
    const stakedTokens = Number(formatAmount(miner.stakedAmount, 9));
    const pendingBase = Number(formatAmount(miner.pendingRewards, 9));
    const now = Math.floor(Date.now() / 1000);
    const elapsed = Math.max(0, now - (miner.lastStakeTime || 0));
    const yearSeconds = 365.25 * 24 * 3600;
    const apr = (config?.stakingApr || STAKING_APR * 100) / 10000;
    const accrued = stakedTokens * apr * (elapsed / yearSeconds);
    return (pendingBase + accrued).toFixed(4);
  })();


  if (!wallet.connected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-8 sm:p-10 text-center max-w-md w-full">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
            <WalletIcon className="w-7 h-7 text-copper-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
          <p className="text-silver-400 mb-6 text-sm">Connect your Solana wallet to start mining</p>
          <WalletMultiButton />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-8">
      {/* Initialize Miner Banner */}
      {!miner && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-amber-400 text-sm">Initialize your miner account to start playing!</p>
          </div>
          <button onClick={initializeMiner} disabled={isLoading} className="btn-primary py-2 px-4 text-sm flex-shrink-0">
            {isLoading ? 'Init...' : 'Initialize Miner'}
          </button>
        </motion.div>
      )}

      {/* Stats Row */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">

        {/* Motherlode Announcement Banner */}
        {config && config.motherlodePrize > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="col-span-2 sm:col-span-3 lg:col-span-5 bg-gradient-to-r from-copper-800/40 via-copper-700/25 to-copper-800/40 border border-copper-500/40 rounded-xl p-3 sm:p-4 mb-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-copper-500/20 flex items-center justify-center flex-shrink-0">
                  <SlotMachineIcon className="w-5 h-5 text-copper-300" />
                </div>
                <div>
                  <p className="text-copper-300 font-bold text-sm sm:text-base">MOTHERLODE JACKPOT HIT!</p>
                  <p className="text-copper-400/80 text-xs">
                    Round {config.motherlodeRoundNumber} — Prize: <span className="font-bold text-copper-300">{formatSOL(config.motherlodePrize)} SOL</span>
                  </p>
                </div>
              </div>
              {config.motherlodeWinnerKey && config.motherlodeWinnerKey.toBase58() !== '11111111111111111111111111111111' && (
                <div className="text-right">
                  <p className="text-emerald-400 font-bold text-sm flex items-center gap-1.5 justify-end">
                    <TrophyIcon className="w-4 h-4" />
                    Winner: {wallet.publicKey && config.motherlodeWinnerKey.equals(wallet.publicKey) ? 'YOU!' : shortenAddress(config.motherlodeWinnerKey.toBase58())}
                  </p>
                  <p className="text-silver-500 text-xs font-mono">{config.motherlodeWinnerKey.toBase58()}</p>
                  {(() => {
                    const roundsSince = config.currentRound - config.motherlodeRoundNumber;
                    const secsLeft = Math.max(0, 3600 - roundsSince * 30);
                    const minsLeft = Math.ceil(secsLeft / 60);
                    return secsLeft > 0 
                      ? <p className="text-copper-300 text-xs mt-1 flex items-center gap-1 justify-end"><ClockIcon className="w-3 h-3" /> Collect in ~{minsLeft}min</p>
                      : <p className="text-emerald-300 text-xs mt-1 flex items-center gap-1 justify-end"><CheckIcon className="w-3 h-3" /> Ready to collect!</p>;
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        )}

        <div className="card p-3 sm:p-5">
          <div className="flex items-center gap-1.5 text-silver-500 text-xs mb-1">
            <ClockIcon className="w-3.5 h-3.5 text-copper-500" /><span>Round</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-white">{config?.currentRound || 0}</p>
        </div>
        <div className="card p-3 sm:p-5">
          <div className="flex items-center gap-1.5 text-silver-500 text-xs mb-1">
            <WalletIcon className="w-3.5 h-3.5 text-emerald-500" /><span>Round Pot</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-emerald-400">{formatSOL(round?.totalPot || 0)}<span className="text-xs sm:text-sm ml-1 text-silver-500">SOL</span></p>
        </div>
        <div className="stat-card-copper p-3 sm:p-5">
          <div className="flex items-center gap-1.5 text-white/70 text-xs mb-1">
            <TrophyIcon className="w-3.5 h-3.5" /><span>Motherlode</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-white">{config ? formatSOL(config.motherlodeBalance + (config.motherlodePrize || 0)) : '0'}</p>
          {config && config.motherlodePrize > 0 && (
            <p className="text-xs text-copper-200 mt-0.5 flex items-center gap-1"><DiceIcon className="w-3 h-3" /> Raffle active</p>
          )}
        </div>
        <div className="card p-3 sm:p-5">
          <div className="flex items-center gap-1.5 text-silver-500 text-xs mb-1">
            <ChartIcon className="w-3.5 h-3.5 text-copper-500" /><span>Total Won</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-emerald-400">{formatSOL(miner?.totalSolWon || 0)}<span className="text-xs sm:text-sm ml-1 text-silver-500">SOL</span></p>
        </div>
        <div className="card p-3 sm:p-5">
          <div className="flex items-center gap-1.5 text-silver-500 text-xs mb-1">
            <PickaxeIcon className="w-3.5 h-3.5 text-copper-500" /><span>Mine</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-white">{MINE_NAMES[currentMine]?.split(' ')[0] || 'Copper'}</p>
          {solPrice > 0 && (
            <p className="text-xs text-silver-500 mt-0.5">SOL ${solPrice.toFixed(2)}</p>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 sm:mb-6 p-1 sm:p-1.5 bg-silver-900/50 rounded-xl border border-silver-800/50 overflow-x-auto scrollbar-hide">
        {[
          { id: 'mine', label: 'Mine', icon: PickaxeIcon },
          { id: 'pool', label: 'Pool', icon: UsersIcon },
          { id: 'stake', label: 'Stake', icon: GemIcon },
          { id: 'refine', label: 'Refine', icon: FlameIcon },
          { id: 'auto', label: 'AutoMiner', icon: BoltIcon },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-copper-500 text-white shadow-lg' : 'text-silver-400 hover:text-white hover:bg-silver-800/50'
            }`}>
            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          {/* ===== MINE TAB ===== */}
          {activeTab === 'mine' && (
            <div className="card p-4 sm:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
                    <PickaxeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
                  </div>
                  Place Your Bet
                </h2>
                <span className="badge-copper text-xs">{EMISSIONS[currentMine]} SILVER/win</span>
              </div>

              <div className="mb-6 sm:mb-8">
                <label className="label mb-2">Select Blocks ({blocksCount}/5)</label>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <button key={i} onClick={() => handleBlockToggle(i)}
                      className={`p-2.5 sm:p-5 rounded-xl border-2 transition-all ${
                        selectedBlocks[i]
                          ? 'bg-copper-500/15 border-copper-400 shadow-[0_0_20px_rgba(var(--accent-rgb),0.2)]'
                          : 'bg-silver-900/30 border-silver-700/50 hover:border-silver-600'
                      }`}>
                      <BlockIcon className={`w-5 sm:w-7 h-5 sm:h-7 mx-auto mb-1 ${selectedBlocks[i] ? 'text-copper-400' : 'text-silver-600'}`} />
                      <p className={`text-xs font-semibold ${selectedBlocks[i] ? 'text-copper-400' : 'text-silver-500'}`}>Block {i + 1}</p>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-3 text-xs sm:text-sm">
                  <span className={`font-semibold ${winChance === 100 ? 'text-emerald-400' : winChance >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    {winChance.toFixed(0)}% Win Chance
                  </span>
                  <span className="text-silver-500">{blocksCount === 5 ? 'Safe Mode' : blocksCount >= 3 ? 'Balanced' : 'High Risk'}</span>
                </div>
              </div>

              <div className="mb-6 sm:mb-8">
                <label className="label mb-2">SOL Per Block</label>
                <div className="relative">
                  <input type="number" value={solPerBlock} onChange={(e) => setSolPerBlock(e.target.value)}
                    className="input-lg pr-16" placeholder="0.1" step="0.01" min="0" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-silver-500 font-medium text-sm">SOL</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {['0.1', '0.5', '1', '5'].map((val) => (
                    <button key={val} onClick={() => setSolPerBlock(val)}
                      className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm rounded-lg border transition-colors ${
                        solPerBlock === val ? 'bg-copper-500/20 border-copper-500/50 text-copper-400' 
                          : 'bg-silver-800/30 border-silver-700/50 text-silver-400 hover:border-copper-500/30'
                      }`}>{val}</button>
                  ))}
                </div>
              </div>

              <div className="bg-silver-900/50 rounded-xl p-4 sm:p-5 mb-5 border border-silver-800/50">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-silver-400">Blocks × SOL</span>
                  <span className="text-silver-300">{blocksCount} × {solPerBlock} SOL</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold">
                  <span className="text-silver-300">Total Bet</span>
                  <span className="text-copper-400">{totalBet.toFixed(4)} SOL</span>
                </div>
                {solPrice > 0 && <p className="text-right text-xs text-silver-500 mt-1">≈ ${(totalBet * solPrice).toFixed(2)} USD</p>}
              </div>

              {totalBet > LARGE_BET_THRESHOLD && !showLargeBetConfirm && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 mb-5 flex items-start gap-2.5">
                  <AlertIcon className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-400 text-sm">High Bet Warning</p>
                    <p className="text-silver-400 text-xs">You're betting more than {LARGE_BET_THRESHOLD} SOL.</p>
                  </div>
                </div>
              )}

              {showLargeBetConfirm && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 sm:p-5 mb-5">
                  <div className="flex items-start gap-2.5 mb-4">
                    <AlertIcon className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-red-400">Confirm Large Bet</p>
                      <p className="text-silver-300 mt-1 text-sm">Betting <span className="font-bold text-white">{totalBet.toFixed(4)} SOL</span>. This cannot be undone.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={cancelLargeBet} className="flex-1 py-2.5 px-4 rounded-lg bg-silver-800 hover:bg-silver-700 text-silver-300 transition-colors text-sm">Cancel</button>
                    <button onClick={handlePlaceBet} disabled={isLoading} className="flex-1 py-2.5 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors text-sm">
                      {isLoading ? 'Processing...' : 'Confirm Bet'}
                    </button>
                  </div>
                </div>
              )}

              {!showLargeBetConfirm && (
                <button onClick={handlePlaceBet}
                  disabled={blocksCount === 0 || totalBet === 0 || isLoading || !config?.initialized || !bettingOpen || !!currentBet} 
                  className="btn-primary w-full py-3 sm:py-4 text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? 'Processing...' : !miner ? 'Initialize Miner First' : !bettingOpen ? 'Betting Closed' : currentBet ? 'Bet Already Placed' : `Place Bet — ${totalBet.toFixed(4)} SOL`}
                </button>
              )}

              <p className="text-center text-xs text-silver-500 mt-3">
                Balance: <span className="text-silver-300 font-medium">{formatSOL(balances.sol)} SOL</span>
                {solPrice > 0 && <span className="text-silver-600 ml-1">(${(Number(formatSOL(balances.sol)) * solPrice).toFixed(2)})</span>}
              </p>
            </div>
          )}

          {/* ===== STAKE TAB ===== */}
          {activeTab === 'stake' && (
            <div className="card p-4 sm:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
                    <GemIcon className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
                  </div>
                  Stake SILVER
                </h2>
                <span className="badge-success">{config?.stakingApr ? config.stakingApr / 100 : STAKING_APR}% APR</span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="card p-4 sm:p-5">
                  <p className="text-xs text-silver-500 mb-1.5">Staked Balance</p>
                  <p className="text-xl sm:text-3xl font-bold text-white">{formatAmount(miner?.stakedAmount || 0)}</p>
                </div>
                <div className="stat-card-copper p-4 sm:p-5">
                  <p className="text-xs text-white/70 mb-1.5">Pending Rewards</p>
                  <p className="text-xl sm:text-3xl font-bold text-white">{miner && miner.stakedAmount > 0 ? estimatedStakingRewards : formatAmount(miner?.pendingRewards || 0)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="label">Stake Amount</label>
                    <span className="text-xs text-silver-500">{"Available: "}<span className="text-copper-400 font-semibold">{formatAmount(balances.silver)}</span>{" SILVER"}</span>
                  </div>
                  <div className="relative">
                    <input type="number" className="input pr-20" placeholder="Amount to stake" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} min="0" step="any" />
                    <button onClick={() => setStakeAmount(formatAmount(balances.silver, 9))} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-copper-500/20 text-copper-400 rounded hover:bg-copper-500/30">MAX</button>
                  </div>
                  {showStakeOverflow && (
                    <p className="text-red-400 text-xs mt-1.5">Insufficient SILVER balance</p>
                  )}
                  {balances.silver === 0 && (
                    <p className="text-amber-400 text-xs mt-1.5">You need SILVER to stake. Refine UNREFINED to get SILVER.</p>
                  )}
                </div>
                <button onClick={handleStake} className="btn-primary w-full" disabled={stakeDisabled}>
                  {isLoading ? 'Processing...' : 'Stake SILVER'}
                </button>

                <div className="border-t border-silver-800/50 my-4 sm:my-6 pt-4 sm:pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="label">Unstake Amount</label>
                    <span className="text-xs text-silver-500">{"Staked: "}<span className="text-white font-semibold">{formatAmount(miner?.stakedAmount || 0)}</span></span>
                  </div>
                  <div className="relative">
                    <input type="number" className="input pr-20" placeholder="Amount to unstake" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)} min="0" step="any" />
                    <button onClick={() => setUnstakeAmount(formatAmount(miner?.stakedAmount || 0, 9))} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-copper-500/20 text-copper-400 rounded hover:bg-copper-500/30">MAX</button>
                  </div>
                  {showUnstakeOverflow && (
                    <p className="text-red-400 text-xs mt-1.5">Amount exceeds staked balance</p>
                  )}
                </div>
                <button onClick={handleUnstake} className="btn-secondary w-full" disabled={unstakeDisabled}>
                  {isLoading ? 'Processing...' : 'Unstake SILVER'}
                </button>

                <div className="border-t border-silver-800/50 my-4 sm:my-6 pt-4 sm:pt-6">
                  <div className="card p-4 sm:p-5 mb-4 border border-copper-500/20 bg-copper-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <GemIcon className="w-4 h-4 text-copper-400" />
                      <h4 className="text-copper-400 font-semibold text-sm">All Pending Rewards</h4>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-silver-400">Staking Rewards</span>
                        <span className="text-white font-semibold">{miner && miner.stakedAmount > 0 ? estimatedStakingRewards : formatAmount(miner?.pendingRewards || 0)} SILVER</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-silver-400">Pending UNREFINED</span>
                        <span className="text-white font-semibold">{formatAmount(miner?.pendingUnrefined || 0)} UNREFINED</span>
                      </div>
                      {config && config.redistributionPool > 0 && (
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-silver-400">Redistribution Pool</span>
                          <span className="text-emerald-400 font-semibold">~{formatSOL(config.redistributionPool / (config.totalUnrefinedHolders || 1))} SOL</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setShowClaimConfirm(true)} className="btn-primary w-full text-sm sm:text-base py-2.5 sm:py-3 flex items-center justify-center gap-2" disabled={isLoading}>
                    <PickaxeIcon className="w-4 h-4" />
                    {isLoading ? 'Scanning & Claiming...' : 'Claim All Rewards'}
                  </button>
                  <p className="text-center text-xs text-silver-600 mt-2 flex items-center justify-center gap-1">
                    <InfoIcon className="w-3 h-3" /> Wallet may show a simulation warning for batched TXs
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===== REFINE TAB ===== */}
          {activeTab === 'refine' && (
            <div className="card p-4 sm:p-8">
              <div className="flex items-center gap-2.5 mb-6 sm:mb-8">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
                  <FlameIcon className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Refine UNREFINED</h2>
              </div>

              <div className="stat-card-copper p-5 sm:p-6 mb-5">
                <p className="text-xs sm:text-sm text-white/70 mb-1.5">Your UNREFINED Balance</p>
                <p className="text-3xl sm:text-4xl font-bold text-white">{formatAmount(balances.unrefined)}</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 mb-5 flex items-start gap-2.5">
                <AlertIcon className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-400 text-sm">10% Burn Fee</p>
                  <p className="text-silver-400 text-xs">10% is burned and redistributed to UNREFINED holders.</p>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-5">
                <div className="flex justify-between p-3 bg-silver-900/50 rounded-lg text-sm">
                  <span className="text-silver-400">You refine</span>
                  <span className="text-white font-semibold">{formatAmount(balances.unrefined)} UNREFINED</span>
                </div>
                <div className="flex justify-between p-3 bg-silver-900/50 rounded-lg text-sm">
                  <span className="text-silver-400">Burn fee (10%)</span>
                  <span className="text-red-400 font-semibold">-{formatAmount(balances.unrefined * 0.1)}</span>
                </div>
                <div className="flex justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-sm">
                  <span className="text-silver-400">You receive</span>
                  <span className="text-emerald-400 font-semibold">{formatAmount(balances.unrefined * 0.9)} SILVER</span>
                </div>
              </div>

              <button onClick={handleRefine} className="btn-primary w-full" disabled={balances.unrefined <= 0 || isLoading}>
                {isLoading ? 'Processing...' : 'Refine All UNREFINED'}
              </button>

              {miner && ((miner.pendingUnrefined > 0) || (config && config.redistributionPool > 0) || (miner.pendingRewards > 0)) && (
                <div className="mt-5 p-4 bg-copper-500/5 border border-copper-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <GemIcon className="w-4 h-4 text-copper-400" />
                    <h4 className="text-copper-400 font-semibold text-sm">Pending Rewards</h4>
                  </div>
                  <div className="space-y-1.5 mb-3">
                    {miner.pendingUnrefined > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-silver-400">UNREFINED from mining</span>
                        <span className="text-emerald-400 font-semibold">{formatAmount(miner.pendingUnrefined)}</span>
                      </div>
                    )}
                    {miner.pendingRewards > 0 && (
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-silver-400">Staking rewards</span>
                        <span className="text-copper-400 font-semibold">{formatAmount(miner.pendingRewards)} SILVER</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowClaimConfirm(true)}
                    className="w-full py-2.5 px-4 bg-copper-600 hover:bg-copper-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    disabled={isLoading}>
                    <PickaxeIcon className="w-4 h-4" />
                    {isLoading ? 'Claiming...' : 'Claim All Rewards'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===== POOL TAB ===== */}
          {activeTab === 'pool' && (
            <div className="card p-4 sm:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
                    <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
                  </div>
                  Mining Pools
                </h2>
                <span className="badge-copper text-xs">Max {MAX_POOL_MEMBERS}</span>
              </div>

              {miner?.isInPool && pool ? (
                <div>
                  <div className="bg-copper-500/10 border border-copper-500/30 rounded-xl p-4 sm:p-6 mb-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-white">Your Pool</h3>
                      <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs">Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                      <div><p className="text-silver-500 text-xs">Pool ID</p><p className="text-copper-400 font-bold text-base sm:text-lg">#{pool.poolId}</p></div>
                      <div><p className="text-silver-500 text-xs">Mine Level</p><p className="text-white font-semibold text-sm">{MINE_NAMES[pool.mineLevel]}</p></div>
                      <div><p className="text-silver-500 text-xs">Pool Fee</p><p className="text-white font-semibold text-sm">{(pool.feeBps / 100).toFixed(2)}%</p></div>
                      <div><p className="text-silver-500 text-xs">Members</p><p className="text-white font-semibold text-sm">{pool.memberCount}/{MAX_POOL_MEMBERS}</p></div>
                      <div><p className="text-silver-500 text-xs">Creator</p><p className="text-white font-semibold text-sm">{shortenAddress(pool.creator.toBase58())}</p></div>
                      <div><p className="text-silver-500 text-xs">You Are</p><p className="text-copper-400 font-semibold text-sm">{pool.creator.toBase58() === wallet.publicKey?.toBase58() ? 'Owner' : 'Member'}</p></div>
                    </div>
                    <div className="p-2.5 bg-silver-900/50 rounded-lg">
                      <p className="text-silver-500 text-xs mb-1">Share this Pool ID:</p>
                      <p className="text-copper-400 font-mono text-base sm:text-lg">#{pool.poolId}</p>
                    </div>

                    {pool.creator.toBase58() === wallet.publicKey?.toBase58() && (
                      <div className="mt-4 p-3 sm:p-4 bg-copper-500/5 border border-copper-500/15 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <TrophyIcon className="w-4 h-4 text-copper-400" />
                          <h4 className="text-copper-400 font-semibold text-sm">Pool Owner Earnings</h4>
                        </div>
                        <div className="space-y-1.5 text-xs sm:text-sm">
                          <div className="flex justify-between"><span className="text-silver-400">Fee Rate</span><span className="text-copper-400 font-bold">{(pool.feeBps / 100).toFixed(2)}%</span></div>
                          <div className="flex justify-between"><span className="text-silver-400">Active Members</span><span className="text-white font-semibold">{pool.memberCount - 1} (+ you)</span></div>
                          <div className="flex justify-between"><span className="text-silver-400">Fee Per Win</span><span className="text-emerald-400 font-semibold">{(pool.feeBps / 100).toFixed(2)}% of SOL</span></div>
                        </div>
                        <p className="text-silver-500 text-xs mt-2">Fees sent directly to your wallet — no claiming needed.</p>
                      </div>
                    )}
                  </div>
                  {pool.creator.toBase58() === wallet.publicKey?.toBase58() ? (
                    <p className="text-silver-500 text-xs text-center mt-4">Pool creators cannot leave their own pool.</p>
                  ) : (
                    <button onClick={handleLeavePool} className="btn-secondary w-full mt-4" disabled={isLoading}>
                      {isLoading ? 'Leaving...' : 'Leave Pool'}
                    </button>
                  )}
                </div>
              ) : miner?.isInPool ? (
                <div className="text-center py-8"><p className="text-silver-400 text-sm">Loading pool data...</p></div>
              ) : (
                <div className="space-y-6 sm:space-y-8">
                  <div className="bg-silver-900/30 rounded-xl p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-white">Browse Pools</h3>
                      <button onClick={loadAllPools} className="btn-secondary px-3 py-1.5 text-xs" disabled={loadingPools}>
                        {loadingPools ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>
                    {availablePools.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {availablePools.map((p) => (
                          <div key={p.id} className="p-2.5 sm:p-3 bg-silver-800/50 rounded-lg flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-white font-semibold text-sm">Pool #{p.id}</p>
                              <p className="text-silver-400 text-xs truncate">{MINE_NAMES[p.mineLevel]} · {(p.feeBps / 100).toFixed(1)}% · {p.memberCount}/{MAX_POOL_MEMBERS}</p>
                            </div>
                            <button onClick={() => joinPool(p.id)} className="btn-primary px-3 py-1 text-xs flex-shrink-0" disabled={isLoading || p.memberCount >= MAX_POOL_MEMBERS}>
                              {p.memberCount >= MAX_POOL_MEMBERS ? 'Full' : 'Join'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-silver-500 text-sm">{config?.totalPools ? 'Click Refresh to load' : 'No pools yet'}</p>
                    )}
                    <p className="text-silver-500 text-xs mt-2">Total pools: {config?.totalPools || 0}</p>
                  </div>

                  <div className="bg-silver-900/30 rounded-xl p-4 sm:p-6">
                    <h3 className="text-base font-semibold text-white mb-3">Join by Pool ID</h3>
                    <div className="flex gap-2">
                      <input type="number" className="input flex-1" placeholder="Pool ID" id="poolIdInput" min="0" />
                      <button onClick={() => {
                        const input = document.getElementById('poolIdInput') as HTMLInputElement;
                        const poolId = parseInt(input.value);
                        if (!isNaN(poolId) && poolId >= 0) joinPool(poolId);
                      }} className="btn-primary px-5" disabled={isLoading}>
                        {isLoading ? '...' : 'Join'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-white mb-3">Create New Pool</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="label mb-1.5">Pool Fee (%)</label>
                        <input type="number" className="input" placeholder="2.5" value={poolFee} onChange={(e) => setPoolFee(e.target.value)} min="0" max="10" step="0.1" />
                        <p className="text-silver-500 text-xs mt-1">Max 10%</p>
                      </div>
                      <div>
                        <label className="label mb-1.5">Mine Level</label>
                        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                          {MINE_NAMES.map((name, i) => {
                            const unlocked = i <= currentMine;
                            return (
                              <button key={i} onClick={() => unlocked && setPoolMineLevel(i)} disabled={!unlocked}
                                className={`p-2 sm:p-3 rounded-lg border text-center transition-all ${
                                  poolMineLevel === i ? 'bg-copper-500/20 border-copper-500 text-copper-400'
                                    : unlocked ? 'bg-silver-800/30 border-silver-700/50 text-silver-400 hover:border-copper-500/30'
                                    : 'bg-silver-900/30 border-silver-800/30 text-silver-600 cursor-not-allowed'
                                }`}>
                                <p className="text-xs font-semibold">{name.split(' ')[0]}</p>
                                <p className="text-xs opacity-60">{EMISSIONS[i]}x</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <button onClick={handleCreatePool} className="btn-primary w-full flex items-center justify-center gap-2" disabled={isLoading}>
                        <PlusIcon className="w-4 h-4" />
                        {isLoading ? 'Creating...' : 'Create Pool'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== AUTOMINER TAB ===== */}
          {activeTab === 'auto' && (
            <div className="card p-4 sm:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
                    <BoltIcon className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
                  </div>
                  AutoMiner
                </h2>
                <span className="badge-copper text-xs">Hands-free</span>
              </div>

              <div className="bg-copper-500/8 border border-copper-500/20 rounded-xl p-3 sm:p-4 mb-5">
                <p className="text-copper-300 text-xs sm:text-sm">
                  AutoMiner bets all 5 blocks every round (100% win rate). Deposit SOL, configure strategy, mine 24/7. Non-custodial — your funds are in a PDA, not anyone's wallet.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div className="card p-4 sm:p-5">
                  <p className="text-xs text-silver-500 mb-1">Balance</p>
                  <p className="text-xl sm:text-3xl font-bold text-white">{formatSOL(autominer?.balance || 0)}<span className="text-xs text-silver-500 ml-1">SOL</span></p>
                </div>
                <div className="card p-4 sm:p-5">
                  <p className="text-xs text-silver-500 mb-1">Status</p>
                  <p className={`text-lg sm:text-xl font-bold ${autominer?.enabled ? 'text-emerald-400' : 'text-silver-500'}`}>
                    {autominer ? (autominer.enabled ? 'Active' : 'Disabled') : 'Not Setup'}
                  </p>
                </div>
              </div>

              {/* AutoMiner stats with cost breakdown */}
              {autominer && (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 bg-silver-900/50 rounded-lg">
                    <p className="text-silver-500 text-xs">Total Bets</p>
                    <p className="text-white font-semibold">{autominer.totalBetsPlaced}</p>
                  </div>
                  <div className="p-3 bg-silver-900/50 rounded-lg">
                    <p className="text-silver-500 text-xs">Total Winnings</p>
                    <p className="text-emerald-400 font-semibold">{formatSOL(autominer.totalWinnings)} SOL</p>
                  </div>
                </div>
              )}

              {/* Cost Breakdown - transparent gas vs bet separation */}
              {autominer?.enabled && (() => {
                const betCost = (autominer.solPerBlock || 0) * 5;
                const gasCost = CRANK_FEE_LAMPORTS;
                const totalCost = betCost + gasCost;
                const roundsLeft = totalCost > 0 ? Math.floor(autominer.balance / totalCost) : 0;
                const hoursLeft = (roundsLeft * 30 / 3600).toFixed(1);
                return (
                  <div className="bg-silver-900/30 rounded-xl p-3 sm:p-4 mb-5 border border-silver-800/50">
                    <div className="flex items-center gap-2 mb-2.5">
                      <GasIcon className="w-4 h-4 text-copper-400" />
                      <h4 className="text-copper-400 font-semibold text-xs">Cost Breakdown Per Round</h4>
                    </div>
                    <div className="space-y-1.5 text-xs sm:text-sm">
                      <div className="flex justify-between">
                        <span className="text-silver-400 flex items-center gap-1.5"><PickaxeIcon className="w-3 h-3" /> Bet (5 blocks × {formatSOL(autominer.solPerBlock)})</span>
                        <span className="text-white font-semibold">{formatSOL(betCost)} SOL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-silver-400 flex items-center gap-1.5"><GasIcon className="w-3 h-3" /> Crank fee (gas)</span>
                        <span className="text-silver-300 font-semibold">{formatSOL(gasCost)} SOL</span>
                      </div>
                      <div className="flex justify-between border-t border-silver-700/50 pt-1.5 mt-1.5">
                        <span className="text-silver-300 font-medium">Total per round</span>
                        <span className="text-copper-400 font-bold">{formatSOL(totalCost)} SOL</span>
                      </div>
                      {solPrice > 0 && (
                        <p className="text-right text-xs text-silver-500">≈ ${(Number(formatSOL(totalCost)) * solPrice).toFixed(4)} USD</p>
                      )}
                    </div>
                    <div className="mt-3 flex justify-between items-center p-2 rounded-lg bg-silver-800/40">
                      <span className="text-silver-400 text-xs">Rounds remaining</span>
                      <span className={`font-bold text-sm ${roundsLeft > 10 ? 'text-emerald-400' : roundsLeft > 3 ? 'text-amber-400' : 'text-red-400'}`}>
                        {roundsLeft} (~{hoursLeft}h)
                      </span>
                    </div>
                  </div>
                );
              })()}

              {autominer?.enabled && autominer.balance < ((autominer.solPerBlock || 0) * 5 + CRANK_FEE_LAMPORTS) && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <AlertIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs">Insufficient balance! Deposit more SOL to continue mining.</p>
                </div>
              )}

              <div className="space-y-3 sm:space-y-4 mb-5">
                <div>
                  <label className="label mb-1.5">Select Mine</label>
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {MINE_NAMES.map((name, i) => {
                      const unlocked = i <= currentMine;
                      return (
                        <button key={i} onClick={() => unlocked && setAutoMineLevel(i)} disabled={!unlocked}
                          className={`p-2 sm:p-3 rounded-lg border text-center transition-all ${
                            autoMineLevel === i ? 'bg-copper-500/20 border-copper-500 text-copper-400'
                              : unlocked ? 'bg-silver-800/30 border-silver-700/50 text-silver-400 hover:border-copper-500/30'
                              : 'bg-silver-900/30 border-silver-800/30 text-silver-600 cursor-not-allowed'
                          }`}>
                          <p className="text-xs font-semibold">{name.split(' ')[0]}</p>
                          <p className="text-xs opacity-60">{EMISSIONS[i]}x</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="label mb-1.5">SOL Per Block</label>
                  <input type="number" className="input" placeholder="0.1" step="0.01" min="0"
                    value={autoSolPerBlock} onChange={(e) => setAutoSolPerBlock(e.target.value)} />
                </div>
              </div>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="label mb-1.5">Deposit SOL</label>
                  <div className="flex gap-2">
                    <input type="number" className="input flex-1" placeholder="Amount" value={autoDepositAmount} onChange={(e) => setAutoDepositAmount(e.target.value)} />
                    <button onClick={handleDepositAutominer} className="btn-primary px-5" disabled={!autoDepositAmount || parseFloat(autoDepositAmount) <= 0 || isLoading || !autominer}>
                      {isLoading ? '...' : 'Deposit'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label mb-1.5">Withdraw SOL</label>
                  <div className="flex gap-2">
                    <input type="number" className="input flex-1" placeholder="Amount" value={autoWithdrawAmount} onChange={(e) => setAutoWithdrawAmount(e.target.value)} />
                    <button onClick={handleWithdrawAutominer} className="btn-secondary px-5" disabled={!autoWithdrawAmount || parseFloat(autoWithdrawAmount) <= 0 || isLoading || !autominer}>
                      {isLoading ? '...' : 'Withdraw'}
                    </button>
                  </div>
                  <p className="text-silver-500 text-xs mt-1">Daily limit: 2 SOL</p>
                </div>
              </div>

              {!autominer ? (
                <button onClick={handleSetupAutominer} className="btn-primary w-full" disabled={isLoading}>
                  {isLoading ? 'Setting up...' : 'Setup AutoMiner'}
                </button>
              ) : (
                <div className="space-y-3">
                  <button onClick={handleUpdateAutominer} className="btn-primary w-full" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Settings'}
                  </button>
                  <button onClick={handleDisableAutominer} className="btn-secondary w-full" disabled={isLoading || !autominer.enabled}>
                    {isLoading ? 'Processing...' : 'Disable AutoMiner'}
                  </button>

                  {autominer.enabled && (
                    <div className="border-t border-silver-800/50 pt-4 mt-4">
                      <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                          <div>
                            <p className="text-emerald-300 font-semibold text-sm">AutoMiner Active</p>
                            <p className="text-emerald-400/70 text-xs">Crank bot places bets automatically — no action needed.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!autominer.enabled && (
                    <p className="text-copper-400 text-xs text-center flex items-center justify-center gap-1">
                      <AlertIcon className="w-3 h-3" /> Enable by updating settings above
                    </p>
                  )}
                </div>
              )}

              {/* AutoMiner Analytics / History */}
              {autominer && autominer.totalBetsPlaced > 0 && (() => {
                const totalBets = autominer.totalBetsPlaced;
                const totalWon = autominer.totalWinnings;
                const currentBetPerRound = (autominer.solPerBlock || 0) * 5;
                const estimatedCrankFees = totalBets * CRANK_FEE_LAMPORTS;
                const estimatedBetVolume = totalBets * currentBetPerRound;
                const estimatedTotalCost = estimatedBetVolume + estimatedCrankFees;
                const netPL = totalWon - estimatedTotalCost;
                return (
                  <div className="mt-5 border-t border-silver-800/50 pt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <HistoryIcon className="w-4 h-4 text-copper-400" />
                      <h4 className="text-copper-400 font-semibold text-sm">AutoMiner Analytics</h4>
                    </div>
                    <div className="bg-silver-900/30 rounded-xl p-3 sm:p-4 border border-silver-800/50 space-y-2">
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="p-2.5 rounded-lg bg-silver-800/30 text-center">
                          <p className="text-silver-500 text-xs">Rounds Played</p>
                          <p className="text-white font-bold text-lg">{totalBets.toLocaleString()}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-silver-800/30 text-center">
                          <p className="text-silver-500 text-xs">Escrow Balance</p>
                          <p className="text-white font-bold text-lg">{formatSOL(autominer.balance)}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-silver-400">Total Winnings</span>
                          <span className="text-emerald-400 font-semibold">{formatSOL(totalWon)} SOL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-silver-400">Est. Bet Volume</span>
                          <span className="text-silver-300">{formatSOL(estimatedBetVolume)} SOL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-silver-400">Est. Crank Fees</span>
                          <span className="text-silver-300">{formatSOL(estimatedCrankFees)} SOL</span>
                        </div>
                        <div className="flex justify-between border-t border-silver-700/50 pt-1.5 mt-1.5">
                          <span className="text-silver-300 font-medium">Est. Net P&L</span>
                          <span className={`font-bold ${netPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {netPL >= 0 ? '+' : ''}{formatSOL(netPL)} SOL
                          </span>
                        </div>
                        {solPrice > 0 && (
                          <p className={`text-right text-xs ${netPL >= 0 ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                            ≈ {netPL >= 0 ? '+' : ''}${(Number(formatSOL(netPL)) * solPrice).toFixed(2)} USD
                          </p>
                        )}
                      </div>
                      <p className="text-silver-600 text-xs mt-2 italic">* Estimates based on current bet size. Actual may differ if you changed settings.</p>
                    </div>

                    {/* Autoclaim Note */}
                    <div className="mt-3 p-2.5 rounded-lg bg-silver-900/30 border border-silver-800/40 flex items-start gap-2">
                      <InfoIcon className="w-3.5 h-3.5 text-copper-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-silver-500">
                        <p><span className="text-silver-300 font-medium">Why can't winnings auto-claim?</span></p>
                        <p className="mt-0.5">Silver Mining is non-custodial — the crank bot can place bets from your escrow but <span className="text-silver-300">cannot touch your rewards</span>. Only your wallet can sign claim transactions. Use <span className="text-copper-400">Claim All Rewards</span> to batch-claim everything.</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Motherlode Section */}
              {config && (config.motherlodeBalance > 0 || config.motherlodePrize > 0) && (
                <div className="mt-5 p-4 bg-copper-500/8 border border-copper-500/20 rounded-xl">
                  <div className="flex items-center justify-between">
                    <h4 className="text-copper-400 font-semibold flex items-center gap-2 text-sm">
                      <SlotMachineIcon className="w-4 h-4" /> Motherlode Jackpot
                    </h4>
                    <span className="text-copper-300 font-bold text-sm">{formatSOL(config.motherlodeBalance + (config.motherlodePrize || 0))} SOL</span>
                  </div>
                  {config.motherlodePrize > 0 ? (
                    <div className="mt-3 space-y-2">
                      <div className="bg-copper-500/15 border border-copper-400/30 rounded-lg p-2.5">
                        <p className="text-copper-200 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                          <SlotMachineIcon className="w-3.5 h-3.5" /> MOTHERLODE HIT — ROUND {config.motherlodeRoundNumber}
                        </p>
                        <p className="text-copper-300 text-xs text-center mt-1">Prize: <span className="font-bold">{formatSOL(config.motherlodePrize)} SOL</span></p>
                      </div>

                      {/* Raffle explanation */}
                      <div className="p-2.5 bg-silver-900/40 rounded-lg border border-silver-800/50">
                        <p className="text-silver-300 text-xs font-medium mb-1.5 flex items-center gap-1"><InfoIcon className="w-3 h-3 text-copper-400" /> How the Motherlode Raffle Works</p>
                        <div className="space-y-1.5 text-xs text-silver-500">
                          <p><span className="text-white font-medium">1.</span> Motherlode triggers at a hidden random round (100-1,000 rounds apart)</p>
                          <p><span className="text-white font-medium">2.</span> All players who claim SOL from the trigger round automatically enter the raffle</p>
                          <p><span className="text-white font-medium">3.</span> Your score: <span className="text-copper-300 font-mono">tx_hash / bet_size</span></p>
                          <p><span className="text-white font-medium">4.</span> <span className="text-copper-300">Lowest score wins</span> &mdash; bigger bets = better odds, but the hash adds randomness so small bets can still win</p>
                          <p><span className="text-white font-medium">5.</span> After 1 hour, the best scorer collects the entire jackpot</p>
                        </div>
                      </div>

                      {config.motherlodeWinnerKey && config.motherlodeWinnerKey.toBase58() !== '11111111111111111111111111111111' ? (
                        <div>
                          <p className="text-emerald-400 text-sm font-semibold flex items-center gap-1.5">
                            <TrophyIcon className="w-4 h-4" /> Winner: {wallet.publicKey && config.motherlodeWinnerKey.equals(wallet.publicKey) ? 'YOU!' : shortenAddress(config.motherlodeWinnerKey.toBase58())}
                          </p>
                          <p className="text-silver-500 text-xs mt-0.5 font-mono">{config.motherlodeWinnerKey.toBase58()}</p>
                          {(() => {
                            const roundsSince = config.currentRound - config.motherlodeRoundNumber;
                            const secsLeft = Math.max(0, 3600 - roundsSince * 30);
                            const minsLeft = Math.ceil(secsLeft / 60);
                            return secsLeft > 0 
                              ? <div className="mt-2 p-2 bg-copper-900/20 border border-copper-500/15 rounded-lg">
                                  <p className="text-copper-300 text-xs text-center flex items-center justify-center gap-1"><ClockIcon className="w-3 h-3" /> Claim opens in ~{minsLeft} min</p>
                                  <p className="text-silver-500 text-xs text-center mt-0.5">1-hour wait after round {config.motherlodeRoundNumber}</p>
                                </div>
                              : <p className="text-emerald-400 text-xs mt-2 text-center font-semibold flex items-center justify-center gap-1"><CheckIcon className="w-3 h-3" /> Claim window OPEN!</p>;
                          })()}
                          <button onClick={collectMotherlode} disabled={isLoading}
                            className="mt-2 w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                            {isLoading ? 'Collecting...' : 'Collect Motherlode Prize'}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-silver-400 text-xs mb-2">Claim SOL from round {config.motherlodeRoundNumber} to enter the raffle!</p>
                          <button onClick={() => claimSol(config.motherlodeRoundNumber)} disabled={isLoading}
                            className="w-full py-2 px-4 bg-copper-600 hover:bg-copper-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                            {isLoading ? 'Claiming...' : `Claim SOL from Round ${config.motherlodeRoundNumber}`}
                          </button>
                          {wallet.publicKey && config.authority && wallet.publicKey.equals(config.authority) && (
                            <button onClick={adminResetMotherlode} disabled={isLoading}
                              className="w-full mt-2 py-2 px-4 bg-red-600/80 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                              <WrenchIcon className="w-3 h-3" /> Admin: Reset Stuck Motherlode
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2">
                      {config.motherlodeTarget > config.currentRound
                        ? <p className="text-silver-500 text-xs flex items-center gap-1"><GemIcon className="w-3 h-3" /> Growing each round...</p>
                        : <button onClick={triggerMotherlode} disabled={isLoading}
                            className="w-full mt-1 py-2 px-4 bg-copper-600 hover:bg-copper-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 animate-pulse flex items-center justify-center gap-1.5">
                            <SlotMachineIcon className="w-4 h-4" /> Trigger Motherlode Jackpot!
                          </button>
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* ===== SIDEBAR ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3 sm:space-y-4">
          {/* Round Timer */}
          <div className="card p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-silver-300 flex items-center gap-1.5">
                <ClockIcon className="w-3.5 h-3.5 text-copper-400" /> Round Timer
              </h3>
              <span className="text-xs text-silver-500 font-mono">#{config?.currentRound || 0}</span>
            </div>
            <div className="text-center py-2">
              <p className={`text-3xl sm:text-4xl font-bold font-mono ${timeLeft <= 5 ? 'text-red-400' : timeLeft <= 15 ? 'text-amber-400' : 'text-white'}`}>
                {timeLeft}s
              </p>
              <p className="text-xs text-silver-500 mt-1">
                {bettingOpen ? 'Betting open' : 'Awaiting finalization'}
              </p>
            </div>
            {!bettingOpen && (
              <button onClick={handleFinalizeRound} className="btn-primary w-full mt-2 py-2 text-xs sm:text-sm" disabled={isLoading}>
                <RefreshIcon className="w-3.5 h-3.5" />
                {isLoading ? 'Finalizing...' : 'Finalize Round (earn 3%)'}
              </button>
            )}
          </div>

          {/* Quick Social Links - Moved up for visibility */}
          <div className="card p-3 sm:p-4">
            <h3 className="text-xs font-semibold text-silver-300 mb-2.5 flex items-center gap-1.5">
              <UsersIcon className="w-3.5 h-3.5 text-copper-400" /> Join the Community
            </h3>
            <div className="space-y-1.5">
              {SOCIAL_LINKS.discord && (
                <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-copper-500/15 hover:bg-copper-500/20 border border-copper-500/25 hover:border-copper-500/40 transition-all group">
                  <DiscordIcon className="w-5 h-5 text-copper-400 group-hover:text-copper-300" />
                  <div className="flex-1">
                    <span className="text-copper-300 text-sm font-semibold">Discord</span>
                    <p className="text-copper-400/60 text-xs">Chat, strategy, updates</p>
                  </div>
                  <ExternalLinkIcon className="w-3 h-3 text-silver-600" />
                </a>
              )}
              {SOCIAL_LINKS.telegram && (
                <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-copper-500/10 hover:bg-copper-500/15 border border-copper-500/20 hover:border-copper-500/30 transition-all group">
                  <TelegramIcon className="w-5 h-5 text-copper-400 group-hover:text-copper-300" />
                  <div className="flex-1">
                    <span className="text-copper-300 text-sm font-medium">Telegram</span>
                    <p className="text-silver-500 text-xs">Announcements</p>
                  </div>
                  <ExternalLinkIcon className="w-3 h-3 text-silver-600" />
                </a>
              )}
              <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-2 rounded-lg bg-silver-800/40 hover:bg-copper-500/10 border border-silver-700/40 hover:border-copper-500/20 transition-all">
                <XTwitterIcon className="w-4 h-4 text-silver-400" />
                <span className="text-silver-300 text-xs font-medium">Follow on X</span>
                <ExternalLinkIcon className="w-3 h-3 text-silver-600 ml-auto" />
              </a>
            </div>
          </div>

          {/* Previous Round Result */}
          {previousRoundData?.finalized && (
            <div className={`card p-3 sm:p-4 ${previousRoundBet?.blocks?.[previousRoundData.winningBlock] ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-silver-700/30'}`}>
              <h3 className="text-xs font-semibold text-silver-300 flex items-center gap-1.5 mb-2">
                <HistoryIcon className="w-3.5 h-3.5 text-copper-400" /> Previous Round
              </h3>
              <div className="space-y-2">
                {previousRoundBet && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm sm:text-base font-bold ${previousRoundBet.blocks?.[previousRoundData.winningBlock] ? 'text-emerald-400' : 'text-red-400'}`}>
                        {previousRoundBet.blocks?.[previousRoundData.winningBlock] ? 'You Won!' : 'You Lost'}
                      </p>
                      <p className="text-xs text-silver-500">Block {previousRoundData.winningBlock + 1} won</p>
                    </div>
                    {previousRoundBet.totalSol != null && (
                      <div className="text-right">
                        <p className="text-xs text-silver-500">Your bet</p>
                        <p className="text-xs sm:text-sm text-white font-semibold">{formatSOL(previousRoundBet.totalSol)} SOL</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Round winner info */}
                <div className="pt-2 border-t border-silver-800/50 space-y-1">
                  {previousRoundData.totalPot > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-silver-500">Pot</span>
                      <span className="text-silver-300">{formatSOL(previousRoundData.totalPot)} SOL</span>
                    </div>
                  )}
                  {previousRoundData.winnerPot > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-silver-500">Winner payout</span>
                      <span className="text-emerald-400 font-medium">{formatSOL(previousRoundData.winnerPot)} SOL</span>
                    </div>
                  )}
                  {previousRoundData.isSolo && previousRoundData.soloWinner && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-silver-500 flex items-center gap-1"><TrophyIcon className="w-3 h-3 text-copper-400" /> Winner</span>
                      <span className={`font-mono ${wallet.publicKey?.toBase58() === previousRoundData.soloWinner ? 'text-emerald-400 font-bold' : 'text-silver-300'}`}>
                        {wallet.publicKey?.toBase58() === previousRoundData.soloWinner ? 'YOU' : shortenAddress(previousRoundData.soloWinner)}
                      </span>
                    </div>
                  )}
                  {!previousRoundData.isSolo && previousRoundData.finalized && (
                    <p className="text-xs text-silver-500 italic">Multiple winners — shared pot</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mine Progress */}
          {miner && nextMine !== null && (
            <div className="card p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-silver-300 flex items-center gap-1.5 mb-2">
                <StarIcon className="w-3.5 h-3.5 text-copper-400" /> Mine Progress
              </h3>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-copper-400 font-medium">{MINE_NAMES[currentMine]}</span>
                <span className="text-silver-500">{MINE_NAMES[nextMine]}</span>
              </div>
              <div className="w-full h-2 bg-silver-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${nextThreshold > currentThreshold ? Math.min(100, ((totalRefined - currentThreshold) / (nextThreshold - currentThreshold)) * 100) : 0}%`,
                    background: 'linear-gradient(90deg, var(--accent-500), var(--accent-400))'
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-silver-400">{totalRefined.toFixed(1)} refined</span>
                <span className="text-silver-500">{nextThreshold} needed</span>
              </div>
              <p className="text-xs text-copper-400 mt-1 font-medium flex items-center gap-1">
                <PickaxeIcon className="w-3 h-3" />
                {Math.max(0, nextThreshold - totalRefined).toFixed(1)} more to unlock
              </p>
              {/* Show available unrefined that could be refined */}
              {balances.unrefined > 0 && (
                <div className="mt-2 pt-2 border-t border-silver-800/50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-silver-500">Available UNREFINED</span>
                    <span className="text-silver-300 font-medium">{formatAmount(balances.unrefined)}</span>
                  </div>
                  <p className="text-xs text-silver-500 mt-0.5">
                    Refining gives {(Number(formatAmount(balances.unrefined)) * 0.9).toFixed(1)} SILVER (10% fee)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Estimated Staking Rewards */}
          {miner && miner.stakedAmount > 0 && (
            <div className="card p-3 sm:p-4">
              <h3 className="text-xs font-semibold text-silver-300 flex items-center gap-1.5 mb-2">
                <GemIcon className="w-3.5 h-3.5 text-copper-400" /> Staking
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-silver-400">Staked</span>
                  <span className="text-white font-semibold">{formatAmount(miner.stakedAmount)} SILVER</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-silver-400">Est. Rewards</span>
                  <span className="text-emerald-400 font-semibold">{estimatedStakingRewards} SILVER</span>
                </div>
              </div>
            </div>
          )}

          {/* SOL & SILVER Price */}
          <div className="card p-3 sm:p-4">
            <h3 className="text-xs font-semibold text-silver-300 flex items-center gap-1.5 mb-2">
              <ChartIcon className="w-3.5 h-3.5 text-copper-400" /> Live Prices
            </h3>
            <div className="space-y-2">
              {solPrice > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-silver-400">SOL</span>
                  <span className="text-sm text-white font-semibold">${solPrice.toFixed(2)}</span>
                </div>
              )}
              {silverPrice > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-copper-400">SILVER</span>
                  <span className="text-sm text-copper-300 font-semibold">${silverPrice.toFixed(6)}</span>
                </div>
              )}
              {silverPrice <= 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-copper-400">SILVER</span>
                  <span className="text-xs text-silver-500 italic">Price TBD after DEX listing</span>
                </div>
              )}
            </div>
          </div>

          {/* Claim All Rewards (sidebar shortcut) */}
          {miner && (
            <div className="card p-3 sm:p-4">
              <button onClick={() => setShowClaimConfirm(true)}
                className="btn-primary w-full py-2 text-xs sm:text-sm flex items-center justify-center gap-1.5" disabled={isLoading}>
                <PickaxeIcon className="w-3.5 h-3.5" />
                {isLoading ? 'Claiming...' : 'Claim All Rewards'}
              </button>
              <p className="text-center text-xs text-silver-600 mt-1.5">
                Scans recent rounds for unclaimed wins
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Claim All Confirmation Dialog */}
      {showClaimConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowClaimConfirm(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-5 sm:p-6 max-w-sm w-full" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
                <PickaxeIcon className="w-5 h-5 text-copper-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Claim All Rewards</h3>
                <p className="text-xs text-silver-500">Batch scan &amp; claim</p>
              </div>
            </div>
            <div className="space-y-2.5 mb-5">
              <div className="p-2.5 bg-silver-900/50 rounded-lg text-xs text-silver-400 flex items-start gap-2">
                <InfoIcon className="w-3.5 h-3.5 text-copper-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="mb-1">Scans recent rounds for unclaimed SOL + UNREFINED, plus staking rewards and redistribution pool share.</p>
                  <p className="text-silver-500">Only scans from your last claim onward for faster results.</p>
                </div>
              </div>
              <div className="p-3 bg-amber-500/8 border border-amber-500/20 rounded-lg text-xs">
                <div className="flex items-start gap-2">
                  <AlertIcon className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-amber-300 font-semibold mb-1">Wallet Simulation Warning</p>
                    <p className="text-amber-400/90 leading-relaxed">Your wallet will show "simulation failed" or a warning. <span className="text-amber-300 font-medium">This is normal and safe.</span></p>
                    <p className="text-amber-400/70 mt-1.5 leading-relaxed">Claim All bundles multiple transactions together. Wallets can't pre-simulate bundled TXs because each depends on the previous one's result. The transactions themselves are standard on-chain claims.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button onClick={() => setShowClaimConfirm(false)} className="btn-secondary flex-1 py-2 text-sm">Cancel</button>
                <button onClick={() => { setShowClaimConfirm(false); claimAllRewards(); }} className="btn-primary flex-1 py-2 text-sm" disabled={isLoading}>
                  {isLoading ? 'Claiming...' : 'Confirm & Claim'}
                </button>
              </div>
              <button
                onClick={() => { setShowClaimConfirm(false); claimAllRewards(true); }}
                className="w-full py-2 px-4 bg-silver-800/60 hover:bg-silver-800/80 border border-silver-700/50 hover:border-copper-500/30 text-silver-400 hover:text-copper-400 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                disabled={isLoading}
                title="Scans ALL rounds from the very first one — use if you have old unclaimed rewards"
              >
                <SearchIcon className="w-3 h-3" />
                Deep Scan (recover old rewards)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
