import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Shimmer } from '../../components/ui/Shimmer';
import { Trophy, Flame, Code2, GitCommit, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardStats, activityData, upcomingContests, chartData } from './mockData';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, colorClass, delay = 0, loading = false }) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card hoverEffect className="border-white/5 bg-dark-surface/50">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-dark-textMuted">{title}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-dark-textMuted">Here's what's happening with your coding journey today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Problems Solved" 
          value={dashboardStats.problemsSolved} 
          icon={Code2} 
          colorClass="bg-gradient-to-br from-primary-500 to-indigo-600 shadow-lg shadow-primary-500/20"
          delay={0.1}
          loading={loading}
        />
        <StatCard 
          title="Coding Streak" 
          value={`${dashboardStats.codingStreak} Days`} 
          icon={Flame} 
          colorClass="bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/20"
          delay={0.2}
          loading={loading}
        />
        <StatCard 
          title="GitHub Commits" 
          value={dashboardStats.githubContributions} 
          icon={GitCommit} 
          colorClass="bg-gradient-to-br from-gray-700 to-gray-900 shadow-lg shadow-gray-700/20"
          delay={0.3}
          loading={loading}
        />
        <StatCard 
          title="Contest Rating" 
          value={dashboardStats.contestRating} 
          icon={Trophy} 
          colorClass="bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/20"
          delay={0.4}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Main Chart */}
        <Card className="col-span-1 lg:col-span-2 border-white/5 bg-dark-surface/50">
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Your coding activity over the past 7 days</CardDescription>
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
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="solved" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSolved)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-white/5 bg-dark-surface/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center space-x-4">
                    <Shimmer className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Shimmer className="h-4 w-full" />
                      <Shimmer className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {activityData.map((activity, index) => (
                  <motion.div 
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (index * 0.1) }}
                    className="flex items-start space-x-4"
                  >
                    <div className={`mt-0.5 rounded-full p-2 ${
                      activity.type === 'solve' ? 'bg-primary-500/10 text-primary-400' :
                      activity.type === 'commit' ? 'bg-gray-500/10 text-gray-400' :
                      'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {activity.type === 'solve' ? <Code2 className="h-4 w-4" /> :
                       activity.type === 'commit' ? <GitCommit className="h-4 w-4" /> :
                       <Activity className="h-4 w-4" />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none text-white">{activity.title}</p>
                      <p className="text-xs text-dark-textMuted">
                        {activity.platform || activity.repo} • {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
