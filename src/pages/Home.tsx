import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, GraduationCap, ArrowRight, BookOpen, Star, Clock, History, Trophy, Medal } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Class, TestResult } from '../types';
import { getClasses, getGlobalLeaderboard } from '../services/dataService';

export default function Home() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [leaderboard, setLeaderboard] = useState<TestResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [recentChapters, setRecentChapters] = useState<any[]>([]);
  const location = useLocation();
  const fullText = "The Future of Learning is Here.";

  useEffect(() => {
    const unsubscribeClasses = getClasses(setClasses);
    const unsubscribeLeaderboard = getGlobalLeaderboard(setLeaderboard);
    
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
      unsubscribeLeaderboard();
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

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const quotes = [
    "Education is the most powerful weapon which you can use to change the world.",
    "The beautiful thing about learning is that no one can take it away from you.",
    "The expert in anything was once a beginner.",
    "Success is the sum of small efforts, repeated day in and day out."
  ];
  const [randomQuote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-sm font-medium mb-6"
        >
          🚀 Welcome to Study-hub
        </motion.div>
        
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight leading-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">
            {displayText}
          </span>
          <span className="animate-pulse text-neon-blue">|</span>
        </h1>
        
        <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 italic">
          "{randomQuote}"
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative flex items-center bg-dark-bg border border-white/10 rounded-2xl px-4 py-3">
            <Search className="text-white/40 w-5 h-5 mr-3" />
            <input
              type="text"
              placeholder="Search for classes or subjects..."
              className="bg-transparent border-none outline-none text-white w-full placeholder:text-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      {recentChapters.length > 0 && (
        <section className="max-w-7xl mx-auto mb-20">
          <div className="flex items-center gap-3 mb-8">
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
                      <p className="text-xs text-white/40">{chapter.subjectName}</p>
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
          {filteredClasses.map((cls, idx) => (
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
          ))}
          {filteredClasses.length === 0 && (
            <div className="col-span-full text-center py-20 text-white/20 italic">
              No classes found. Please check back later or try a different search.
            </div>
          )}
        </div>
      </section>

      {/* Leaderboard Section */}
      {leaderboard.length > 0 && (
        <section className="max-w-7xl mx-auto mb-32">
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="text-yellow-500" />
            <h2 className="text-3xl font-display font-bold">Top Performers</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 glass-card p-8">
              <div className="space-y-4">
                {leaderboard.map((result, idx) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                        idx === 0 ? 'bg-yellow-500 text-black' :
                        idx === 1 ? 'bg-gray-300 text-black' :
                        idx === 2 ? 'bg-amber-600 text-black' :
                        'bg-white/10 text-white/60'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold truncate" title={result.studentName}>{result.studentName}</div>
                        <div className="text-xs text-white/40 truncate">{result.testTitle}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-neon-blue font-bold">{result.score}%</div>
                      <div className="text-[10px] text-white/20 uppercase tracking-widest">
                        {result.completedAt?.toDate ? result.completedAt.toDate().toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6 text-yellow-500">
                <Medal size={40} />
              </div>
              <h3 className="text-2xl font-bold mb-4">Aim for the Top!</h3>
              <p className="text-white/50 mb-8">
                Take tests, score high, and see your name on the global leaderboard.
              </p>
              <Link to="/tests" className="w-full py-4 rounded-xl bg-neon-blue text-black font-bold hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all">
                View All Tests
              </Link>
            </div>
          </div>
        </section>
      )}

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
  );
}
