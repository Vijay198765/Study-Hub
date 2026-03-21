import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, LogIn } from 'lucide-react';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore, if not create as student
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      let role = 'student';
      
      if (!userDoc.exists()) {
        // Default admin check
        if (user.email === 'vijayninama683@gmail.com') {
          role = 'admin';
        }
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: role
        });
      } else {
        role = userDoc.data().role;
      }

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError('Failed to login with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-blue/5 via-dark-bg to-dark-bg">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass-card p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"></div>
          
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-neon-blue/10 flex items-center justify-center mx-auto mb-6 text-neon-blue">
              <Lock size={32} />
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">Study-hub Login</h1>
            <p className="text-white/40">Secure access for students and admins.</p>
          </div>

          <div className="space-y-6">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="btn-neon w-full py-4 text-lg flex items-center justify-center gap-3 bg-white/5 border-white/10 hover:bg-white/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                  Continue with Google
                </>
              )}
            </button>

            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm text-center font-medium"
              >
                {error}
              </motion.p>
            )}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-xs text-white/20">
              Protected by Study-hub Security Protocol v2.5
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
