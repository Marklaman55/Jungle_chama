import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../lib/api';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'marketplace' | 'profile'>('overview');

  const [paymentAmount, setPaymentAmount] = useState('200');

  const fetchData = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch member stats
      const statsRes = await apiFetch('/api/member/stats', { headers });
      if (statsRes.ok) setStats(await statsRes.json());

      // Fetch payments
      const paymentsRes = await apiFetch('/api/payments/my', { headers });
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
      
      // Fetch system config
      const configRes = await apiFetch('/api/admin/system', { headers });
      if (configRes.ok) setSystemConfig(await configRes.json());

      // Fetch user products from public API instead of admin-only
      const productsRes = await apiFetch('/api/products', { headers });
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
        const res = await apiFetch('/api/admin/products/buy', {
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
    if (!mpesaPhone.trim()) {
      setNotification({ message: "Please enter a phone number.", type: 'error' });
      return;
    }
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setNotification({ message: "Please enter a valid amount.", type: 'error' });
      return;
    }
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
      
      const res = await apiFetch('/api/payment/mpesa/stk-push', {
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
      const res = await apiFetch('/api/member/manual-deposit', {
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
      const res = await apiFetch('/api/admin/upload', {
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
      const res = await apiFetch('/api/member/products', {
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
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 ${
                activeTab === 'profile' ? 'bg-jungle text-white' : 'bg-white text-black border border-gray-100 hover:bg-gray-50'
              }`}
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: Zap },
            { id: 'marketplace', label: 'My Products', icon: Package },
            { id: 'profile', label: 'Account Settings', icon: UserIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-black text-white shadow-xl shadow-black/10' 
                  : 'bg-white text-gray-400 hover:bg-gray-50'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Dashboard Layout */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Main Focus */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* 1. STATUS & BALANCE OVERVIEW (Unified) */}
            <div className="bg-black text-white p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-80 h-80 bg-jungle/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] group-hover:bg-jungle/20 transition-all duration-1000"></div>
              
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-3">Total Wallet Balance</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-6xl font-black tracking-tighter">KES {stats?.balance?.toLocaleString() || 0}</span>
                      <div className="w-3 h-3 rounded-full bg-jungle animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                      <Trophy size={16} className="text-jungle" />
                      <div>
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Queue Position</p>
                        <p className="text-sm font-black tracking-tight">#{user?.payout_number || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="px-6 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                      <Users size={16} className="text-jungle" />
                      <div>
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Active Tribe</p>
                        <p className="text-sm font-black tracking-tight">Level 1</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black tracking-tight">Cycle Progress</h3>
                    <span className="text-[10px] font-black text-jungle uppercase tracking-widest bg-jungle/10 px-3 py-1 rounded-full">
                      {stats?.currentCycle?.status === 'active' ? `Day ${paidDaysCount || 0} / 10` : 'On Break'}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="h-4 w-full bg-white/10 rounded-full overflow-hidden p-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-jungle rounded-full shadow-[0_0_15px_rgba(41,171,135,0.4)]"
                      />
                    </div>
                    <p className="text-xs text-white/50 font-medium text-center">
                      {10 - (paidDaysCount || 0)} more payments until your next investment return.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. ACTIONS: Finance Center */}
            <div className="bg-white p-10 rounded-[3.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.02)] border border-gray-100">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-jungle/10 rounded-2xl flex items-center justify-center text-jungle">
                    <Zap size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-black tracking-tight">Savings & Contributions</h2>
                    <p className="text-gray-400 text-sm font-medium">Top up your wallet via M-Pesa STK push or manual deposit.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">M-Pesa Phone Number</label>
                    <div className="relative group">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm group-focus-within:text-jungle transition-colors">+254</span>
                      <input 
                        type="tel" 
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        className="w-full pl-16 pr-6 py-5 bg-gray-50 border border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-jungle/20 focus:ring-4 focus:ring-jungle/5 font-black text-lg transition-all"
                        placeholder="712345678"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Daily Save Amount (KES)</label>
                    <div className="relative group">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl group-focus-within:text-jungle transition-colors">KES</span>
                      <input 
                        type="number" 
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full pl-20 pr-6 py-5 bg-gray-50 border border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-jungle/20 focus:ring-4 focus:ring-jungle/5 font-black text-3xl transition-all"
                        placeholder="200"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 justify-end">
                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="w-full py-6 bg-jungle text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-[0_20px_40px_rgba(41,171,135,0.2)] flex items-center justify-center gap-3 disabled:opacity-50 group hover:scale-[1.02] active:scale-95"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Initiating...</span>
                      </>
                    ) : (
                      <>
                        <span>Save Instantly</span>
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">or use the manual methods below</p>
                </div>
              </div>
            </div>

            {/* 3. PENDING & CART (Contextual) */}
            <AnimatePresence>
              {(payments.filter(p => p.type === 'manual_deposit' && p.status === 'pending').length > 0 || cart.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  {/* Pending Manual */}
                  {payments.filter(p => p.type === 'manual_deposit' && p.status === 'pending').length > 0 && (
                    <div className="bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 flex flex-col justify-between">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                          <Clock size={20} />
                        </div>
                        <h4 className="font-black text-amber-900 tracking-tight">Verifying Deposits</h4>
                      </div>
                      <div className="space-y-3">
                        {payments.filter(p => p.type === 'manual_deposit' && p.status === 'pending').slice(0, 2).map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-xs font-bold text-amber-700">
                            <span>KES {p.amount}</span>
                            <span className="opacity-50">Pending Admin</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cart Summary */}
                  {cart.length > 0 && (
                    <Link to="/dashboard" onClick={(e) => { e.preventDefault(); document.getElementById('cart-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 flex flex-col justify-between group">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ShoppingCart size={20} />
                        </div>
                        <h4 className="font-black text-blue-900 tracking-tight">Shopping Cart</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-blue-900">KES {totalPrice}</span>
                        <ArrowRight size={20} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 4. HISTORY (Unified List) */}
            <section className="bg-white p-10 rounded-[3.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.02)] border border-gray-100">
               <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-black tracking-tight">Recent Activity</h2>
                <div className="flex gap-2">
                  <span className="px-4 py-1.5 bg-gray-50 text-gray-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100">
                    {payments.length} Records
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {payments.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center gap-4">
                    <History size={48} className="text-gray-100" />
                    <p className="text-gray-400 font-bold">No activity recorded yet.</p>
                  </div>
                ) : (
                  payments.slice(0, 8).map((payment, index) => (
                    <div key={payment.id || index} className="flex items-center justify-between p-6 hover:bg-gray-50 rounded-2xl transition-all group">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                          payment.type === 'deposit' ? 'bg-green-50 text-green-500' : 
                          payment.type === 'payout' ? 'bg-jungle/10 text-jungle' : 
                          'bg-amber-50 text-amber-500'
                        }`}>
                          {payment.type === 'deposit' ? <ArrowUpRight size={24} /> : 
                           payment.type === 'payout' ? <Trophy size={24} /> : 
                           <Wallet size={24} />}
                        </div>
                        <div>
                          <p className="font-black text-black leading-none mb-1">
                            {payment.type === 'manual_deposit' ? 'Manual Verification' : 
                             payment.type === 'deposit' ? 'Daily Contribution' : 
                             'Community Payout'}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                            {format(new Date(payment.date), 'MMM d • h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-lg leading-none mb-1 ${
                          payment.type === 'deposit' || payment.type === 'manual_deposit' ? 'text-black' : 'text-jungle'
                        }`}>
                          {payment.type === 'deposit' || payment.type === 'manual_deposit' ? '+' : ''}KES {payment.amount}
                        </p>
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          payment.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Secondary Info & Actions */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* MANUAL PAYMENT CARD */}
            <div id="manual-payment-section" className="bg-amber-600 text-white p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Wallet size={24} />
                  </div>
                  <h3 className="text-xl font-black tracking-tight">Manual Payout</h3>
                </div>

                <div className="bg-black/20 backdrop-blur-md rounded-3xl p-6 border border-white/10 mb-8">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">{systemConfig?.paymentType || 'Payment'} Number</p>
                  <p className="text-3xl font-black tracking-tighter text-amber-300">{systemConfig?.paymentNumber || 'N/A'}</p>
                </div>

                <div className="space-y-4">
                   <div className="grid grid-cols-1 gap-3">
                    <input 
                      type="number" 
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="w-full px-6 py-4 bg-white/10 border border-white/5 rounded-2xl outline-none focus:bg-white/20 font-black text-white placeholder:text-white/30"
                      placeholder="Amount Paid"
                    />
                    <input 
                      type="text" 
                      value={manualMessage}
                      onChange={(e) => setManualMessage(e.target.value)}
                      className="w-full px-6 py-4 bg-white/10 border border-white/5 rounded-2xl outline-none focus:bg-white/20 font-black text-white placeholder:text-white/30"
                      placeholder="Paste M-Pesa Message"
                    />
                  </div>
                  <button 
                    onClick={handleManualDeposit}
                    disabled={paying}
                    className="w-full py-5 bg-white text-amber-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-50 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    Submit Proof
                  </button>
                  <button 
                    onClick={() => {
                      if (systemConfig?.paymentNumber) {
                        navigator.clipboard.writeText(systemConfig.paymentNumber);
                        setNotification({ message: 'Payment number copied!', type: 'success' });
                      }
                    }}
                    className="w-full py-4 text-white/60 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Copy size={12} />
                    Copy Payment Details
                  </button>
                </div>
              </div>
            </div>

            {/* SHOP & UPLOAD */}
            <div className="bg-white p-10 rounded-[3.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col gap-8">
              <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-xl">
                <Package size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-black tracking-tight leading-tight">Member <br /> Marketplace.</h3>
                <p className="text-gray-400 text-sm font-medium mt-2">Sell your products to the community or browse our latest collection.</p>
              </div>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowProductModal(true)}
                  className="w-full py-5 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl flex items-center justify-center gap-3 group hover:scale-[1.02] active:scale-95"
                >
                  <Plus size={18} />
                  Add My Product
                </button>
                <Link 
                  to="/products"
                  className="w-full py-5 bg-gray-50 text-gray-500 border border-gray-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-3 group"
                >
                  <Eye size={18} />
                  Browse Products
                </Link>
              </div>
            </div>

            {/* COMMUNITY LINKS */}
            <div className="bg-jungle text-white p-10 rounded-[3.5rem] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <Share2 size={32} className="text-white/20 mb-6" />
              <h3 className="text-xl font-black tracking-tight mb-4">Official Community</h3>
              <p className="text-white/80 text-xs font-medium mb-8 leading-relaxed">Join the conversation on WhatsApp and stay updated on cycle shifts.</p>
              <a 
                href="https://chat.whatsapp.com/ByPW29cHfuQKumMT6Bjpu9" 
                target="_blank" 
                rel="noreferrer"
                className="w-full py-4 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Join WhatsApp Group
              </a>
            </div>

          </div>
        </div>
        )}

        {/* Marketplace Tab content */}
        {activeTab === 'marketplace' && (
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.02)] border border-gray-100">
               <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center">
                    <Package size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-black tracking-tight">My Marketplace Products</h2>
                    <p className="text-gray-400 text-sm font-medium">Manage the products you've submitted to the comunidad.</p>
                  </div>
                </div>
                <button 
                   onClick={() => setShowProductModal(true)}
                   className="px-8 py-4 bg-jungle text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-jungle-dark transition-all flex items-center gap-2 shadow-lg shadow-jungle/20"
                >
                  <Plus size={18} />
                  New Product
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProducts.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                    <Package size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No products uploaded yet</p>
                  </div>
                ) : (
                  myProducts.map((p) => (
                    <div key={p.id || p._id} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:shadow-black/5 transition-all">
                      <div className="aspect-square bg-gray-50 relative overflow-hidden">
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.querySelector('.myprod-fallback')?.classList.remove('hidden'); }} />
                         <div className={`myprod-fallback w-full h-full flex items-center justify-center text-gray-300 ${p.image_url ? 'hidden' : ''}`}>
                           {p.name?.charAt(0)}
                         </div>
                        <div className="absolute top-4 right-4">
                          <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-white shadow-lg ${
                            p.status === 'approved' ? 'text-green-600' : 'text-amber-600'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h4 className="font-black text-black text-lg mb-1">{p.name}</h4>
                        <p className="text-jungle font-black">KES {p.price}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab content */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto">
             <div className="bg-white rounded-[3.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
                <div className="bg-black p-12 text-white text-center">
                   <div className="w-24 h-24 bg-white/10 rounded-3xl mx-auto mb-6 flex items-center justify-center border border-white/20">
                      <UserIcon size={48} className="text-jungle" />
                   </div>
                   <h2 className="text-3xl font-black tracking-tight mb-2">{user?.name}</h2>
                   <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Member ID: {user?.userId}</p>
                </div>
                <div className="p-12 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</p>
                        <div className="p-5 bg-gray-50 rounded-2xl font-bold text-gray-400 border border-transparent">{user?.email}</div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Joined</p>
                        <div className="p-5 bg-gray-50 rounded-2xl font-bold text-gray-400 border border-transparent">2024 MEMBER</div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</p>
                        <div className="p-5 bg-gray-50 rounded-2xl font-bold text-black border border-transparent">{user?.phone}</div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Wallet Balance</p>
                        <div className="p-5 bg-jungle/5 rounded-2xl font-black text-jungle border border-jungle/10 flex items-center justify-between">
                          <span>KES {user?.balance?.toLocaleString()}</span>
                          <Wallet size={16} />
                        </div>
                      </div>
                   </div>
                   <div className="pt-8 border-t border-gray-100">
                      <p className="text-xs text-gray-400 font-medium leading-relaxed">
                        To update your profile information, please visit the full <Link to="/profile" className="text-jungle font-black underline">Account Settings</Link> page. This dashboard view provides a summary of your identity.
                      </p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Shopping Cart Sticky (Hidden when normal cart is visible) */}
        {cart.length > 0 && (
          <div id="cart-section" className="mt-12">
            <section className="bg-white p-10 rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-jungle/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-xl">
                      <ShoppingCart size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-black tracking-tight">Checkout Items</h2>
                      <p className="text-gray-400 text-sm font-medium">Verify your items before confirming the purchase.</p>
                    </div>
                  </div>
                  <button 
                    onClick={clearCart}
                    className="px-6 py-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-4 mb-12 relative z-10">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 group transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-900/5">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm p-2 flex items-center justify-center">
                          {item.image_url ? (
<img src={item.image_url} className="w-full h-full object-contain" alt={item.name} referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.querySelector('.cart-fallback')?.classList.remove('hidden'); }} />
                             <div className={`cart-fallback w-full h-full flex items-center justify-center text-gray-300 ${item.image_url ? 'hidden' : ''}`}>
                               {item.name.charAt(0)}
                             </div>
                        </div>
                        <div>
                          <h4 className="font-black text-black text-xl mb-1">{item.name}</h4>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] flex items-center gap-3">
                            Qty: {item.quantity} 
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span> 
                            KES {item.price} Each
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Subtotal</p>
                          <p className="font-black text-2xl text-black">KES {item.price * item.quantity}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="p-4 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-10 pt-10 border-t border-gray-100 relative z-10">
                  <div className="flex items-center gap-8">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grand Total</p>
                      <p className="text-5xl font-black text-black tracking-tighter">KES {totalPrice.toLocaleString()}</p>
                    </div>
                    <div className="h-12 w-[1px] bg-gray-100 hidden sm:block"></div>
                    <div className="hidden sm:block">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Wallet Balance</p>
                      <p className={`text-xl font-black ${user && user.balance >= totalPrice ? 'text-jungle' : 'text-red-500'}`}>
                        KES {user?.balance?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCheckout}
                    disabled={paying || cart.length === 0 || (user?.balance || 0) < totalPrice}
                    className="w-full sm:w-auto px-16 py-6 bg-black text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 group hover:scale-[1.02]"
                  >
                    {paying ? <Loader2 className="animate-spin" size={24} /> : (
                      <>
                        Pay with Balance
                        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </section>
          </div>
        )}
      </div>

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl p-10"
            >
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-jungle/10 text-jungle rounded-[2rem] flex items-center justify-center mx-auto">
                  <Wallet size={40} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-black tracking-tight">Confirm Payment</h3>
                  <p className="text-gray-400 font-medium mt-2 text-sm">
                    You are about to initiate an M-Pesa STK push for 
                    <span className="text-black font-black block text-xl mt-1">KES {paymentAmount}</span>
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-2xl text-left space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">M-Pesa Recipient</p>
                  <p className="text-lg font-black text-black leading-none">254{mpesaPhone.replace(/^0/, '')}</p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => {
                        setShowConfirm(false);
                        executePayment();
                    }}
                    disabled={paying}
                    className="flex-1 py-5 bg-jungle text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-xl shadow-jungle/20 flex items-center justify-center gap-2"
                  >
                    {paying ? <Loader2 className="animate-spin" size={18} /> : 'Confirm & Pay'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="px-8 py-5 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                         alt={selectedProduct.name}
                         loading="lazy"
                         referrerPolicy="no-referrer"
                         onError={(e) => {
                           e.currentTarget.src = '/placeholder.svg';
                           e.currentTarget.onerror = null;
                         }}
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
                           onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.querySelector('.dashprod-fallback-video')?.classList.remove('hidden'); }}
                         />
                       )}
                       {!selectedProduct.video_url && (
                         <img
                           src={selectedProduct.image_url}
                           className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                           alt={selectedProduct.name}
                           loading="lazy"
                           referrerPolicy="no-referrer"
                           onError={(e) => {
                             e.currentTarget.style.display = 'none';
                             e.currentTarget.parentElement?.querySelector('.dashprod-fallback')?.classList.remove('hidden');
                           }}
                         />
                       )}
                       <div className={`dashprod-fallback w-full h-full flex items-center justify-center bg-gray-50 ${selectedProduct.image_url && !selectedProduct.video_url ? 'hidden' : ''}`}>
                         <span className="text-6xl font-black text-gray-200 uppercase">{selectedProduct.name?.charAt(0)}</span>
                       </div>
                       <div className={`dashprod-fallback-video w-full h-full flex items-center justify-center bg-gray-50 ${selectedProduct.video_url ? 'hidden' : ''}`}>
                         <span className="text-6xl font-black text-gray-200 uppercase">{selectedProduct.name?.charAt(0)}</span>
                       </div>
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
