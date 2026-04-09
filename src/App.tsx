import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ClassDetail from './pages/ClassDetail';
import SubjectDetail from './pages/SubjectDetail';
import ChapterDetail from './pages/ChapterDetail';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import StudyTips from './pages/StudyTips';
import Games from './pages/Games';
import LiveComments from './pages/LiveComments';
import Tests from './pages/Tests';
import ErrorBoundary from './components/ErrorBoundary';
import WelcomeOverlay from './components/WelcomeOverlay';
import { LoadingScreen } from './components/LoadingScreen';
import { auth, db, testConnection, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { ThemeProvider } from './contexts/ThemeContext';
import Watermark from './components/Watermark';
import RatingModal from './components/RatingModal';

import FirebaseSetupGuide from './components/FirebaseSetupGuide';
import firebaseConfig from '../firebase-applet-config.json';

// Protected Route Component
const ProtectedRoute = ({ children, isAdmin, isSpecialAdmin }: { children: React.ReactNode, isAdmin: boolean, isSpecialAdmin: boolean }) => {
  if (!isAdmin && !isSpecialAdmin) return <Navigate to="/login" replace />;
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
  const [firebaseError, setFirebaseError] = useState<'auth' | 'firestore' | 'both' | null>(null);

  // Test connection on boot
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
    
    // Check for special admin status immediately
    const isSpecial = localStorage.getItem('isSpecialLogin') === 'true';
    const isAdminLogin = localStorage.getItem('isAdminLogin') === 'true';
    if (isSpecial && isAdminLogin) {
      setIsSpecialAdmin(true);
    }
  }, []);

  // Listen for auth errors globally
  useEffect(() => {
    const handleAuthError = (event: any) => {
      if (event.detail?.code === 'auth/admin-restricted-operation') {
        setFirebaseError(prev => prev === 'firestore' ? 'both' : 'auth');
      }
    };
    window.addEventListener('firebase-auth-error', handleAuthError);
    return () => window.removeEventListener('firebase-auth-error', handleAuthError);
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
    window.scrollTo(0, 0);
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
      const specialName = localStorage.getItem('studentName') || 'Vijay Admin';

      if (firebaseUser) {
        // Listen to user profile changes
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("App: User profile loaded:", data);
            
            // Upgrade anonymous user to admin if they have the special login flags
            if (firebaseUser.isAnonymous && isSpecial && isAdminLogin && data.role !== 'admin') {
              try {
                await updateDoc(userRef, { 
                  role: 'admin',
                  adminKey: 'Vijay101987',
                  name: localStorage.getItem('studentName') || 'Vijay Admin',
                  isLegend: true
                });
                // The next snapshot will have the updated data
                setIsAdmin(true);
                setIsSpecialAdmin(true);
                return;
              } catch (error) {
                console.error("Error upgrading anonymous admin:", error);
              }
            }

            // Welcome Bot Logic
            if (!data.welcomeSent && data.role !== 'admin') {
              let welcomeSender = 'tagoreteam2025@gmail.com';
              let welcomeSubject = 'Welcome to Study-hub!';
              let welcomeTemplate = 'Hello {name}, welcome to Study-hub! We are glad to have you here.';

              try {
                const configSnap = await getDoc(doc(db, 'config', 'site'));
                if (configSnap.exists()) {
                  const config = configSnap.data();
                  welcomeSender = config.welcomeEmailSender || welcomeSender;
                  welcomeSubject = config.welcomeEmailSubject || welcomeSubject;
                  welcomeTemplate = config.welcomeEmailTemplate || welcomeTemplate;
                }
                
                // Check if this is a "new" user (created in the last 24 hours) 
                const createdAt = data.createdAt ? new Date(data.createdAt).getTime() : 0;
                const now = Date.now();
                const isRecent = (now - createdAt) < (24 * 60 * 60 * 1000); // 24 hours

                  if (isRecent || !data.createdAt) {
                    console.log("Welcome Bot: Sending email to new user:", firebaseUser.email);
                    
                    // 1. Log to Firestore (for history)
                    await addDoc(collection(db, 'sentEmails'), {
                      to: firebaseUser.email || 'anonymous@studyhub.com',
                      message: {
                        subject: welcomeSubject,
                        html: welcomeTemplate.replace('{name}', data.name || 'Student'),
                      },
                      sentAt: serverTimestamp(),
                      type: 'welcome'
                    });

                    // 2. Send via EmailJS (if configured)
                    try {
                      const configSnap = await getDoc(doc(db, 'config', 'site'));
                      if (configSnap.exists()) {
                        const config = configSnap.data();
                        if (config.emailjsServiceId && config.emailjsTemplateId && config.emailjsPublicKey) {
                          await emailjs.send(
                            config.emailjsServiceId,
                            config.emailjsTemplateId,
                            {
                              to_email: firebaseUser.email,
                              to_name: data.name || 'Student',
                              subject: welcomeSubject,
                              message: welcomeTemplate.replace('{name}', data.name || 'Student'),
                              from_name: 'Study-hub Bot'
                            },
                            config.emailjsPublicKey
                          );
                          console.log("Welcome Bot: EmailJS delivery successful");
                        }
                      }
                    } catch (emailjsErr) {
                      console.error("Welcome Bot: EmailJS delivery failed:", emailjsErr);
                    }
                  }
                
                // Always mark as sent to prevent re-checks
                await updateDoc(userRef, { welcomeSent: true });
              } catch (err) {
                console.error("Error in welcome bot:", err);
              }
            }

            setUserProfile({ ...data, isLegend: data.isLegend || data.role === 'admin' });
            const isUserAdmin = data.role === 'admin';
            setIsAdmin(isUserAdmin);
            if (isUserAdmin) setIsSpecialAdmin(true);
          } else {
            // Fallback for new users or if doc doesn't exist yet
            const adminEmails = ['vijayninama683@gmail.com'];
            const isDefaultAdmin = adminEmails.includes(firebaseUser.email?.toLowerCase() || '');
            
            let role = isDefaultAdmin ? 'admin' : 'student';
            let name = firebaseUser.displayName || 'Student';
            let extraData: any = {};

            if (firebaseUser.isAnonymous && isSpecial && isAdminLogin) {
              role = 'admin';
              name = localStorage.getItem('studentName') || 'Vijay Admin';
              extraData = { adminKey: 'Vijay101987', isLegend: true };
              setIsSpecialAdmin(true);
              setIsAdmin(true);
            }

            const newUserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || (firebaseUser.isAnonymous ? 'anonymous@studyhub.com' : ''),
              name: name,
              role: role,
              createdAt: new Date().toISOString(),
              isLegend: role === 'admin',
              ...extraData
            };

            try {
              await setDoc(userRef, newUserProfile);
              setUserProfile(newUserProfile);
              setIsAdmin(role === 'admin');
            } catch (error) {
              console.error("Error creating user profile:", error);
              // If we can't create the doc (e.g. permissions), at least set local state
              setUserProfile(newUserProfile);
              setIsAdmin(role === 'admin');
            }
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });
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
    if (user && !loading && minLoadingComplete) {
      const timer = setTimeout(() => {
        setShowRatingModal(true);
      }, 5000); // Show after 5 seconds of being on home/logged in
      return () => clearTimeout(timer);
    }
  }, [user, loading, minLoadingComplete]);

  return (
    <ThemeProvider>
      <AnimatePresence mode="wait">
        {(loading || !minLoadingComplete) ? (
          <LoadingScreen key="loading" />
        ) : (
          <ErrorBoundary key="app">
            {firebaseError && <FirebaseSetupGuide errorType={firebaseError} projectId={firebaseConfig.projectId} />}
            {showWelcome && <WelcomeOverlay onComplete={() => setShowWelcome(false)} />}
            <div className="flex flex-col min-h-screen relative overflow-hidden">
              <Watermark />
              
              <Navbar isAdmin={isAdmin || isSpecialAdmin} user={userProfile} />
              
              <main className="flex-grow">
                <AnimatePresence mode="wait">
                  <Routes location={location}>
                    <Route path="/" element={<Home />} />
                    <Route path="/classes" element={<Home />} />
                    <Route path="/class/:classId" element={<ClassDetail />} />
                    <Route path="/class/:classId/subject/:subjectId" element={<SubjectDetail />} />
                    <Route path="/class/:classId/subject/:subjectId/chapter/:chapterId" element={<ChapterDetail />} />
                    <Route path="/tips" element={<StudyTips />} />
                    <Route path="/games" element={<Games />} />
                    <Route path="/live-club" element={<LiveComments />} />
                    <Route path="/tests" element={<Tests />} />
                    <Route path="/login" element={<Login />} />
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute isAdmin={isAdmin} isSpecialAdmin={isSpecialAdmin}>
                          <AdminPanel />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AnimatePresence>
              </main>

              <Footer />
              <RatingModal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} />
            </div>
          </ErrorBoundary>
        )}
      </AnimatePresence>
    </ThemeProvider>
  );
}

