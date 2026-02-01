import { useCallback, useEffect, useState, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { useStore } from './useStore';
import { PROGRAM_ID, TOKEN_DECIMALS, WARCHEST_WALLET, ADMIN_WALLET } from '../utils/constants';
import { SEEDS, DISCRIMINATORS } from '../utils/idl';
import toast from 'react-hot-toast';

// PDA derivation helpers
const getConfigPDA = () => PublicKey.findProgramAddressSync([SEEDS.CONFIG], PROGRAM_ID);
const getMinerPDA = (owner: PublicKey) => PublicKey.findProgramAddressSync([SEEDS.MINER, owner.toBuffer()], PROGRAM_ID);
const getPoolPDA = (poolId: bigint) => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(poolId);
  return PublicKey.findProgramAddressSync([SEEDS.POOL, buf], PROGRAM_ID);
};
const getRoundPDA = (roundNumber: bigint) => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(roundNumber);
  return PublicKey.findProgramAddressSync([SEEDS.ROUND, buf], PROGRAM_ID);
};
const getBetPDA = (bettor: PublicKey, roundNumber: bigint) => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(roundNumber);
  return PublicKey.findProgramAddressSync([SEEDS.BET, bettor.toBuffer(), buf], PROGRAM_ID);
};
const getSilverMintPDA = () => PublicKey.findProgramAddressSync([SEEDS.SILVER], PROGRAM_ID);
const getUnrefinedMintPDA = () => PublicKey.findProgramAddressSync([SEEDS.UNREFINED], PROGRAM_ID);
const getAutominerPDA = (owner: PublicKey) => PublicKey.findProgramAddressSync([SEEDS.AUTOMINER, owner.toBuffer()], PROGRAM_ID);

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, sendTransaction } = wallet;
  const { setBalances, setMiner, setConfig, setRound, setPool, setAutominer, setIsLoading } = useStore();

  // Auto-crank state
  const [autoCrankEnabled, setAutoCrankEnabled] = useState(false);
  const [autoCrankStatus, setAutoCrankStatus] = useState<string>('');
  const autoCrankIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCrankedRoundRef = useRef<number>(0);

  // Helper to send transactions with proper blockhash
  const sendTx = useCallback(async (instruction: TransactionInstruction) => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    const transaction = new Transaction().add(instruction);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;
    
    try {
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: true, // Skip simulation to see actual error
      });
      
      console.log('Transaction sent:', signature);
      
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      
      if (confirmation.value.err) {
        console.error('Transaction error:', confirmation.value.err);
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      return signature;
    } catch (error: any) {
      console.error('sendTx error:', error);
      // Try to extract Solana program error
      const logs = error?.logs || error?.message || '';
      console.error('Transaction logs:', logs);
      throw error;
    }
  }, [publicKey, connection, sendTransaction]);

  // Fetch SOL and token balances
  const fetchBalances = useCallback(async () => {
    if (!publicKey) return;
    try {
      const balance = await connection.getBalance(publicKey);
      
      let silverBalance = 0;
      let unrefinedBalance = 0;
      
      try {
        const [silverMint] = getSilverMintPDA();
        const silverAta = await getAssociatedTokenAddress(silverMint, publicKey);
        const silverAccount = await connection.getTokenAccountBalance(silverAta);
        silverBalance = Number(silverAccount.value.amount);
      } catch (e) {
        // Token account doesn't exist yet
      }
      
      try {
        const [unrefinedMint] = getUnrefinedMintPDA();
        const unrefinedAta = await getAssociatedTokenAddress(unrefinedMint, publicKey);
        const unrefinedAccount = await connection.getTokenAccountBalance(unrefinedAta);
        unrefinedBalance = Number(unrefinedAccount.value.amount);
      } catch (e) {
        // Token account doesn't exist yet
      }
      
      setBalances({
        sol: balance,
        silver: silverBalance,
        unrefined: unrefinedBalance,
      });
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  }, [connection, publicKey, setBalances]);

  // Fetch config account data - Updated for new IDL structure
  const fetchConfig = useCallback(async () => {
    try {
      const [configPDA] = getConfigPDA();
      const accountInfo = await connection.getAccountInfo(configPDA);
      
      if (!accountInfo) {
        console.log('Config not initialized');
        return;
      }
      
      const data = accountInfo.data;
      let offset = 8; // Skip discriminator
      
      const authority = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
      const silverMint = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
      const unrefinedMint = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
      const currentRound = data.readBigUInt64LE(offset); offset += 8;
      const roundStartTime = data.readBigInt64LE(offset); offset += 8;
      const totalUnrefinedSupply = data.readBigUInt64LE(offset); offset += 8;
      const totalSilverSupply = data.readBigUInt64LE(offset); offset += 8;
      const totalStaked = data.readBigUInt64LE(offset); offset += 8;
      const totalPools = data.readBigUInt64LE(offset); offset += 8;
      const motherlodeBalance = data.readBigUInt64LE(offset); offset += 8;
      const motherlodeTarget = data.readBigUInt64LE(offset); offset += 8;
      const stakingApr = data.readUInt16LE(offset); offset += 2;
      const autominerTreasury = data.readBigUInt64LE(offset); offset += 8;
      const redistributionPool = data.readBigUInt64LE(offset); offset += 8;
      const totalUnrefinedHolders = data.readBigUInt64LE(offset); offset += 8;
      const configBump = data.readUInt8(offset); offset += 1;
      const silverBump = data.readUInt8(offset); offset += 1;
      const unrefinedBump = data.readUInt8(offset); offset += 1;
      const initialized = data.readUInt8(offset) === 1; offset += 1;
      const paused = data.readUInt8(offset) === 1;
      
      setConfig({
        authority,
        silverMint,
        unrefinedMint,
        currentRound: Number(currentRound),
        roundStartTime: Number(roundStartTime),
        totalUnrefinedSupply: Number(totalUnrefinedSupply),
        totalSilverSupply: Number(totalSilverSupply),
        totalStaked: Number(totalStaked),
        totalPools: Number(totalPools),
        motherlodeBalance: Number(motherlodeBalance),
        motherlodeTarget: Number(motherlodeTarget),
        stakingApr,
        autominerTreasury: Number(autominerTreasury),
        redistributionPool: Number(redistributionPool),
        totalUnrefinedHolders: Number(totalUnrefinedHolders),
        configBump,
        silverBump,
        unrefinedBump,
        initialized,
        paused,
      });
      
      // Debug logging
      console.log('=== Config State ===');
      console.log('Current Round:', Number(currentRound));
      console.log('Round Start Time:', Number(roundStartTime));
      console.log('Motherlode Balance:', Number(motherlodeBalance));
      console.log('Total Pools:', Number(totalPools));
      console.log('Initialized:', initialized);
      console.log('Authority:', authority.toBase58());
      
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  }, [connection, setConfig]);

  // Fetch miner account data - Updated for new IDL structure
  const fetchMiner = useCallback(async () => {
    if (!publicKey) return;
    try {
      const [minerPDA] = getMinerPDA(publicKey);
      const accountInfo = await connection.getAccountInfo(minerPDA);
      
      if (!accountInfo) {
        console.log('Miner not initialized');
        setMiner(null);
        return;
      }
      
      const data = accountInfo.data;
      let offset = 8; // Skip discriminator
      
      const owner = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
      const currentMine = data.readUInt8(offset); offset += 1;
      const totalSolWon = data.readBigUInt64LE(offset); offset += 8;
      const pool = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
      const isInPool = data.readUInt8(offset) === 1; offset += 1;
      const stakedAmount = data.readBigUInt64LE(offset); offset += 8;
      const pendingRewards = data.readBigUInt64LE(offset); offset += 8;
      const lastStakeTime = data.readBigInt64LE(offset); offset += 8;
      const pendingUnrefined = data.readBigUInt64LE(offset); offset += 8;
      const lastRedistributionClaim = data.readBigUInt64LE(offset); offset += 8;
      const bump = data.readUInt8(offset);
      
      setMiner({
        owner,
        currentMine,
        totalSolWon: Number(totalSolWon),
        pool,
        isInPool,
        stakedAmount: Number(stakedAmount),
        pendingRewards: Number(pendingRewards),
        lastStakeTime: Number(lastStakeTime),
        pendingUnrefined: Number(pendingUnrefined),
        lastRedistributionClaim: Number(lastRedistributionClaim),
        bump,
      });
      
      // If user is in a pool, fetch the pool data and find pool ID
      if (isInPool && !pool.equals(PublicKey.default)) {
        try {
          const poolAccountInfo = await connection.getAccountInfo(pool);
          if (poolAccountInfo) {
            const poolData = poolAccountInfo.data;
            let pOffset = 8; // Skip discriminator
            
            const creator = new PublicKey(poolData.slice(pOffset, pOffset + 32)); pOffset += 32;
            const mineLevel = poolData.readUInt8(pOffset); pOffset += 1;
            const feeBps = poolData.readUInt16LE(pOffset); pOffset += 2;
            const memberCount = poolData.readUInt8(pOffset); pOffset += 1;
            
            // Skip members array (100 * 32 bytes)
            pOffset += 100 * 32;
            
            const active = poolData.readUInt8(pOffset) === 1;
            
            // Find pool ID by scanning (check first 50 pools)
            let foundPoolId = 0;
            for (let i = 0; i < 50; i++) {
              const [testPDA] = getPoolPDA(BigInt(i));
              if (testPDA.equals(pool)) {
                foundPoolId = i;
                break;
              }
            }
            
            setPool({
              creator,
              mineLevel,
              feeBps,
              memberCount,
              members: [],
              active,
              bump: 0,
              poolId: foundPoolId,
            });
          }
        } catch (poolError) {
          console.error('Failed to fetch pool:', poolError);
        }
      } else {
        setPool(null);
      }
    } catch (error) {
      console.error('Failed to fetch miner:', error);
    }
  }, [connection, publicKey, setMiner, setPool]);

  // Fetch current round - Updated for new IDL structure
  const fetchRound = useCallback(async (roundNumber: number) => {
    try {
      const [roundPDA] = getRoundPDA(BigInt(roundNumber));
      const accountInfo = await connection.getAccountInfo(roundPDA);
      
      if (!accountInfo) {
        console.log('Round not found');
        return;
      }
      
      const data = accountInfo.data;
      let offset = 8; // Skip discriminator
      
      const roundNum = data.readBigUInt64LE(offset); offset += 8;
      const startTime = data.readBigInt64LE(offset); offset += 8;
      const endTime = data.readBigInt64LE(offset); offset += 8;
      const finalized = data.readUInt8(offset) === 1; offset += 1;
      const winningBlock = data.readUInt8(offset); offset += 1;
      const isSolo = data.readUInt8(offset) === 1; offset += 1;
      const soloWinner = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
      // FIX: Read solo_seed and solo_best_score that exist in deployed contract
      const soloSeed = data.readBigUInt64LE(offset); offset += 8;
      const soloBestScore = data.readBigUInt64LE(offset); offset += 8;
      const totalPot = data.readBigUInt64LE(offset); offset += 8;
      
      const blockTotals: number[] = [];
      for (let i = 0; i < 5; i++) {
        blockTotals.push(Number(data.readBigUInt64LE(offset)));
        offset += 8;
      }
      const winnerPot = data.readBigUInt64LE(offset); offset += 8;
      const bump = data.readUInt8(offset);
      
      setRound({
        roundNumber: Number(roundNum),
        startTime: Number(startTime),
        endTime: Number(endTime),
        finalized,
        winningBlock,
        isSolo,
        soloWinner: isSolo ? soloWinner : null,
        totalPot: Number(totalPot),
        blockTotals,
        winnerPot: Number(winnerPot),
        bump,
      });
      
      // Debug logging
      console.log('=== Round State ===');
      console.log('Round Number:', Number(roundNum));
      console.log('Finalized:', finalized);
      console.log('Total Pot:', Number(totalPot));
      console.log('Winning Block:', winningBlock);
      
    } catch (error) {
      console.error('Failed to fetch round:', error);
    }
  }, [connection, setRound]);

  // Fetch user's bet for a specific round
  const fetchBet = useCallback(async (roundNumber: number) => {
    if (!publicKey) return null;
    try {
      const [betPDA] = getBetPDA(publicKey, BigInt(roundNumber));
      const accountInfo = await connection.getAccountInfo(betPDA);
      
      if (!accountInfo) {
        return null;
      }
      
      const data = accountInfo.data;
      let offset = 8; // Skip discriminator
      
      const miner = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
      const round = data.readBigUInt64LE(offset); offset += 8;
      const mineLevel = data.readUInt8(offset); offset += 1;
      
      const blocks: boolean[] = [];
      for (let i = 0; i < 5; i++) {
        blocks.push(data.readUInt8(offset) === 1);
        offset += 1;
      }
      
      const solPerBlock = data.readBigUInt64LE(offset); offset += 8;
      const totalSol = data.readBigUInt64LE(offset); offset += 8;
      const claimed = data.readUInt8(offset) === 1; offset += 1;
      const silverClaimed = data.readUInt8(offset) === 1; offset += 1;
      const bump = data.readUInt8(offset);
      
      return {
        miner,
        round: Number(round),
        mineLevel,
        blocks,
        solPerBlock: Number(solPerBlock),
        totalSol: Number(totalSol),
        claimed,
        silverClaimed,
        bump,
      };
    } catch (error) {
      console.error('Failed to fetch bet:', error);
      return null;
    }
  }, [publicKey, connection]);

  // Claim SOL winnings from a round
  const claimSol = useCallback(async (roundNumber: number) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const [minerPDA] = getMinerPDA(publicKey);
      const [roundPDA] = getRoundPDA(BigInt(roundNumber));
      const [betPDA] = getBetPDA(publicKey, BigInt(roundNumber));
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: false },
          { pubkey: roundPDA, isSigner: false, isWritable: true },
          { pubkey: betPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.claimSol,
      });
      
      await sendTx(instruction);
      toast.success('SOL winnings claimed!');
      await fetchBalances();
      await fetchMiner();
    } catch (error: any) {
      console.error('Claim SOL failed:', error);
      if (error.message?.includes('NothingToClaim')) {
        toast.error('No winnings to claim for this round');
      } else if (error.message?.includes('AlreadyClaimed')) {
        toast.error('Already claimed');
      } else {
        toast.error(error.message || 'Claim failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, sendTx, fetchBalances, fetchMiner, setIsLoading]);

  // Claim UNREFINED tokens from betting participation
  const claimBetSilver = useCallback(async (roundNumber: number) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const [minerPDA] = getMinerPDA(publicKey);
      const [roundPDA] = getRoundPDA(BigInt(roundNumber));
      const [betPDA] = getBetPDA(publicKey, BigInt(roundNumber));
      const [unrefinedMint] = getUnrefinedMintPDA();
      
      const claimerAta = await getAssociatedTokenAddress(unrefinedMint, publicKey);
      
      // Check if ATA exists, create if not
      const ataInfo = await connection.getAccountInfo(claimerAta);
      const instructions: TransactionInstruction[] = [];
      
      if (!ataInfo) {
        // Create ATA instruction
        instructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey, // payer
            claimerAta, // ata
            publicKey, // owner
            unrefinedMint // mint
          )
        );
      }
      
      // Claim instruction
      instructions.push(new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: roundPDA, isSigner: false, isWritable: true },
          { pubkey: betPDA, isSigner: false, isWritable: true },
          { pubkey: unrefinedMint, isSigner: false, isWritable: true },
          { pubkey: claimerAta, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.claimBetSilver,
      }));
      
      // Send all instructions in one transaction
      const transaction = new Transaction().add(...instructions);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
      
      toast.success('UNREFINED tokens claimed!');
      await fetchBalances();
    } catch (error: any) {
      console.error('Claim UNREFINED failed:', error);
      if (error.message?.includes('AlreadyClaimed')) {
        toast.error('Already claimed');
      } else {
        toast.error(error.message || 'Claim failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchBalances, setIsLoading]);

  // Fetch autominer account data
  const fetchAutominer = useCallback(async () => {
    if (!publicKey) return;
    try {
      const [autominerPDA] = getAutominerPDA(publicKey);
      const accountInfo = await connection.getAccountInfo(autominerPDA);
      
      if (!accountInfo) {
        console.log('AutoMiner not setup');
        setAutominer(null);
        return;
      }
      
      const data = accountInfo.data;
      let offset = 8; // Skip discriminator
      
      const owner = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
      const enabled = data.readUInt8(offset) === 1; offset += 1;
      const mineLevel = data.readUInt8(offset); offset += 1;
      const autoReload = data.readUInt8(offset) === 1; offset += 1;
      const balance = data.readBigUInt64LE(offset); offset += 8;
      const solPerBlock = data.readBigUInt64LE(offset); offset += 8;
      const dailyWithdrawn = data.readBigUInt64LE(offset); offset += 8;
      const lastWithdrawalDay = data.readBigInt64LE(offset); offset += 8;
      const totalBetsPlaced = data.readBigUInt64LE(offset); offset += 8;
      const totalWinnings = data.readBigUInt64LE(offset); offset += 8;
      const bump = data.readUInt8(offset);
      
      setAutominer({
        owner,
        enabled,
        mineLevel,
        autoReload,
        balance: Number(balance),
        solPerBlock: Number(solPerBlock),
        dailyWithdrawn: Number(dailyWithdrawn),
        lastWithdrawalDay: Number(lastWithdrawalDay),
        totalBetsPlaced: Number(totalBetsPlaced),
        totalWinnings: Number(totalWinnings),
        bump,
      });
    } catch (error) {
      console.error('Failed to fetch autominer:', error);
    }
  }, [connection, publicKey, setAutominer]);

  // Initialize protocol (admin only - one time setup)
  const initialize = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const [silverMint] = getSilverMintPDA();
      const [unrefinedMint] = getUnrefinedMintPDA();
      
      console.log('Initialize protocol...');
      console.log('Config PDA:', configPDA.toBase58());
      console.log('Silver Mint:', silverMint.toBase58());
      console.log('Unrefined Mint:', unrefinedMint.toBase58());
      
      // Check if already initialized
      const configAccount = await connection.getAccountInfo(configPDA);
      if (configAccount) {
        console.log('Protocol already initialized');
        toast.error('Protocol already initialized!');
        return;
      }
      
      console.log('Protocol not initialized, creating...');
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: silverMint, isSigner: false, isWritable: true },
          { pubkey: unrefinedMint, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.initialize,
      });
      
      await sendTx(instruction);
      
      toast.success('Protocol initialized!');
      await fetchConfig();
    } catch (error: any) {
      console.error('Initialize failed:', error);
      toast.error(error.message || 'Failed to initialize protocol');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTx, fetchConfig, setIsLoading]);

  // Initialize miner account
  const initializeMiner = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [minerPDA] = getMinerPDA(publicKey);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.initializeMiner,
      });
      
      await sendTx(instruction);
      
      toast.success('Miner initialized!');
      await fetchMiner();
    } catch (error: any) {
      console.error('Initialize miner failed:', error);
      toast.error(error.message || 'Failed to initialize miner');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, sendTx, fetchMiner, setIsLoading]);

  // Initialize round - must be called to start a new round
  const initializeRound = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      console.log('Config PDA:', configPDA.toBase58());
      
      const configAccount = await connection.getAccountInfo(configPDA);
      if (!configAccount) {
        toast.error('Config not initialized. Initialize protocol first in Admin Panel.');
        return;
      }
      
      const currentRound = configAccount.data.readBigUInt64LE(8 + 32 + 32 + 32);
      console.log('Current round from config:', currentRound.toString());
      
      const [roundPDA] = getRoundPDA(currentRound);
      console.log('Round PDA to create:', roundPDA.toBase58());
      
      // Check if round already exists
      const existingRound = await connection.getAccountInfo(roundPDA);
      if (existingRound) {
        toast.error(`Round ${currentRound.toString()} already exists! Need to finalize first.`);
        return;
      }
      
      console.log('Round does not exist, creating...');
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: roundPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.initializeRound,
      });
      
      await sendTx(instruction);
      
      toast.success(`Round ${currentRound.toString()} initialized!`);
      await fetchConfig();
    } catch (error: any) {
      console.error('Initialize round failed:', error);
      toast.error(error.message || 'Failed to initialize round');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTx, fetchConfig, setIsLoading]);

  // Place bet
  const placeBet = useCallback(async (
    mineLevel: number,
    blocks: boolean[],
    solPerBlock: number
  ) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const configAccount = await connection.getAccountInfo(configPDA);
      if (!configAccount) throw new Error('Config not initialized');
      
      const currentRound = configAccount.data.readBigUInt64LE(8 + 32 + 32 + 32);
      
      // Check if round exists
      const [roundPDA] = getRoundPDA(currentRound);
      const roundAccount = await connection.getAccountInfo(roundPDA);
      if (!roundAccount) {
        toast.error('No active round. Initialize a round first.');
        return;
      }
      
      const [minerPDA] = getMinerPDA(publicKey);
      const [betPDA] = getBetPDA(publicKey, currentRound);
      
      const lamportsPerBlock = BigInt(Math.floor(solPerBlock * LAMPORTS_PER_SOL));
      
      // Encode instruction data
      const data = Buffer.alloc(1 + 5 + 8);
      let offset = 0;
      data.writeUInt8(mineLevel, offset); offset += 1;
      for (let i = 0; i < 5; i++) {
        data.writeUInt8(blocks[i] ? 1 : 0, offset); offset += 1;
      }
      data.writeBigUInt64LE(lamportsPerBlock, offset);
      
      const instructionData = Buffer.concat([
        DISCRIMINATORS.placeBet,
        data,
      ]);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: false },
          { pubkey: roundPDA, isSigner: false, isWritable: true },
          { pubkey: betPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: instructionData,
      });
      
      await sendTx(instruction);
      
      const blocksCount = blocks.filter(b => b).length;
      const totalSol = blocksCount * solPerBlock;
      toast.success(`Bet placed: ${totalSol.toFixed(4)} SOL on ${blocksCount} blocks`);
      await fetchBalances();
      // Refresh round to show updated totals
      await fetchRound(Number(currentRound));
    } catch (error: any) {
      console.error('Place bet failed:', error);
      toast.error(error.message || 'Bet failed');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTx, fetchBalances, fetchRound, setIsLoading]);

  // Finalize round AND auto-initialize next round
  const finalizeRound = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const configAccount = await connection.getAccountInfo(configPDA);
      if (!configAccount) {
        toast.error('Config not initialized. Go to Admin Panel first.');
        setIsLoading(false);
        return;
      }
      
      const currentRound = configAccount.data.readBigUInt64LE(8 + 32 + 32 + 32);
      const [roundPDA] = getRoundPDA(currentRound);
      
      // Check if round exists
      const roundAccount = await connection.getAccountInfo(roundPDA);
      if (!roundAccount) {
        toast.error('No active round. Click "Initialize Round" in Admin Panel.');
        setIsLoading(false);
        return;
      }
      
      // Check if round is already finalized (offset: 8 disc + 8 roundNum + 8 start + 8 end = 32, then finalized bool)
      const finalized = roundAccount.data[8 + 8 + 8 + 8] === 1;
      
      if (!finalized) {
        // Finalize current round
        const finalizeInstruction = new TransactionInstruction({
          keys: [
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: configPDA, isSigner: false, isWritable: true },
            { pubkey: roundPDA, isSigner: false, isWritable: true },
            { pubkey: WARCHEST_WALLET, isSigner: false, isWritable: true },
            { pubkey: ADMIN_WALLET, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: PROGRAM_ID,
          data: DISCRIMINATORS.finalizeRound,
        });
        
        await sendTx(finalizeInstruction);
        toast.success(`Round ${currentRound.toString()} finalized! Starting next round...`);
      } else {
        toast('Round already finalized. Starting next round...');
      }
      
      // Now initialize the next round
      // Re-fetch config to get updated current_round
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief wait for state update
      const updatedConfig = await connection.getAccountInfo(configPDA);
      if (!updatedConfig) throw new Error('Failed to fetch updated config');
      
      const nextRound = updatedConfig.data.readBigUInt64LE(8 + 32 + 32 + 32);
      const [nextRoundPDA] = getRoundPDA(nextRound);
      
      // Check if next round already exists
      const nextRoundAccount = await connection.getAccountInfo(nextRoundPDA);
      if (!nextRoundAccount) {
        // Initialize next round
        const initInstruction = new TransactionInstruction({
          keys: [
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: configPDA, isSigner: false, isWritable: true },
            { pubkey: nextRoundPDA, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: PROGRAM_ID,
          data: DISCRIMINATORS.initializeRound,
        });
        
        await sendTx(initInstruction);
        toast.success(`Round ${nextRound.toString()} started! 🎰`);
      } else {
        toast.success(`Round ${nextRound.toString()} ready!`);
      }
      
      await fetchConfig();
    } catch (error: any) {
      console.error('Finalize/Init round failed:', error);
      const errorMsg = error?.message || error?.toString() || 'Operation failed';
      
      // Parse common errors
      if (errorMsg.includes('RoundNotEnded') || errorMsg.includes('0x1775')) {
        toast.error('⏱️ Round timer not finished yet. Wait for countdown to reach 0.');
      } else if (errorMsg.includes('RoundAlreadyFinalized')) {
        toast.error('Round already finalized.');
      } else if (errorMsg.includes('ProtocolPaused')) {
        toast.error('Protocol is paused by admin.');
      } else if (errorMsg.includes('already in use') || errorMsg.includes('0x0')) {
        toast.error('Round already initialized.');
      } else {
        toast.error(errorMsg.slice(0, 100));
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTx, fetchConfig, setIsLoading]);

  // Stake SILVER
  const stake = useCallback(async (amount: number) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const [minerPDA] = getMinerPDA(publicKey);
      const [silverMint] = getSilverMintPDA();
      
      const ownerSilverAta = await getAssociatedTokenAddress(silverMint, publicKey);
      const stakingVault = await getAssociatedTokenAddress(silverMint, configPDA, true);
      
      const lamports = BigInt(Math.floor(amount * Math.pow(10, TOKEN_DECIMALS)));
      const data = Buffer.alloc(8);
      data.writeBigUInt64LE(lamports);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: ownerSilverAta, isSigner: false, isWritable: true },
          { pubkey: stakingVault, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([DISCRIMINATORS.stake, data]),
      });
      
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success(`Staked ${amount} SILVER`);
      await fetchBalances();
      await fetchMiner();
    } catch (error: any) {
      console.error('Stake failed:', error);
      toast.error(error.message || 'Stake failed');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchBalances, fetchMiner, setIsLoading]);

  // Unstake SILVER
  const unstake = useCallback(async (amount: number) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const [minerPDA] = getMinerPDA(publicKey);
      const [silverMint] = getSilverMintPDA();
      
      const ownerSilverAta = await getAssociatedTokenAddress(silverMint, publicKey);
      const stakingVault = await getAssociatedTokenAddress(silverMint, configPDA, true);
      
      const lamports = BigInt(Math.floor(amount * Math.pow(10, TOKEN_DECIMALS)));
      const data = Buffer.alloc(8);
      data.writeBigUInt64LE(lamports);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: ownerSilverAta, isSigner: false, isWritable: true },
          { pubkey: stakingVault, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([DISCRIMINATORS.unstake, data]),
      });
      
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success(`Unstaked ${amount} SILVER`);
      await fetchBalances();
      await fetchMiner();
    } catch (error: any) {
      console.error('Unstake failed:', error);
      toast.error(error.message || 'Unstake failed');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchBalances, fetchMiner, setIsLoading]);

  // Claim staking rewards
  const claimRewards = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const [minerPDA] = getMinerPDA(publicKey);
      const [silverMint] = getSilverMintPDA();
      
      const ownerSilverAta = await getAssociatedTokenAddress(silverMint, publicKey);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: silverMint, isSigner: false, isWritable: true },
          { pubkey: ownerSilverAta, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.claimStakingRewards,
      });
      
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('Claimed staking rewards!');
      await fetchBalances();
      await fetchMiner();
    } catch (error: any) {
      console.error('Claim rewards failed:', error);
      toast.error(error.message || 'Claim failed');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchBalances, fetchMiner, setIsLoading]);

  // Refine UNREFINED to SILVER
  const refine = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const [minerPDA] = getMinerPDA(publicKey);
      const [silverMint] = getSilverMintPDA();
      const [unrefinedMint] = getUnrefinedMintPDA();
      
      const ownerSilverAta = await getAssociatedTokenAddress(silverMint, publicKey);
      const ownerUnrefinedAta = await getAssociatedTokenAddress(unrefinedMint, publicKey);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: unrefinedMint, isSigner: false, isWritable: true },
          { pubkey: silverMint, isSigner: false, isWritable: true },
          { pubkey: ownerUnrefinedAta, isSigner: false, isWritable: true },
          { pubkey: ownerSilverAta, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.refine,
      });
      
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('Refined all UNREFINED to SILVER! (90% to you, 10% to redistribution pool)');
      await fetchBalances();
      await fetchMiner();
    } catch (error: any) {
      console.error('Refine failed:', error);
      toast.error(error.message || 'Refine failed');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchBalances, fetchMiner, setIsLoading]);

  // Claim redistribution
  const claimRedistribution = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const [minerPDA] = getMinerPDA(publicKey);
      const [silverMint] = getSilverMintPDA();
      const [unrefinedMint] = getUnrefinedMintPDA();
      
      const ownerSilverAta = await getAssociatedTokenAddress(silverMint, publicKey);
      const ownerUnrefinedAta = await getAssociatedTokenAddress(unrefinedMint, publicKey);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: silverMint, isSigner: false, isWritable: true },
          { pubkey: ownerSilverAta, isSigner: false, isWritable: true },
          { pubkey: ownerUnrefinedAta, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.claimRedistribution,
      });
      
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('Claimed redistribution rewards!');
      await fetchBalances();
      await fetchMiner();
    } catch (error: any) {
      console.error('Claim redistribution failed:', error);
      toast.error(error.message || 'Claim failed');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchBalances, fetchMiner, setIsLoading]);

  // Create pool
  const createPool = useCallback(async (feeBps: number, mineLevel: number) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const [minerPDA] = getMinerPDA(publicKey);
      
      const configAccount = await connection.getAccountInfo(configPDA);
      if (!configAccount) throw new Error('Config not initialized');
      
      // Read totalPools at correct offset:
      // 8 (discriminator) + 32 (authority) + 32 (silverMint) + 32 (unrefinedMint) + 
      // 8 (currentRound) + 8 (roundStartTime) + 8 (totalUnrefinedSupply) + 
      // 8 (totalSilverSupply) + 8 (totalStaked) = 144
      const totalPools = configAccount.data.readBigUInt64LE(144);
      const [poolPDA] = getPoolPDA(totalPools);
      
      console.log('Creating pool with:', { feeBps, mineLevel, totalPools: Number(totalPools), poolPDA: poolPDA.toBase58() });
      
      const data = Buffer.alloc(3);
      data.writeUInt16LE(feeBps, 0);
      data.writeUInt8(mineLevel, 2);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: poolPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([DISCRIMINATORS.createPool, data]),
      });
      
      await sendTx(instruction);
      toast.success('Pool created!');
      await fetchConfig();
      await fetchMiner();
    } catch (error: any) {
      console.error('Create pool failed:', error);
      console.error('Error logs:', error.logs);
      
      const errorMsg = error.message || error.toString();
      if (errorMsg.includes('AlreadyInPool')) {
        toast.error('You are already in a pool');
      } else if (errorMsg.includes('MineNotUnlocked')) {
        toast.error('You have not unlocked this mine level yet');
      } else if (errorMsg.includes('InvalidFee')) {
        toast.error('Fee must be 5% or less (500 bps max)');
      } else if (errorMsg.includes('InvalidMineLevel')) {
        toast.error('Invalid mine level');
      } else if (error.logs) {
        // Try to extract error from logs
        const logError = error.logs.find((l: string) => l.includes('Error') || l.includes('failed'));
        toast.error(logError || 'Create pool failed - check console');
      } else {
        toast.error('Create pool failed - check console');
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTx, fetchConfig, fetchMiner, setIsLoading]);

  // Leave pool
  const leavePool = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [minerPDA] = getMinerPDA(publicKey);
      
      // Get miner account to find pool
      const minerAccount = await connection.getAccountInfo(minerPDA);
      if (!minerAccount) throw new Error('Miner not initialized');
      
      // Parse pool pubkey from miner data (offset: 8 discriminator + 32 owner + 1 currentMine + 8 totalSolWon = 49)
      const poolPubkey = new PublicKey(minerAccount.data.slice(49, 81));
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: poolPubkey, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.leavePool,
      });
      
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('Left pool!');
      await fetchMiner();
    } catch (error: any) {
      console.error('Leave pool failed:', error);
      toast.error(error.message || 'Leave pool failed');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchMiner, setIsLoading]);

  // Join pool
  const joinPool = useCallback(async (poolId: number) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [minerPDA] = getMinerPDA(publicKey);
      const [poolPDA] = getPoolPDA(BigInt(poolId));
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: poolPDA, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.joinPool,
      });
      
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('Joined pool!');
      await fetchMiner();
    } catch (error: any) {
      console.error('Join pool failed:', error);
      toast.error(error.message || 'Join pool failed');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchMiner, setIsLoading]);

  // Fetch pool by ID
  const fetchPool = useCallback(async (poolId: number) => {
    try {
      const [poolPDA] = getPoolPDA(BigInt(poolId));
      const accountInfo = await connection.getAccountInfo(poolPDA);
      
      if (!accountInfo) {
        return null;
      }
      
      const data = accountInfo.data;
      let offset = 8; // Skip discriminator
      
      const creator = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
      const mineLevel = data.readUInt8(offset); offset += 1;
      const feeBps = data.readUInt16LE(offset); offset += 2;
      const memberCount = data.readUInt8(offset); offset += 1;
      
      // Parse members array (100 pubkeys)
      const members: PublicKey[] = [];
      for (let i = 0; i < 100; i++) {
        const memberPubkey = new PublicKey(data.slice(offset, offset + 32));
        offset += 32;
        if (!memberPubkey.equals(PublicKey.default)) {
          members.push(memberPubkey);
        }
      }
      
      const active = data.readUInt8(offset) === 1; offset += 1;
      const bump = data.readUInt8(offset);
      
      return {
        creator,
        mineLevel,
        feeBps,
        memberCount,
        members,
        active,
        bump,
        poolId,
      };
    } catch (error) {
      console.error('Failed to fetch pool:', error);
      return null;
    }
  }, [connection]);

  // Setup AutoMiner
  const setupAutominer = useCallback(async (mineLevel: number, autoReload: boolean, solPerBlock: number) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [minerPDA] = getMinerPDA(publicKey);
      const [autominerPDA] = getAutominerPDA(publicKey);
      
      const lamportsPerBlock = BigInt(Math.floor(solPerBlock * LAMPORTS_PER_SOL));
      
      const data = Buffer.alloc(1 + 1 + 8);
      let offset = 0;
      data.writeUInt8(mineLevel, offset); offset += 1;
      data.writeUInt8(autoReload ? 1 : 0, offset); offset += 1;
      data.writeBigUInt64LE(lamportsPerBlock, offset);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: false },
          { pubkey: autominerPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([DISCRIMINATORS.setupAutominer, data]),
      });
      
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('AutoMiner setup complete!');
      await fetchAutominer();
    } catch (error: any) {
      console.error('Setup autominer failed:', error);
      toast.error(error.message || 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchAutominer, setIsLoading]);

  // Update AutoMiner
  const updateAutominer = useCallback(async (mineLevel: number, autoReload: boolean, solPerBlock: number, enabled: boolean) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [minerPDA] = getMinerPDA(publicKey);
      const [autominerPDA] = getAutominerPDA(publicKey);
      
      const lamportsPerBlock = BigInt(Math.floor(solPerBlock * LAMPORTS_PER_SOL));
      
      const data = Buffer.alloc(1 + 1 + 8 + 1);
      let offset = 0;
      data.writeUInt8(mineLevel, offset); offset += 1;
      data.writeUInt8(autoReload ? 1 : 0, offset); offset += 1;
      data.writeBigUInt64LE(lamportsPerBlock, offset); offset += 8;
      data.writeUInt8(enabled ? 1 : 0, offset);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: false },
          { pubkey: autominerPDA, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([DISCRIMINATORS.updateAutominer, data]),
      });
      
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('AutoMiner updated!');
      await fetchAutominer();
    } catch (error: any) {
      console.error('Update autominer failed:', error);
      toast.error(error.message || 'Update failed');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchAutominer, setIsLoading]);

  // Deposit to AutoMiner
  const depositAutominer = useCallback(async (amount: number) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [autominerPDA] = getAutominerPDA(publicKey);
      
      const lamports = BigInt(Math.floor(amount * LAMPORTS_PER_SOL));
      const data = Buffer.alloc(8);
      data.writeBigUInt64LE(lamports);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: autominerPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([DISCRIMINATORS.depositAutominer, data]),
      });
      
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success(`Deposited ${amount} SOL to AutoMiner`);
      await fetchBalances();
      await fetchAutominer();
    } catch (error: any) {
      console.error('Deposit to autominer failed:', error);
      toast.error(error.message || 'Deposit failed');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchBalances, fetchAutominer, setIsLoading]);

  // Withdraw from AutoMiner
  const withdrawAutominer = useCallback(async (amount: number) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [autominerPDA] = getAutominerPDA(publicKey);
      
      const lamports = BigInt(Math.floor(amount * LAMPORTS_PER_SOL));
      const data = Buffer.alloc(8);
      data.writeBigUInt64LE(lamports);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: autominerPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: Buffer.concat([DISCRIMINATORS.withdrawAutominer, data]),
      });
      
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success(`Withdrew ${amount} SOL from AutoMiner`);
      await fetchBalances();
      await fetchAutominer();
    } catch (error: any) {
      console.error('Withdraw from autominer failed:', error);
      toast.error(error.message || 'Withdraw failed');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchBalances, fetchAutominer, setIsLoading]);

  // Disable AutoMiner
  const disableAutominer = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [autominerPDA] = getAutominerPDA(publicKey);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: autominerPDA, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.disableAutominer,
      });
      
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('AutoMiner disabled');
      await fetchAutominer();
    } catch (error: any) {
      console.error('Disable autominer failed:', error);
      toast.error(error.message || 'Disable failed');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchAutominer, setIsLoading]);

  // Trigger Motherlode
  const triggerMotherlode = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const [minerPDA] = getMinerPDA(publicKey);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.triggerMotherlode,
      });
      
      const transaction = new Transaction().add(instruction);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('Motherlode triggered! You won the jackpot!');
      await fetchConfig();
      await fetchMiner();
    } catch (error: any) {
      console.error('Trigger motherlode failed:', error);
      toast.error(error.message || 'Motherlode not triggered');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchConfig, fetchMiner, setIsLoading]);

  // Crank AutoMiner - place bet for an autominer owner (permissionless)
  const crankAutominer = useCallback(async (autominerOwner?: PublicKey, silent: boolean = false) => {
    if (!publicKey) {
      if (!silent) toast.error('Please connect your wallet');
      return false;
    }
    
    const owner = autominerOwner || publicKey;
    
    try {
      const [configPDA] = getConfigPDA();
      const configAccount = await connection.getAccountInfo(configPDA);
      if (!configAccount) {
        if (!silent) toast.error('Config not initialized');
        return false;
      }
      
      const currentRound = configAccount.data.readBigUInt64LE(8 + 32 + 32 + 32);
      
      const [minerPDA] = getMinerPDA(owner);
      const [autominerPDA] = getAutominerPDA(owner);
      const [roundPDA] = getRoundPDA(currentRound);
      const [betPDA] = getBetPDA(owner, currentRound);
      
      // Check if bet already exists
      const betAccount = await connection.getAccountInfo(betPDA);
      if (betAccount) {
        if (!silent) toast.error('Bet already placed this round');
        return false;
      }
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },  // cranker
          { pubkey: owner, isSigner: false, isWritable: false },     // autominer_owner
          { pubkey: minerPDA, isSigner: false, isWritable: false },  // miner
          { pubkey: autominerPDA, isSigner: false, isWritable: true }, // autominer
          { pubkey: configPDA, isSigner: false, isWritable: false }, // config
          { pubkey: roundPDA, isSigner: false, isWritable: true },   // round
          { pubkey: betPDA, isSigner: false, isWritable: true },     // bet
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.crankAutominer,
      });
      
      await sendTx(instruction);
      
      if (!silent) toast.success('AutoMiner bet placed!');
      await fetchBalances();
      await fetchAutominer();
      return true;
    } catch (error: any) {
      console.error('Crank autominer failed:', error);
      if (!silent) toast.error(error.message || 'Crank failed');
      return false;
    }
  }, [publicKey, connection, sendTx, fetchBalances, fetchAutominer]);

  // Start auto-crank background process (with auto-finalize and auto-init-round)
  const startAutoCrank = useCallback(() => {
    if (autoCrankIntervalRef.current) {
      return; // Already running
    }
    
    setAutoCrankEnabled(true);
    setAutoCrankStatus('Starting auto-crank...');
    
    const runCrank = async () => {
      if (!publicKey) {
        setAutoCrankStatus('Wallet disconnected');
        return;
      }
      
      try {
        // Fetch current state
        const [configPDA] = getConfigPDA();
        const configAccount = await connection.getAccountInfo(configPDA);
        if (!configAccount) {
          setAutoCrankStatus('Config not initialized');
          return;
        }
        
        const currentRound = Number(configAccount.data.readBigUInt64LE(8 + 32 + 32 + 32));
        const roundStartTime = Number(configAccount.data.readBigInt64LE(8 + 32 + 32 + 32 + 8));
        
        // Check round status
        const [roundPDA] = getRoundPDA(BigInt(currentRound));
        const roundAccount = await connection.getAccountInfo(roundPDA);
        
        if (!roundAccount) {
          // Round doesn't exist - try to initialize it
          setAutoCrankStatus(`Initializing round ${currentRound}...`);
          try {
            const initInstruction = new TransactionInstruction({
              keys: [
                { pubkey: publicKey, isSigner: true, isWritable: true },
                { pubkey: configPDA, isSigner: false, isWritable: true },
                { pubkey: roundPDA, isSigner: false, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
              ],
              programId: PROGRAM_ID,
              data: DISCRIMINATORS.initializeRound,
            });
            await sendTx(initInstruction);
            setAutoCrankStatus(`✓ Round ${currentRound} initialized`);
          } catch (e: any) {
            setAutoCrankStatus(`Init round failed: ${e.message?.slice(0, 30) || 'error'}`);
          }
          return;
        }
        
        // Check if round needs finalizing
        const roundFinalized = roundAccount.data[8 + 8 + 8 + 8] === 1;
        const endTimeOffset = 8 + 8 + 8; // disc + roundNum + startTime
        const roundEndTime = Number(roundAccount.data.readBigInt64LE(endTimeOffset));
        const now = Math.floor(Date.now() / 1000);
        
        if (!roundFinalized && roundEndTime > 0 && now >= roundEndTime) {
          // Round ended but not finalized - auto-finalize it
          setAutoCrankStatus(`Finalizing round ${currentRound}...`);
          try {
            const finalizeInstruction = new TransactionInstruction({
              keys: [
                { pubkey: publicKey, isSigner: true, isWritable: true },
                { pubkey: configPDA, isSigner: false, isWritable: true },
                { pubkey: roundPDA, isSigner: false, isWritable: true },
                { pubkey: WARCHEST_WALLET, isSigner: false, isWritable: true },
                { pubkey: ADMIN_WALLET, isSigner: false, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
              ],
              programId: PROGRAM_ID,
              data: DISCRIMINATORS.finalizeRound,
            });
            await sendTx(finalizeInstruction);
            setAutoCrankStatus(`✓ Round ${currentRound} finalized! Initializing next...`);
            
            // Wait briefly for state to update, then init next round
            await new Promise(resolve => setTimeout(resolve, 500));
            const updatedConfig = await connection.getAccountInfo(configPDA);
            if (updatedConfig) {
              const nextRound = updatedConfig.data.readBigUInt64LE(8 + 32 + 32 + 32);
              const [nextRoundPDA] = getRoundPDA(nextRound);
              const nextRoundAccount = await connection.getAccountInfo(nextRoundPDA);
              if (!nextRoundAccount) {
                const initInstruction = new TransactionInstruction({
                  keys: [
                    { pubkey: publicKey, isSigner: true, isWritable: true },
                    { pubkey: configPDA, isSigner: false, isWritable: true },
                    { pubkey: nextRoundPDA, isSigner: false, isWritable: true },
                    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                  ],
                  programId: PROGRAM_ID,
                  data: DISCRIMINATORS.initializeRound,
                });
                await sendTx(initInstruction);
                setAutoCrankStatus(`✓ Round ${Number(nextRound)} started!`);
              }
            }
          } catch (e: any) {
            setAutoCrankStatus(`Finalize failed: ${e.message?.slice(0, 30) || 'error'}`);
          }
          return;
        }
        
        // Round is active and not ended - try to place autominer bet
        if (roundFinalized) {
          setAutoCrankStatus(`Round ${currentRound} finalized, waiting for next...`);
          return;
        }
        
        // Check if we already cranked this round
        if (currentRound === lastCrankedRoundRef.current) {
          const timeRemaining = roundEndTime > 0 ? Math.max(0, roundEndTime - now) : '?';
          setAutoCrankStatus(`✓ Bet placed for round ${currentRound} (${timeRemaining}s left)`);
          return;
        }
        
        // Fetch autominer
        const [autominerPDA] = getAutominerPDA(publicKey);
        const autominerAccount = await connection.getAccountInfo(autominerPDA);
        if (!autominerAccount) {
          setAutoCrankStatus('AutoMiner not setup');
          return;
        }
        
        // Parse autominer
        const amData = autominerAccount.data;
        const enabled = amData[8 + 32] === 1;
        const balance = Number(amData.readBigUInt64LE(8 + 32 + 1 + 1 + 1));
        const amSolPerBlock = Number(amData.readBigUInt64LE(8 + 32 + 1 + 1 + 1 + 8));
        
        if (!enabled) {
          setAutoCrankStatus('AutoMiner disabled');
          return;
        }
        
        const requiredBalance = amSolPerBlock * 5 + 10000; // 5 blocks + crank incentive
        if (balance < requiredBalance) {
          setAutoCrankStatus('Insufficient AutoMiner balance');
          return;
        }
        
        // Check if bet already exists
        const [betPDA] = getBetPDA(publicKey, BigInt(currentRound));
        const betAccount = await connection.getAccountInfo(betPDA);
        if (betAccount) {
          lastCrankedRoundRef.current = currentRound;
          setAutoCrankStatus(`✓ Already bet round ${currentRound}`);
          return;
        }
        
        // Place the crank
        setAutoCrankStatus(`Placing bet for round ${currentRound}...`);
        const success = await crankAutominer(undefined, true);
        
        if (success) {
          lastCrankedRoundRef.current = currentRound;
          setAutoCrankStatus(`✓ Bet placed for round ${currentRound}`);
        } else {
          setAutoCrankStatus(`Failed to place bet`);
        }
      } catch (error: any) {
        console.error('Auto-crank error:', error);
        setAutoCrankStatus(`Error: ${error.message?.slice(0, 30) || 'Unknown'}`);
      }
    };
    
    // Run immediately
    runCrank();
    
    // Then run every 5 seconds
    autoCrankIntervalRef.current = setInterval(runCrank, 5000);
  }, [publicKey, connection, crankAutominer, sendTx]);

  // Stop auto-crank
  const stopAutoCrank = useCallback(() => {
    if (autoCrankIntervalRef.current) {
      clearInterval(autoCrankIntervalRef.current);
      autoCrankIntervalRef.current = null;
    }
    setAutoCrankEnabled(false);
    setAutoCrankStatus('');
  }, []);

  // Auto-fetch data when wallet connects
  useEffect(() => {
    if (publicKey) {
      fetchBalances();
      fetchConfig();
      fetchMiner();
      fetchAutominer();
    }
  }, [publicKey, fetchBalances, fetchConfig, fetchMiner, fetchAutominer]);

  return {
    fetchBalances,
    fetchConfig,
    fetchMiner,
    fetchRound,
    fetchBet,
    fetchAutominer,
    fetchPool,
    initialize,
    initializeMiner,
    initializeRound,
    placeBet,
    finalizeRound,
    claimSol,
    claimBetSilver,
    refine,
    claimRedistribution,
    stake,
    unstake,
    claimRewards,
    createPool,
    joinPool,
    leavePool,
    setupAutominer,
    updateAutominer,
    depositAutominer,
    withdrawAutominer,
    disableAutominer,
    triggerMotherlode,
    // Auto-crank exports
    crankAutominer,
    startAutoCrank,
    stopAutoCrank,
    autoCrankEnabled,
    autoCrankStatus,
  };
}
