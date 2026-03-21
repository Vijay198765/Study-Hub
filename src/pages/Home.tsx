import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, GraduationCap, ArrowRight, BookOpen, Star, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Class } from '../types';
import { getClasses } from '../services/dataService';

export default function Home() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayText, setDisplayText] = useState('');
  const fullText = "The Future of Learning is Here.";

  useEffect(() => {
    const unsubscribe = getClasses(setClasses);
    return () => unsubscribe();
  }, []);

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
        
        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight">
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

      {/* Class Grid */}
      <section className="max-w-7xl mx-auto">
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
