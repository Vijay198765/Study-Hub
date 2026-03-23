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
    <div className="min-h-screen pt-24 pb-12 px-4 hero-gradient">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xs md:text-sm text-white/30 mb-8 overflow-x-auto no-scrollbar whitespace-nowrap pb-2">
          <Link to="/" className="hover:text-neon-blue transition-colors flex items-center gap-1">
            <ArrowLeft size={14} /> Home
          </Link>
          <ChevronRight size={12} />
          <Link to={`/class/${classId}`} className="hover:text-neon-blue transition-colors">{currentClass?.name || 'Class'}</Link>
          <ChevronRight size={12} />
          <span className="text-white/60 break-words">{subject.name}</span>
        </div>

        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-bold uppercase tracking-widest mb-6"
          >
            {currentClass?.name} • Subject
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 break-words tracking-tight">
            {subject.name}
          </h1>
          <p className="text-white/40 text-xl max-w-2xl mx-auto">
            Comprehensive chapter-wise study resources and practice papers for {subject.name}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enabledChapters.map((chapter, idx) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -8 }}
              className="group"
            >
              <Link to={`/class/${classId}/subject/${subjectId}/chapter/${chapter.id}`} className="block h-full">
                <div className="glass-card p-8 h-full flex flex-col group-hover:neon-border transition-all relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-neon-blue/5 rounded-full blur-2xl group-hover:bg-neon-blue/10 transition-colors"></div>
                  
                  <div className="flex items-start justify-between mb-8">
                    <div className="text-4xl font-display font-bold text-white/10 group-hover:text-neon-blue transition-colors">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                    {chapter.isImportant && (
                      <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-neon-purple/20 text-neon-purple text-[10px] font-bold uppercase tracking-wider">
                        <Star size={12} fill="currentColor" /> Important
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-display font-bold mb-4 group-hover:neon-text transition-colors break-words">
                    {chapter.name}
                  </h3>
                  
                  <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="text-xs text-white/30 uppercase tracking-widest font-bold">
                      {chapter.resources.length} Materials
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
            <div className="col-span-full text-center py-32 glass-card">
              <BookOpen size={48} className="mx-auto mb-6 text-white/10" />
              <p className="text-white/40 text-xl italic">No chapters available for this subject yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
