import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { 
  PickaxeIcon, FlameIcon, GemIcon, TrophyIcon, ClockIcon, 
  UsersIcon, BoltIcon, ShieldIcon, ArrowDownIcon, BlockIcon, 
  TargetIcon, RefreshIcon, XTwitterIcon, DiscordIcon, LayersIcon
} from './Icons';
import { SOCIAL_LINKS } from '../utils/constants';

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

const slideLeft = {
  hidden: { opacity: 0, x: -60 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const slideRight = {
  hidden: { opacity: 0, x: 60 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function Hero() {
  return (
    <div >
      {/* Hero Section */}
<section className="relative py-10 lg:py-16 overflow-hidden">
  <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
    <div className="text-center">
      <motion.div {...fadeIn}>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          <span className="text-white">Bet Smart. Play Strategic.</span>
          <br />
          <span className="text-gradient-copper">Win Big. Earn More.</span>
        </h1>

        <p className="text-lg sm:text-xl text-silver-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Pick your blocks. Place your bets. Every 30 seconds, one block wins and 
          <span className="text-copper-400 font-medium"> winners split 89% of the entire pot</span>. 
          Are you ready to strike silver?
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <WalletMultiButton />
          <a href="#how-it-works" className="btn-secondary">
            See How It Works
            <ArrowDownIcon className="w-4 h-4" />
          </a>
        </div>
      </motion.div>
    </div>
  </div>
</section>

{/* Stats Section */}
<section className="py-12 lg:py-16 ">
  <div className="max-w-6xl mx-auto px-4 sm:px-6">
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
    >
      {[
        { value: '30s', label: 'Per Round', icon: ClockIcon },
        { value: '89%', label: 'Winner Payout', icon: TrophyIcon },
        { value: '5', label: 'Mine Levels', icon: LayersIcon },
        { value: '20%', label: 'Staking APR', icon: GemIcon },
      ].map((stat, i) => (
        <div key={i} className={`${i === 1 ? 'stat-card-copper' : 'card'} p-5 sm:p-6`}>
          <stat.icon className={`w-6 h-6 mb-3 ${i === 1 ? 'text-white/80' : 'text-copper-500'}`} />
          <p className="text-2xl sm:text-3xl font-bold mb-1 text-white">{stat.value}</p>
          <p className={`text-sm ${i === 1 ? 'text-white/70' : 'text-silver-500'}`}>{stat.label}</p>
        </div>
      ))}
    </motion.div>
  </div>
</section>


      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-28 ">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Simple mechanics with deep strategy. Every 30 seconds is a new opportunity.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BlockIcon, step: '01', title: 'Select Blocks', desc: 'Choose 1-5 blocks to bet on. More blocks means higher win chance but more SOL at stake.' },
              { icon: TargetIcon, step: '02', title: 'Place Bet', desc: 'Set your SOL amount per block. Each block you select multiplies your total bet.' },
              { icon: RefreshIcon, step: '03', title: 'Random Draw', desc: 'Every 30 seconds, one random block wins. Bets on other blocks are lost.' },
              { icon: TrophyIcon, step: '04', title: 'Claim Rewards', desc: 'Winners split 89% of all SOL bet that round plus earn SILVER tokens.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-hover p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-copper-500" />
                </div>
                <span className="text-xs text-copper-500 font-semibold tracking-wider">STEP {item.step}</span>
                <h3 className="text-lg font-bold text-white mt-1 mb-2">{item.title}</h3>
                <p className="text-silver-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      
      {/* Risk/Reward - Card comparison */}
      <section className="py-24 lg:py-32 relative">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(var(--accent-rgb), 0.03), transparent)' }} />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Risk vs Reward</h2>
            <p className="section-subtitle">Your strategy determines your fate</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-3 gap-6 lg:gap-8"
          >
            {[
              { blocks: 5, chance: '100%', risk: 'Conservative', color: 'rgba(115, 180, 130, 0.15)', borderColor: 'rgba(115, 180, 130, 0.3)', desc: 'Guaranteed win every round. Lower profit margin but zero risk of losing.' },
              { blocks: 3, chance: '60%', risk: 'Balanced', color: 'rgba(var(--accent-rgb), 0.15)', borderColor: 'rgba(var(--accent-rgb), 0.3)', desc: 'Good odds with reasonable upside. Best approach for consistent players.', featured: true },
              { blocks: 1, chance: '20%', risk: 'Aggressive', color: 'rgba(180, 100, 100, 0.15)', borderColor: 'rgba(180, 100, 100, 0.3)', desc: 'Maximum profit potential. High reward for those who dare to risk.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={scaleIn}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className={`relative p-8 rounded-2xl transition-all duration-300 ${item.featured ? 'lg:-mt-4 lg:mb-4' : ''}`}
                style={{ 
                  background: item.color,
                  border: `1px solid ${item.borderColor}`
                }}
              >
                {item.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'var(--accent-500)' }}>
                      RECOMMENDED
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <span className="text-5xl sm:text-6xl font-bold text-white">{item.blocks}</span>
                  <p className="text-sm mt-1" style={{ color: 'var(--bg-400)' }}>Block{item.blocks > 1 ? 's' : ''}</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center py-3 border-b" style={{ borderColor: 'rgba(var(--accent-rgb), 0.1)' }}>
                    <span style={{ color: 'var(--bg-400)' }}>Win Chance</span>
                    <span className="text-xl font-bold text-gradient-copper">{item.chance}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b" style={{ borderColor: 'rgba(var(--accent-rgb), 0.1)' }}>
                    <span style={{ color: 'var(--bg-400)' }}>Risk Level</span>
                    <span className="badge-copper">{item.risk}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span style={{ color: 'var(--bg-400)' }}>SOL at Risk</span>
                    <span className="font-semibold" style={{ color: 'var(--accent-400)' }}>{item.blocks}x per round</span>
                  </div>
                </div>

                <p className="text-sm text-center leading-relaxed" style={{ color: 'var(--bg-400)' }}>{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Progressive Mines - Horizontal scroll on mobile, grid on desktop */}
      <section id="mines" className="py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <h2 className="section-title">Progressive Mines</h2>
            <p className="section-subtitle">Level up by earning UNREFINED tokens. Higher mines = bigger rewards.</p>
          </motion.div>

          {/* Desktop Grid */}
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="hidden lg:flex items-end justify-center gap-4"
          >
            {[
              { name: 'Copper Pit', emission: 1, threshold: 0, icon: PickaxeIcon, height: 'h-48' },
              { name: 'Iron Quarry', emission: 2, threshold: 15, icon: BlockIcon, height: 'h-56' },
              { name: 'Gold Vein', emission: 4, threshold: 50, icon: GemIcon, height: 'h-64' },
              { name: 'Diamond Deep', emission: 8, threshold: 100, icon: TargetIcon, height: 'h-72' },
              { name: 'Motherlode', emission: 16, threshold: 200, icon: TrophyIcon, height: 'h-80', featured: true },
            ].map((mine, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -8 }}
                className={`${mine.height} w-40 ${mine.featured ? 'card-copper' : 'card-hover'} p-5 flex flex-col items-center justify-end text-center rounded-2xl cursor-default`}
              >
                <div className={`w-14 h-14 rounded-xl ${mine.featured ? 'bg-white/10' : 'bg-copper-500/10'} flex items-center justify-center mb-4`}>
                  <mine.icon className={`w-7 h-7 ${mine.featured ? 'text-white' : 'text-copper-500'}`} />
                </div>
                <h4 className={`font-semibold mb-1 text-sm ${mine.featured ? 'text-white' : 'text-silver-200'}`}>{mine.name}</h4>
                <p className={`text-3xl font-bold mb-1 ${mine.featured ? 'text-white' : 'text-gradient-copper'}`}>{mine.emission}x</p>
                <p className={`text-xs ${mine.featured ? 'text-white/70' : 'text-silver-500'}`}>
                  {i === 0 ? 'Unlocked' : `${mine.threshold} UNREFINED`}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile horizontal scroll */}
          <div className="lg:hidden overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="flex gap-4"
              style={{ width: 'max-content' }}
            >
              {[
                { name: 'Copper Pit', emission: 1, threshold: 0, icon: PickaxeIcon },
                { name: 'Iron Quarry', emission: 2, threshold: 15, icon: BlockIcon },
                { name: 'Gold Vein', emission: 4, threshold: 50, icon: GemIcon },
                { name: 'Diamond Deep', emission: 8, threshold: 100, icon: TargetIcon },
                { name: 'Motherlode', emission: 16, threshold: 200, icon: TrophyIcon, featured: true },
              ].map((mine, i) => (
                <motion.div
                  key={i}
                  variants={scaleIn}
                  className={`w-36 ${mine.featured ? 'card-copper' : 'card-hover'} p-5 flex flex-col items-center text-center rounded-2xl flex-shrink-0`}
                >
                  <div className={`w-12 h-12 rounded-xl ${mine.featured ? 'bg-white/10' : 'bg-copper-500/10'} flex items-center justify-center mb-3`}>
                    <mine.icon className={`w-6 h-6 ${mine.featured ? 'text-white' : 'text-copper-500'}`} />
                  </div>
                  <h4 className={`font-semibold mb-1 text-sm ${mine.featured ? 'text-white' : 'text-silver-200'}`}>{mine.name}</h4>
                  <p className={`text-2xl font-bold mb-1 ${mine.featured ? 'text-white' : 'text-gradient-copper'}`}>{mine.emission}x</p>
                  <p className={`text-xs ${mine.featured ? 'text-white/70' : 'text-silver-500'}`}>
                    {i === 0 ? 'Unlocked' : `${mine.threshold} UNREFINED`}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Motherlode Jackpot - Split screen */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(var(--accent-rgb), 0.05), transparent)' }} />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={slideLeft}
            >
              <span className="badge-copper mb-6 inline-block">Jackpot System</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                The Motherlode
              </h2>
              <p className="text-lg leading-relaxed mb-8" style={{ color: 'var(--bg-400)' }}>
                4% of every bet accumulates in the Motherlode vault. A hidden random round between 
                100-1000 triggers the jackpot. Only that round's winners are eligible — 
                selected proportionally by bet size.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-5">
                  <p className="text-sm mb-2" style={{ color: 'var(--bg-500)' }}>Per Bet Contribution</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--accent-400)' }}>4%</p>
                </div>
                <div className="card p-5">
                  <p className="text-sm mb-2" style={{ color: 'var(--bg-500)' }}>Trigger Range</p>
                  <p className="text-3xl font-bold text-white">100-1000</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={slideRight}
              className="relative"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(var(--accent-rgb), 0.3), transparent 70%)' }} />
              
              <div className="relative stat-card-copper p-10 lg:p-12 text-center rounded-3xl">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <TrophyIcon className="w-20 h-20 text-white/90 mx-auto mb-6" />
                </motion.div>
                <h3 className="text-xl font-semibold text-white/90 mb-3">Current Jackpot</h3>
                <p className="text-5xl lg:text-6xl font-bold text-white mb-3">◎ 0.00</p>
                <p className="text-white/60">Growing with every bet</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Features */}
      <section id="features" className="py-20 lg:py-28 ">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="section-title">Protocol Features</h2>
            <p className="section-subtitle">Everything you need for the ultimate mining experience</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: UsersIcon, title: 'Mining Pools', desc: 'Team up with 10 miners. Pools bet all 5 blocks for guaranteed wins every round.' },
              { icon: BoltIcon, title: 'AutoMiner', desc: 'Automated betting with configurable strategy. Auto-reload winnings for hands-free play.' },
              { icon: FlameIcon, title: 'Refining', desc: 'Convert UNREFINED to SILVER. 90% to you, 10% redistributed to all holders.' },
              { icon: GemIcon, title: 'Staking', desc: 'Stake SILVER tokens for 20% APR. Earn passive rewards while you mine.' },
              { icon: RefreshIcon, title: 'Permissionless', desc: 'Anyone can finalize rounds. Earn SOL rewards for settling each round.' },
              { icon: ShieldIcon, title: 'Secure', desc: 'Fully audited smart contracts with provably fair on-chain randomness.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="card-hover p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-copper-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-silver-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 ">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">Start Mining Today</h2>
            <p className="section-subtitle mb-10">Connect your wallet and place your first bet</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <WalletMultiButton />
              <div className="flex items-center gap-3">
                <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  <XTwitterIcon className="w-5 h-5" /> Twitter
                </a>
                <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                  <DiscordIcon className="w-5 h-5" /> Discord
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}