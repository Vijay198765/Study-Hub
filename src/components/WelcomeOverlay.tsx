import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, User, ArrowRight } from 'lucide-react';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface WelcomeOverlayProps {
  onComplete: () => void;
}

export default function WelcomeOverlay({ onComplete }: WelcomeOverlayProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    if (!name.trim()) {
      setError('Please enter your name first');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists, if not create basic profile
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: (navigator as any).platform || 'unknown',
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`
      };
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          name: name.trim(), // User-input name takes priority
          role: 'student',
          photoURL: result.user.photoURL,
          createdAt: new Date().toISOString(),
          deviceInfo
        });
      } else {
        // Update name if it's different, but keep role
        await setDoc(userRef, {
          ...userSnap.data(),
          name: name.trim(),
          deviceInfo
        }, { merge: true });
      }
      
      localStorage.setItem('studentName', name.trim());
      localStorage.removeItem('hasSkippedLogin');
      onComplete();
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('studentName', 'Guest Student');
    localStorage.setItem('hasSkippedLogin', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md bg-dark-card border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"></div>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome to Study Hub</h2>
          <p className="text-white/60">Enter your name to personalize your experience or login to save your progress.</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">Your Name (Mandatory for interaction)</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input 
                type="text" 
                placeholder="e.g. John Doe" 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full bg-white/5 border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl py-3 pl-12 pr-4 text-white focus:border-neon-blue outline-none transition-all`}
              />
            </div>
            {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider pl-1 mt-1">{error}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 pt-2">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Gmail
                </>
              )}
            </button>
            
            <button 
              onClick={handleSkip}
              className="w-full py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
            >
              Skip for now (Guest Mode) <ArrowRight size={16} />
            </button>
          </div>

          <div className="pt-4 text-center">
            <p className="text-[9px] text-white/30 uppercase leading-relaxed">
              Guest mode allows viewing only. <br />
              Login to chat, take tests, and save progress.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
