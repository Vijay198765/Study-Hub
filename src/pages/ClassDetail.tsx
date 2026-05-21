import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Book, ArrowLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { Class, Subject } from '../types';
import { getClasses, getSubjectsByClass } from '../services/dataService';
import { Skeleton } from '../components/Skeleton';
import { db } from '../firebase';
import { collection, query, where, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { convertDriveUrl } from '../lib/utils';

export default function ClassDetail() {
  const { classId } = useParams();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<{ photoURL?: string; name?: string } | null>(null);

  useEffect(() => {
    // Listen to all users with admin role in real-time
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['admin', 'superadmin', 'super_admin'])
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        // Try finding 'vijayninama683@gmail.com' case-insensitively
        let matchDoc = snap.docs.find(d => {
          const email = (d.data().email || '').toLowerCase();
          return email === 'vijayninama683@gmail.com';
        });
        
        // Fallback to tagoreteam2025@gmail.com
        if (!matchDoc) {
          matchDoc = snap.docs.find(d => {
            const email = (d.data().email || '').toLowerCase();
            return email === 'tagoreteam2025@gmail.com';
          });
        }
        
        const adminDoc = matchDoc || snap.docs[0];
        const docData = adminDoc.data();
        
        console.log("Loaded Admin User for ClassDetail:", docData.email, "Photo:", docData.photoURL);
        
        setAdminUser({
          photoURL: docData.photoURL || '',
          name: docData.name || 'Vijay'
        });
      } else {
        // Fallback to searching without role filters
        getDocs(collection(db, 'users')).then((allSnap) => {
          const matchDoc = allSnap.docs.find(d => {
            const email = (d.data().email || '').toLowerCase();
            return email === 'vijayninama683@gmail.com' || email === 'tagoreteam2025@gmail.com';
          });
          if (matchDoc) {
            const docData = matchDoc.data();
            setAdminUser({
              photoURL: docData.photoURL || '',
              name: docData.name || 'Vijay'
            });
          }
        }).catch(err => {
          console.warn('Fallback users query failed:', err);
        });
      }
    }, (error) => {
      console.warn('Admin user listener error:', error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeClasses = getClasses(setClasses);
    let unsubscribeSubjects: () => void = () => {};

    if (classId) {
      unsubscribeSubjects = getSubjectsByClass(classId, (data) => {
        setSubjects(data);
        setLoading(false);
      });
    }

    return () => {
      unsubscribeClasses();
      unsubscribeSubjects();
    };
  }, [classId]);

  const currentClass = classes.find(c => c.id === classId);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-6 w-32 bg-white/5 rounded-lg mb-8 animate-pulse"></div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="h-12 w-64 bg-white/5 rounded-lg mb-4 animate-pulse"></div>
              <div className="h-4 w-96 bg-white/5 rounded-lg animate-pulse"></div>
            </div>
            <div className="h-12 w-48 bg-white/5 rounded-2xl animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-6 w-32 bg-white/5 rounded-lg animate-pulse"></div>
                    <div className="h-4 w-24 bg-white/5 rounded-lg animate-pulse"></div>
                  </div>
                </div>
                <div className="w-6 h-6 bg-white/5 rounded-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentClass) return <div className="pt-32 text-center text-white/40">Class not found</div>;

  const enabledSubjects = subjects.filter(s => s.enabled);

  return (
    <div className="min-h-screen pt-24 pb-12">
      <section className="bg-transparent border-b border-white/5 pt-8 pb-16 px-4 mb-12">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-neon-blue mb-8 transition-colors">
            <ArrowLeft size={18} /> Back to Home
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl font-display font-bold mb-2">{currentClass.name}</h1>
              <p className="text-white/50">Select a subject to view chapters and study materials.</p>
            </div>
            <div className="flex flex-col items-stretch md:items-end gap-3 shrink-0">
              <div className="flex items-center gap-4 bg-black px-6 py-3 rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(0,242,255,0.1)]">
                <GraduationCap className="text-neon-blue drop-shadow-[0_0_5px_rgba(0,242,255,0.5)]" />
                <span className="font-medium text-white/80">
                  <span className="text-neon-blue font-bold drop-shadow-[0_0_8px_rgba(0,242,255,0.6)]">{enabledSubjects.length}</span> Subjects Available
                </span>
              </div>
              
              <div className="flex items-center gap-4 bg-zinc-950/80 border border-white/5 hover:border-emerald-500/20 px-5 py-3 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(52,211,153,0.05)] transition-all">
                {/* User's DP profile logo to the left of the Gmail icons */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 p-[1.5px] shrink-0 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform duration-200">
                  <div className="w-full h-full rounded-full bg-zinc-950 overflow-hidden relative">
                    <img 
                      src={adminUser?.photoURL ? convertDriveUrl(adminUser.photoURL) : "https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay"} 
                      alt="Vijay Avatar" 
                      className="w-full h-full object-cover object-center aspect-square rounded-full"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay";
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.2)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" fill="#F2F2F2" />
                      <path d="M20 4H16V14L20 11V4Z" fill="#C5221F" />
                      <path d="M4 4H8V14L4 11V4Z" fill="#B31412" />
                      <path d="M20 4L12 11L4 4V6L12 13L20 6V4Z" fill="#EA4335" />
                      <path d="M2 6V18C2 19.1 2.9 20 4 20H8V11L2 6Z" fill="#4285F4" />
                      <path d="M22 6V18C2 19.1 21.1 20 20 20H16V11L22 6Z" fill="#34A853" />
                    </svg>
                    <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Support</span>
                  </div>
                  <a 
                    href="mailto:vijayninama683@gmail.com" 
                    className="text-xs font-mono font-medium text-white/80 hover:text-neon-blue transition-all"
                    title="Contact Support via Gmail"
                  >
                    vijayninama683@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enabledSubjects.map((subject, idx) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link to={`/class/${classId}/subject/${subject.id}`}>
                <div className="glass-card p-6 flex items-center justify-between group hover:neon-border transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue group-hover:bg-neon-blue group-hover:text-black transition-all">
                      <Book size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold group-hover:neon-text transition-colors">{subject.name}</h3>
                      <p className="text-sm text-white/40">View Chapters</p>
                    </div>
                  </div>
                  <ChevronRight className="text-white/20 group-hover:text-neon-blue group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
          
          {enabledSubjects.length === 0 && (
            <div className="col-span-full text-center py-20 glass-card">
              <p className="text-white/30 italic">No subjects added yet for this class.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
