import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { User, Mail, Lock, Phone, ArrowRight, Loader2, Gift, Zap, AlertCircle } from 'lucide-react';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    referralCode: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = () => {
    const errors: Record<string, string> = {};
    
    if (formData.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters long';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    const phoneRegex = /^(?:254|\+254|0)?(7|1)\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      errors.phone = 'Enter a valid Kenyan number (e.g. 0712345678)';
    }
    
    if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        setStep('otp');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate('/dashboard');
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err: any) {
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
            src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=2071" 
            alt="Growth" 
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
            <h2 className="text-7xl font-display uppercase leading-none mb-8">Grow <br />With the <br /><span className="text-jungle">Tribe.</span></h2>
            <p className="text-xl text-white/60 font-medium leading-relaxed">
              Join thousands of Gen Z savers building their future, one coin at a time.
            </p>
          </motion.div>
        </div>

        {/* Floating element */}
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 w-32 h-32 bg-jungle rounded-3xl -rotate-12 flex items-center justify-center shadow-2xl shadow-jungle/40"
        >
          <Zap size={48} className="text-white" />
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
              {step === 'form' ? 'Join the Jungle' : 'Verify Identity'}
            </h2>
            <p className="text-gray-400 font-medium">
              {step === 'form' ? 'Create your account and start saving today.' : `We've sent a code to your phone.`}
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-5 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-center gap-3"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}

          {step === 'form' ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-jungle transition-colors" size={20} />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                    }}
                    className={`w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus:ring-4 transition-all outline-none font-medium shadow-sm ${fieldErrors.name ? 'ring-4 ring-red-500/5 border-red-200' : 'focus:ring-jungle/5 focus:border-jungle/30'}`}
                    placeholder="John Doe"
                  />
                </div>
                {fieldErrors.name && <p className="mt-1 ml-2 text-[10px] text-red-500 font-black uppercase tracking-widest">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-jungle transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    className={`w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus:ring-4 transition-all outline-none font-medium shadow-sm ${fieldErrors.email ? 'ring-4 ring-red-500/5 border-red-200' : 'focus:ring-jungle/5 focus:border-jungle/30'}`}
                    placeholder="name@example.com"
                  />
                </div>
                {fieldErrors.email && <p className="mt-1 ml-2 text-[10px] text-red-500 font-black uppercase tracking-widest">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                <div className="relative group">
                  <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-jungle transition-colors" size={20} />
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                    }}
                    className={`w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus:ring-4 transition-all outline-none font-medium shadow-sm ${fieldErrors.phone ? 'ring-4 ring-red-500/5 border-red-200' : 'focus:ring-jungle/5 focus:border-jungle/30'}`}
                    placeholder="254700000000"
                  />
                </div>
                {fieldErrors.phone && <p className="mt-1 ml-2 text-[10px] text-red-500 font-black uppercase tracking-widest">{fieldErrors.phone}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-jungle transition-colors" size={20} />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                    }}
                    className={`w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus:ring-4 transition-all outline-none font-medium shadow-sm ${fieldErrors.password ? 'ring-4 ring-red-500/5 border-red-200' : 'focus:ring-jungle/5 focus:border-jungle/30'}`}
                    placeholder="••••••••"
                  />
                </div>
                {fieldErrors.password && <p className="mt-1 ml-2 text-[10px] text-red-500 font-black uppercase tracking-widest">{fieldErrors.password}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Referral Code (Optional)</label>
                <div className="relative group">
                  <Gift className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-jungle transition-colors" size={20} />
                  <input
                    type="text"
                    value={formData.referralCode}
                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                    className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-jungle/5 focus:border-jungle/30 transition-all outline-none font-medium shadow-sm"
                    placeholder="ABC123"
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
                    Create Account
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-6 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus:outline-none focus:border-jungle transition-all text-center tracking-[0.5em] font-black text-2xl shadow-sm"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-6 bg-jungle text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-jungle-dark transition-all disabled:opacity-70 shadow-2xl shadow-jungle/30 group"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                  <>
                    Complete Registration
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-jungle transition-colors"
              >
                Return to Form
              </button>
            </form>
          )}

          <p className="mt-12 text-center text-gray-400 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-jungle font-black hover:underline underline-offset-4">Log in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
