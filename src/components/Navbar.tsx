import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, GraduationCap, LayoutDashboard, Lightbulb, Home, LogIn, LogOut, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface NavbarProps {
  isAdmin: boolean;
  user: any;
}

export default function Navbar({ isAdmin, user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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
    { name: 'Study Tips', path: '/tips', icon: Lightbulb },
    { name: 'Games', path: '/games', icon: Gamepad2 },
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
          <span className="text-xl font-display font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Study-hub
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-neon-blue flex items-center gap-2",
                location.pathname === link.path ? "text-neon-blue" : "text-white/70"
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.name}
            </Link>
          ))}
          
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-white/40 font-mono hidden lg:block">
                {user.email}
              </span>
              <button onClick={handleLogout} className="btn-neon flex items-center gap-2 py-1.5">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-neon flex items-center gap-2 py-1.5">
              <LogIn className="w-4 h-4" /> Login
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-dark-bg border-b border-white/10 p-4 flex flex-col gap-4 md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-white/70 hover:text-neon-blue flex items-center gap-3"
              >
                <link.icon className="w-5 h-5" />
                {link.name}
              </Link>
            ))}
            {user ? (
              <button onClick={() => { handleLogout(); setIsOpen(false); }} className="btn-neon w-full justify-center">
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)} className="btn-neon w-full text-center">
                Login
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
