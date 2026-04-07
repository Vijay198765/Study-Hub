import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, LogIn, AlertCircle } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Login() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const isSpecial = localStorage.getItem('isSpecialLogin') === 'true';
        const isAdminLogin = localStorage.getItem('isAdminLogin') === 'true';

        if (isSpecial && isAdminLogin) {
          navigate('/admin');
          return;
        }

        // If user is already logged in, check their role and redirect
        getDoc(doc(db, 'users', user.uid)).then((userDoc) => {
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            navigate('/admin');
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

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked by browser. Please allow popups for this site and try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for login. Please check Firebase console settings.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google Login is not enabled in the Firebase console. Please enable it in Authentication > Sign-in method.');
      } else {
        setError('Failed to login with Gmail. Please try again.');
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
              className="btn-neon w-full py-4 text-lg flex items-center justify-center gap-3 bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10"
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
    </div>
  );
}
