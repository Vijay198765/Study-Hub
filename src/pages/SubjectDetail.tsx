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
        <Link to={`/class/${classId}`} className="inline-flex items-center gap-2 text-white/50 hover:text-neon-blue mb-8 transition-colors">
          <ArrowLeft size={18} /> Back to {currentClass?.name || 'Class'}
        </Link>

        <div className="glass-card p-8 mb-12 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-neon-blue/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-display font-bold mb-2">{subject.name}</h1>
            <p className="text-white/50">Comprehensive chapter-wise study resources and practice papers.</p>
          </div>
        </div>

        <div className="space-y-4">
          {enabledChapters.map((chapter, idx) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link to={`/class/${classId}/subject/${subjectId}/chapter/${chapter.id}`}>
                <div className="glass-card p-6 flex items-center justify-between group hover:neon-border transition-all">
                  <div className="flex items-center gap-6">
                    <div className="text-2xl font-display font-bold text-white/20 group-hover:text-neon-blue transition-colors">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold group-hover:neon-text transition-colors">{chapter.name}</h3>
                        {chapter.isImportant && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple text-[10px] font-bold uppercase tracking-wider">
                            <Star size={10} fill="currentColor" /> Important
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/40">{chapter.resources.length} Resources • {chapter.quiz.length} Quiz Questions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 text-xs text-white/30">
                      <Info size={14} /> Click to view materials
                    </div>
                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-neon-blue group-hover:bg-neon-blue/10 transition-all">
                      <ChevronRight size={20} className="group-hover:text-neon-blue" />
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
