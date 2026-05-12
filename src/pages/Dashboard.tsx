import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
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
  Zap,
  Copy,
  Plus,
  Package,
  Eye,
  User as UserIcon,
  Image as ImageIcon,
  MessageSquare,
  ShoppingCart,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard: React.FC = () => {
  const { user, getToken, updateBalance } = useAuth();
  const { cart, removeFromCart, clearCart, totalPrice, totalItems } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [stats, setStats] = useState<any>({ totalSaved: 0, referralCount: 0, currentCycle: null });
  const [payments, setPayments] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [nextDayToPay, setNextDayToPay] = useState<number | null>(null);
  const [mpesaPhone, setMpesaPhone] = useState(user?.phone ? user.phone.replace(/^254/, '').replace(/^0/, '') : '');
  const [manualAmount, setManualAmount] = useState('');
  const [manualMessage, setManualMessage] = useState('');
  const [productForm, setProductForm] = useState<any>({ name: '', description: '', price: '', stock: '', image_url: '', video_url: '', media: [] });
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const [paymentAmount, setPaymentAmount] = useState('200');

  const fetchData = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch member stats
      const statsRes = await fetch('/api/member/stats', { headers });
      if (statsRes.ok) setStats(await statsRes.json());

      // Fetch payments
      const paymentsRes = await fetch('/api/payments/my', { headers });
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
      
      // Fetch system config
      const configRes = await fetch('/api/admin/system', { headers });
      if (configRes.ok) setSystemConfig(await configRes.json());

      // Fetch user products
      const productsRes = await fetch('/api/admin/products', { headers });
      if (productsRes.ok) {
          const allProducts = await productsRes.json();
          setMyProducts(allProducts.filter((p: any) => p.creatorId === user.userId));
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

  const handleCheckout = async () => {
    if (cart.length === 0 || !user) return;
    
    if (user.balance < totalPrice) {
      setNotification({ message: 'Insufficient balance to checkout cart.', type: 'error' });
      return;
    }

    setPaying(true);
    try {
      const token = await getToken();
      let successCount = 0;
      
      for (const item of cart) {
        const res = await fetch('/api/admin/products/buy', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ productId: item.id, userId: user.userId })
        });
        if (res.ok) {
          const data = await res.json();
          updateBalance(data.newBalance);
          successCount++;
        }
      }

      if (successCount === cart.length) {
        setNotification({ message: 'All items purchased successfully!', type: 'success' });
        clearCart();
        fetchData();
      } else if (successCount > 0) {
        setNotification({ message: `Purchased ${successCount} items, some failed.`, type: 'error' });
        fetchData();
      } else {
        setNotification({ message: 'Failed to purchase items.', type: 'error' });
      }
    } catch (err) {
      setNotification({ message: 'Checkout failed', type: 'error' });
    } finally {
      setPaying(false);
    }
  };

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

  const handleManualDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAmount || !manualMessage) return;
    setPaying(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/member/manual-deposit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: manualAmount, manualMessage })
      });
      if (res.ok) {
        setNotification({ message: 'Request submitted! Admin will verify your payment.', type: 'success' });
        setManualAmount('');
        setManualMessage('');
        fetchData();
      } else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (err: any) {
      setNotification({ message: err.message, type: 'error' });
    } finally {
      setPaying(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        const url = data.url;
        const currentMedia = productForm.media || [];
        if (currentMedia.length >= 4) {
          setNotification({ message: 'Maximum 4 media items allowed.', type: 'error' });
          return;
        }
        const updatedMedia = [...currentMedia, { url, type }];
        
        setProductForm({ 
          ...productForm, 
          media: updatedMedia,
          image_url: type === 'image' ? url : (productForm.image_url || url),
          video_url: type === 'video' ? url : (productForm.video_url || url)
        });
        setNotification({ message: 'File uploaded successfully!', type: 'success' });
      }
    } catch (err) {
      setNotification({ message: 'Upload failed', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      const res = await fetch('/api/member/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(productForm)
      });
      if (res.ok) {
        setNotification({ message: 'Product submitted for approval!', type: 'success' });
        setShowProductModal(false);
        setProductForm({ name: '', description: '', price: '', stock: '', image_url: '', video_url: '', media: [] });
        fetchData();
      }
    } catch (err) {
      setNotification({ message: 'Failed to upload product', type: 'error' });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FA] p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <div className="h-4 w-32 skeleton rounded-full"></div>
            <div className="h-12 w-64 skeleton rounded-2xl"></div>
          </div>
          <div className="flex gap-4">
            <div className="h-12 w-32 skeleton rounded-2xl"></div>
            <div className="h-12 w-40 skeleton rounded-2xl"></div>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 h-80 skeleton rounded-[3rem]"></div>
          <div className="col-span-4 h-80 skeleton-dark rounded-[3rem]"></div>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 space-y-8">
            <div className="h-96 skeleton rounded-[3rem]"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 skeleton rounded-[2rem]"></div>
              ))}
            </div>
          </div>
          <div className="col-span-4 space-y-8">
            <div className="h-[400px] skeleton-dark rounded-[3rem]"></div>
            <div className="h-64 skeleton rounded-[3rem]"></div>
          </div>
        </div>
      </div>
    </div>
  );

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
            <button 
              onClick={() => (window.location.href = '/profile')}
              className="px-6 py-3 bg-white text-black border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-jungle hover:text-white transition-all shadow-sm flex items-center gap-2"
            >
              <UserIcon size={14} />
              Profile
            </button>
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
            {/* Quick Save Content */}
            <div className="lg:col-span-8 space-y-8">
                <div className="bg-white p-10 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100">
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

                  <div className="flex flex-col gap-4">
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const manualSection = document.getElementById('manual-payment-section');
                        manualSection?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-5 bg-white text-black border border-gray-100 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                    >
                      <Wallet size={20} />
                      Pay Manually
                    </button>
                  </div>
                    </div>
                </div>

                {/* Manual Payment Section */}
                <div id="manual-payment-section" className="bg-white p-10 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
                        <Wallet size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-black tracking-tight">{systemConfig?.manualPaymentDetails || 'Manual Payment'}</h2>
                        <p className="text-gray-400 text-sm font-medium">Follow instructions below to pay manually.</p>
                      </div>
                    </div>
                    <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                      {systemConfig?.paymentType || 'Manual'}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="md:w-1/3 bg-black text-white p-8 rounded-[2.5rem] flex flex-col justify-center text-center relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Copy Details</p>
                      <p className="text-3xl font-black text-jungle mb-6 tracking-tighter">{systemConfig?.paymentNumber || 'N/A'}</p>
                      <button 
                        onClick={() => {
                          if (systemConfig?.paymentNumber) {
                            navigator.clipboard.writeText(systemConfig.paymentNumber);
                            setNotification({ message: 'Payment number copied!', type: 'success' });
                          }
                        }}
                        className="w-full py-4 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all group/btn"
                      >
                        <Copy size={16} className="group-hover/btn:scale-110 transition-transform" />
                        Copy Number
                      </button>
                    </div>

                      <div className="flex-1 space-y-6">
                        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100/50">
                          <p className="text-sm text-amber-900 font-medium leading-relaxed">
                            <span className="font-black">Step 1:</span> Pay the amount below to the provided {systemConfig?.paymentType || 'account'}.<br/>
                            <span className="font-black">Step 2:</span> Paste the M-Pesa confirmation message below for admin verification.
                          </p>
                        </div>

                        <form onSubmit={handleManualDeposit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Paid Amount (KES)</label>
                              <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black">KES</span>
                                <input 
                                  type="number" 
                                  required
                                  value={manualAmount}
                                  onChange={(e) => setManualAmount(e.target.value)}
                                  className="w-full pl-16 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/30 font-black transition-all"
                                  placeholder="500"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirmation Message</label>
                              <div className="relative">
                                <MessageSquare className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input 
                                  type="text" 
                                  required
                                  value={manualMessage}
                                  onChange={(e) => setManualMessage(e.target.value)}
                                  className="w-full pl-16 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500/30 font-black transition-all"
                                  placeholder="Paste M-Pesa text here"
                                />
                              </div>
                            </div>
                          </div>
                          <button 
                            type="submit"
                            disabled={paying}
                            className="w-full py-5 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-black/10"
                          >
                            {paying ? <Loader2 className="animate-spin" size={20} /> : (
                              <>
                                <CheckCircle2 size={20} />
                                Submit Verification Request
                              </>
                            )}
                          </button>
                        </form>
                      </div>
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

            {/* Pending Approvals */}
            {payments.filter(p => p.type === 'manual_deposit' && p.status === 'pending').length > 0 && (
              <section className="bg-amber-50/50 p-10 rounded-[3rem] border border-amber-100 mb-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-amber-900 tracking-tight">Verification Pending</h2>
                    <p className="text-amber-700/60 text-sm font-medium">Your manual deposits are being reviewed by the admin.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {payments.filter(p => p.type === 'manual_deposit' && p.status === 'pending').map((p, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-amber-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 italic font-black">
                          M
                        </div>
                        <div>
                          <p className="font-black text-amber-900 leading-none mb-1">KES {p.amount}</p>
                          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">{new Date(p.date).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className="px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                        Awaiting Admin
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Shopping Cart Section */}
            {cart.length > 0 && (
              <section className="bg-white p-10 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-jungle/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center">
                      <ShoppingCart size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-black tracking-tight">My Shopping Cart</h2>
                      <p className="text-gray-400 text-sm font-medium">{cart.length} items ready for checkout</p>
                    </div>
                  </div>
                  <button 
                    onClick={clearCart}
                    className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-4 mb-10 relative z-10">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100 group">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                          {item.image_url ? (
                            <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 font-black text-xl">
                              {item.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-black">{item.name}</h4>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Qty: {item.quantity} • KES {item.price}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <p className="font-black text-lg text-black">KES {item.price * item.quantity}</p>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-8 border-t border-gray-50 relative z-10">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                    <p className="text-4xl font-black text-black tracking-tighter">KES {totalPrice}</p>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={paying || cart.length === 0}
                    className="w-full sm:w-auto px-10 py-5 bg-jungle text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-2xl shadow-jungle/30 flex items-center justify-center gap-3 disabled:opacity-50 group"
                  >
                    {paying ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        Checkout Now
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </section>
            )}

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
                          <p className="font-black text-lg text-black tracking-tight">
                            {payment.type === 'manual_deposit' ? 'Manual Deposit' : payment.type.charAt(0).toUpperCase() + payment.type.slice(1)}
                          </p>
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

            {/* Community Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <a 
                href="https://chat.whatsapp.com/ByPW29cHfuQKumMT6Bjpu9" 
                target="_blank" 
                rel="noreferrer"
                className="bg-green-600 p-8 rounded-[2.5rem] text-white shadow-xl hover:scale-[1.02] transition-all flex flex-col gap-4 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Share2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Join WhatsApp</h3>
                  <p className="text-white/80 text-xs font-medium">Join our official member community group.</p>
                </div>
              </a>

              <div 
                className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden"
              >
                <div className="w-12 h-12 bg-jungle/10 text-jungle rounded-2xl flex items-center justify-center">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black tracking-tight">Contact Admin</h3>
                  <p className="text-gray-400 text-xs font-medium">Call or SMS for support: <span className="text-black font-black">0112561903</span></p>
                </div>
              </div>
            </div>

            {/* Marketplace */}
            <div className="bg-black p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-8">
                  <Package size={28} />
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-4">Marketplace</h3>
                <p className="text-white/80 text-sm mb-10 leading-relaxed font-medium">
                  Upload your own products to our marketplace. Showcase your brand to the community!
                </p>
                <div className="space-y-4">
                  <button 
                    onClick={() => setShowProductModal(true)}
                    className="w-full py-5 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-jungle hover:text-white transition-all shadow-xl shadow-black/5 flex items-center justify-center gap-3 group"
                  >
                    <Plus size={20} />
                    New Product
                  </button>
                  <button 
                    onClick={() => (window.location.href = '/products')}
                    className="w-full py-5 bg-white/10 text-white border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-3 group"
                  >
                    <Eye size={20} />
                    Browse Shop
                  </button>
                </div>
              </div>
            </div>

            {/* My Uploaded Products List */}
            {myProducts.length > 0 && (
              <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 ml-2">My Products</h4>
                <div className="space-y-4">
                  {myProducts.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div 
                        className="flex items-center gap-4 cursor-pointer hover:bg-white/50 transition-colors p-1 rounded-xl flex-1"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductDetails(true);
                        }}
                      >
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-gray-200">
                          <img src={product.image_url} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-black text-sm text-black">{product.name}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase">KES {product.price}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        product.status === 'approved' ? 'bg-green-50 text-green-600' : 
                        product.status === 'rejected' ? 'bg-red-50 text-red-600' : 
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Product Upload Modal */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="text-3xl font-black text-black tracking-tight">New Product</h3>
                    <p className="text-gray-400 font-medium text-sm">Submit your product for admin approval.</p>
                  </div>
                  <button 
                    onClick={() => setShowProductModal(false)}
                    className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleProductSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Name</label>
                      <input 
                        type="text" 
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-jungle/5 font-medium"
                        placeholder="e.g. Avocado Pack"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (KES)</label>
                      <input 
                        type="number" 
                        required
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-jungle/5 font-medium"
                        placeholder="500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                    <textarea 
                      required
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-jungle/5 font-medium h-32 resize-none"
                      placeholder="Tell us about your product..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Media (Max 4)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {productForm.media?.map((m: any, idx: number) => (
                            <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100 group/item">
                              {m.type === 'image' ? (
                                <img src={m.url} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-black flex items-center justify-center text-white text-[8px] font-black uppercase text-center">Video</div>
                              )}
                              <button 
                                type="button"
                                onClick={() => setProductForm({ ...productForm, media: productForm.media.filter((_: any, i: number) => i !== idx) })}
                                className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover/item:opacity-100 flex items-center justify-center transition-opacity"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <label className={`w-full py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                            productForm.media?.length >= 4 ? 'opacity-50 cursor-not-allowed border-gray-100' : 'border-gray-200 hover:bg-gray-50 hover:border-jungle/30'
                          }`}>
                            {uploading ? <Loader2 className="animate-spin text-jungle" /> : (
                              <>
                                <ImageIcon className="text-gray-400" size={24} />
                                <span className="text-[10px] font-black uppercase text-gray-500 text-center">Add Image</span>
                              </>
                            )}
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              onChange={(e) => handleFileUpload(e, 'image')} 
                              disabled={productForm.media?.length >= 4 || uploading}
                            />
                          </label>
                          <label className={`w-full py-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                            productForm.media?.length >= 4 ? 'opacity-50 cursor-not-allowed border-gray-100' : 'border-gray-200 hover:bg-gray-50 hover:border-jungle/30'
                          }`}>
                            {uploading ? <Loader2 className="animate-spin text-jungle" /> : (
                              <>
                                <Zap className="text-gray-400" size={24} />
                                <span className="text-[10px] font-black uppercase text-gray-500 text-center">Add Video</span>
                              </>
                            )}
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="video/*" 
                              onChange={(e) => handleFileUpload(e, 'video')} 
                              disabled={productForm.media?.length >= 4 || uploading}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={uploading}
                    className="w-full py-6 bg-jungle text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-2xl shadow-jungle/30 flex items-center justify-center gap-3 disabled:opacity-70 group"
                  >
                    {uploading ? <Loader2 className="animate-spin" size={20} /> : (
                      <>
                        Upload Product
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Details Modal */}
      <AnimatePresence>
        {showProductDetails && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[80vh]"
            >
              <div className="md:w-1/2 bg-gray-50 relative group">
                {selectedProduct.media && selectedProduct.media.length > 0 ? (
                  <div className="w-full h-full relative">
                    {selectedProduct.media[activeMediaIndex].type === 'image' ? (
                      <img 
                        src={selectedProduct.media[activeMediaIndex].url} 
                        className="w-full h-full object-cover" 
                        alt={selectedProduct.name} 
                      />
                    ) : (
                      <video 
                        src={selectedProduct.media[activeMediaIndex].url} 
                        controls 
                        className="w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                      />
                    )}
                    {selectedProduct.media.length > 1 && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                        {selectedProduct.media.map((_: any, i: number) => (
                          <button
                            key={i}
                            onClick={() => setActiveMediaIndex(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === activeMediaIndex ? 'bg-jungle w-6' : 'bg-gray-400/50'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {selectedProduct.video_url && (
                        <video 
                          src={selectedProduct.video_url} 
                          controls 
                          className="w-full h-full object-cover"
                          poster={selectedProduct.image_url}
                        />
                    )}
                    {!selectedProduct.video_url && (
                        <img 
                          src={selectedProduct.image_url} 
                          className="w-full h-full object-cover" 
                          alt={selectedProduct.name} 
                        />
                    )}
                  </>
                )}
                <button 
                  onClick={() => {
                    setShowProductDetails(false);
                    setActiveMediaIndex(0);
                  }}
                  className="absolute top-6 left-6 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-black shadow-lg hover:scale-110 transition-transform"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="md:w-1/2 p-10 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      selectedProduct.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {selectedProduct.status}
                    </span>
                    <span className="text-jungle font-black text-xl tracking-tight">KES {selectedProduct.price}</span>
                  </div>
                  <h3 className="text-4xl font-black text-black tracking-tight mb-4">{selectedProduct.name}</h3>
                  <div className="prose prose-sm text-gray-500 font-medium leading-relaxed mb-8">
                    {selectedProduct.description}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Available Stock</p>
                      <p className="text-lg font-black text-black">{selectedProduct.stock} Units</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProductDetails(false)}
                  className="w-full py-6 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-jungle transition-all"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <footer className="mt-20 py-10 border-t border-gray-100 text-center">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
          &copy; 2026 THE JUNGLE SAVINGS CHAMA. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
};

export default Dashboard;
