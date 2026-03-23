import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, GraduationCap, LayoutDashboard, Lightbulb, Home, LogIn, LogOut, Gamepad2, Search, MessageSquare, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import SearchModal from './SearchModal';

interface NavbarProps {
  isAdmin: boolean;
  user: any;
}

export default function Navbar({ isAdmin, user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Classes', path: '/classes', icon: GraduationCap },
    { name: 'Tests', path: '/tests', icon: ClipboardList },
    { name: 'Study Tips', path: '/tips', icon: Lightbulb },
    { name: 'Games', path: '/games', icon: Gamepad2 },
    { name: 'Wall', path: '/comments', icon: MessageSquare },
    ...(isAdmin ? [{ name: 'Dashboard', path: '/admin', icon: LayoutDashboard }] : []),
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-3",
      isScrolled ? "bg-dark-bg/80 backdrop-blur-md border-b border-white/10" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)] group-hover:scale-110 transition-transform">
            <GraduationCap className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-display font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 leading-none">
              Study-hub
            </span>
            <span className="text-[8px] text-neon-blue font-bold uppercase tracking-[0.2em] mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
              by Vijay Ninama
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-white/70 hover:text-neon-blue transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-neon-blue flex items-center gap-2 whitespace-nowrap",
                location.pathname === link.path ? "text-neon-blue" : "text-white/70"
              )}
            >
              <link.icon className="w-4 h-4 flex-shrink-0" />
              {link.name}
            </Link>
          ))}
          
          {user ? (
            <div className="flex items-center gap-4 ml-4">
              <span className="text-xs text-white/40 font-mono hidden xl:block max-w-[150px] truncate">
                {user.email}
              </span>
              <button onClick={handleLogout} className="btn-neon flex items-center gap-2 py-1.5 px-4 text-xs">
                <LogOut className="w-3 h-3" /> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-neon flex items-center gap-2 py-1.5 px-4 text-xs ml-4">
              <LogIn className="w-3 h-3" /> Login
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button onClick={() => setIsSearchOpen(true)} className="text-white/70 hover:text-neon-blue p-2">
            <Search size={20} />
          </button>
          <button className="text-white p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-[64px] bg-dark-bg border-b border-white/10 p-6 flex flex-col gap-4 lg:hidden shadow-2xl z-[100]"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-white/70 hover:text-neon-blue flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-all"
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/5">
              {user ? (
                <div className="flex flex-col gap-4">
                  <div className="px-2 text-xs text-white/40 font-mono truncate">
                    {user.email}
                  </div>
                  <button onClick={() => { handleLogout(); setIsOpen(false); }} className="btn-neon w-full justify-center py-3">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)} className="btn-neon w-full text-center py-3 flex justify-center items-center">
                  <LogIn className="w-4 h-4 mr-2" /> Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
