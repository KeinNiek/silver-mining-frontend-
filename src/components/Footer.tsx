import { useState } from 'react';
import { XTwitterIcon, DiscordIcon, TelegramIcon, CopyIcon, CheckIcon } from './Icons';
import { SOCIAL_LINKS, WARCHEST_WALLET, ADMIN_WALLET, PROGRAM_ID } from '../utils/constants';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Tokenomics', href: '#tokenomics' },
    { label: 'Dashboard', href: '#stats' },
    { label: 'Explorer', href: '#explorer' },
    { label: 'Help', href: '#help' },
    { label: 'Terms of Service', href: '#terms' },
    { label: 'Privacy Policy', href: '#privacy' },
    { label: 'Risk Disclaimer', href: '#risk' },
  ];

  const addresses = [
    { label: 'Program ID', value: PROGRAM_ID.toBase58() },
    { label: 'Warchest Wallet', value: WARCHEST_WALLET.toBase58() },
    { label: 'Admin Wallet', value: ADMIN_WALLET.toBase58() },
  ];

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(label);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <footer>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 bg-silver-900/50 backdrop-blur-xl py-12">
        
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-12 gap-10 mb-12">
          
          {/* Brand Column */}
          <div className="lg:col-span-3">
            <a href="#" className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="Silver Mining" className="w-10 h-10 rounded-xl shadow-lg shadow-copper-500/20" />
              <div>
                <span className="text-xl font-bold text-white">Silver</span>
                <span className="text-xl font-bold text-copper-500">Mining</span>
              </div>
            </a>
            <p className="text-silver-400 text-sm leading-relaxed mb-6">
              The premier block-betting protocol on Solana. Bet on blocks, win the pot, and earn SILVER tokens.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a 
                href={SOCIAL_LINKS.discord} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-copper-500/15 hover:bg-copper-500/25 border border-copper-500/25 hover:border-copper-500/40 text-copper-400 hover:text-copper-300 transition-all text-sm font-medium"
              >
                <DiscordIcon className="w-5 h-5" />
                <span>Join Discord</span>
              </a>
              <a 
                href={SOCIAL_LINKS.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-silver-800/50 hover:bg-copper-500/15 border border-silver-700/50 hover:border-copper-500/30 text-silver-400 hover:text-copper-400 transition-all text-sm font-medium"
              >
                <XTwitterIcon className="w-4 h-4" />
                <span>Twitter</span>
              </a>
              {SOCIAL_LINKS.telegram && (
                <a 
                  href={SOCIAL_LINKS.telegram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-silver-800/50 hover:bg-copper-500/15 border border-silver-700/50 hover:border-copper-500/30 text-silver-400 hover:text-copper-400 transition-all text-sm font-medium"
                >
                  <TelegramIcon className="w-5 h-5" />
                  <span>Telegram</span>
                </a>
              )}
            </div>
          </div>

          {/* Navigation Column */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {navLinks.map((link, i) => (
                <li key={i}>
                  <a 
                    href={link.href} 
                    className="text-silver-400 hover:text-copper-400 transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Addresses Column */}
          <div className="lg:col-span-4">
            <h4 className="text-white font-semibold mb-4">Contract Addresses</h4>
            <div className="space-y-3">
              {addresses.map((addr, i) => (
                <div 
                  key={i} 
                  className="group p-3 rounded-lg bg-silver-900/30 border border-silver-800/50 hover:border-copper-500/30 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-silver-500 text-xs font-medium uppercase tracking-wide">
                      {addr.label}
                    </span>
                    <button
                      onClick={() => copyToClipboard(addr.value, addr.label)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        copiedAddress === addr.label
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-copper-500/10 text-copper-400 hover:bg-copper-500/20 border border-copper-500/20 hover:border-copper-500/30'
                      }`}
                    >
                      {copiedAddress === addr.label ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <CopyIcon className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div 
                    className="font-mono text-sm text-silver-300 break-all cursor-pointer hover:text-white transition-colors select-all"
                    onClick={() => copyToClipboard(addr.value, addr.label)}
                    title="Click to copy"
                  >
                    {addr.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-silver-800/50">
              <p className="text-xs text-silver-500">
                All contracts verified on{' '}
                <a 
                  href={`https://explorer.solana.com/address/${PROGRAM_ID.toBase58()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-copper-400 hover:text-copper-300 underline"
                >
                  Solana Explorer
                </a>
              </p>
            </div>
          </div>

          {/* Contact Card Column */}
          <div className="lg:col-span-3">
            <div className="card-copper p-5 rounded-xl">
              <h4 className="text-white font-semibold mb-4">Get in Touch</h4>
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full px-3 py-2.5 bg-silver-950/50 border border-copper-500/20 rounded-lg text-white text-sm placeholder:text-silver-500 focus:outline-none focus:border-copper-500/50"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your message..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-silver-950/50 border border-copper-500/20 rounded-lg text-white text-sm placeholder:text-silver-500 focus:outline-none focus:border-copper-500/50 resize-none"
                />
                <button className="w-full py-2.5 bg-copper-500 hover:bg-copper-600 text-white font-medium rounded-lg transition-colors text-sm">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6">
          <p className="text-silver-500 text-sm text-center">
            © 2026 Silver Mining Protocol. Built on Solana.
          </p>
        </div>
      </div>
    </footer>
  );
}
