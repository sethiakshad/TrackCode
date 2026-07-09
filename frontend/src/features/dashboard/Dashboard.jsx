import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Shimmer } from '../../components/ui/Shimmer';
import { Button } from '../../components/ui/Button';
import { Trophy, Flame, Code2, GitCommit, Activity, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar, Target, Brain, ShieldAlert, Award, Star, Plus, Play, Sparkles, Unlink } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardStats, activityData, upcomingContests, chartData } from './mockData';
import { motion } from 'framer-motion';
import { useLeetCode } from '../../context/LeetCodeContext';
import { useGitHub } from '../../context/GitHubContext';
import { ConnectLeetCodeModal } from '../../components/ui/ConnectLeetCodeModal';
import { ConnectGitHubModal } from '../../components/ui/ConnectGitHubModal';

const Github = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// Count-up helper hook
const useAnimatedCounter = (targetValue, duration = 1000, startTrigger = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startTrigger) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * targetValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [targetValue, duration, startTrigger]);

  return count;
};

const StatCard = ({ title, value, numericValue, trend, icon: Icon, colorClass, delay = 0, loading = false }) => {
  const animatedValue = useAnimatedCounter(numericValue || 0, 1200, !loading);

  if (loading) {
    return (
      <Card className="border-white/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Shimmer className="h-4 w-24" />
              <Shimmer className="h-8 w-16" />
            </div>
            <Shimmer className="h-12 w-12 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = trend && trend.startsWith('+');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card hoverEffect className="relative overflow-hidden border-white/5 bg-slate-900/40 backdrop-blur-xl">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-dark-textMuted">{title}</p>
            <div className="flex items-baseline space-x-2">
              <h3 className="text-3xl font-extrabold text-white tracking-tight">
                {numericValue ? animatedValue.toLocaleString() : value}
                {title.toLowerCase().includes('streak') ? ' Days' : ''}
              </h3>
              {trend && (
                <span className={`inline-flex items-center text-xs font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> : <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />}
                  {trend}
                </span>
              )}
            </div>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const Dashboard = () => {
  const { user } = useAuth();
  const { profile: lcProfile, isConnected: isConnectedLeetCode, connectLeetCode, disconnect: disconnectLeetCode, refreshProfile: refreshLC } = useLeetCode();
  const { profile: ghProfile, isConnected: isConnectedGitHub, connectGitHub, disconnect: disconnectGitHub, refreshProfile: refreshGH } = useGitHub();
  const [loading, setLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState('7d');
  const [showLCModal, setShowLCModal] = useState(false);
  const [showGHModal, setShowGHModal] = useState(false);
  const [dailyGoal, setDailyGoal] = useState({ solved: 3, target: 5 });

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoading(false);
    };
    loadData();
  }, []);

  // Simple calendar generator for Heatmap Preview
  const heatmapDays = Array.from({ length: 28 }, (_, i) => {
    const values = [0, 1, 2, 4, 0, 8, 3, 5, 0, 2, 0, 1, 6, 0, 0, 2, 4, 3, 0, 1, 5, 0, 0, 2, 0, 1, 4, 3];
    return { day: i + 1, level: values[i % values.length] };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Welcome back, {user?.name || 'Developer'}
          </h1>
          <p className="text-dark-textMuted text-sm mt-1">Here is your developer metrics and roadmap progress update for today.</p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isConnectedLeetCode) refreshLC();
              if (isConnectedGitHub) refreshGH();
            }}
            className="h-10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Profiles
          </Button>
          {isConnectedLeetCode && (
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectLeetCode}
              className="h-10 text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
            >
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect LeetCode
            </Button>
          )}
          {isConnectedGitHub && (
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectGitHub}
              className="h-10 text-red-400 border-red-500/20 hover:bg-red-500/10 hover:text-red-300"
            >
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect GitHub
            </Button>
          )}
          <Button size="sm" className="h-10">
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Connection CTAs Alert banner */}
      {(!isConnectedGitHub || !isConnectedLeetCode) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 backdrop-blur-xl"
        >
          <div className="flex items-center space-x-3">
            <ShieldAlert className="h-5 w-5 text-yellow-500 shrink-0" />
            <div className="text-left">
              <h4 className="text-sm font-semibold text-white">Accounts Disconnected</h4>
              <p className="text-xs text-dark-textMuted">Connect LeetCode and GitHub to enable auto data synchronization and streaks tracking.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 w-full md:w-auto justify-end">
            {!isConnectedLeetCode && (
              <Button size="sm" variant="outline" onClick={() => setShowLCModal(true)} className="h-8 text-xs border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10">
                Connect LeetCode
              </Button>
            )}
            {!isConnectedGitHub && (
              <Button size="sm" onClick={() => setShowGHModal(true)} className="h-8 text-xs bg-white text-slate-950 hover:bg-slate-200">
                <Github className="h-3.5 w-3.5 mr-1" />
                Connect GitHub
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Problems Solved" 
          value={isConnectedLeetCode ? lcProfile.problems_solved.toLocaleString() : '—'} 
          numericValue={isConnectedLeetCode ? lcProfile.problems_solved : 0}
          trend={isConnectedLeetCode ? `E:${lcProfile.easy} M:${lcProfile.medium} H:${lcProfile.hard}` : 'Connect LeetCode'}
          icon={Code2} 
          colorClass="bg-gradient-to-br from-primary-500 to-indigo-600 shadow-lg shadow-primary-500/20"
          delay={0.05}
          loading={loading}
        />
        <StatCard 
          title="Coding Streak" 
          value="42" 
          numericValue={42}
          trend="+3 days streak"
          icon={Flame} 
          colorClass="bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20"
          delay={0.1}
          loading={loading}
        />
        <StatCard 
          title="GitHub Commits" 
          value={isConnectedGitHub ? ghProfile.total_commits.toLocaleString() : '—'} 
          numericValue={isConnectedGitHub ? ghProfile.total_commits : 0}
          trend={isConnectedGitHub ? `${ghProfile.public_repos} repos · ${ghProfile.total_stars} stars` : 'Connect GitHub'}
          icon={GitCommit} 
          colorClass="bg-gradient-to-br from-slate-700 to-slate-900 shadow-lg shadow-slate-700/20"
          delay={0.15}
          loading={loading}
        />
        <StatCard 
          title="Contest Rating" 
          value={isConnectedLeetCode && lcProfile.contest_rating ? lcProfile.contest_rating.toLocaleString() : '—'} 
          numericValue={isConnectedLeetCode ? (lcProfile.contest_rating || 0) : 0}
          trend={isConnectedLeetCode && lcProfile.ranking ? `Rank #${lcProfile.ranking.toLocaleString()}` : 'Connect LeetCode'}
          icon={Trophy} 
          colorClass="bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/20"
          delay={0.2}
          loading={loading}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Chart */}
          <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Activity Analysis</CardTitle>
                <CardDescription>Your problems solved & commit frequency over time</CardDescription>
              </div>
              <div className="flex border border-white/10 rounded-lg p-1 bg-slate-950/80">
                {['7d', '30d', '3m', '1y'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setChartFilter(f)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      chartFilter === f ? 'bg-primary-600 text-white shadow' : 'text-dark-textMuted hover:text-white'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Shimmer className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="solved" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSolved)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Heatmap Preview Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Quick Actions */}
            <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-md">Quick Actions</CardTitle>
                <CardDescription>Shortcut workflows to stay on top of daily goals</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-14 flex flex-col items-center justify-center text-xs space-y-1 hover:border-primary-500/30">
                  <Play className="h-4 w-4 text-emerald-400" />
                  <span>Start Coding</span>
                </Button>
                <Button variant="outline" className="h-14 flex flex-col items-center justify-center text-xs space-y-1 hover:border-primary-500/30">
                  <Brain className="h-4 w-4 text-primary-400" />
                  <span>Ask AI Coach</span>
                </Button>
                <Button variant="outline" className="h-14 flex flex-col items-center justify-center text-xs space-y-1 hover:border-primary-500/30">
                  <Trophy className="h-4 w-4 text-cyan-400" />
                  <span>Join Contest</span>
                </Button>
                <Button variant="outline" className="h-14 flex flex-col items-center justify-center text-xs space-y-1 hover:border-primary-500/30">
                  <Calendar className="h-4 w-4 text-orange-400" />
                  <span>Custom Schedule</span>
                </Button>
              </CardContent>
            </Card>

            {/* Heatmap Preview Widget */}
            <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Activity Heatmap</CardTitle>
                <CardDescription>Visual preview of streak intensity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1.5 pt-2">
                  {heatmapDays.map((d) => (
                    <div
                      key={d.day}
                      title={`Day ${d.day}: ${d.level} submissions`}
                      className={`aspect-square w-full rounded-sm transition-all hover:scale-110 ${
                        d.level === 0 ? 'bg-slate-800' :
                        d.level < 3 ? 'bg-indigo-900/50 border border-indigo-500/20' :
                        d.level < 6 ? 'bg-indigo-600' :
                        'bg-indigo-400'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] text-dark-textMuted mt-4">
                  <span>Less active</span>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 bg-slate-800 rounded-sm" />
                    <span className="w-2.5 h-2.5 bg-indigo-900/50 rounded-sm" />
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-sm" />
                    <span className="w-2.5 h-2.5 bg-indigo-400 rounded-sm" />
                  </div>
                  <span>More active</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right 1 Column */}
        <div className="space-y-6">
          {/* Daily Goal & Weekly Progress Ring */}
          <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Goals & Weekly Progress</CardTitle>
              <CardDescription>Track daily consistency limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <Target className="h-4 w-4 text-primary-400" />
                    <span className="text-sm font-semibold text-white">Daily Target</span>
                  </div>
                  <p className="text-xs text-dark-textMuted">Solve 5 problems a day</p>
                </div>
                <span className="text-sm font-bold text-white bg-slate-800 px-2 py-1 rounded-lg">
                  {dailyGoal.solved} / {dailyGoal.target}
                </span>
              </div>
              
              {/* Daily ProgressBar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${(dailyGoal.solved / dailyGoal.target) * 100}%` }}
                  className="bg-gradient-to-r from-primary-500 to-indigo-500 h-full rounded-full" 
                />
              </div>

              {/* Progress Ring Simulation */}
              <div className="flex items-center space-x-4 pt-4 border-t border-white/5">
                <div className="relative flex items-center justify-center shrink-0">
                  <svg className="h-16 w-16 transform -rotate-90">
                    <circle cx="32" cy="32" r="28" className="stroke-slate-800 fill-none" strokeWidth="6" />
                    <motion.circle 
                      cx="32" cy="32" r="28" 
                      className="stroke-primary-500 fill-none" 
                      strokeWidth="6"
                      strokeDasharray={176}
                      initial={{ strokeDashoffset: 176 }}
                      animate={{ strokeDashoffset: 176 - (176 * 0.85) }}
                    />
                  </svg>
                  <span className="absolute text-xs font-bold text-white">85%</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Weekly Success Score</h4>
                  <p className="text-[11px] text-dark-textMuted mt-0.5">You are doing better than 88% of developers in your bracket this week.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Insights summary card */}
          <Card className="border-white/5 bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-cyan-950/20 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                <span>AI Productivity Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-left">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
                <p className="font-semibold text-white">🔥 Consistency Boost</p>
                <p className="text-dark-textMuted">You commit most frequently around 8 PM. Coding in this window leads to 25% higher acceptance rate.</p>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-white/5 space-y-1">
                <p className="font-semibold text-white">💡 Weak Topic Spotlight</p>
                <p className="text-dark-textMuted">Topic 'Dynamic Programming' has 45% lower success. We recommend practice on medium dp array problems.</p>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Contest & Recent Achievements */}
          <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-md flex items-center justify-between">
                <span>Upcoming Events</span>
                <span className="text-[10px] text-primary-400 border border-primary-500/20 bg-primary-500/10 px-1.5 py-0.5 rounded-full">New</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingContests.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-lg border border-white/5">
                  <div className="space-y-0.5 text-left">
                    <p className="text-xs font-semibold text-white truncate max-w-[150px]">{c.name}</p>
                    <p className="text-[10px] text-dark-textMuted">{c.platform} • {c.participants.toLocaleString()} joined</p>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/30 border border-cyan-500/20 px-2 py-1 rounded-md shrink-0">
                    {c.time}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top Weak Topics */}
          <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-md">Top Weak Topics</CardTitle>
              <CardDescription>Topics needing review based on submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-left">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white">Dynamic Programming</span>
                  <span className="text-red-400">45% mastery</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
              <div className="space-y-1 text-left">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white">Graphs (DFS/BFS)</span>
                  <span className="text-yellow-400">62% mastery</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '62%' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
