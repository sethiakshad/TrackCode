import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Shimmer } from '../../components/ui/Shimmer';
import { Button } from '../../components/ui/Button';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, Award, Zap, CheckCircle2, TrendingUp, Calendar, Filter, RefreshCw, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTopicMastery, getDifficultyDistribution, getAnalyticsOverview } from '../../lib/api/analyticsApi';
import apiClient from '../../lib/axios';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('monthly');
  
  const [masteryData, setMasteryData] = useState([]);
  const [difficultyData, setDifficultyData] = useState([]);
  const [overview, setOverview] = useState({ acceptanceRate: 0, contestsEntered: 0, totalSolved: 0, streak: 0, longestStreak: 0 });
  const [syncing, setSyncing] = useState(false);

  const loadData = async (triggerSync = false) => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const [mastery, difficulty, overviewStats] = await Promise.all([
        getTopicMastery(user.id),
        getDifficultyDistribution(user.id),
        getAnalyticsOverview(user.id)
      ]);
      
      setMasteryData(mastery.length ? mastery : []);
      setDifficultyData(difficulty.length ? difficulty : []);
      
      // Also get dashboard summary for streaks
      const dashRes = await apiClient.get('/dashboard/summary').catch(() => null);
      const dashData = dashRes?.data?.data || dashRes?.data || {};
      
      const combinedOverview = {
        ...overviewStats,
        streak: dashData.streak || overviewStats.currentStreak || 0,
        longestStreak: dashData.longest_streak || overviewStats.longestStreak || 0,
      };
      setOverview(combinedOverview);

      // Auto-sync in background if data looks empty/stale (no solved, no mastery data)
      if (!triggerSync && (combinedOverview.totalSolved === 0 || mastery.length === 0)) {
        apiClient.post('/leetcode/sync').then(() => {
          loadData(true); // reload after sync
        }).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, timeRange]);

  const handleSync = async () => {
    try {
      setSyncing(true);
      await apiClient.post('/leetcode/sync');
      await loadData(true);
    } catch (err) {
      console.error('Failed to sync LeetCode data:', err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Analytics Insights
          </h1>
          <p className="text-dark-textMuted text-sm mt-1">Deep dive into algorithm mastery, speed metrics, and platform performance.</p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-10 bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20 hover:text-indigo-300"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          <select 
            className="h-10 px-3 rounded-md border border-white/10 bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-dark-textMuted font-medium uppercase tracking-wider">Total Solved</span>
              <h3 className="text-2xl font-extrabold text-white">{overview.totalSolved}</h3>
              <p className="text-xs text-dark-textMuted">Across all connected platforms</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-dark-textMuted font-medium uppercase tracking-wider">Contests Entered</span>
              <h3 className="text-2xl font-extrabold text-white">{overview.contestsEntered}</h3>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400 border border-primary-500/20">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Streaks & Consistency */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-white/5 bg-gradient-to-br from-orange-500/10 to-red-500/5 backdrop-blur-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-orange-200/70 font-medium uppercase tracking-wider">Current Streak</span>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-extrabold text-orange-400">{overview.streak}</h3>
                <span className="text-sm text-orange-200/50 mb-1">days</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              <Flame className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-white/5 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 backdrop-blur-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-indigo-200/70 font-medium uppercase tracking-wider">Longest Streak</span>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-extrabold text-indigo-400">{overview.longestStreak}</h3>
                <span className="text-sm text-indigo-200/50 mb-1">days</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Calendar className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Topic Mastery - Radar + Problem Counts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Algorithm Topic Proficiency</CardTitle>
            <CardDescription>Problems solved per topic across connected platforms (LeetCode & Codeforces)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Shimmer className="h-[350px] w-full" />
            ) : masteryData.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-center">
                <p className="text-dark-textMuted text-sm">No topic data yet. Click <span className="text-indigo-400 font-semibold">Sync Now</span> to load your topic breakdown.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={masteryData}>
                      <PolarGrid stroke="rgba(255,255,255,0.06)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Problems Solved (normalized)" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const d = payload[0].payload;
                            return (
                              <div className="bg-slate-900/95 border border-white/10 px-3 py-2 rounded-xl shadow-xl text-sm">
                                <p className="font-bold text-white mb-1">{d.subject}</p>
                                <p className="text-indigo-400">Problems solved: <span className="font-bold">{d.solved}</span></p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Topic Breakdown Table */}
                <div className="flex flex-col justify-center space-y-2 pr-2">
                  {[...masteryData].sort((a, b) => b.solved - a.solved).map((topic) => (
                    <div key={topic.subject} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium truncate">{topic.subject}</span>
                        <span className="text-indigo-400 font-bold ml-2 shrink-0">{topic.solved} solved</span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                          style={{ width: `${topic.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
