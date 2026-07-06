import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const Navbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-dark-border bg-dark-bg/80 px-6 backdrop-blur-md">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-dark-textMuted hover:text-white focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="hidden md:block w-64 lg:w-96">
          <Input 
            type="search" 
            placeholder="Search users, repos, or contests..." 
            icon={<Search className="h-4 w-4" />}
            className="h-9 bg-dark-surface/50 border-white/5 focus:bg-dark-bg"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="relative text-dark-textMuted hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-dark-bg" />
        </Button>
        
        <div className="h-8 w-px bg-dark-border mx-2" />
        
        <button className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg">
          <img 
            src={user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} 
            alt="Profile" 
            className="h-8 w-8 rounded-full border border-dark-border bg-dark-surface"
          />
        </button>
      </div>
    </header>
  );
};
