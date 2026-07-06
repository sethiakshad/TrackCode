import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { NotFound } from './routes/NotFound';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Features
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { OTPVerify } from './features/auth/OTPVerify';
import { Dashboard } from './features/dashboard/Dashboard';
import { Analytics } from './features/insights/Insights';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/otp-verify" element={<OTPVerify />} />
            
            {/* Redirect root to dashboard for now */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected Routes */}
            <Route 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
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
