import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  Share2, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  TrendingUp,
  X,
  History,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user, getToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState<any>({ totalSaved: 0, referralCount: 0, currentCycle: null });
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nextDayToPay, setNextDayToPay] = useState<number | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState(user?.phone ? user.phone.replace(/^254/, '').replace(/^0/, '') : '');

  const [paymentAmount, setPaymentAmount] = useState('200');

  const fetchData = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch member stats (includes totalSaved, referralCount, currentCycle)
      const statsRes = await fetch('/api/member/stats', { headers });
      const statsContentType = statsRes.headers.get("content-type");
      if (statsRes.ok && statsContentType && statsContentType.includes("application/json")) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else if (!statsRes.ok) {
        console.error(`Stats fetch failed with status ${statsRes.status}`);
      }

      // Fetch payments
      const paymentsRes = await fetch('/api/payments/my', { headers });
      const paymentsContentType = paymentsRes.headers.get("content-type");
      if (paymentsRes.ok && paymentsContentType && paymentsContentType.includes("application/json")) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      } else if (!paymentsRes.ok) {
        console.error(`Payments fetch failed with status ${paymentsRes.status}`);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s

    return () => clearInterval(interval);
  }, [user]);

  const handlePay = () => {
    const nextDay = 0; // Not really using day number here if they just enter amount
    setNextDayToPay(nextDay);
    setShowConfirm(true);
  };

    const executePayment = async () => {
    // Client-side validation
    if (!mpesaPhone.trim()) {
      setNotification({ message: "Please enter a phone number.", type: 'error' });
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        setNotification({ message: "Please enter a valid amount.", type: 'error' });
        return;
    }

    // Sanitize phone: remove 0 prefix if present
    const sanitizedPhone = mpesaPhone.trim().replace(/^0/, '');
    const fullPhone = `254${sanitizedPhone}`;

    setPaying(true);

    try {
      const token = await getToken();
      
      const res = await fetch('/api/payment/mpesa/stk-push', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          phone: fullPhone, 
          amount: parseFloat(paymentAmount),
          userId: user?.userId
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setNotification({ 
          message: 'M-Pesa STK Push sent! Please check your phone to complete the payment.', 
          type: 'success' 
        });
        // Refresh data to show pending transaction if possible
        await fetchData();
      } else {
        throw new Error(data.error || 'Failed to initiate M-Pesa payment');
      }
    } catch (err: any) {
      setNotification({ 
        message: `Payment failed: ${err.message}`, 
        type: 'error' 
      });
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-jungle" size={40} /></div>;

  const paidDaysCount = stats?.currentCycle ? payments.filter(p => p.status === 'completed' && p.type === 'deposit').length : 0;
  const progress = Math.min((paidDaysCount / 10) * 100, 100);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-jungle font-bold text-xs uppercase tracking-[0.2em] mb-3">
              <div className="w-8 h-[1px] bg-jungle/30"></div>
              Member Dashboard
            </div>
            <h1 className="text-5xl font-black text-black tracking-tight mb-2">
              Welcome, <span className="text-jungle">{user?.name}</span>
            </h1>
            <p className="text-gray-400 font-medium tracking-tight">Access your M-Pesa savings wallet and track your community progress.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 bg-jungle/10 rounded-lg flex items-center justify-center text-jungle">
                <Trophy size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Position</p>
                <p className="text-lg font-black text-black leading-none">#{user?.payout_number || 'N/A'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Notifications */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] min-w-[320px] max-w-[90vw] p-5 rounded-2xl shadow-2xl flex items-center justify-between border ${
                notification.type === 'success' 
                  ? 'bg-white border-green-100 text-green-800' 
                  : 'bg-white border-red-100 text-red-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
                  notification.type === 'success' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
                }`}>
                  {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
                <p className="font-bold text-sm leading-tight">{notification.message}</p>
              </div>
              <button 
                onClick={() => setNotification(null)} 
                className="p-2 hover:bg-gray-50 rounded-full transition-colors ml-4"
              >
                <X size={16} className="text-gray-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            {/* Quick Ssave Content */}
            <div className="lg:col-span-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 h-full">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-jungle/10 rounded-2xl flex items-center justify-center text-jungle">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-black tracking-tight">Direct M-Pesa Deposit</h2>
                            <p className="text-gray-400 text-sm font-medium">Instantly save to your chama wallet via STK Push.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Member Number</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">+254</span>
                                <input 
                                    type="tel" 
                                    value={mpesaPhone}
                                    onChange={(e) => setMpesaPhone(e.target.value)}
                                    className="w-full pl-16 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-jungle/5 focus:border-jungle/30 font-black text-lg transition-all"
                                    placeholder="712345678"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Contribution Amount (KES)</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl">KES</span>
                                <input 
                                    type="number" 
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="w-full pl-20 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-jungle/5 focus:border-jungle/30 font-black text-2xl transition-all"
                                    placeholder="500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={executePayment}
                            disabled={paying}
                            className="w-full py-5 bg-jungle text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-xl shadow-jungle/20 flex items-center justify-center gap-3 disabled:opacity-50 group"
                        >
                            {paying ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>Send STK Push</span>
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-8 flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100/50">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white shrink-0">
                            <AlertCircle size={14} />
                        </div>
                        <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
                            Payment will be sent to <span className="font-black underline">+254{mpesaPhone.replace(/^0/, '')}</span>. Ensure your M-Pesa PIN is ready!
                        </p>
                    </div>
                </div>
            </div>

            {/* Balance Overview Widget */}
            <div className="lg:col-span-4">
                <div className="bg-black text-white p-10 rounded-[3rem] shadow-2xl h-full flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-jungle/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl group-hover:bg-jungle/20 transition-colors"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-xl font-black tracking-tight">Available Balance</h3>
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-jungle">
                                <Wallet size={20} />
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Savings Wallet</span>
                            <h3 className="text-5xl font-black tracking-tighter">KES {stats?.balance || 0}</h3>
                        </div>
                    </div>

                    <div className="mt-10 relative z-10">
                        <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-2xl border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-jungle animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Updates Enabled</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Content Tabs (Stats/Progress) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-12">
            {/* Cycle Progress Section */}
            <section className="bg-white p-10 sm:p-12 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-jungle/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-12 relative z-10">
                <div>
                  <h2 className="text-3xl font-black text-black tracking-tight mb-2">Current Cycle</h2>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stats?.currentCycle?.status === 'active' ? 'bg-jungle animate-pulse' : 'bg-gray-300'}`}></div>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
                      {stats?.currentCycle?.status === 'active' ? `Day ${paidDaysCount} of 10` : 'Break Period'}
                    </p>
                  </div>
                </div>
                {stats?.currentCycle?.status === 'active' && paidDaysCount < 10 && (
                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="px-10 py-5 bg-jungle text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-2xl shadow-jungle/30 flex items-center justify-center gap-3 disabled:opacity-50 group"
                  >
                    {paying ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        Pay Today
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-10 relative z-10">
                <div className="relative">
                  <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden p-1.5 border border-gray-200/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-jungle rounded-full shadow-[0_0_20px_rgba(41,171,135,0.5)] relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                    </motion.div>
                  </div>
                  <div className="flex justify-between mt-4">
                    {[...Array(11)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className={`w-1 h-2 rounded-full mb-2 ${i <= paidDaysCount ? 'bg-jungle' : 'bg-gray-200'}`}></div>
                        <span className={`text-[10px] font-black ${i <= paidDaysCount ? 'text-jungle' : 'text-gray-300'}`}>{i}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Savings</span>
                    <span className="text-xl font-black text-black">KES {stats?.totalSaved || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Impact</span>
                    <span className="text-xl font-black text-black">Tribe Growth</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</span>
                    <span className="text-xl font-black text-jungle">Verified</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Goal</span>
                    <span className="text-xl font-black text-black">Financial Freedom</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Payments Section */}
            <section>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-black tracking-tight">Payment History</h2>
                <div className="flex items-center gap-2 text-gray-400 text-sm font-bold">
                  <History size={16} />
                  {payments.length} Transactions
                </div>
              </div>
              
              <div className="space-y-6">
                {payments.length === 0 ? (
                  <div className="bg-white p-20 rounded-[2.5rem] text-center border-2 border-dashed border-gray-100 flex flex-col items-center gap-4">
                    <History size={48} className="text-gray-200" />
                    <p className="text-gray-400 font-bold">No payments yet. Start your first cycle!</p>
                  </div>
                ) : (
                  payments.map((payment, index) => (
                    <motion.div 
                      layout
                      key={payment.id || payment.transactionId || `payment-${index}`} 
                      className="bg-white p-8 rounded-[2rem] flex items-center justify-between border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_15px_35px_rgb(0,0,0,0.05)] transition-all duration-500 group"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                          <CheckCircle2 size={28} />
                        </div>
                        <div>
                          <p className="font-black text-lg text-black tracking-tight">{payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar size={12} className="text-gray-300" />
                            <p className="text-xs text-gray-400 font-medium">{format(new Date(payment.date), 'MMM d, yyyy • h:mm a')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-xl text-black tracking-tight">KES {payment.amount}</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mt-2 ${
                            payment.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                        }`}>
                          <div className={`w-1 h-1 rounded-full ${payment.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          {payment.status}
                        </span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Section */}
          <aside className="lg:col-span-4 space-y-10">
            {/* Cycle Info Card */}
            <div className="bg-black text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-jungle/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-jungle/30 transition-colors duration-700"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-2xl font-black tracking-tight">Cycle Insights</h3>
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-jungle">
                    <TrendingUp size={24} />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                      <Clock size={20} className="text-jungle" />
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Current Status</p>
                      <p className="font-bold text-lg">{stats?.currentCycle?.status === 'active' ? 'Active Cycle' : 'Break Period'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                      <Calendar size={20} className="text-jungle" />
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Next Milestone</p>
                      <p className="font-bold text-lg">In {10 - paidDaysCount} payments</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-12 p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                  <p className="text-sm text-white/60 leading-relaxed font-medium">
                    Maintain your daily streak to stay eligible for the <span className="text-jungle font-black">KES 1,000</span> payout. Consistency is key to community growth.
                  </p>
                </div>
              </div>
            </div>

            {/* Invite Card */}
            <div className="bg-jungle p-10 rounded-[3rem] text-white shadow-2xl shadow-jungle/20 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
                  <Share2 size={28} />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-4">Grow the Jungle</h3>
                <p className="text-white/80 text-sm mb-10 leading-relaxed font-medium">
                  Invite friends to join your chama. For every successful cycle completion by a referral, you gain priority in the next payout draw.
                </p>
                <button className="w-full py-5 bg-white text-jungle rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all shadow-xl shadow-black/5 flex items-center justify-center gap-3 group">
                  Share Referral Link
                  <ArrowUpRight size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
