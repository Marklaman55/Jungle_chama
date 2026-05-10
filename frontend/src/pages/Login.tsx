import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Mail, Lock, ArrowRight, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../lib/api';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'credentials' | 'forgot' | 'reset'>('credentials');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const successMessage = location.state?.message;

  const validateCredentials = () => {
    const errors: Record<string, string> = {};
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCredentials()) return;

    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setStep('reset');
        setError('Reset code sent to your email.');
      } else {
        setError(data.error || 'Failed to send reset code');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp: resetCode, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setStep('credentials');
        setError('Password reset successful. Please login.');
      } else {
        setError(data.error || 'Reset failed');
      }
    } catch (err) {
      setError('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative items-center justify-center p-20 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-jungle/40 via-transparent to-transparent" />
          <img 
            src="https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&q=80&w=2070" 
            alt="Savings" 
            className="w-full h-full object-cover mix-blend-overlay opacity-50"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="relative z-10 text-white max-w-lg">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-7xl font-display uppercase leading-none mb-8">The <br /><span className="text-jungle">Jungle</span> <br /> Awaits.</h2>
            <p className="text-xl text-white/60 font-medium leading-relaxed">
              Log in to manage your daily streaks and claim your investment rewards.
            </p>
          </motion.div>
        </div>

        {/* Floating element */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-20 w-32 h-32 bg-jungle rounded-3xl rotate-12 flex items-center justify-center shadow-2xl shadow-jungle/40"
        >
          <Sparkles size={48} className="text-white" />
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-20 bg-[#F8F9FA]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="mb-12">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-black text-xl mb-8 lg:hidden">J</div>
            <h2 className="text-4xl font-black text-black tracking-tight mb-4">
                {step === 'credentials' && 'Welcome Back'}
                {step === 'forgot' && 'Reset Password'}
                {step === 'reset' && 'Create New Password'}
            </h2>
            <p className="text-gray-400 font-medium">
                {step === 'credentials' && 'Enter your credentials to access your account.'}
                {step === 'forgot' && "Enter your email to receive a reset code."}
                {step === 'reset' && "Enter the code from your email and your new password."}
            </p>
          </div>

          {successMessage && !error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-5 bg-green-50 text-green-600 text-sm font-bold rounded-2xl border border-green-100 flex items-center gap-3"
            >
              <CheckCircle2 size={18} />
              {successMessage}
            </motion.div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mb-8 p-5 ${error.includes('sent') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'} text-sm font-bold rounded-2xl border flex items-center gap-3`}
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-jungle transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    className={`w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus:ring-4 transition-all outline-none font-medium shadow-sm ${fieldErrors.email ? 'ring-4 ring-red-500/5 border-red-200' : 'focus:ring-jungle/5 focus:border-jungle/30'}`}
                    placeholder="name@example.com"
                  />
                </div>
                {fieldErrors.email && <p className="mt-1 ml-2 text-[10px] text-red-500 font-black uppercase tracking-widest">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-jungle transition-colors" size={20} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    }}
                    className={`w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus:ring-4 transition-all outline-none font-medium shadow-sm ${fieldErrors.password ? 'ring-4 ring-red-500/5 border-red-200' : 'focus:ring-jungle/5 focus:border-jungle/30'}`}
                    placeholder="••••••••"
                  />
                </div>
                {fieldErrors.password && <p className="mt-1 ml-2 text-[10px] text-red-500 font-black uppercase tracking-widest">{fieldErrors.password}</p>}
                <div className="flex justify-end pt-2">
                  <button 
                    type="button" 
                    onClick={() => { setStep('forgot'); setResetEmail(email); }}
                    className="text-[10px] font-black text-jungle uppercase tracking-widest hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-jungle text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-jungle-dark transition-all disabled:opacity-70 shadow-2xl shadow-jungle/30 group"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Sign In
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : step === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-jungle transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus:outline-none focus:border-jungle shadow-sm transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-jungle text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-jungle-dark transition-all disabled:opacity-70 shadow-2xl shadow-jungle/30 group"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Send Reset Code
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <div className="text-center pt-4">
                <button type="button" onClick={() => setStep('credentials')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-jungle">
                  Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reset Code</label>
                <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full px-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus:outline-none focus:border-jungle shadow-sm transition-all text-center tracking-[0.5em] font-black text-2xl"
                    placeholder="000000"
                  />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-jungle transition-colors" size={20} />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus:outline-none focus:border-jungle shadow-sm transition-all"
                    placeholder="New Password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-black text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-gray-900 transition-all disabled:opacity-70 shadow-2xl shadow-gray-200 group"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Update Password
                    <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
              <div className="text-center pt-4">
                <button type="button" onClick={() => setStep('credentials')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-jungle">
                  Back to Login
                </button>
              </div>
            </form>
          )}

          <p className="mt-12 text-center text-gray-400 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-jungle font-black hover:underline underline-offset-4">Join the tribe</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
