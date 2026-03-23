import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Star, ChevronRight, Info } from 'lucide-react';
import { Class, Subject, Chapter } from '../types';
import { getClasses, getSubjectsByClass, getChaptersBySubject } from '../services/dataService';

export default function SubjectDetail() {
  const { classId, subjectId } = useParams();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeClasses = getClasses(setClasses);
    let unsubscribeSubjects: () => void = () => {};
    let unsubscribeChapters: () => void = () => {};

    if (classId) {
      unsubscribeSubjects = getSubjectsByClass(classId, setSubjects);
    }
    if (subjectId) {
      unsubscribeChapters = getChaptersBySubject(subjectId, (data) => {
        setChapters(data);
        setLoading(false);
      });
    }

    return () => {
      unsubscribeClasses();
      unsubscribeSubjects();
      unsubscribeChapters();
    };
  }, [classId, subjectId]);

  const currentClass = classes.find(c => c.id === classId);
  const subject = subjects.find(s => s.id === subjectId);

  if (loading) return <div className="pt-32 text-center text-white/40">Loading subject details...</div>;
  if (!subject) return <div className="pt-32 text-center text-white/40">Subject not found</div>;

  const enabledChapters = chapters.filter(c => c.enabled);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xs md:text-sm text-white/30 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap pb-2">
          <Link to="/" className="hover:text-neon-blue transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to={`/class/${classId}`} className="hover:text-neon-blue transition-colors">{currentClass?.name || 'Class'}</Link>
          <ChevronRight size={12} />
          <span className="text-white/60 break-words">{subject.name}</span>
        </div>

        <div className="glass-card p-6 md:p-8 mb-8 md:mb-12 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-neon-blue/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 break-words">{subject.name}</h1>
            <p className="text-sm md:text-base text-white/50">Comprehensive chapter-wise study resources and practice papers.</p>
          </div>
        </div>

        <div className="space-y-4">
          {enabledChapters.map((chapter, idx) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.01, x: 5 }}
              whileTap={{ scale: 0.99 }}
            >
              <Link to={`/class/${classId}/subject/${subjectId}/chapter/${chapter.id}`}>
                <div className="glass-card p-6 flex items-center justify-between group hover:neon-border transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/0 via-neon-blue/0 to-neon-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center gap-4 md:gap-6 relative z-10 min-w-0 flex-1">
                    <div className="text-xl md:text-2xl font-display font-bold text-white/20 group-hover:text-neon-blue transition-colors shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg md:text-xl font-bold group-hover:neon-text transition-colors break-words" title={chapter.name}>
                          {chapter.name}
                        </h3>
                        {chapter.isImportant && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple text-[9px] md:text-[10px] font-bold uppercase tracking-wider shrink-0">
                            <Star size={10} fill="currentColor" /> Important
                          </span>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-white/40 truncate">
                        {chapter.resources.length} Resources • {chapter.quiz.length} Quiz Questions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 relative z-10 shrink-0">
                    <div className="hidden lg:flex items-center gap-2 text-[10px] text-white/20 uppercase tracking-widest font-bold">
                      <Info size={12} /> View Materials
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-neon-blue group-hover:bg-neon-blue/10 transition-all">
                      <ChevronRight size={18} className="group-hover:text-neon-blue" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}

          {enabledChapters.length === 0 && (
            <div className="text-center py-20 glass-card">
              <p className="text-white/30 italic">No chapters available for this subject yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
