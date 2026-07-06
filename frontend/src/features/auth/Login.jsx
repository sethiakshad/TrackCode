import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to login. Try demo@trackcode.com / password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary-600/20 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-cyan-600/20 blur-[120px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-white/5 bg-dark-surface/60 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 shadow-lg shadow-primary-500/30">
              <span className="text-2xl font-bold text-white">T</span>
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email address (demo@trackcode.com)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="h-5 w-5" />}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password (password)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-5 w-5" />}
                  required
                />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center space-x-2 cursor-pointer text-dark-textMuted hover:text-white transition-colors">
                  <input type="checkbox" className="rounded border-dark-border bg-dark-bg text-primary-500 focus:ring-primary-500" />
                  <span>Remember me</span>
                </label>
                <a href="#" className="text-primary-400 hover:text-primary-300 transition-colors">
                  Forgot password?
                </a>
              </div>
              
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Sign In
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-dark-textMuted">
              Don't have an account?{' '}
              <a href="#" className="font-medium text-primary-400 hover:text-primary-300">
                Sign up
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
