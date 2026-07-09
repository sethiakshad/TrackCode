import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Mail, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const result = await register(name, email);

      if (result.requiresOtpVerification) {
        navigate('/otp-verify', {
          state: {
            email,
            name,
            mode: 'register',
          },
        });
        return;
      }

      setSuccessMessage('Account created successfully. Redirecting to your dashboard...');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to register.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-accent-600/20 blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-primary-600/20 blur-[120px]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-white/5 bg-dark-surface/60 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 shadow-lg shadow-accent-500/30">
              <User className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Start tracking your coding journey today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {successMessage && (
                <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  icon={<User className="h-5 w-5" />}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="h-5 w-5" />}
                  required
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-5 w-5" />}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Sign Up
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-dark-textMuted">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
