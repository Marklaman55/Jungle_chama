import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion as motion2, AnimatePresence as AnimatePresence2 } from 'motion/react';
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

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const productsRes = await apiFetch('/api/products', { headers });
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        if (Array.isArray(productsData)) {
          const approvedProducts = productsData.filter((p: any) => !p.status || p.status === 'approved');
          setProducts(approvedProducts);
        }
      }

      if (user) {
        const payoutRes = await apiFetch('/api/member/payout-orders/pending', { headers });
        if (payoutRes.ok) {
          const payoutData = await payoutRes.json();
          if (payoutData && payoutData.length > 0) {
            setPayoutOrder(payoutData[0]);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getToken, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBuy = async (productId: string) => {
    if (!user) return;
    setBuying(productId);
    try {
      const token = await getToken();
      const res = await apiFetch('/api/admin/products/buy', {
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

  const onAddToCart = (product: any) => {
    addToCart(product);
    setNotification({ message: `${product.name} added to cart!`, type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const [buying, setBuying] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F8F9FA] atmosphere-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Floating Cart Info */}
        {totalItems > 0 && (
          <Link
            to="/dashboard"
            className="fixed bottom-8 right-8 z-[100] bg-black text-white px-8 py-5 rounded-full shadow-2xl flex items-center gap-4 hover:scale-105 transition-all group"
          >
            <div className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-3 -right-3 w-6 h-6 bg-jungle text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-lg">
                {totalItems}
              </span>
            </div>
            <span className="font-black text-sm uppercase tracking-widest mr-2">Open Cart</span>
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        <div className="mb-24 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col items-center gap-6 mb-10">
              <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/20">
                <ShoppingBag size={14} className="text-jungle" />
                The Jungle Collection
              </div>
              <div className="flex items-center gap-3">
                {user && (
                  <Link
                    to="/profile"
                    className="px-6 py-2 bg-white text-black border border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-jungle hover:text-white transition-all shadow-sm flex items-center gap-2"
                  >
                    <Package size={14} />
                    My Profile
                  </Link>
                )}
                {totalItems > 0 && (
                  <Link
                    to="/dashboard"
                    className="px-6 py-2 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-sm flex items-center gap-2"
                  >
                    <ShoppingCart size={14} className="text-jungle" />
                    Cart ({totalItems})
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
              <motion.div
                key={product._id || product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-[3rem] overflow-hidden shadow-[0_8px_40px_rgb(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgb(0,0,0,0.08)] border border-gray-100 group transition-all duration-500 relative"
              >
                <div
                  className="relative aspect-square overflow-hidden bg-gray-50 uppercase font-black text-gray-200 text-6xl flex items-center justify-center cursor-pointer group"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowProductDetails(true);
                  }}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.querySelector('.fallback-text')?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <div className="fallback-text w-full h-full flex items-center justify-center text-gray-300">
                      {product.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <span className="px-6 py-2 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-full flex items-center gap-2">
                      <ArrowRight size={14} /> View Details
                    </span>
                  </div>
                  <div className="absolute top-6 right-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest text-black shadow-xl border border-white/20">
                    KES {product.price}
                  </div>
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="px-6 py-2 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-black text-black tracking-tight line-clamp-1 uppercase group-hover:text-jungle transition-colors">{product.name}</h3>
                  </div>
                  {product.trackerId && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">REF:</span>
                      <span className="text-[9px] font-mono font-bold text-gray-400">{product.trackerId}</span>
                    </div>
                  )}
                  <p className="text-gray-400 text-xs font-medium line-clamp-2 leading-relaxed mb-6 flex-1">{product.description}</p>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-jungle font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                      View Product <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onAddToCart(product);
                      }}
                      className="p-3 bg-black text-white rounded-xl hover:bg-jungle transition-all shadow-xl shadow-black/5 active:scale-95 group/btn"
                    >
                      <ShoppingCart size={16} className="group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Product Details Modal */}
        <AnimatePresence>
          {showProductDetails && selectedProduct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => { setShowProductDetails(false); setActiveMediaIndex(0); }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="md:w-3/5 bg-gray-100 relative group/media overflow-hidden">
                  {selectedProduct.media && selectedProduct.media.length > 0 ? (
                    <div className="w-full h-full relative group">
                      {selectedProduct.media[activeMediaIndex]?.type === 'video' ? (
                        <div className="relative w-full h-full" style={{ paddingTop: '100%' }}>
                          <video
                            key={selectedProduct.media[activeMediaIndex].url}
                            src={selectedProduct.media[activeMediaIndex].url}
                            controls
                            className="absolute inset-0 w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                          />
                        </div>
                      ) : (
                        <img
                          src={selectedProduct.media[activeMediaIndex].url}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          alt={selectedProduct.name}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      )}
                      {selectedProduct.media.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                          {selectedProduct.media.map((_: any, i: number) => (
                            <button
                              key={i}
                              onClick={() => setActiveMediaIndex(i)}
                              className={`w-2 h-2 rounded-full transition-all ${i === activeMediaIndex ? 'bg-jungle w-6 shadow-[0_0_10px_rgba(41,171,135,0.5)]' : 'bg-white/50 backdrop-blur-md'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50" style={{ minHeight: '300px' }}>
                      {selectedProduct.image_url ? (
                        <img
                          src={selectedProduct.image_url}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          alt={selectedProduct.name}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <span className="text-6xl font-black text-gray-200 uppercase">{selectedProduct.name?.charAt(0)}</span>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => { setShowProductDetails(false); setActiveMediaIndex(0); }}
                    className="absolute top-6 left-6 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 hover:bg-white transition-all z-30"
                  >
                    <ArrowRight className="rotate-180" size={24} />
                  </button>
                </div>

                <div className="md:w-2/5 p-8 flex flex-col">
                  <div className="flex-1 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="px-5 py-2 bg-jungle/10 text-jungle rounded-full text-[10px] font-black uppercase tracking-widest">
                        {selectedProduct.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                      {selectedProduct.trackerId && (
                        <span className="text-[8px] font-mono font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">{selectedProduct.trackerId}</span>
                      )}
                    </div>
                    <h3 className="text-3xl font-black text-black tracking-tight mb-4">{selectedProduct.name}</h3>
                    <p className="text-3xl font-black text-jungle mb-6">KES {selectedProduct.price}</p>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8">{selectedProduct.description}</p>

                    {user && (
                      <>
                        <button
                          onClick={() => {
                            handleBuy(selectedProduct.id || selectedProduct._id);
                            setShowProductDetails(false);
                          }}
                          disabled={buying === selectedProduct.id || selectedProduct.stock <= 0 || (user?.balance || 0) < selectedProduct.price}
                          className="w-full py-5 bg-jungle text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all disabled:opacity-50 shadow-xl shadow-jungle/20 flex items-center justify-center gap-3 group mb-4"
                        >
                          {buying === selectedProduct.id ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                              Buy Directly
                              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            onAddToCart(selectedProduct);
                            setShowProductDetails(false);
                          }}
                          disabled={selectedProduct.stock <= 0}
                          className="w-full py-4 bg-black text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl flex items-center justify-center gap-3 group"
                        >
                          <ShoppingCart size={18} className="group-hover:scale-110 transition-transform" />
                          Add to Cart
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Products;