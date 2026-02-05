import { useCallback, useEffect, useState, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction, TransactionInstruction, ComputeBudgetProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { useStore } from './useStore';
import { PROGRAM_ID, TOKEN_DECIMALS, WARCHEST_WALLET, ADMIN_WALLET, DEFAULT_SCAN_RANGE, SOLSCAN_TX_URL } from '../utils/constants';
import { SEEDS, DISCRIMINATORS } from '../utils/idl';
import toast from 'react-hot-toast';

// Solscan-linked toast helper — shows sig + opens explorer on click
const txToast = (message: string, signature: string) => {
  const shortSig = signature.slice(0, 8) + '...' + signature.slice(-4);
  const url = `${SOLSCAN_TX_URL}${signature}`;
  toast.success(`${message}\n🔗 ${shortSig}`, {
    duration: 6000,
    style: { cursor: 'pointer', whiteSpace: 'pre-line' },
  });
  console.log(`[TX] ${message} — ${url}`);
};

// Smart error parser — translates Solana/program errors to actionable user messages
const parseError = (error: any, context: string): string => {
  const msg = error?.message || error?.toString() || '';
  const logs = (error?.logs || []).join(' ');
  const combined = `${msg} ${logs}`.toLowerCase();

  // Wallet / connection
  if (combined.includes('user rejected') || combined.includes('user denied'))
    return 'Transaction cancelled';
  if (combined.includes('insufficient funds') || combined.includes('insufficient lamports'))
    return 'Not enough SOL for transaction fees (need ~0.01 SOL)';
  if (combined.includes('blockhash not found') || combined.includes('block height exceeded'))
    return 'Transaction expired — please try again';

  // Token / account
  if (combined.includes('0x1') || (combined.includes('insufficient') && combined.includes('token')))
    return `Insufficient SILVER balance for ${context}`;
  if (combined.includes('account not found') || combined.includes('accountnotinitialized'))
    return 'Account not found — initialize your miner first';
  
  // Program errors (numeric)
  const codeMatch = combined.match(/custom program error: (0x[0-9a-f]+)/i);
  if (codeMatch) {
    const code = parseInt(codeMatch[1], 16);
    const map: Record<number, string> = {
      0x6001: 'Unauthorized action',
      0x6002: 'Invalid amount',
      0x6003: 'Miner not initialized — click "Initialize Miner" first',
      0x6004: 'Round not finalized yet',
      0x6005: 'Round already finalized',
      0x6006: 'Betting closed for this round',
      0x6007: 'Invalid mine level for your account',
      0x6008: 'Already claimed',
      0x6009: 'Nothing to claim',
      0x600a: 'Pool is full (max 25 members)',
      0x600b: 'Not in a pool',
      0x600c: 'Already in a pool',
      0x6020: 'Protocol is paused by admin',
      0x6026: '⏱️ Round timer not finished — wait for countdown',
    };
    return map[code] || `${context} failed (error code: ${codeMatch[1]})`;
  }

  // Named errors
  if (combined.includes('alreadyclaimed')) return 'Already claimed';
  if (combined.includes('nothingtoclaim')) return 'Nothing to claim';
  if (combined.includes('protocolpaused')) return 'Protocol is paused';
  if (combined.includes('roundnotended')) return '⏱️ Round not ended yet';
  if (combined.includes('bettingclosed')) return 'Betting closed — wait for next round';
  
  // Network
  if (combined.includes('timeout') || combined.includes('network')) return 'Network error — try again';
  if (combined.includes('429')) return 'Rate limited — wait a moment';

  // Simulation failures
  if (combined.includes('simulation failed'))
    return `${context} simulation failed — check your inputs and try again`;

  // Fallback
  const clean = msg.replace(/^Error:\s*/i, '').slice(0, 100);
  return clean || `${context} failed — please try again`;
};

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
  const { setBalances, setMiner, setConfig, setRound, setPool, setAutominer, setIsLoading, config, autominer, miner: storeMiner } = useStore();

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
      const signature = await sendTransaction(transaction, connection);
      
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

  // Helper to send a full pre-built Transaction with error checking
  const sendFullTx = useCallback(async (transaction: Transaction) => {
    if (!publicKey) throw new Error('Wallet not connected');
    
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;
    
    const signature = await sendTransaction(transaction, connection, { skipPreflight: true });
    console.log('Transaction sent:', signature);
    
    const confirmation = await connection.confirmTransaction({
      signature, blockhash, lastValidBlockHeight
    }, 'confirmed');
    
    if (confirmation.value.err) {
      console.error('Transaction error:', confirmation.value.err);
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }
    
    return signature;
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
      const paused = data.readUInt8(offset) === 1; offset += 1;
      // v2 fields
      const adminMintedSilver = data.length > offset + 8 ? data.readBigUInt64LE(offset) : BigInt(0); offset += 8;
      const motherlodeRoundNumber = data.length > offset + 8 ? data.readBigUInt64LE(offset) : BigInt(0); offset += 8;
      const motherlodePrize = data.length > offset + 8 ? data.readBigUInt64LE(offset) : BigInt(0); offset += 8;
      const motherlodeWinnerKey = data.length > offset + 32 ? new PublicKey(data.slice(offset, offset + 32)) : new PublicKey(new Uint8Array(32)); offset += 32;
      const motherlodeBestScore = data.length > offset + 8 ? data.readBigUInt64LE(offset) : BigInt(0); offset += 8;
      
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
        adminMintedSilver: Number(adminMintedSilver),
        motherlodeRoundNumber: Number(motherlodeRoundNumber),
        motherlodePrize: Number(motherlodePrize),
        motherlodeWinnerKey,
        motherlodeBestScore: Number(motherlodeBestScore),
      });
      
      // Debug logging
      console.log('=== Config State ===');
      console.log('Current Round:', Number(currentRound));
      console.log('Round Start Time:', Number(roundStartTime));
      console.log('Motherlode Balance:', Number(motherlodeBalance));
      console.log('Motherlode Prize:', Number(motherlodePrize));
      console.log('Motherlode Round:', Number(motherlodeRoundNumber));
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
            
            // Skip members array (25 * 32 bytes)
            pOffset += 25 * 32;
            
            const active = poolData.readUInt8(pOffset) === 1;
            
            // Find pool ID by scanning (check first 200 pools)
            let foundPoolId = 0;
            for (let i = 0; i < 200; i++) {
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
      offset += 8; // solo_seed (skip)
      offset += 8; // solo_best_score (skip)
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
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: roundPDA, isSigner: false, isWritable: true },
          { pubkey: betPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.claimSol,
      });
      
      const sig = await sendTx(instruction);
      txToast('SOL winnings claimed!', sig);
      await new Promise(r => setTimeout(r, 1500));
      await fetchBalances();
      await fetchMiner();
      await fetchConfig();
      setTimeout(async () => { try { await fetchBalances(); await fetchMiner(); } catch {} }, 3000);
    } catch (error: any) {
      console.error('Claim SOL failed:', error);
      if (error.message?.includes('NothingToClaim')) {
        toast.error('No winnings to claim for this round');
      } else if (error.message?.includes('AlreadyClaimed')) {
        toast.error('Already claimed');
      } else {
        toast.error(parseError(error, 'Claim SOL'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, sendTx, fetchBalances, fetchMiner, fetchConfig, setIsLoading]);

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
      
      const sig = await sendFullTx(transaction);
      
      txToast('UNREFINED tokens claimed!', sig);
      await fetchBalances();
    } catch (error: any) {
      console.error('Claim UNREFINED failed:', error);
      if (error.message?.includes('AlreadyClaimed')) {
        toast.error('Already claimed');
      } else {
        toast.error(parseError(error, 'Claim'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendFullTx, fetchBalances, setIsLoading]);

  // Claim BOTH SOL winnings + UNREFINED from a round in ONE transaction
  const claimRoundAll = useCallback(async (roundNumber: number, solUnclaimed: boolean, silverUnclaimed: boolean) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!solUnclaimed && !silverUnclaimed) {
      toast.error('Nothing to claim');
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
      
      const instructions: TransactionInstruction[] = [];
      instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }));
      const claimed: string[] = [];
      
      // Ensure UNREFINED ATA exists if claiming silver
      if (silverUnclaimed) {
        const ataInfo = await connection.getAccountInfo(claimerAta);
        if (!ataInfo) {
          instructions.push(createAssociatedTokenAccountInstruction(publicKey, claimerAta, publicKey, unrefinedMint));
        }
      }
      
      // 1. Claim SOL winnings
      if (solUnclaimed) {
        instructions.push(new TransactionInstruction({
          keys: [
            { pubkey: publicKey, isSigner: true, isWritable: true },
            { pubkey: minerPDA, isSigner: false, isWritable: true },
            { pubkey: configPDA, isSigner: false, isWritable: true },
            { pubkey: roundPDA, isSigner: false, isWritable: true },
            { pubkey: betPDA, isSigner: false, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: PROGRAM_ID,
          data: DISCRIMINATORS.claimSol,
        }));
        claimed.push('SOL');
      }
      
      // 2. Claim UNREFINED tokens
      if (silverUnclaimed) {
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
        claimed.push('UNREFINED');
      }
      
      const transaction = new Transaction().add(...instructions);
      await sendFullTx(transaction);
      
      toast.success(`Claimed ${claimed.join(' + ')} from round ${roundNumber}!`);
      await new Promise(r => setTimeout(r, 1500));
      await fetchBalances();
      await fetchMiner();
      await fetchConfig();
      setTimeout(async () => { try { await fetchBalances(); await fetchMiner(); } catch {} }, 3000);
    } catch (error: any) {
      console.error('Claim round all failed:', error);
      if (error.message?.includes('AlreadyClaimed')) {
        toast.error('Already claimed');
      } else {
        toast.error(parseError(error, 'Claim'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendFullTx, fetchBalances, fetchMiner, setIsLoading]);

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
      toast.error(parseError(error, 'Initialize protocol'));
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
      toast.error(parseError(error, 'Initialize miner'));
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
      toast.error(parseError(error, 'Initialize round'));
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
    
    // Pre-flight validation
    const selectedCount = blocks.filter(b => b).length;
    if (selectedCount === 0) {
      toast.error('Select at least one block to bet on');
      return;
    }
    const totalCost = selectedCount * solPerBlock;
    try {
      const solBalance = await connection.getBalance(publicKey) / LAMPORTS_PER_SOL;
      if (totalCost > solBalance - 0.005) {
        toast.error(`Insufficient SOL. Need ${totalCost.toFixed(4)} SOL + fees, have ${solBalance.toFixed(4)} SOL`);
        return;
      }
    } catch {}
    
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
      
      const sig = await sendTx(instruction);
      
      const blocksCount = blocks.filter(b => b).length;
      const totalSol = blocksCount * solPerBlock;
      txToast(`Bet placed: ${totalSol.toFixed(4)} SOL on ${blocksCount} blocks`, sig);
      await fetchBalances();
      // Refresh round to show updated totals
      await fetchRound(Number(currentRound));
    } catch (error: any) {
      console.error('Place bet failed:', error);
      toast.error(parseError(error, 'Place bet'));
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
        toast.success(`Round ${nextRound.toString()} started!`);
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
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount to stake');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const [minerPDA] = getMinerPDA(publicKey);
      const [silverMint] = getSilverMintPDA();
      
      const ownerSilverAta = await getAssociatedTokenAddress(silverMint, publicKey);
      const stakingVault = await getAssociatedTokenAddress(silverMint, configPDA, true);
      
      // Validate user has enough SILVER
      try {
        const ataInfo = await connection.getTokenAccountBalance(ownerSilverAta);
        const balance = Number(ataInfo.value.amount) / Math.pow(10, TOKEN_DECIMALS);
        if (amount > balance) {
          toast.error(`Insufficient SILVER. You have ${balance.toFixed(2)} SILVER.`);
          setIsLoading(false);
          return;
        }
      } catch {
        toast.error('No SILVER token account found. You need SILVER to stake.');
        setIsLoading(false);
        return;
      }
      
      const lamports = BigInt(Math.floor(amount * Math.pow(10, TOKEN_DECIMALS)));
      const data = Buffer.alloc(8);
      data.writeBigUInt64LE(lamports);
      
      const instructions: TransactionInstruction[] = [];
      
      // Auto-create staking vault ATA if it doesn't exist
      const vaultInfo = await connection.getAccountInfo(stakingVault);
      if (!vaultInfo) {
        console.log('Creating staking vault ATA...');
        instructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,       // payer
            stakingVault,    // ata to create
            configPDA,       // owner of the ATA (the config PDA)
            silverMint       // mint
          )
        );
      }
      
      instructions.push(new TransactionInstruction({
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
      }));
      
      const transaction = new Transaction().add(...instructions);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
      
      txToast(`Staked ${amount} SILVER`, signature);
      await fetchBalances();
      await fetchMiner();
    } catch (error: any) {
      console.error('Stake failed:', error);
      toast.error(parseError(error, 'Stake'));
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
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount to unstake');
      return;
    }
    // Validate against staked balance
    if (storeMiner && amount > (storeMiner.stakedAmount / Math.pow(10, TOKEN_DECIMALS))) {
      toast.error(`You only have ${(storeMiner.stakedAmount / Math.pow(10, TOKEN_DECIMALS)).toFixed(4)} SILVER staked`);
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
      
      const instructions: TransactionInstruction[] = [];
      
      // Ensure owner ATA exists for receiving unstaked tokens
      const ownerAtaInfo = await connection.getAccountInfo(ownerSilverAta);
      if (!ownerAtaInfo) {
        instructions.push(
          createAssociatedTokenAccountInstruction(publicKey, ownerSilverAta, publicKey, silverMint)
        );
      }
      
      instructions.push(new TransactionInstruction({
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
      }));
      
      const transaction = new Transaction().add(...instructions);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
      
      txToast(`Unstaked ${amount} SILVER`, signature);
      await fetchBalances();
      await fetchMiner();
    } catch (error: any) {
      console.error('Unstake failed:', error);
      toast.error(parseError(error, 'Unstake'));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, storeMiner, fetchBalances, fetchMiner, setIsLoading]);

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
      
      const instructions: TransactionInstruction[] = [];
      
      // Ensure SILVER ATA exists
      const silverAtaInfo = await connection.getAccountInfo(ownerSilverAta);
      if (!silverAtaInfo) {
        instructions.push(
          createAssociatedTokenAccountInstruction(publicKey, ownerSilverAta, publicKey, silverMint)
        );
      }
      
      instructions.push(new TransactionInstruction({
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
      }));
      
      let sig: string;
      if (instructions.length > 1) {
        const transaction = new Transaction().add(...instructions);
        sig = await sendFullTx(transaction);
      } else {
        sig = await sendTx(instructions[0]);
      }
      
      txToast('Claimed staking rewards!', sig);
      await fetchBalances();
      await fetchMiner();
    } catch (error: any) {
      console.error('Claim rewards failed:', error);
      toast.error(parseError(error, 'Claim staking rewards'));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTx, sendFullTx, fetchBalances, fetchMiner, setIsLoading]);

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
      
      // Validate user has UNREFINED to refine
      try {
        const ataInfo = await connection.getTokenAccountBalance(ownerUnrefinedAta);
        if (Number(ataInfo.value.amount) === 0) {
          toast.error('No UNREFINED to refine. Earn UNREFINED by betting in rounds.');
          setIsLoading(false);
          return;
        }
      } catch {
        toast.error('No UNREFINED token account found. Earn UNREFINED by betting in rounds.');
        setIsLoading(false);
        return;
      }
      
      const instructions: TransactionInstruction[] = [];
      
      // Ensure SILVER ATA exists (may not if user never received SILVER before)
      const silverAtaInfo = await connection.getAccountInfo(ownerSilverAta);
      if (!silverAtaInfo) {
        instructions.push(
          createAssociatedTokenAccountInstruction(publicKey, ownerSilverAta, publicKey, silverMint)
        );
      }
      
      instructions.push(new TransactionInstruction({
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
      }));
      
      let sig: string;
      if (instructions.length > 1) {
        // Has ATA creation + refine — use sendFullTx for multi-instruction
        const transaction = new Transaction().add(...instructions);
        sig = await sendFullTx(transaction);
      } else {
        // Just refine — use sendTx (with preflight simulation)
        sig = await sendTx(instructions[0]);
      }
      
      txToast('Refined all UNREFINED to SILVER! (90% to you, 10% to redistribution pool)', sig);
      await new Promise(r => setTimeout(r, 1500));
      await fetchBalances();
      await fetchMiner();
      await fetchConfig();
      setTimeout(async () => { try { await fetchBalances(); await fetchMiner(); } catch {} }, 3000);
    } catch (error: any) {
      console.error('Refine failed:', error);
      toast.error(parseError(error, 'Refine'));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTx, sendFullTx, fetchBalances, fetchMiner, setIsLoading]);

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
      
      // Validate user has UNREFINED (required for redistribution eligibility)
      try {
        const ataInfo = await connection.getTokenAccountBalance(ownerUnrefinedAta);
        if (Number(ataInfo.value.amount) === 0) {
          toast.error('You need UNREFINED tokens to be eligible for redistribution.');
          setIsLoading(false);
          return;
        }
      } catch {
        toast.error('No UNREFINED token account. Earn UNREFINED by betting first.');
        setIsLoading(false);
        return;
      }
      
      const instructions: TransactionInstruction[] = [];
      
      // Ensure SILVER ATA exists
      const silverAtaInfo = await connection.getAccountInfo(ownerSilverAta);
      if (!silverAtaInfo) {
        instructions.push(
          createAssociatedTokenAccountInstruction(publicKey, ownerSilverAta, publicKey, silverMint)
        );
      }
      
      instructions.push(new TransactionInstruction({
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
      }));
      
      let sig: string;
      if (instructions.length > 1) {
        const transaction = new Transaction().add(...instructions);
        sig = await sendFullTx(transaction);
      } else {
        sig = await sendTx(instructions[0]);
      }
      
      txToast('Claimed redistribution rewards!', sig);
      await fetchBalances();
      await fetchMiner();
    } catch (error: any) {
      console.error('Claim redistribution failed:', error);
      toast.error(parseError(error, 'Claim redistribution'));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTx, sendFullTx, fetchBalances, fetchMiner, setIsLoading]);

  // Claim ALL rewards: unclaimed round winnings (SOL + UNREFINED) + staking + pending + redistribution
  // Uses signAllTransactions for ONE wallet popup regardless of how many rounds
  const claimAllRewards = useCallback(async (deepScan = false) => {
    if (!publicKey || !wallet.signAllTransactions) {
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

      // 1. Read fresh config to get current round
      const configAccount = await connection.getAccountInfo(configPDA);
      if (!configAccount) { toast.error('Config not found'); setIsLoading(false); return; }
      const currentRound = Number(configAccount.data.readBigUInt64LE(8 + 32 + 32 + 32));

      // 2. Scan rounds for unclaimed bets
      let startRound = 1;
      if (!deepScan) {
        // Normal mode: use localStorage checkpoint + DEFAULT_SCAN_RANGE
        let lastScan = 1;
        try {
          const saved = localStorage.getItem('silver_last_claim_scan');
          if (saved) lastScan = Math.max(1, parseInt(saved) - 5); // overlap 5 rounds for safety
        } catch {}
        startRound = Math.max(1, Math.max(lastScan, currentRound - DEFAULT_SCAN_RANGE));
      }
      const scanCount = currentRound - startRound;
      toast.loading(deepScan ? `Deep scan: checking ALL ${scanCount} rounds from #1...` : `Scanning ${scanCount} recent rounds...`, { id: 'scan' });
      
      const betPDAs: PublicKey[] = [];
      const roundPDAs: PublicKey[] = [];
      const roundNumbers: number[] = [];
      for (let r = startRound; r < currentRound; r++) {
        betPDAs.push(getBetPDA(publicKey, BigInt(r))[0]);
        roundPDAs.push(getRoundPDA(BigInt(r))[0]);
        roundNumbers.push(r);
      }
      
      // Batch fetch all accounts
      const allKeys = [...betPDAs, ...roundPDAs];
      const batchSize = 100;
      const allAccounts: (any | null)[] = [];
      for (let i = 0; i < allKeys.length; i += batchSize) {
        const results = await connection.getMultipleAccountsInfo(allKeys.slice(i, i + batchSize));
        allAccounts.push(...results);
      }
      
      const betAccounts = allAccounts.slice(0, betPDAs.length);
      const roundAccounts = allAccounts.slice(betPDAs.length);
      
      // 3. Find unclaimed winning bets
      interface UnclaimedRound {
        roundNumber: number;
        betPDA: PublicKey;
        roundPDA: PublicKey;
        solUnclaimed: boolean;
        silverUnclaimed: boolean;
      }
      const unclaimedRounds: UnclaimedRound[] = [];
      
      for (let i = 0; i < roundNumbers.length; i++) {
        const betAcc = betAccounts[i];
        const roundAcc = roundAccounts[i];
        if (!betAcc || !roundAcc) continue;
        
        const rData = roundAcc.data;
        const finalized = rData.readUInt8(32) === 1;
        if (!finalized) continue;
        const winningBlock = rData.readUInt8(33);
        
        const bData = betAcc.data;
        const betOnWinner = bData.readUInt8(49 + winningBlock) === 1;
        
        const claimed = bData.readUInt8(70) === 1;
        const silverClaimed = bData.readUInt8(71) === 1;
        
        // SOL claims: ONLY for winners
        const solUnclaimed = betOnWinner && !claimed;
        // UNREFINED claims: for ALL participants (winners AND losers get mining rewards)
        const silverUnclaimed = !silverClaimed;
        
        if (solUnclaimed || silverUnclaimed) {
          unclaimedRounds.push({
            roundNumber: roundNumbers[i],
            betPDA: betPDAs[i],
            roundPDA: roundPDAs[i],
            solUnclaimed,
            silverUnclaimed,
          });
        }
      }
      
      // 4. Check accumulated rewards
      const [minerAccount, unrefinedAtaAccount, silverAtaAccount] = await Promise.all([
        connection.getAccountInfo(minerPDA),
        connection.getAccountInfo(ownerUnrefinedAta),
        connection.getAccountInfo(ownerSilverAta),
      ]);
      
      let hasStaking = false;
      let hasPendingUnrefined = false;
      if (minerAccount) {
        const mData = minerAccount.data;
        let mo = 8 + 32 + 1 + 8 + 32 + 1;
        const stakedAmount = Number(mData.readBigUInt64LE(mo)); mo += 8;
        const pendingRewards = Number(mData.readBigUInt64LE(mo)); mo += 8;
        mo += 8;
        const pendingUnrefined = Number(mData.readBigUInt64LE(mo));
        hasStaking = stakedAmount > 0 || pendingRewards > 0;
        hasPendingUnrefined = pendingUnrefined > 0;
      }
      
      let hasRedist = false;
      const co = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8 + 2 + 8;
      const redistPool = Number(configAccount.data.readBigUInt64LE(co));
      let unrefinedBalance = 0;
      if (unrefinedAtaAccount && unrefinedAtaAccount.data.length >= 72) {
        unrefinedBalance = Number(unrefinedAtaAccount.data.readBigUInt64LE(64));
      }
      hasRedist = redistPool > 0 && unrefinedBalance > 0;
      
      toast.dismiss('scan');
      
      console.log('=== Claim All ===');
      console.log('Unclaimed rounds:', unclaimedRounds.length, unclaimedRounds.map(r => r.roundNumber));
      console.log('hasStaking:', hasStaking, '| hasPendingUnrefined:', hasPendingUnrefined, '| hasRedist:', hasRedist);
      
      if (unclaimedRounds.length === 0 && !hasStaking && !hasPendingUnrefined && !hasRedist) {
        toast.error('No rewards to claim');
        setIsLoading(false);
        return;
      }
      
      // 5. Build ALL transactions (5 rounds per TX max)
      const ROUNDS_PER_TX = 5;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      const transactions: Transaction[] = [];
      let totalRoundsClaimed = 0;
      const claimedParts: string[] = [];
      
      // Helper: build ATA-ensure instructions
      const ensureAtaIxs: TransactionInstruction[] = [];
      if (!silverAtaAccount) {
        ensureAtaIxs.push(createAssociatedTokenAccountInstruction(publicKey, ownerSilverAta, publicKey, silverMint));
      }
      if (!unrefinedAtaAccount) {
        ensureAtaIxs.push(createAssociatedTokenAccountInstruction(publicKey, ownerUnrefinedAta, publicKey, unrefinedMint));
      }
      
      // Split rounds into chunks
      const chunks: UnclaimedRound[][] = [];
      for (let i = 0; i < unclaimedRounds.length; i += ROUNDS_PER_TX) {
        chunks.push(unclaimedRounds.slice(i, i + ROUNDS_PER_TX));
      }
      
      // If no round chunks but we have accumulated rewards, create an empty chunk
      if (chunks.length === 0 && (hasStaking || hasPendingUnrefined || hasRedist)) {
        chunks.push([]);
      }
      
      for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];
        const ixs: TransactionInstruction[] = [];
        
        ixs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }));
        
        // Add ATA creation only to first TX
        if (ci === 0) {
          ixs.push(...ensureAtaIxs);
        }
        
        // Add round claims
        for (const rc of chunk) {
          if (rc.solUnclaimed) {
            ixs.push(new TransactionInstruction({
              keys: [
                { pubkey: publicKey, isSigner: true, isWritable: true },
                { pubkey: minerPDA, isSigner: false, isWritable: true },
                { pubkey: configPDA, isSigner: false, isWritable: true },
                { pubkey: rc.roundPDA, isSigner: false, isWritable: true },
                { pubkey: rc.betPDA, isSigner: false, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
              ],
              programId: PROGRAM_ID,
              data: DISCRIMINATORS.claimSol,
            }));
          }
          if (rc.silverUnclaimed) {
            ixs.push(new TransactionInstruction({
              keys: [
                { pubkey: publicKey, isSigner: true, isWritable: true },
                { pubkey: minerPDA, isSigner: false, isWritable: true },
                { pubkey: configPDA, isSigner: false, isWritable: true },
                { pubkey: rc.roundPDA, isSigner: false, isWritable: true },
                { pubkey: rc.betPDA, isSigner: false, isWritable: true },
                { pubkey: unrefinedMint, isSigner: false, isWritable: true },
                { pubkey: ownerUnrefinedAta, isSigner: false, isWritable: true },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
              ],
              programId: PROGRAM_ID,
              data: DISCRIMINATORS.claimBetSilver,
            }));
          }
          totalRoundsClaimed++;
        }
        
        // Add accumulated rewards to FIRST TX only
        if (ci === 0) {
          if (hasStaking) {
            ixs.push(new TransactionInstruction({
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
            }));
            claimedParts.push('staking');
          }
          if (hasPendingUnrefined) {
            ixs.push(new TransactionInstruction({
              keys: [
                { pubkey: publicKey, isSigner: true, isWritable: true },
                { pubkey: minerPDA, isSigner: false, isWritable: true },
                { pubkey: configPDA, isSigner: false, isWritable: true },
                { pubkey: unrefinedMint, isSigner: false, isWritable: true },
                { pubkey: ownerUnrefinedAta, isSigner: false, isWritable: true },
                { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
              ],
              programId: PROGRAM_ID,
              data: DISCRIMINATORS.claimSilver,
            }));
            claimedParts.push('pending UNREFINED');
          }
          if (hasRedist) {
            ixs.push(new TransactionInstruction({
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
            }));
            claimedParts.push('redistribution');
          }
        }
        
        const tx = new Transaction().add(...ixs);
        tx.recentBlockhash = blockhash;
        tx.feePayer = publicKey;
        transactions.push(tx);
      }
      
      if (totalRoundsClaimed > 0) {
        claimedParts.unshift(`${totalRoundsClaimed} round(s)`);
      }
      
      console.log(`Built ${transactions.length} transaction(s) for: ${claimedParts.join(', ')}`);
      
      // 6. Sign ALL transactions in ONE popup
      toast.loading(`Approve ${transactions.length} transaction(s) in your wallet...`, { id: 'sign' });
      const signedTxs = await wallet.signAllTransactions(transactions);
      toast.dismiss('sign');
      
      // 7. Send all signed transactions
      let successCount = 0;
      for (let i = 0; i < signedTxs.length; i++) {
        toast.loading(`Sending transaction ${i + 1}/${signedTxs.length}...`, { id: 'send' });
        try {
          const rawTx = signedTxs[i].serialize();
          const sig = await connection.sendRawTransaction(rawTx, { skipPreflight: true });
          await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
          successCount++;
        } catch (err: any) {
          console.error(`TX ${i + 1} failed:`, err);
        }
      }
      toast.dismiss('send');
      
      if (successCount === signedTxs.length) {
        toast.success(`Claimed all: ${claimedParts.join(', ')}!`);
      } else {
        toast.success(`Claimed ${successCount}/${signedTxs.length} transactions. Click again for any remaining.`);
      }
      
      // Save last scanned round for optimization
      try {
        localStorage.setItem('silver_last_claim_scan', String(currentRound));
      } catch {}
      
      // Wait for state to settle on-chain before refreshing
      await new Promise(r => setTimeout(r, 2000));
      await fetchBalances();
      await fetchMiner();
      await fetchConfig();
      // Schedule a second refresh to catch any propagation delay
      setTimeout(async () => {
        try {
          await fetchBalances();
          await fetchMiner();
          await fetchConfig();
        } catch {}
      }, 4000);
    } catch (error: any) {
      toast.dismiss('scan');
      toast.dismiss('sign');
      toast.dismiss('send');
      console.error('Claim all rewards failed:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction rejected');
      } else {
        toast.error(parseError(error, 'Claim'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, wallet, connection, fetchBalances, fetchMiner, fetchConfig, setIsLoading]);

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
      
      const createPoolIx = new TransactionInstruction({
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
      
      // Pool is 878 bytes — needs extra compute budget to init
      const transaction = new Transaction().add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }),
        createPoolIx
      );
      
      await sendFullTx(transaction);
      
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
        const logError = error.logs.find((l: string) => l.includes('Error') || l.includes('failed'));
        toast.error(logError || 'Create pool failed - check console');
      } else {
        toast.error('Create pool failed - check console');
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchConfig, fetchMiner, setIsLoading]);

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
      
      // Parse is_in_pool (offset 81) and pool pubkey (offset 49)
      const isInPool = minerAccount.data[81] === 1;
      if (!isInPool) {
        toast.error('You are not in a pool');
        setIsLoading(false);
        return;
      }
      
      const poolPubkey = new PublicKey(minerAccount.data.slice(49, 81));
      if (poolPubkey.equals(PublicKey.default)) {
        toast.error('Invalid pool address on your miner account');
        setIsLoading(false);
        return;
      }
      
      console.log('Leaving pool:', poolPubkey.toBase58());
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: poolPubkey, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.leavePool,
      });
      
      await sendTx(instruction);
      
      toast.success('Left pool successfully!');
      setPool(null);
      await fetchMiner();
      await fetchConfig();
    } catch (error: any) {
      console.error('Leave pool failed:', error);
      if (error.message?.includes('Unauthorized')) {
        toast.error('Pool creators cannot leave their own pool');
      } else if (error.message?.includes('NotInPool')) {
        toast.error('You are not a member of this pool');
      } else {
        toast.error(parseError(error, 'Leave pool'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTx, fetchMiner, fetchConfig, setPool, setIsLoading]);

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
      
      await sendTx(instruction);
      
      toast.success('Joined pool!');
      await fetchMiner();
    } catch (error: any) {
      console.error('Join pool failed:', error);
      if (error.message?.includes('AlreadyInPool')) {
        toast.error('Already in a pool — leave first');
      } else if (error.message?.includes('PoolFull')) {
        toast.error('Pool is full');
      } else {
        toast.error(parseError(error, 'Join pool'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTx, fetchMiner, setIsLoading]);

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
      
      // Parse members array (25 pubkeys)
      const members: PublicKey[] = [];
      for (let i = 0; i < 25; i++) {
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
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('AutoMiner setup complete!');
      await fetchAutominer();
    } catch (error: any) {
      console.error('Setup autominer failed:', error);
      toast.error(parseError(error, 'AutoMiner setup'));
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
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('AutoMiner updated!');
      await fetchAutominer();
    } catch (error: any) {
      console.error('Update autominer failed:', error);
      toast.error(parseError(error, 'Update'));
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
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success(`Deposited ${amount} SOL to AutoMiner`);
      await fetchBalances();
      await fetchAutominer();
    } catch (error: any) {
      console.error('Deposit to autominer failed:', error);
      toast.error(parseError(error, 'Deposit'));
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
    if (amount <= 0) {
      toast.error('Please enter an amount greater than 0');
      return;
    }
    // Client-side balance check to avoid wasting gas
    if (autominer && amount > autominer.balance / LAMPORTS_PER_SOL) {
      toast.error(`Insufficient escrow balance. Available: ${(autominer.balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
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
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      txToast(`Withdrew ${amount} SOL from AutoMiner`, signature);
      await fetchBalances();
      await fetchAutominer();
    } catch (error: any) {
      console.error('Withdraw from autominer failed:', error);
      toast.error(parseError(error, 'Withdraw'));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchBalances, fetchAutominer, setIsLoading, autominer]);

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
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('AutoMiner disabled');
      await fetchAutominer();
    } catch (error: any) {
      console.error('Disable autominer failed:', error);
      toast.error(parseError(error, 'Disable AutoMiner'));
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
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('Motherlode jackpot triggered! Claim SOL from this round to enter the raffle!');
      console.log(`[TX] Motherlode triggered — ${SOLSCAN_TX_URL}${signature}`);
      await fetchConfig();
      await fetchMiner();
    } catch (error: any) {
      console.error('Trigger motherlode failed:', error);
      toast.error(parseError(error, 'Trigger motherlode'));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchConfig, fetchMiner, setIsLoading]);

  // Collect motherlode prize - permissionless, anyone can call after 1hr claim window
  const collectMotherlode = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!config) {
      toast.error('Config not loaded');
      return;
    }
    // Pre-flight: validate motherlode state before sending TX
    if (!config.motherlodeRoundNumber || config.motherlodeRoundNumber === 0) {
      toast.error('No active motherlode raffle — the jackpot hasn\'t triggered yet');
      return;
    }
    if (config.motherlodeWinnerKey.equals(PublicKey.default)) {
      toast.error('No winner determined yet — players must claim SOL from the motherlode round first to enter the raffle');
      return;
    }
    if (!config.motherlodePrize || config.motherlodePrize === 0) {
      toast.error('Motherlode prize is 0 — it may have already been collected');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const [roundPDA] = getRoundPDA(BigInt(config.motherlodeRoundNumber));
      const winnerKey = config.motherlodeWinnerKey;
      const [winnerMinerPDA] = getMinerPDA(winnerKey);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },      // caller
          { pubkey: configPDA, isSigner: false, isWritable: true },      // config
          { pubkey: roundPDA, isSigner: false, isWritable: false },      // round
          { pubkey: winnerKey, isSigner: false, isWritable: true },      // winner
          { pubkey: winnerMinerPDA, isSigner: false, isWritable: true }, // winner_miner
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.collectMotherlode,
      });
      
      const sig = await sendTx(instruction);
      txToast('Motherlode prize collected!', sig);
      await fetchConfig();
      await fetchBalances();
    } catch (error: any) {
      console.error('Collect motherlode failed:', error);
      const msg = error.message || '';
      if (msg.includes('RoundNotEnded') || msg.includes('6026')) {
        toast.error('Claim window not open yet — wait 1 hour after the motherlode round ends, then try again!');
      } else if (msg.includes('MotherlodeNotTriggered') || msg.includes('6009')) {
        toast.error('No motherlode winner set yet — players need to claim SOL from the motherlode round first');
      } else if (msg.includes('Unauthorized') || msg.includes('6001')) {
        toast.error('Only the motherlode winner can collect the prize');
      } else {
        toast.error(msg || 'Collection failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, config, connection, sendTx, fetchConfig, fetchBalances, setIsLoading]);

  // Claim Silver (pending UNREFINED from mining)
  const claimSilver = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const [minerPDA] = getMinerPDA(publicKey);
      const [unrefinedMint] = getUnrefinedMintPDA();
      
      const claimerAta = await getAssociatedTokenAddress(unrefinedMint, publicKey);
      
      // Create ATA if needed
      const instructions: TransactionInstruction[] = [];
      const ataInfo = await connection.getAccountInfo(claimerAta);
      if (!ataInfo) {
        instructions.push(
          createAssociatedTokenAccountInstruction(publicKey, claimerAta, publicKey, unrefinedMint)
        );
      }
      
      instructions.push(new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: minerPDA, isSigner: false, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: unrefinedMint, isSigner: false, isWritable: true },
          { pubkey: claimerAta, isSigner: false, isWritable: true },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.claimSilver,
      }));
      
      const transaction = new Transaction().add(...instructions);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');
      
      txToast('Claimed pending UNREFINED tokens!', signature);
      await fetchBalances();
      await fetchMiner();
    } catch (error: any) {
      console.error('Claim silver failed:', error);
      toast.error(parseError(error, 'Claim'));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, fetchBalances, fetchMiner, setIsLoading]);

  // Pause protocol (admin only)
  const pauseProtocol = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.pause,
      });
      await sendTx(instruction);
      toast.success('Protocol paused');
      await fetchConfig();
    } catch (error: any) {
      console.error('Pause failed:', error);
      toast.error(parseError(error, 'Pause'));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, sendTx, fetchConfig, setIsLoading]);

  // Unpause protocol (admin only)
  const unpauseProtocol = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.unpause,
      });
      await sendTx(instruction);
      toast.success('Protocol unpaused');
      await fetchConfig();
    } catch (error: any) {
      console.error('Unpause failed:', error);
      toast.error(parseError(error, 'Unpause'));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, sendTx, fetchConfig, setIsLoading]);

  // Update staking APR (admin only)
  const updateStakingApr = useCallback(async (newApr: number) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const data = Buffer.alloc(10); // 8 disc + 2 u16
      DISCRIMINATORS.updateStakingApr.copy(data, 0);
      data.writeUInt16LE(newApr, 8);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data,
      });
      await sendTx(instruction);
      toast.success(`Staking APR updated to ${(newApr / 100).toFixed(2)}%`);
      await fetchConfig();
    } catch (error: any) {
      console.error('Update APR failed:', error);
      toast.error(parseError(error, 'Update'));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, sendTx, fetchConfig, setIsLoading]);

  // Withdraw motherlode fees (admin only)
  const withdrawMotherlodeFees = useCallback(async (amount: number) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const data = Buffer.alloc(16); // 8 disc + 8 u64
      DISCRIMINATORS.withdrawMotherlodeFees.copy(data, 0);
      data.writeBigUInt64LE(BigInt(amount), 8);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      });
      await sendTx(instruction);
      toast.success('Motherlode fees withdrawn');
      await fetchConfig();
      await fetchBalances();
    } catch (error: any) {
      console.error('Withdraw motherlode fees failed:', error);
      toast.error(parseError(error, 'Withdrawal'));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, sendTx, fetchConfig, fetchBalances, setIsLoading]);

  // Withdraw autominer treasury (admin only)
  const withdrawAutominerTreasury = useCallback(async (amount: number) => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const data = Buffer.alloc(16); // 8 disc + 8 u64
      DISCRIMINATORS.withdrawAutominerTreasury.copy(data, 0);
      data.writeBigUInt64LE(BigInt(amount), 8);
      
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data,
      });
      await sendTx(instruction);
      toast.success('AutoMiner treasury withdrawn');
      await fetchConfig();
      await fetchBalances();
    } catch (error: any) {
      console.error('Withdraw autominer treasury failed:', error);
      toast.error(parseError(error, 'Withdrawal'));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, sendTx, fetchConfig, fetchBalances, setIsLoading]);

  // Admin: Reset stuck motherlode (moves prize back to balance, re-rolls target)
  const adminResetMotherlode = useCallback(async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }
    setIsLoading(true);
    try {
      const [configPDA] = getConfigPDA();
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: publicKey, isSigner: true, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: true },
        ],
        programId: PROGRAM_ID,
        data: DISCRIMINATORS.adminResetMotherlode,
      });
      await sendTx(instruction);
      toast.success('Motherlode reset — prize moved back to balance, new target set');
      await fetchConfig();
    } catch (error: any) {
      console.error('Admin reset motherlode failed:', error);
      toast.error(parseError(error, 'Reset'));
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, sendTx, fetchConfig, setIsLoading]);

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
      if (!silent) toast.error(parseError(error, 'Crank'));
      return false;
    }
  }, [publicKey, connection, sendTx, fetchBalances, fetchAutominer]);

  // Start auto-crank background process
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
        
        // Check if we already cranked this round
        if (currentRound === lastCrankedRoundRef.current) {
          setAutoCrankStatus(`Waiting for round ${currentRound + 1}...`);
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
        const data = autominerAccount.data;
        const enabled = data[8 + 32] === 1;
        const balance = Number(data.readBigUInt64LE(8 + 32 + 1 + 1 + 1));
        const solPerBlock = Number(data.readBigUInt64LE(8 + 32 + 1 + 1 + 1 + 8));
        
        if (!enabled) {
          setAutoCrankStatus('AutoMiner disabled');
          return;
        }
        
        const requiredBalance = solPerBlock * 5 + 1500000 + 10000; // 5 blocks + bet rent (~1.5M) + crank incentive
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
  }, [publicKey, connection, crankAutominer]);

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
    claimRoundAll,
    refine,
    claimRedistribution,
    stake,
    unstake,
    claimRewards,
    claimAllRewards,
    createPool,
    joinPool,
    leavePool,
    setupAutominer,
    updateAutominer,
    depositAutominer,
    withdrawAutominer,
    disableAutominer,
    triggerMotherlode,
    collectMotherlode,
    claimSilver,
    pauseProtocol,
    unpauseProtocol,
    updateStakingApr,
    withdrawMotherlodeFees,
    withdrawAutominerTreasury,
    adminResetMotherlode,
    // Auto-crank exports
    crankAutominer,
    startAutoCrank,
    stopAutoCrank,
    autoCrankEnabled,
    autoCrankStatus,
  };
}
