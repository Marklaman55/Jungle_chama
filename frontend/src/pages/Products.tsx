import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion } from 'motion/react';
import { ShoppingBag, ArrowRight, Loader2, Package, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { apiFetch } from '../lib/api';

const Products: React.FC = () => {
  const { user, getToken, updateBalance } = useAuth();
  const { addToCart, totalItems } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutOrder, setPayoutOrder] = useState<any>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch products
      const productsRes = await apiFetch('/api/products', { headers });
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        if (Array.isArray(productsData)) {
          const approvedProducts = productsData.filter((p: any) => !p.status || p.status === 'approved');
          setProducts(approvedProducts);
        }
      }

      // Fetch pending payout order
      if (user) {
        const payoutRes = await apiFetch('/api/member/payout-orders/pending', { headers });
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
      setLoading(false);
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
      const res = await apiFetch('/api/member/process-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      setNotification({ message: 'An error occurred during redemption.', type: 'error' });
    } finally {
      setRedeeming(false);
    }
  };

  const onAddToCart = (product: any) => {
    addToCart(product);
    setNotification({ message: `${product.name} added to cart!`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const [buying, setBuying] = useState<string | null>(null);

  const handleBuy = async (productId: string) => {
    if (!user) return;
    setBuying(productId);
    try {
      const token = await getToken();
      const res = await apiFetch('/api/admin/products/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
        {/* Floating Cart Info */}
        {totalItems > 0 && (
          <Link to="/dashboard" className="fixed bottom-8 right-8 z-[100] bg-black text-white px-8 py-5 rounded-full shadow-2xl flex items-center gap-4 hover:scale-105 transition-all group">
            <div className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-3 -right-3 w-6 h-6 bg-jungle text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-lg">{totalItems}</span>
            </div>
            <span className="font-black text-sm uppercase tracking-widest mr-2">Open Cart</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        <div className="mb-24 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex flex-col items-center gap-6 mb-10">
              <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/20">
                <ShoppingBag size={14} className="text-jungle" />
                The Jungle Collection
              </div>
              <div className="flex items-center gap-3">
                {user && (
                  <Link to="/profile" className="px-6 py-2 bg-white text-black border border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-jungle hover:text-white transition-all shadow-sm flex items-center gap-2">
                    <Package size={14} /> My Profile
                  </Link>
                )}
                {totalItems > 0 && (
                  <Link to="/dashboard" className="px-6 py-2 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-sm flex items-center gap-2">
                    <ShoppingCart size={14} className="text-jungle" /> Cart ({totalItems})
                  </Link>
                )}
              </div>
            </div>
            <h1 className="text-6xl md:text-8xl font-display uppercase leading-[0.85] tracking-tight text-black mb-8">
              Jungle <br /> <span className="text-jungle">Collection.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Explore our curated items. Complete your savings cycle to claim a reward, <span className="text-black font-black">add to cart</span> for later, or buy directly.
            </p>
          </motion.div>

          <AnimatePresence>
            {payoutOrder && (
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mt-16 p-10 bg-white border border-jungle/20 rounded-[3.5rem] max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-8 shadow-[0_40px_100px_rgba(41,171,135,0.15)] relative overflow-hidden group">
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
              <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`mt-8 p-5 rounded-2xl font-black text-sm uppercase tracking-widest inline-flex items-center gap-3 shadow-xl ${notification.type === 'success' ? 'bg-white border border-green-100 text-green-600' : 'bg-white border border-red-100 text-red-600'}`}>
                {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {notification.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-[3rem] overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.01)] border border-gray-100">
                <div className="aspect-square skeleton"></div>
                <div className="p-10 space-y-4">
                  <div className="h-6 w-3/4 skeleton rounded-lg"></div>
                  <div className="h-3 w-full skeleton rounded-md"></div>
                  <div className="flex justify-between items-center pt-4">
                    <div className="h-3 w-20 skeleton rounded-md"></div>
                    <div className="h-10 w-10 skeleton rounded-xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center gap-6">
            <Package size={64} className="text-gray-100" />
            <p className="text-gray-400 font-black uppercase tracking-widest text-sm">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
            {products.map((product) => (
              <motion.div key={product._id || product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -8 }} className="bg-white rounded-[3rem] overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgb(0,0,0,0.08)] border border-gray-100 group transition-all duration-500 relative">
                <div className="relative aspect-square overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer group" onClick={() => { setSelectedProduct(product); setShowProductDetails(true); }}>
                  {(product.image_url || (product.media?.length > 0 && product.media[0].type === 'image')) ? (
                    <img src={product.image_url || product.media.find((m: any) => m.type === 'image')?.url} alt={product.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer-when-downgrade" onError={(e) => { e.currentTarget.style.display = 'none'; const parent = e.currentTarget.parentElement; if (parent) { const fb = parent.querySelector('.product-fallback'); if (fb) fb.classList.remove('hidden'); } }} />
                  ) : (
                    <div className="flex flex-col items-center gap-3 p-12 text-center">
                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-inner mb-2"><Package size={40} className="text-gray-200" /></div>
                      <span className="text-gray-300 text-4xl font-black uppercase tracking-tighter opacity-40">{product.name.charAt(0)}</span>
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Image Coming Soon</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center hidden sm:flex">
                    <span className="px-6 py-2 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-full flex items-center gap-2"><ArrowRight size={14} /> View Details</span>
                  </div>
                  <div className="absolute top-6 right-6 sm:top-8 sm:right-8 bg-black/80 backdrop-blur-md px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl font-black text-white shadow-xl border border-white/10 tracking-tight text-xs sm:text-sm">KES {product.price}</div>
                  {product.stock <= 0 && <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center"><span className="px-6 py-2 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full">Out of Stock</span></div>}
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent sm:hidden pointer-events-none">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 mb-1"><span className="px-2 py-0.5 bg-jungle/20 text-jungle rounded-full text-[8px] font-black uppercase tracking-widest border border-jungle/30">Jungle Exclusive</span></div>
                      <div className="flex items-end justify-between gap-2">
                        <p className="text-white font-black text-xl uppercase tracking-tight leading-tight line-clamp-2 drop-shadow-md">{product.name}</p>
                        <div className="w-12 h-12 rounded-full bg-jungle flex items-center justify-center shrink-0 shadow-2xl border-4 border-white/20"><ArrowRight size={20} className="text-white" /></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-10 hidden sm:block">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-black text-black tracking-tight line-clamp-1 uppercase group-hover:text-jungle transition-colors">{product.name}</h3>
                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest whitespace-nowrap">Stock: {product.stock}</span>
                  </div>
                  {product.trackerId && <div className="flex items-center gap-1.5 mb-4 group/trk"><span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">REF:</span><span className="text-[9px] font-mono font-bold text-gray-400 group-hover/trk:text-jungle transition-colors">{product.trackerId}</span></div>}
                  <p className="text-gray-400 text-sm mb-10 line-clamp-2 leading-relaxed font-medium">{product.description}</p>
                  <div className="flex flex-col gap-3">
                    <button onClick={() => { setSelectedProduct(product); setShowProductDetails(true); }} className="w-full py-4 bg-gray-50 text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2 border border-gray-100 mb-2 sm:hidden"><ArrowRight size={14} /> View Product</button>
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product); }} className="w-full py-5 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl flex items-center justify-center gap-3 group"><ShoppingCart size={20} className="group-hover:scale-110 transition-transform" /> Add to Cart</button>
                    <button onClick={() => handleBuy(product._id || product.id)} disabled={buying === product.id || product.stock <= 0 || (user?.balance || 0) < product.price} className="w-full py-4 bg-white text-black border border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2 group">
                      {buying === product.id ? <Loader2 className="animate-spin" size={14} /> : 'Buy with Balance'}
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
              <p className="text-white/50 text-lg font-medium leading-relaxed mb-12">Our system is designed to be simple, fair, and incredibly rewarding. We leverage community micro-savings to provide high-value investment returns.</p>
              <Link to="/register" className="inline-flex items-center gap-3 px-10 py-5 bg-jungle text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-xl shadow-jungle/20 group">
                Join the Tribe <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-10">
              {[
                { step: '01', title: 'Start Saving', desc: 'Contribute between KES 200 - 1,000 to grow your chama balance.', icon: Zap, color: 'text-yellow-400' },
                { step: '02', title: 'Community Payouts', desc: 'Transparent random selection for every cycle. Everyone has a fair shot.', icon: ShieldCheck, color: 'text-jungle' },
                { step: '03', title: 'Direct Purchase', desc: 'Use your accumulated balance to buy any product from the collection anytime.', icon: Sparkles, color: 'text-purple-400' },
              ].map((item, i) => (
                <div key={i} className="flex gap-8 group"><div className={`w-16 h-16 bg-white/5 ${item.color} rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500`}><item.icon size={32} /></div><div><h3 className="text-2xl font-black mb-4 tracking-tight uppercase">{item.title}</h3><p className="text-white/40 leading-relaxed font-medium">{item.desc}</p></div></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      <AnimatePresence>
        {showProductDetails && selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => { setShowProductDetails(false); setActiveMediaIndex(0); }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
              <div className="md:w-3/5 bg-gray-100 relative group/media overflow-hidden">
                {selectedProduct.media && selectedProduct.media.length > 0 ? (
                  <div className="w-full h-full relative group">
                    {selectedProduct.media[activeMediaIndex]?.type === 'video' ? (
                      <div className="relative w-full h-full" style={{ paddingTop: '100%' }}>
                        <video key={selectedProduct.media[activeMediaIndex].url} src={selectedProduct.media[activeMediaIndex].url} controls className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop onError={(e) => { e.currentTarget.src = '/placeholder.svg'; e.currentTarget.onerror = null; }} />
                      </div>
                    ) : (
                      <img src={selectedProduct.media[activeMediaIndex].url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={selectedProduct.name} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = '/placeholder.svg'; e.currentTarget.onerror = null; }} />
                    )}
                    {selectedProduct.media.length > 1 && (
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {selectedProduct.media.map((_: any, i: number) => <button key={i} onClick={() => setActiveMediaIndex(i)} className={`w-2 h-2 rounded-full transition-all ${i === activeMediaIndex ? 'bg-jungle w-6 shadow-[0_0_10px_rgba(41,171,135,0.5)]' : 'bg-white/50 backdrop-blur-md'}`} />)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50" style={{ minHeight: '300px' }}>
                    {selectedProduct.image_url && <img src={selectedProduct.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={selectedProduct.name} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; const parent = e.currentTarget.parentElement; const fb = parent?.querySelector('.modal-fallback-text'); if (fb) fb.classList.remove('hidden'); }} />}
                    {!selectedProduct.image_url && <div className="modal-fallback-text w-full h-full flex items-center justify-center bg-gray-50"><span className="text-6xl font-black text-gray-200 uppercase">{selectedProduct.name?.charAt(0)}</span></div>}
                  </div>
                )}
                <button onClick={() => { setShowProductDetails(false); setActiveMediaIndex(0); }} className="absolute top-6 left-6 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 hover:bg-white transition-all z-30"><ArrowRight className="rotate-180" size={24} /></button>
              </div>

              <div className="md:w-2/5 p-8 flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <div className="flex items-center gap-3 mb-6">
                    <span className={`px-5 py-2 bg-jungle/10 text-jungle rounded-full text-[10px] font-black uppercase tracking-widest`}>{selectedProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                    {selectedProduct.trackerId && <span className="text-[8px] font-mono font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">{selectedProduct.trackerId}</span>}
                  </div>
                  <h3 className="text-3xl font-black text-black tracking-tight mb-4">{selectedProduct.name}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8">{selectedProduct.description}</p>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-2xl"><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock</p><p className="text-lg font-black text-black leading-none">{selectedProduct.stock} Left</p></div>
                  </div>
                </div>

                <div className="mt-10 space-y-3">
                  {payoutOrder ? (
                    <button onClick={() => { setShowProductDetails(false); handleRedeem(selectedProduct._id || selectedProduct.id); }} disabled={redeeming || selectedProduct.stock <= 0} className="w-full py-6 bg-jungle text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all disabled:opacity-50 shadow-2xl shadow-jungle/30 flex items-center justify-center gap-3">
                      {redeeming ? <Loader2 className="animate-spin" size={20} /> : 'Claim Reward'}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <button onClick={() => { setShowProductDetails(false); onAddToCart(selectedProduct); }} disabled={selectedProduct.stock <= 0} className="w-full py-6 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition-all disabled:opacity-50 shadow-2xl flex items-center justify-center gap-3">
                        <ShoppingCart size={18} className="group-hover:scale-110 transition-transform" /> Add to Cart
                      </button>
                      <button onClick={() => { setShowProductDetails(false); handleBuy(selectedProduct._id || selectedProduct.id); }} disabled={buying === (selectedProduct._id || selectedProduct.id) || selectedProduct.stock <= 0 || (user?.balance || 0) < selectedProduct.price} className="w-full py-5 bg-white text-black border border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                        {buying === (selectedProduct._id || selectedProduct.id) ? <Loader2 className="animate-spin" size={14} /> : 'Buy Now with Balance'}
                      </button>
                    </div>
                  )}
                  <button onClick={() => setShowProductDetails(false)} className="w-full py-4 bg-white text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-black transition-colors">Back to Collection</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Products;