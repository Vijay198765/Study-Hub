import React, { useState } from 'react';
import { Mail, Heart, X, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import { signInAnonymously } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface FooterProps {
  siteConfig?: any;
}

export default function Footer({ siteConfig }: FooterProps) {
  const [showSecretLogin, setShowSecretLogin] = useState(false);
  const [secretKey, setSecretKey] = useState('');

  const siteName = siteConfig?.siteName || 'Study-hub';
  const adminName = siteConfig?.adminName || 'Vijay Ninama';
  const coOwnerName = 'Tilak Sahu';
  const supportEmail = siteConfig?.supportEmail || 'vijayninama683@gmail.com';
  const supportWhatsApp = siteConfig?.supportWhatsApp;
  const supportTelegram = siteConfig?.supportTelegram;

  const handleSecretLogin = async () => {
    const isSecretEnabled = siteConfig?.secretLoginEnabled !== false;
    const dynamicSecretKey = siteConfig?.secretLoginKey || 'Vijay1987';

    if (!isSecretEnabled) {
      toast.error('Secret login is currently disabled by admin.');
      setShowSecretLogin(false);
      return;
    }

    console.log("Secret login attempt with key:", secretKey);
    if (secretKey === dynamicSecretKey) {
      try {
        console.log("Secret key matches! Setting flags and signing in anonymously...");
        localStorage.setItem('isSpecialLogin', 'true');
        localStorage.setItem('studentName', 'Special Student');
        localStorage.setItem('isAdminLogin', 'false');
        localStorage.setItem('hasSkippedLogin', 'false');
        
        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;

        if (user) {
          // Create/Update user document to grant special privileges in Firestore
          // Strictly student role for security
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            uid: user.uid,
            email: 'anonymous@studyhub.com',
            name: 'Special Student',
            role: 'student',
            adminKey: dynamicSecretKey,
            isLegend: true,
            updatedAt: serverTimestamp(),
            secretLoginLogged: true
          }, { merge: true });
          
          toast.success('Special access granted!');
          // Small delay to ensure auth state is persisted before redirect
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        }
      } catch (error: any) {
        console.error("Secret login error:", error);
        if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
          toast.error('Anonymous login is disabled. Please enable it in Firebase Console > Authentication > Sign-in method.', {
            duration: 6000
          });
        } else {
          toast.error('Failed to authenticate: ' + (error.message || 'Unknown error'));
        }
      }
    } else {
      console.log("Invalid secret key.");
      toast.error('Invalid secret key');
    }
    setShowSecretLogin(false);
    setSecretKey('');
  };

  return (
    <footer className="bg-dark-card border-t border-white/5 py-12 mt-12 relative">
      <AnimatePresence>
        {showSecretLogin && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-dark-bg border border-white/10 p-8 rounded-3xl w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold uppercase tracking-tight">Secret Login</h3>
                <button onClick={() => setShowSecretLogin(false)} className="text-white/40 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <input 
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter secret key"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white outline-none focus:border-neon-blue mb-6"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSecretLogin()}
              />
              <button 
                onClick={handleSecretLogin}
                className="btn-neon w-full py-3 uppercase tracking-widest"
              >
                Login
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-2xl font-display font-bold text-white mb-1">{siteName}</h3>
          <div className="flex flex-col mb-1">
            <p className="text-xs text-neon-blue font-bold uppercase tracking-widest">Founder: {adminName}</p>
            <p className="text-xs text-neon-blue font-bold uppercase tracking-widest">Co-owner: {coOwnerName}</p>
          </div>
          <p className="text-xs text-white/20 uppercase tracking-widest mb-4">Leading the Future of Learning</p>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 max-w-md">
            <p className="text-[10px] text-white/40 leading-relaxed italic">
              <span className="text-neon-blue font-bold not-italic">Disclaimer:</span> All study materials and content provided on this platform are collected from publicly available sources. Original rights and credits belong to their respective authors and authorities. If you have any concerns regarding the content, please contact us.
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4">Connect & Support</h4>
          <ul className="space-y-3 text-white/50">
            <li className="flex items-center gap-2 group">
              <Mail className="w-4 h-4 text-neon-pink group-hover:scale-110 transition-transform" /> 
              <span className="text-sm truncate max-w-[200px]">{supportEmail}</span>
            </li>
            {supportWhatsApp && (
               <li>
                <a 
                  href={`https://wa.me/${supportWhatsApp.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-emerald-400 font-medium transition-colors group"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  WhatsApp Support
                </a>
              </li>
            )}
            {supportTelegram && (
               <li>
                <a 
                  href={supportTelegram.startsWith('http') ? supportTelegram : `https://t.me/${supportTelegram.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-neon-blue font-medium transition-colors group"
                >
                  <Send className="w-4 h-4 text-neon-blue group-hover:scale-110 transition-transform" />
                  Telegram Group
                </a>
              </li>
            )}
            <li className="text-[10px] mt-4 pt-4 border-t border-white/5">Made with <Heart className="w-3 h-3 inline text-neon-pink animate-pulse" /> for students.</li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-white/5 text-center text-white/30 text-sm">
        <span 
          className="cursor-pointer hover:text-white transition-colors p-2 inline-block"
          onClick={() => setShowSecretLogin(true)}
          title="Secret Login"
        >
          ©
        </span> {new Date().getFullYear()} {siteName} by {adminName}. All rights reserved.
      </div>
    </footer>
  );
}
