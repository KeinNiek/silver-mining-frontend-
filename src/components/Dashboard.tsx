import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { useStore } from '../hooks/useStore';
import { useProgram } from '../hooks/useProgram';
import { formatSOL, formatAmount, MINE_NAMES, EMISSIONS, STAKING_APR, MAX_POOL_MEMBERS, shortenAddress, ROUND_DURATION, LARGE_BET_THRESHOLD, PROGRAM_ID } from '../utils/constants';
import { 
  PickaxeIcon, GemIcon, FlameIcon, TrophyIcon, ClockIcon, UsersIcon, BoltIcon,
  ChartIcon, WalletIcon, BlockIcon, RefreshIcon, LockIcon, AlertIcon, CheckIcon, PlusIcon
} from './Icons';

export default function Dashboard() {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { balances, miner, config, round, pool, autominer, isLoading } = useStore();
  const { 
    placeBet, 
    stake, 
    unstake, 
    claimRewards, 
    refine, 
    createPool,
    joinPool,
    leavePool,
    finalizeRound,
    initializeMiner,
    setupAutominer,
    updateAutominer,
    depositAutominer,
    withdrawAutominer,
    disableAutominer,
    fetchConfig,
    fetchBalances,
    fetchMiner,
    fetchRound,
    fetchBet,
    fetchPool,
    claimSol,
    claimBetSilver,
    claimAllRewards_auto,
    triggerMotherlode,
    claimRedistribution,
    // Admin
    pauseProtocol,
    unpauseProtocol,
  } = useProgram();

  const [activeTab, setActiveTab] = useState('mine');
  
  // Mine tab state
  const [selectedBlocks, setSelectedBlocks] = useState([true, true, true, true, true]);
  const [solPerBlock, setSolPerBlock] = useState('0.1');
  const [currentBet, setCurrentBet] = useState<any>(null);
  const [previousRoundBet, setPreviousRoundBet] = useState<any>(null);
  const [previousRoundData, setPreviousRoundData] = useState<any>(null);
  const [displayedRoundBet, setDisplayedRoundBet] = useState<any>(null);
  
  // Stake tab state
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  
  // Pool tab state
  const [poolFee, setPoolFee] = useState('2.5');
  const [poolMineLevel, setPoolMineLevel] = useState(0);
  const [availablePools, setAvailablePools] = useState<any[]>([]);
  const [loadingPools, setLoadingPools] = useState(false);
  
  // AutoMiner tab state

  // Large bet confirmation (UI14)
  const [showLargeBetConfirm, setShowLargeBetConfirm] = useState(false);
  const [autoMineLevel, setAutoMineLevel] = useState(0);
  const [autoSolPerBlock, setAutoSolPerBlock] = useState('0.1');
  const [autoReload, setAutoReload] = useState(false); // auto-reload disabled (server bot can't claim)
  const [autoDepositAmount, setAutoDepositAmount] = useState('');
  const [autoWithdrawAmount, setAutoWithdrawAmount] = useState('');
  
  // Round timer state
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION);

  // Sync AutoMiner UI form fields from on-chain data (survives page refresh)
  useEffect(() => {
    if (autominer) {
      setAutoMineLevel(autominer.mineLevel);
      setAutoSolPerBlock((autominer.solPerBlock / 1e9).toString());
      setAutoReload(autominer.autoReload);
    }
  }, [autominer?.mineLevel, autominer?.solPerBlock, autominer?.autoReload]);

  // Calculate bet details
  const blocksCount = selectedBlocks.filter(b => b).length;
  const totalBet = blocksCount * parseFloat(solPerBlock || '0');
  const winChance = (blocksCount / 5) * 100;

  // Round timer effect - use round.endTime if available
  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      if (round?.endTime && round.endTime > 0) {
        // Use actual end time from round data
        const remaining = Math.max(0, round.endTime - now);
        setTimeLeft(remaining);
      } else if (config?.roundStartTime) {
        // Fallback to calculated end time
        const elapsed = now - config.roundStartTime;
        const remaining = Math.max(0, ROUND_DURATION - elapsed);
        setTimeLeft(remaining);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [config?.roundStartTime, round?.endTime]);

  // Refresh all data periodically (every 12s — balanced for UX vs RPC)
  useEffect(() => {
    if (!wallet.publicKey) return;
    
    const refreshAll = async () => {
      try {
        await fetchConfig();
        await fetchBalances();
        await fetchMiner();
        // Also refresh round data for pot updates
        if (config?.currentRound && config.currentRound > 0) {
          await fetchRound(config.currentRound);
        }
      } catch (e) {
        // Silent refresh failure
      }
    };
    
    // Initial fetch
    refreshAll();
    
    const interval = setInterval(refreshAll, 12000);
    return () => clearInterval(interval);
  }, [wallet.publicKey]);

  // Fetch round data when config.currentRound changes
  useEffect(() => {
    if (config?.currentRound && config.currentRound > 0) {
      fetchRound(config.currentRound);
    }
  }, [config?.currentRound, fetchRound]);

  // Fetch user's bet when round changes
  useEffect(() => {
    const loadBets = async () => {
      if (config?.currentRound && wallet.publicKey) {
        // Fetch current round bet (for new round, may be null)
        const bet = await fetchBet(config.currentRound);
        setCurrentBet(bet);
        
        // Fetch bet for the displayed round (the round shown in Round Results)
        // This is important because after finalize, round.roundNumber updates
        if (round?.roundNumber) {
          const displayedBet = await fetchBet(round.roundNumber);
          setDisplayedRoundBet(displayedBet);
        }
        
        // Fetch previous round bet and data for claiming (if exists)
        if (config.currentRound > 1) {
          const prevBet = await fetchBet(config.currentRound - 1);
          setPreviousRoundBet(prevBet);
          
          // Fetch previous round data to know winning block
          const prevRoundNum = config.currentRound - 1;
          const [prevRoundPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('round'), Buffer.from(new BigUint64Array([BigInt(prevRoundNum)]).buffer)],
            PROGRAM_ID
          );
          const prevRoundAccount = await connection.getAccountInfo(prevRoundPDA);
          if (prevRoundAccount) {
            const data = prevRoundAccount.data;
            let offset = 8;
            offset += 8; // roundNum
            offset += 8; // startTime
            offset += 8; // endTime
            const finalized = data.readUInt8(offset) === 1; offset += 1;
            const winningBlock = data.readUInt8(offset);
            setPreviousRoundData({ finalized, winningBlock });
          }
        }
      }
    };
    loadBets();
  }, [config?.currentRound, round?.roundNumber, wallet.publicKey, fetchBet]);

  // Check if betting is still open
  const bettingOpen = timeLeft > 0;

  // Load pools when config changes or switching to pool tab
  useEffect(() => {
    const loadPools = async () => {

      if (!config?.totalPools || config.totalPools === 0) {

        setAvailablePools([]);
        return;
      }
      setLoadingPools(true);
      try {
        const pools: any[] = [];
        const total = Math.min(Number(config.totalPools), 20);

        for (let i = 0; i < total; i++) {
          const poolData = await fetchPool(i);

          if (poolData && poolData.active) {
            pools.push({ id: i, ...poolData });
          }
        }
        setAvailablePools(pools);

      } catch (error) {
        console.error('Failed to load pools:', error);
      } finally {
        setLoadingPools(false);
      }
    };
    
    // Always load pools when totalPools changes or on pool tab
    if (config?.totalPools !== undefined) {
      loadPools();
    }
  }, [config?.totalPools, activeTab, fetchPool]);

  // Handle block toggle
  const handleBlockToggle = (index: number) => {
    const newBlocks = [...selectedBlocks];
    newBlocks[index] = !newBlocks[index];
    if (newBlocks.filter(b => b).length > 0) {
      setSelectedBlocks(newBlocks);
    }
  };

  // Handle place bet with large bet confirmation (UI14)
  const handlePlaceBet = async () => {
    if (!miner) {
      await initializeMiner();
      return;
    }
    
    const totalBetAmount = selectedBlocks.filter(b => b).length * parseFloat(solPerBlock);
    
    // Show confirmation for bets > 20 SOL
    if (totalBetAmount > LARGE_BET_THRESHOLD && !showLargeBetConfirm) {
      setShowLargeBetConfirm(true);
      return;
    }
    
    setShowLargeBetConfirm(false);
    await placeBet(miner.currentMine, selectedBlocks, parseFloat(solPerBlock));
    
    // Refresh bet after placing
    if (config?.currentRound) {
      const bet = await fetchBet(config.currentRound);
      setCurrentBet(bet);
    }
  };

  // Cancel large bet
  const cancelLargeBet = () => {
    setShowLargeBetConfirm(false);
  };

  // Handle stake
  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) return;
    await stake(parseFloat(stakeAmount));
    setStakeAmount('');
  };

  // Handle unstake
  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) return;
    await unstake(parseFloat(unstakeAmount));
    setUnstakeAmount('');
  };

  // Handle claim rewards
  const handleClaimRewards = async () => {
    await claimRewards();
  };

  // Handle refine
  const handleRefine = async () => {
    await refine();
  };

  // Handle create pool
  const handleCreatePool = async () => {
    try {
      const feeBps = Math.floor(parseFloat(poolFee) * 100);
      if (feeBps > 500) {
        alert('Pool fee must be 5% or less');
        return;
      }
      await createPool(feeBps, poolMineLevel);
      // Wait a bit for blockchain state to update
      await new Promise(r => setTimeout(r, 1000));
      // Refresh config to get updated totalPools
      await fetchConfig();
      await fetchMiner();
      // Wait and reload pools
      await new Promise(r => setTimeout(r, 500));
      await loadAllPools();
    } catch (e: any) {
      // createPool handles its own errors, this is a safety net
      console.error('handleCreatePool error:', e);
    }
  };

  // Load all pools for browser
  const loadAllPools = async () => {
    if (!config?.totalPools) return;
    setLoadingPools(true);
    try {
      const pools: any[] = [];
      const totalPools = Math.min(Number(config.totalPools), 20); // Load max 20 pools
      for (let i = 0; i < totalPools; i++) {
        const poolData = await fetchPool(i);
        if (poolData && poolData.active) {
          pools.push({ id: i, ...poolData });
        }
      }
      setAvailablePools(pools);
    } catch (error) {
      console.error('Failed to load pools:', error);
    } finally {
      setLoadingPools(false);
    }
  };

  // Handle leave pool
  const handleLeavePool = async () => {
    await leavePool();
  };

  // Handle finalize round
  const handleFinalizeRound = async () => {
    await finalizeRound();
  };

  // Handle setup autominer
  const handleSetupAutominer = async () => {
    const solPerBlockVal = parseFloat(autoSolPerBlock);
    await setupAutominer(autoMineLevel, autoReload, solPerBlockVal);
  };

  // Handle update autominer
  const handleUpdateAutominer = async () => {
    const solPerBlockVal = parseFloat(autoSolPerBlock);
    await updateAutominer(autoMineLevel, autoReload, solPerBlockVal, true);
  };

  // Handle deposit autominer
  const handleDepositAutominer = async () => {
    if (!autoDepositAmount || parseFloat(autoDepositAmount) <= 0) return;
    await depositAutominer(parseFloat(autoDepositAmount));
    setAutoDepositAmount('');
  };

  // Handle withdraw autominer
  const handleWithdrawAutominer = async () => {
    if (!autoWithdrawAmount || parseFloat(autoWithdrawAmount) <= 0) return;
    await withdrawAutominer(parseFloat(autoWithdrawAmount));
    setAutoWithdrawAmount('');
  };

  // Handle disable autominer
  const handleDisableAutominer = async () => {
    await disableAutominer();
  };

  if (!wallet.connected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-10 text-center max-w-md w-full"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
            <WalletIcon className="w-8 h-8 text-copper-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Connect Wallet</h2>
          <p className="text-silver-400 mb-8">Connect your Solana wallet to start mining</p>
          <WalletMultiButton />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-4 sm:py-8 px-0">
      {/* Paused Banner */}
      {config?.paused && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3"
        >
          <AlertIcon className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 font-semibold text-sm sm:text-base">Protocol is paused by admin. Mining and betting are temporarily disabled.</p>
        </motion.div>
      )}

      {/* Initialize Miner Banner */}
      {!miner && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <AlertIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-amber-400 text-sm sm:text-base">Initialize your miner account to start playing!</p>
          </div>
          <button 
            onClick={initializeMiner} 
            disabled={isLoading}
            className="btn-primary py-2 px-4 w-full sm:w-auto text-sm"
          >
            {isLoading ? 'Initializing...' : 'Initialize Miner'}
          </button>
        </motion.div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8"
      >
        <div className="card p-3 sm:p-5">
          <div className="flex items-center gap-2 text-silver-500 text-xs sm:text-sm mb-1 sm:mb-2">
            <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-copper-500" />
            <span>Current Round</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-white">{config?.currentRound || 0}</p>
        </div>
        <div className="card p-3 sm:p-5">
          <div className="flex items-center gap-2 text-silver-500 text-xs sm:text-sm mb-1 sm:mb-2">
            <WalletIcon className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
            <span>Round Pot</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-emerald-400 truncate">{formatSOL(round?.totalPot || 0)} SOL</p>
        </div>
        <div className="stat-card-copper">
          <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm mb-1 sm:mb-2">
            <TrophyIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Motherlode</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-white truncate">{config ? formatSOL(config.motherlodeBalance) : '0'}</p>
        </div>
        <div className="card p-3 sm:p-5">
          <div className="flex items-center gap-2 text-silver-500 text-xs sm:text-sm mb-1 sm:mb-2">
            <ChartIcon className="w-3 h-3 sm:w-4 sm:h-4 text-copper-500" />
            <span>Total SOL Won</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-emerald-400 truncate">{formatSOL(miner?.totalSolWon || 0)}</p>
        </div>
        <div className="card p-3 sm:p-5">
          <div className="flex items-center gap-2 text-silver-500 text-xs sm:text-sm mb-1 sm:mb-2">
            <PickaxeIcon className="w-3 h-3 sm:w-4 sm:h-4 text-copper-500" />
            <span>Current Mine</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-white">{MINE_NAMES[miner?.currentMine || 0]?.split(' ')[0] || 'Copper'}</p>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 sm:mb-8 p-1.5 bg-silver-900/50 rounded-xl border border-silver-800/50 overflow-x-auto no-scrollbar">
        {[
          { id: 'mine', label: 'Mine', icon: PickaxeIcon },
          { id: 'pool', label: 'Pool', icon: UsersIcon },
          { id: 'stake', label: 'Stake', icon: GemIcon },
          { id: 'refine', label: 'Refine', icon: FlameIcon },
          { id: 'auto', label: 'AutoMiner', icon: BoltIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-copper-500 text-white shadow-lg'
                : 'text-silver-400 hover:text-white hover:bg-silver-800/50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          {activeTab === 'mine' && (
            <div className="card p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
                    <PickaxeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
                  </div>
                  Place Your Bet
                </h2>
                <span className="badge-copper text-xs">
                  {EMISSIONS[miner?.currentMine || 0]} SILVER/win
                </span>
              </div>

              {/* Blocks */}
              <div className="mb-6 sm:mb-8">
                <label className="label mb-3">Select Blocks ({blocksCount}/5)</label>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <button
                      key={i}
                      onClick={() => handleBlockToggle(i)}
                      className={`p-2 sm:p-4 md:p-5 rounded-lg sm:rounded-xl border-2 transition-all ${
                        selectedBlocks[i]
                          ? 'bg-[#aea0c5]/20 border-[#aea0c5] shadow-[0_0_20px_rgba(174,160,197,0.3)]'
                          : 'bg-silver-900/30 border-silver-700/50 hover:border-silver-600'
                      }`}
                    >
                      <BlockIcon className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 mx-auto mb-1 sm:mb-2 ${selectedBlocks[i] ? 'text-[#aea0c5]' : 'text-silver-600'}`} />
                      <p className={`text-xs font-semibold ${selectedBlocks[i] ? 'text-[#aea0c5]' : 'text-silver-500'}`}>
                        {i + 1}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between mt-4 text-sm">
                  <span className={`font-semibold ${winChance === 100 ? 'text-emerald-400' : winChance >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    {winChance.toFixed(0)}% Win Chance
                  </span>
                  <span className="text-silver-500">
                    {blocksCount === 5 ? 'Safe Mode' : blocksCount >= 3 ? 'Balanced' : 'High Risk'}
                  </span>
                </div>
              </div>

              {/* SOL Input */}
              <div className="mb-6 sm:mb-8">
                <label className="label mb-3">SOL Per Block</label>
                <div className="relative">
                  <input
                    type="number"
                    value={solPerBlock}
                    onChange={(e) => setSolPerBlock(e.target.value)}
                    className="input-lg pr-16"
                    placeholder="0.1"
                    step="0.01"
                    min="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-silver-500 font-medium">SOL</span>
                </div>
                <div className="flex gap-1.5 sm:gap-2 mt-3">
                  {['0.1', '0.5', '1', '5'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setSolPerBlock(val)}
                      className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                        solPerBlock === val 
                          ? 'bg-copper-500/20 border-copper-500/50 text-copper-400' 
                          : 'bg-silver-800/30 border-silver-700/50 text-silver-400 hover:border-copper-500/30'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-silver-900/50 rounded-xl p-5 mb-6 border border-silver-800/50">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-silver-400">Blocks × SOL</span>
                  <span className="text-silver-300">{blocksCount} × {solPerBlock} SOL</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-silver-300">Total Bet</span>
                  <span className="text-copper-400">{totalBet.toFixed(4)} SOL</span>
                </div>
              </div>

              {/* Warning */}
              {totalBet > LARGE_BET_THRESHOLD && !showLargeBetConfirm && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <AlertIcon className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-400">High Bet Warning</p>
                    <p className="text-silver-400 text-sm">You're betting more than {LARGE_BET_THRESHOLD} SOL.</p>
                  </div>
                </div>
              )}

              {/* Large Bet Confirmation Modal (UI14) */}
              {showLargeBetConfirm && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertIcon className="w-6 h-6 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-red-400 text-lg">Confirm Large Bet</p>
                      <p className="text-silver-300 mt-1">
                        You're about to bet <span className="font-bold text-white">{totalBet.toFixed(4)} SOL</span> (over {LARGE_BET_THRESHOLD} SOL).
                      </p>
                      <p className="text-silver-400 text-sm mt-2">
                        Are you sure you want to proceed? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={cancelLargeBet}
                      className="flex-1 py-3 px-4 rounded-lg bg-silver-800 hover:bg-silver-700 text-silver-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handlePlaceBet}
                      disabled={isLoading}
                      className="flex-1 py-3 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                    >
                      {isLoading ? 'Processing...' : 'Confirm Bet'}
                    </button>
                  </div>
                </div>
              )}

              {!showLargeBetConfirm && (
                <button 
                  onClick={handlePlaceBet}
                  disabled={blocksCount === 0 || totalBet === 0 || isLoading || !config?.initialized || !bettingOpen || !!currentBet} 
                  className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : !miner ? 'Initialize Miner First' : !bettingOpen ? 'Betting Closed' : currentBet ? 'Bet Already Placed' : `Place Bet — ${totalBet.toFixed(4)} SOL`}
                </button>
              )}

              <p className="text-center text-sm text-silver-500 mt-4">
                Balance: <span className="text-silver-300 font-medium">{formatSOL(balances.sol)} SOL</span>
              </p>
            </div>
          )}

          {activeTab === 'stake' && (
            <div className="card p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
                    <GemIcon className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
                  </div>
                  Stake SILVER
                </h2>
                <span className="badge-success text-xs">{config?.stakingApr ? config.stakingApr / 100 : STAKING_APR}% APR</span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="card p-3 sm:p-5">
                  <p className="text-sm text-silver-500 mb-2">Staked Balance</p>
                  <p className="text-3xl font-bold text-white">{formatAmount(miner?.stakedAmount || 0)}</p>
                </div>
                <div className="stat-card-copper">
                  <p className="text-sm text-white/70 mb-2">Pending Rewards</p>
                  <p className="text-3xl font-bold text-white">{formatAmount(miner?.pendingRewards || 0)}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="label mb-2">Stake Amount</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="input pr-20" 
                      placeholder="Amount to stake"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                    />
                    <button 
                      onClick={() => setStakeAmount(formatAmount(balances.silver, 9))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-copper-500/20 text-copper-400 rounded hover:bg-copper-500/30"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleStake}
                  className="btn-primary w-full" 
                  disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || isLoading}
                >
                  {isLoading ? 'Processing...' : 'Stake SILVER'}
                </button>
                
                <div className="border-t border-silver-800/50 my-6 pt-6">
                  <label className="label mb-2">Unstake Amount</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="input pr-20" 
                      placeholder="Amount to unstake"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                    />
                    <button 
                      onClick={() => setUnstakeAmount(formatAmount(miner?.stakedAmount || 0, 9))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs bg-copper-500/20 text-copper-400 rounded hover:bg-copper-500/30"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleUnstake}
                  className="btn-secondary w-full" 
                  disabled={!unstakeAmount || parseFloat(unstakeAmount) <= 0 || isLoading}
                >
                  {isLoading ? 'Processing...' : 'Unstake SILVER'}
                </button>
                <button 
                  onClick={handleClaimRewards}
                  className="btn-secondary w-full" 
                  disabled={(miner?.pendingRewards || 0) <= 0 || isLoading}
                >
                  {isLoading ? 'Processing...' : `Claim Rewards (${formatAmount(miner?.pendingRewards || 0)} SILVER)`}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'refine' && (
            <div className="card p-4 sm:p-6 md:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
                  <FlameIcon className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Refine UNREFINED</h2>
              </div>

              <div className="stat-card-copper p-4 sm:p-6 mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm text-white/70 mb-1 sm:mb-2">Your UNREFINED Balance</p>
                <p className="text-2xl sm:text-4xl font-bold text-white truncate">{formatAmount(balances.unrefined)}</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertIcon className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-400">10% Burn Fee</p>
                  <p className="text-silver-400 text-sm">10% of refined tokens are burned and redistributed to UNREFINED holders.</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between p-3 bg-silver-900/50 rounded-lg">
                  <span className="text-silver-400">You refine</span>
                  <span className="text-white font-semibold">{formatAmount(balances.unrefined)} UNREFINED</span>
                </div>
                <div className="flex justify-between p-3 bg-silver-900/50 rounded-lg">
                  <span className="text-silver-400">Burn fee (10%)</span>
                  <span className="text-red-400 font-semibold">-{formatAmount(balances.unrefined * 0.1)}</span>
                </div>
                <div className="flex justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                  <span className="text-silver-400">You receive</span>
                  <span className="text-emerald-400 font-semibold">{formatAmount(balances.unrefined * 0.9)} SILVER</span>
                </div>
              </div>

              <button 
                onClick={handleRefine}
                className="btn-primary w-full" 
                disabled={balances.unrefined <= 0 || isLoading}
              >
                {isLoading ? 'Processing...' : 'Refine All UNREFINED'}
              </button>

              {/* Redistribution Pool */}
              <div className="mt-6 border-t border-silver-800/50 pt-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <GemIcon className="w-5 h-5 text-copper-400" />
                  Redistribution Pool
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-silver-900/50 rounded-lg">
                    <p className="text-silver-500 text-xs">Pool Balance</p>
                    <p className="text-copper-400 font-semibold">{formatAmount(config?.redistributionPool || 0)} SILVER</p>
                  </div>
                  <div className="p-3 bg-silver-900/50 rounded-lg">
                    <p className="text-silver-500 text-xs">Your UNREFINED Holdings</p>
                    <p className="text-white font-semibold">{formatAmount(balances.unrefined)}</p>
                  </div>
                </div>
                <p className="text-silver-500 text-sm mb-3">
                  Claim your share of the redistribution pool based on your UNREFINED token holdings.
                </p>
                <button
                  onClick={claimRedistribution}
                  className="btn-secondary w-full"
                  disabled={isLoading || (config?.redistributionPool || 0) <= 0}
                >
                  {isLoading ? 'Claiming...' : 'Claim Redistribution Rewards'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'pool' && (
            <div className="card p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
                    <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
                  </div>
                  Mining Pools
                </h2>
                <span className="badge-copper text-xs">Max {MAX_POOL_MEMBERS}</span>
              </div>

              {miner?.isInPool && pool ? (
                <div>
                  <div className="bg-copper-500/10 border border-copper-500/30 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Your Pool</h3>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-silver-500 text-sm">Pool ID</p>
                        <p className="text-copper-400 font-bold text-lg">#{pool.poolId}</p>
                      </div>
                      <div>
                        <p className="text-silver-500 text-sm">Mine Level</p>
                        <p className="text-white font-semibold">{MINE_NAMES[pool.mineLevel]}</p>
                      </div>
                      <div>
                        <p className="text-silver-500 text-sm">Pool Fee</p>
                        <p className="text-white font-semibold">{(pool.feeBps / 100).toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-silver-500 text-sm">Members</p>
                        <p className="text-white font-semibold">{pool.memberCount}/{MAX_POOL_MEMBERS}</p>
                      </div>
                      <div>
                        <p className="text-silver-500 text-sm">Creator</p>
                        <p className="text-white font-semibold">{shortenAddress(pool.creator.toBase58())}</p>
                      </div>
                      <div>
                        <p className="text-silver-500 text-sm">You Are</p>
                        <p className="text-amber-400 font-semibold">
                          {pool.creator.toBase58() === wallet.publicKey?.toBase58() ? 'Owner' : 'Member'}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-silver-900/50 rounded-lg">
                      <p className="text-silver-500 text-xs mb-1">Share this Pool ID for others to join:</p>
                      <p className="text-copper-400 font-mono text-lg">#{pool.poolId}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleLeavePool}
                    className="btn-secondary w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Leave Pool'}
                  </button>
                </div>
              ) : miner?.isInPool ? (
                <div className="text-center py-8">
                  <p className="text-silver-400">Loading pool data...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Browse Existing Pools */}
                  <div className="bg-silver-900/30 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Browse Pools</h3>
                      <button 
                        onClick={loadAllPools}
                        className="btn-secondary px-4 py-2 text-sm"
                        disabled={loadingPools}
                      >
                        {loadingPools ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>
                    
                    {availablePools.length > 0 ? (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {availablePools.map((p) => (
                          <div key={p.id} className="p-3 bg-silver-800/50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-white font-semibold text-sm">Pool #{p.id}</p>
                              <p className="text-silver-400 text-xs truncate">
                                {MINE_NAMES[p.mineLevel]} • {(p.feeBps / 100).toFixed(1)}% fee • {p.memberCount}/{MAX_POOL_MEMBERS}
                              </p>
                            </div>
                            <button
                              onClick={() => joinPool(p.id)}
                              className="btn-primary px-4 py-1 text-xs w-full sm:w-auto flex-shrink-0"
                              disabled={isLoading || p.memberCount >= MAX_POOL_MEMBERS}
                            >
                              {p.memberCount >= MAX_POOL_MEMBERS ? 'Full' : 'Join'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-silver-500 text-sm">
                        {config?.totalPools ? 'Click Refresh to load pools' : 'No pools created yet'}
                      </p>
                    )}
                    <p className="text-silver-500 text-xs mt-3">
                      Total pools: {config?.totalPools || 0}
                    </p>
                  </div>

                  {/* Join by ID */}
                  <div className="bg-silver-900/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Join by Pool ID</h3>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        className="input flex-1" 
                        placeholder="Pool ID (e.g., 0, 1, 2...)"
                        id="poolIdInput"
                        min="0"
                      />
                      <button 
                        onClick={() => {
                          const input = document.getElementById('poolIdInput') as HTMLInputElement;
                          const poolId = parseInt(input.value);
                          if (!isNaN(poolId) && poolId >= 0) {
                            joinPool(poolId);
                          } else {
                            alert('Please enter a valid pool ID');
                          }
                        }}
                        className="btn-primary px-6"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Joining...' : 'Join'}
                      </button>
                    </div>
                  </div>

                  {/* Create New Pool */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Or Create New Pool</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="label mb-2">Pool Fee (%)</label>
                        <input 
                          type="number" 
                          className="input" 
                          placeholder="2.5"
                          value={poolFee}
                          onChange={(e) => setPoolFee(e.target.value)}
                          min="0"
                          max="5"
                          step="0.1"
                        />
                        <p className="text-silver-500 text-xs mt-1">Max 5% fee. This is taken from pool winnings.</p>
                      </div>
                      
                      <div>
                        <label className="label mb-2">Mine Level</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                          {MINE_NAMES.map((name, i) => {
                            const unlocked = i <= (miner?.currentMine || 0);
                            return (
                              <button
                                key={i}
                                onClick={() => unlocked && setPoolMineLevel(i)}
                                disabled={!unlocked}
                                className={`p-3 rounded-lg border text-center transition-all ${
                                  poolMineLevel === i
                                    ? 'bg-copper-500/20 border-copper-500 text-copper-400'
                                    : unlocked
                                    ? 'bg-silver-800/30 border-silver-700/50 text-silver-400 hover:border-copper-500/30'
                                    : 'bg-silver-900/30 border-silver-800/30 text-silver-600 cursor-not-allowed'
                                }`}
                              >
                                <p className="text-xs font-semibold">{name.split(' ')[0]}</p>
                                <p className="text-xs opacity-60">{EMISSIONS[i]}x</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <button 
                        onClick={handleCreatePool}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                        disabled={isLoading}
                      >
                        <PlusIcon className="w-4 h-4" />
                        {isLoading ? 'Creating...' : 'Create Pool'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'auto' && (
            <div className="card p-4 sm:p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
                    <BoltIcon className="w-4 h-4 sm:w-5 sm:h-5 text-copper-500" />
                  </div>
                  AutoMiner
                </h2>
                {autominer?.enabled ? (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Mining
                  </span>
                ) : (
                  <span className="badge-copper text-xs">Hands-free</span>
                )}
              </div>

              {/* Active mining banner */}
              {autominer?.enabled && autominer.balance > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <BoltIcon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-emerald-300 font-semibold">AutoMiner is running</p>
                      <p className="text-emerald-400/70 text-sm">Bets are placed automatically every round — no action needed.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Low balance warning */}
              {autominer?.enabled && autominer.balance > 0 && autominer.balance < (autominer.solPerBlock || 0) * 5 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
                  <p className="text-amber-400 text-sm flex items-center gap-2">
                    <AlertIcon className="w-4 h-4 flex-shrink-0" />
                    Low balance — deposit more SOL to keep mining. Need at least {formatSOL((autominer.solPerBlock || 0) * 5)} SOL per round.
                  </p>
                </div>
              )}

              {/* Empty balance warning */}
              {autominer?.enabled && autominer.balance === 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <AlertIcon className="w-4 h-4 flex-shrink-0" />
                    AutoMiner balance is empty — deposit SOL to resume mining.
                  </p>
                </div>
              )}

              {/* Info for users without autominer yet */}
              {!autominer && (
                <div className="bg-copper-500/10 border border-copper-500/30 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-copper-300 text-xs sm:text-sm">
                    AutoMiner places bets for you every round using ALL 5 blocks (100% win rate). 
                    Set it up, deposit SOL, and it mines 24/7 automatically.
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <div className="card p-3 sm:p-5">
                  <p className="text-xs sm:text-sm text-silver-500 mb-1 sm:mb-2">Balance</p>
                  <p className="text-lg sm:text-3xl font-bold text-white truncate">{formatSOL(autominer?.balance || 0)} SOL</p>
                </div>
                <div className="card p-3 sm:p-5">
                  <p className="text-xs sm:text-sm text-silver-500 mb-1 sm:mb-2">Status</p>
                  <p className={`text-lg sm:text-xl font-bold ${autominer?.enabled ? 'text-emerald-400' : 'text-silver-500'}`}>
                    {autominer ? (autominer.enabled ? (autominer.balance > 0 ? 'Mining' : 'No Balance') : 'Disabled') : 'Not Setup'}
                  </p>
                </div>
              </div>

              {autominer && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-silver-900/50 rounded-lg">
                    <p className="text-silver-500 text-xs">Total Bets Placed</p>
                    <p className="text-white font-semibold">{autominer.totalBetsPlaced}</p>
                  </div>
                  <div className="p-3 bg-silver-900/50 rounded-lg">
                    <p className="text-silver-500 text-xs">Total Winnings</p>
                    <p className="text-emerald-400 font-semibold">{formatSOL(autominer.totalWinnings)} SOL</p>
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="label mb-2">Select Mine</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                    {MINE_NAMES.map((name, i) => {
                      const unlocked = i <= (miner?.currentMine || 0);
                      return (
                        <button
                          key={i}
                          onClick={() => unlocked && setAutoMineLevel(i)}
                          disabled={!unlocked}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            autoMineLevel === i
                              ? 'bg-copper-500/20 border-copper-500 text-copper-400'
                              : unlocked
                              ? 'bg-silver-800/30 border-silver-700/50 text-silver-400 hover:border-copper-500/30'
                              : 'bg-silver-900/30 border-silver-800/30 text-silver-600 cursor-not-allowed'
                          }`}
                        >
                          <p className="text-xs font-semibold">{name.split(' ')[0]}</p>
                          <p className="text-xs opacity-60">{EMISSIONS[i]}x</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="label mb-2">SOL Per Block</label>
                  <input 
                    type="number" 
                    className="input" 
                    placeholder="0.1" 
                    step="0.01" 
                    min="0"
                    value={autoSolPerBlock}
                    onChange={(e) => setAutoSolPerBlock(e.target.value)}
                  />
                  <p className="text-silver-500 text-xs mt-1">Cost per round: {autoSolPerBlock ? (parseFloat(autoSolPerBlock) * 5).toFixed(4) : '0'} SOL (5 blocks)</p>
                </div>
              </div>

              {/* Deposit / Withdraw */}
              <div className="space-y-3 mb-6">
                <div>
                  <label className="label mb-2">Deposit SOL</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="input flex-1" 
                      placeholder="Amount"
                      value={autoDepositAmount}
                      onChange={(e) => setAutoDepositAmount(e.target.value)}
                    />
                    <button 
                      onClick={handleDepositAutominer}
                      className="btn-primary px-6"
                      disabled={!autoDepositAmount || parseFloat(autoDepositAmount) <= 0 || isLoading || !autominer}
                    >
                      {isLoading ? '...' : 'Deposit'}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="label mb-2">Withdraw SOL</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="input flex-1" 
                      placeholder="Amount"
                      value={autoWithdrawAmount}
                      onChange={(e) => setAutoWithdrawAmount(e.target.value)}
                    />
                    <button 
                      onClick={handleWithdrawAutominer}
                      className="btn-secondary px-6"
                      disabled={!autoWithdrawAmount || parseFloat(autoWithdrawAmount) <= 0 || isLoading || !autominer}
                    >
                      {isLoading ? '...' : 'Withdraw'}
                    </button>
                  </div>
                  <p className="text-silver-500 text-xs mt-1">Daily limit: 2 SOL</p>
                </div>
              </div>

              {/* Action Buttons */}
              {!autominer ? (
                <button 
                  onClick={handleSetupAutominer}
                  className="btn-primary w-full py-4"
                  disabled={isLoading}
                >
                  {isLoading ? 'Setting up...' : 'Setup AutoMiner'}
                </button>
              ) : (
                <div className="space-y-3">
                  <button 
                    onClick={handleUpdateAutominer}
                    className="btn-primary w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Updating...' : autominer.enabled ? 'Update Settings' : 'Enable & Start Mining'}
                  </button>
                  {autominer.enabled && (
                    <button 
                      onClick={handleDisableAutominer}
                      className="w-full py-3 border border-silver-700/50 text-silver-400 hover:text-white hover:bg-silver-800/50 rounded-xl transition-colors"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processing...' : 'Pause Mining'}
                    </button>
                  )}

                  {/* Claim All Rewards */}
                  <div className="border-t border-silver-800/50 pt-5 mt-5">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <WalletIcon className="w-4 h-4 text-copper-400" />
                      Claim Rewards
                    </h4>
                    <p className="text-silver-400 text-sm mb-4">
                      Collect your accumulated SOL winnings and UNREFINED tokens from all completed rounds.
                    </p>
                    <button 
                      onClick={claimAllRewards_auto}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      <WalletIcon className="w-5 h-5" />
                      {isLoading ? 'Claiming...' : 'Claim All Rewards'}
                    </button>
                    {autominer.totalWinnings > 0 && (
                      <p className="text-silver-500 text-xs mt-2 text-center">
                        Lifetime winnings: {formatSOL(autominer.totalWinnings)} SOL across {autominer.totalBetsPlaced} rounds
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Motherlode Section */}
              {config && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-amber-400 font-semibold flex items-center gap-2">
                      <TrophyIcon className="w-4 h-4" />
                      Motherlode Jackpot
                    </h4>
                    <span className="text-amber-300 font-bold">{formatSOL(config.motherlodeBalance)} SOL</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2 bg-silver-900/50 rounded-lg">
                      <p className="text-silver-500 text-xs">Target Round</p>
                      <p className="text-amber-400 font-semibold">{config.motherlodeTarget}</p>
                    </div>
                    <div className="p-2 bg-silver-900/50 rounded-lg">
                      <p className="text-silver-500 text-xs">Rounds Until Hit</p>
                      <p className="text-amber-400 font-semibold">
                        {config.motherlodeTarget > config.currentRound 
                          ? config.motherlodeTarget - config.currentRound 
                          : 'NOW!'}
                      </p>
                    </div>
                  </div>
                  {config.currentRound >= config.motherlodeTarget && config.motherlodeBalance > 0 && (
                    <button
                      onClick={triggerMotherlode}
                      className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      <TrophyIcon className="w-5 h-5" />
                      {isLoading ? 'Triggering...' : 'Trigger Motherlode!'}
                    </button>
                  )}
                  <p className="text-silver-500 text-xs mt-2">
                    {config.currentRound >= config.motherlodeTarget 
                      ? 'The motherlode is ready! Click to claim the jackpot!'
                      : 'Auto-pays to the triggerer when the target round hits.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Timer */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Round Timer</h3>
              <ClockIcon className="w-5 h-5 text-copper-500" />
            </div>
            <div className="text-center mb-4">
              <p className={`text-4xl sm:text-5xl font-bold font-mono ${timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-amber-400' : 'text-white'}`}>
                {timeLeft}s
              </p>
            </div>
            <div className="h-2 bg-silver-800 rounded-full overflow-hidden mb-4">
              <div 
                className={`h-full rounded-full transition-all ${timeLeft <= 5 ? 'bg-red-500' : timeLeft <= 10 ? 'bg-amber-500' : 'bg-gradient-to-r from-copper-600 to-copper-400'}`}
                style={{ width: `${(timeLeft / ROUND_DURATION) * 100}%` }}
              />
            </div>
            <button 
              onClick={handleFinalizeRound}
              className="btn-secondary w-full flex items-center justify-center gap-2"
              disabled={timeLeft > 0 || isLoading}
            >
              <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Finalizing...' : 'Finalize Round'}
            </button>
          </div>

          {/* Round Results */}
          {round && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Round {round.roundNumber} Result</h3>
                <TrophyIcon className="w-5 h-5 text-amber-400" />
              </div>
              
              {round.finalized ? (
                <>
                  <div className="text-center mb-4">
                    <p className="text-silver-400 text-sm mb-1">Winning Block</p>
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-emerald-500/20 border-2 border-emerald-500">
                      <span className="text-3xl font-bold text-emerald-400">{round.winningBlock + 1}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-silver-400">Total Pot:</span>
                      <span className="text-emerald-400 font-semibold">{formatSOL(round.totalPot)} SOL</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-silver-400">Mode:</span>
                      <span className={`font-semibold ${round.isSolo ? 'text-amber-400' : 'text-copper-400'}`}>
                        {round.isSolo ? 'Solo Winner' : 'Split'}
                      </span>
                    </div>
                    {displayedRoundBet && (
                      <div className="flex justify-between text-sm">
                        <span className="text-silver-400">Your Bet:</span>
                        <span className={`font-semibold ${displayedRoundBet.blocks[round.winningBlock] ? 'text-emerald-400' : 'text-red-400'}`}>
                          {displayedRoundBet.blocks[round.winningBlock] ? 'Won!' : 'Lost'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {displayedRoundBet && displayedRoundBet.blocks[round.winningBlock] && !displayedRoundBet.claimed && (
                    <button 
                      onClick={() => claimSol(round.roundNumber)}
                      className="btn-primary w-full flex items-center justify-center gap-2 mb-2"
                      disabled={isLoading}
                    >
                      <TrophyIcon className="w-4 h-4" />
                      {isLoading ? 'Claiming...' : 'Claim SOL Winnings'}
                    </button>
                  )}
                  
                  {displayedRoundBet && displayedRoundBet.blocks[round.winningBlock] && !displayedRoundBet.silverClaimed && (
                    <button 
                      onClick={() => claimBetSilver(round.roundNumber)}
                      className="btn-secondary w-full flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      <GemIcon className="w-4 h-4" />
                      {isLoading ? 'Claiming...' : 'Claim UNREFINED'}
                    </button>
                  )}
                  
                  {displayedRoundBet && displayedRoundBet.blocks[round.winningBlock] && displayedRoundBet.claimed && displayedRoundBet.silverClaimed && (
                    <p className="text-center text-emerald-400 text-sm flex items-center justify-center gap-1">
                      <CheckIcon className="w-4 h-4" /> All rewards claimed
                    </p>
                  )}
                  
                  {displayedRoundBet && !displayedRoundBet.blocks[round.winningBlock] && (
                    <p className="text-center text-silver-500 text-sm">
                      No rewards - did not bet on winning block
                    </p>
                  )}
                  
                  {!displayedRoundBet && (
                    <p className="text-center text-silver-500 text-sm">
                      You did not bet this round
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-silver-400">Round in progress...</p>
                  <p className="text-sm text-silver-500 mt-1">Pot: {formatSOL(round.totalPot)} SOL</p>
                  {currentBet && (
                    <p className="text-sm text-emerald-400 mt-2 flex items-center justify-center gap-1">
                      <CheckIcon className="w-4 h-4" /> Bet placed: {formatSOL(currentBet.totalSol)} SOL
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Previous Round Claims */}
          {previousRoundBet && previousRoundData && config?.currentRound && config.currentRound > 1 && previousRoundData.finalized && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Previous Round #{config.currentRound - 1}</h3>
                {previousRoundBet.blocks[previousRoundData.winningBlock] ? (
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs">Won!</span>
                ) : (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">Lost</span>
                )}
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-silver-400">Your Bet:</span>
                  <span className="text-white font-semibold">{formatSOL(previousRoundBet.totalSol)} SOL</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-silver-400">Winning Block:</span>
                  <span className="text-emerald-400 font-semibold">{previousRoundData.winningBlock + 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-silver-400">You Bet On Block {previousRoundData.winningBlock + 1}:</span>
                  <span className={`font-semibold ${previousRoundBet.blocks[previousRoundData.winningBlock] ? 'text-emerald-400' : 'text-red-400'}`}>
                    {previousRoundBet.blocks[previousRoundData.winningBlock] ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              
              {previousRoundBet.blocks[previousRoundData.winningBlock] ? (
                <div className="space-y-2">
                  {!previousRoundBet.claimed && (
                    <button 
                      onClick={() => claimSol(config.currentRound - 1)}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      <TrophyIcon className="w-4 h-4" />
                      {isLoading ? 'Claiming...' : 'Claim SOL'}
                    </button>
                  )}
                  
                  {!previousRoundBet.silverClaimed && (
                    <button 
                      onClick={() => claimBetSilver(config.currentRound - 1)}
                      className="btn-secondary w-full flex items-center justify-center gap-2"
                      disabled={isLoading}
                    >
                      <GemIcon className="w-4 h-4" />
                      {isLoading ? 'Claiming...' : 'Claim UNREFINED'}
                    </button>
                  )}
                  
                  {previousRoundBet.claimed && previousRoundBet.silverClaimed && (
                    <p className="text-center text-emerald-400 text-sm flex items-center justify-center gap-1">
                      <CheckIcon className="w-4 h-4" /> All rewards claimed
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center text-silver-500 text-sm">
                  No rewards - did not bet on winning block
                </p>
              )}
            </div>
          )}

          {/* Claim All Rewards — works for both manual bets and autominer */}
          {miner && (
            <div className="card p-6">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                <WalletIcon className="w-5 h-5 text-emerald-400" />
                Claim Rewards
              </h3>
              <p className="text-silver-400 text-sm mb-4">
                Collect all unclaimed SOL winnings and UNREFINED tokens across all rounds.
              </p>
              <button 
                onClick={claimAllRewards_auto}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                <WalletIcon className="w-4 h-4" />
                {isLoading ? 'Claiming...' : 'Claim All Rewards'}
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="card p-6">
            <h3 className="font-bold text-white mb-4">Your Statistics</h3>
            <div className="space-y-4">
              {[
                { label: 'Total SOL Won', value: `${formatSOL(miner?.totalSolWon || 0)} SOL`, color: 'text-emerald-400' },
                { label: 'Staked SILVER', value: formatAmount(miner?.stakedAmount || 0), color: 'text-copper-400' },
                { label: 'Pending Rewards', value: formatAmount(miner?.pendingRewards || 0), color: 'text-amber-400' },
                { label: 'Pending Unrefined', value: formatAmount(miner?.pendingUnrefined || 0), color: 'text-silver-300' },
                { label: 'In Pool', value: miner?.isInPool ? 'Yes' : 'No', color: miner?.isInPool ? 'text-emerald-400' : 'text-silver-500' },
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-silver-400 text-sm">{stat.label}</span>
                  <span className={`font-semibold ${stat.color}`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mine Progress */}
          <div className="card p-6">
            <h3 className="font-bold text-white mb-4">Mine Progress</h3>
            <div className="space-y-2">
              {MINE_NAMES.map((name, i) => {
                const unlocked = i <= (miner?.currentMine || 0);
                return (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${unlocked ? 'bg-copper-500/10' : 'bg-silver-800/30 opacity-50'}`}>
                    <div className="flex items-center gap-2">
                      {unlocked ? <CheckIcon className="w-4 h-4 text-copper-400" /> : <LockIcon className="w-4 h-4 text-silver-600" />}
                      <span className={unlocked ? 'text-white' : 'text-silver-500'}>{name}</span>
                    </div>
                    <span className={`text-sm font-semibold ${unlocked ? 'text-copper-400' : 'text-silver-600'}`}>{EMISSIONS[i]}x</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admin Panel (only visible to admin) */}
          {config && wallet.publicKey && config.authority.toBase58() === wallet.publicKey.toBase58() && (
            <div className="card p-6 border-amber-500/30">
              <h3 className="font-bold text-amber-400 mb-4 flex items-center gap-2">
                <AlertIcon className="w-5 h-5" />
                Admin Panel
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button 
                    onClick={pauseProtocol}
                    className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg text-sm transition-colors"
                    disabled={config.paused || isLoading}
                  >
                    Pause
                  </button>
                  <button 
                    onClick={unpauseProtocol}
                    className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 rounded-lg text-sm transition-colors"
                    disabled={!config.paused || isLoading}
                  >
                    Unpause
                  </button>
                </div>
                <p className="text-silver-500 text-xs text-center">
                  Status: {config.paused ? '🔴 Paused' : '🟢 Active'} | 
                  Motherlode: {(config.motherlodeBalance / 1e9).toFixed(4)} SOL | 
                  AM Treasury: {(config.autominerTreasury / 1e9).toFixed(4)} SOL
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
