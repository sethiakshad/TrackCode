import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { Input } from './Input';
import { X, Search, CheckCircle, Code2, Trophy, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { fetchCodeforcesProfile } from '../../services/codeforcesService';
import { useAuth } from '../../context/AuthContext';

export const ConnectCodeforcesModal = ({ isOpen, onClose, onConfirm }) => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [step, setStep] = useState('input');
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const [verificationCode, setVerificationCode] = useState(() => `TC-${Math.floor(1000 + Math.random() * 9000)}`);

  useEffect(() => {
    if (isOpen) {
      setVerificationCode(`TC-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  }, [isOpen]);

  const handleFetch = async (e) => {
    e?.preventDefault();
    if (!username.trim()) return;

    setStep('loading');
    setError('');
    setVerificationError('');

    try {
      const data = await fetchCodeforcesProfile(username);
      setProfileData(data);
      setStep('preview');
    } catch (err) {
      setError(err.message || 'Failed to fetch profile');
      setStep('error');
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    setVerificationError('');
    try {
      const freshData = await fetchCodeforcesProfile(username);
      const targetCode = verificationCode.toLowerCase();
      
      const containsCode = JSON.stringify(freshData).toLowerCase().includes(targetCode);

      if (!containsCode) {
        setVerificationError(`Verification code "${verificationCode}" not found. Paste it in your Organization, City, or First/Last name on Codeforces.`);
        setIsConfirming(false);
        return;
      }

      await onConfirm(username);
      handleClose();
    } catch (err) {
      setVerificationError(err.message || 'Failed during profile verification check');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setStep('input');
    setProfileData(null);
    setError('');
    setVerificationError('');
    setIsConfirming(false);
    onClose();
  };

  const handleRetry = () => {
    setStep('input');
    setError('');
    setVerificationError('');
    setProfileData(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl shadow-black/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                  <span className="font-bold text-white text-lg font-serif">CF</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Connect Codeforces</h3>
                  <p className="text-[11px] text-slate-400">Link your Codeforces profile</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {step === 'input' && (
                <form onSubmit={handleFetch} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Codeforces Handle</label>
                    <Input
                      type="text"
                      placeholder="e.g. tourist"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      icon={<Search className="h-4 w-4" />}
                      autoFocus
                    />
                    <p className="text-[11px] text-slate-500">
                      Enter your Codeforces handle to fetch your profile data.
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={!username.trim()}>
                    <Search className="h-4 w-4 mr-2" />
                    Fetch Profile
                  </Button>
                </form>
              )}

              {step === 'loading' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 text-blue-400 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">Fetching profile...</p>
                  </div>
                </div>
              )}

              {step === 'preview' && profileData && (
                <div className="space-y-4 text-left">
                  {/* User card */}
                  <div className="flex items-center space-x-3 rounded-xl border border-white/5 bg-slate-900/60 p-3">
                    {profileData.avatar ? (
                      <img
                        src={profileData.avatar}
                        alt={profileData.username}
                        className="h-10 w-10 rounded-lg border border-white/10"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {profileData.username[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-white">{profileData.username}</p>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400 font-medium">Profile found</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <StatBox
                      label="Rating"
                      value={profileData.rating}
                      icon={<Trophy className="h-3.5 w-3.5" />}
                      color="text-amber-400"
                    />
                    <StatBox
                      label="Rank"
                      value={profileData.rank}
                      icon={<Zap className="h-3.5 w-3.5" />}
                      color="text-cyan-400"
                    />
                    <StatBox
                      label="Solved"
                      value={profileData.problems_solved}
                      icon={<Code2 className="h-3.5 w-3.5" />}
                      color="text-primary-400"
                    />
                  </div>

                  {/* Ownership Verification */}
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2.5">
                    <p className="text-xs font-bold text-amber-400 flex items-center">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                      Verify Account Ownership
                    </p>
                    <div className="text-[11px] text-slate-300 space-y-1.5 leading-normal">
                      <p>Copy the code below and paste it anywhere on your Codeforces profile (e.g. <b>Organization</b>, <b>City</b>, or <b>First Name</b>):</p>
                      <p>Save changes on Codeforces and click verify:</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-slate-950/60 border border-white/10 px-3 py-1.5 rounded-lg text-sm text-center font-mono font-bold text-white tracking-wider select-all">
                        {verificationCode}
                      </code>
                    </div>
                    {verificationError && (
                      <p className="text-[10px] font-semibold text-red-400 bg-red-950/20 border border-red-500/20 p-2 rounded-lg leading-normal">
                        {verificationError}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <Button variant="outline" onClick={handleRetry} className="flex-1">
                      Try Different User
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      isLoading={isConfirming}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify & Connect
                    </Button>
                  </div>
                </div>
              )}

              {step === 'error' && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-6 space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">Connection Failed</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">{error}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleRetry} className="w-full">
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const StatBox = ({ label, value, icon, color }) => (
  <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3 text-center space-y-1">
    <div className={`mx-auto ${color}`}>{icon}</div>
    <p className="text-md font-extrabold text-white tracking-tight truncate capitalize">{value}</p>
    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider truncate">{label}</p>
  </div>
);
