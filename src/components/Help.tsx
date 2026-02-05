import { motion } from 'framer-motion';
import {
  PickaxeIcon, TrophyIcon,
  GemIcon, FlameIcon, UsersIcon, BoltIcon, ClockIcon,
  ShieldIcon, SlotMachineIcon, StarIcon,
  DiscordIcon, XTwitterIcon, TelegramIcon
} from './Icons';
import { SOCIAL_LINKS, UNLOCK_THRESHOLDS, MINE_NAMES, EMISSIONS } from '../utils/constants';

const Section = ({ icon: Icon, title, id, children }: { icon: any; title: string; id: string; children: React.ReactNode }) => (
  <motion.div
    id={id}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="card p-5 sm:p-8"
  >
    <div className="flex items-center gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-copper-400" />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
    </div>
    <div className="text-silver-300 text-sm leading-relaxed space-y-3">{children}</div>
  </motion.div>
);

const Btn = ({ label, desc }: { label: string; desc: string }) => (
  <div className="flex gap-3 p-3 rounded-lg bg-silver-900/40 border border-silver-800/50">
    <div className="badge-copper flex-shrink-0 self-start mt-0.5 whitespace-nowrap">{label}</div>
    <p className="text-silver-400 text-sm">{desc}</p>
  </div>
);

const Tip = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-4 p-4 rounded-lg bg-copper-500/5 border border-copper-500/15">
    <p className="text-silver-200 font-medium mb-1.5 text-sm">{title}</p>
    <div className="text-silver-400 text-sm space-y-1">{children}</div>
  </div>
);

export default function Help() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">How Silver Mining Works</h1>
        <p className="text-silver-400 max-w-2xl mx-auto text-sm sm:text-base">Complete guide to every feature and button in the protocol.</p>
      </motion.div>

      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {[
          { l: 'Mining', h: '#help-mining' },
          { l: 'Rounds', h: '#help-rounds' },
          { l: 'Claiming', h: '#help-claiming' },
          { l: 'Refining', h: '#help-refining' },
          { l: 'Staking', h: '#help-staking' },
          { l: 'Pools', h: '#help-pools' },
          { l: 'AutoMiner', h: '#help-autominer' },
          { l: 'Motherlode', h: '#help-motherlode' },
          { l: 'Mine Levels', h: '#help-mines' },
          { l: 'Autoclaim FAQ', h: '#help-autoclaim' },
        ].map(s => (
          <a key={s.l} href={s.h} className="badge-copper text-xs hover:bg-copper-500/20 transition-colors">{s.l}</a>
        ))}
      </div>

      <div className="space-y-5">
        <Section icon={PickaxeIcon} title="Mining (Betting)" id="help-mining">
          <p>Every 30 seconds a new round begins. Pick 1–5 blocks, set SOL per block, and place your bet. One random block wins.</p>
          <div className="space-y-2 mt-4">
            <Btn label="Select Blocks" desc="Toggle blocks 1–5 on/off. Each selected block costs your SOL-per-block amount. More blocks = higher win chance but more SOL at risk." />
            <Btn label="SOL Per Block" desc="How much SOL to wager per block. Total bet = blocks selected × SOL per block." />
            <Btn label="Place Bet" desc="Submits your bet for the current round. One bet per round. If timer is at 0s, wait for finalization." />
          </div>
          <Tip title="Payout structure">
            <p>Winners split 89% of the total pot (proportional to bet on winning block). 4% → Motherlode jackpot, 4% → warchest, 3% → round finalizer.</p>
          </Tip>
        </Section>

        <Section icon={ClockIcon} title="Round Timer & Finalization" id="help-rounds">
          <p>The sidebar timer counts down from 30s. When it hits 0, the round is ready to finalize.</p>
          <div className="space-y-2 mt-4">
            <Btn label="Finalize Round" desc="Draws the winning block on-chain using verifiable randomness. The finalizer earns ~3% of the pot. Anyone can click this." />
          </div>
          <p className="text-silver-400 mt-3">Rounds are permissionless — the crank bot auto-finalizes within seconds if no one clicks.</p>
        </Section>

        <Section icon={TrophyIcon} title="Claiming Rewards" id="help-claiming">
          <p>After finalization, winners can claim SOL winnings and UNREFINED token emissions.</p>
          <div className="space-y-2 mt-4">
            <Btn label="Claim SOL + UNREFINED" desc="Claims both your SOL and UNREFINED from a specific round you won." />
            <Btn label="Claim All Rewards" desc="Batch-scans recent rounds for unclaimed wins, plus claims staking rewards, pending UNREFINED, and redistribution pool share." />
          </div>
          <Tip title="About Claim All">
            <p>Bundles multiple claims into batched transactions signed in one popup. Because bundled TXs can't be pre-simulated, your wallet may show a warning — this is normal and safe.</p>
            <p className="mt-1">Scans up to 300 recent rounds. Older unclaimed rounds can be claimed by increasing the scan range or claiming individually.</p>
          </Tip>
        </Section>

        <Section icon={FlameIcon} title="Refining (UNREFINED → SILVER)" id="help-refining">
          <p>UNREFINED tokens from winning rounds are converted to SILVER (the protocol's main token) via refining.</p>
          <div className="space-y-2 mt-4">
            <Btn label="Refine All" desc="Converts all UNREFINED to SILVER. 10% burn fee — that 10% is redistributed to all UNREFINED holders proportionally." />
          </div>
          <Tip title="Holder rewards">
            <p>Simply holding UNREFINED earns you a share of every refine's 10% burn. The more you hold, the bigger your share of the redistribution pool.</p>
          </Tip>
        </Section>

        <Section icon={GemIcon} title="Staking SILVER" id="help-staking">
          <p>Lock SILVER tokens to earn 20% APR in additional SILVER. Rewards accrue continuously.</p>
          <div className="space-y-2 mt-4">
            <Btn label="Stake" desc="Locks SILVER into the staking contract. Rewards start accruing immediately." />
            <Btn label="Unstake" desc="Withdraws staked SILVER to your wallet. Accrued rewards are kept." />
            <Btn label="MAX" desc="Sets input to full available balance." />
          </div>
        </Section>

        <Section icon={UsersIcon} title="Mining Pools" id="help-pools">
          <p>Pools let miners team up. Pool creator sets a mine level and earns a fee from members' winnings.</p>
          <div className="space-y-2 mt-4">
            <Btn label="Browse Pools" desc="View active pools with mine levels, fees, and member counts." />
            <Btn label="Join" desc="Enter a pool by clicking Join or typing a Pool ID." />
            <Btn label="Create Pool" desc="Start a pool with custom fee (max 10%) and mine level. Earn fees from members' wins." />
            <Btn label="Leave Pool" desc="Exit a joined pool. Pool creators can't leave their own pool." />
          </div>
        </Section>

        <Section icon={BoltIcon} title="AutoMiner" id="help-autominer">
          <p>Automatic betting every round using all 5 blocks (100% win rate). Deposit SOL into a non-custodial escrow; the crank bot bets for you.</p>
          <div className="space-y-2 mt-4">
            <Btn label="Setup AutoMiner" desc="Initialize your AutoMiner account with mine level and SOL per block." />
            <Btn label="Deposit" desc="Add SOL to AutoMiner escrow. Funds held in a PDA — only the smart contract can move them." />
            <Btn label="Withdraw" desc="Pull SOL back to your wallet. Daily limit: 2 SOL." />
            <Btn label="Update Settings" desc="Change mine level or bet amount while running." />
            <Btn label="Disable" desc="Stops automatic betting. Funds stay safe until withdrawn." />
          </div>
          <Tip title="Cost breakdown">
            <p>Each round costs: <span className="text-white">(SOL per block × 5 blocks)</span> for the bet + <span className="text-white">~0.00151 SOL</span> crank fee. Dashboard shows both separately.</p>
          </Tip>
          <Tip title="Non-custodial design">
            <p>Funds sit in a Program Derived Address (PDA). The crank bot executes bets but cannot withdraw your SOL. Only you can withdraw. Winnings from AutoMiner rounds accrue to your miner account and can be claimed normally.</p>
          </Tip>
        </Section>

        <Section icon={SlotMachineIcon} title="Motherlode Jackpot" id="help-motherlode">
          <p>4% of every bet accumulates in the Motherlode vault. A hidden random round between 100–1000 triggers the jackpot.</p>
          <Tip title="How it triggers">
            <p>A target round is randomly set. When reached, anyone can call "Trigger Motherlode" to start the raffle for that round.</p>
          </Tip>
          <Tip title="Raffle scoring">
            <p>Claiming SOL from the Motherlode round enters you in the raffle. Your score:</p>
            <p className="text-white font-mono text-center my-2 text-base">score = transaction_hash ÷ bet_size</p>
            <p><span className="text-white">Lowest score wins.</span> Bigger bets = lower scores = better odds. The hash adds randomness so even small bets can win.</p>
          </Tip>
          <Tip title="Claim window">
            <p>After triggering, there's a 1-hour window for all players to claim SOL (entering the raffle). After 1 hour, the best scorer collects the full jackpot.</p>
          </Tip>
        </Section>

        <Section icon={StarIcon} title="Mine Levels & Progression" id="help-mines">
          <p>5 mine levels with increasing UNREFINED emissions per win. Unlock higher mines by refining enough UNREFINED.</p>
          <div className="mt-4 space-y-2">
            {MINE_NAMES.map((name, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-silver-900/40 border border-silver-800/50 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-copper-400 font-bold text-sm">{i + 1}.</span>
                  <span className="text-white font-medium text-sm truncate">{name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs sm:text-sm flex-shrink-0">
                  <span className="text-copper-400 font-semibold">{EMISSIONS[i]}x</span>
                  <span className="text-silver-500">{i === 0 ? 'Free' : `${UNLOCK_THRESHOLDS[i]} refined`}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-silver-400">Progress bar in the sidebar tracks how close you are to unlocking the next mine.</p>
        </Section>

        <Section icon={ShieldIcon} title="Autoclaim & Non-Custodial Design" id="help-autoclaim">
          <p>A common question: why don't AutoMiner winnings or Motherlode prizes auto-claim to your wallet?</p>
          <Tip title="Why autoclaim isn't possible">
            <p>Silver Mining is <span className="text-white font-medium">fully non-custodial</span>. Your SOL sits in a Program Derived Address (PDA) controlled by the smart contract — not a team wallet or third party.</p>
            <p className="mt-1.5">The crank bot can execute bets from your escrow because the contract allows it. But <span className="text-white">claiming rewards requires your wallet's signature</span>. No one — not the bot, not the team — can sign transactions on your behalf. This is by design for your security.</p>
          </Tip>
          <Tip title="Best practice: use Claim All Rewards">
            <p>The <span className="text-white font-medium">Claim All Rewards</span> button in the sidebar scans all your recent winning rounds and batch-claims everything in one click: SOL winnings, UNREFINED emissions, staking rewards, and redistribution pool share.</p>
            <p className="mt-1.5">Your wallet may show a "simulation failed" warning — this is <span className="text-white">normal and safe</span>. Bundled transactions can't be pre-simulated because each TX depends on the previous one. The transactions themselves are standard on-chain claims.</p>
          </Tip>
          <Tip title="Claim frequency tip">
            <p>Claim at least once every few hours if you're actively mining. The scanner only checks the most recent ~300 rounds by default. Older unclaimed rounds can still be claimed individually.</p>
          </Tip>
        </Section>

        {/* Community CTA */}
        <div className="card p-6 sm:p-8 text-center">
          <h3 className="text-lg font-bold text-white mb-2">Join the Community</h3>
          <p className="text-silver-400 text-sm mb-5">Questions? Strategies? Updates?</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {SOCIAL_LINKS.discord && (
              <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" className="btn-primary px-5 py-2.5 text-sm">
                <DiscordIcon className="w-4 h-4" /> Discord
              </a>
            )}
            <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="btn-secondary px-5 py-2.5 text-sm">
              <XTwitterIcon className="w-4 h-4" /> Twitter
            </a>
            {SOCIAL_LINKS.telegram && (
              <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer" className="btn-secondary px-5 py-2.5 text-sm">
                <TelegramIcon className="w-4 h-4" /> Telegram
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
