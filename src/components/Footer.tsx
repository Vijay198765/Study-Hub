import React, { useState } from 'react';
import { Mail, Heart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function Footer() {
  const [showSecretLogin, setShowSecretLogin] = useState(false);
  const [secretKey, setSecretKey] = useState('');

  const handleSecretLogin = async () => {
    console.log("Secret login attempt with key:", secretKey);
    if (secretKey === 'Vijay101987') {
      try {
        console.log("Secret key matches! Setting flags and signing in...");
        localStorage.setItem('isSpecialLogin', 'true');
        localStorage.setItem('studentName', 'Vijay Admin');
        localStorage.setItem('isAdminLogin', 'true');
        localStorage.setItem('hasSkippedLogin', 'false');
        
        const email = 'vijayadmin@studyhub.com';
        let user;
        
        try {
          // Try to sign in with the persistent admin account
          const userCredential = await signInWithEmailAndPassword(auth, email, secretKey);
          user = userCredential.user;
        } catch (err: any) {
          // If user doesn't exist, create it (first time only)
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, secretKey);
              user = userCredential.user;
            } catch (createErr: any) {
              // If creation fails (e.g. already exists but password mismatch - though here password is fixed)
              // or if email already in use but we got invalid-credential
              if (createErr.code === 'auth/email-already-in-use') {
                // This shouldn't happen if we just got user-not-found, but for robustness:
                const userCredential = await signInWithEmailAndPassword(auth, email, secretKey);
                user = userCredential.user;
              } else {
                throw createErr;
              }
            }
          } else {
            throw err;
          }
        }

        if (user) {
          // Create/Update user document to grant admin privileges in Firestore
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            uid: user.uid,
            email: email,
            name: 'Vijay Admin',
            role: 'admin',
            adminKey: 'Vijay101987',
            updatedAt: serverTimestamp(),
            secretLoginLogged: true
          }, { merge: true });
          
          toast.success('Admin access granted!');
          // Small delay to ensure auth state is persisted before redirect
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        }
      } catch (error: any) {
        console.error("Secret login error:", error);
        toast.error('Failed to authenticate: ' + (error.message || 'Unknown error'));
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

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <h3 className="text-2xl font-display font-bold text-white mb-1">Study-hub</h3>
          <p className="text-xs text-neon-blue font-bold uppercase tracking-widest mb-1">Owner: Vijay Ninama</p>
          <p className="text-xs text-neon-blue font-bold uppercase tracking-widest mb-4">Co-owner: Tilak Sahu</p>
          <p className="text-white/50 max-w-md mb-6">
            Empowering students with futuristic learning tools and high-quality study materials. 
            Join our mission to revolutionize education.
          </p>
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 max-w-md">
            <p className="text-[10px] text-white/40 leading-relaxed italic">
              <span className="text-neon-blue font-bold not-italic">Disclaimer:</span> All study materials and content provided on this platform are collected from publicly available sources. Original rights and credits belong to their respective authors and authorities. If you have any concerns regarding the content, please contact us.
            </p>
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-white/50">
            <li><a href="/" className="hover:text-neon-blue transition-colors">Home</a></li>
            <li><a href="/classes" className="hover:text-neon-blue transition-colors">Classes</a></li>
            <li><a href="/tips" className="hover:text-neon-blue transition-colors">Study Tips</a></li>
            <li><a href="/login" className="hover:text-neon-blue transition-colors">Admin Login</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="text-white font-bold mb-4">Contact</h4>
          <ul className="space-y-2 text-white/50">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> vijayninama683@gmail.com</li>
            <li className="text-xs mt-4">Made with <Heart className="w-3 h-3 inline text-neon-pink" /> for students worldwide.</li>
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
        </span> {new Date().getFullYear()} Study-hub by Vijay Ninama. All rights reserved.
      </div>
    </footer>
  );
}
