import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Shimmer } from '../../components/ui/Shimmer';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

const masteryData = [
  { subject: 'Arrays', A: 120, fullMark: 150 },
  { subject: 'Strings', A: 98, fullMark: 150 },
  { subject: 'DP', A: 86, fullMark: 150 },
  { subject: 'Graphs', A: 65, fullMark: 150 },
  { subject: 'Trees', A: 85, fullMark: 150 },
  { subject: 'Math', A: 45, fullMark: 150 },
];

const difficultyData = [
  { name: 'Easy', count: 156, fill: '#10b981' },
  { name: 'Medium', count: 124, fill: '#f59e0b' },
  { name: 'Hard', count: 32, fill: '#ef4444' },
];

export const Analytics = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Analytics</h1>
        <p className="text-dark-textMuted">Deep dive into your coding performance and topic mastery.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Topic Mastery Radar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="h-full border-white/5 bg-dark-surface/50">
            <CardHeader>
              <CardTitle>Topic Mastery</CardTitle>
              <CardDescription>Your proficiency across different algorithm topics</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Shimmer className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={masteryData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Mastery" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Difficulty Distribution Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className="h-full border-white/5 bg-dark-surface/50">
            <CardHeader>
              <CardTitle>Difficulty Distribution</CardTitle>
              <CardDescription>Problems solved by difficulty level</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Shimmer className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={difficultyData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ fill: '#334155', opacity: 0.4 }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
