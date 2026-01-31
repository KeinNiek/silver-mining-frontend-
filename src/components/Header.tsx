import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../hooks/useStore';
import { formatSOL, formatAmount } from '../utils/constants';
import { MenuIcon, XIcon } from './Icons';

export default function Header() {
  const wallet = useWallet();
  const { balances } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navigate to home page section - works even when wallet is connected
  const navigateToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    // Set hash to 'landing' first to show Hero, then scroll to section
    window.location.hash = 'landing';
    // Small delay to allow page to render Hero before scrolling
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Navigate to dashboard (clear hash to go to default home view)
  const navigateToDashboard = () => {
    window.location.hash = '';
  };

  return (
    <header className="sticky top-0 z-50 bg-#302a3d  backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <a href="#" onClick={(e) => { e.preventDefault(); navigateToDashboard(); }} className="flex items-center gap-3 group">
            <img src="/logo.png" alt="Silver Mining" className="w-10 h-10 rounded-xl shadow-lg shadow-copper-500/20 group-hover:shadow-copper-500/40 transition-shadow" />
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-white">Silver</span>
              <span className="text-xl font-bold text-copper-500">Mining</span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" onClick={(e) => navigateToSection(e, 'how-it-works')} className="nav-link">How It Works</a>
            <a href="#mines" onClick={(e) => navigateToSection(e, 'mines')} className="nav-link">Mines</a>
            <a href="#features" onClick={(e) => navigateToSection(e, 'features')} className="nav-link">Features</a>
           
          </nav>

          {/* Wallet & Balances */}
          <div className="flex items-center gap-4">
            {wallet.connected && (
              <div className="hidden lg:flex items-center gap-3 text-sm">
                <div className="px-4 py-2 rounded-lg bg-silver-900/50 border border-copper-500/10">
                  <span className="text-silver-500">SOL:</span>
                  <span className="text-white font-semibold ml-2">{formatSOL(balances.sol)}</span>
                </div>
                <div className="px-4 py-2 rounded-lg bg-copper-500/10 border border-copper-500/20">
                  <span className="text-copper-400">SILVER:</span>
                  <span className="text-copper-300 font-semibold ml-2">{formatAmount(balances.silver)}</span>
                </div>
              </div>
            )}

            {/* Wrapper div to handle click for navigation to dashboard */}
            <div onClick={() => { if (wallet.connected) navigateToDashboard(); }}>
              <WalletMultiButton />
            </div>

            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-silver-400 hover:text-copper-400 transition-colors"
            >
              {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
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
              className="md:hidden border-t border-copper-500/10 py-4"
            >
              <nav className="flex flex-col gap-1">
                <a href="#how-it-works" onClick={(e) => { navigateToSection(e, 'how-it-works'); setMobileMenuOpen(false); }} className="px-4 py-3 text-silver-300 hover:text-copper-400 hover:bg-copper-500/10 rounded-lg transition-colors">How It Works</a>
                <a href="#mines" onClick={(e) => { navigateToSection(e, 'mines'); setMobileMenuOpen(false); }} className="px-4 py-3 text-silver-300 hover:text-copper-400 hover:bg-copper-500/10 rounded-lg transition-colors">Mines</a>
                <a href="#features" onClick={(e) => { navigateToSection(e, 'features'); setMobileMenuOpen(false); }} className="px-4 py-3 text-silver-300 hover:text-copper-400 hover:bg-copper-500/10 rounded-lg transition-colors">Features</a>
                
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}