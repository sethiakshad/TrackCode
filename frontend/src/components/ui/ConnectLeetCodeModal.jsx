import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { Input } from './Input';
import { X, Search, CheckCircle, Code2, Trophy, Zap, AlertTriangle, Loader2, Copy, Check } from 'lucide-react';
import { fetchLeetCodeProfile, verifyLeetCodeOwnership } from '../../services/leetcodeService';

/**
 * Modal to connect a LeetCode account.
 * Flow: Enter username → Preview fetched data → Confirm
 */
export const ConnectLeetCodeModal = ({ isOpen, onClose, onConfirm }) => {
  const [username, setUsername] = useState('');
  const [step, setStep] = useState('input'); // 'input' | 'loading' | 'preview' | 'error'
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate a random verification code that persists while the modal is open
  const [verificationCode] = useState(() => `TC-${Math.floor(1000 + Math.random() * 9000)}`);
  const verificationUrl = `https://${verificationCode}.com`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = verificationUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFetch = async (e) => {
    e?.preventDefault();
    if (!username.trim()) return;

    setStep('loading');
    setError('');
    setVerificationError('');
    setVerificationStatus('');

    try {
      const data = await fetchLeetCodeProfile(username);
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
    setVerificationStatus('Checking your LeetCode Website field for the verification link...');
    try {
      const { verified } = await verifyLeetCodeOwnership(username, verificationCode);

      if (!verified) {
        setVerificationStatus('');
        setVerificationError(
          `Verification link was not detected yet. Paste it in your LeetCode Website field, click Save on LeetCode, wait ~10 seconds, then try again.`
        );
        return;
      }

      setVerificationStatus('Verified. Connecting your account...');
      await onConfirm(username.trim());
      handleClose();
    } catch (err) {
      setVerificationStatus('');
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
    setVerificationStatus('');
    setIsConfirming(false);
    setCopied(false);
    onClose();
  };

  const handleRetry = () => {
    setStep('input');
    setError('');
    setVerificationError('');
    setVerificationStatus('');
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
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
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
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                  <Code2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Connect LeetCode</h3>
                  <p className="text-[11px] text-slate-400">Link your competitive programming profile</p>
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
              {/* Step: Input */}
              {step === 'input' && (
                <form onSubmit={handleFetch} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">LeetCode Username</label>
                    <Input
                      type="text"
                      placeholder="e.g. neal_wu"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      icon={<Search className="h-4 w-4" />}
                      autoFocus
                    />
                    <p className="text-[11px] text-slate-500">
                      Enter your LeetCode username to fetch your profile data.
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={!username.trim()}>
                    <Search className="h-4 w-4 mr-2" />
                    Fetch Profile
                  </Button>
                </form>
              )}

              {/* Step: Loading */}
              {step === 'loading' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                      <Loader2 className="h-7 w-7 text-amber-400 animate-spin" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">Fetching profile...</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      This may take up to 30s if the API is cold-starting.
                    </p>
                  </div>
                </div>
              )}

              {/* Step: Preview */}
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
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
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
                      label="Problems"
                      value={profileData.problems_solved}
                      icon={<Code2 className="h-3.5 w-3.5" />}
                      color="text-primary-400"
                    />
                    <StatBox
                      label="Rating"
                      value={profileData.contest_rating || 'N/A'}
                      icon={<Trophy className="h-3.5 w-3.5" />}
                      color="text-amber-400"
                    />
                    <StatBox
                      label="Ranking"
                      value={profileData.ranking ? `#${profileData.ranking.toLocaleString()}` : 'N/A'}
                      icon={<Zap className="h-3.5 w-3.5" />}
                      color="text-cyan-400"
                    />
                  </div>

                  {/* Difficulty breakdown */}
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-semibold">
                      Easy: {profileData.easy}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 font-semibold">
                      Medium: {profileData.medium}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-red-500/10 text-red-400 font-semibold">
                      Hard: {profileData.hard}
                    </span>
                  </div>

                  {/* Ownership Verification */}
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2.5">
                    <p className="text-xs font-bold text-amber-400 flex items-center">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                      Verify Account Ownership
                    </p>
                    <div className="text-[11px] text-slate-300 space-y-1.5 leading-normal">
                      <p>Copy the link below and paste it into the <b>Website</b> field on your LeetCode profile.</p>
                      <p>Save changes on LeetCode, wait a few seconds, then click verify:</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 min-w-0 bg-slate-950/60 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-white truncate">
                        {verificationUrl}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="flex shrink-0 items-center space-x-1.5 rounded-lg border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    {verificationStatus && (
                      <p className="text-[10px] font-medium text-cyan-300 bg-cyan-950/20 border border-cyan-500/20 p-2 rounded-lg leading-normal">
                        {verificationStatus}
                      </p>
                    )}
                    {verificationError && (
                      <p className="text-[10px] font-semibold text-red-400 bg-red-950/20 border border-red-500/20 p-2 rounded-lg leading-normal">
                        {verificationError}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
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

              {/* Step: Error */}
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

/** Small stat display box used in the preview */
const StatBox = ({ label, value, icon, color }) => (
  <div className="rounded-xl border border-white/5 bg-slate-900/40 p-3 text-center space-y-1">
    <div className={`mx-auto ${color}`}>{icon}</div>
    <p className="text-lg font-extrabold text-white tracking-tight">{value}</p>
    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{label}</p>
  </div>
);
