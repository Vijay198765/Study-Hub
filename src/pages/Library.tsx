import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Folder as FolderIcon, ChevronRight, ChevronDown, FileText, Search, BookOpen, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getClasses, getSubjectsByClass, getChaptersBySubject, getFolders } from '../services/dataService';
import { Class, Subject, Chapter, Folder } from '../types';
import { cn } from '../lib/utils';

export default function Library() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubClasses = getClasses(setClasses);
    const unsubFolders = getFolders(setFolders);
    let unsubSubjects = () => {};
    let unsubChapters = () => {};

    if (selectedClassId) {
      unsubSubjects = getSubjectsByClass(selectedClassId, setSubjects);
    }
    
    if (selectedSubjectId) {
      unsubChapters = getChaptersBySubject(selectedSubjectId, (data) => {
        setChapters(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      unsubClasses();
      unsubFolders();
      unsubSubjects();
      unsubChapters();
    };
  }, [selectedClassId, selectedSubjectId]);

  const filteredFolders = folders.filter(f => 
    (!selectedClassId || f.classId === selectedClassId) && 
    (!selectedSubjectId || f.subjectId === selectedSubjectId) &&
    f.enabled
  );

  const filteredChapters = chapters.filter(c => 
    (!selectedClassId || c.classId === selectedClassId) && 
    (!selectedSubjectId || c.subjectId === selectedSubjectId) &&
    c.enabled &&
    (!searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const buildTree = (parentId: string | null) => {
    return filteredFolders
      .filter(f => f.parentId === parentId || (!parentId && !f.parentId))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const FolderItem = ({ folder, level = 0 }: { folder: Folder, level: number }) => {
    const [isExpanded, setIsExpanded] = useState(level < 1);
    const children = filteredFolders.filter(f => f.parentId === folder.id);
    const folderChapters = filteredChapters.filter(c => c.folderId === folder.id);

    if (children.length === 0 && folderChapters.length === 0 && level > 0) return null;

    return (
      <div className={cn("space-y-2", level > 0 && "ml-6 pl-4 border-l border-white/5")}>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
        >
          <div className="text-white/20 group-hover:text-white transition-colors">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
          <FolderIcon size={20} className="text-neon-blue shrink-0" />
          <div className="flex-grow text-left">
            <h4 className="text-sm font-bold text-white leading-none">{folder.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-black">
                {children.length} Folders
              </span>
              <span className="text-[9px] text-white/10">•</span>
              <span className="text-[9px] text-neon-blue/40 uppercase tracking-widest font-black">
                {folderChapters.length} Chapters
              </span>
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-2 overflow-hidden"
            >
              {children.map(child => <FolderItem key={child.id} folder={child} level={level + 1} />)}
              {folderChapters.map(chapter => (
                <Link
                  key={chapter.id}
                  to={`/class/${chapter.classId}/subject/${chapter.subjectId}/chapter/${chapter.id}`}
                  className="ml-8 flex items-center gap-3 p-3 bg-neon-blue/5 border border-neon-blue/10 rounded-xl hover:bg-neon-blue/10 hover:border-neon-blue/30 transition-all group/ch"
                >
                  <FileText size={16} className="text-neon-blue/60 group-hover/ch:text-neon-blue shrink-0" />
                  <span className="text-xs font-medium text-white/70 group-hover/ch:text-white">{chapter.name}</span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-neon-blue text-xs font-bold uppercase tracking-widest"
          >
            <Layers size={14} /> Global Library
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-display font-bold break-tight">Exploration <span className="neon-text">Vault</span></h1>
          <p className="text-white/40 text-sm max-w-xl mx-auto">Browse through our entire hierarchical collection of study materials and chapter notes.</p>
        </header>

        <section className="glass-card p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-2">Class</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-neon-blue outline-none transition-all"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSubjectId('');
                }}
              >
                <option value="" className="bg-dark-bg text-white/40">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id} className="bg-dark-bg">{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-2">Subject</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:border-neon-blue outline-none transition-all disabled:opacity-30"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                disabled={!selectedClassId}
              >
                <option value="" className="bg-dark-bg">Select Subject</option>
                {subjects.filter(s => s.classId === selectedClassId).map(s => <option key={s.id} value={s.id} className="bg-dark-bg">{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest font-black text-white/40 ml-2">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input 
                  type="text"
                  placeholder="Find chapter..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-neon-blue outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            {loading ? (
              <div className="py-20 text-center animate-pulse text-white/20 uppercase tracking-[0.2em] font-black text-xs">Accessing neural links...</div>
            ) : (!selectedClassId || !selectedSubjectId) ? (
              <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <BookOpen size={48} className="mx-auto text-white/10 mb-4" />
                <p className="text-white/20 italic font-medium">Choose Class & Subject to browse the vault</p>
              </div>
            ) : (
              <div className="space-y-4">
                {buildTree(null).map(folder => (
                  <FolderItem key={folder.id} folder={folder} level={0} />
                ))}
                
                {/* Chapters without folders */}
                {filteredChapters.filter(c => !c.folderId).map(chapter => (
                  <Link
                    key={chapter.id}
                    to={`/class/${chapter.classId}/subject/${chapter.subjectId}/chapter/${chapter.id}`}
                    className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-neon-purple/10 flex items-center justify-center text-neon-purple shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-base font-bold text-white group-hover:neon-text-purple transition-all">{chapter.name}</h4>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Independent Chapter</p>
                    </div>
                    <ChevronRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
                  </Link>
                ))}

                {buildTree(null).length === 0 && filteredChapters.length === 0 && (
                  <div className="py-20 text-center text-white/20">This section is currently empty.</div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
