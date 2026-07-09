import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { authService } from './AuthServices';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

export const OTPVerify = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const pendingRegistration = useMemo(
    () => location.state || authService.getPendingRegistration(),
    [location.state]
  );
  const email = pendingRegistration?.email;

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await authService.verifyOTP(email, otp);
      navigate(pendingRegistration?.from?.pathname || '/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px]" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <Card className="border-white/5 bg-dark-surface/60 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30">
              <KeyRound className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>We've sent a 6-digit verification code to {email}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code (e.g. 123456)"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="text-center tracking-[0.5em] text-lg font-mono"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Verify Code
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
