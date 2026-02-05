import { motion } from 'framer-motion';
import { PickaxeIcon, GemIcon, FlameIcon, ShieldIcon, InfoIcon, ChartIcon, StarIcon, TrophyIcon, ExternalLinkIcon, CopyIcon, CheckIcon } from './Icons';
import { SILVER_MINT_ADDRESS, SOLSCAN_ACCOUNT_URL, PROGRAM_ID } from '../utils/constants';
import { useState } from 'react';

export default function Tokenomics() {
  const [copied, setCopied] = useState(false);
  const copyMint = () => {
    navigator.clipboard.writeText(SILVER_MINT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-copper-300 to-copper-500 mb-4">
            Tokenomics
          </h1>
          <p className="text-silver-400 text-lg">Silver Protocol Emission Schedule &amp; Supply Model</p>
          <p className="text-silver-600 text-sm mt-2">
            All values derived from the on-chain smart contract &bull; Program: CiKNK...mtV
          </p>
        </div>

        {/* Official Token Contract */}
        <div className="card p-5 mb-8 border border-copper-500/30 bg-copper-500/5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldIcon className="w-5 h-5 text-copper-400" />
            <h2 className="text-lg font-bold text-copper-400">Official SILVER Token</h2>
          </div>
          <p className="text-silver-400 text-sm mb-3">
            This is the one and only official SILVER token. It was deployed with the protocol on mainnet and is the same token used during beta and after launch. There is no planned token migration.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <code className="bg-silver-900/80 px-3 py-1.5 rounded-lg text-copper-300 text-xs sm:text-sm font-mono border border-silver-700/50 break-all">
              {SILVER_MINT_ADDRESS}
            </code>
            <button onClick={copyMint} className="p-2 rounded-lg bg-silver-800/60 hover:bg-copper-500/15 border border-silver-700/40 hover:border-copper-500/30 text-silver-400 hover:text-copper-400 transition-all" title="Copy">
              {copied ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <CopyIcon className="w-4 h-4" />}
            </button>
            <a href={`${SOLSCAN_ACCOUNT_URL}${SILVER_MINT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-silver-800/60 hover:bg-copper-500/15 border border-silver-700/40 hover:border-copper-500/30 text-silver-400 hover:text-copper-400 transition-all" title="View on Solscan">
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-silver-500">
            <span>Program: <a href={`${SOLSCAN_ACCOUNT_URL}${PROGRAM_ID.toBase58()}`} target="_blank" rel="noopener noreferrer" className="text-copper-400 hover:underline">{PROGRAM_ID.toBase58().slice(0, 8)}...{PROGRAM_ID.toBase58().slice(-4)}</a></span>
            <span>Decimals: 9</span>
            <span>No pre-mine</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Max Supply', value: '50M', sub: 'SILVER' },
            { label: 'Per Round', value: '31', sub: 'UNREFINED' },
            { label: 'Per Day', value: '89,280', sub: 'UNREFINED max' },
            { label: 'Round Time', value: '30s', sub: '2,880/day' },
          ].map((m, i) => (
            <div key={i} className="card p-4 text-center">
              <p className="text-silver-500 text-xs mb-1">{m.label}</p>
              <p className="text-2xl font-bold text-copper-400">{m.value}</p>
              <p className="text-silver-600 text-xs">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Daily Generation Schedule */}
        <section className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-copper-400 mb-4 flex items-center gap-2"><ChartIcon className="w-5 h-5" /> Daily Generation Schedule</h2>
          <p className="text-silver-400 text-sm mb-4">
            Each 30-second round generates up to 31 UNREFINED tokens across all mine levels. With 2,880 rounds/day, the maximum daily emission is 89,280 UNREFINED. After refining (10% burn), this yields up to 80,352 SILVER/day.
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver-700/50">
                  <th className="text-left text-silver-500 py-2 px-3">Timeframe</th>
                  <th className="text-center text-silver-500 py-2 px-3">UNREFINED Max</th>
                  <th className="text-center text-silver-500 py-2 px-3">SILVER After Refine</th>
                  <th className="text-center text-silver-500 py-2 px-3">Cumulative SILVER</th>
                </tr>
              </thead>
              <tbody className="text-silver-300">
                {[
                  { time: 'Per Round (30s)', unref: '31', silver: '27.9', cum: '—' },
                  { time: 'Per Hour', unref: '3,720', silver: '3,348', cum: '—' },
                  { time: 'Per Day', unref: '89,280', silver: '80,352', cum: '80,352' },
                  { time: 'Per Week', unref: '624,960', silver: '562,464', cum: '562,464' },
                  { time: 'Per Month (30d)', unref: '2,678,400', silver: '2,410,560', cum: '2,410,560' },
                  { time: 'To 50M Cap', unref: '~55.6M', silver: '50M', cum: '50,000,000' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-silver-800/30">
                    <td className="py-2 px-3 font-medium">{row.time}</td>
                    <td className="py-2 px-3 text-center">{row.unref}</td>
                    <td className="py-2 px-3 text-center text-copper-400">{row.silver}</td>
                    <td className="py-2 px-3 text-center text-silver-500">{row.cum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-silver-900/50 rounded-lg text-xs text-silver-500 flex items-start gap-2">
            <InfoIcon className="w-3.5 h-3.5 text-copper-400 mt-0.5 flex-shrink-0" />
            <p>Actual generation depends on participation. UNREFINED is only minted when miners place bets. If no one bets in a round, 0 tokens are generated. At maximum participation, it takes approximately 622 days to reach the 50M cap.</p>
          </div>
        </section>

        {/* Two Token Model */}
        <section className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-copper-400 mb-4 flex items-center gap-2"><FlameIcon className="w-5 h-5" /> Two-Token Model</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-silver-800/30 rounded-lg p-4 border border-silver-700/50">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2"><PickaxeIcon className="w-4 h-4 text-silver-400" /> UNREFINED</h3>
              <p className="text-silver-400 text-sm">
                Raw mining output earned by winning rounds. Non-transferable. Must be refined into SILVER. 
                Holding more UNREFINED unlocks higher mine levels with bigger rewards.
              </p>
            </div>
            <div className="bg-silver-800/30 rounded-lg p-4 border border-copper-500/30">
              <h3 className="font-bold text-copper-400 mb-2 flex items-center gap-2"><GemIcon className="w-4 h-4" /> SILVER</h3>
              <p className="text-silver-400 text-sm">
                The protocol's primary tradeable token. Created by refining UNREFINED (90% conversion). 
                Can be staked for 20% APR, traded on DEX, or held.
              </p>
            </div>
          </div>
        </section>

        {/* Mine Levels & Emissions */}
        <section className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-copper-400 mb-4 flex items-center gap-2"><PickaxeIcon className="w-5 h-5" /> Mine Levels &amp; Emissions</h2>
          <p className="text-silver-400 text-sm mb-4">
            Each mine level produces more UNREFINED per winning round. Higher mines require holding UNREFINED to unlock.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver-700">
                  <th className="text-left text-silver-500 py-2 px-3">Level</th>
                  <th className="text-left text-silver-500 py-2 px-3">Mine</th>
                  <th className="text-center text-silver-500 py-2 px-3">Per Round</th>
                  <th className="text-center text-silver-500 py-2 px-3">Unlock</th>
                  <th className="text-center text-silver-500 py-2 px-3">Daily Max</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { lvl: 0, name: 'Copper', emit: 1, unlock: '0 (default)', daily: '2,880' },
                  { lvl: 1, name: 'Iron', emit: 2, unlock: '15 UNREFINED', daily: '5,760' },
                  { lvl: 2, name: 'Gold', emit: 4, unlock: '50 UNREFINED', daily: '11,520' },
                  { lvl: 3, name: 'Diamond', emit: 8, unlock: '100 UNREFINED', daily: '23,040' },
                  { lvl: 4, name: 'Obsidian', emit: 16, unlock: '200 UNREFINED', daily: '46,080' },
                ].map((m) => (
                  <tr key={m.lvl} className="border-b border-silver-800/50 hover:bg-silver-800/20">
                    <td className="py-2 px-3 text-white">{m.lvl}</td>
                    <td className="py-2 px-3 text-white font-semibold">{m.name}</td>
                    <td className="py-2 px-3 text-center text-copper-400 font-bold">{m.emit}</td>
                    <td className="py-2 px-3 text-center text-silver-400">{m.unlock}</td>
                    <td className="py-2 px-3 text-center text-silver-300">{m.daily}</td>
                  </tr>
                ))}
                <tr className="bg-copper-500/10">
                  <td colSpan={2} className="py-2 px-3 text-copper-400 font-bold">Total (all levels)</td>
                  <td className="py-2 px-3 text-center text-copper-400 font-bold">31</td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3 text-center text-copper-400 font-bold">89,280</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Supply Cap & Halving */}
        <section className="card p-6 mb-6 border border-copper-500/30">
          <h2 className="text-xl font-bold text-copper-400 mb-4 flex items-center gap-2"><ChartIcon className="w-5 h-5" /> Supply Cap &amp; Halving Schedule</h2>
          
          <div className="bg-copper-500/10 rounded-lg p-4 mb-4">
            <p className="text-copper-300 font-bold text-lg text-center">Maximum Supply: 50,000,000 SILVER</p>
            <p className="text-silver-400 text-xs text-center mt-1">
              Emissions stop permanently once 50M SILVER has been minted
            </p>
          </div>

          <p className="text-silver-400 text-sm mb-4">
            To prevent endless inflation, emissions are halved at supply milestones. Each milestone cuts 
            the UNREFINED reward per round in half across all mine levels.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver-700">
                  <th className="text-left text-silver-500 py-2 px-3">Milestone</th>
                  <th className="text-center text-silver-500 py-2 px-3">Total Minted</th>
                  <th className="text-center text-silver-500 py-2 px-3">Emission Rate</th>
                  <th className="text-center text-silver-500 py-2 px-3">Daily Max</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { phase: 'Launch', minted: '0 - 10M', rate: '31 / round', daily: '89,280' },
                  { phase: 'Halving 1', minted: '10M - 25M', rate: '15.5 / round', daily: '44,640' },
                  { phase: 'Halving 2', minted: '25M - 37.5M', rate: '7.75 / round', daily: '22,320' },
                  { phase: 'Halving 3', minted: '37.5M - 43.75M', rate: '3.875 / round', daily: '11,160' },
                  { phase: 'Halving 4', minted: '43.75M - 50M', rate: '1.9375 / round', daily: '5,580' },
                  { phase: 'Cap Reached', minted: '50M', rate: '0 (stopped)', daily: '0' },
                ].map((m, i) => (
                  <tr key={i} className={`border-b border-silver-800/50 ${i === 5 ? 'bg-red-500/10' : ''}`}>
                    <td className="py-2 px-3 text-white font-semibold">{m.phase}</td>
                    <td className="py-2 px-3 text-center text-silver-300">{m.minted}</td>
                    <td className="py-2 px-3 text-center text-copper-400 font-bold">{m.rate}</td>
                    <td className="py-2 px-3 text-center text-silver-400">{m.daily}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-silver-500 text-xs mt-3">
            Halvings are supply-based (triggered by total UNREFINED minted, tracked on-chain). 
            This approach requires no oracle, cannot be manipulated, and is fully verifiable.
          </p>
        </section>

        {/* Refining */}
        <section className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-copper-400 mb-4 flex items-center gap-2"><FlameIcon className="w-5 h-5" /> Refining: UNREFINED → SILVER</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-silver-800/30 rounded-lg">
              <p className="text-3xl font-bold text-red-400">100%</p>
              <p className="text-silver-500 text-xs">UNREFINED burned</p>
            </div>
            <div className="text-center p-3 bg-silver-800/30 rounded-lg">
              <p className="text-3xl font-bold text-emerald-400">90%</p>
              <p className="text-silver-500 text-xs">Minted as SILVER</p>
            </div>
            <div className="text-center p-3 bg-silver-800/30 rounded-lg">
              <p className="text-3xl font-bold text-copper-400">10%</p>
              <p className="text-silver-500 text-xs">Redistribution Pool</p>
            </div>
          </div>
          <p className="text-silver-400 text-sm">
            Refining resets your mine level to Copper. This creates a strategic tradeoff: hold UNREFINED 
            for higher mines or refine for tradeable SILVER.
          </p>
        </section>

        {/* SOL Fee Structure */}
        <section className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-copper-400 mb-4 flex items-center gap-2"><StarIcon className="w-5 h-5" /> SOL Fee Distribution</h2>
          <p className="text-silver-400 text-sm mb-4">Every round pot is split as follows:</p>
          <div className="space-y-2">
            {[
              { label: 'Winners', pct: 89, color: 'bg-emerald-500', desc: 'Split among winning block bettors' },
              { label: 'Warchest', pct: 5, color: 'bg-copper-600', desc: 'Protocol treasury' },
              { label: 'Motherlode', pct: 4, color: 'bg-copper-500', desc: 'Jackpot pool' },
              { label: 'Admin', pct: 1, color: 'bg-silver-500', desc: 'Operations' },
              { label: 'AutoMiner', pct: 1, color: 'bg-silver-400', desc: 'Bot infrastructure' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-20 text-right">
                  <span className="text-white font-bold">{f.pct}%</span>
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-silver-800 rounded-full overflow-hidden">
                    <div className={`h-full ${f.color} rounded-full flex items-center px-2`} style={{ width: `${Math.max(f.pct, 8)}%` }}>
                      <span className="text-white text-xs font-semibold truncate">{f.label}</span>
                    </div>
                  </div>
                </div>
                <span className="text-silver-500 text-xs w-40 hidden md:block">{f.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Motherlode */}
        <section className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-copper-400 mb-4 flex items-center gap-2"><TrophyIcon className="w-5 h-5" /> Motherlode Jackpot</h2>
          <p className="text-silver-400 text-sm mb-3">
            4% of every round pot feeds the Motherlode. At a random interval (100-1,000 rounds), 
            the entire jackpot triggers. Winners of the triggering round enter a weighted raffle — bigger 
            bets = better odds. After a 1-hour window, the prize is paid to the winner.
          </p>
          <p className="text-silver-500 text-xs italic">
            The trigger round is never displayed. The Motherlode grows silently until it hits.
          </p>
        </section>

        {/* Staking */}
        <section className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-copper-400 mb-4 flex items-center gap-2"><GemIcon className="w-5 h-5" /> Staking</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: 'APR', value: '20%' },
              { label: 'Reward', value: 'SILVER (minted)' },
              { label: 'Lock Period', value: 'None' },
              { label: 'Max Stake', value: 'No cap' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between items-center bg-silver-800/30 rounded-lg p-3">
                <span className="text-silver-400 text-sm">{s.label}</span>
                <span className="text-white font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Admin Capabilities */}
        <section className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-copper-400 mb-4 flex items-center gap-2"><ShieldIcon className="w-5 h-5" /> Admin Capabilities</h2>
          <p className="text-silver-400 text-sm mb-3">All actions are on-chain and publicly auditable.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-silver-700">
                  <th className="text-left text-silver-500 py-2 px-3">Action</th>
                  <th className="text-left text-silver-500 py-2 px-3">Limit</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { action: 'Admin Mint SILVER', limit: '50,000 lifetime cap (hard-coded)' },
                  { action: 'Adjust Staking APR', limit: '0% - 100%' },
                  { action: 'Pause / Unpause', limit: 'Emergency toggle' },
                  { action: 'Withdraw Motherlode/Treasury', limit: 'Balance only' },
                ].map((a, i) => (
                  <tr key={i} className="border-b border-silver-800/50">
                    <td className="py-2 px-3 text-white">{a.action}</td>
                    <td className="py-2 px-3 text-silver-400">{a.limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Verification */}
        <section className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-copper-400 mb-4 flex items-center gap-2"><InfoIcon className="w-5 h-5" /> How to Verify</h2>
          <p className="text-silver-400 text-sm mb-3">
            Every number on this page is derived from the on-chain smart contract. Verify any claim:
          </p>
          <div className="bg-silver-800/30 rounded-lg p-4 font-mono text-xs text-silver-400 break-all">
            Program ID: CiKNKPpdC55EpnVD5nDF5XCz2Pb9rKy1JZ9PCmtV
          </div>
          <p className="text-silver-500 text-xs mt-2">
            View all transactions on Solscan or Solana Explorer. Config, Round, and Bet accounts are 
            PDAs readable by anyone.
          </p>
        </section>

        {/* Disclaimer */}
        <section className="bg-copper-500/10 border border-copper-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-copper-400 font-bold mb-2">Disclaimer</h2>
          <p className="text-silver-400 text-sm">
            This tokenomics model represents the current plan as of the beta launch. Parameters including 
            emission rates, halving milestones, staking APR, and supply cap may be adjusted based on 
            community feedback and protocol health. All changes will be announced publicly before 
            implementation and will be verifiable on-chain. This is not financial advice.
          </p>
        </section>

        {/* Back button */}
        <div className="text-center">
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
