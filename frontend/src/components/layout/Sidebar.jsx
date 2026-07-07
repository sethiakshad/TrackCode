
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BarChart2, GitPullRequest, Trophy, Bot, Users, Settings, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Analytics', icon: BarChart2, href: '/analytics' },
  { label: 'GitHub Insights', icon: GitPullRequest, href: '/github' },
  { label: 'Contest Analysis', icon: Trophy, href: '/contest' },
  { label: 'AI Coach', icon: Bot, href: '/coach' },
  { label: 'Friends & Leaderboard', icon: Users, href: '/friends' },
];

export const Sidebar = ({ className }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'relative flex flex-col h-full border-r border-white/5 bg-[#0b0f19]/90 backdrop-blur-xl',
        className
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#111827] text-dark-textMuted hover:text-white shadow-md transition-colors"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <div className="flex h-16 items-center px-6 border-b border-white/5">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-cyan-500 shadow-lg shadow-primary-500/30">
            <span className="text-lg font-bold text-white">T</span>
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-xl font-bold tracking-tight text-white whitespace-nowrap"
            >
              TrackCode
            </motion.span>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'relative flex items-center space-x-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all group overflow-hidden',
                isActive
                  ? 'text-white'
                  : 'text-dark-textMuted hover:text-white hover:bg-white/5'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeNavBackground"
                    className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-indigo-500/10 border-l-2 border-primary-500"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <item.icon className={cn('h-5 w-5 shrink-0 transition-transform group-hover:scale-110', isActive ? 'text-primary-400' : 'text-dark-textMuted')} />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative z-10 whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
      
      {/* Bottom Section */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'relative flex items-center space-x-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all group overflow-hidden',
              isActive
                ? 'text-white'
                : 'text-dark-textMuted hover:text-white hover:bg-white/5'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="activeNavBackground"
                  className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-indigo-500/10 border-l-2 border-primary-500"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Settings className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 whitespace-nowrap">
                  Settings
                </motion.span>
              )}
            </>
          )}
        </NavLink>

        {/* User Card */}
        <div className={cn("flex items-center justify-between rounded-xl bg-slate-900/60 p-2 border border-white/5", isCollapsed ? "justify-center" : "")}>
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="relative shrink-0">
              <img 
                src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} 
                alt="Profile" 
                className="h-8 w-8 rounded-lg border border-white/10 bg-slate-800"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-[#0b0f19] animate-pulse" />
            </div>
            {!isCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col text-left overflow-hidden">
                <span className="text-xs font-semibold text-white truncate leading-none">{user?.name || 'Developer'}</span>
                <span className="text-[10px] text-dark-textMuted truncate">{user?.email || 'demo@trackcode.com'}</span>
              </motion.div>
            )}
          </div>
          {!isCollapsed && (
            <button 
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-dark-textMuted hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
};
