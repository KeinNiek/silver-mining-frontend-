import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../hooks/useStore';
import { formatSOL, formatAmount, SOCIAL_LINKS } from '../utils/constants';
import { MenuIcon, XIcon, DiscordIcon, XTwitterIcon, TelegramIcon, HelpIcon, SearchIcon } from './Icons';

export default function Header() {
  const wallet = useWallet();
  const { balances } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    window.location.hash = 'landing';
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const navigateToDashboard = () => {
    window.location.hash = '';
  };

  return (
    <header className="sticky top-0 z-50 bg-silver-900/95 backdrop-blur-xl border-b border-copper-500/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); navigateToDashboard(); }} className="flex items-center gap-2.5 group flex-shrink-0">
            <img src="/logo.png" alt="Silver Mining" className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-lg shadow-copper-500/20 group-hover:shadow-copper-500/40 transition-shadow" />
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-white">Silver</span>
              <span className="text-lg font-bold text-copper-500">Mining</span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            <a href="#how-it-works" onClick={(e) => navigateToSection(e, 'how-it-works')} className="nav-link">How It Works</a>
            <a href="#mines" onClick={(e) => navigateToSection(e, 'mines')} className="nav-link">Mines</a>
            <a href="#features" onClick={(e) => navigateToSection(e, 'features')} className="nav-link">Features</a>
            <a href="#tokenomics" className="nav-link">Tokenomics</a>
            <a href="#stats" className="nav-link">Dashboard</a>
            <a href="#explorer" className="nav-link flex items-center gap-1">
              <SearchIcon className="w-3.5 h-3.5" /> Explorer
            </a>
            <a href="#help" className="nav-link flex items-center gap-1">
              <HelpIcon className="w-3.5 h-3.5" /> Guide
            </a>
          </nav>

          {/* Right section: socials + balances + wallet */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Social Links - visible on md+ */}
            <div className="hidden md:flex items-center gap-1.5">
              {SOCIAL_LINKS.discord && (
                <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-silver-800/60 hover:bg-copper-500/15 border border-silver-700/40 hover:border-copper-500/30 flex items-center justify-center text-silver-400 hover:text-copper-400 transition-all"
                  title="Discord">
                  <DiscordIcon className="w-4 h-4" />
                </a>
              )}
              <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-silver-800/60 hover:bg-copper-500/15 border border-silver-700/40 hover:border-copper-500/30 flex items-center justify-center text-silver-400 hover:text-copper-400 transition-all"
                title="Twitter">
                <XTwitterIcon className="w-3.5 h-3.5" />
              </a>
              {SOCIAL_LINKS.telegram && (
                <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-silver-800/60 hover:bg-copper-500/15 border border-silver-700/40 hover:border-copper-500/30 flex items-center justify-center text-silver-400 hover:text-copper-400 transition-all"
                  title="Telegram">
                  <TelegramIcon className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Balances - lg+ only */}
            {wallet.connected && (
              <div className="hidden xl:flex items-center gap-2 text-xs">
                <div className="px-3 py-1.5 rounded-lg bg-silver-900/50 border border-copper-500/10">
                  <span className="text-silver-500">SOL</span>
                  <span className="text-white font-semibold ml-1.5">{formatSOL(balances.sol)}</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-copper-500/10 border border-copper-500/20">
                  <span className="text-copper-400">SILVER</span>
                  <span className="text-copper-300 font-semibold ml-1.5">{formatAmount(balances.silver)}</span>
                </div>
              </div>
            )}

            {/* Wallet button */}
            <div onClick={() => { if (wallet.connected) navigateToDashboard(); }}>
              <WalletMultiButton />
            </div>

            {/* Mobile menu toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-silver-400 hover:text-copper-400 transition-colors"
            >
              {mobileMenuOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-copper-500/10 py-3"
            >
              <nav className="flex flex-col gap-0.5">
                <a href="#how-it-works" onClick={(e) => { navigateToSection(e, 'how-it-works'); setMobileMenuOpen(false); }} className="px-4 py-2.5 text-silver-300 hover:text-copper-400 hover:bg-copper-500/10 rounded-lg transition-colors text-sm">How It Works</a>
                <a href="#mines" onClick={(e) => { navigateToSection(e, 'mines'); setMobileMenuOpen(false); }} className="px-4 py-2.5 text-silver-300 hover:text-copper-400 hover:bg-copper-500/10 rounded-lg transition-colors text-sm">Mines</a>
                <a href="#features" onClick={(e) => { navigateToSection(e, 'features'); setMobileMenuOpen(false); }} className="px-4 py-2.5 text-silver-300 hover:text-copper-400 hover:bg-copper-500/10 rounded-lg transition-colors text-sm">Features</a>
                <a href="#tokenomics" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-silver-300 hover:text-copper-400 hover:bg-copper-500/10 rounded-lg transition-colors text-sm">Tokenomics</a>
                <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-silver-300 hover:text-copper-400 hover:bg-copper-500/10 rounded-lg transition-colors text-sm">Dashboard</a>
                <a href="#explorer" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-silver-300 hover:text-copper-400 hover:bg-copper-500/10 rounded-lg transition-colors text-sm flex items-center gap-2">
                  <SearchIcon className="w-4 h-4" /> Explorer
                </a>
                <a href="#help" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2.5 text-silver-300 hover:text-copper-400 hover:bg-copper-500/10 rounded-lg transition-colors text-sm flex items-center gap-2">
                  <HelpIcon className="w-4 h-4" /> Guide
                </a>

                {/* Mobile social links */}
                <div className="flex items-center gap-2 px-4 pt-3 mt-2 border-t border-silver-800/50">
                  {SOCIAL_LINKS.discord && (
                    <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-copper-500/10 border border-copper-500/20 text-copper-400 text-xs font-medium">
                      <DiscordIcon className="w-4 h-4" /> Discord
                    </a>
                  )}
                  <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-silver-800/50 border border-silver-700/50 text-silver-300 text-xs font-medium">
                    <XTwitterIcon className="w-3.5 h-3.5" /> Twitter
                  </a>
                  {SOCIAL_LINKS.telegram && (
                    <a href={SOCIAL_LINKS.telegram} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-silver-800/50 border border-silver-700/50 text-silver-300 text-xs font-medium">
                      <TelegramIcon className="w-4 h-4" /> Telegram
                    </a>
                  )}
                </div>

                {/* Mobile balances */}
                {wallet.connected && (
                  <div className="flex items-center gap-2 px-4 pt-3 mt-1 text-xs">
                    <div className="px-3 py-1.5 rounded-lg bg-silver-900/50 border border-copper-500/10">
                      <span className="text-silver-500">SOL</span>
                      <span className="text-white font-semibold ml-1.5">{formatSOL(balances.sol)}</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-copper-500/10 border border-copper-500/20">
                      <span className="text-copper-400">SILVER</span>
                      <span className="text-copper-300 font-semibold ml-1.5">{formatAmount(balances.silver)}</span>
                    </div>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
