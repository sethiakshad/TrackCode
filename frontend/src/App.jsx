import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LeetCodeProvider } from './context/LeetCodeContext';
import { GitHubProvider } from './context/GitHubContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { NotFound } from './routes/NotFound';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Features
import { LandingPage } from './features/auth/LandingPage';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { OTPVerify } from './features/auth/OTPVerify';
import { Dashboard } from './features/dashboard/Dashboard';
import { Analytics } from './features/insights/Insights';
import { GitHubInsights } from './features/github/GitHubInsights';
import { ContestAnalysis } from './features/contest/ContestAnalysis';
import { AICoach } from './features/aicoach/AICoach';
import { FriendsLeaderboard } from './features/profile/FriendsLeaderboard';
import { Settings } from './features/profile/Settings';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/otp-verify" element={<OTPVerify />} />

            {/* Protected Routes */}
            <Route 
              element={
                <ProtectedRoute>
                  <LeetCodeProvider>
                    <GitHubProvider>
                      <DashboardLayout />
                    </GitHubProvider>
                  </LeetCodeProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/github" element={<GitHubInsights />} />
              <Route path="/contest" element={<ContestAnalysis />} />
              <Route path="/coach" element={<AICoach />} />
              <Route path="/friends" element={<FriendsLeaderboard />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
