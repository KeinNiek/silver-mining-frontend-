import { motion } from 'framer-motion';

export default function TermsOfService() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 sm:p-12"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">Terms of Service</h1>
          <p className="text-silver-400 mb-6">Last updated: January 2025</p>

          <div className="space-y-8 text-silver-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Silver Mining Protocol ("the Protocol"), you agree to be bound by 
                these Terms of Service. If you do not agree to these terms, do not use the Protocol.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Eligibility</h2>
              <p className="mb-4">To use the Protocol, you must:</p>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>Be at least 18 years of age or the legal age in your jurisdiction</li>
                <li>Not be a resident of a jurisdiction where cryptocurrency gaming is prohibited</li>
                <li>Have the legal capacity to enter into binding agreements</li>
                <li>Not be on any sanctions list or prohibited from using cryptocurrency services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. Nature of the Protocol</h2>
              <p className="mb-4">
                Silver Mining is a decentralized protocol deployed on the Solana blockchain. You understand that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>The Protocol involves financial risk and potential loss of funds</li>
                <li>Smart contracts are immutable once deployed and may contain bugs</li>
                <li>Blockchain transactions are irreversible</li>
                <li>Past performance does not guarantee future results</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. User Responsibilities</h2>
              <p className="mb-4">You are solely responsible for:</p>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>Securing your wallet and private keys</li>
                <li>Understanding the risks involved in using the Protocol</li>
                <li>Complying with all applicable laws in your jurisdiction</li>
                <li>Any taxes or reporting obligations arising from your use</li>
                <li>Verifying transaction details before signing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. Prohibited Activities</h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 text-silver-400">
                <li>Use the Protocol for money laundering or illegal activities</li>
                <li>Attempt to exploit, hack, or manipulate the Protocol</li>
                <li>Use bots or automated systems to gain unfair advantage</li>
                <li>Interfere with other users' access to the Protocol</li>
                <li>Misrepresent your identity or affiliation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Fees</h2>
              <p>
                The Protocol charges fees on transactions as specified in the documentation. 
                These fees are automatically deducted by the smart contract and are non-refundable. 
                You are also responsible for any network (gas) fees required by the Solana blockchain.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. No Warranties</h2>
              <p>
                THE PROTOCOL IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. 
                WE DO NOT GUARANTEE CONTINUOUS, UNINTERRUPTED, OR SECURE ACCESS TO THE PROTOCOL.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, 
                DATA, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE PROTOCOL.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless the Protocol developers, contributors, and 
                affiliates from any claims, damages, or expenses arising from your use of the Protocol 
                or violation of these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Modifications</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the Protocol 
                after changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">11. Governing Law</h2>
              <p>
                These terms shall be governed by and construed in accordance with applicable laws, 
                without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">12. Contact</h2>
              <p>
                For questions about these terms, please contact us through our official Discord or Twitter channels.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
