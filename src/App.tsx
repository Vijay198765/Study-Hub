import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, Shield, X } from 'lucide-react';
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
import NewsTicker from './components/NewsTicker';
import ErrorBoundary from './components/ErrorBoundary';
import WelcomeOverlay from './components/WelcomeOverlay';
import { LoadingScreen } from './components/LoadingScreen';
import { auth, db, testConnection, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc, addDoc, collection, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { ThemeProvider } from './contexts/ThemeContext';
import Watermark from './components/Watermark';
import RatingModal from './components/RatingModal';
import { WhatsAppFloat } from './components/WhatsAppFloat';
import LeaderboardScroller from './components/LeaderboardScroller';

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
  const [isBanned, setIsBanned] = useState(false);
  const [userIp, setUserIp] = useState<string | null>(null);
  const [currentUserMessage, setCurrentUserMessage] = useState<any>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [messageTimer, setMessageTimer] = useState<number>(10);

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
    
    // Get IP with fallback
    const getIp = async () => {
      if (userIp) return;
      
      const providers = [
        'https://api.ipify.org?format=json',
        'https://api64.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://ident.me/.json'
      ];

      for (const url of providers) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          const data = await res.json();
          if (data.ip) {
            setUserIp(data.ip);
            return;
          }
        } catch (e) {
          console.warn(`IP fetch from ${url} failed, trying next...`);
        }
      }
      console.error("All IP check providers failed");
    };

    getIp();

    // Listen to global site config
    const configRef = doc(db, 'config', 'site');
    const unsubConfig = onSnapshot(configRef, {
      next: (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setSiteConfig(data);
          
          // Check banning
          if (userIp && data.bannedIps?.includes(userIp)) {
            setIsBanned(true);
          }

          // Immediately close rating modal if it's disabled globally
          if (data.isRatingEnabled === false) {
            setShowRatingModal(false);
          }
        }
      },
      error: (error) => handleFirestoreError(error, OperationType.GET, 'config/site')
    });

    // Check for special admin status immediately
    const isSpecial = localStorage.getItem('isSpecialLogin') === 'true';
    const isAdminLogin = localStorage.getItem('isAdminLogin') === 'true';
    if (isSpecial && isAdminLogin) {
      setIsSpecialAdmin(true);
    }

    return () => unsubConfig();
  }, [userIp]);

  // Check ban if IP changes or userProfile changes
  useEffect(() => {
    if (siteConfig?.bannedIps && userIp && siteConfig.bannedIps.includes(userIp)) {
      setIsBanned(true);
    }
    if (siteConfig?.bannedIps && userProfile?.ip && siteConfig.bannedIps.includes(userProfile.ip)) {
      setIsBanned(true);
    }
  }, [siteConfig, userIp, userProfile]);

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
    let unsubscribeMessages: (() => void) | null = null;

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
        // Fetch IP address - Do it once per session with fallbacks
        let detectedIp = 'unknown';
        const providers = [
          'https://api.ipify.org?format=json',
          'https://api64.ipify.org?format=json',
          'https://ipapi.co/json/',
          'https://ident.me/.json'
        ];

        for (const url of providers) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();
            if (data.ip) {
              detectedIp = data.ip;
              break;
            }
          } catch (e) {
            continue;
          }
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
            if (profileData.ip !== detectedIp) updates.ip = detectedIp;
            if (firebaseUser.photoURL && profileData.photoURL !== firebaseUser.photoURL && !profileData.photoURLOverridden) {
              updates.photoURL = firebaseUser.photoURL;
            }
            if (firebaseUser.displayName && !profileData.name) updates.name = firebaseUser.displayName;
            if (profileData.totalTimeSpent === undefined) updates.totalTimeSpent = 0;
            if (profileData.bonusTimeSpent === undefined) updates.bonusTimeSpent = 0;

            // Specific constraint for tagged email
            if (firebaseUser.email?.toLowerCase() === 'tagoreteam2025@gmail.com') {
              if (profileData.name !== 'Hania Aamir') {
                updates.name = 'Hania Aamir';
              }
            }

            // Also ensure main admin photo is always synced from Google if not overridden
            const isMainAdmin = firebaseUser.email?.toLowerCase() === 'vijayninama683@gmail.com';
            if (isMainAdmin && firebaseUser.photoURL && profileData.photoURL !== firebaseUser.photoURL && !profileData.photoURLOverridden) {
              updates.photoURL = firebaseUser.photoURL;
            }

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
            
            if (firebaseUser.email?.toLowerCase() === 'tagoreteam2025@gmail.com') {
              name = 'Hania Aamir';
            }

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
              ip: detectedIp,
              totalTimeSpent: 0,
              isSecret: isSecretLogin,
              secretLoginLogged: isSecretLogin,
              ...extraData
            };
            await setDoc(userRef, profileData);
          }

          // 2. Set Initial Local State
          setUserProfile({ ...profileData, isLegend: profileData.isLegend || profileData.role === 'admin' });
          const isUserAdmin = profileData.role === 'admin' || firebaseUser.email?.toLowerCase() === 'vijayninama683@gmail.com';
          setIsAdmin(isUserAdmin);
          if (isUserAdmin || profileData.secretLoginLogged) setIsSpecialAdmin(true);

          // 3. Log activity - Skip for secret logins
          if (!isSpecial) {
             const deviceInfo = {
               userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
               platform: typeof navigator !== 'undefined' ? (navigator as any).platform || 'unknown' : 'unknown',
               language: typeof navigator !== 'undefined' ? navigator.language : 'en',
               screenResolution: (typeof window !== 'undefined' && window.screen) ? `${window.screen.width}x${window.screen.height}` : 'unknown'
             };

             addDoc(collection(db, 'activityLogs'), {
               userId: firebaseUser.uid,
               userName: profileData.name || 'Anonymous',
               userEmail: profileData.email || 'N/A',
               action: 'Session Started',
               path: window.location.pathname,
               ip: detectedIp,
               deviceInfo,
               isSecret: isSpecial,
               timestamp: serverTimestamp()
             }).catch(e => console.error("Activity logging failed:", e));
          }

          // 4. Listen for User Messages
          if (firebaseUser) {
            const q = query(
              collection(db, 'userMessages'), 
              where('userId', 'in', [firebaseUser.uid, 'all'])
            );
            unsubscribeMessages = onSnapshot(q, (snap) => {
              const messages = snap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a: any, b: any) => {
                  const timeA = a.createdAt?.seconds || 0;
                  const timeB = b.createdAt?.seconds || 0;
                  return timeB - timeA;
                });
              const myMessage: any = messages.find((m: any) => m.showCount > 0);
              
              if (myMessage && !currentUserMessage) {
                setCurrentUserMessage(myMessage);
                setShowMessage(true);
                setMessageTimer(myMessage.duration || 10);
                
                // Decrement showCount ONLY for targeted individual messages
                // Global messages (userId === 'all') should not be auto-decremented by a single user's view
                if (myMessage.userId !== 'all') {
                  updateDoc(doc(db, 'userMessages', myMessage.id), {
                    showCount: myMessage.showCount - 1
                  });
                }
              }
            });
          }

          // 5. Start listening for real-time profile changes
          unsubscribeProfile = onSnapshot(userRef, {
            next: (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                setUserProfile({ ...data, isLegend: data.isLegend || data.role === 'admin' });
                const isUserAdmin = data.role === 'admin' || firebaseUser.email?.toLowerCase() === 'vijayninama683@gmail.com';
                setIsAdmin(isUserAdmin);
                if (isUserAdmin || data.secretLoginLogged) setIsSpecialAdmin(true);
              }
            },
            error: (error) => {
              handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
            }
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
      if (unsubscribeMessages) unsubscribeMessages();
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

  // User message timer
  useEffect(() => {
    let interval: any;
    if (showMessage && messageTimer > 0) {
      interval = setInterval(() => {
        setMessageTimer(prev => prev - 1);
      }, 1000);
    } else if (messageTimer <= 0) {
      setShowMessage(false);
      setCurrentUserMessage(null);
    }
    return () => clearInterval(interval);
  }, [showMessage, messageTimer]);

  return (
    <ThemeProvider>
      <AnimatePresence mode="wait">
        {isBanned ? (
          <motion.div 
            key="banned"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-8 border border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
              <Shield size={48} />
            </div>
            <h1 className="text-5xl font-black text-white mb-6 uppercase tracking-tighter italic">Access Restricted</h1>
            <p className="text-white/40 max-w-md mx-auto leading-relaxed text-sm mb-10">
              Your IP Address (<span className="text-red-400 font-mono">{userIp || 'unknown'}</span>) has been flagged and blocked from accessing this system. If you believe this is an error, contact the administrator.
            </p>
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
              <AlertCircle size={18} className="text-red-500" />
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest leading-relaxed">System Security Protocol Active</p>
            </div>
          </motion.div>
        ) : (loading || !minLoadingComplete) ? (
          <LoadingScreen key="loading" />
        ) : (
          <ErrorBoundary key="app">
            {firebaseError && <FirebaseSetupGuide errorType={firebaseError} projectId={firebaseConfig.projectId} />}
            {showWelcome && <WelcomeOverlay onComplete={() => setShowWelcome(false)} siteConfig={siteConfig} />}
            <div className="flex flex-col min-h-screen relative overflow-hidden">
              {siteConfig?.bgEffect === 'snow' && <div className="fixed inset-0 pointer-events-none z-0"><div className="absolute inset-0 bg-[url('https://picsum.photos/seed/snow/1920/1080')] opacity-5 mix-blend-overlay animate-pulse" /></div>}
              
              <Watermark />
              
              {siteConfig?.showAnnouncement && (
                <div 
                  className="w-full py-2 overflow-hidden whitespace-nowrap z-[60] relative"
                  style={{ backgroundColor: siteConfig?.announcementColor || '#00E5FF' }}
                >
                  <div className="animate-marquee inline-block pl-[100%] text-[10px] font-black uppercase tracking-[0.2em] text-black">
                    {siteConfig?.announcementText || 'Welcome to our learning platform! Explore new classes and features.'}
                  </div>
                </div>
              )}

              <Navbar isAdmin={isAdmin} isSpecialAdmin={isSpecialAdmin} user={userProfile} siteConfig={siteConfig} />
              
              <div className="pt-[64px]">
                <NewsTicker />
              </div>
              
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
              <RatingModal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} />
              <WhatsAppFloat />

              {/* Individual User Message / Alert Overlay */}
              <AnimatePresence>
                {showMessage && currentUserMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md"
                  >
                    <div className="bg-dark-card border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-xl">
                      <div className="absolute top-0 left-0 h-1 bg-neon-blue transition-all duration-1000 ease-linear" style={{ width: `${(messageTimer / (currentUserMessage.duration || 10)) * 100}%` }} />
                      
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue flex-shrink-0 animate-pulse">
                          <AlertCircle size={24} />
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2 italic">Important Message</h3>
                          <p className="text-white/70 text-sm leading-relaxed">
                            {currentUserMessage.message}
                          </p>
                        </div>
                        <button 
                          onClick={() => { setShowMessage(false); setCurrentUserMessage(null); }}
                          className="p-1 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all flex-shrink-0"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex gap-1">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-white/10" />
                          ))}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/20">System Broadcast</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ErrorBoundary>
        )}
      </AnimatePresence>
    </ThemeProvider>
  );
}

