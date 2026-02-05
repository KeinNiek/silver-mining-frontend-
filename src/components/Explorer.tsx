import { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { useStore } from '../hooks/useStore';
import { PROGRAM_ID, SOLSCAN_ACCOUNT_URL, formatSOL, shortenAddress } from '../utils/constants';
import { SEEDS } from '../utils/idl';
import { SearchIcon, RefreshIcon, BlockIcon, TrophyIcon, ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, CheckIcon, XIcon, ClockIcon } from './Icons';

const ROUNDS_PER_PAGE = 25;
const BLOCK_NAMES = ['Block A', 'Block B', 'Block C', 'Block D', 'Block E'];
const BLOCK_COLORS = [
  'bg-copper-500/20 text-copper-400 border-copper-500/30',
  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'bg-red-500/20 text-red-400 border-red-500/30',
  'bg-silver-500/20 text-silver-300 border-silver-500/30',
];

interface RoundInfo {
  roundNumber: number;
  startTime: number;
  endTime: number;
  finalized: boolean;
  winningBlock: number;
  isSolo: boolean;
  soloWinner: string;
  totalPot: number;
  blockTotals: number[];
  winnerPot: number;
}

const getRoundPDA = (roundNum: number) => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(roundNum));
  return PublicKey.findProgramAddressSync([SEEDS.ROUND, buf], PROGRAM_ID);
};

const getConfigPDA = () => PublicKey.findProgramAddressSync([SEEDS.CONFIG], PROGRAM_ID);

function parseRound(data: Buffer, roundNum: number): RoundInfo | null {
  try {
    let offset = 8; // skip discriminator
    const roundNumber = Number(data.readBigUInt64LE(offset)); offset += 8;
    const startTime = Number(data.readBigInt64LE(offset)); offset += 8;
    const endTime = Number(data.readBigInt64LE(offset)); offset += 8;
    const finalized = data.readUInt8(offset) === 1; offset += 1;
    const winningBlock = data.readUInt8(offset); offset += 1;
    const isSolo = data.readUInt8(offset) === 1; offset += 1;
    const soloWinnerBytes = data.slice(offset, offset + 32);
    const soloWinner = new PublicKey(soloWinnerBytes).toBase58();
    offset += 32;
    offset += 8; // solo_seed
    offset += 8; // solo_best_score
    const totalPot = Number(data.readBigUInt64LE(offset)); offset += 8;
    const blockTotals: number[] = [];
    for (let i = 0; i < 5; i++) {
      blockTotals.push(Number(data.readBigUInt64LE(offset)));
      offset += 8;
    }
    const winnerPot = Number(data.readBigUInt64LE(offset)); offset += 8;

    return {
      roundNumber: roundNumber || roundNum,
      startTime,
      endTime,
      finalized,
      winningBlock,
      isSolo,
      soloWinner,
      totalPot,
      blockTotals,
      winnerPot,
    };
  } catch (e) {
    console.error(`Failed to parse round ${roundNum}:`, e);
    return null;
  }
}

export default function Explorer() {
  const { connection } = useConnection();
  const { config } = useStore();
  const [rounds, setRounds] = useState<RoundInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [searchRound, setSearchRound] = useState('');
  const [searchResult, setSearchResult] = useState<RoundInfo | null>(null);
  const [searchError, setSearchError] = useState('');

  const currentRound = config?.currentRound || 0;

  // Fetch a page of rounds
  const fetchRoundsPage = useCallback(async (pageNum: number) => {
    if (!currentRound || currentRound <= 1) return;
    setLoading(true);

    const total = currentRound - 1; // rounds 1 to currentRound-1 are finalized
    setTotalRounds(total);

    // Calculate range: latest first
    const endRound = total - (pageNum * ROUNDS_PER_PAGE);
    const startRound = Math.max(1, endRound - ROUNDS_PER_PAGE + 1);

    if (endRound < 1) {
      setRounds([]);
      setLoading(false);
      return;
    }

    const roundNums: number[] = [];
    const pdas: PublicKey[] = [];
    for (let r = endRound; r >= startRound; r--) {
      roundNums.push(r);
      pdas.push(getRoundPDA(r)[0]);
    }

    try {
      // Batch fetch
      const batchSize = 100;
      const accounts: (any | null)[] = [];
      for (let i = 0; i < pdas.length; i += batchSize) {
        const results = await connection.getMultipleAccountsInfo(pdas.slice(i, i + batchSize));
        accounts.push(...results);
      }

      const parsed: RoundInfo[] = [];
      for (let i = 0; i < accounts.length; i++) {
        if (accounts[i]) {
          const r = parseRound(accounts[i].data, roundNums[i]);
          if (r) parsed.push(r);
        }
      }

      setRounds(parsed);
    } catch (err) {
      console.error('Failed to fetch rounds:', err);
    } finally {
      setLoading(false);
    }
  }, [connection, currentRound]);

  // Fetch current round count from config if not in store
  useEffect(() => {
    if (currentRound > 0) {
      fetchRoundsPage(page);
    } else {
      // Fetch config directly
      (async () => {
        try {
          const [configPDA] = getConfigPDA();
          const configInfo = await connection.getAccountInfo(configPDA);
          if (configInfo) {
            const cr = Number(configInfo.data.readBigUInt64LE(8 + 32 + 32 + 32));
            setTotalRounds(cr - 1);
            if (cr > 1) {
              setLoading(true);
              // Fetch first page
              const endRound = cr - 1;
              const startRound = Math.max(1, endRound - ROUNDS_PER_PAGE + 1);
              const roundNums: number[] = [];
              const pdas: PublicKey[] = [];
              for (let r = endRound; r >= startRound; r--) {
                roundNums.push(r);
                pdas.push(getRoundPDA(r)[0]);
              }
              const accounts = await connection.getMultipleAccountsInfo(pdas);
              const parsed: RoundInfo[] = [];
              for (let i = 0; i < accounts.length; i++) {
                if (accounts[i]) {
                  const r = parseRound(accounts[i]!.data, roundNums[i]);
                  if (r) parsed.push(r);
                }
              }
              setRounds(parsed);
            }
          }
        } catch (err) {
          console.error('Failed to fetch config for explorer:', err);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [currentRound, page, fetchRoundsPage, connection]);

  // Search specific round
  const handleSearch = async () => {
    const num = parseInt(searchRound);
    if (isNaN(num) || num < 1) {
      setSearchError('Enter a valid round number');
      setSearchResult(null);
      return;
    }
    if (num >= currentRound) {
      setSearchError(`Round ${num} hasn't started yet (current: ${currentRound})`);
      setSearchResult(null);
      return;
    }
    setSearchError('');
    try {
      const [pda] = getRoundPDA(num);
      const acc = await connection.getAccountInfo(pda);
      if (!acc) {
        setSearchError(`Round ${num} not found on-chain`);
        setSearchResult(null);
        return;
      }
      const r = parseRound(acc.data, num);
      setSearchResult(r);
    } catch (err) {
      setSearchError('Failed to fetch round');
      setSearchResult(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalRounds / ROUNDS_PER_PAGE));

  const formatTime = (ts: number) => {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const isZeroKey = (key: string) => key === '11111111111111111111111111111111' || key === PublicKey.default.toBase58();

  const RoundRow = ({ r }: { r: RoundInfo }) => (
    <tr className="border-b border-silver-800/40 hover:bg-silver-800/20 transition-colors">
      {/* Round # */}
      <td className="px-3 py-3 text-sm font-mono text-copper-400 font-semibold">
        #{r.roundNumber}
      </td>

      {/* Status */}
      <td className="px-3 py-3 text-sm">
        {r.finalized ? (
          <span className="inline-flex items-center gap-1 text-emerald-400">
            <CheckIcon className="w-3.5 h-3.5" /> Final
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-amber-400">
            <ClockIcon className="w-3.5 h-3.5" /> Active
          </span>
        )}
      </td>

      {/* Winning Block */}
      <td className="px-3 py-3 text-sm">
        {r.finalized ? (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium ${BLOCK_COLORS[r.winningBlock]}`}>
            <BlockIcon className="w-3 h-3" />
            {BLOCK_NAMES[r.winningBlock]}
          </span>
        ) : (
          <span className="text-silver-600">—</span>
        )}
      </td>

      {/* Total Pot */}
      <td className="px-3 py-3 text-sm font-mono text-white">
        {formatSOL(r.totalPot)} SOL
      </td>

      {/* Winner Pot */}
      <td className="px-3 py-3 text-sm font-mono text-emerald-400">
        {r.finalized ? `${formatSOL(r.winnerPot)} SOL` : '—'}
      </td>

      {/* Winner Type */}
      <td className="px-3 py-3 text-sm">
        {r.finalized ? (
          r.isSolo && !isZeroKey(r.soloWinner) ? (
            <a
              href={`${SOLSCAN_ACCOUNT_URL}${r.soloWinner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-copper-400 hover:text-copper-300 transition-colors"
            >
              <TrophyIcon className="w-3.5 h-3.5" />
              {shortenAddress(r.soloWinner)}
              <ExternalLinkIcon className="w-3 h-3 opacity-50" />
            </a>
          ) : (
            <span className="text-silver-400">Shared pot</span>
          )
        ) : (
          <span className="text-silver-600">—</span>
        )}
      </td>

      {/* Block Distribution */}
      <td className="px-3 py-3 hidden xl:table-cell">
        <div className="flex gap-1">
          {r.blockTotals.map((bt, idx) => {
            const isWinner = r.finalized && idx === r.winningBlock;
            const total = r.blockTotals.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((bt / total) * 100) : 0;
            return (
              <div
                key={idx}
                className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                  isWinner 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold' 
                    : 'bg-silver-800/40 text-silver-500'
                }`}
                title={`${BLOCK_NAMES[idx]}: ${formatSOL(bt)} SOL (${pct.toFixed(0)}%)`}
              >
                {pct.toFixed(0)}%
              </div>
            );
          })}
        </div>
      </td>

      {/* Time */}
      <td className="px-3 py-3 text-xs text-silver-500 hidden lg:table-cell">
        {formatTime(r.endTime || r.startTime)}
      </td>
    </tr>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <SearchIcon className="w-7 h-7 text-copper-400" />
              Round Explorer
            </h1>
            <p className="text-silver-400 text-sm mt-1">
              Transparent, on-chain audit of every round. All data read directly from the Solana blockchain.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-silver-500">Total rounds:</span>
            <span className="text-copper-400 font-bold font-mono">{totalRounds.toLocaleString()}</span>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1 max-w-xs">
            <input
              type="number"
              placeholder="Search round #..."
              value={searchRound}
              onChange={(e) => { setSearchRound(e.target.value); setSearchResult(null); setSearchError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-silver-800/60 border border-silver-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-silver-500 focus:border-copper-500/50 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-copper-500/15 hover:bg-copper-500/25 border border-copper-500/30 rounded-lg text-copper-400 text-sm font-medium transition-colors flex items-center gap-2"
          >
            <SearchIcon className="w-4 h-4" /> Search
          </button>
          <button
            onClick={() => { setPage(0); fetchRoundsPage(0); }}
            className="px-3 py-2.5 bg-silver-800/60 hover:bg-silver-800/80 border border-silver-700/50 rounded-lg text-silver-400 text-sm transition-colors"
            title="Refresh"
          >
            <RefreshIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Search error */}
        {searchError && (
          <p className="text-red-400 text-sm mt-2">{searchError}</p>
        )}

        {/* Search result */}
        {searchResult && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-4 bg-copper-500/5 border border-copper-500/20 rounded-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-copper-400 font-semibold">Round #{searchResult.roundNumber}</h3>
              <button onClick={() => { setSearchResult(null); setSearchRound(''); }} className="text-silver-500 hover:text-silver-300">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-silver-700/30">
                    <th className="px-3 py-2 text-xs text-silver-500 font-medium">Round</th>
                    <th className="px-3 py-2 text-xs text-silver-500 font-medium">Status</th>
                    <th className="px-3 py-2 text-xs text-silver-500 font-medium">Winner</th>
                    <th className="px-3 py-2 text-xs text-silver-500 font-medium">Pot</th>
                    <th className="px-3 py-2 text-xs text-silver-500 font-medium">Payout</th>
                    <th className="px-3 py-2 text-xs text-silver-500 font-medium">Type</th>
                    <th className="px-3 py-2 text-xs text-silver-500 font-medium hidden xl:table-cell">Blocks</th>
                    <th className="px-3 py-2 text-xs text-silver-500 font-medium hidden lg:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody>
                  <RoundRow r={searchResult} />
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Main Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-silver-900/60 backdrop-blur-sm border border-silver-800/60 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-silver-800/40 border-b border-silver-700/30">
                <th className="px-3 py-3 text-xs text-silver-400 font-medium uppercase tracking-wider">Round</th>
                <th className="px-3 py-3 text-xs text-silver-400 font-medium uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-xs text-silver-400 font-medium uppercase tracking-wider">Winning Block</th>
                <th className="px-3 py-3 text-xs text-silver-400 font-medium uppercase tracking-wider">Total Pot</th>
                <th className="px-3 py-3 text-xs text-silver-400 font-medium uppercase tracking-wider">Winner Payout</th>
                <th className="px-3 py-3 text-xs text-silver-400 font-medium uppercase tracking-wider">Winner</th>
                <th className="px-3 py-3 text-xs text-silver-400 font-medium uppercase tracking-wider hidden xl:table-cell">Block Distribution</th>
                <th className="px-3 py-3 text-xs text-silver-400 font-medium uppercase tracking-wider hidden lg:table-cell">Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshIcon className="w-6 h-6 text-copper-400 animate-spin" />
                      <span className="text-silver-400 text-sm">Loading rounds from blockchain...</span>
                    </div>
                  </td>
                </tr>
              ) : rounds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-silver-500">
                    No rounds found. The protocol may not have started yet.
                  </td>
                </tr>
              ) : (
                rounds.map((r) => <RoundRow key={r.roundNumber} r={r} />)
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalRounds > ROUNDS_PER_PAGE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-silver-800/40 bg-silver-800/20">
            <span className="text-silver-500 text-sm">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { const p = Math.max(0, page - 1); setPage(p); }}
                disabled={page === 0}
                className="p-2 rounded-lg bg-silver-800/60 hover:bg-silver-800/80 border border-silver-700/50 text-silver-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              {/* Page numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (page < 3) {
                    pageNum = i;
                  } else if (page > totalPages - 4) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-copper-500/20 border border-copper-500/40 text-copper-400'
                          : 'bg-silver-800/40 border border-silver-700/30 text-silver-500 hover:text-silver-300'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => { const p = Math.min(totalPages - 1, page + 1); setPage(p); }}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg bg-silver-800/60 hover:bg-silver-800/80 border border-silver-700/50 text-silver-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Protocol transparency note */}
      <div className="mt-6 p-4 bg-silver-900/40 border border-silver-800/50 rounded-xl text-sm text-silver-500">
        <p className="font-medium text-silver-400 mb-1">On-Chain Verification</p>
        <p>
          All data on this page is read directly from the Solana blockchain in real-time.
          Every round's result, pot size, and winner is permanently recorded on-chain and can be independently verified
          via the program ID: <a href={`${SOLSCAN_ACCOUNT_URL}${PROGRAM_ID.toBase58()}`} target="_blank" rel="noopener noreferrer" className="text-copper-400 hover:underline">{shortenAddress(PROGRAM_ID.toBase58(), 6)}</a>.
        </p>
      </div>
    </div>
  );
}
