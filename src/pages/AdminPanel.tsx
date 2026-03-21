import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  ChevronRight, 
  BookOpen, 
  Video, 
  FileText, 
  LayoutDashboard,
  GraduationCap,
  Layers,
  Eye,
  EyeOff,
  Star,
  PlusCircle
} from 'lucide-react';
import { 
  Class, 
  Subject, 
  Chapter, 
  Resource,
  QuizQuestion
} from '../types';
import { 
  getClasses, 
  saveClass, 
  removeClass,
  getSubjectsByClass,
  saveSubject,
  removeSubject,
  getChaptersBySubject,
  saveChapter,
  removeChapter
} from '../services/dataService';

export default function AdminPanel() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [isAddingChapter, setIsAddingChapter] = useState(false);

  const [newClassName, setNewClassName] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  
  const [editingEntity, setEditingEntity] = useState<{type: 'class' | 'subject' | 'chapter', data: any} | null>(null);

  useEffect(() => {
    const unsubscribe = getClasses(setClasses);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const unsubscribe = getSubjectsByClass(selectedClass, setSubjects);
      return () => unsubscribe();
    } else {
      setSubjects([]);
      setSelectedSubject(null);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSubject) {
      const unsubscribe = getChaptersBySubject(selectedSubject, setChapters);
      return () => unsubscribe();
    } else {
      setChapters([]);
    }
  }, [selectedSubject]);

  const handleAddClass = async () => {
    if (!newClassName.trim()) return;
    const id = `class-${Date.now()}`;
    await saveClass({
      id,
      name: newClassName,
      enabled: true
    });
    setNewClassName('');
    setIsAddingClass(false);
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim() || !selectedClass) return;
    const id = `subject-${Date.now()}`;
    await saveSubject({
      id,
      classId: selectedClass,
      name: newSubjectName,
      enabled: true
    });
    setNewSubjectName('');
    setIsAddingSubject(false);
  };

  const handleAddChapter = async () => {
    if (!selectedClass || !selectedSubject) return;
    const id = `chapter-${Date.now()}`;
    await saveChapter({
      id,
      subjectId: selectedSubject,
      classId: selectedClass,
      name: 'New Chapter',
      enabled: true,
      isImportant: false,
      resources: [],
      quiz: []
    });
  };

  const handleToggleEntity = async (type: 'class' | 'subject' | 'chapter', entity: any) => {
    const updated = { ...entity, enabled: !entity.enabled };
    if (type === 'class') await saveClass(updated);
    if (type === 'subject') await saveSubject(updated);
    if (type === 'chapter') await saveChapter(updated);
  };

  const handleSaveEdit = async () => {
    if (!editingEntity) return;
    const { type, data } = editingEntity;
    if (type === 'class') await saveClass(data);
    if (type === 'subject') await saveSubject(data);
    if (type === 'chapter') await saveChapter(data);
    setEditingEntity(null);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-neon-blue/10 flex items-center justify-center text-neon-blue">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-white/40">Manage your classes, subjects, and study materials.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Classes Column */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <GraduationCap size={20} className="text-neon-blue" /> Classes
              </h2>
              <button 
                onClick={() => setIsAddingClass(true)}
                className="p-2 rounded-lg bg-white/5 hover:bg-neon-blue/20 hover:text-neon-blue transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {isAddingClass && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-white/5 border border-neon-blue/30 mb-4"
                  >
                    <input 
                      autoFocus
                      type="text"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      placeholder="Class Name (e.g. Class 10)"
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-2 mb-3 outline-none focus:border-neon-blue"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleAddClass} className="btn-neon py-1 px-4 text-sm">Save</button>
                      <button onClick={() => setIsAddingClass(false)} className="text-white/40 hover:text-white text-sm">Cancel</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {classes.map((cls) => (
                <div 
                  key={cls.id}
                  onClick={() => setSelectedClass(cls.id)}
                  className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                    selectedClass === cls.id ? 'bg-neon-blue/10 border border-neon-blue/30' : 'bg-white/5 border border-transparent hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-medium ${!cls.enabled && 'text-white/20 line-through'}`}>{cls.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleToggleEntity('class', cls); }} className="p-1 text-white/20 hover:text-neon-blue transition-colors">
                      {cls.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setEditingEntity({type: 'class', data: cls}); }} className="p-1 text-white/20 hover:text-neon-blue transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeClass(cls.id); }} className="p-1 text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={16} className={selectedClass === cls.id ? 'text-neon-blue' : 'text-white/20'} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subjects Column */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookOpen size={20} className="text-neon-purple" /> Subjects
              </h2>
              {selectedClass && (
                <button 
                  onClick={() => setIsAddingSubject(true)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-neon-purple/20 hover:text-neon-purple transition-all"
                >
                  <Plus size={20} />
                </button>
              )}
            </div>

            {!selectedClass ? (
              <div className="h-40 flex items-center justify-center text-white/20 text-sm italic">
                Select a class first
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {isAddingSubject && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 rounded-xl bg-white/5 border border-neon-purple/30 mb-4"
                    >
                      <input 
                        autoFocus
                        type="text"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        placeholder="Subject Name (e.g. Physics)"
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-2 mb-3 outline-none focus:border-neon-purple"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleAddSubject} className="btn-neon py-1 px-4 text-sm bg-neon-purple/20 border-neon-purple/50 text-neon-purple">Save</button>
                        <button onClick={() => setIsAddingSubject(false)} className="text-white/40 hover:text-white text-sm">Cancel</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {subjects.map((sub) => (
                  <div 
                    key={sub.id}
                    onClick={() => setSelectedSubject(sub.id)}
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                      selectedSubject === sub.id ? 'bg-neon-purple/10 border border-neon-purple/30' : 'bg-white/5 border border-transparent hover:bg-white/10'
                    }`}
                  >
                    <span className={`font-medium ${!sub.enabled && 'text-white/20 line-through'}`}>{sub.name}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleToggleEntity('subject', sub); }} className="p-1 text-white/20 hover:text-neon-purple transition-colors">
                        {sub.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setEditingEntity({type: 'subject', data: sub}); }} className="p-1 text-white/20 hover:text-neon-purple transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); removeSubject(sub.id); }} className="p-1 text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight size={16} className={selectedSubject === sub.id ? 'text-neon-purple' : 'text-white/20'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chapters Column */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Layers size={20} className="text-neon-pink" /> Chapters
              </h2>
              {selectedSubject && (
                <button 
                  onClick={handleAddChapter}
                  className="p-2 rounded-lg bg-white/5 hover:bg-neon-pink/20 hover:text-neon-pink transition-all"
                >
                  <Plus size={20} />
                </button>
              )}
            </div>

            {!selectedSubject ? (
              <div className="h-40 flex items-center justify-center text-white/20 text-sm italic">
                Select a subject first
              </div>
            ) : (
              <div className="space-y-4">
                {chapters.map((ch) => (
                  <div 
                    key={ch.id}
                    className="p-4 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${!ch.enabled && 'text-white/20 line-through'}`}>{ch.name}</span>
                        {ch.isImportant && <Star size={12} className="text-neon-purple fill-neon-purple" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggleEntity('chapter', ch)} className="p-1 text-white/20 hover:text-neon-pink transition-colors">
                          {ch.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button onClick={() => setEditingEntity({type: 'chapter', data: ch})} className="p-1 text-white/20 hover:text-neon-pink transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => removeChapter(ch.id)} className="p-1 text-white/20 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1"><FileText size={12} /> {ch.resources.length} Resources</span>
                      <span className="flex items-center gap-1"><HelpCircle size={12} /> {ch.quiz.length} Quiz Qs</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingEntity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold capitalize">Edit {editingEntity.type}</h2>
                <button onClick={() => setEditingEntity(null)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-white/40 mb-2">Name / Title</label>
                  <input 
                    type="text"
                    value={editingEntity.type === 'chapter' ? editingEntity.data.name : editingEntity.data.name}
                    onChange={(e) => setEditingEntity({
                      ...editingEntity,
                      data: { ...editingEntity.data, name: e.target.value }
                    })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-neon-blue"
                  />
                </div>

                {editingEntity.type === 'chapter' && (
                  <>
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <input 
                        type="checkbox"
                        id="isImportant"
                        checked={editingEntity.data.isImportant}
                        onChange={(e) => setEditingEntity({
                          ...editingEntity,
                          data: { ...editingEntity.data, isImportant: e.target.checked }
                        })}
                        className="w-5 h-5 accent-neon-purple"
                      />
                      <label htmlFor="isImportant" className="font-medium flex items-center gap-2">
                        <Star size={18} className="text-neon-purple" /> Mark as Important
                      </label>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2"><FileText size={18} /> Resources</h3>
                        <button 
                          onClick={() => {
                            const newRes: Resource = { id: `res-${Date.now()}`, title: 'New Resource', type: 'pdf', url: '', enabled: true };
                            setEditingEntity({
                              ...editingEntity,
                              data: { ...editingEntity.data, resources: [...editingEntity.data.resources, newRes] }
                            });
                          }}
                          className="text-xs text-neon-blue flex items-center gap-1 hover:underline"
                        >
                          <PlusCircle size={14} /> Add Resource
                        </button>
                      </div>
                      
                      {editingEntity.data.resources.map((res: Resource, idx: number) => (
                        <div key={res.id} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                          <div className="flex gap-4">
                            <input 
                              type="text"
                              value={res.title}
                              onChange={(e) => {
                                const newResources = [...editingEntity.data.resources];
                                newResources[idx] = { ...res, title: e.target.value };
                                setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, resources: newResources } });
                              }}
                              placeholder="Resource Title"
                              className="flex-1 bg-black/50 border border-white/10 rounded-lg p-2 text-sm"
                            />
                            <select 
                              value={res.type}
                              onChange={(e) => {
                                const newResources = [...editingEntity.data.resources];
                                newResources[idx] = { ...res, type: e.target.value as any };
                                setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, resources: newResources } });
                              }}
                              className="bg-black/50 border border-white/10 rounded-lg p-2 text-sm"
                            >
                              <option value="pdf">PDF</option>
                              <option value="notes">Notes</option>
                              <option value="qa">Q&A</option>
                              <option value="practice">Practice</option>
                              <option value="test">Test</option>
                            </select>
                            <button 
                              onClick={() => {
                                const newResources = editingEntity.data.resources.filter((_: any, i: number) => i !== idx);
                                setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, resources: newResources } });
                              }}
                              className="text-red-400 p-2"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <input 
                            type="text"
                            value={res.url}
                            onChange={(e) => {
                              const newResources = [...editingEntity.data.resources];
                              newResources[idx] = { ...res, url: e.target.value };
                              setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, resources: newResources } });
                            }}
                            placeholder="Resource URL (Google Drive / Direct Link)"
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2"><HelpCircle size={18} /> Quiz Questions</h3>
                        <button 
                          onClick={() => {
                            const newQ: QuizQuestion = { id: `q-${Date.now()}`, question: 'New Question', options: ['', '', '', ''], correctAnswer: 0 };
                            setEditingEntity({
                              ...editingEntity,
                              data: { ...editingEntity.data, quiz: [...editingEntity.data.quiz, newQ] }
                            });
                          }}
                          className="text-xs text-neon-blue flex items-center gap-1 hover:underline"
                        >
                          <PlusCircle size={14} /> Add Question
                        </button>
                      </div>

                      {editingEntity.data.quiz.map((q: QuizQuestion, qIdx: number) => (
                        <div key={q.id} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                          <div className="flex gap-4">
                            <textarea 
                              value={q.question}
                              onChange={(e) => {
                                const newQuiz = [...editingEntity.data.quiz];
                                newQuiz[qIdx] = { ...q, question: e.target.value };
                                setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, quiz: newQuiz } });
                              }}
                              placeholder="Question text"
                              className="flex-1 bg-black/50 border border-white/10 rounded-lg p-2 text-sm min-h-[60px]"
                            />
                            <button 
                              onClick={() => {
                                const newQuiz = editingEntity.data.quiz.filter((_: any, i: number) => i !== qIdx);
                                setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, quiz: newQuiz } });
                              }}
                              className="text-red-400 p-2 h-fit"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <input 
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={q.correctAnswer === oIdx}
                                  onChange={() => {
                                    const newQuiz = [...editingEntity.data.quiz];
                                    newQuiz[qIdx] = { ...q, correctAnswer: oIdx };
                                    setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, quiz: newQuiz } });
                                  }}
                                  className="accent-neon-green"
                                />
                                <input 
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOptions = [...q.options];
                                    newOptions[oIdx] = e.target.value;
                                    const newQuiz = [...editingEntity.data.quiz];
                                    newQuiz[qIdx] = { ...q, options: newOptions };
                                    setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, quiz: newQuiz } });
                                  }}
                                  placeholder={`Option ${oIdx + 1}`}
                                  className="flex-1 bg-black/50 border border-white/10 rounded-lg p-2 text-xs"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="flex gap-4 pt-6">
                  <button onClick={handleSaveEdit} className="btn-neon flex-1 py-3">
                    <Save size={20} className="mr-2" /> Save Changes
                  </button>
                  <button onClick={() => setEditingEntity(null)} className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all">
                    Cancel
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

function HelpCircle({ size, className }: { size?: number, className?: string }) {
  return <FileText size={size} className={className} />;
}
