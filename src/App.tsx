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
import ErrorBoundary from './components/ErrorBoundary';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Protected Route Component
const ProtectedRoute = ({ children, isAdmin }: { children: React.ReactNode, isAdmin: boolean }) => {
  if (!isAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setIsAdmin(userDoc.data().role === 'admin');
          } else {
            if (user.email === 'vijayninama683@gmail.com') {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen relative overflow-hidden">
        {/* Background Watermark */}
        <div className="fixed inset-0 pointer-events-none z-[-1] flex items-center justify-center opacity-[0.03] select-none">
          <span className="text-[20vw] font-display font-bold whitespace-nowrap rotate-[-30deg] text-white">
            Vijay Ninama
          </span>
        </div>
        
        <Navbar isAdmin={isAdmin} />
        
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
  );
}

