import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit2, Trash2, GripVertical, Save, X, 
  ChevronRight, ChevronDown, Search, Users, 
  BookOpen, Layers, BarChart3, CheckCircle2, 
  AlertCircle, ExternalLink, FileText, HelpCircle,
  ArrowUp, ArrowDown, Info, Upload, RefreshCcw, Eye
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  getClasses, saveClass, removeClass, 
  getSubjectsByClass, saveSubject, removeSubject, 
  getChaptersBySubject, saveChapter, removeChapter, 
  getUsers, saveUser, removeUser 
} from '../services/dataService';
import { Class, Subject, Chapter, User, Resource, QuizQuestion } from '../types';

type AdminTab = 'classes' | 'subjects' | 'chapters' | 'users' | 'stats';
type EditTab = 'basic' | 'resources' | 'quiz';

const DraggableAny = Draggable as any;

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('classes');
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [editTab, setEditTab] = useState<EditTab>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'class' | 'subject' | 'chapter' | 'user', id: string, name: string } | null>(null);
  const [uploadingResource, setUploadingResource] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const handleFileUpload = async (file: File, resourceId: string, index: number) => {
    if (!file || uploadingResource === resourceId) return;
    
    // Limit file size to 10MB for better performance and to prevent hanging
    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large. Please upload a PDF smaller than 10MB.");
      return;
    }

    setUploadingResource(resourceId);
    setUploadProgress(prev => ({ ...prev, [resourceId]: 0 }));
    
    try {
      const storageRef = ref(storage, `resources/${Date.now()}_${file.name}`);
      const metadata = {
        contentType: file.type || 'application/pdf',
      };
      
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, [resourceId]: progress }));
          console.log(`Upload progress for ${resourceId}: ${progress}%`);
        }, 
        (error) => {
          console.error("Upload failed with error:", error);
          setUploadingResource(null);
          
          let message = "Failed to upload file. ";
          if (error.code === 'storage/unauthorized') {
            message += "Please check your Firebase Storage rules in the console.";
          } else if (error.code === 'storage/canceled') {
            message += "Upload was canceled.";
          } else {
            message += "Please check your internet connection and try again.";
          }
          alert(message);
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newResources = [...editingEntity.resources];
          newResources[index].url = downloadURL;
          setEditingEntity({ ...editingEntity, resources: newResources });
          setUploadingResource(null);
          console.log("Upload successful! URL:", downloadURL);
        }
      );
    } catch (err) {
      console.error("Error initiating upload:", err);
      setUploadingResource(null);
      alert("An unexpected error occurred while starting the upload.");
    }
  };

  // Load initial data
  useEffect(() => {
    const unsubClasses = getClasses(setClasses);
    const unsubUsers = getUsers(setUsers);
    return () => {
      unsubClasses();
      unsubUsers();
    };
  }, []);

  // Load subjects when class changes
  useEffect(() => {
    if (selectedClassId) {
      const unsubSubjects = getSubjectsByClass(selectedClassId, setSubjects);
      return () => unsubSubjects();
    } else {
      setSubjects([]);
      setSelectedSubjectId('');
    }
  }, [selectedClassId]);

  // Load chapters when subject changes
  useEffect(() => {
    if (selectedSubjectId) {
      const unsubChapters = getChaptersBySubject(selectedSubjectId, setChapters);
      return () => unsubChapters();
    } else {
      setChapters([]);
    }
  }, [selectedSubjectId]);

  // Reordering functions
  const handleMove = async (type: 'class' | 'subject' | 'chapter', index: number, direction: 'up' | 'down') => {
    let list: any[] = [];
    let saveFn: any;

    if (type === 'class') {
      list = [...classes];
      saveFn = saveClass;
    } else if (type === 'subject') {
      list = [...subjects];
      saveFn = saveSubject;
    } else if (type === 'chapter') {
      list = [...chapters];
      saveFn = saveChapter;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;

    // Swap orders
    const item1 = { ...list[index] };
    const item2 = { ...list[newIndex] };
    
    const tempOrder = item1.order || index;
    item1.order = item2.order || newIndex;
    item2.order = tempOrder;

    await saveFn(item1);
    await saveFn(item2);
  };

  const handleDelete = async (type: 'class' | 'subject' | 'chapter' | 'user', id: string, name: string) => {
    setDeleteConfirm({ type, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    
    if (type === 'class') await removeClass(id);
    else if (type === 'subject') await removeSubject(id);
    else if (type === 'chapter') await removeChapter(id);
    else if (type === 'user') await removeUser(id);
    
    setDeleteConfirm(null);
  };

  const handleEdit = (entity: any, type: string) => {
    setEditingEntity({ ...entity, type });
    setEditTab('basic');
  };

  const handleSave = async () => {
    if (!editingEntity) return;
    setIsSaving(true);
    try {
      if (editingEntity.type === 'class') await saveClass(editingEntity);
      else if (editingEntity.type === 'subject') await saveSubject(editingEntity);
      else if (editingEntity.type === 'chapter') await saveChapter(editingEntity);
      setEditingEntity(null);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const addNew = (type: 'class' | 'subject' | 'chapter') => {
    const id = Date.now().toString();
    const order = type === 'class' ? classes.length : (type === 'subject' ? subjects.length : chapters.length);
    
    let newEntity: any = { id, name: 'New ' + type, enabled: true, order };
    
    if (type === 'subject') {
      if (!selectedClassId) {
        alert("Please select a class first");
        return;
      }
      newEntity.classId = selectedClassId;
    } else if (type === 'chapter') {
      if (!selectedSubjectId) {
        alert("Please select a subject first");
        return;
      }
      newEntity.subjectId = selectedSubjectId;
      newEntity.classId = selectedClassId;
      newEntity.resources = [];
      newEntity.quiz = [];
      newEntity.isImportant = false;
    }
    
    setEditingEntity({ ...newEntity, type });
    setEditTab('basic');
  };

  // Stats data
  const statsData = [
    { name: 'Classes', value: classes.length },
    { name: 'Subjects', value: subjects.length },
    { name: 'Chapters', value: chapters.length },
    { name: 'Users', value: users.length },
  ];

  const COLORS = ['#00E5FF', '#A855F7', '#EC4899', '#10B981'];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-display font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-white/40">Manage your educational ecosystem.</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto no-scrollbar max-w-full">
            <button 
              onClick={() => setActiveTab('classes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'classes' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,229,255,0.5)]' : 'text-white/60 hover:text-white'}`}
            >
              <Layers size={16} className="inline-block mr-1.5" />
              Classes
            </button>
            <button 
              onClick={() => setActiveTab('subjects')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'subjects' ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-white/60 hover:text-white'}`}
            >
              <BookOpen size={16} className="inline-block mr-1.5" />
              Subjects
            </button>
            <button 
              onClick={() => setActiveTab('chapters')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'chapters' ? 'bg-neon-pink text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'text-white/60 hover:text-white'}`}
            >
              <FileText size={16} className="inline-block mr-1.5" />
              Chapters
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-emerald-500 text-white shadow-[0_0_15_rgba(16,185,129,0.5)]' : 'text-white/60 hover:text-white'}`}
            >
              <Users size={16} className="inline-block mr-1.5" />
              Users
            </button>
            <button 
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
            >
              <BarChart3 size={16} className="inline-block mr-1.5" />
              Stats
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="glass-card p-6 min-h-[600px]">
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-grow max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search classes..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-neon-blue outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => addNew('class')}
                  className="btn-neon bg-neon-blue text-black px-6 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus size={20} />
                  Add Class
                </button>
              </div>

              <div className="grid gap-4">
                {classes.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((cls, index) => (
                    <motion.div 
                      key={cls.id}
                      layout
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-neon-blue/50 transition-all group gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="flex flex-col gap-1 shrink-0">
                          <button 
                            onClick={() => handleMove('class', index, 'up')}
                            disabled={index === 0}
                            className="text-white/20 hover:text-neon-blue disabled:opacity-0"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button 
                            onClick={() => handleMove('class', index, 'down')}
                            disabled={index === classes.length - 1}
                            className="text-white/20 hover:text-neon-blue disabled:opacity-0"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-medium text-white truncate">{cls.name}</h3>
                          <p className="text-xs text-white/40 truncate">ID: {cls.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <button 
                          onClick={() => saveClass({ ...cls, enabled: !cls.enabled })}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${cls.enabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-white/40'}`}
                        >
                          {cls.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <div className="flex items-center gap-2 transition-all">
                          <a 
                            href={`/class/${cls.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-white/60 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all"
                            title="View Page"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <button 
                            onClick={() => handleEdit(cls, 'class')}
                            className="p-2 text-white/60 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete('class', cls.id, cls.name)}
                            className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-full sm:w-64">
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white focus:border-neon-purple outline-none transition-all"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    <option value="" className="bg-dark-bg">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id} className="bg-dark-bg">{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="relative flex-grow max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search subjects..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-neon-purple outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => addNew('subject')}
                  className="btn-neon bg-neon-purple text-white px-6 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus size={20} />
                  Add Subject
                </button>
              </div>

              {!selectedClassId ? (
                <div className="flex flex-col items-center justify-center h-64 text-white/20">
                  <Layers size={48} className="mb-4" />
                  <p>Select a class to manage subjects</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((subject, index) => (
                    <motion.div 
                      key={subject.id}
                      layout
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-neon-purple/50 transition-all group gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="flex flex-col gap-1 shrink-0">
                          <button 
                            onClick={() => handleMove('subject', index, 'up')}
                            disabled={index === 0}
                            className="text-white/20 hover:text-neon-purple disabled:opacity-0"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button 
                            onClick={() => handleMove('subject', index, 'down')}
                            disabled={index === subjects.length - 1}
                            className="text-white/20 hover:text-neon-purple disabled:opacity-0"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-medium text-white truncate">{subject.name}</h3>
                          <p className="text-xs text-white/40 truncate">ID: {subject.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <button 
                          onClick={() => saveSubject({ ...subject, enabled: !subject.enabled })}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${subject.enabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-white/40'}`}
                        >
                          {subject.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <div className="flex items-center gap-2 transition-all">
                          <a 
                            href={`/class/${selectedClassId}/subject/${subject.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-white/60 hover:text-neon-purple hover:bg-neon-purple/10 rounded-lg transition-all"
                            title="View Page"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <button 
                            onClick={() => handleEdit(subject, 'subject')}
                            className="p-2 text-white/60 hover:text-neon-purple hover:bg-neon-purple/10 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete('subject', subject.id, subject.name)}
                            className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chapters' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-full sm:w-48">
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white focus:border-neon-pink outline-none transition-all"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    <option value="" className="bg-dark-bg">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id} className="bg-dark-bg">{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-48">
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white focus:border-neon-pink outline-none transition-all"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    disabled={!selectedClassId}
                  >
                    <option value="" className="bg-dark-bg">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id} className="bg-dark-bg">{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="relative flex-grow max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search chapters..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-neon-pink outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => addNew('chapter')}
                  className="btn-neon bg-neon-pink text-white px-6 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus size={20} />
                  Add Chapter
                </button>
              </div>

              {!selectedSubjectId ? (
                <div className="flex flex-col items-center justify-center h-64 text-white/20">
                  <BookOpen size={48} className="mb-4" />
                  <p>Select a class and subject to manage chapters</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {chapters.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((chapter, index) => (
                    <motion.div 
                      key={chapter.id}
                      layout
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-neon-pink/50 transition-all group gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="flex flex-col gap-1 shrink-0">
                          <button 
                            onClick={() => handleMove('chapter', index, 'up')}
                            disabled={index === 0}
                            className="text-white/20 hover:text-neon-pink disabled:opacity-0"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button 
                            onClick={() => handleMove('chapter', index, 'down')}
                            disabled={index === chapters.length - 1}
                            className="text-white/20 hover:text-neon-pink disabled:opacity-0"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="text-lg font-medium text-white truncate">{chapter.name}</h3>
                            {chapter.isImportant && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neon-pink/20 text-neon-pink uppercase tracking-wider shrink-0">Important</span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 truncate">{chapter.resources?.length || 0} Resources • {chapter.quiz?.length || 0} Quiz Questions</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <button 
                          onClick={() => saveChapter({ ...chapter, enabled: !chapter.enabled })}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${chapter.enabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-white/40'}`}
                        >
                          {chapter.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <div className="flex items-center gap-2 transition-all">
                          <a 
                            href={`/class/${selectedClassId}/subject/${selectedSubjectId}/chapter/${chapter.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-white/60 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all"
                            title="View Page"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <button 
                            onClick={() => handleEdit(chapter, 'chapter')}
                            className="p-2 text-white/60 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete('chapter', chapter.id, chapter.name)}
                            className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-grow max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-emerald-500 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-4 px-4 text-sm font-medium text-white/40">User</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Email</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Role</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()) || (u.name?.toLowerCase().includes(searchQuery.toLowerCase()))).map((user) => (
                      <tr key={user.uid} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                              {user.photoURL ? (
                                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/40">
                                  <Users size={20} />
                                </div>
                              )}
                            </div>
                            <span className="text-white font-medium">{user.name || 'Anonymous'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white/60">{user.email}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-neon-blue/20 text-neon-blue' : 'bg-white/10 text-white/60'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => {
                                const newRole = user.role === 'admin' ? 'student' : 'admin';
                                saveUser({ ...user, role: newRole });
                              }}
                              className="text-xs font-bold text-white/40 hover:text-white transition-all"
                            >
                              Toggle Role
                            </button>
                            {user.email !== 'vijayninama683@gmail.com' && (
                              <button 
                                onClick={() => handleDelete('user', user.uid, user.email)}
                                className="text-red-400/40 hover:text-red-400 transition-all"
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, i) => (
                  <div key={stat.name} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-sm font-medium text-white/40 mb-1">{stat.name}</p>
                    <h3 className="text-3xl font-display font-bold text-white">{stat.value}</h3>
                    <div className="w-full h-1 bg-white/10 mt-4 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000" 
                        style={{ width: '100%', backgroundColor: COLORS[i] }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl h-[400px]">
                  <h3 className="text-lg font-medium text-white mb-6">Content Distribution</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff20', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {statsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl h-[400px]">
                  <h3 className="text-lg font-medium text-white mb-6">User Roles</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Admins', value: users.filter(u => u.role === 'admin').length },
                          { name: 'Students', value: users.filter(u => u.role === 'student').length },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#00E5FF" />
                        <Cell fill="#ffffff10" />
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff20', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingEntity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingEntity(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-dark-bg border border-white/10 rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">
                    Edit {editingEntity.type.charAt(0).toUpperCase() + editingEntity.type.slice(1)}
                  </h2>
                  <p className="text-sm text-white/40">ID: {editingEntity.id}</p>
                </div>
                <button 
                  onClick={() => setEditingEntity(null)}
                  className="p-2 text-white/40 hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {editingEntity.type === 'chapter' && (
                <div className="px-6 pt-4 flex items-center gap-4 border-b border-white/10 shrink-0">
                  <button 
                    onClick={() => setEditTab('basic')}
                    className={`pb-4 px-2 text-sm font-medium transition-all relative ${editTab === 'basic' ? 'text-neon-pink' : 'text-white/40 hover:text-white'}`}
                  >
                    Basic Info
                    {editTab === 'basic' && <motion.div layoutId="editTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-pink" />}
                  </button>
                  <button 
                    onClick={() => setEditTab('resources')}
                    className={`pb-4 px-2 text-sm font-medium transition-all relative ${editTab === 'resources' ? 'text-neon-pink' : 'text-white/40 hover:text-white'}`}
                  >
                    Resources ({editingEntity.resources?.length || 0})
                    {editTab === 'resources' && <motion.div layoutId="editTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-pink" />}
                  </button>
                  <button 
                    onClick={() => setEditTab('quiz')}
                    className={`pb-4 px-2 text-sm font-medium transition-all relative ${editTab === 'quiz' ? 'text-neon-pink' : 'text-white/40 hover:text-white'}`}
                  >
                    Quiz ({editingEntity.quiz?.length || 0})
                    {editTab === 'quiz' && <motion.div layoutId="editTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-pink" />}
                  </button>
                </div>
              )}

              <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                {editTab === 'basic' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Name / Title</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all"
                        value={editingEntity.name}
                        onChange={(e) => setEditingEntity({ ...editingEntity, name: e.target.value })}
                      />
                    </div>

                    {editingEntity.type === 'chapter' && (
                      <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                        <input 
                          type="checkbox" 
                          id="isImportant"
                          className="w-5 h-5 rounded border-white/10 bg-white/5 text-neon-pink focus:ring-neon-pink"
                          checked={editingEntity.isImportant}
                          onChange={(e) => setEditingEntity({ ...editingEntity, isImportant: e.target.checked })}
                        />
                        <label htmlFor="isImportant" className="text-sm font-medium text-white">Mark as Important Chapter</label>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                      <input 
                        type="checkbox" 
                        id="enabled"
                        className="w-5 h-5 rounded border-white/10 bg-white/5 text-neon-blue focus:ring-neon-blue"
                        checked={editingEntity.enabled}
                        onChange={(e) => setEditingEntity({ ...editingEntity, enabled: e.target.checked })}
                      />
                      <label htmlFor="enabled" className="text-sm font-medium text-white">Enabled (Visible to students)</label>
                    </div>
                  </div>
                )}

                {editTab === 'resources' && editingEntity.type === 'chapter' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">Chapter Resources</h3>
                      <button 
                        onClick={() => {
                          const newResource: Resource = {
                            id: Date.now().toString(),
                            title: 'New Resource',
                            type: 'pdf',
                            url: '',
                            enabled: true
                          };
                          setEditingEntity({
                            ...editingEntity,
                            resources: [...(editingEntity.resources || []), newResource]
                          });
                        }}
                        className="text-sm font-bold text-neon-pink hover:text-neon-pink/80 transition-all flex items-center gap-1"
                      >
                        <Plus size={16} /> Add Resource
                      </button>
                    </div>

                    <DragDropContext onDragEnd={(result) => {
                      if (!result.destination) return;
                      const items = Array.from(editingEntity.resources || []);
                      const [reorderedItem] = items.splice(result.source.index, 1);
                      items.splice(result.destination.index, 0, reorderedItem);
                      setEditingEntity({ ...editingEntity, resources: items });
                    }}>
                      <Droppable droppableId="resources">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                            {(editingEntity.resources || []).map((resource: Resource, index: number) => (
                              <DraggableAny key={resource.id} draggableId={resource.id} index={index}>
                                {(provided: any) => (
                                  <div 
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-4"
                                  >
                                    <div {...provided.dragHandleProps} className="mt-1 text-white/20">
                                      <GripVertical size={20} />
                                    </div>
                                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-white/40">Title</label>
                                        <input 
                                          type="text" 
                                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none"
                                          value={resource.title}
                                          onChange={(e) => {
                                            const newResources = [...editingEntity.resources];
                                            newResources[index].title = e.target.value;
                                            setEditingEntity({ ...editingEntity, resources: newResources });
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-white/40">Type</label>
                                        <select 
                                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none"
                                          value={resource.type}
                                          onChange={(e) => {
                                            const newResources = [...editingEntity.resources];
                                            newResources[index].type = e.target.value as any;
                                            setEditingEntity({ ...editingEntity, resources: newResources });
                                          }}
                                        >
                                          <option value="pdf" className="bg-dark-bg">PDF Document</option>
                                          <option value="notes" className="bg-dark-bg">Study Notes</option>
                                          <option value="qa" className="bg-dark-bg">Q&A</option>
                                          <option value="practice" className="bg-dark-bg">Practice</option>
                                          <option value="test" className="bg-dark-bg">Test</option>
                                        </select>
                                      </div>
                                      <div className="md:col-span-2 space-y-4">
                                        <div className="p-4 bg-neon-blue/5 border border-neon-blue/20 rounded-2xl">
                                          <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                                              <ExternalLink size={18} />
                                            </div>
                                            <div>
                                              <h4 className="text-sm font-bold text-white">Drive Link System</h4>
                                              <p className="text-[10px] text-white/40 uppercase tracking-widest">Recommended Alternative</p>
                                            </div>
                                          </div>
                                          <p className="text-xs text-white/60 mb-3 leading-relaxed">
                                            Since your Firebase Storage is not yet provisioned (as seen in your screenshot), we recommend using **Google Drive**. Just paste the "Anyone with link" URL below.
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            <span className="px-2 py-1 rounded bg-white/5 text-[9px] font-bold text-white/40 border border-white/5">Auto-Preview</span>
                                            <span className="px-2 py-1 rounded bg-white/5 text-[9px] font-bold text-white/40 border border-white/5">No Upload Limit</span>
                                            <span className="px-2 py-1 rounded bg-white/5 text-[9px] font-bold text-white/40 border border-white/5">Faster Loading</span>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <label className="text-[10px] uppercase tracking-wider font-bold text-white/40">Resource URL / Drive Link</label>
                                            <button 
                                              onClick={() => alert("1. Upload PDF to Google Drive\n2. Right-click > Share\n3. Set to 'Anyone with the link'\n4. Copy and paste here!\n\nOur system will automatically fix the link for a perfect preview.")}
                                              className="text-[10px] text-neon-blue hover:underline flex items-center gap-1"
                                            >
                                              <Info size={10} /> How to get Drive link?
                                            </button>
                                          </div>
                                          <div className="flex flex-col sm:flex-row gap-2">
                                            <div className="relative flex-grow">
                                              <input 
                                                type="text" 
                                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 pr-10 text-sm text-white outline-none focus:border-neon-blue transition-all font-mono"
                                                value={resource.url}
                                                onChange={(e) => {
                                                  const newResources = [...editingEntity.resources];
                                                  newResources[index].url = e.target.value;
                                                  setEditingEntity({ ...editingEntity, resources: newResources });
                                                }}
                                                placeholder="Paste Google Drive link (e.g. https://drive.google.com/...)"
                                              />
                                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                {resource.url && (
                                                  <div className="flex items-center gap-1">
                                                    <button 
                                                      onClick={() => {
                                                        navigator.clipboard.writeText(resource.url);
                                                        alert('Link copied!');
                                                      }}
                                                      className="p-1 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-neon-blue"
                                                      title="Copy Link"
                                                    >
                                                      <Plus size={12} className="rotate-45" />
                                                    </button>
                                                    <a 
                                                      href={resource.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="p-1 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-neon-purple"
                                                      title="Test Link"
                                                    >
                                                      <Eye size={12} />
                                                    </a>
                                                  </div>
                                                )}
                                                {resource.url.includes('drive.google.com') ? <ExternalLink size={14} className="text-neon-blue" /> : <Layers size={14} className="text-white/20" />}
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-3 my-2">
                                              <div className="h-px flex-grow bg-white/10"></div>
                                              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">OR UPLOAD TO FIREBASE</span>
                                              <div className="h-px flex-grow bg-white/10"></div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                            <label className="btn-neon bg-white/10 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center min-w-[120px] relative overflow-hidden h-full">
                                              {uploadingResource === resource.id ? (
                                                <>
                                                  <div 
                                                    className="absolute bottom-0 left-0 h-1 bg-neon-blue transition-all duration-300" 
                                                    style={{ width: `${uploadProgress[resource.id] || 0}%` }}
                                                  />
                                                  <span className="text-xs relative z-10 flex items-center gap-2">
                                                    <RefreshCcw className="w-3 h-3 animate-spin" />
                                                    {Math.round(uploadProgress[resource.id] || 0)}%
                                                  </span>
                                                </>
                                              ) : (
                                                <span className="text-xs font-bold flex items-center gap-2">
                                                  <Upload size={14} /> Upload PDF
                                                </span>
                                              )}
                                              <input 
                                                type="file" 
                                                accept=".pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                  if (e.target.files && e.target.files[0]) {
                                                    const file = e.target.files[0];
                                                    if (file.type !== 'application/pdf') {
                                                      alert('Please select a valid PDF file.');
                                                      return;
                                                    }
                                                    handleFileUpload(file, resource.id, index);
                                                  }
                                                }}
                                                disabled={uploadingResource === resource.id}
                                              />
                                            </label>
                                              {uploadingResource === resource.id && (
                                                <button 
                                                  onClick={() => {
                                                    setUploadingResource(null);
                                                    setUploadProgress(prev => ({ ...prev, [resource.id]: 0 }));
                                                    alert('Upload cancelled.');
                                                  }}
                                                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-colors"
                                                >
                                                  <X className="w-4 h-4" />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <p className="text-[9px] text-white/20 italic">
                                              * Note: Direct upload requires Firebase Storage setup (see your screenshot).
                                            </p>
                                            <button 
                                              onClick={() => alert("FIREBASE STORAGE FIX:\n1. Go to your Firebase Console > Storage.\n2. Click 'Get started' (as shown in your screenshot).\n3. Choose 'Start in test mode' and a location.\n4. Once created, uploads will work!")}
                                              className="text-[9px] text-neon-pink hover:underline font-bold"
                                            >
                                              Fix 0% Upload Issue
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        const newResources = editingEntity.resources.filter((_: any, i: number) => i !== index);
                                        setEditingEntity({ ...editingEntity, resources: newResources });
                                      }}
                                      className="mt-1 p-2 text-white/20 hover:text-red-400 transition-all"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                )}
                              </DraggableAny>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                )}

                {editTab === 'quiz' && editingEntity.type === 'chapter' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">Quiz Questions</h3>
                      <button 
                        onClick={() => {
                          const newQuestion: QuizQuestion = {
                            id: Date.now().toString(),
                            question: 'New Question',
                            options: ['', '', '', ''],
                            correctAnswer: 0
                          };
                          setEditingEntity({
                            ...editingEntity,
                            quiz: [...(editingEntity.quiz || []), newQuestion]
                          });
                        }}
                        className="text-sm font-bold text-neon-pink hover:text-neon-pink/80 transition-all flex items-center gap-1"
                      >
                        <Plus size={16} /> Add Question
                      </button>
                    </div>

                    <DragDropContext onDragEnd={(result) => {
                      if (!result.destination) return;
                      const items = Array.from(editingEntity.quiz || []);
                      const [reorderedItem] = items.splice(result.source.index, 1);
                      items.splice(result.destination.index, 0, reorderedItem);
                      setEditingEntity({ ...editingEntity, quiz: items });
                    }}>
                      <Droppable droppableId="quiz">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {(editingEntity.quiz || []).map((question: QuizQuestion, qIndex: number) => (
                              <DraggableAny key={question.id} draggableId={question.id} index={qIndex}>
                                {(provided: any) => (
                                  <div 
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4"
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div {...provided.dragHandleProps} className="mt-1 text-white/20">
                                        <GripVertical size={20} />
                                      </div>
                                      <div className="flex-grow space-y-2">
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-white/40">Question {qIndex + 1}</label>
                                        <textarea 
                                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none resize-none"
                                          rows={2}
                                          value={question.question}
                                          onChange={(e) => {
                                            const newQuiz = [...editingEntity.quiz];
                                            newQuiz[qIndex].question = e.target.value;
                                            setEditingEntity({ ...editingEntity, quiz: newQuiz });
                                          }}
                                        />
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const newQuiz = editingEntity.quiz.filter((_: any, i: number) => i !== qIndex);
                                          setEditingEntity({ ...editingEntity, quiz: newQuiz });
                                        }}
                                        className="mt-1 p-2 text-white/20 hover:text-red-400 transition-all"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {question.options.map((option, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-3">
                                          <button 
                                            onClick={() => {
                                              const newQuiz = [...editingEntity.quiz];
                                              newQuiz[qIndex].correctAnswer = oIndex;
                                              setEditingEntity({ ...editingEntity, quiz: newQuiz });
                                            }}
                                            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${question.correctAnswer === oIndex ? 'bg-neon-pink border-neon-pink text-white' : 'border-white/20 text-transparent hover:border-neon-pink/50'}`}
                                          >
                                            <CheckCircle2 size={14} />
                                          </button>
                                          <input 
                                            type="text" 
                                            placeholder={`Option ${oIndex + 1}`}
                                            className="flex-grow bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-white/30"
                                            value={option}
                                            onChange={(e) => {
                                              const newQuiz = [...editingEntity.quiz];
                                              newQuiz[qIndex].options[oIndex] = e.target.value;
                                              setEditingEntity({ ...editingEntity, quiz: newQuiz });
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </DraggableAny>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-white/10 flex items-center justify-between shrink-0">
                <button 
                  onClick={() => {
                    handleDelete(editingEntity.type, editingEntity.id, editingEntity.name);
                    setEditingEntity(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete {editingEntity.type}
                </button>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setEditingEntity(null)}
                    className="px-6 py-2 text-sm font-medium text-white/60 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-neon bg-white text-black px-8 py-2 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-dark-card border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-2">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-2xl font-display font-bold text-white">Confirm Delete</h3>
                <p className="text-white/60">
                  Are you sure you want to delete <span className="text-white font-medium">"{deleteConfirm.name}"</span>? 
                  This action cannot be undone and will remove all associated data.
                </p>
                <div className="flex items-center gap-4 w-full pt-4">
                  <button 
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    Delete Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
