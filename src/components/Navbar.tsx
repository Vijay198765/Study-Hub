import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, GraduationCap, LayoutDashboard, Lightbulb, Home, LogIn, LogOut, Gamepad2, Search, MessageSquare, ClipboardList, Trophy, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, convertDriveUrl } from '../lib/utils';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import SearchModal from './SearchModal';
import { toast } from 'sonner';

interface NavbarProps {
  isAdmin: boolean;
  isSpecialAdmin?: boolean;
  user: any;
  siteConfig?: any;
}

export default function Navbar({ isAdmin, isSpecialAdmin, user, siteConfig }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user?.name) {
      setNewName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setIsScrolled(window.scrollY > 20);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('isSpecialLogin');
      localStorage.removeItem('isAdminLogin');
      localStorage.removeItem('studentName');
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim() || !user) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: newName.trim()
      });
      toast.success('Name updated successfully!');
      setIsProfileOpen(false);
    } catch (error) {
      console.error("Error updating name:", error);
      toast.error('Failed to update name');
    } finally {
      setIsUpdating(false);
    }
  };

  const isSuperAdmin = user?.email?.toLowerCase() === 'vijayninama683@gmail.com' || user?.email?.toLowerCase() === 'tagoreteam2025@gmail.com';
  const showDashboard = isSuperAdmin || (isAdmin && !isSpecialAdmin) || (isSpecialAdmin && localStorage.getItem('showDashboardLinkForSecret') === 'true' && siteConfig?.showDashboardLinkForSecret !== false);

  const navLinks = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Classes', path: '/classes', icon: GraduationCap },
    { name: 'Tests', path: '/tests', icon: ClipboardList },
    { name: 'Games', path: '/games', icon: Gamepad2 },
    { name: 'Live Club', path: '/live-club', icon: MessageSquare },
    ...(showDashboard ? [{ name: 'Dashboard', path: '/admin', icon: LayoutDashboard }] : []),
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-3",
      isScrolled ? "bg-dark-card/95 backdrop-blur-md border-b border-white/10" : "bg-transparent"
    )}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20 group-hover:scale-110 transition-transform overflow-hidden">
            {siteConfig?.siteLogo ? (
              <img 
                src={convertDriveUrl(siteConfig.siteLogo)} 
                alt="Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <GraduationCap className="text-white w-6 h-6" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-display font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-t from-white/90 to-white leading-none">
              {siteConfig?.siteName || 'Study-hub'}
            </span>
            <span className="text-[8px] text-neon-blue font-bold uppercase tracking-[0.2em] mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
              by {siteConfig?.adminName || 'Vijay'} {siteConfig?.coOwnerName && `& ${siteConfig.coOwnerName}`}
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
                "nav-link text-sm font-medium transition-colors hover:text-neon-blue flex items-center gap-2 whitespace-nowrap",
                location.pathname === link.path ? "text-neon-blue" : "text-white/70"
              )}
            >
              <link.icon className="w-4 h-4 flex-shrink-0" />
              {link.name}
            </Link>
          ))}
          
          {user ? (
            <div className="flex items-center gap-4 ml-4">
              <button 
                onClick={() => {
                  setNewName(user.name);
                  setIsProfileOpen(true);
                }}
                className="flex items-center gap-2 text-white/70 hover:text-neon-blue transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center relative">
                  {user.photoURL ? (
                    <img src={convertDriveUrl(user.photoURL)} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={16} />
                  )}
                  {user.isLegend && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-blue rounded-full border-2 border-dark-card flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium hidden xl:block leading-none">{user.name}</span>
                  {user.isLegend && (
                    <span className="text-[8px] text-neon-blue font-bold uppercase tracking-widest hidden xl:block mt-0.5">Legend</span>
                  )}
                </div>
              </button>
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
          {user && (
            <button 
              onClick={() => {
                setNewName(user.name);
                setIsProfileOpen(true);
              }}
              className="w-8 h-8 rounded-full overflow-hidden bg-white/10 border border-white/10 flex items-center justify-center"
            >
              {user.photoURL ? (
                <img src={convertDriveUrl(user.photoURL)} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={16} className="text-white/70" />
              )}
            </button>
          )}
          <button className="text-white p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-dark-bg border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <button 
                onClick={() => setIsProfileOpen(false)}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 border-2 border-neon-blue mx-auto mb-4 flex items-center justify-center">
                  {user?.photoURL ? (
                    <img src={convertDriveUrl(user.photoURL)} alt={user?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={40} className="text-white/20" />
                  )}
                </div>
                <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Edit Profile</h2>
                <p className="text-white/40 text-sm">{user?.email}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Display Name</label>
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-neon-blue transition-all"
                    placeholder="Enter your name"
                  />
                </div>

                <button 
                  onClick={handleUpdateName}
                  disabled={isUpdating || !newName.trim() || newName === user?.name}
                  className="btn-neon w-full py-4 uppercase tracking-wider"
                >
                  {isUpdating ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-0 top-[64px] bg-dark-bg border-b border-white/10 p-4 flex flex-col gap-2 lg:hidden shadow-2xl z-[100] max-h-[calc(100vh-80px)] overflow-y-auto"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-white/70 hover:text-neon-blue flex items-center gap-3 p-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                <link.icon className="w-4 h-4" />
                {link.name}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/5 mt-2 pb-6">
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="px-2 text-[10px] text-white/40 font-mono truncate">
                    {user.email}
                  </div>
                  <button onClick={() => { handleLogout(); setIsOpen(false); }} className="btn-neon w-full justify-center py-2.5 text-sm">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setIsOpen(false)} className="btn-neon w-full text-center py-2.5 flex justify-center items-center text-sm">
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
