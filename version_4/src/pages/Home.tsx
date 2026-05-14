import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Heart, Sparkles, MessageSquare, Share2, Phone, ShoppingBag, Package, Loader2, ShoppingCart, CheckCircle2 } from 'lucide-react';

import { useCart } from '../context/CartContext';

const Home: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data.slice(0, 3));
        } else {
          console.error('Expected array of products, got:', data);
          setProducts([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error in Home fetchData:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="overflow-hidden atmosphere-gradient min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 px-4">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-white border border-green-100 text-green-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3"
              >
                <CheckCircle2 size={16} />
                {notification}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 shadow-2xl shadow-black/20">
              <Sparkles size={14} className="text-jungle" />
              The Future of Savings is Here
            </div>
            
            <h1 className="text-[12vw] md:text-[8vw] font-display uppercase leading-[0.85] tracking-[-0.04em] text-black mb-12">
              Save Small. <br />
              <span className="text-jungle">Earn Big.</span> <br />
              Together.
            </h1>

            <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-16 leading-relaxed font-medium">
              Join the modern Gen Z chama. Save between <span className="text-black font-black">KES 200 - 1,000</span> and receive payouts directly into your cycle.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                to="/register"
                className="w-full sm:w-auto px-12 py-6 bg-jungle text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-jungle-dark transition-all shadow-2xl shadow-jungle/30 flex items-center justify-center gap-3 group"
              >
                Start Saving Now
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/products"
                className="w-full sm:w-auto px-12 py-6 bg-white text-black border border-gray-100 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/5"
              >
                Explore Shop
              </Link>
            </div>
          </motion.div>
        </div>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-jungle/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>
      </section>

      {/* Marketplace Section */}
      <section className="py-32 px-4 relative bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div>
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-jungle/10 text-jungle rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                <ShoppingBag size={14} />
                Marketplace Preview
              </div>
              <h2 className="text-4xl md:text-7xl font-display uppercase tracking-tight leading-[0.9] text-black">
                Community <br /> <span className="text-jungle">Marketplace.</span>
              </h2>
            </div>
            <Link 
              to="/products" 
              className="group inline-flex items-center gap-2 text-black font-black text-xs uppercase tracking-[0.2em] hover:text-jungle transition-colors"
            >
              Shop All Products <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden flex flex-col h-full">
                  <div className="aspect-square skeleton"></div>
                  <div className="p-8 space-y-4">
                    <div className="h-6 w-3/4 skeleton rounded-lg"></div>
                    <div className="h-3 w-full skeleton rounded-md"></div>
                    <div className="flex justify-between items-center pt-4">
                      <div className="h-3 w-20 skeleton rounded-md"></div>
                      <div className="h-10 w-10 skeleton rounded-xl"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : products.length > 0 ? (
              products.map((product) => (
                <Link 
                  key={product.id}
                  to="/products"
                  className="group bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all duration-700 flex flex-col h-full"
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden flex items-center justify-center">
                    {(product.image_url || (product.media?.length > 0 && product.media[0].type === 'image')) ? (
                      <img 
                        src={product.image_url || product.media.find((m: any) => m.type === 'image')?.url} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 p-8 text-center">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-inner mb-2">
                          <Package size={32} className="text-gray-200" />
                        </div>
                        <span className="text-gray-300 text-3xl font-black uppercase tracking-tighter opacity-40">{product.name.charAt(0)}</span>
                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Image Coming Soon</p>
                      </div>
                    )}
                    {/* name overlay for mobile with better legibility */}
                    <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent sm:hidden pointer-events-none">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-jungle/20 text-jungle rounded-full text-[8px] font-black uppercase tracking-widest border border-jungle/30">
                            Community Top
                          </span>
                        </div>
                        <div className="flex items-end justify-between gap-2">
                          <p className="text-white font-black text-xl uppercase tracking-tight leading-tight line-clamp-1 drop-shadow-md">
                            {product.name}
                          </p>
                          <div className="w-10 h-10 rounded-full bg-jungle flex items-center justify-center shrink-0 shadow-2xl border-4 border-white/20">
                            <ArrowRight size={16} className="text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-6 right-6 px-4 py-2 bg-black/80 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl border border-white/10">
                      KES {product.price}
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-1 hidden sm:flex">
                    <h3 className="text-xl font-black text-black mb-2 tracking-tight line-clamp-1 uppercase group-hover:text-jungle transition-colors">{product.name}</h3>
                    <p className="text-gray-400 text-xs font-medium line-clamp-2 leading-relaxed mb-8 flex-1">{product.description}</p>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-jungle font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                        View Product <ArrowRight size={14} />
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart(product);
                          setNotification(`${product.name.toUpperCase()} added to cart!`);
                          setTimeout(() => setNotification(null), 3000);
                        }}
                        className="p-3 bg-black text-white rounded-xl hover:bg-jungle transition-all shadow-xl shadow-black/5 active:scale-95 group/btn"
                      >
                        <ShoppingCart size={16} className="group-hover/btn:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <>
                <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-700 md:col-span-2 group">
                  <div className="flex flex-col lg:flex-row gap-12 items-center">
                    <div className="flex-1">
                      <h3 className="text-3xl font-black text-black tracking-tight mb-4 uppercase">Trade within the tribe</h3>
                      <p className="text-gray-500 font-medium leading-relaxed mb-10">
                        Join a trusted ecosystem where members buy and sell high-quality items using their chama payouts or direct balances.
                      </p>
                      <div className="flex flex-wrap gap-4">
                        {['Secured Payments', 'Member Vetted', 'Fast Delivery'].map(tag => (
                          <span key={tag} className="px-4 py-2 bg-white text-gray-400 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="w-full lg:w-72 aspect-square bg-white rounded-[2rem] overflow-hidden relative shadow-inner">
                      <div className="absolute inset-0 bg-jungle/5 flex items-center justify-center">
                        <Package size={80} className="text-jungle opacity-20 group-hover:scale-110 transition-transform duration-700" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black text-white p-10 rounded-[3rem] flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-jungle/20 rounded-full blur-3xl pointer-events-none"></div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight mb-4 uppercase">Direct <br /> Delivery</h3>
                    <p className="text-white/40 text-sm font-medium leading-relaxed">
                      Get your rewards delivered directly to your doorstep after every cycle maturity.
                    </p>
                  </div>
                  <div className="mt-12">
                    <div className="w-16 h-16 bg-jungle text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-jungle/20">
                      <Sparkles size={32} />
                    </div>
                    <Link to="/products" className="text-jungle font-black text-xs uppercase tracking-widest hover:underline">Explore Collection</Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 bg-black text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-jungle/20 via-transparent to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-display uppercase tracking-tight mb-6">Why Jungle Chama?</h2>
            <p className="text-white/40 max-w-xl mx-auto font-medium">We've reimagined traditional savings for the digital age.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'Micro-Savings', desc: 'Just KES 10 a day. Less than a sweet, more than a dream.', icon: Zap, color: 'text-yellow-400' },
              { title: 'Fair Payouts', desc: 'Transparent random selection for every cycle. Everyone has a fair shot.', icon: ShieldCheck, color: 'text-jungle' },
              { title: 'Investment Returns', desc: 'Receive curated investment payouts worth KES 1,000. Delivered to you for free.', icon: Sparkles, color: 'text-purple-400' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm p-12 rounded-[3rem] border border-white/10 hover:border-jungle/50 transition-all duration-500 group"
              >
                <div className={`w-16 h-16 bg-white/5 ${feature.color} rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon size={32} />
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight uppercase">{feature.title}</h3>
                <p className="text-white/40 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-24 px-4 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex items-start gap-8"
            >
              <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center shrink-0">
                <Share2 size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-black tracking-tight mb-2 uppercase">Official Community</h3>
                <p className="text-gray-500 font-medium mb-6">Join our WhatsApp group to connect with other members and receive instant updates.</p>
                <a 
                  href="https://chat.whatsapp.com/ByPW29cHfuQKumMT6Bjpu9" 
                  target="_blank" 
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-green-500 font-black text-sm uppercase tracking-widest hover:gap-4 transition-all"
                >
                  Join WhatsApp Group <ArrowRight size={18} />
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm flex items-start gap-8"
            >
              <div className="w-16 h-16 bg-jungle/10 text-jungle rounded-2xl flex items-center justify-center shrink-0">
                <Phone size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-black tracking-tight mb-2 uppercase">Direct Support</h3>
                <p className="text-gray-500 font-medium mb-6">Having issues? Reach out to our 24/7 admin support line for immediate assistance.</p>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Admin Contact</span>
                  <a href="tel:0112561903" className="text-2xl font-black text-black hover:text-jungle transition-colors">0112561903</a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-4">
        <div className="max-w-6xl mx-auto bg-jungle rounded-[4rem] p-16 sm:p-32 text-center text-white relative overflow-hidden shadow-[0_40px_100px_rgba(41,171,135,0.4)]">
          <div className="relative z-10">
            <h2 className="text-5xl md:text-8xl font-display uppercase leading-none mb-10">Ready to join <br /> the tribe?</h2>
            <p className="text-xl md:text-2xl text-white/80 mb-16 max-w-2xl mx-auto font-medium">
              Join thousands of Gen Z savers building their future, one coin at a time.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-3 px-16 py-7 bg-black text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition-all shadow-2xl group"
            >
              Create Free Account
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-jungle rounded-lg flex items-center justify-center text-white font-bold">J</div>
            <span className="text-xl font-bold tracking-tight">Jungle<span className="text-jungle">Chama</span></span>
          </div>
          <p className="text-gray-400 text-sm mb-8">© 2026 Jungle Chama System. Built for the next generation.</p>
          <div className="flex justify-center gap-6">
            <a href="#" className="text-gray-400 hover:text-jungle transition-colors">Terms</a>
            <a href="#" className="text-gray-400 hover:text-jungle transition-colors">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-jungle transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
