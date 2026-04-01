import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, GraduationCap, ArrowRight, BookOpen, Star, Clock, History } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Class, Subject, Chapter } from '../types';
import { getClasses, getSubjectsByClass, getChaptersBySubject } from '../services/dataService';
import { ClassCardSkeleton } from '../components/Skeleton';

export default function Home() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [recentChapters, setRecentChapters] = useState<any[]>([]);
  const location = useLocation();
  const fullText = "The Future of Learning is Here.";

  const [allData, setAllData] = useState<{
    classes: Class[];
    subjects: Subject[];
    chapters: Chapter[];
  }>({ classes: [], subjects: [], chapters: [] });
  const [results, setResults] = useState<{
    classes: Class[];
    subjects: Subject[];
    chapters: Chapter[];
  }>({ classes: [], subjects: [], chapters: [] });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setIsSearching(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const unsubscribesRef = useRef<Map<string, () => void>>(new Map());

  useEffect(() => {
    setLoadingClasses(true);
    
    const unsubscribeClasses = getClasses((classes) => {
      setClasses(classes);
      setAllData(prev => ({ ...prev, classes }));
      setLoadingClasses(false);
      
      // Clean up old subject/chapter listeners that are no longer needed
      const currentClassIds = new Set(classes.map(c => c.id));
      unsubscribesRef.current.forEach((unsub, key) => {
        if (key.startsWith('sub_') && !currentClassIds.has(key.replace('sub_', ''))) {
          unsub();
          unsubscribesRef.current.delete(key);
        }
      });

      // Fetch subjects and chapters for global search
      classes.forEach(cls => {
        if (!unsubscribesRef.current.has(`sub_${cls.id}`)) {
          const unsubscribeSubjects = getSubjectsByClass(cls.id, (subjects) => {
            setAllData(prev => {
              const otherSubjects = prev.subjects.filter(s => s.classId !== cls.id);
              return { ...prev, subjects: [...otherSubjects, ...subjects] };
            });

            // Clean up old chapter listeners for this class
            const currentSubjectIds = new Set(subjects.map(s => s.id));
            unsubscribesRef.current.forEach((unsub, key) => {
              if (key.startsWith(`ch_${cls.id}_`) && !currentSubjectIds.has(key.replace(`ch_${cls.id}_`, ''))) {
                unsub();
                unsubscribesRef.current.delete(key);
              }
            });

            subjects.forEach(sub => {
              if (!unsubscribesRef.current.has(`ch_${cls.id}_${sub.id}`)) {
                const unsubscribeChapters = getChaptersBySubject(sub.id, (chapters) => {
                  setAllData(prev => {
                    const otherChapters = prev.chapters.filter(c => c.subjectId !== sub.id);
                    return { ...prev, chapters: [...otherChapters, ...chapters] };
                  });
                });
                unsubscribesRef.current.set(`ch_${cls.id}_${sub.id}`, unsubscribeChapters);
              }
            });
          });
          unsubscribesRef.current.set(`sub_${cls.id}`, unsubscribeSubjects);
        }
      });
    });
    
    // Load recent chapters
    const saved = localStorage.getItem('recentChapters');
    if (saved) {
      try {
        setRecentChapters(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing recent chapters", e);
      }
    }

    return () => {
      unsubscribeClasses();
      unsubscribesRef.current.forEach(unsub => unsub());
      unsubscribesRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (location.pathname === '/classes') {
      setTimeout(() => {
        const el = document.getElementById('classes-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(timer);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults({ classes: [], subjects: [], chapters: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const term = searchTerm.toLowerCase();
    setResults({
      classes: allData.classes.filter(c => c.name.toLowerCase().includes(term)).slice(0, 3),
      subjects: allData.subjects.filter(s => s.name.toLowerCase().includes(term)).slice(0, 5),
      chapters: allData.chapters.filter(c => c.name.toLowerCase().includes(term)).slice(0, 8)
    });
  }, [searchTerm, allData]);

  const quote = "Find someone who loves you more than you love them.";

  return (
    <div className="min-h-screen pt-16 pb-12">
      {/* Hero Section */}
      <section className="bg-transparent pt-4 pb-12 px-4 mb-12">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-sm font-medium mb-8"
          >
            🚀 Welcome to Study-hub by Vijay Ninama
          </motion.div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold mb-10 tracking-tight leading-tight min-h-[1.2em]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
              {displayText}
            </span>
            <span className="animate-pulse text-neon-blue">|</span>
          </h1>
          
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-12 italic min-h-[3em]">
            "{quote}"
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto relative group search-container">
            <div className="relative flex items-center bg-dark-card border border-white/10 rounded-2xl px-6 py-2 shadow-[0_0_25px_rgba(0,242,255,0.2)] group-hover:shadow-[0_0_45px_rgba(0,242,255,0.35)] transition-all">
              <Search className="text-white/40 w-5 h-5 mr-4" />
              <input
                type="text"
                placeholder="Search for classes, subjects, or chapters..."
                className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/20 text-base"
                value={searchTerm}
                onFocus={() => searchTerm.trim() && setIsSearching(true)}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {isSearching && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[60] max-h-[60vh] overflow-y-auto no-scrollbar"
                >
                  <div className="p-4 space-y-6">
                    {results.classes.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-2 px-2">
                          <GraduationCap size={12} /> Classes
                        </h3>
                        <div className="grid gap-1">
                          {results.classes.map(c => (
                            <Link 
                              key={c.id} 
                              to={`/class/${c.id}`} 
                              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
                            >
                              <span className="text-sm font-medium">{c.name}</span>
                              <ArrowRight size={14} className="text-white/20 group-hover:text-neon-blue group-hover:translate-x-1 transition-all" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.subjects.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-2 px-2">
                          <BookOpen size={12} /> Subjects
                        </h3>
                        <div className="grid gap-1">
                          {results.subjects.map(s => (
                            <Link 
                              key={s.id} 
                              to={`/class/${s.classId}/subject/${s.id}`} 
                              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
                            >
                              <span className="text-sm font-medium">{s.name}</span>
                              <ArrowRight size={14} className="text-white/20 group-hover:text-neon-purple group-hover:translate-x-1 transition-all" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.chapters.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-2 px-2">
                          <Star size={12} /> Chapters
                        </h3>
                        <div className="grid gap-1">
                          {results.chapters.map(c => (
                            <Link 
                              key={c.id} 
                              to={`/class/${c.classId}/subject/${c.subjectId}/chapter/${c.id}`} 
                              className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
                            >
                              <span className="text-sm font-medium">{c.name}</span>
                              <ArrowRight size={14} className="text-white/20 group-hover:text-neon-pink group-hover:translate-x-1 transition-all" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.classes.length === 0 && results.subjects.length === 0 && results.chapters.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-white/40 text-sm italic">No results found for "{searchTerm}"</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      <div className="px-4">
        {/* Recently Viewed */}
        {recentChapters.length > 0 && (
        <section className="max-w-7xl mx-auto mb-16">
          <div className="flex items-center gap-3 mb-6">
            <History className="text-neon-purple" />
            <h2 className="text-2xl font-display font-bold">Continue Studying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentChapters.map((chapter, idx) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link to={`/class/${chapter.classId}/subject/${chapter.subjectId}/chapter/${chapter.id}`}>
                  <div className="glass-card p-6 group hover:neon-border transition-all flex items-center justify-between">
                    <div>
                      <h3 className="font-bold group-hover:neon-text transition-colors mb-1">{chapter.name}</h3>
                      <p className="text-xs text-white/40 group-hover:text-neon-blue group-hover:drop-shadow-[0_0_5px_rgba(0,242,255,0.5)] transition-all font-bold">{chapter.subjectName}</p>
                    </div>
                    <ArrowRight size={16} className="text-white/20 group-hover:text-neon-blue group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Class Grid */}
      <section id="classes-section" className="max-w-7xl mx-auto scroll-mt-24 mb-32">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-display font-bold flex items-center gap-3">
            <GraduationCap className="text-neon-blue" />
            Explore Classes
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loadingClasses ? (
            Array.from({ length: 4 }).map((_, i) => <ClassCardSkeleton key={i} />)
          ) : (
            classes.map((cls, idx) => (
              <motion.div
                key={cls.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Link to={`/class/${cls.id}`} className="block h-full">
                  <div className="glass-card p-8 h-full relative overflow-hidden group-hover:neon-border transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                      <GraduationCap size={80} />
                    </div>
                    
                    <h3 className="text-4xl font-display font-bold mb-4 group-hover:neon-text transition-colors">
                      {cls.name}
                    </h3>
                    <p className="text-white/40 mb-8">
                      Access premium study materials, notes, and interactive quizzes for {cls.name}.
                    </p>
                    
                    <div className="flex items-center text-neon-blue font-medium gap-2">
                      Explore Now <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
          {!loadingClasses && classes.length === 0 && (
            <div className="col-span-full text-center py-20 text-white/20 italic">
              No classes found. Please check back later or try a different search.
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neon-blue/10 flex items-center justify-center mx-auto mb-6 text-neon-blue">
            <BookOpen size={32} />
          </div>
          <h4 className="text-xl font-bold mb-3">Structured Content</h4>
          <p className="text-white/50">Well-organized chapters and subjects following the latest curriculum.</p>
        </div>
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neon-purple/10 flex items-center justify-center mx-auto mb-6 text-neon-purple">
            <Star size={32} />
          </div>
          <h4 className="text-xl font-bold mb-3">Practice Quizzes</h4>
          <p className="text-white/50">Test your knowledge with interactive MCQs and track your progress.</p>
        </div>
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neon-pink/10 flex items-center justify-center mx-auto mb-6 text-neon-pink">
            <Clock size={32} />
          </div>
          <h4 className="text-xl font-bold mb-3">Progress Tracking</h4>
          <p className="text-white/50">Keep track of your quiz scores and see how much you've improved over time.</p>
        </div>
      </section>
    </div>
  </div>
);
}
