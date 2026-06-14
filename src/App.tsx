import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, Shield, X, LogIn } from 'lucide-react';
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
import Library from './pages/Library';
import Explorer from './pages/Explorer';
import SurprisePreview from './pages/SurprisePreview';
import SnakeArena from './components/Snake/SnakeArena';
import NewsTicker from './components/NewsTicker';
import ErrorBoundary from './components/ErrorBoundary';
import WelcomeOverlay from './components/WelcomeOverlay';
import { LoadingScreen } from './components/LoadingScreen';
import BackgroundEffects from './components/BackgroundEffects';
import { auth, db, testConnection, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc, addDoc, collection, serverTimestamp, query, orderBy, where, getDocFromCache, getDocFromServer, increment } from 'firebase/firestore';
import { ThemeProvider } from './contexts/ThemeContext';
import Watermark from './components/Watermark';
import RatingModal from './components/RatingModal';
import { WhatsAppFloat } from './components/WhatsAppFloat';
import LeaderboardScroller from './components/LeaderboardScroller';
import { convertDriveUrl, safeStringify } from './lib/utils';
import FirebaseSetupGuide from './components/FirebaseSetupGuide';
import { toast } from 'sonner';
import firebaseConfig from '../firebase-applet-config.json';
import { purgeSpecialStudentDocs } from './services/dataService';

// Protected Route Component
const ProtectedRoute = ({ children, isAdmin }: { children: React.ReactNode, isAdmin: boolean }) => {
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSnakeFullscreen = location.pathname === '/play-snake';
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
  const [userLocation, setUserLocation] = useState<any>(null);

  // Get IP helper function - accessible throughout the component
  const getIp = async () => {
    if (userIp && userIp !== 'unknown') return userIp;
    
    const providers = [
      'https://api.ipify.org?format=json',
      'https://api64.ipify.org?format=json',
      'https://api.seeip.org?format=json',
      'https://ipapi.co/json/',
      'https://api.db-ip.com/v2/free/self'
    ];

    for (const url of providers) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); 
        
        const res = await fetch(url, { 
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) continue;

        const data = await res.json();
        const ip = data.ip || data.ipAddress || data.address;
        if (ip) {
          setUserIp(ip);
          return ip;
        }
      } catch (e) {
        // Silent
      }
    }
    
    if (!userIp) setUserIp('unknown');
    return 'unknown';
  };

  // Sync location when it changes and user is logged in
  useEffect(() => {
    if (userLocation && auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      updateDoc(userRef, {
        lastLocation: userLocation,
        updatedAt: serverTimestamp()
      }).catch(e => console.error("Error syncing location:", e));
      
    // Log location update in activity logs (Historical record)
    if (userLocation && auth.currentUser && userProfile && auth.currentUser.email?.toLowerCase() !== 'vijayninama683@gmail.com') {
      addDoc(collection(db, 'activityLogs'), {
        userId: auth.currentUser.uid,
        userName: userProfile.name || auth.currentUser.displayName || 'Anonymous',
        userEmail: auth.currentUser.email || 'N/A',
        action: 'Location Sync',
        location: userLocation,
        timestamp: serverTimestamp(),
        ip: userIp || 'unknown',
        deviceInfo: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        }
      }).catch(e => console.error("Error logging location action:", e));
    }
  }
}, [userLocation]);

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
    
    getIp();

    // Request Location Permission - ONLY for logged in users
    const requestLocation = () => {
      if (!auth.currentUser) return; // Guard: Don't ask guests

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const loc = {
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              timestamp: new Date().toISOString()
            };
            setUserLocation(loc);
            
            // Also save to user profile for future fallback
            try {
              await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                lastLocation: loc,
                lastLocationUpdatedAt: serverTimestamp()
              });
            } catch (e) {
              // Ignore
            }
            
            toast.success("Location synced! Your session is now verified.");
          },
          (error) => {
            console.warn("Location access denied or failed:", error.message);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
      }
    };

    // Ask for location after a short delay if logged in, or when user becomes available
    let locationTimeout: any;
    if (user && !userLocation) {
      locationTimeout = setTimeout(requestLocation, 3000);
    }

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

    return () => {
      unsubConfig();
      if (locationTimeout) clearTimeout(locationTimeout);
    };
  }, [userIp, user]);

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

  // Programmatic purge of any existing Special Student/anonymous@studyhub.com documents
  useEffect(() => {
    if (isAdmin) {
      purgeSpecialStudentDocs().catch(err => console.error("Purge error:", err));
    }
  }, [isAdmin]);

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

  // Handle global keyboard shortcut: '7' key opens & closes the surprise preview
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when the user is typing inside inputs/textareas
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.hasAttribute('contenteditable')
      )) {
        return;
      }

      if (e.key === '7') {
        e.preventDefault();
        
        // If we are currently on the surprise-preview page, "close" it by navigating to home
        if (location.pathname === '/surprise-preview') {
          navigate('/');
        } else if (location.pathname === '/') {
          // If we are on the home screen, "open" the surprise preview
          const isMobileSize = window.innerWidth < 768;
          const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const isMobile = isMobileSize || isMobileUA;

          let links = [];
          if (siteConfig) {
            links = isMobile 
              ? (siteConfig.surpriseDriveLinksMobile || [])
              : (siteConfig.surpriseDriveLinksDesktop || []);
            
            // Secondary Fallbacks
            if (links.length === 0) {
              links = isMobile 
                ? (siteConfig.surpriseDriveLinksDesktop || [])
                : (siteConfig.surpriseDriveLinksMobile || []);
            }
            if (links.length === 0) {
              links = siteConfig.surpriseDriveLinks || [];
            }
          }

          if (links.length > 0) {
            const randomIndex = Math.floor(Math.random() * links.length);
            const rawUrl = links[randomIndex] || '';
            
            let previewUrl = rawUrl;
            if (rawUrl.includes('drive.google.com')) {
              const fileIdMatch = rawUrl.match(/\/d\/([^/&?]+)/) || rawUrl.match(/id=([^&?#]+)/);
              if (fileIdMatch && fileIdMatch[1]) {
                previewUrl = `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
              }
            }
            
            navigate('/surprise-preview?url=' + encodeURIComponent(previewUrl));
          } else {
            // Fallback to empty preview screen if no links are configured yet
            navigate('/surprise-preview');
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [location.pathname, navigate, siteConfig]);

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
      
      const isMainAdmin = firebaseUser?.email?.toLowerCase() === 'vijayninama683@gmail.com';
      const isAltAdmin = firebaseUser?.email?.toLowerCase() === 'tagoreteam2025@gmail.com';

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      const isSpecial = localStorage.getItem('isSpecialLogin') === 'true';
      const isAdminLogin = localStorage.getItem('isAdminLogin') === 'true';

      if (firebaseUser) {
        // Force reload to get the latest Google profile picture (photoURL)
        try {
          await firebaseUser.reload();
          setUser(auth.currentUser);
        } catch (reloadErr) {
          console.warn("Could not reload firebase user details:", reloadErr);
        }
        const activeUser = auth.currentUser || firebaseUser;

        // Fetch IP address - Use the shared function
        let detectedIp = userIp || 'unknown';
        if (detectedIp === 'unknown') {
          detectedIp = await getIp();
        }

        const userRef = doc(db, 'users', activeUser.uid);
        
        try {
          // 1. Initial Profile Setup/Upgrade (one-time action)
          // Try to get document from server with a short timeout, fallback to cache if available
          let docSnap;
          try {
            // First attempt to get from cache to be fast
            docSnap = await getDocFromCache(userRef);
            console.log("Profile loaded from local cache.");
          } catch (cacheError) {
            // If not in cache, try to fetch from server
            try {
              docSnap = await getDoc(userRef);
            } catch (serverError: any) {
              // If we're offline, this will fail. We'll handle it below.
              console.warn("Could not reach Firestore for profile setup, will retry via snapshot:", serverError.message);
              // Throw it so we catch it in the outer block and log properly if needed
              throw serverError;
            }
          }

          let profileData: any = null;

          if (docSnap && docSnap.exists()) {
            profileData = docSnap.data();
            
            // Side-effect updates (IP, photo, name, secret upgrade)
            const updates: any = {};
            if (profileData.ip !== detectedIp) updates.ip = detectedIp;
            if (activeUser.photoURL && profileData.photoURL !== activeUser.photoURL && !profileData.photoURLOverridden) {
              updates.photoURL = convertDriveUrl(activeUser.photoURL);
            }
            if (activeUser.displayName && !profileData.name) updates.name = activeUser.displayName;
            if (profileData.totalTimeSpent === undefined) updates.totalTimeSpent = 0;
            if (profileData.bonusTimeSpent === undefined) updates.bonusTimeSpent = 0;
            
            // Save detailed Gmail/Google account information
            const isGoogleProv = activeUser.providerData?.some((p: any) => p.providerId === 'google.com') || activeUser.email?.endsWith('@gmail.com');
            if (isGoogleProv) {
              if (profileData.isGmailUser !== true) updates.isGmailUser = true;
              if (profileData.emailVerified !== activeUser.emailVerified) updates.emailVerified = activeUser.emailVerified;
              if (activeUser.metadata?.creationTime && profileData.gmailCreatedAt !== activeUser.metadata.creationTime) {
                updates.gmailCreatedAt = activeUser.metadata.creationTime;
              }
              if (activeUser.metadata?.lastSignInTime && profileData.gmailLastSignIn !== activeUser.metadata.lastSignInTime) {
                updates.gmailLastSignIn = activeUser.metadata.lastSignInTime;
              }
              if (activeUser.displayName && profileData.googleDisplayName !== activeUser.displayName) {
                updates.googleDisplayName = activeUser.displayName;
              }
            }
            
            // Sync location if available
            if (userLocation && (!profileData.lastLocation || 
                Math.abs(profileData.lastLocation.lat - userLocation.lat) > 0.01)) {
              updates.lastLocation = userLocation;
            }

            // Specific constraint for tagged email
            if (isAltAdmin) {
              if (profileData.name !== 'Hania Aamir') {
                updates.name = 'Hania Aamir';
              }
            }

            // Upgrade anonymous user to admin if they have the special login flags
            let forceUpgrade = false;
            if (activeUser.isAnonymous && isSpecial && isAdminLogin && profileData.role !== 'admin') {
              updates.role = 'admin';
              updates.adminKey = siteConfig?.secretLoginKey || '7117';
              updates.name = localStorage.getItem('studentName') || 'Guest';
              updates.isLegend = true;
              updates.secretLoginLogged = true;
              forceUpgrade = true;
            }

            if (Object.keys(updates).length > 0) {
              if (!activeUser.isAnonymous) {
                await updateDoc(userRef, updates);
              }
              // Merge updates into profileData for immediate state use
              profileData = { ...profileData, ...updates };
              if (forceUpgrade) {
                setIsAdmin(true);
                setIsSpecialAdmin(true);
              }
            }
          } else {
            // New user doc creation
            const adminEmails = ['vijayninama683@gmail.com', 'tagoreteam2025@gmail.com'];
            const isDefaultAdmin = adminEmails.includes(activeUser.email?.toLowerCase() || '');
            const isSecretLogin = activeUser.isAnonymous && localStorage.getItem('isSpecialLogin') === 'true';
            
            let role = (isDefaultAdmin || isSecretLogin) ? 'admin' : 'student';
            let name = activeUser.displayName || (activeUser.isAnonymous ? (localStorage.getItem('studentName') || 'Guest') : 'Student');
            
            if (isDefaultAdmin && !activeUser.displayName) {
              name = 'Vijay Admin';
            }
            
            if (activeUser.email?.toLowerCase() === 'tagoreteam2025@gmail.com') {
              name = 'Hania Aamir';
            }

            let extraData: any = {};

            if (isDefaultAdmin || isSecretLogin) {
              const dynamicAdminKey = siteConfig?.secretLoginKey || '7117';
              extraData = { 
                adminKey: dynamicAdminKey, 
                isLegend: true,
                secretLoginLogged: isSecretLogin 
              };
            }

            const isGoogleProv = activeUser.providerData?.some((p: any) => p.providerId === 'google.com') || activeUser.email?.endsWith('@gmail.com');

            profileData = {
              uid: activeUser.uid,
              email: activeUser.email || '',
              name: name,
              photoURL: activeUser.photoURL || '',
              role: role,
              createdAt: new Date().toISOString(),
              isLegend: role === 'admin',
              ip: detectedIp,
              totalTimeSpent: 0,
              isSecret: isSecretLogin,
              secretLoginLogged: isSecretLogin,
              isGmailUser: isGoogleProv,
              emailVerified: activeUser.emailVerified || false,
              gmailCreatedAt: activeUser.metadata?.creationTime || null,
              gmailLastSignIn: activeUser.metadata?.lastSignInTime || null,
              googleDisplayName: activeUser.displayName || '',
              ...extraData
            };
            if (!activeUser.isAnonymous) {
              await setDoc(userRef, profileData);
            }
          }

          // 2. Set Initial Local State
          setUserProfile({ ...profileData, isLegend: profileData.isLegend || profileData.role === 'admin' });
          const isUserAdmin = profileData.role === 'admin' || 
                             activeUser.email?.toLowerCase() === 'vijayninama683@gmail.com' ||
                             activeUser.email?.toLowerCase() === 'tagoreteam2025@gmail.com';
          setIsAdmin(isUserAdmin);
          
          // Only treat as special admin if it was a secret login session
          setIsSpecialAdmin(isSpecial || (profileData.isSecret && profileData.secretLoginLogged));

          // 3. Log activity - Skip for secret logins and vijayninama683@gmail.com
          if (!isSpecial && activeUser.email?.toLowerCase() !== 'vijayninama683@gmail.com') {
             const deviceInfo = {
               userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
               platform: typeof navigator !== 'undefined' ? (navigator as any).platform || 'unknown' : 'unknown',
               language: typeof navigator !== 'undefined' ? navigator.language : 'en',
               screenResolution: (typeof window !== 'undefined' && window.screen) ? `${window.screen.width}x${window.screen.height}` : 'unknown'
             };

             addDoc(collection(db, 'activityLogs'), {
               userId: activeUser.uid,
               userName: profileData.name || 'Anonymous',
               userEmail: profileData.email || 'N/A',
               action: 'Session Started',
               path: window.location.pathname,
               ip: detectedIp,
               deviceInfo,
               location: userLocation || profileData.lastLocation || null,
               isSecret: isSpecial,
               timestamp: serverTimestamp()
             }).catch(e => console.error("Activity logging failed:", e));
          }

          // 4. Listen for User Messages
          if (activeUser) {
            const q = query(
               collection(db, 'userMessages'), 
               where('userId', 'in', [activeUser.uid, 'all'])
            );
            unsubscribeMessages = onSnapshot(q, {
              next: (snap) => {
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
              },
              error: (error) => handleFirestoreError(error, OperationType.GET, 'userMessages')
            });
          }

          // 5. Start listening for real-time profile changes
          unsubscribeProfile = onSnapshot(userRef, {
            next: (snap) => {
              if (snap.exists()) {
                const data = snap.data();
                setUserProfile({ ...data, isLegend: data.isLegend || data.role === 'admin' });
                const isUserAdmin = data.role === 'admin' || 
                                   activeUser.email?.toLowerCase() === 'vijayninama683@gmail.com' ||
                                   activeUser.email?.toLowerCase() === 'tagoreteam2025@gmail.com';
                setIsAdmin(isUserAdmin);
                // Hide special status from local state if it's a main admin to be less conspicuous? 
                // No, we need it for permissions, but we'll hide them from UI lists.
                if (isUserAdmin || data.secretLoginLogged) setIsSpecialAdmin(true);
              }
            },
            error: (error) => {
              handleFirestoreError(error, OperationType.GET, `users/${activeUser.uid}`);
            }
          });

        } catch (error: any) {
          if (error.message?.includes('offline')) {
            console.warn("Profile setup: Client is currently offline. Relying on background listeners once online.");
            // Set a basic temporary profile so the app doesn't stay in a broken state
            const tempProfile = {
              uid: activeUser.uid,
              email: activeUser.email || '',
              name: activeUser.displayName || 'Guest',
              role: 'student',
              isOffline: true
            };
            setUserProfile(tempProfile);
            const isUserAdmin = activeUser.email?.toLowerCase() === 'vijayninama683@gmail.com' ||
                               activeUser.email?.toLowerCase() === 'tagoreteam2025@gmail.com';
            setIsAdmin(isUserAdmin);
          } else {
            console.error("Critical error in user profile setup:", safeStringify(error));
          }
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
      // Use both visibilityState and a simple focus check for more accurate "study time"
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        const userRef = doc(db, 'users', user.uid);
        const isMainAdmin = user.email?.toLowerCase() === 'vijayninama683@gmail.com';
        try {
          // Use increment(1) (or increment(2) if admin) to be more accurate and avoid unnecessary getDoc calls
          // This ensures concurrent updates (like from multiple open tabs) are handled correctly by Firestore
          await updateDoc(userRef, {
            totalTimeSpent: increment(isMainAdmin ? 2 : 1),
            lastActive: serverTimestamp()
          });
        } catch (e) {
          console.error("Error tracking time:", e);
        }
      }
    };

    // Every minute
    const interval = setInterval(trackTime, 60000);
    
    // Also track initial visibility
    trackTime();

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

  const getPageSEO = () => {
    const path = location.pathname;
    const baseTitle = siteConfig?.siteName || 'Study Hub Omega';
    
    if (path === '/' || path === '/classes') {
      return {
        title: 'Free Study Materials & Notes for Class 6-10',
        desc: 'Access high-quality, free study materials, handwritten notes, and NCERT solutions for Class 6, 7, 8, 9, and 10. Boost your exam preparation today.',
        keywords: 'study materials, class 10 notes, ncert solutions, free educational resources, CBSE notes'
      };
    }
    if (path.startsWith('/class/')) {
      return {
        title: 'Class Wise Study Resources & Subject Notes',
        desc: 'Explore detailed subject-wise notes and chapter-specific resources tailored for your class curriculum. Perfect for exam revision and deep learning.',
        keywords: 'class wise notes, subject resources, chapter notes, academic materials, exam revision'
      };
    }
    if (path === '/games') {
      return {
        title: 'Educational Games & Interactive Learning',
        desc: 'Learn while you play! Our interactive educational games cover science, math, and general knowledge to make study sessions engaging and fun.',
        keywords: 'educational games, learning games for students, interactive study, gamified learning, science games'
      };
    }
    if (path === '/tests') {
      return {
        title: 'Online Practice Tests & MCQs with Leaderboard',
        desc: 'Challenge yourself with our online tests and MCQ quizzes. Track your progress on the global leaderboard and compete with students nationwide.',
        keywords: 'online tests, MCQ practice, student leaderboard, quiz competition, exam practice'
      };
    }
    if (path === '/live-club') {
      return {
        title: 'Live Chat & Student Discussion Community',
        desc: 'Join our vibrant student community. Discuss chapters, ask questions, and share knowledge in our real-time live club powered by AI and students.',
        keywords: 'student community, live chat, study discussion, peer learning, student forum'
      };
    }
    return {
      title: 'Study Hub Omega | Futuristic Learning Platform',
      desc: 'The ultimate digital companion for modern students. Notes, games, tests, and community discussion all in one place.',
      keywords: 'study hub, digital learning, edtech platform, student dashboard, study notes'
    };
  };

  const seo = getPageSEO();

  // Update dynamic favicon from siteConfig
  useEffect(() => {
    const faviconToUse = siteConfig?.siteLogo || siteConfig?.faviconUrl;
    if (faviconToUse) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = convertDriveUrl(faviconToUse);
      }
      
      const appleLink: HTMLLinkElement | null = document.querySelector("link[rel='apple-touch-icon']");
      if (appleLink) {
        appleLink.href = convertDriveUrl(faviconToUse);
      }
    }
  }, [siteConfig?.siteLogo, siteConfig?.faviconUrl]);

  // Global Keyboard Navigation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

      // 1. Esc key to go back
      if (e.key === 'Escape') {
        if (!isInput && location.pathname !== '/') {
          navigate(-1);
        }
      }

      // 2. Page Up / Page Down for scrolling
      if (e.key === 'PageUp') {
        window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
        e.preventDefault();
      }
      if (e.key === 'PageDown') {
        window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
        e.preventDefault();
      }

      // 3. Number keys 1-9 for quick navigation (only if not in input)
      if (!isInput && /^[1-9]$/.test(e.key)) {
        const navLinks = document.querySelectorAll('.nav-link');
        const index = parseInt(e.key) - 1;
        if (navLinks[index]) {
          (navLinks[index] as HTMLElement).click();
          e.preventDefault();
        }
      }

      // 4. Arrow Key Navigation Helper
      if (!isInput && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const elements = Array.from(document.querySelectorAll(focusableElements)).filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0; // Only visible elements
        }) as HTMLElement[];
        
        const currentIdx = elements.indexOf(activeElement as HTMLElement);

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          const nextIdx = (currentIdx + 1) % elements.length;
          elements[nextIdx]?.focus();
          e.preventDefault();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          const prevIdx = (currentIdx - 1 + elements.length) % elements.length;
          elements[prevIdx]?.focus();
          e.preventDefault();
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleGlobalKeyDown);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleGlobalKeyDown);
      }
    };
  }, [location.pathname, navigate]);

  return (
    <ThemeProvider>
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.desc} />
        <meta name="keywords" content={seo.keywords} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.desc} />
        <meta name="twitter:title" content={seo.title} />
        <meta name="twitter:description" content={seo.desc} />
      </Helmet>
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
          <LoadingScreen key="loading" siteConfig={siteConfig} />
        ) : (
          <ErrorBoundary key="app">
            {firebaseError && <FirebaseSetupGuide errorType={firebaseError} projectId={firebaseConfig.projectId} />}
            {showWelcome && <WelcomeOverlay onComplete={() => setShowWelcome(false)} siteConfig={siteConfig} />}
            <div className="flex flex-col min-h-screen relative overflow-hidden">
              <BackgroundEffects 
                effect={siteConfig?.bgEffect} 
                quality={siteConfig?.animQuality || 'high'} 
              />
              
              {!isSnakeFullscreen && <Watermark />}
              
              {!isSnakeFullscreen && siteConfig?.showAnnouncement && (
                <div 
                  className="w-full py-2 overflow-hidden whitespace-nowrap z-[60] relative"
                  style={{ backgroundColor: siteConfig?.announcementColor || '#00E5FF' }}
                >
                  <div className="animate-marquee inline-block pl-[100%] text-[10px] font-black uppercase tracking-[0.2em] text-black">
                    {siteConfig?.announcementText || 'Welcome to our learning platform! Explore new classes and features.'}
                  </div>
                </div>
              )}

              {!isSnakeFullscreen && <Navbar isAdmin={isAdmin} isSpecialAdmin={isSpecialAdmin} user={userProfile} siteConfig={siteConfig} />}
              
              {!isSnakeFullscreen && (
                <div className="pt-[64px]">
                  <NewsTicker />
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
                  ) : (userProfile && userProfile.isApproved === false && !isAdmin) ? (
                    <motion.div 
                      key="pending-approval"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center"
                    >
                      <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 border border-amber-500/20">
                        <Shield size={40} className="animate-pulse" />
                      </div>
                      <h1 className="text-3xl font-display font-bold text-white mb-4 uppercase tracking-tight italic">Approval Pending</h1>
                      <div className="max-w-md mx-auto space-y-4">
                        <p className="text-white/60 leading-relaxed">
                          Your account (<span className="text-amber-400 font-mono">{userProfile.email}</span>) successfully authenticated but requires administrator approval to access study materials.
                        </p>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 text-left">
                          <LogIn size={18} className="text-amber-500" />
                          <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">System Verification Protocol: ACTIVE</p>
                        </div>
                        <button 
                          onClick={() => auth.signOut()}
                          className="text-xs text-white/20 hover:text-white underline transition-colors"
                        >
                          Sign out and try another account
                        </button>
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
                      <Route path="/play-snake" element={<SnakeArena />} />
                      <Route path="/live-club" element={<LiveComments />} />
                      <Route path="/tests" element={<Tests />} />
                      <Route path="/library" element={<Library />} />
                      <Route path="/explorer" element={<Explorer />} />
                      <Route path="/surprise-preview" element={<SurprisePreview />} />
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

              {!isSnakeFullscreen && <Footer siteConfig={siteConfig} />}
              {!isSnakeFullscreen && <RatingModal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} />}
              {!isSnakeFullscreen && <WhatsAppFloat />}

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

