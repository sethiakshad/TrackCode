import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Shimmer } from '../../components/ui/Shimmer';
import { Button } from '../../components/ui/Button';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { Award, Trophy, Zap, AlertTriangle, ArrowUpRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const contestHistory = [
  { name: 'Contest 390', rating: 1650, rank: 1205 },
  { name: 'Contest 391', rating: 1720, rank: 890 },
  { name: 'Contest 392', rating: 1705, rank: 1540 },
  { name: 'Contest 393', rating: 1795, rank: 450 },
  { name: 'Contest 394', rating: 1850, rank: 310 },
];

export const ContestAnalysis = () => {
  const [loading, setLoading] = useState(true);

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
            Contest Analysis
          </h1>
          <p className="text-dark-textMuted text-sm mt-1">Telemetry analytics for LeetCode weekly contests and Codeforces rounds.</p>
        </div>
      </div>

      {/* Top Cards Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Rating Prediction */}
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-24 bg-primary-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-md flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>Contest Rating Prediction</span>
            </CardTitle>
            <CardDescription>Predicted rating after last weekend contest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <h3 className="text-3xl font-extrabold text-white">1,898</h3>
              <span className="text-xs font-bold text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                +48 predicted
              </span>
            </div>
            <p className="text-[10px] text-dark-textMuted leading-relaxed">Based on your rank of 310 out of 18,500 active participants in Weekly Contest 394.</p>
          </CardContent>
        </Card>

        {/* Speed Chart / Metrics */}
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-md flex items-center space-x-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              <span>Solve Speed telemetry</span>
            </CardTitle>
            <CardDescription>Average solve times per problem difficulty</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-dark-textMuted font-medium">Easy Problems</span>
              <span className="font-semibold text-white">3 mins 40s</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
              <span className="text-dark-textMuted font-medium">Medium Problems</span>
              <span className="font-semibold text-white">12 mins 15s</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
              <span className="text-dark-textMuted font-medium">Hard Problems</span>
              <span className="font-semibold text-white">45 mins 10s</span>
            </div>
          </CardContent>
        </Card>

        {/* Accuracy and Penalties */}
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-md flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Submissions Accuracy</span>
            </CardTitle>
            <CardDescription>Error & WA metrics in active contest time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-dark-textMuted font-medium">First-try Solve Rate</span>
              <span className="font-semibold text-emerald-400">82.5%</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
              <span className="text-dark-textMuted font-medium">Time Limit Exceeded (TLE)</span>
              <span className="font-semibold text-red-400">1 submission</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
              <span className="text-dark-textMuted font-medium">Wrong Answer penalties</span>
              <span className="font-semibold text-amber-400">2 submissions</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Line graph */}
      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Rating History & Trends</CardTitle>
          <CardDescription>Official rating progression from the last 5 contested events</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Shimmer className="h-[300px] w-full" />
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={contestHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 100', 'dataMax + 100']} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Line type="monotone" dataKey="rating" stroke="#6366f1" strokeWidth={3} dot={{ stroke: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contest Timeline */}
      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Recent Contest Timeline</CardTitle>
          <CardDescription>Recent performance stats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { title: 'Weekly Contest 394', rank: '#310', ratingChange: '+55 Rating', date: 'Jul 04, 2026' },
            { title: 'Biweekly Contest 131', rank: '#1,245', ratingChange: '-15 Rating', date: 'Jun 28, 2026' },
            { title: 'Weekly Contest 393', rank: '#450', ratingChange: '+42 Rating', date: 'Jun 21, 2026' },
          ].map((c, index) => (
            <div key={index} className="flex items-center justify-between bg-slate-950/40 p-3.5 rounded-lg border border-white/5">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-white">{c.title}</p>
                <p className="text-[10px] text-dark-textMuted">{c.date} • Rank: {c.rank}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${c.ratingChange.startsWith('+') ? 'text-emerald-400 bg-emerald-950/30' : 'text-red-400 bg-red-950/30'}`}>
                {c.ratingChange}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
