import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingBag, User, LogOut, ShieldCheck, Menu, X, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '../context/CartContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, show: isAuthenticated && !isAdmin },
    { name: 'Shop', path: '/products', icon: ShoppingBag, show: !isAdmin },
    { name: 'Admin', path: '/admin', icon: ShieldCheck, show: isAdmin },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-black text-xl group-hover:bg-jungle transition-colors duration-300">J</div>
              <span className="text-2xl font-black tracking-tight text-black">Jungle<span className="text-jungle">Chama</span></span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.filter(item => item.show).map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`relative flex items-center gap-2 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                  location.pathname === item.path ? 'text-jungle' : 'text-gray-400 hover:text-black'
                }`}
              >
                <item.icon size={14} />
                {item.name}
                {location.pathname === item.path && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-6 right-6 h-0.5 bg-jungle"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
            
            <div className="flex items-center gap-4 ml-6 pl-6 border-l border-gray-100">
              {!isAdmin && totalItems > 0 && (
                <Link 
                  to="/dashboard"
                  className="relative p-3 text-gray-400 hover:text-jungle hover:bg-jungle/5 rounded-2xl transition-all"
                >
                  <ShoppingCart size={20} />
                  <span className="absolute top-1 right-1 w-5 h-5 bg-jungle text-white text-[9px] font-black flex items-center justify-center rounded-full shadow-lg border-2 border-white">
                    {totalItems}
                  </span>
                </Link>
              )}
              
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-jungle hover:text-white hover:border-jungle transition-all group"
                  >
                    <User size={14} className="text-jungle group-hover:text-white" />
                    <span className="text-xs font-black uppercase tracking-widest">{user?.name}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/login" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black px-4">Login</Link>
                  <Link to="/register" className="px-8 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-jungle transition-all shadow-xl shadow-black/10">Join Now</Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-black p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navItems.filter(item => item.show).map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-base font-medium text-gray-600 hover:bg-gray-50 rounded-xl"
                >
                  <item.icon size={20} />
                  {item.name}
                </Link>
              ))}
              {!isAdmin && totalItems > 0 && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-3 text-base font-medium text-jungle bg-jungle/5 rounded-xl border border-jungle/10"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={20} />
                    View Cart
                  </div>
                  <span className="bg-jungle text-white px-2 py-0.5 rounded-full text-xs font-black">
                    {totalItems}
                  </span>
                </Link>
              )}
              {isAuthenticated ? (
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-base font-medium text-red-500 hover:bg-red-50 rounded-xl"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              ) : (
                <div className="pt-4 space-y-2">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block w-full text-center py-3 text-base font-medium text-gray-600 bg-gray-50 rounded-xl">Login</Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block w-full text-center py-3 text-base font-medium text-white bg-jungle rounded-xl">Join Now</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </>
    </nav>
  );
};

export default Navbar;
