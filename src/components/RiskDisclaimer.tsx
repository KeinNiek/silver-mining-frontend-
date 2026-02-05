import { motion } from 'framer-motion';
import { AlertIcon } from './Icons';

export default function RiskDisclaimer() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 sm:p-12"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <AlertIcon className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Risk Disclaimer</h1>
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8">
            <p className="text-amber-400 font-semibold text-lg">
              WARNING: Using Silver Mining Protocol involves significant financial risk. 
              You may lose some or all of your funds. Only participate with funds you can afford to lose.
            </p>
          </div>

          <div className="space-y-8 text-silver-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Financial Risk</h2>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>You can lose 100% of the SOL you deposit into the Protocol</li>
                <li>There is no guarantee of winning or profit</li>
                <li>The value of SILVER tokens may fluctuate significantly</li>
                <li>Past results do not guarantee future outcomes</li>
                <li>The "house" does not always lose - other users win your SOL when you lose</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Smart Contract Risk</h2>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>Smart contracts may contain undiscovered bugs or vulnerabilities</li>
                <li>Exploits could result in loss of funds</li>
                <li>Once deployed, smart contracts cannot be easily modified</li>
                <li>Audits reduce but do not eliminate smart contract risk</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Blockchain Risk</h2>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>Solana network congestion may affect transaction processing</li>
                <li>Network outages could temporarily prevent access to funds</li>
                <li>Blockchain reorganizations could affect transaction finality</li>
                <li>Transaction fees may vary based on network conditions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Volatility Risk</h2>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>SOL price can be highly volatile</li>
                <li>Your winnings in SOL may be worth significantly less in fiat terms</li>
                <li>SILVER token value is not pegged to any stable asset</li>
                <li>Market conditions can change rapidly</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Liquidity Risk</h2>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>SILVER tokens may have limited liquidity</li>
                <li>You may not be able to sell tokens at desired prices</li>
                <li>Large transactions may significantly impact token prices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Regulatory Risk</h2>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>Cryptocurrency regulations vary by jurisdiction and may change</li>
                <li>The Protocol may become unavailable in certain regions</li>
                <li>You are responsible for complying with local laws</li>
                <li>Tax obligations may apply to your winnings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Operational Risk</h2>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>Frontend interfaces may experience downtime</li>
                <li>User error in transactions cannot be reversed</li>
                <li>Sending funds to wrong addresses results in permanent loss</li>
                <li>Lost wallet keys means lost access to funds</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Game Mechanics</h2>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>Selecting fewer blocks increases potential reward but decreases win probability</li>
                <li>Selecting all 5 blocks guarantees a "win" but with minimal return</li>
                <li>The randomness is determined by on-chain mechanisms</li>
                <li>Large bets from other users affect your potential winnings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Responsible Gaming</h2>
              <div className="bg-copper-500/10 border border-copper-500/30 rounded-xl p-4">
                <ul className="list-disc list-inside space-y-2 text-silver-400">
                  <li>Set a budget and stick to it</li>
                  <li>Never bet more than you can afford to lose</li>
                  <li>Take breaks and don't chase losses</li>
                  <li>Seek help if you feel gambling is becoming a problem</li>
                  <li>This is entertainment, not a way to make money</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Acknowledgment</h2>
              <p className="text-silver-400">
                By using Silver Mining Protocol, you acknowledge that you have read, understood, and 
                accept all the risks described above. You confirm that you are participating voluntarily 
                and are solely responsible for any losses incurred.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
