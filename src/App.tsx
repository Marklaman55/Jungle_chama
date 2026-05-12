/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Products from './pages/Products';
import Profile from './pages/Profile';

const PrivateRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" />;
  
  return <>{children}</>;
};

const AppContent = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[200]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-jungle rounded-3xl flex items-center justify-center animate-bounce shadow-2xl shadow-jungle/20">
            <span className="text-white font-black text-2xl">J</span>
          </div>
          <Loader2 className="animate-spin text-jungle" size={24} />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">The Jungle is Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <PrivateRoute adminOnly>
                <Admin />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
