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
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { ThemeProvider } from './contexts/ThemeContext';
import Watermark from './components/Watermark';

// Protected Route Component
const ProtectedRoute = ({ children, isAdmin }: { children: React.ReactNode, isAdmin: boolean }) => {
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Test connection on boot
  useEffect(() => {
    testConnection();
  }, []);

  // Minimum loading time for the animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    // Check if we need to show welcome screen
    const hasSkipped = localStorage.getItem('hasSkippedLogin');
    if (!hasSkipped && !auth.currentUser) {
      setShowWelcome(true);
    }

    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // Listen to user profile changes
        const userRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeProfile = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setUserProfile(data);
            setIsAdmin(data.role === 'admin');
          } else {
            // Fallback for new users or if doc doesn't exist yet
            const adminEmails = ['vijayninama683@gmail.com'];
            const isDefaultAdmin = adminEmails.includes(firebaseUser.email?.toLowerCase() || '');
            setIsAdmin(isDefaultAdmin);
            setUserProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || 'Student',
              role: isDefaultAdmin ? 'admin' : 'student'
            });
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setLoading(false);
        });
      } else {
        setIsAdmin(false);
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

  if (loading || !minLoadingComplete) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        {showWelcome && <WelcomeOverlay onComplete={() => setShowWelcome(false)} />}
        <div className="flex flex-col min-h-screen relative overflow-hidden">
          <Watermark />
          
          <Navbar isAdmin={isAdmin} user={userProfile} />
          
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
                <Route path="/comments" element={<LiveComments />} />
                <Route path="/tests" element={<Tests />} />
                <Route path="/login" element={<Login />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute isAdmin={isAdmin}>
                      <AdminPanel />
                    </ProtectedRoute>
                  } 
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </main>

          <Footer />
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

