import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { AUTHORITY_WALLET, formatSOL } from '../utils/constants';
import { useProgram } from '../hooks/useProgram';
import { useStore } from '../hooks/useStore';
import { ShieldIcon, AlertIcon, CheckIcon, RefreshIcon, BoltIcon } from './Icons';

export default function AdminPanel() {
  const wallet = useWallet();
  const { config, isLoading } = useStore();
  const { 
    initialize, 
    initializeRound, 
    finalizeRound,
    fetchConfig 
  } = useProgram();
  
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const isAdmin = wallet.publicKey?.toBase58() === AUTHORITY_WALLET.toBase58();

  useEffect(() => {
    if (wallet.publicKey) {
      fetchConfig();
    }
  }, [wallet.publicKey, fetchConfig]);

  const handleInitialize = async () => {
    if (!wallet.publicKey) return;
    setStatus('idle');
    setMessage('');
    try {
      await initialize();
      setStatus('success');
      setMessage('Protocol initialized successfully');
      await fetchConfig();
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to initialize');
    }
  };

  const handleInitializeRound = async () => {
    if (!wallet.publicKey) return;
    setStatus('idle');
    setMessage('');
    try {
      await initializeRound();
      setStatus('success');
      setMessage('Round initialized successfully');
      await fetchConfig();
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to initialize round');
    }
  };

  const handleFinalizeRound = async () => {
    if (!wallet.publicKey) return;
    setStatus('idle');
    setMessage('');
    try {
      await finalizeRound();
      setStatus('success');
      setMessage('Round finalized and next round started');
      await fetchConfig();
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to finalize round');
    }
  };

  if (!wallet.connected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card p-10 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
            <ShieldIcon className="w-8 h-8 text-copper-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Admin Access Required</h2>
          <p className="text-silver-400">Connect the admin wallet to access this panel</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="card p-10 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertIcon className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2>
          <p className="text-silver-400 mb-4">This wallet is not authorized for admin access</p>
          <p className="text-silver-600 text-sm font-mono break-all">
            {wallet.publicKey?.toBase58()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="card p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-copper-500/10 border border-copper-500/30 flex items-center justify-center">
              <ShieldIcon className="w-6 h-6 text-copper-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
              <p className="text-silver-400 text-sm">Protocol management</p>
            </div>
          </div>

          {status !== 'idle' && (
            <div className={`mb-6 p-4 rounded-xl border ${
              status === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              <div className="flex items-center gap-2">
                {status === 'success' ? <CheckIcon className="w-5 h-5" /> : <AlertIcon className="w-5 h-5" />}
                <span>{message}</span>
              </div>
            </div>
          )}

          <div className="mb-8 p-4 bg-silver-900/50 rounded-xl">
            <h3 className="text-white font-semibold mb-3">Protocol Status</h3>
            {config ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-silver-500">Status</p>
                  <p className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckIcon className="w-4 h-4" /> Initialized
                  </p>
                </div>
                <div>
                  <p className="text-silver-500">Current Round</p>
                  <p className="text-white font-semibold">{config.currentRound}</p>
                </div>
                <div>
                  <p className="text-silver-500">Motherlode Balance</p>
                  <p className="text-amber-400 font-semibold">{formatSOL(config.motherlodeBalance)} SOL</p>
                </div>
                <div>
                  <p className="text-silver-500">Total Pools</p>
                  <p className="text-white font-semibold">{config.totalPools}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-400">
                <AlertIcon className="w-4 h-4" />
                <span>Protocol not initialized</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-silver-900/30 rounded-xl">
              <h3 className="text-white font-semibold mb-3">Initialize Protocol</h3>
              <p className="text-silver-500 text-sm mb-4">
                One-time setup to create config and token mints.
              </p>
              <button 
                onClick={handleInitialize}
                className="btn-primary w-full"
                disabled={isLoading || !!config}
              >
                {isLoading ? 'Processing...' : config ? 'Already Initialized' : 'Initialize Protocol'}
              </button>
            </div>

            <div className="p-4 bg-silver-900/30 rounded-xl">
              <h3 className="text-white font-semibold mb-3">Initialize Round</h3>
              <p className="text-silver-500 text-sm mb-4">
                Start a new round. Only needed for Round 1.
              </p>
              <button 
                onClick={handleInitializeRound}
                className="btn-primary w-full flex items-center justify-center gap-2"
                disabled={isLoading || !config}
              >
                <BoltIcon className="w-4 h-4" />
                {isLoading ? 'Processing...' : 'Initialize Round'}
              </button>
            </div>

            <div className="p-4 bg-silver-900/30 rounded-xl">
              <h3 className="text-white font-semibold mb-3">Finalize Round</h3>
              <p className="text-silver-500 text-sm mb-4">
                End current round and start next automatically.
              </p>
              <button 
                onClick={handleFinalizeRound}
                className="btn-secondary w-full flex items-center justify-center gap-2"
                disabled={isLoading || !config}
              >
                <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Processing...' : 'Finalize Round'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
