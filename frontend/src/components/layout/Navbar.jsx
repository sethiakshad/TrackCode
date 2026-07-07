import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, Menu, Sun, Moon, RefreshCw, LogOut, Settings, User, Check, Shield } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { motion, AnimatePresence } from 'framer-motion';

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isSyncing, setIsSyncing] = useState(false);

  // Ctrl+K keydown listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        alert('Global search palette (Ctrl + K) is coming soon!');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1500);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-[#030712]/80 px-6 backdrop-blur-md">
      <div className="flex items-center space-x-4 flex-1">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-dark-textMuted hover:text-white focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="hidden md:block w-72 lg:w-96 relative">
          <Input 
            type="search" 
            placeholder="Search users, repos, or contests..." 
            icon={<Search className="h-4 w-4" />}
            className="h-9 bg-slate-900/50 border-white/5 focus:bg-slate-950"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 text-[10px] text-dark-textMuted border border-white/10 rounded px-1.5 py-0.5 bg-slate-950/80 pointer-events-none">
            <span className="font-sans">Ctrl</span>
            <span>+</span>
            <span className="font-sans">K</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        {/* Sync Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          className="hidden sm:flex h-9 items-center space-x-2 text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-primary-400' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-dark-textMuted hover:text-white"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notification Dropdown Container */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
            className="relative text-dark-textMuted hover:text-white"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary-500 border-2 border-[#030712]" />
          </Button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-slate-900/95 p-2 shadow-2xl backdrop-blur-xl z-50 text-left"
              >
                <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Notifications</span>
                  <span className="text-[10px] text-primary-400 cursor-pointer hover:underline">Mark all read</span>
                </div>
                <div className="max-h-60 overflow-y-auto py-1">
                  <div className="px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors text-xs space-y-0.5">
                    <p className="font-semibold text-white">Sync Completed Successfully</p>
                    <p className="text-dark-textMuted">LeetCode profile data has been fetched.</p>
                    <p className="text-[10px] text-primary-400">10m ago</p>
                  </div>
                  <div className="px-3 py-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors text-xs space-y-0.5 border-t border-white/5">
                    <p className="font-semibold text-white">New Daily Goal Achieved!</p>
                    <p className="text-dark-textMuted">You solved 5 medium problems today.</p>
                    <p className="text-[10px] text-primary-400">2h ago</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-6 w-px bg-white/10 mx-1" />
        
        {/* User Profile Dropdown Container */}
        <div className="relative">
          <button 
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
            className="flex items-center space-x-2 rounded-lg p-1 hover:bg-white/5 transition-colors focus:outline-none"
          >
            <img 
              src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} 
              alt="Profile" 
              className="h-8 w-8 rounded-lg border border-white/10 bg-slate-800"
            />
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-slate-900/95 p-1 shadow-2xl backdrop-blur-xl z-50 text-left"
              >
                <div className="px-3 py-2 border-b border-white/5 flex flex-col">
                  <span className="text-xs font-semibold text-white">{user?.name || 'Developer'}</span>
                  <span className="text-[10px] text-dark-textMuted">{user?.email || 'demo@trackcode.com'}</span>
                </div>
                <div className="py-1">
                  <button className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs text-dark-textMuted hover:text-white hover:bg-white/5 transition-colors">
                    <User className="h-4 w-4" />
                    <span>My Profile</span>
                  </button>
                  <button className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs text-dark-textMuted hover:text-white hover:bg-white/5 transition-colors">
                    <Shield className="h-4 w-4" />
                    <span>Security</span>
                  </button>
                </div>
                <div className="border-t border-white/5 pt-1">
                  <button 
                    onClick={logout}
                    className="flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
