import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Shimmer } from '../../components/ui/Shimmer';
import { Button } from '../../components/ui/Button';
import { Trophy, ShieldAlert, ArrowUpRight, Flame, Code2, MessageSquare, Play, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const leaderboardUsers = [
  { rank: 1, name: 'Siddharth Nair', solved: 785, streak: 120, rating: 2150, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sid' },
  { rank: 2, name: 'Aditi Sharma', solved: 642, streak: 85, rating: 1980, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aditi' },
  { rank: 3, name: 'Rohan Gupta', solved: 590, streak: 64, rating: 1910, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan' },
  { rank: 4, name: 'Akshad Sethi', solved: 312, streak: 42, rating: 1850, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback' },
  { rank: 5, name: 'Priya Iyer', solved: 295, streak: 18, rating: 1680, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya' },
];

export const FriendsLeaderboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('weekly');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Friends & Leaderboard
          </h1>
          <p className="text-dark-textMuted text-sm mt-1">Compare solved problems, contest ratings, and challenge friends to coding duels.</p>
        </div>
        <div className="flex border border-white/10 rounded-lg p-1 bg-slate-950/80 shrink-0">
          {['weekly', 'monthly', 'alltime'].map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === t ? 'bg-primary-600 text-white shadow' : 'text-dark-textMuted hover:text-white'
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Podium for Top 3 */}
      {loading ? (
        <Shimmer className="h-64 w-full" />
      ) : (
        <div className="grid gap-6 md:grid-cols-3 items-end pt-8 pb-4">
          {/* 2nd Place */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
            <div className="relative mb-2">
              <img src={leaderboardUsers[1].avatar} className="h-16 w-16 rounded-full border-2 border-slate-500 bg-slate-900" alt="" />
              <span className="absolute -top-2 -right-2 bg-slate-500 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center border border-[#030712]">2</span>
            </div>
            <div className="bg-slate-900/50 border border-white/5 rounded-t-xl p-5 w-full text-center h-36 flex flex-col justify-center space-y-1">
              <h4 className="text-xs font-bold text-white truncate">{leaderboardUsers[1].name}</h4>
              <p className="text-[10px] text-dark-textMuted">{leaderboardUsers[1].solved} solved</p>
              <p className="text-xs font-semibold text-primary-400">{leaderboardUsers[1].rating} rating</p>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="flex flex-col items-center">
            <div className="relative mb-2 scale-110">
              <img src={leaderboardUsers[0].avatar} className="h-20 w-20 rounded-full border-2 border-amber-500 bg-slate-900" alt="" />
              <Trophy className="absolute -top-3 right-0 h-6 w-6 text-amber-500 fill-current" />
              <span className="absolute -top-2 -left-2 bg-amber-500 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center border border-[#030712]">1</span>
            </div>
            <div className="bg-gradient-to-t from-primary-950/20 via-slate-900/60 to-amber-950/10 border border-amber-500/20 rounded-t-2xl p-6 w-full text-center h-44 flex flex-col justify-center space-y-1 shadow-[0_-10px_20px_rgba(245,158,11,0.05)]">
              <h4 className="text-sm font-bold text-white truncate">{leaderboardUsers[0].name}</h4>
              <p className="text-xs text-dark-textMuted">{leaderboardUsers[0].solved} solved</p>
              <p className="text-sm font-bold text-amber-400">{leaderboardUsers[0].rating} rating</p>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
            <div className="relative mb-2">
              <img src={leaderboardUsers[2].avatar} className="h-16 w-16 rounded-full border-2 border-amber-800 bg-slate-900" alt="" />
              <span className="absolute -top-2 -right-2 bg-amber-800 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center border border-[#030712]">3</span>
            </div>
            <div className="bg-slate-900/50 border border-white/5 rounded-t-xl p-5 w-full text-center h-32 flex flex-col justify-center space-y-1">
              <h4 className="text-xs font-bold text-white truncate">{leaderboardUsers[2].name}</h4>
              <p className="text-[10px] text-dark-textMuted">{leaderboardUsers[2].solved} solved</p>
              <p className="text-xs font-semibold text-primary-400">{leaderboardUsers[2].rating} rating</p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Leaderboard Table / Cards */}
      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Leaderboard Standings</CardTitle>
          <CardDescription>Standings of all connected peers in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Shimmer key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2.5">
              {leaderboardUsers.map((u) => (
                <div key={u.rank} className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-white/5 rounded-xl transition-all hover:border-white/10">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-bold text-dark-textMuted w-4">{u.rank}</span>
                    <img src={u.avatar} className="h-9 w-9 rounded-lg bg-slate-800 border border-white/5" alt="" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">{u.name}</p>
                      <p className="text-[10px] text-dark-textMuted">Streak: {u.streak} days</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-right">
                    <div>
                      <p className="text-xs font-bold text-white">{u.solved} Solved</p>
                      <p className="text-[10px] text-primary-400 font-semibold">{u.rating} rating</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-semibold border-white/10 hover:bg-white/5">
                      Challenge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
