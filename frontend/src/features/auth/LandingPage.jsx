import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { motion } from 'framer-motion';
import { Terminal, Shield, Cpu, Activity, Zap, Star, MessageSquare, ArrowRight, Award, CheckCircle } from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Unified Coding Stats',
      description: 'Aggregate your LeetCode metrics, Codeforces rating, and GitHub commits into a single real-time console.',
      icon: Activity,
      color: 'text-primary-400'
    },
    {
      title: 'AI Productivity Coach',
      description: 'Receive smart recommendations, weakness highlights, and personalized daily coding targets.',
      icon: Cpu,
      color: 'text-cyan-400'
    },
    {
      title: 'Interactive Contest Analysis',
      description: 'Predict rating shifts, track solve velocity, and review historical performance rankings.',
      icon: Award,
      color: 'text-amber-400'
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-10 border-b border-white/5 bg-[#030712]/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 shadow-lg shadow-primary-500/30">
            <span className="text-xl font-bold text-white">T</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">TrackCode</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button size="sm" onClick={() => navigate('/register')}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 z-10 max-w-5xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary-500/30 bg-primary-500/5 px-3 py-1.5 text-xs font-semibold text-primary-400">
            <Star className="h-3.5 w-3.5 fill-current text-primary-400" />
            <span>Introducing TrackCode 2.0 Dashboard</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none bg-gradient-to-b from-white via-slate-100 to-slate-500 bg-clip-text text-transparent">
            Your Ultimate Developer <br />
            <span className="bg-gradient-to-r from-primary-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">Productivity Console</span>
          </h1>
          <p className="text-dark-textMuted text-base md:text-xl max-w-3xl mx-auto">
            Track daily contributions, analyze algorithm solving velocity, predict contest ratings, and unlock personalized AI insights to elevate your engineering skills.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Button size="lg" onClick={() => navigate('/register')} className="h-12 px-8 text-sm font-semibold">
            Claim Your Free Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/login')} className="h-12 px-8 text-sm font-semibold">
            Sign In with Demo User
          </Button>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 z-10">
        <div className="text-center mb-16 space-y-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">Engineered for Competitive Programmers & Developers</h2>
          <p className="text-dark-textMuted max-w-2xl mx-auto">Advanced dashboard telemetry that provides deep metrics on coding patterns.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <Card key={i} className="border-white/5 bg-slate-900/30 backdrop-blur-xl p-8 hover:border-primary-500/20 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] transition-all">
              <CardContent className="space-y-4 p-0">
                <div className={`h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center ${f.color}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-white">{f.title}</h3>
                <p className="text-xs text-dark-textMuted leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="w-full max-w-7xl mx-auto px-6 py-20 z-10 border-t border-white/5">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-left">
            <h2 className="text-3xl font-extrabold text-white">Loved by Software Engineers worldwide</h2>
            <p className="text-dark-textMuted text-sm">See how developers are using TrackCode to maintain consistency streaks and improve algorithm proficiency levels.</p>
          </div>
          <div className="grid gap-4">
            <Card className="border-white/5 bg-slate-900/40 p-5">
              <CardContent className="p-0 text-left space-y-3">
                <p className="text-xs text-slate-300 italic">"TrackCode helped me consolidate my LeetCode activity and GitHub commits. The weekly progress score keeps me fully committed."</p>
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-slate-800" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Alex River</h5>
                    <p className="text-[10px] text-dark-textMuted">Software Dev at Stripe</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-10 z-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-dark-textMuted gap-4">
        <span>© 2026 TrackCode Inc. All rights reserved.</span>
        <div className="flex items-center space-x-4">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Security</a>
        </div>
      </footer>
    </div>
  );
};
