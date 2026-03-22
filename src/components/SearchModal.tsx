import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, BookOpen, FileText, GraduationCap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Class, Subject, Chapter } from '../types';
import { getClasses, getSubjectsByClass, getChaptersBySubject } from '../services/dataService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<{
    classes: Class[];
    subjects: Subject[];
    chapters: Chapter[];
  }>({ classes: [], subjects: [], chapters: [] });
  
  const [allData, setAllData] = useState<{
    classes: Class[];
    subjects: Subject[];
    chapters: Chapter[];
  }>({ classes: [], subjects: [], chapters: [] });

  useEffect(() => {
    if (!isOpen) return;

    // Fetch all data for searching
    // This is a simplified version, in a real app you'd search server-side
    const unsubClasses = getClasses((classes) => {
      setAllData(prev => ({ ...prev, classes }));
      
      classes.forEach(cls => {
        getSubjectsByClass(cls.id, (subjects) => {
          setAllData(prev => {
            const existingIds = new Set(prev.subjects.map(s => s.id));
            const newSubjects = subjects.filter(s => !existingIds.has(s.id));
            return { ...prev, subjects: [...prev.subjects, ...newSubjects] };
          });

          subjects.forEach(sub => {
            getChaptersBySubject(sub.id, (chapters) => {
              setAllData(prev => {
                const existingIds = new Set(prev.chapters.map(c => c.id));
                const newChapters = chapters.filter(c => !existingIds.has(c.id));
                return { ...prev, chapters: [...prev.chapters, ...newChapters] };
              });
            });
          });
        });
      });
    });

    return () => unsubClasses();
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults({ classes: [], subjects: [], chapters: [] });
      return;
    }

    const term = searchTerm.toLowerCase();
    setResults({
      classes: allData.classes.filter(c => c.name.toLowerCase().includes(term)).slice(0, 3),
      subjects: allData.subjects.filter(s => s.name.toLowerCase().includes(term)).slice(0, 5),
      chapters: allData.chapters.filter(c => c.name.toLowerCase().includes(term)).slice(0, 8)
    });
  }, [searchTerm, allData]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-dark-bg border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
          >
            <div className="p-6 border-b border-white/10 flex items-center gap-4 bg-white/5">
              <Search className="text-neon-blue" size={24} />
              <input
                autoFocus
                type="text"
                placeholder="Search for anything..."
                className="bg-transparent border-none outline-none text-xl text-white w-full placeholder:text-white/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} className="text-white/40" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
              {!searchTerm ? (
                <div className="text-center py-12">
                  <Search size={48} className="mx-auto mb-4 text-white/10" />
                  <p className="text-white/40 italic">Start typing to search across classes, subjects, and chapters.</p>
                </div>
              ) : (
                <>
                  {results.classes.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-2">
                        <GraduationCap size={14} /> Classes
                      </h3>
                      <div className="grid gap-2">
                        {results.classes.map(c => (
                          <Link 
                            key={c.id} 
                            to={`/class/${c.id}`} 
                            onClick={onClose}
                            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-neon-blue/50 hover:bg-white/10 transition-all group"
                          >
                            <span className="font-medium">{c.name}</span>
                            <ArrowRight size={16} className="text-white/20 group-hover:text-neon-blue group-hover:translate-x-1 transition-all" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.subjects.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-2">
                        <BookOpen size={14} /> Subjects
                      </h3>
                      <div className="grid gap-2">
                        {results.subjects.map(s => (
                          <Link 
                            key={s.id} 
                            to={`/class/${s.classId}/subject/${s.id}`} 
                            onClick={onClose}
                            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-neon-purple/50 hover:bg-white/10 transition-all group"
                          >
                            <span className="font-medium">{s.name}</span>
                            <ArrowRight size={16} className="text-white/20 group-hover:text-neon-purple group-hover:translate-x-1 transition-all" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.chapters.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-2">
                        <FileText size={14} /> Chapters
                      </h3>
                      <div className="grid gap-2">
                        {results.chapters.map(c => (
                          <Link 
                            key={c.id} 
                            to={`/class/${c.classId}/subject/${c.subjectId}/chapter/${c.id}`} 
                            onClick={onClose}
                            className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-neon-pink/50 hover:bg-white/10 transition-all group"
                          >
                            <span className="font-medium">{c.name}</span>
                            <ArrowRight size={16} className="text-white/20 group-hover:text-neon-pink group-hover:translate-x-1 transition-all" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.classes.length === 0 && results.subjects.length === 0 && results.chapters.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-white/40 italic">No results found for "{searchTerm}"</p>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="p-4 bg-white/5 border-t border-white/10 text-[10px] text-white/20 flex justify-between items-center">
              <div className="flex gap-4">
                <span><kbd className="bg-white/10 px-1 rounded">ESC</kbd> to close</span>
                <span><kbd className="bg-white/10 px-1 rounded">↵</kbd> to select</span>
              </div>
              <p>Search powered by Study-hub</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
