import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Shimmer } from '../../components/ui/Shimmer';
import { Button } from '../../components/ui/Button';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { GitBranch, GitCommit, GitPullRequest, Eye, Heart, Sparkles, Flame, CheckCircle, RefreshCw, ShieldAlert, Unlink, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGitHub } from '../../context/GitHubContext';
import { ConnectGitHubModal } from '../../components/ui/ConnectGitHubModal';

const languagesData = [
  { name: 'JavaScript', value: 45, color: '#f7df1e' },
  { name: 'Python', value: 25, color: '#3776ab' },
  { name: 'Rust', value: 15, color: '#dea584' },
  { name: 'TypeScript', value: 15, color: '#3178c6' },
];

const commitFreqData = [
  { week: 'W1', commits: 24 },
  { week: 'W2', commits: 38 },
  { week: 'W3', commits: 15 },
  { week: 'W4', commits: 42 },
];

const repoCards = [
  { name: 'TrackCode', desc: 'Real-time dev productivity portal console.', stars: 120, forks: 15, lang: 'TypeScript' },
  { name: 'algos-practice', desc: 'Curated solution sets for Leetcode and Codeforces.', stars: 45, forks: 8, lang: 'Python' },
];

export const GitHubInsights = () => {
  const { profile: ghProfile, isConnected: isConnectedGitHub, connectGitHub, disconnect: disconnectGitHub, refreshProfile, isLoading } = useGitHub();
  const [loading, setLoading] = useState(true);
  const [showGHModal, setShowGHModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Generate mock GitHub calendar contribution days
  const calendarWeeks = Array.from({ length: 52 }, (_, weekIndex) => {
    return Array.from({ length: 7 }, (_, dayIndex) => {
      const level = Math.floor(Math.random() * 4); // 0 = none, 1 = low, 2 = med, 3 = high
      return { level };
    });
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            GitHub Insights
          </h1>
          <p className="text-dark-textMuted text-sm mt-1">Deep analysis of commits frequency, repository health, and language breakdown.</p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-10"
            onClick={() => { if (isConnectedGitHub) refreshProfile(); }}
            disabled={!isConnectedGitHub || isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Stats
          </Button>
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
        </div>
      </div>

      {!isConnectedGitHub && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 backdrop-blur-xl"
        >
          <div className="flex items-center space-x-3">
            <ShieldAlert className="h-5 w-5 text-yellow-500 shrink-0" />
            <div className="text-left">
              <h4 className="text-sm font-semibold text-white">GitHub Not Connected</h4>
              <p className="text-xs text-dark-textMuted">Connect your GitHub account to sync repos, stars, and commit activity.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowGHModal(true)} className="h-8 text-xs shrink-0">
            <Link2 className="h-3.5 w-3.5 mr-1" />
            Connect GitHub
          </Button>
        </motion.div>
      )}

      {/* Stats Summary Panel */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-white/5 bg-slate-900/40 p-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-dark-textMuted">Public Repos</p>
              <h3 className="text-lg font-bold text-white">
                {isConnectedGitHub ? ghProfile.public_repos : '—'}
              </h3>
            </div>
          </div>
        </Card>
        <Card className="border-white/5 bg-slate-900/40 p-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-primary-500/10 text-primary-400">
              <GitCommit className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-dark-textMuted">Recent Commits</p>
              <h3 className="text-lg font-bold text-white">
                {isConnectedGitHub ? ghProfile.total_commits.toLocaleString() : '—'}
              </h3>
            </div>
          </div>
        </Card>
        <Card className="border-white/5 bg-slate-900/40 p-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-dark-textMuted">Total Stars</p>
              <h3 className="text-lg font-bold text-white">
                {isConnectedGitHub ? ghProfile.total_stars.toLocaleString() : '—'}
              </h3>
            </div>
          </div>
        </Card>
        <Card className="border-white/5 bg-slate-900/40 p-5">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-dark-textMuted">Followers</p>
              <h3 className="text-lg font-bold text-white">
                {isConnectedGitHub ? ghProfile.followers.toLocaleString() : '—'}
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Contribution Calendar Graph */}
      <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Contribution Calendar</CardTitle>
          <CardDescription>
            {isConnectedGitHub
              ? `Activity for @${ghProfile.username} — ${ghProfile.total_commits.toLocaleString()} recent commits tracked`
              : 'Connect GitHub to view your contribution activity'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Shimmer className="h-28 w-full" />
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="flex space-x-1 min-w-[640px]">
                {calendarWeeks.map((week, wIndex) => (
                  <div key={wIndex} className="flex flex-col space-y-1">
                    {week.map((day, dIndex) => (
                      <div
                        key={dIndex}
                        className={`w-3.5 h-3.5 rounded-sm transition-all hover:scale-125 ${
                          day.level === 0 ? 'bg-slate-800' :
                          day.level === 1 ? 'bg-emerald-950 border border-emerald-800/30' :
                          day.level === 2 ? 'bg-emerald-700' :
                          'bg-emerald-400'
                        }`}
                        title={`Week ${wIndex + 1}, Day ${dIndex + 1}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex justify-end items-center text-[10px] text-dark-textMuted mt-4 space-x-1.5">
                <span>Less</span>
                <span className="w-3 h-3 bg-slate-800 rounded-sm" />
                <span className="w-3 h-3 bg-emerald-950 rounded-sm" />
                <span className="w-3 h-3 bg-emerald-700 rounded-sm" />
                <span className="w-3 h-3 bg-emerald-400 rounded-sm" />
                <span>More</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Column Grid */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Language Usage & Commits graph */}
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Language Breakdown</CardTitle>
            <CardDescription>Primary technologies used across your repositories</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            {loading ? (
              <Shimmer className="h-full w-full" />
            ) : (
              <div className="flex items-center w-full justify-around">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={languagesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {languagesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5">
                  {languagesData.map((l) => (
                    <div key={l.name} className="flex items-center space-x-2 text-xs">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                      <span className="text-white font-semibold">{l.name}</span>
                      <span className="text-dark-textMuted">({l.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commit frequency */}
        <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Weekly Commit Frequency</CardTitle>
            <CardDescription>Activity status grouped by week</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            {loading ? (
              <Shimmer className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commitFreqData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="commits" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Repositories */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Active Repositories</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {repoCards.map((r, idx) => (
            <Card key={idx} className="border-white/5 bg-slate-900/40 backdrop-blur-xl hover:border-primary-500/20 transition-all p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-bold text-white hover:text-primary-400 cursor-pointer">{r.name}</h4>
                  <p className="text-xs text-dark-textMuted max-w-sm">{r.desc}</p>
                </div>
                <span className="text-[10px] font-semibold text-primary-400 bg-primary-500/10 border border-primary-500/20 px-2 py-0.5 rounded-full">
                  {r.lang}
                </span>
              </div>
              <div className="flex items-center space-x-4 mt-6 text-xs text-dark-textMuted pt-4 border-t border-white/5">
                <span className="flex items-center"><Heart className="h-4 w-4 mr-1 text-red-500 fill-current" /> {r.stars} Stars</span>
                <span className="flex items-center"><GitBranch className="h-4 w-4 mr-1 text-primary-400" /> {r.forks} Forks</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <ConnectGitHubModal
        isOpen={showGHModal}
        onClose={() => setShowGHModal(false)}
        onConfirm={connectGitHub}
      />
    </div>
  );
};
