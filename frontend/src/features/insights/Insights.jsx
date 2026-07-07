
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Shimmer } from '../../components/ui/Shimmer';
import { Button } from '../../components/ui/Button';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, Award, Zap, CheckCircle2, TrendingUp, Calendar, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const masteryData = [
  { subject: 'Arrays & Hashing', A: 120, fullMark: 150 },
  { subject: 'Strings', A: 98, fullMark: 150 },
  { subject: 'DP', A: 86, fullMark: 150 },
  { subject: 'Graphs & Trees', A: 75, fullMark: 150 },
  { subject: 'Sliding Window', A: 110, fullMark: 150 },
  { subject: 'Math & Bitwise', A: 55, fullMark: 150 },
];

const difficultyData = [
  { name: 'Easy', count: 156, fill: '#10b981' },
  { name: 'Medium', count: 124, fill: '#f59e0b' },
  { name: 'Hard', count: 32, fill: '#ef4444' },
];

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('monthly');

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoading(false);
    };
    loadData();
  }, []);

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
          <Button variant="outline" size="sm" className="h-10">
            <Filter className="h-4 w-4 mr-2" />
            Time range: {timeRange === 'monthly' ? 'This Month' : 'This Year'}
          </Button>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-dark-textMuted font-medium uppercase tracking-wider">Acceptance Rate</span>
              <h3 className="text-2xl font-extrabold text-white">74.2%</h3>
              <p className="text-[10px] text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                +2.4% vs last month
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-dark-textMuted font-medium uppercase tracking-wider">Avg Solving Speed</span>
              <h3 className="text-2xl font-extrabold text-white">22 mins</h3>
              <p className="text-[10px] text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                -3 mins solved faster
              </p>
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
              <h3 className="text-2xl font-extrabold text-white">12</h3>
              <p className="text-[10px] text-primary-400 flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                Top 5.2% rank bracket
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400 border border-primary-500/20">
              <Award className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Topic Mastery Radar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="h-full border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Algorithm Topic Proficiency</CardTitle>
              <CardDescription>Your mastery score across primary software engineering pillars</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Shimmer className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={masteryData}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Mastery Level" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Difficulty Distribution Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className="h-full border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Difficulty Breakdown</CardTitle>
              <CardDescription>Visual distribution of solved algorithmic problems</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Shimmer className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full flex flex-col justify-center">
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={difficultyData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                        {difficultyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex justify-around text-xs mt-2 text-dark-textMuted pt-4 border-t border-white/5">
                    <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-2" /> Easy (156)</span>
                    <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2" /> Medium (124)</span>
                    <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2" /> Hard (32)</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
