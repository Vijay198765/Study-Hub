import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, LogIn, AlertCircle, Shield, X } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export default function Login() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'site'), (snap) => {
      if (snap.exists()) setSiteConfig(snap.data());
    });
    return () => unsub();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const isSpecial = localStorage.getItem('isSpecialLogin') === 'true';
        const isAdminLogin = localStorage.getItem('isAdminLogin') === 'true';

        if (isSpecial && isAdminLogin) {
          navigate('/');
          return;
        }

        // If user is already logged in, check their role and redirect
        getDoc(doc(db, 'users', user.uid)).then((userDoc) => {
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            navigate('/');
          } else {
            navigate('/');
          }
        }).catch(() => {
          // Fallback if doc read fails
          navigate('/');
        });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    if (!acceptedTerms) {
      setError('Please accept the Terms & Conditions to continue');
      return;
    }
    
    if (!name.trim()) {
      setError('Please enter your name first');
      return;
    }

    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore, if not create as student
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      let role = 'student';
      
      if (!userDoc.exists()) {
        // Default admin check
        const adminEmails = ['vijayninama683@gmail.com'];
        if (adminEmails.includes(user.email?.toLowerCase() || '')) {
          role = 'admin';
        }
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          name: name.trim(),
          role: role,
          createdAt: new Date().toISOString()
        });
      } else {
        role = userDoc.data().role;
        // Update name if different
        await setDoc(userRef, {
          ...userDoc.data(),
          name: name.trim(),
        }, { merge: true });
      }

      localStorage.setItem('studentName', name.trim());
      localStorage.removeItem('hasSkippedLogin');

      navigate('/');
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked! Please click the login button again or try opening the site in a new tab.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. This usually means a connection to Firebase was blocked. Check your internet or disable ad-blockers.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for login. Check Firebase Console > Auth > Settings > Authorized domains.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google Login is not enabled in the Firebase console.');
      } else {
        setError('Failed to login with Gmail. If this persists, try refreshing the page or using a different browser.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    localStorage.setItem('studentName', 'Guest Student');
    localStorage.setItem('hasSkippedLogin', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-black">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"></div>
          
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-neon-blue/10 flex items-center justify-center mx-auto mb-6 text-neon-blue">
              <LogIn size={32} />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">Study-hub Login</h1>
            <p className="text-white/40">Enter your name and continue with Gmail.</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-wider pl-1">Your Name (Compulsory)</label>
              <input 
                type="text" 
                placeholder="Enter your full name" 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                className={`w-full bg-white/5 border ${error && !name.trim() ? 'border-red-500' : 'border-white/10'} rounded-xl py-4 px-4 text-white focus:border-neon-blue outline-none transition-all`}
              />
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className={`btn-neon w-full py-4 text-lg flex items-center justify-center gap-3 bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10 ${!acceptedTerms ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                  Continue with Gmail
                </>
              )}
            </button>

            <div className="flex items-start gap-2 px-1">
              <input 
                type="checkbox" 
                id="terms" 
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 accent-neon-blue"
              />
              <label htmlFor="terms" className="text-[10px] text-white/40 leading-relaxed group cursor-pointer">
                I agree to the <button onClick={() => setShowTerms(true)} className="text-neon-blue hover:underline font-bold">Terms & Conditions</button> and <button onClick={() => setShowTerms(true)} className="text-neon-blue hover:underline font-bold">Privacy Policy</button>.
              </label>
            </div>

            {siteConfig?.guestModeEnabled !== false && (
              <>
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-dark-card px-2 text-white/20">Or</span></div>
                </div>

                <button 
                  onClick={handleGuestMode}
                  className="w-full py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all"
                >
                  Skip Login (Guest Mode)
                </button>
              </>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-medium"
              >
                <AlertCircle size={16} className="shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
              Guest mode allows viewing only
            </p>
          </div>
        </div>
      </motion.div>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTerms && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTerms(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-dark-card border border-white/10 rounded-3xl p-8 shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setShowTerms(false)}
                className="absolute top-4 right-4 p-2 text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-neon-blue/10 text-neon-blue">
                    <Shield size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white">Terms & Conditions</h2>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Last updated: April 2026</p>
                  </div>
                </div>

                <div className="space-y-4 text-white/60 text-sm leading-relaxed text-left">
                  <section>
                    <h3 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">1. Acceptance of Terms</h3>
                    <p>By accessing and using Study-hub, you agree to be bound by these terms. If you do not agree to these terms, please do not use our services.</p>
                  </section>
                  
                  <section>
                    <h3 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">2. Use of Content</h3>
                    <p>The materials provided on this platform are for educational purposes only. Some materials are collected from publicly available sources, and original credits belong to their respective authors.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">3. Account Responsibility</h3>
                    <p>You are responsible for maintaining the confidentiality of your account and any activities that occur under your account.</p>
                  </section>

                  <section>
                    <h3 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">4. Privacy Policy</h3>
                    <p>We value your privacy. Your data is used strictly for authentication and tracking your own educational progress. We do not sell your personal information to third parties.</p>
                  </section>
                  
                  <section>
                    <h3 className="text-white font-bold mb-2 uppercase tracking-wider text-xs">5. Prohibited Conduct</h3>
                    <p>Users are prohibited from attempting to bypass security measures, scraping data, or using the platform for any illegal activities.</p>
                  </section>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setAcceptedTerms(true);
                      setShowTerms(false);
                    }}
                    className="btn-neon w-full py-4 uppercase tracking-widest font-bold"
                  >
                    I Accept & Agree
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
