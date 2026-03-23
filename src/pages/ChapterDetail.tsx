import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, FileText, Download, Eye, HelpCircle, 
  CheckCircle2, AlertCircle, Timer, Trophy, RefreshCcw,
  Book, FileQuestion, ClipboardList, PenTool, X, Bookmark, BookmarkCheck,
  ExternalLink, ChevronRight, MessageSquare, Send, Trash2, History
} from 'lucide-react';

// Utility for conditional classes
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');
import { Class, Subject, Chapter } from '../types';
import { getClasses, getSubjectsByClass, getChaptersBySubject } from '../services/dataService';
import { auth, db } from '../firebase';
import { 
  collection, addDoc, onSnapshot, query, where, 
  orderBy, serverTimestamp, deleteDoc, doc, getDocs,
  limit
} from 'firebase/firestore';

export default function ChapterDetail() {
  const { classId, subjectId, chapterId } = useParams();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resources' | 'quiz'>('resources');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Progress & History State
  const [isCompleted, setIsCompleted] = useState(false);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  
  // Quiz State
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [showReview, setShowReview] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'admin'>('student');
  const isAdmin = userRole === 'admin';

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
        
        // Save to Recently Viewed
        const currentChapter = data.find(c => c.id === chapterId);
        if (currentChapter) {
          const currentSubject = subjects.find(s => s.id === subjectId);
          const recent = JSON.parse(localStorage.getItem('recentChapters') || '[]');
          const newItem = {
            id: currentChapter.id,
            name: currentChapter.name,
            subjectId,
            classId,
            subjectName: currentSubject?.name || 'Subject'
          };
          const filtered = recent.filter((item: any) => item.id !== currentChapter.id);
          const updated = [newItem, ...filtered].slice(0, 3);
          localStorage.setItem('recentChapters', JSON.stringify(updated));
        }
      });
    }

    if (chapterId) {
      // Check progress
      if (auth.currentUser) {
        const progressQ = query(
          collection(db, 'userProgress'),
          where('userId', '==', auth.currentUser.uid),
          where('chapterId', '==', chapterId)
        );
        getDocs(progressQ).then(snapshot => {
          setIsCompleted(!snapshot.empty);
        });

      // Fetch user role
      if (auth.currentUser) {
        getDocs(query(collection(db, 'users'), where('uid', '==', auth.currentUser.uid)))
          .then(snapshot => {
            if (!snapshot.empty) {
              setUserRole(snapshot.docs[0].data().role);
            }
          });
      }

        // Fetch quiz history
        const historyQ = query(
          collection(db, 'quizHistory'),
          where('userId', '==', auth.currentUser.uid),
          where('chapterId', '==', chapterId),
          orderBy('completedAt', 'desc'),
          limit(5)
        );
        onSnapshot(historyQ, (snapshot) => {
          setQuizHistory(snapshot.docs.map(doc => doc.data()));
        });
      }
    }

    return () => {
      unsubscribeClasses();
      unsubscribeSubjects();
      unsubscribeChapters();
    };
  }, [classId, subjectId, chapterId, auth.currentUser]);

  const currentClass = classes.find(c => c.id === classId);
  const subject = subjects.find(s => s.id === subjectId);
  const chapter = chapters.find(c => c.id === chapterId);

  useEffect(() => {
    let timer: any;
    if (quizStarted && !quizFinished && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && !quizFinished) {
      setQuizFinished(true);
    }
    return () => clearInterval(timer);
  }, [quizStarted, quizFinished, timeLeft]);

  if (loading) return <div className="pt-32 text-center text-white/40">Loading chapter details...</div>;
  if (!chapter) return <div className="pt-32 text-center text-white/40">Chapter not found</div>;

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    
    setUserAnswers(prev => {
      const next = [...prev];
      next[currentQuestionIdx] = idx;
      return next;
    });

    if (idx === chapter.quiz[currentQuestionIdx].correctAnswer) {
      setScore(prev => prev + 1);
    }
    
    setTimeout(async () => {
      if (currentQuestionIdx < chapter.quiz.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
        setSelectedOption(null);
      } else {
        setQuizFinished(true);
        // Save quiz score
        if (auth.currentUser) {
          const finalScore = idx === chapter.quiz[currentQuestionIdx].correctAnswer ? score + 1 : score;
          try {
            await addDoc(collection(db, 'quizHistory'), {
              userId: auth.currentUser.uid,
              chapterId,
              score: finalScore,
              total: chapter.quiz.length,
              completedAt: serverTimestamp()
            });
          } catch (e) {
            console.error("Error saving quiz score:", e);
          }
        }
      }
    }, 1000);
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setQuizFinished(false);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setScore(0);
    setTimeLeft(60);
    setUserAnswers([]);
    setShowReview(false);
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setUserAnswers(new Array(chapter.quiz.length).fill(null));
  };

  const toggleProgress = async () => {
    if (!auth.currentUser) return;
    try {
      if (isCompleted) {
        const q = query(
          collection(db, 'userProgress'),
          where('userId', '==', auth.currentUser.uid),
          where('chapterId', '==', chapterId)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(async (d) => {
          await deleteDoc(doc(db, 'userProgress', d.id));
        });
        setIsCompleted(false);
      } else {
        await addDoc(collection(db, 'userProgress'), {
          userId: auth.currentUser.uid,
          chapterId,
          completedAt: serverTimestamp()
        });
        setIsCompleted(true);
      }
    } catch (e) {
      console.error("Error toggling progress:", e);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'notes': return <FileText className="text-blue-400" />;
      case 'pdf': return <Book className="text-red-400" />;
      case 'qa': return <FileQuestion className="text-green-400" />;
      case 'practice': return <ClipboardList className="text-yellow-400" />;
      case 'test': return <PenTool className="text-purple-400" />;
      default: return <FileText />;
    }
  };

  const getPreviewUrl = (url: string) => {
    if (!url) return '';
    // Handle Google Drive links
    if (url.includes('drive.google.com')) {
      // Convert /view or /edit to /preview
      let baseUrl = url.split('?')[0];
      if (baseUrl.endsWith('/view')) return baseUrl.replace('/view', '/preview');
      if (baseUrl.endsWith('/edit')) return baseUrl.replace('/edit', '/preview');
      
      // Handle /file/d/ID/view?usp=sharing
      if (url.includes('/file/d/')) {
        const idMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
          return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
        }
      }
      
      // Handle /d/ID/view
      if (url.includes('/d/')) {
        const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (idMatch && idMatch[1]) {
          return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
        }
      }
      return url;
    }
    // For direct PDF links (including Firebase), Google Docs Viewer is often more reliable for iframes
    if (url.toLowerCase().includes('.pdf') || url.includes('firebasestorage.googleapis.com')) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    return url;
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const enabledResources = chapter.resources.filter(r => r.enabled);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-xs md:text-sm text-white/30 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap pb-2">
          <Link to="/" className="hover:text-neon-blue transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to={`/class/${classId}`} className="hover:text-neon-blue transition-colors">{currentClass?.name || 'Class'}</Link>
          <ChevronRight size={12} />
          <Link to={`/class/${classId}/subject/${subjectId}`} className="hover:text-neon-blue transition-colors">{subject?.name || 'Subject'}</Link>
          <ChevronRight size={12} />
          <span className="text-white/60 break-words">{chapter.name}</span>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl md:text-4xl font-display font-bold break-words">{chapter.name}</h1>
            </div>
            <p className="text-white/50 break-words">{subject?.name} • {currentClass?.name}</p>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shrink-0">
            <button 
              onClick={() => setActiveTab('resources')}
              className={`px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'resources' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'text-white/60 hover:text-white'}`}
            >
              Resources
            </button>
            <button 
              onClick={() => setActiveTab('quiz')}
              className={`px-4 md:px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'quiz' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'text-white/60 hover:text-white'}`}
            >
              Quiz
            </button>
          </div>
        </div>

        <div className="mb-8 flex justify-end">
          <button 
            onClick={toggleProgress}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-medium",
              isCompleted 
                ? "bg-green-500/10 border-green-500/50 text-green-400" 
                : "bg-white/5 border-white/10 text-white/60 hover:border-neon-blue/50 hover:text-white"
            )}
          >
            {isCompleted ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            {isCompleted ? 'Completed' : 'Mark as Done'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'resources' ? (
            <motion.div 
              key="resources"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {enabledResources.map((res) => (
                <div key={res.id} className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between group gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      {getResourceIcon(res.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold capitalize truncate group-hover:neon-text transition-colors" title={res.title}>{res.title}</h3>
                      <p className="text-[10px] text-white/40 group-hover:text-neon-blue group-hover:drop-shadow-[0_0_5px_rgba(0,242,255,0.5)] uppercase tracking-widest transition-all font-bold">{res.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button 
                      onClick={() => setPreviewUrl(res.url)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-neon-blue/20 hover:text-neon-blue transition-all flex items-center gap-2 px-3"
                      title="Preview"
                    >
                      <Eye size={16} />
                      <span className="text-xs font-bold">Preview</span>
                    </button>
                    <a 
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/5 hover:bg-neon-purple/20 hover:text-neon-purple transition-all flex items-center gap-2 px-3"
                      title="Open in New Tab"
                    >
                      <ExternalLink size={16} />
                      <span className="text-xs font-bold hidden sm:inline">Open</span>
                    </a>
                    <button 
                      onClick={() => handleDownload(res.url, res.title)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-neon-green/20 hover:text-green-400 transition-all flex items-center gap-2 px-3"
                      title="Download"
                    >
                      <Download size={16} />
                      <span className="text-xs font-bold hidden sm:inline">Save</span>
                    </button>
                  </div>
                </div>
              ))}
              {enabledResources.length === 0 && (
                <div className="col-span-full text-center py-20 glass-card">
                  <p className="text-white/30 italic">No resources uploaded for this chapter yet.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto"
            >
              {!quizStarted ? (
                <div className="space-y-8">
                  <div className="glass-card p-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-neon-blue/10 flex items-center justify-center mx-auto mb-6 text-neon-blue">
                      <HelpCircle size={40} />
                    </div>
                    {chapter.quiz.length > 0 ? (
                      <>
                        <h2 className="text-3xl font-display font-bold mb-4">Ready for a Challenge?</h2>
                        <p className="text-white/50 mb-8">
                          Test your understanding of <strong>{chapter.name}</strong>. 
                          You have 60 seconds to answer {chapter.quiz.length} questions.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                          <button onClick={startQuiz} className="btn-neon px-10 py-3 text-lg">
                            Start Quiz
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="py-10">
                        <p className="text-white/30 italic">No quiz questions available for this chapter yet.</p>
                      </div>
                    )}
                  </div>

                  {quizHistory.length > 0 && (
                    <div className="glass-card p-8">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <History size={20} className="text-neon-purple" /> Recent Attempts
                      </h3>
                      <div className="space-y-4">
                        {quizHistory.map((h, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                            <div>
                              <p className="font-bold text-neon-blue">{h.score} / {h.total}</p>
                              <p className="text-xs text-white/40">
                                {h.completedAt?.toDate ? h.completedAt.toDate().toLocaleDateString() : 'Just now'}
                              </p>
                            </div>
                            <div className="text-xs font-bold px-3 py-1 rounded-full bg-white/5 text-white/60">
                              {Math.round((h.score / h.total) * 100)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : quizFinished ? (
                <div className="glass-card p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-neon-purple/10 flex items-center justify-center mx-auto mb-6 text-neon-purple">
                    <Trophy size={40} />
                  </div>
                  <h2 className="text-3xl font-display font-bold mb-2">Quiz Completed!</h2>
                  <p className="text-white/50 mb-6">Great effort on finishing the quiz.</p>
                  
                  <div className="text-6xl font-display font-bold text-neon-blue mb-8">
                    {score} <span className="text-2xl text-white/30">/ {chapter.quiz.length}</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button onClick={resetQuiz} className="btn-neon flex items-center gap-2">
                      <RefreshCcw size={18} /> Try Again
                    </button>
                    <button 
                      onClick={() => setShowReview(!showReview)} 
                      className="px-6 py-2 rounded-full border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10 transition-all"
                    >
                      {showReview ? 'Hide Review' : 'Review Answers'}
                    </button>
                    <button onClick={() => setActiveTab('resources')} className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all">
                      Back to Resources
                    </button>
                  </div>

                  {showReview && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-12 space-y-6 text-left"
                    >
                      <h3 className="text-xl font-bold border-b border-white/10 pb-4">Detailed Review</h3>
                      {chapter.quiz.map((q, qIdx) => (
                        <div key={qIdx} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                          <p className="font-bold mb-4 text-lg">{qIdx + 1}. {q.question}</p>
                          <div className="grid gap-2">
                            {q.options.map((opt, oIdx) => {
                              const isCorrect = oIdx === q.correctAnswer;
                              const isUserAnswer = oIdx === userAnswers[qIdx];
                              
                              let statusClass = "text-white/40";
                              if (isCorrect) statusClass = "text-green-400 font-bold";
                              else if (isUserAnswer && !isCorrect) statusClass = "text-red-400 line-through";

                              return (
                                <div key={oIdx} className={`flex items-center gap-2 text-sm ${statusClass}`}>
                                  {isCorrect && <CheckCircle2 size={14} />}
                                  {isUserAnswer && !isCorrect && <AlertCircle size={14} />}
                                  {opt}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="glass-card p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-sm font-medium text-white/40">
                      Question <span className="text-white">{currentQuestionIdx + 1}</span> of {chapter.quiz.length}
                    </div>
                    <div className={`flex items-center gap-2 font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-neon-blue'}`}>
                      <Timer size={18} /> {timeLeft}s
                    </div>
                  </div>
                  
                  <div className="w-full bg-white/5 h-1 rounded-full mb-10 overflow-hidden">
                    <motion.div 
                      className="h-full bg-neon-blue"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestionIdx + 1) / chapter.quiz.length) * 100}%` }}
                    />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-8">{chapter.quiz[currentQuestionIdx].question}</h3>
                  
                  <div className="space-y-4">
                    {chapter.quiz[currentQuestionIdx].options.map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === chapter.quiz[currentQuestionIdx].correctAnswer;
                      
                      let variantClass = "border-white/10 hover:border-neon-blue/50 hover:bg-white/5";
                      if (selectedOption !== null) {
                        if (isCorrect) variantClass = "border-green-500 bg-green-500/10 text-green-400";
                        else if (isSelected) variantClass = "border-red-500 bg-red-500/10 text-red-400";
                        else variantClass = "opacity-50 border-white/5";
                      }

                      return (
                        <button
                          key={idx}
                          disabled={selectedOption !== null}
                          onClick={() => handleOptionSelect(idx)}
                          className={`w-full p-5 rounded-2xl border text-left transition-all flex items-center justify-between ${variantClass}`}
                        >
                          <span className="font-medium">{option}</span>
                          {selectedOption !== null && isCorrect && <CheckCircle2 size={20} />}
                          {selectedOption !== null && isSelected && !isCorrect && <AlertCircle size={20} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
 
        {/* PDF Preview Modal */}
        <AnimatePresence>
          {previewUrl && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <div className="w-full max-w-6xl h-[90vh] glass-card flex flex-col overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-2 md:gap-4">
                    <h3 className="font-bold flex items-center gap-2 text-sm md:text-base">
                      <Eye size={18} className="text-neon-blue" /> Document Preview
                    </h3>
                    <div className="hidden sm:flex items-center gap-2">
                      <button 
                        onClick={() => handleDownload(previewUrl, 'document')}
                        className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 text-white/40 hover:text-green-400 transition-colors bg-white/5 px-2 py-1 rounded"
                      >
                        <Download size={12} /> Save
                      </button>
                      <a 
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 text-white/40 hover:text-neon-purple transition-colors bg-white/5 px-2 py-1 rounded"
                      >
                        <ExternalLink size={12} /> Open Full
                      </a>
                    </div>
                  </div>
                  <button onClick={() => setPreviewUrl(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
                <div className="flex-1 bg-[#525659] relative">
                  <div className="absolute inset-0 flex items-center justify-center text-white/20 pointer-events-none">
                    <div className="text-center">
                      <RefreshCcw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                      <p className="text-xs">Loading Preview...</p>
                    </div>
                  </div>
                  <iframe 
                    src={getPreviewUrl(previewUrl)} 
                    className="w-full h-full border-none relative z-10"
                    title="PDF Preview"
                  />
                </div>
                <div className="p-3 bg-black/40 border-t border-white/10 flex sm:hidden justify-center gap-4">
                  <button 
                    onClick={() => handleDownload(previewUrl, 'document')}
                    className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 text-white/60"
                  >
                    <Download size={14} /> Save
                  </button>
                  <a 
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 text-white/60"
                  >
                    <ExternalLink size={14} /> Open Full
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
