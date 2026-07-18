import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Shimmer } from '../../components/ui/Shimmer';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Bot, User, Send, Sparkles, Brain, Award, ArrowRight, Zap, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAiRecommendations, getAiFeedbackSummary, sendChatMessage } from '../../lib/api/coachApi';

export const AICoach = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I am your TrackCode AI Coach. I analyze your coding performance across LeetCode, Codeforces, and GitHub. How can I help you improve today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const [recommendations, setRecommendations] = useState([]);
  const [feedbackSummary, setFeedbackSummary] = useState("");
  const [loading, setLoading] = useState(true);

  const chatBottomRef = useRef(null);

  const suggestedPrompts = [
    "Analyze my DP weakness",
    "How to prepare for next contest?",
    "Why is my submission speed low?"
  ];

  useEffect(() => {
    if (!user?.id) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [recs, feedback] = await Promise.all([
          getAiRecommendations(user.id),
          getAiFeedbackSummary(user.id)
        ]);
        setRecommendations(recs);
        setFeedbackSummary(feedback);
      } catch (err) {
        console.error("Failed to load coach data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.id]);

  const handleSend = (text) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Call the actual AI chat API
    sendChatMessage(text).then((res) => {
      setIsTyping(false);
      const responseText = res?.data?.response || res?.data?.message || "I'm having trouble analyzing that right now.";
      setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);
    }).catch((err) => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', content: "An error occurred while connecting to the AI service." }]);
    });
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-left h-[calc(100vh-10rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            AI Coding Coach
          </h1>
          <p className="text-dark-textMuted text-sm mt-1">Get personalized strategy suggestions, code reviews, and topic roadmap highlights.</p>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 flex-1 overflow-hidden min-h-0">
        {/* Left 2 Columns: Chat Workspace */}
        <Card className="lg:col-span-2 border-white/5 bg-slate-900/40 backdrop-blur-xl flex flex-col h-full overflow-hidden">
          <CardHeader className="border-b border-white/5 p-4 flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-primary-500/10 text-primary-400 rounded-lg">
                <Bot className="h-5 w-5" />
              </div>
              <div className="text-left">
                <CardTitle className="text-sm font-bold">TrackCode Coach v1.0</CardTitle>
                <CardDescription className="text-[10px]">Active & connected to telemetry profiles</CardDescription>
              </div>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </CardHeader>

          {/* Chat message viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex items-start space-x-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role !== 'user' && (
                  <div className="p-1.5 rounded-lg bg-slate-800 text-primary-400 shrink-0 mt-0.5 border border-white/5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary-600 text-white rounded-tr-none'
                    : 'bg-slate-950/60 text-slate-200 border border-white/5 rounded-tl-none'
                }`}>
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="p-1.5 rounded-lg bg-primary-600 text-white shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex items-center space-x-3 justify-start">
                <div className="p-1.5 rounded-lg bg-slate-800 text-primary-400 shrink-0 border border-white/5">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-slate-950/60 border border-white/5 rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts Container */}
          <div className="p-4 border-t border-white/5 space-y-3 shrink-0">
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSend(p)}
                  className="text-[10px] font-semibold bg-slate-950/60 border border-white/5 text-dark-textMuted hover:text-white hover:border-primary-500/20 px-3 py-1.5 rounded-full transition-all"
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Input field */}
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="Ask your coach anything about DSA, contests, or projects..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                className="bg-slate-950/40 border-white/5 focus:bg-slate-950"
              />
              <Button size="icon" onClick={() => handleSend(inputValue)} className="h-10 w-10 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Right 1 Column: Roadmap Summary */}
        <div className="space-y-6 overflow-y-auto pr-1 shrink-0 lg:shrink">
          {/* Weekly Report Card */}
          <Card className="border-white/5 bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-cyan-950/20 backdrop-blur-xl">
            <CardHeader pb-2>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span>Weekly AI Report</span>
              </CardTitle>
              <CardDescription className="text-[10px]">Calculated from recent submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {loading ? (
                <Shimmer className="h-16 w-full rounded-lg" />
              ) : (
                <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5 space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span>Performance Overview</span>
                    <span className="text-cyan-400">AI</span>
                  </div>
                  <p className="text-[10px] text-dark-textMuted">
                    {feedbackSummary || "No data to generate feedback yet. Start solving problems!"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personalized Roadmap Preview */}
          <Card className="border-white/5 bg-slate-900/40 backdrop-blur-xl">
            <CardHeader pb-2>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Brain className="h-4 w-4 text-primary-400" />
                <span>DSA Roadmap Preview</span>
              </CardTitle>
              <CardDescription className="text-[10px]">Recommended milestones to hit based on AI analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative border-l border-white/10 pl-4 ml-2 space-y-4 py-2">
                {loading ? (
                  <Shimmer className="h-20 w-full" />
                ) : recommendations.length === 0 ? (
                  <p className="text-[10px] text-dark-textMuted text-center">No recommendations yet.</p>
                ) : (
                  recommendations.map((rec, i) => (
                    <div key={rec.id} className="relative">
                      <div className={`absolute -left-[21px] top-0.5 h-2.5 w-2.5 rounded-full border border-[#030712] ${i === 0 ? 'bg-primary-500 animate-pulse' : 'bg-emerald-500'}`} />
                      <div className="text-xs">
                        <p className="font-bold text-white">{i + 1}. {rec.topic} - {rec.title}</p>
                        <p className="text-[10px] text-dark-textMuted">{rec.relevance_reason}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
