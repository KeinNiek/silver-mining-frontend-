import { motion } from 'framer-motion';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 sm:p-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          <p className="text-silver-400 mb-6">Last updated: January 2025</p>

          <div className="space-y-8 text-silver-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
              <p className="mb-4">
                Silver Mining Protocol operates on the Solana blockchain. We collect minimal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>Wallet addresses (public blockchain data)</li>
                <li>Transaction history related to the protocol (public blockchain data)</li>
                <li>No personal identifying information is collected</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Blockchain Data</h2>
              <p>
                All transactions on the Solana blockchain are public by nature. Your wallet address and 
                transaction history with our protocol are visible on the blockchain. We do not control 
                this data and cannot delete it as it is immutably stored on the blockchain.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Wallet Connection</h2>
              <p>
                When you connect your wallet to Silver Mining, we do not gain access to your private keys 
                or seed phrase. We only receive your public wallet address to facilitate transactions 
                that you explicitly approve.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Cookies & Local Storage</h2>
              <p>
                We may use local storage to remember your preferences (such as theme settings). 
                No tracking cookies are used. No data is shared with third parties for advertising purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Third-Party Services</h2>
              <p className="mb-4">
                Our protocol interacts with:
              </p>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>Solana blockchain network</li>
                <li>Wallet providers (Phantom, Solflare, etc.)</li>
                <li>RPC providers for blockchain communication</li>
              </ul>
              <p className="mt-4">
                Each of these services has their own privacy policies that govern their data practices.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Data Security</h2>
              <p>
                As a decentralized protocol, there is no central database storing your information. 
                Your assets are secured by the Solana blockchain and your wallet's security measures. 
                Always keep your seed phrase secure and never share it with anyone.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. Changes will be reflected on this 
                page with an updated revision date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Contact</h2>
              <p>
                For privacy-related inquiries, please reach out through our official Discord or Twitter channels.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
