import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ClassDetail from './pages/ClassDetail';
import SubjectDetail from './pages/SubjectDetail';
import ChapterDetail from './pages/ChapterDetail';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import Games from './pages/Games';
import LiveComments from './pages/LiveComments';
import Tests from './pages/Tests';
import ErrorBoundary from './components/ErrorBoundary';
import WelcomeOverlay from './components/WelcomeOverlay';
import { LoadingScreen } from './components/LoadingScreen';
import { auth, db, testConnection, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ThemeProvider } from './contexts/ThemeContext';
import Watermark from './components/Watermark';
import RatingModal from './components/RatingModal';
import { WhatsAppFloat } from './components/WhatsAppFloat';
import NotificationPrompt from './components/NotificationPrompt';

import FirebaseSetupGuide from './components/FirebaseSetupGuide';
import firebaseConfig from '../firebase-applet-config.json';

// Protected Route Component
const ProtectedRoute = ({ children, isAdmin }: { children: React.ReactNode, isAdmin: boolean }) => {
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSpecialAdmin, setIsSpecialAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [firebaseError, setFirebaseError] = useState<'auth' | 'firestore' | 'both' | null>(null);

  // Test connection and listen to config
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await testConnection();
      } catch (error: any) {
        if (error.message?.includes('the client is offline') || error.message?.includes('unavailable')) {
          setFirebaseError(prev => prev === 'auth' ? 'both' : 'firestore');
        }
      }
    };
    checkConnection();
    
    // Listen to global site config
    const configRef = doc(db, 'config', 'site');
    const unsubConfig = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSiteConfig(data);
        // Immediately close rating modal if it's disabled globally
        if (data.isRatingEnabled === false) {
          setShowRatingModal(false);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'config/site'));

    // Check for special admin status immediately
    const isSpecial = localStorage.getItem('isSpecialLogin') === 'true';
    const isAdminLogin = localStorage.getItem('isAdminLogin') === 'true';
    if (isSpecial && isAdminLogin) {
      setIsSpecialAdmin(true);
    }

    return () => unsubConfig();
  }, []);

  // Listen for auth errors globally
  useEffect(() => {
    const handleAuthError = (event: any) => {
      if (event && event.detail?.code === 'auth/admin-restricted-operation') {
        setFirebaseError(prev => prev === 'firestore' ? 'both' : 'auth');
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('firebase-auth-error', handleAuthError);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('firebase-auth-error', handleAuthError);
      }
    };
  }, []);

  // Minimum loading time for the animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  useEffect(() => {
    console.log("App State: User:", user?.uid, "isAdmin:", isAdmin, "isSpecialAdmin:", isSpecialAdmin, "loading:", loading);
  }, [user, isAdmin, isSpecialAdmin, loading]);

  useEffect(() => {
    // Check if we need to show welcome screen
    const hasSkipped = localStorage.getItem('hasSkippedLogin');
    if (!hasSkipped && !auth.currentUser) {
      setShowWelcome(true);
    }

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      const isSpecial = localStorage.getItem('isSpecialLogin') === 'true';
      const isAdminLogin = localStorage.getItem('isAdminLogin') === 'true';

      if (firebaseUser) {
        // Fetch IP address - Do it once per session
        let userIp = 'unknown';
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          userIp = data.ip;
        } catch (e) {
          console.error("Failed to fetch IP:", e);
        }

        const userRef = doc(db, 'users', firebaseUser.uid);
        
        try {
          // 1. Initial Profile Setup/Upgrade (one-time action)
          const docSnap = await getDoc(userRef);
          let profileData: any = null;

          if (docSnap.exists()) {
            profileData = docSnap.data();
            
            // Side-effect updates (IP, photo, name, secret upgrade)
            const updates: any = {};
            if (profileData.ip !== userIp) updates.ip = userIp;
            if (firebaseUser.photoURL && profileData.photoURL !== firebaseUser.photoURL) updates.photoURL = firebaseUser.photoURL;
            if (firebaseUser.displayName && !profileData.name) updates.name = firebaseUser.displayName;
            if (profileData.totalTimeSpent === undefined) updates.totalTimeSpent = 0;

            // Upgrade anonymous user to admin if they have the special login flags
            let forceUpgrade = false;
            if (firebaseUser.isAnonymous && isSpecial && isAdminLogin && profileData.role !== 'admin') {
              updates.role = 'admin';
              updates.adminKey = siteConfig?.secretLoginKey || 'Vijay1987';
              updates.name = localStorage.getItem('studentName') || 'Vijay Admin';
              updates.isLegend = true;
              updates.secretLoginLogged = true;
              forceUpgrade = true;
            }

            if (Object.keys(updates).length > 0) {
              await updateDoc(userRef, updates);
              // Merge updates into profileData for immediate state use
              profileData = { ...profileData, ...updates };
              if (forceUpgrade) {
                setIsAdmin(true);
                setIsSpecialAdmin(true);
              }
            }
          } else {
            // New user doc creation
            const adminEmails = ['vijayninama683@gmail.com'];
            const isDefaultAdmin = adminEmails.includes(firebaseUser.email?.toLowerCase() || '');
            const isSecretLogin = firebaseUser.isAnonymous && localStorage.getItem('isSpecialLogin') === 'true';
            
            let role = (isDefaultAdmin || isSecretLogin) ? 'admin' : 'student';
            let name = firebaseUser.displayName || (isDefaultAdmin ? 'Vijay Admin' : (isSecretLogin ? 'Special Student' : 'Student'));
            let extraData: any = {};

            if (isDefaultAdmin || isSecretLogin) {
              const dynamicAdminKey = siteConfig?.secretLoginKey || 'Vijay1987';
              extraData = { 
                adminKey: dynamicAdminKey, 
                isLegend: true,
                secretLoginLogged: isSecretLogin 
              };
            }

            profileData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || (firebaseUser.isAnonymous ? 'anonymous@studyhub.com' : ''),
              name: name,
              photoURL: firebaseUser.photoURL || '',
              role: role,
              createdAt: new Date().toISOString(),
              isLegend: role === 'admin',
              ip: userIp,
              totalTimeSpent: 0,
              isSecret: isSecretLogin,
              secretLoginLogged: isSecretLogin,
              ...extraData
            };
            await setDoc(userRef, profileData);
          }

          // 2. Set Initial Local State
          setUserProfile({ ...profileData, isLegend: profileData.isLegend || profileData.role === 'admin' });
          const isUserAdmin = profileData.role === 'admin';
          setIsAdmin(isUserAdmin);
          if (isUserAdmin || profileData.secretLoginLogged) setIsSpecialAdmin(true);

          // 3. Log activity - Skip for secret logins
          if (!isSpecial) {
             addDoc(collection(db, 'activityLogs'), {
               userId: firebaseUser.uid,
               userName: profileData.name || 'Anonymous',
               action: 'Session Started',
               path: window.location.pathname,
               ip: userIp,
               isSecret: isSpecial,
               timestamp: serverTimestamp()
             }).catch(e => console.error("Activity logging failed:", e));
          }

          // 4. Start listening for real-time changes WITHOUT doing updates in the listener
          unsubscribeProfile = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setUserProfile({ ...data, isLegend: data.isLegend || data.role === 'admin' });
              const isUserAdmin = data.role === 'admin';
              setIsAdmin(isUserAdmin);
              if (isUserAdmin || data.secretLoginLogged) setIsSpecialAdmin(true);
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          });

        } catch (error) {
          console.error("Critical error in user profile setup:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setIsAdmin(false);
        setIsSpecialAdmin(false);
        setUserProfile(null);
        setLoading(false);
      }

      if (firebaseUser) {
        setShowWelcome(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // Show rating modal logic
  useEffect(() => {
    if (user && !loading && minLoadingComplete && siteConfig?.isRatingEnabled) {
      const timer = setTimeout(() => {
        // Double check configuration before showing
        if (siteConfig?.isRatingEnabled && !localStorage.getItem(`rated_${user.uid}`)) {
          setShowRatingModal(true);
        }
      }, 5000); // Show after 5 seconds
      return () => clearTimeout(timer);
    } else if (siteConfig?.isRatingEnabled === false) {
      setShowRatingModal(false);
    }
  }, [user, loading, minLoadingComplete, siteConfig?.isRatingEnabled]);

  // Time Tracking Logic
  useEffect(() => {
    if (!user || loading) return;

    const trackTime = async () => {
      if (document.visibilityState === 'visible') {
        const userRef = doc(db, 'users', user.uid);
        try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const currentTotal = docSnap.data().totalTimeSpent || 0;
            await updateDoc(userRef, {
              totalTimeSpent: currentTotal + 1,
              lastActive: serverTimestamp()
            });
          }
        } catch (e) {
          console.error("Error tracking time:", e);
        }
      }
    };

    const interval = setInterval(trackTime, 60000); // Every minute
    return () => clearInterval(interval);
  }, [user, loading]);

  return (
    <ThemeProvider>
      <AnimatePresence mode="wait">
        {(loading || !minLoadingComplete) ? (
          <LoadingScreen key="loading" />
        ) : (
          <ErrorBoundary key="app">
            {firebaseError && <FirebaseSetupGuide errorType={firebaseError} projectId={firebaseConfig.projectId} />}
            {showWelcome && <WelcomeOverlay onComplete={() => setShowWelcome(false)} siteConfig={siteConfig} />}
            <div className="flex flex-col min-h-screen relative overflow-hidden">
              <Watermark />
              
              <Navbar isAdmin={isAdmin} isSpecialAdmin={isSpecialAdmin} user={userProfile} siteConfig={siteConfig} />
              
              {siteConfig?.showAnnouncement && siteConfig?.announcementText && (
                <div className="bg-neon-blue text-black py-2 px-4 text-center text-xs font-bold overflow-hidden">
                  <motion.div
                    animate={{ x: [1000, -1000] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="whitespace-nowrap inline-block"
                  >
                    {siteConfig.announcementText}
                  </motion.div>
                </div>
              )}
              
              <main className="flex-grow">
                <AnimatePresence mode="wait">
                  {siteConfig?.maintenanceMode && !isAdmin ? (
                    <motion.div 
                      key="maintenance"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center"
                    >
                      <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6 animate-pulse">
                        <AlertCircle size={40} />
                      </div>
                      <h1 className="text-4xl font-display font-bold text-white mb-4 uppercase tracking-tight italic">Under Maintenance</h1>
                      <p className="text-white/60 max-w-md mx-auto leading-relaxed">
                        {siteConfig?.maintenanceMessage || "We are currently updating the platform to bring you a better experience. Please check back later!"}
                      </p>
                      <div className="mt-10 flex flex-col items-center gap-4">
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">Stay Tuned</p>
                        <div className="flex gap-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <Routes location={location}>
                      <Route path="/" element={<Home siteConfig={siteConfig} />} />
                      <Route path="/classes" element={<Home siteConfig={siteConfig} />} />
                      <Route path="/class/:classId" element={<ClassDetail />} />
                      <Route path="/class/:classId/subject/:subjectId" element={<SubjectDetail />} />
                      <Route path="/class/:classId/subject/:subjectId/chapter/:chapterId" element={<ChapterDetail />} />
                      <Route path="/games" element={<Games />} />
                      <Route path="/live-club" element={<LiveComments />} />
                      <Route path="/tests" element={<Tests />} />
                      <Route path="/login" element={<Login />} />
                      <Route 
                        path="/admin" 
                        element={
                          <ProtectedRoute isAdmin={isAdmin || isSpecialAdmin}>
                            <AdminPanel />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  )}
                </AnimatePresence>
              </main>

              <Footer siteConfig={siteConfig} />
              <NotificationPrompt />
              <RatingModal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} />
              <WhatsAppFloat />
            </div>
          </ErrorBoundary>
        )}
      </AnimatePresence>
    </ThemeProvider>
  );
}

