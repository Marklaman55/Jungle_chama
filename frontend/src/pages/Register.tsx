import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const termsText = `
# JUNGLE CHAMA PLATFORM

## TERMS, RULES & REGULATIONS AGREEMENT

**IMPORTANT NOTICE:**
By registering and using the Jungle Chama platform, every member agrees to comply with all rules, regulations, payment obligations, and marketplace conduct policies stated below. This agreement serves as a legally binding digital understanding between the member and Jungle Chama.

---

# 1. PLATFORM PURPOSE

Jungle Chama is a community savings and marketplace platform where:

* Members contribute money periodically.
* Members receive pooled payouts according to agreed schedules.
* Members can upload, advertise, and sell products to other members.
* Members participate in a trusted financial and trading ecosystem.

---

# 2. MEMBER ELIGIBILITY

To register on Jungle Chama, a member must:

* Be at least 18 years old.
* Provide accurate personal information.
* Use a valid phone number and email address.
* Agree to all Jungle Chama rules and regulations.
* Upload valid identification if requested.

Providing false information may lead to permanent account suspension.

---

# 3. SAVINGS & CONTRIBUTION RULES

## 3.1 Contribution Obligations

* Every member must contribute the agreed amount on time.
* Contributions must be made before the stated deadline.
* Late payments may attract penalties.

## 3.2 Payout Rotation

* Members receive payouts according to the scheduled rotation system.
* The payout order may be determined by:

  * Registration order,
  * Voting system,
  * Random allocation,
  * Admin approval,
  * Or agreed chama structure.

## 3.3 Missed Contributions

If a member fails to contribute:

* Their payout may be delayed.
* Penalties may apply.
* Account restrictions may be enforced.
* Repeated failure may result in removal from the platform.

## 3.4 Fraud Prevention

* Fake payments are strictly prohibited.
* Manipulation of transactions is prohibited.
* Any fraudulent activity may result in:

  * Permanent ban,
  * Legal action,
  * Reporting to authorities.

---

# 4. PRODUCT MARKETPLACE RULES

## 4.1 Product Uploads

Members may upload products for sale, provided that:

* Products are legal.
* Product descriptions are accurate.
* Images belong to the seller or are authorized.
* Prices are honest and not misleading.

## 4.2 Prohibited Products

The following are strictly prohibited:

* Illegal goods,
* Counterfeit products,
* Weapons,
* Drugs,
* Adult content,
* Fraudulent services,
* Stolen property.

Violation may result in immediate account termination.

## 4.3 Buyer & Seller Responsibility

* Sellers are responsible for product quality and delivery.
* Buyers must verify products before purchase.
* Jungle Chama acts only as a platform facilitator and is not liable for disputes between buyers and sellers.

---

# 5. PAYMENT TERMS

* All transactions must be completed through approved payment methods.
* Members must keep proof of payment.
* Jungle Chama reserves the right to verify any transaction.

Refunds are subject to investigation and approval.

---

# 6. ACCOUNT SECURITY

Members are responsible for:

* Keeping passwords secure,
* Protecting login credentials,
* Reporting suspicious activity immediately.

Jungle Chama is not responsible for losses caused by negligence from the user.

---

# 7. MEMBER CONDUCT

Members must:

* Treat others respectfully,
* Avoid abusive language,
* Avoid scams and manipulation,
* Avoid impersonation.

Harassment, threats, or illegal conduct may lead to removal and legal reporting.

---

# 8. ADMINISTRATIVE RIGHTS

Jungle Chama administrators reserve the right to:

* Suspend accounts,
* Investigate suspicious activity,
* Remove harmful content,
* Modify platform rules when necessary.

Members will be notified of major policy changes.

---

# 9. DATA & PRIVACY

By using Jungle Chama, members consent to:

* Storage of account information,
* Transaction monitoring for security,
* Use of data for platform improvements.

Personal data will not be sold unlawfully to third parties.

---

# 10. TERMINATION OF MEMBERSHIP

A member account may be terminated if:

* Rules are violated,
* Fraudulent activity is detected,
* Payments are repeatedly missed,
* Illegal conduct occurs.

Termination may occur without refund depending on the violation.

---

# 11. DIGITAL AGREEMENT CONSENT

Before completing registration, members must confirm:

☑ I have read and understood the Jungle Chama Terms and Regulations.
☑ I agree to comply with all platform rules.
☑ I understand that violation may result in suspension or removal.
☑ I accept digital storage of this agreement as legal evidence.

---

# 12. LEGAL ACKNOWLEDGEMENT

This agreement shall serve as digital evidence of acceptance upon registration and may be used in dispute resolution or legal processes where applicable.
  `;

  const downloadAgreement = () => {
    const blob = new Blob([termsText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JungleChama_Agreement_${formData.name.replace(/\s+/g, '_')}.txt`;
    a.click();
  };

  const downloadCSVConfirmation = () => {
    const headers = ['Field', 'Value'];
    const data = [
      ['Name', formData.name],
      ['Email', formData.email],
      ['Phone', formData.phone],
      ['Registration Date', new Date().toLocaleString()],
      ['Terms Accepted', 'Yes'],
      ['Platform', 'Jungle Chama']
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JungleChama_Confirmation_${formData.name.replace(/\s+/g, '_')}.csv`;
    a.click();
  };

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

    if (!acceptedTerms) {
      errors.terms = 'You must accept the terms and conditions';
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
      const res = await apiFetch(/api/auth/register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, termsAccepted: true })
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
      const res = await apiFetch(/api/auth/verify-otp, {
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

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-1">
                    <input 
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="peer hidden"
                    />
                    <div className="w-5 h-5 border-2 border-gray-200 rounded-lg group-hover:border-jungle transition-colors peer-checked:bg-jungle peer-checked:border-jungle flex items-center justify-center">
                      <ArrowRight size={12} className="text-white transform -rotate-45" />
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose">
                    I AGREE TO THE <button type="button" onClick={() => setShowTerms(true)} className="text-jungle hover:underline">TERMS & REGULATIONS</button>. 
                    <br />
                    <button type="button" onClick={downloadAgreement} className="text-gray-600 hover:text-black mt-1 flex items-center gap-1">
                       DOWNLOAD CONFIRMATION (PDF/TXT)
                    </button>
                  </span>
                </label>
                {fieldErrors.terms && <p className="mt-1 ml-8 text-[10px] text-red-500 font-black uppercase tracking-widest">{fieldErrors.terms}</p>}
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

      {/* Terms Modal */}
      <AnimatePresence>
        {showTerms && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTerms(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tight">Terms & Regulations</h2>
                <button 
                  onClick={() => setShowTerms(false)}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <ArrowRight className="rotate-180" size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 font-medium text-gray-600 leading-relaxed custom-scrollbar">
                <div className="whitespace-pre-wrap text-sm">
                  {termsText}
                </div>
              </div>

              <div className="p-8 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => {
                    setAcceptedTerms(true);
                    setShowTerms(false);
                  }}
                  className="px-10 py-4 bg-jungle text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-xl shadow-jungle/20"
                >
                  Agree & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Register;
