import { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { PROGRAM_ID, LAMPORTS_PER_SOL, TOKEN_DECIMALS, shortenAddress, WARCHEST_WALLET, ADMIN_WALLET } from '../utils/constants';
import { SEEDS } from '../utils/idl';

// PDA helpers — identical to useProgram.ts
const getConfigPDA = () => PublicKey.findProgramAddressSync([SEEDS.CONFIG], PROGRAM_ID);
const getRoundPDA = (roundNumber: bigint) => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(roundNumber);
  return PublicKey.findProgramAddressSync([SEEDS.ROUND, buf], PROGRAM_ID);
};

const MAX_SUPPLY = 50_000_000; // 50M SILVER hard cap

interface ConfigData {
  currentRound: number;
  roundStartTime: number;
  totalUnrefinedSupply: number;
  totalSilverSupply: number;
  totalStaked: number;
  totalPools: number;
  motherlodeBalance: number;
  stakingApr: number;
  redistributionPool: number;
  totalUnrefinedHolders: number;
  paused: boolean;
  adminMintedSilver: number;
  motherlodePrize: number;
}

interface RoundData {
  roundNumber: number;
  startTime: number;
  endTime: number;
  finalized: boolean;
  winningBlock: number;
  isSolo: boolean;
  soloWinner: string | null;
  totalPot: number;
  blockTotals: number[];
  winnerPot: number;
}

export default function ProtocolStats() {
  const { connection } = useConnection();
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRounds, setLoadingRounds] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [, setWarchestBalance] = useState<number>(0);
  const [, setAdminBalance] = useState<number>(0);
  const ROUNDS_PER_PAGE = 25;

  // ─── Config parsing (offsets match useProgram.ts exactly) ────────────
  const parseConfig = useCallback((data: Buffer): ConfigData => {
    let offset = 8; // discriminator
    offset += 32; // authority
    offset += 32; // silverMint
    offset += 32; // unrefinedMint
    const currentRound = Number(data.readBigUInt64LE(offset)); offset += 8;
    const roundStartTime = Number(data.readBigInt64LE(offset)); offset += 8;
    const totalUnrefinedSupply = Number(data.readBigUInt64LE(offset)); offset += 8;
    const totalSilverSupply = Number(data.readBigUInt64LE(offset)); offset += 8;
    const totalStaked = Number(data.readBigUInt64LE(offset)); offset += 8;
    const totalPools = Number(data.readBigUInt64LE(offset)); offset += 8;
    const motherlodeBalance = Number(data.readBigUInt64LE(offset)); offset += 8;
    offset += 8; // motherlodeTarget (hidden)
    const stakingApr = data.readUInt16LE(offset); offset += 2;
    offset += 8; // autominerTreasury
    const redistributionPool = Number(data.readBigUInt64LE(offset)); offset += 8;
    const totalUnrefinedHolders = Number(data.readBigUInt64LE(offset)); offset += 8;
    offset += 1; // configBump
    offset += 1; // silverBump
    offset += 1; // unrefinedBump
    offset += 1; // initialized
    const paused = data.readUInt8(offset) === 1; offset += 1;
    // v2 fields
    const adminMintedSilver = data.length > offset + 8 ? Number(data.readBigUInt64LE(offset)) : 0; offset += 8;
    offset += 8; // motherlodeRoundNumber
    const motherlodePrize = data.length > offset + 8 ? Number(data.readBigUInt64LE(offset)) : 0;
    return {
      currentRound, roundStartTime, totalUnrefinedSupply, totalSilverSupply,
      totalStaked, totalPools, motherlodeBalance, stakingApr,
      redistributionPool, totalUnrefinedHolders, paused,
      adminMintedSilver, motherlodePrize,
    };
  }, []);

  // ─── Round parsing (offsets match useProgram.ts exactly) ─────────────
  const parseRound = useCallback((data: Buffer): RoundData | null => {
    try {
      let offset = 8; // discriminator
      const roundNumber = Number(data.readBigUInt64LE(offset)); offset += 8;
      const startTime = Number(data.readBigInt64LE(offset)); offset += 8;
      const endTime = Number(data.readBigInt64LE(offset)); offset += 8;
      const finalized = data.readUInt8(offset) === 1; offset += 1;
      const winningBlock = data.readUInt8(offset); offset += 1;
      const isSolo = data.readUInt8(offset) === 1; offset += 1;
      const soloWinner = new PublicKey(data.slice(offset, offset + 32)); offset += 32;
      offset += 8; // solo_seed
      offset += 8; // solo_best_score
      const totalPot = Number(data.readBigUInt64LE(offset)); offset += 8;
      const blockTotals: number[] = [];
      for (let i = 0; i < 5; i++) {
        blockTotals.push(Number(data.readBigUInt64LE(offset)));
        offset += 8;
      }
      const winnerPot = Number(data.readBigUInt64LE(offset));
      return {
        roundNumber, startTime, endTime, finalized, winningBlock, isSolo,
        soloWinner: isSolo ? soloWinner.toBase58() : null,
        totalPot, blockTotals, winnerPot,
      };
    } catch {
      return null;
    }
  }, []);

  // ─── Fetch config ────────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    try {
      const [configPDA] = getConfigPDA();
      const accountInfo = await connection.getAccountInfo(configPDA);
      if (accountInfo) {
        setConfig(parseConfig(accountInfo.data as Buffer));
        setError(null);
      } else {
        setError('Protocol not initialized');
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
      setError('Failed to connect to Solana');
    }
  }, [connection, parseConfig]);

  // ─── Fetch a page of rounds (batch with getMultipleAccountsInfo) ────
  const fetchRounds = useCallback(async (currentRound: number, pageNum: number) => {
    setLoadingRounds(true);
    try {
      const startRound = Math.max(1, currentRound - (pageNum * ROUNDS_PER_PAGE));
      const endRound = Math.max(1, startRound - ROUNDS_PER_PAGE + 1);

      const pdas: PublicKey[] = [];
      for (let r = startRound; r >= endRound; r--) {
        const [pda] = getRoundPDA(BigInt(r));
        pdas.push(pda);
      }

      if (pdas.length === 0) {
        setRounds([]);
        setLoadingRounds(false);
        return;
      }

      const accounts = await connection.getMultipleAccountsInfo(pdas);
      const parsed: RoundData[] = [];
      for (const acc of accounts) {
        if (acc) {
          const round = parseRound(acc.data as Buffer);
          if (round) parsed.push(round);
        }
      }
      setRounds(parsed);
    } catch (err) {
      console.error('Failed to fetch rounds:', err);
    }
    setLoadingRounds(false);
  }, [connection, parseRound]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchConfig();
      // Fetch treasury wallet balances
      try {
        const [wBal, aBal] = await Promise.all([
          connection.getBalance(WARCHEST_WALLET),
          connection.getBalance(ADMIN_WALLET),
        ]);
        setWarchestBalance(wBal);
        setAdminBalance(aBal);
      } catch {}
      setLoading(false);
    };
    init();
  }, [fetchConfig, connection]);

  // Fetch rounds when config loads or page changes
  useEffect(() => {
    if (config) {
      fetchRounds(config.currentRound, page);
    }
  }, [config, page, fetchRounds]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConfig();
      if (config) fetchRounds(config.currentRound, page);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchConfig, fetchRounds, config, page]);

  // ─── Formatters ──────────────────────────────────────────────────────
  const fmtToken = (raw: number, decimals = 2) =>
    (raw / Math.pow(10, TOKEN_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: decimals });

  const fmtSol = (raw: number) =>
    (raw / LAMPORTS_PER_SOL).toLocaleString(undefined, { maximumFractionDigits: 4 });

  const supplyPct = config
    ? ((config.totalSilverSupply / Math.pow(10, TOKEN_DECIMALS)) / MAX_SUPPLY) * 100
    : 0;

  const totalPages = config ? Math.ceil(config.currentRound / ROUNDS_PER_PAGE) : 0;

  // Page-level SOL total for the displayed rounds
  const pageTotalSol = rounds.reduce((sum, r) => sum + r.totalPot, 0);

  // ─── Loading / Error states ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-copper-400 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-silver-400">Loading protocol data...</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <p className="text-red-400">{error || 'Failed to load'}</p>
        <button onClick={() => { window.location.hash = ''; }} className="text-silver-500 hover:text-copper-400 text-sm mt-4">
          ← Back to Protocol
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-copper-300 to-copper-500">
              Protocol Dashboard
            </h1>
            <p className="text-silver-500 text-xs mt-1">
              Live on-chain data &bull; Auto-refreshes every 30s
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${config.paused ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
            <span className={`text-sm font-semibold ${config.paused ? 'text-red-400' : 'text-emerald-400'}`}>
              {config.paused ? 'Paused' : 'Live'}
            </span>
          </div>
        </div>

        {/* ── Top Stats ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="card p-4">
            <p className="text-silver-500 text-xs mb-1">Current Round</p>
            <p className="text-2xl font-bold text-white">{config.currentRound.toLocaleString()}</p>
          </div>
          <div className="card p-4">
            <p className="text-silver-500 text-xs mb-1">SILVER Minted</p>
            <p className="text-2xl font-bold text-copper-300">{fmtToken(config.totalSilverSupply)}</p>
          </div>
          <div className="card p-4">
            <p className="text-silver-500 text-xs mb-1">UNREFINED Minted</p>
            <p className="text-2xl font-bold text-copper-400">{fmtToken(config.totalUnrefinedSupply)}</p>
          </div>
          <div className="card p-4">
            <p className="text-silver-500 text-xs mb-1">Total Staked</p>
            <p className="text-2xl font-bold text-emerald-400">{fmtToken(config.totalStaked)}</p>
            <p className="text-silver-600 text-xs">SILVER</p>
          </div>
        </div>

        {/* ── Supply Progress ───────────────────────────────────── */}
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold text-sm">Supply Progress to 50M Cap</h3>
            <span className="text-copper-400 text-sm font-bold">
              {supplyPct.toFixed(4)}%
            </span>
          </div>
          <div className="h-3 bg-silver-800 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-copper-600 to-copper-400 rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(supplyPct, 0.3)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-silver-500">
            <span>{fmtToken(config.totalSilverSupply)} minted</span>
            <span>{(MAX_SUPPLY - config.totalSilverSupply / Math.pow(10, TOKEN_DECIMALS)).toLocaleString(undefined, { maximumFractionDigits: 0 })} remaining</span>
          </div>
        </div>

        {/* ── Protocol Metrics ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="card p-3">
            <p className="text-silver-500 text-xs mb-1">Motherlode</p>
            <p className="text-lg font-bold text-copper-300">{fmtSol(config.motherlodeBalance + config.motherlodePrize)}</p>
            <p className="text-silver-600 text-xs">SOL</p>
            {config.motherlodePrize > 0 && (
              <p className="text-copper-200 text-xs mt-0.5">Raffle active</p>
            )}
          </div>
          <div className="card p-3">
            <p className="text-silver-500 text-xs mb-1">Staking APR</p>
            <p className="text-lg font-bold text-emerald-400">{(config.stakingApr / 100).toFixed(0)}%</p>
          </div>
          <div className="card p-3">
            <p className="text-silver-500 text-xs mb-1">Redist. Pool</p>
            <p className="text-lg font-bold text-copper-400">{fmtToken(config.redistributionPool)}</p>
            <p className="text-silver-600 text-xs">SILVER</p>
          </div>
          <div className="card p-3">
            <p className="text-silver-500 text-xs mb-1">Mining Pools</p>
            <p className="text-lg font-bold text-white">{config.totalPools}</p>
          </div>
          <div className="card p-3">
            <p className="text-silver-500 text-xs mb-1">Miners</p>
            <p className="text-lg font-bold text-white">{config.totalUnrefinedHolders}</p>
          </div>
          <div className="card p-3">
            <p className="text-silver-500 text-xs mb-1">Admin Minted</p>
            <p className="text-lg font-bold text-white">{fmtToken(config.adminMintedSilver)}</p>
            <p className="text-silver-600 text-xs">/ 50,000 cap</p>
          </div>
        </div>

        {/* ── Round History ─────────────────────────────────────── */}
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-bold text-lg">Round History</h3>
              {pageTotalSol > 0 && (
                <p className="text-silver-500 text-xs mt-0.5">
                  Page total: {fmtSol(pageTotalSol)} SOL across {rounds.filter(r => r.totalPot > 0).length} active rounds
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {loadingRounds && (
                <div className="animate-spin w-4 h-4 border-2 border-copper-400 border-t-transparent rounded-full" />
              )}
              <span className="text-silver-600 text-xs">
                Page {page + 1}/{Math.max(totalPages, 1)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-silver-700">
                  <th className="text-left text-silver-500 py-2 px-2 font-medium text-xs">Round</th>
                  <th className="text-center text-silver-500 py-2 px-1 font-medium text-xs">Status</th>
                  <th className="text-right text-silver-500 py-2 px-2 font-medium text-xs">Pot (SOL)</th>
                  <th className="text-center text-silver-500 py-2 px-2 font-medium text-xs">Winner</th>
                  <th className="text-right text-silver-500 py-2 px-2 font-medium text-xs">Won (SOL)</th>
                  <th className="text-right text-silver-500 py-2 px-1 font-medium text-xs">Blk 1</th>
                  <th className="text-right text-silver-500 py-2 px-1 font-medium text-xs">Blk 2</th>
                  <th className="text-right text-silver-500 py-2 px-1 font-medium text-xs">Blk 3</th>
                  <th className="text-right text-silver-500 py-2 px-1 font-medium text-xs">Blk 4</th>
                  <th className="text-right text-silver-500 py-2 px-1 font-medium text-xs">Blk 5</th>
                  <th className="text-center text-silver-500 py-2 px-2 font-medium text-xs">Type</th>
                </tr>
              </thead>
              <tbody>
                {rounds.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center text-silver-600 py-8">
                      {loadingRounds ? 'Loading rounds...' : 'No rounds found'}
                    </td>
                  </tr>
                ) : (
                  rounds.map((r) => {
                    const hasActivity = r.totalPot > 0;
                    return (
                      <tr key={r.roundNumber} className="border-b border-silver-800/50 hover:bg-silver-800/20 transition-colors">
                        <td className="py-1.5 px-2 text-white font-mono text-xs">#{r.roundNumber}</td>
                        <td className="py-1.5 px-1 text-center">
                          {r.finalized ? (
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" title="Finalized" />
                          ) : (
                            <span className="inline-block w-2 h-2 rounded-full bg-copper-400 animate-pulse" title="Active" />
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-right text-emerald-400 font-semibold text-xs">
                          {hasActivity ? fmtSol(r.totalPot) : <span className="text-silver-700">—</span>}
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          {r.finalized && hasActivity ? (
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">
                              Block {r.winningBlock + 1}
                            </span>
                          ) : (
                            <span className="text-silver-700">—</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-right text-white text-xs">
                          {r.winnerPot > 0 ? fmtSol(r.winnerPot) : <span className="text-silver-700">—</span>}
                        </td>
                        {r.blockTotals.map((bt, i) => (
                          <td key={i} className={`py-1.5 px-1 text-right text-xs ${
                            r.finalized && hasActivity && i === r.winningBlock
                              ? 'text-emerald-400 font-semibold'
                              : bt > 0 ? 'text-silver-400' : 'text-silver-700'
                          }`}>
                            {bt > 0 ? fmtSol(bt) : '—'}
                          </td>
                        ))}
                        <td className="py-1.5 px-2 text-center text-xs">
                          {r.isSolo && r.soloWinner ? (
                            <span className="text-copper-300" title={r.soloWinner}>Solo</span>
                          ) : hasActivity ? (
                            <span className="text-silver-400">Pool</span>
                          ) : (
                            <span className="text-silver-700">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-silver-800">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loadingRounds}
              className="px-4 py-2 bg-silver-800 hover:bg-silver-700 text-white rounded-lg text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Newer
            </button>
            <span className="text-silver-500 text-xs">
              Rounds {Math.max(1, config.currentRound - (page * ROUNDS_PER_PAGE))} → {Math.max(1, config.currentRound - ((page + 1) * ROUNDS_PER_PAGE) + 1)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * ROUNDS_PER_PAGE >= config.currentRound || loadingRounds}
              className="px-4 py-2 bg-silver-800 hover:bg-silver-700 text-white rounded-lg text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Older →
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-silver-600 text-xs mb-2">
            All data fetched directly from Solana mainnet &bull; Program: {shortenAddress(PROGRAM_ID.toBase58(), 6)}
          </p>
          <button
            onClick={() => { window.location.hash = ''; }}
            className="text-silver-500 hover:text-copper-400 text-sm transition-colors"
          >
            ← Back to Protocol
          </button>
        </div>

      </motion.div>
    </div>
  );
}
