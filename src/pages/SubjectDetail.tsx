import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Star, ChevronRight, Info } from 'lucide-react';
import { Class, Subject, Chapter, Folder } from '../types';
import { getClasses, getSubjectsByClass, getChaptersBySubject, getFolders } from '../services/dataService';
import { cn } from '../lib/utils';

export default function SubjectDetail() {
  const { classId, subjectId } = useParams();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeClasses = getClasses(setClasses);
    const unsubscribeFolders = getFolders(setFolders);
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
      unsubscribeFolders();
      unsubscribeSubjects();
      unsubscribeChapters();
    };
  }, [classId, subjectId]);

  const currentClass = classes.find(c => c.id === classId);
  const subject = subjects.find(s => s.id === subjectId);

  if (loading) return <div className="pt-32 text-center text-white/40">Loading subject details...</div>;
  if (!subject) return <div className="pt-32 text-center text-white/40">Subject not found</div>;

  const enabledChapters = chapters.filter(c => c.enabled);
  const subjectFolders = folders.filter(f => f.classId === classId && f.subjectId === subjectId && f.enabled !== false);

  // Group chapters hierarchies
  interface ChapterFolderNode {
    id: string;
    name: string;
    chapters: Chapter[];
    subfolders: ChapterFolderNode[];
  }

  // Helper to build the tree
  const buildTree = (): ChapterFolderNode[] => {
    const nodeMap: Record<string, ChapterFolderNode> = {};
    const rootNodes: ChapterFolderNode[] = [];

    // Create nodes for all subject folders
    subjectFolders.forEach(folder => {
      nodeMap[folder.id] = {
        id: folder.id,
        name: folder.name,
        chapters: [],
        subfolders: []
      };
    });

    // Handle legacy string folders (for backward compatibility if needed)
    // but the user wants the new system. We'll only support DB folders for now to satisfy the request.

    // Associate chapters with folders
    enabledChapters.forEach(chapter => {
      if (chapter.folderId && nodeMap[chapter.folderId]) {
        nodeMap[chapter.folderId].chapters.push(chapter);
      } else {
        // Find or create "Ungrouped"
        if (!nodeMap['ungrouped']) {
          nodeMap['ungrouped'] = { id: 'ungrouped', name: 'Chapters', chapters: [], subfolders: [] };
          rootNodes.push(nodeMap['ungrouped']);
        }
        nodeMap['ungrouped'].chapters.push(chapter);
      }
    });

    // Build subfolder relations
    subjectFolders.forEach(folder => {
      const parentId = folder.parentId;
      const hasValidParent = parentId && parentId !== 'root' && nodeMap[parentId];
      
      if (hasValidParent) {
        nodeMap[parentId!].subfolders.push(nodeMap[folder.id]);
      } else {
        rootNodes.push(nodeMap[folder.id]);
      }
    });

    return rootNodes;
  };

  const folderTree = buildTree();

  const renderChapters = (node: ChapterFolderNode, depth: number = 0) => {
    return (
      <div key={node.id} className={cn("mb-16", depth > 0 && "ml-4 md:ml-8 pl-4 md:pl-8 border-l border-white/5 mt-12")}>
        {node.name !== 'Chapters' && (
          <div className="flex items-center gap-4 mb-8">
            <h2 className={cn(
              "font-display font-bold text-white/80",
              depth === 0 ? "text-2xl" : "text-xl"
            )}>{node.name}</h2>
            <div className="h-px bg-white/5 flex-grow" />
          </div>
        )}
        
        {node.chapters.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {node.chapters.map((chapter, idx) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Link to={`/class/${classId}/subject/${subjectId}/chapter/${chapter.id}`} className="block h-full">
                  <div className="glass-card p-8 h-full flex flex-col group-hover:neon-border transition-all relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-neon-blue/5 rounded-full blur-2xl group-hover:bg-neon-blue/10 transition-colors"></div>
                    
                    <div className="flex items-start justify-between mb-8">
                      <div className="text-4xl font-display font-bold text-neon-blue/20 drop-shadow-[0_0_8px_rgba(0,242,255,0.2)] group-hover:text-neon-blue group-hover:drop-shadow-[0_0_15px_rgba(0,242,255,0.8)] transition-all duration-300">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                      {chapter.isImportant && (
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-neon-purple/20 text-neon-purple text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(188,19,254,0.4)]">
                          <Star size={12} fill="currentColor" /> Important
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-display font-bold mb-4 group-hover:neon-text transition-colors break-words">
                      {chapter.name}
                    </h3>
                    
                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="text-xs text-neon-blue/40 drop-shadow-[0_0_5px_rgba(0,242,255,0.2)] group-hover:text-neon-blue group-hover:drop-shadow-[0_0_10px_rgba(0,242,255,0.6)] uppercase tracking-widest font-bold transition-all">
                        {chapter.resources?.length || 0} Materials
                      </div>
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-neon-blue group-hover:bg-neon-blue/10 transition-all">
                        <ChevronRight size={20} className="group-hover:text-neon-blue" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {node.subfolders.map(subNode => renderChapters(subNode, depth + 1))}
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <section className="bg-transparent border-b border-white/5 pt-8 pb-16 px-4 mb-16">
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

          <div className="text-center">
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
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {folderTree.map(node => renderChapters(node))}

        {enabledChapters.length === 0 && (
          <div className="text-center py-32 glass-card">
            <BookOpen size={48} className="mx-auto mb-6 text-white/10" />
            <p className="text-white/40 text-xl italic">No chapters available for this subject yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
