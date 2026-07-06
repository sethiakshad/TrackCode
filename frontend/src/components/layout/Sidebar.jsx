import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart2, GitPullRequest, Trophy, Bot, Users, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Analytics', icon: BarChart2, href: '/analytics' },
  { label: 'GitHub Insights', icon: GitPullRequest, href: '/github' },
  { label: 'Contest Analysis', icon: Trophy, href: '/contest' },
  { label: 'AI Coach', icon: Bot, href: '/coach' },
  { label: 'Friends & Leaderboard', icon: Users, href: '/friends' },
];

export const Sidebar = ({ className }) => {
  return (
    <aside className={cn('flex flex-col w-64 border-r border-dark-border bg-dark-bg', className)}>
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-cyan-500 shadow-sm shadow-primary-500/30">
            <span className="text-lg font-bold text-white">T</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">TrackCode</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.href}
            className={({ isActive }) =>
              cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-500/10 text-primary-400'
                  : 'text-dark-textMuted hover:bg-dark-surface hover:text-white'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
      
      <div className="p-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-500/10 text-primary-400'
                : 'text-dark-textMuted hover:bg-dark-surface hover:text-white'
            )
          }
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};
