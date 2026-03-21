import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Book, ArrowLeft, ChevronRight, GraduationCap } from 'lucide-react';
import { Class, Subject } from '../types';
import { getClasses, getSubjectsByClass } from '../services/dataService';

export default function ClassDetail() {
  const { classId } = useParams();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="pt-32 text-center text-white/40">Loading class details...</div>;
  if (!currentClass) return <div className="pt-32 text-center text-white/40">Class not found</div>;

  const enabledSubjects = subjects.filter(s => s.enabled);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-neon-blue mb-8 transition-colors">
          <ArrowLeft size={18} /> Back to Home
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl font-display font-bold mb-2">{currentClass.name}</h1>
            <p className="text-white/50">Select a subject to view chapters and study materials.</p>
          </div>
          <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
            <GraduationCap className="text-neon-blue" />
            <span className="font-medium">{enabledSubjects.length} Subjects Available</span>
          </div>
        </div>

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
