import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ArrowRight, Loader2, Package, CheckCircle2, AlertCircle } from 'lucide-react';

const Products: React.FC = () => {
  const { user, getToken, updateBalance } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutOrder, setPayoutOrder] = useState<any>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch products
      const productsRes = await fetch('/api/products', { headers });
      const productsData = await productsRes.json();
      if (productsRes.ok) {
        setProducts(productsData);
      }

      // Fetch pending payout order
      if (user) {
        const payoutRes = await fetch('/api/member/payout-orders/pending', { headers });
        const payoutData = await payoutRes.json();
        if (payoutRes.ok && payoutData.length > 0) {
          setPayoutOrder(payoutData[0]);
        } else {
          setPayoutOrder(null);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRedeem = async (productId: string) => {
    if (!payoutOrder) return;
    setRedeeming(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/member/process-payout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId, payoutOrderId: payoutOrder.id })
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ message: 'Payout processed successfully! Your product is on the way.', type: 'success' });
        fetchData();
      } else {
        setNotification({ message: data.error || 'Payout processing failed', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: 'An error occurred during redemption.', type: 'error' });
    } finally {
      setRedeeming(false);
    }
  };

  const [buying, setBuying] = useState<string | null>(null);

  const handleBuy = async (productId: string) => {
    if (!user) return;
    setBuying(productId);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/products/buy', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId, userId: user.userId })
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ message: 'Purchase successful!', type: 'success' });
        updateBalance(data.newBalance);
        fetchData();
      } else {
        setNotification({ message: data.error || 'Purchase failed', type: 'error' });
      }
    } catch (err) {
      setNotification({ message: 'Error processing purchase', type: 'error' });
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] atmosphere-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="mb-24 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 shadow-2xl shadow-black/20">
              <ShoppingBag size={14} className="text-jungle" />
              The Jungle Collection
            </div>
            <h1 className="text-6xl md:text-8xl font-display uppercase leading-[0.85] tracking-tight text-black mb-8">
              Jungle <br /> <span className="text-jungle">Collection.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Explore our curated items. Complete your savings cycle to claim a reward or <span className="text-black font-black">buy directly</span> using your balance.
            </p>
          </motion.div>

          <AnimatePresence>
            {payoutOrder && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-16 p-10 bg-white border border-jungle/20 rounded-[3.5rem] max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-8 shadow-[0_40px_100px_rgba(41,171,135,0.15)] relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-jungle/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-jungle/10 transition-colors duration-700"></div>
                <div className="w-20 h-20 bg-jungle text-white rounded-[2rem] flex items-center justify-center flex-shrink-0 shadow-2xl shadow-jungle/30 relative z-10 animate-bounce">
                  <CheckCircle2 size={40} />
                </div>
                <div className="text-center sm:text-left relative z-10">
                  <h3 className="text-3xl font-black text-jungle tracking-tight mb-2 uppercase">Investment Matured!</h3>
                  <p className="text-gray-400 font-medium">You have a pending payout. Select any product below to process it instantly.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`mt-8 p-5 rounded-2xl font-black text-sm uppercase tracking-widest inline-flex items-center gap-3 shadow-xl ${
                  notification.type === 'success' ? 'bg-white border border-green-100 text-green-600' : 'bg-white border border-red-100 text-red-600'
                }`}
              >
                {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {notification.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="animate-spin text-jungle" size={56} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center gap-6">
            <Package size={64} className="text-gray-100" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -12 }}
                className="bg-white rounded-[3rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_25px_60px_rgb(0,0,0,0.08)] border border-gray-50 group transition-all duration-500"
              >
                <div className="relative h-80 overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-8 right-8 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl font-black text-black shadow-xl border border-white/20 tracking-tight">
                    KES {product.price}
                  </div>
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="px-6 py-2 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="p-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-black text-black tracking-tight">{product.name}</h3>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                      Stock: {product.stock}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm mb-10 line-clamp-2 leading-relaxed font-medium">
                    {product.description}
                  </p>
                  <div className="flex flex-col gap-3">
                    {payoutOrder && (
                      <button 
                        onClick={() => handleRedeem(product.id)}
                        disabled={redeeming || product.stock <= 0}
                        className="w-full py-5 bg-jungle text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all disabled:opacity-50 shadow-xl shadow-jungle/20 flex items-center justify-center gap-3 group"
                      >
                        {redeeming ? <Loader2 className="animate-spin" size={20} /> : (
                          <>
                            Claim Reward
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleBuy(product.id)}
                      disabled={buying === product.id || product.stock <= 0 || (user?.balance || 0) < product.price}
                      className="w-full py-5 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition-all disabled:opacity-50 shadow-xl flex items-center justify-center gap-3 group"
                    >
                      {buying === product.id ? <Loader2 className="animate-spin" size={20} /> : (
                        <>
                          Buy with Balance
                          <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-32 bg-black text-white p-12 sm:p-24 rounded-[4rem] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-jungle/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl font-black mb-10 tracking-tight leading-tight">How the Jungle <br /> Rewards You</h2>
              <p className="text-white/50 text-lg font-medium leading-relaxed mb-12">
                Our system is designed to be simple, fair, and incredibly rewarding. We leverage community micro-savings to provide high-value investment returns.
              </p>
              <Link to="/register" className="inline-flex items-center gap-3 px-10 py-5 bg-jungle text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-xl shadow-jungle/20 group">
                Join the Tribe
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="space-y-10">
              {[
                { step: '01', title: 'Start Saving', desc: 'Contribute between KES 200 - 1,000 to grow your chama balance.' },
                { step: '02', title: 'Community Payouts', desc: 'Regular random selections reward active members with premium products.' },
                { step: '03', title: 'Direct Purchase', desc: 'Use your accumulated balance to buy any product from the collection anytime.' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-8 group">
                  <div className="text-4xl font-black text-jungle/30 group-hover:text-jungle transition-colors duration-500">{item.step}</div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-2 tracking-tight">{item.title}</h3>
                    <p className="text-white/40 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
