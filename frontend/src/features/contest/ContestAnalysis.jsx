import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Shimmer } from '../../components/ui/Shimmer';
import { Button } from '../../components/ui/Button';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, ReferenceDot } from 'recharts';
import { Award, Trophy, Zap, AlertTriangle, ArrowUpRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getContestHistory, getRatingHistory, getContestPredictions } from '../../lib/api/contestApi';

export const ContestAnalysis = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [history, setHistory] = useState([]);
  const [ratingGraph, setRatingGraph] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('All');

  useEffect(() => {
    if (!user?.id) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [hist, graph, preds] = await Promise.all([
          getContestHistory(user.id),
          getRatingHistory(user.id),
          getContestPredictions(user.id)
        ]);
        
        console.log('Contest Analysis Data:', { hist, graph, preds });
        
        setHistory(Array.isArray(hist) ? hist : hist?.data || []);
        setRatingGraph(Array.isArray(graph) ? graph : graph?.ratingTrend || graph?.data?.ratingTrend || []);
        setPredictions(Array.isArray(preds) ? preds : preds?.data || []);
      } catch (err) {
        console.error("Failed to load contest data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const latestPrediction = predictions.length > 0 ? predictions[0] : null;

  const chartData = selectedPlatform === 'All' ? ratingGraph : ratingGraph.filter(d => d.platform === selectedPlatform);
  let maxRatingPoint = null;
  if (chartData.length > 0) {
    maxRatingPoint = chartData.reduce((prev, current) => (prev.rating > current.rating) ? prev : current);
  }

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
            <CardDescription>Predicted rating after last contest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {latestPrediction ? (
              <>
                <div className="flex items-baseline space-x-2">
                  <h3 className="text-3xl font-extrabold text-white">{latestPrediction.predicted_rating}</h3>
                  <span className="text-xs font-bold text-emerald-400 flex items-center">
                    <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                    Confidence: {latestPrediction.confidence}%
                  </span>
                </div>
                <p className="text-[10px] text-dark-textMuted leading-relaxed">
                  Based on recent performance. Predicted Rank: {latestPrediction.predicted_rank}
                </p>
              </>
            ) : (
              <p className="text-xs text-dark-textMuted">No predictions available yet.</p>
            )}
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Rating History & Trends</CardTitle>
            <CardDescription>Official rating progression from contested events</CardDescription>
          </div>
          {ratingGraph.length > 0 && (
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="bg-slate-950 border border-white/10 text-white text-xs rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="All">All Platforms</option>
              {[...new Set(ratingGraph.map(item => item.platform))].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Shimmer className="h-[300px] w-full" />
          ) : ratingGraph.length === 0 ? (
            <div className="h-[300px] w-full flex items-center justify-center text-dark-textMuted text-sm">
              No rating history found.
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData} 
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={['dataMin - 50', 'dataMax + 50']} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900/95 border border-white/10 px-3 py-2 rounded-xl shadow-xl text-sm">
                            <p className="font-bold text-white mb-1">{data.contestName}</p>
                            <p className="text-dark-textMuted text-xs mb-2">{label}</p>
                            <p className="text-indigo-400">Rating: <span className="font-bold">{data.rating}</span></p>
                            {data.ratingChange !== 0 && (
                              <p className={data.ratingChange > 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {data.ratingChange > 0 ? '+' : ''}{data.ratingChange}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="rating" stroke="#6366f1" strokeWidth={3} dot={{ stroke: '#6366f1', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                  {maxRatingPoint && (
                    <ReferenceDot 
                      x={maxRatingPoint.date} 
                      y={maxRatingPoint.rating} 
                      r={6} 
                      fill="#f59e0b" 
                      stroke="#fff" 
                      strokeWidth={2} 
                      label={{ position: 'top', value: 'Highest', fill: '#f59e0b', fontSize: 12, fontWeight: 'bold' }} 
                    />
                  )}
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
          {history.length === 0 ? (
            <p className="text-xs text-dark-textMuted">No recent contests found.</p>
          ) : (
            history.map((c) => {
              const ratingChange = (c.new_rating !== null && c.old_rating !== null) ? (c.new_rating - c.old_rating) : null;
              return (
              <div key={c.id} className="flex items-center justify-between bg-slate-950/40 p-3.5 rounded-lg border border-white/5">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-white">{c.contests?.name || 'Unknown Contest'} <span className="text-[10px] text-dark-textMuted font-normal ml-2">({c.contests?.platform || 'Unknown'})</span></p>
                  <p className="text-[10px] text-dark-textMuted">
                    {new Date(c.date).toLocaleDateString()} • Rank: {c.rank ? `#${c.rank.toLocaleString()}` : 'N/A'} • Solved: {c.solved}
                  </p>
                </div>
                {ratingChange !== null && (
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${ratingChange > 0 ? 'text-emerald-400 bg-emerald-950/30' : 'text-red-400 bg-red-950/30'}`}>
                    {ratingChange > 0 ? '+' : ''}{ratingChange} Rating
                  </span>
                )}
              </div>
            )})
          )}
        </CardContent>
      </Card>
    </div>
  );
};
