import { useMemo, useState, useEffect, useRef } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import RiskDisclaimer from './components/RiskDisclaimer';
import AdminPanel from './components/AdminPanel';
import { useWallet } from '@solana/wallet-adapter-react';
import '@solana/wallet-adapter-react-ui/styles.css';

// Helius mainnet RPC for fast transactions
const ENDPOINT = 'https://mainnet.helius-rpc.com/?api-key=95d3d8ea-4db8-464e-9b5b-691dd931512a';

type Page = 'home' | 'privacy' | 'terms' | 'risk' | 'admin' | 'landing';

function AppContent() {
  const { connected } = useWallet();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const prevConnected = useRef(connected);

  // When wallet connects, navigate to dashboard
  useEffect(() => {
    if (connected && !prevConnected.current) {
      // Wallet just connected - go to dashboard
      window.location.hash = '';
      setCurrentPage('home');
    }
    prevConnected.current = connected;
  }, [connected]);

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      // Check if hash starts with a section anchor (how-it-works, mines, features)
      const sectionAnchors = ['how-it-works', 'mines', 'features'];
      
      if (hash === 'privacy') setCurrentPage('privacy');
      else if (hash === 'terms') setCurrentPage('terms');
      else if (hash === 'risk') setCurrentPage('risk');
      else if (hash === 'admin') setCurrentPage('admin');
      else if (hash === 'landing' || sectionAnchors.includes(hash)) setCurrentPage('landing');
      else setCurrentPage('home');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <TermsOfService />;
      case 'risk':
        return <RiskDisclaimer />;
      case 'admin':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <AdminPanel />
          </div>
        );
      case 'landing':
        // Force show Hero/landing page even when connected
        return <Hero />;
      case 'home':
      default:
        return connected ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <Dashboard />
          </div>
        ) : (
          <Hero />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-silver-950">
      <Header />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={ENDPOINT}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppContent />
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#18181b',
                color: '#e4e4e7',
                border: '1px solid rgba(205, 127, 90, 0.3)',
                maxWidth: '90vw',
                fontSize: '0.875rem',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#18181b' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#18181b' } },
            }}
          />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
