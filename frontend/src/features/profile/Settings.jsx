import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { User, Bell, Shield, Key, HelpCircle, Save, Check, Link2, Unlink } from 'lucide-react';
import { useLeetCode } from '../../context/LeetCodeContext';
import { useGitHub } from '../../context/GitHubContext';
import { ConnectLeetCodeModal } from '../../components/ui/ConnectLeetCodeModal';
import { ConnectGitHubModal } from '../../components/ui/ConnectGitHubModal';

const Github = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const Settings = () => {
  const { user } = useAuth();
  const { profile: lcProfile, isConnected: isConnectedLeetCode, connectLeetCode, disconnect: disconnectLeetCode } = useLeetCode();
  const { profile: ghProfile, isConnected: isConnectedGitHub, connectGitHub, disconnect: disconnectGitHub } = useGitHub();
  const [name, setName] = useState(user?.name || 'Developer');
  const [email, setEmail] = useState(user?.email || 'demo@trackcode.com');
  const [cfUsername, setCfUsername] = useState('cf_master');
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLCModal, setShowLCModal] = useState(false);
  const [showGHModal, setShowGHModal] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-left">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Account Settings
        </h1>
        <p className="text-dark-textMuted text-sm mt-1">Manage connected developer profiles, privacy tokens, and notification levels.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Card */}
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-md flex items-center space-x-2">
              <User className="h-4.5 w-4.5 text-primary-400" />
              <span>Personal Profile</span>
            </CardTitle>
            <CardDescription>Update your public display info and email credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-dark-textMuted">Display Name</label>
                <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-dark-textMuted">Email Address</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-md flex items-center space-x-2">
              <Github className="h-4.5 w-4.5 text-cyan-400" />
              <span>Connected Developer Handles</span>
            </CardTitle>
            <CardDescription>Handles used to scrape competitive programming metrics & commits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-dark-textMuted">GitHub Status</label>
                {isConnectedGitHub ? (
                  <div className="space-y-2">
                    <div className="flex items-center h-10 w-full rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-400">
                      <span className="font-semibold truncate">Connected: {ghProfile.username}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={disconnectGitHub}
                      className="h-10 w-full justify-center text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      Disconnect GitHub
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowGHModal(true)}
                    className="h-10 w-full justify-center border-dashed"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect GitHub
                  </Button>
                )}
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-dark-textMuted">LeetCode Status</label>
                {isConnectedLeetCode ? (
                  <div className="space-y-2">
                    <div className="flex items-center h-10 w-full rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-400">
                      <span className="font-semibold truncate">Connected: {lcProfile.username}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={disconnectLeetCode}
                      className="h-10 w-full justify-center text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      Disconnect LeetCode
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLCModal(true)}
                    className="h-10 w-full justify-center border-dashed"
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Connect LeetCode
                  </Button>
                )}
              </div>

              <div className="space-y-1.5 text-left sm:col-span-2">
                <label className="text-xs font-semibold text-dark-textMuted">Codeforces Handle</label>
                <Input type="text" value={cfUsername} onChange={(e) => setCfUsername(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification preferences */}
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-md flex items-center space-x-2">
              <Bell className="h-4.5 w-4.5 text-amber-400" />
              <span>Notification Preferences</span>
            </CardTitle>
            <CardDescription>Decide when we notify you about sync status and streaks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <label className="flex items-center space-x-3 cursor-pointer text-slate-200">
              <input type="checkbox" defaultChecked className="rounded border-white/10 bg-slate-950 text-primary-500 focus:ring-primary-500" />
              <span>Notify me when daily coding goal is met</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer text-slate-200">
              <input type="checkbox" defaultChecked className="rounded border-white/10 bg-slate-950 text-primary-500 focus:ring-primary-500" />
              <span>Notify me before my coding streak is about to break (at 9 PM)</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer text-slate-200">
              <input type="checkbox" className="rounded border-white/10 bg-slate-950 text-primary-500 focus:ring-primary-500" />
              <span>Receive weekly AI performance digests via email</span>
            </label>
          </CardContent>
        </Card>

        {/* Footer controls */}
        <div className="flex justify-end items-center space-x-3 pt-2">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <Check className="h-4 w-4 mr-1" />
              Settings saved successfully!
            </span>
          )}
          <Button type="submit" className="h-10 px-6 font-semibold">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </form>

      <ConnectLeetCodeModal
        isOpen={showLCModal}
        onClose={() => setShowLCModal(false)}
        onConfirm={connectLeetCode}
      />
      <ConnectGitHubModal
        isOpen={showGHModal}
        onClose={() => setShowGHModal(false)}
        onConfirm={connectGitHub}
      />
    </div>
  );
};
