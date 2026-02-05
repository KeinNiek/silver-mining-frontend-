import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { motion } from 'framer-motion';
import { ADMIN_WALLET, formatSOL } from '../utils/constants';
import { useProgram } from '../hooks/useProgram';
import { useStore } from '../hooks/useStore';
import { ShieldIcon, AlertIcon, CheckIcon, RefreshIcon, BoltIcon, LockIcon } from './Icons';

export default function AdminPanel() {
  const wallet = useWallet();
  const { config, isLoading } = useStore();
  const { 
    initialize, 
    initializeRound, 
    finalizeRound,
    pauseProtocol,
    unpauseProtocol,
    updateStakingApr,
    withdrawMotherlodeFees,
    withdrawAutominerTreasury,
    fetchConfig 
  } = useProgram();
  
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [newApr, setNewApr] = useState('');
  const [motherlodeWithdrawAmount, setMotherlodeWithdrawAmount] = useState('');
  const [treasuryWithdrawAmount, setTreasuryWithdrawAmount] = useState('');

  const isAdmin = wallet.publicKey?.toBase58() === ADMIN_WALLET.toBase58();

  useEffect(() => {
    if (wallet.publicKey) {
      fetchConfig();
    }
  }, [wallet.publicKey, fetchConfig]);

  const handleAction = async (action: () => Promise<void>, successMsg: string) => {
    setStatus('idle');
    setMessage('');
    try {
      await action();
      setStatus('success');
      setMessage(successMsg);
      await fetchConfig();
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Action failed');
    }
  };

  const handleUpdateApr = async () => {
    const aprBps = Math.round(parseFloat(newApr) * 100);
    if (isNaN(aprBps) || aprBps < 0 || aprBps > 10000) {
      setStatus('error');
      setMessage('APR must be between 0% and 100%');
      return;
    }
    await handleAction(() => updateStakingApr(aprBps), `Staking APR updated to ${newApr}%`);
    setNewApr('');
  };

  const handleWithdrawMotherlode = async () => {
    const lamports = Math.round(parseFloat(motherlodeWithdrawAmount) * LAMPORTS_PER_SOL);
    if (isNaN(lamports) || lamports <= 0) {
      setStatus('error');
      setMessage('Enter a valid amount');
      return;
    }
    await handleAction(() => withdrawMotherlodeFees(lamports), `Withdrawn ${motherlodeWithdrawAmount} SOL from motherlode fees`);
    setMotherlodeWithdrawAmount('');
  };

  const handleWithdrawTreasury = async () => {
    const lamports = Math.round(parseFloat(treasuryWithdrawAmount) * LAMPORTS_PER_SOL);
    if (isNaN(lamports) || lamports <= 0) {
      setStatus('error');
      setMessage('Enter a valid amount');
      return;
    }
    await handleAction(() => withdrawAutominerTreasury(lamports), `Withdrawn ${treasuryWithdrawAmount} SOL from autominer treasury`);
    setTreasuryWithdrawAmount('');
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
        className="max-w-3xl mx-auto"
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

          {/* Protocol Status */}
          <div className="mb-8 p-4 bg-silver-900/50 rounded-xl">
            <h3 className="text-white font-semibold mb-3">Protocol Status</h3>
            {config ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-silver-500">Status</p>
                  <p className={`font-semibold flex items-center gap-1 ${config.paused ? 'text-red-400' : 'text-emerald-400'}`}>
                    {config.paused ? (
                      <><LockIcon className="w-4 h-4" /> Paused</>
                    ) : (
                      <><CheckIcon className="w-4 h-4" /> Active</>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-silver-500">Current Round</p>
                  <p className="text-white font-semibold">{config.currentRound}</p>
                </div>
                <div>
                  <p className="text-silver-500">Staking APR</p>
                  <p className="text-copper-400 font-semibold">{(config.stakingApr / 100).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-silver-500">Motherlode Balance</p>
                  <p className="text-copper-300 font-semibold">{formatSOL(config.motherlodeBalance)} SOL</p>
                </div>
                <div>
                  <p className="text-silver-500">AutoMiner Treasury</p>
                  <p className="text-emerald-400 font-semibold">{formatSOL(config.autominerTreasury)} SOL</p>
                </div>
                <div>
                  <p className="text-silver-500">Total Pools</p>
                  <p className="text-white font-semibold">{config.totalPools}</p>
                </div>
                <div>
                  <p className="text-silver-500">Admin Minted SILVER</p>
                  <p className="text-white font-semibold">{(config.adminMintedSilver / 1e9).toLocaleString()} / 50,000</p>
                </div>
                <div>
                  <p className="text-silver-500">Total Staked</p>
                  <p className="text-white font-semibold">{(config.totalStaked / 1e9).toLocaleString()} SILVER</p>
                </div>
                <div>
                  <p className="text-silver-500">Redistribution Pool</p>
                  <p className="text-white font-semibold">{(config.redistributionPool / 1e9).toLocaleString()}</p>
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
            {/* Initialize Protocol */}
            <div className="p-4 bg-silver-900/30 rounded-xl">
              <h3 className="text-white font-semibold mb-3">Initialize Protocol</h3>
              <p className="text-silver-500 text-sm mb-4">
                One-time setup to create config and token mints.
              </p>
              <button 
                onClick={() => handleAction(initialize, 'Protocol initialized successfully')}
                className="btn-primary w-full"
                disabled={isLoading || !!config}
              >
                {isLoading ? 'Processing...' : config ? 'Already Initialized' : 'Initialize Protocol'}
              </button>
            </div>

            {/* Round Management */}
            <div className="p-4 bg-silver-900/30 rounded-xl">
              <h3 className="text-white font-semibold mb-3">Round Management</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleAction(initializeRound, 'Round initialized')}
                  className="btn-primary flex items-center justify-center gap-2"
                  disabled={isLoading || !config}
                >
                  <BoltIcon className="w-4 h-4" />
                  {isLoading ? '...' : 'Init Round'}
                </button>
                <button 
                  onClick={() => handleAction(finalizeRound, 'Round finalized')}
                  className="btn-secondary flex items-center justify-center gap-2"
                  disabled={isLoading || !config}
                >
                  <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? '...' : 'Finalize Round'}
                </button>
              </div>
            </div>

            {/* Pause / Unpause */}
            <div className="p-4 bg-silver-900/30 rounded-xl">
              <h3 className="text-white font-semibold mb-3">Pause Control</h3>
              <p className="text-silver-500 text-sm mb-4">
                Pause or unpause the protocol. When paused, no bets or claims can be made.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleAction(pauseProtocol, 'Protocol paused')}
                  className="py-3 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isLoading || !config || config?.paused}
                >
                  <LockIcon className="w-4 h-4" />
                  {config?.paused ? 'Already Paused' : 'Pause'}
                </button>
                <button 
                  onClick={() => handleAction(unpauseProtocol, 'Protocol unpaused')}
                  className="py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isLoading || !config || !config?.paused}
                >
                  <CheckIcon className="w-4 h-4" />
                  {!config?.paused ? 'Already Active' : 'Unpause'}
                </button>
              </div>
            </div>

            {/* Update Staking APR */}
            <div className="p-4 bg-silver-900/30 rounded-xl">
              <h3 className="text-white font-semibold mb-3">Update Staking APR</h3>
              <p className="text-silver-500 text-sm mb-4">
                Current APR: <span className="text-copper-400 font-semibold">{config ? (config.stakingApr / 100).toFixed(2) : '—'}%</span>
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="number" 
                    className="input w-full pr-8"
                    placeholder="e.g. 12.5"
                    value={newApr}
                    onChange={(e) => setNewApr(e.target.value)}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-silver-500 text-sm">%</span>
                </div>
                <button 
                  onClick={handleUpdateApr}
                  className="btn-primary px-6"
                  disabled={isLoading || !config || !newApr}
                >
                  {isLoading ? '...' : 'Update'}
                </button>
              </div>
            </div>

            {/* Withdraw Motherlode Fees */}
            <div className="p-4 bg-silver-900/30 rounded-xl">
              <h3 className="text-white font-semibold mb-3">Withdraw Motherlode Fees</h3>
              <p className="text-silver-500 text-sm mb-4">
                Available: <span className="text-copper-300 font-semibold">{config ? formatSOL(config.motherlodeBalance) : '0'} SOL</span>
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="number" 
                    className="input w-full pr-12"
                    placeholder="Amount"
                    value={motherlodeWithdrawAmount}
                    onChange={(e) => setMotherlodeWithdrawAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-silver-500 text-sm">SOL</span>
                </div>
                <button 
                  onClick={() => setMotherlodeWithdrawAmount(config ? (config.motherlodeBalance / LAMPORTS_PER_SOL).toString() : '0')}
                  className="px-3 py-2 text-xs bg-copper-500/20 text-copper-400 rounded-lg hover:bg-copper-500/30"
                >
                  MAX
                </button>
                <button 
                  onClick={handleWithdrawMotherlode}
                  className="btn-primary px-6"
                  disabled={isLoading || !config || !motherlodeWithdrawAmount}
                >
                  {isLoading ? '...' : 'Withdraw'}
                </button>
              </div>
            </div>

            {/* Withdraw AutoMiner Treasury */}
            <div className="p-4 bg-silver-900/30 rounded-xl">
              <h3 className="text-white font-semibold mb-3">Withdraw AutoMiner Treasury</h3>
              <p className="text-silver-500 text-sm mb-4">
                Available: <span className="text-emerald-400 font-semibold">{config ? formatSOL(config.autominerTreasury) : '0'} SOL</span>
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input 
                    type="number" 
                    className="input w-full pr-12"
                    placeholder="Amount"
                    value={treasuryWithdrawAmount}
                    onChange={(e) => setTreasuryWithdrawAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-silver-500 text-sm">SOL</span>
                </div>
                <button 
                  onClick={() => setTreasuryWithdrawAmount(config ? (config.autominerTreasury / LAMPORTS_PER_SOL).toString() : '0')}
                  className="px-3 py-2 text-xs bg-copper-500/20 text-copper-400 rounded-lg hover:bg-copper-500/30"
                >
                  MAX
                </button>
                <button 
                  onClick={handleWithdrawTreasury}
                  className="btn-primary px-6"
                  disabled={isLoading || !config || !treasuryWithdrawAmount}
                >
                  {isLoading ? '...' : 'Withdraw'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
