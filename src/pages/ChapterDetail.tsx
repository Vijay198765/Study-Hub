import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, FileText, Download, Eye, HelpCircle, 
  CheckCircle2, AlertCircle, Timer, Trophy, RefreshCcw,
  Book, FileQuestion, ClipboardList, PenTool, X, Bookmark, BookmarkCheck
} from 'lucide-react';
import { Class, Subject, Chapter } from '../types';
import { getClasses, getSubjectsByClass, getChaptersBySubject } from '../services/dataService';

export default function ChapterDetail() {
  const { classId, subjectId, chapterId } = useParams();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'resources' | 'quiz'>('resources');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Quiz State
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

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
    if (idx === chapter.quiz[currentQuestionIdx].correctAnswer) {
      setScore(prev => prev + 1);
    }
    
    setTimeout(() => {
      if (currentQuestionIdx < chapter.quiz.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
        setSelectedOption(null);
      } else {
        setQuizFinished(true);
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
    if (url.includes('drive.google.com')) {
      return url.replace('/view', '/preview').replace('/edit', '/preview');
    }
    if (url.toLowerCase().endsWith('.pdf')) {
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
        <Link to={`/class/${classId}/subject/${subjectId}`} className="inline-flex items-center gap-2 text-white/50 hover:text-neon-blue mb-8 transition-colors">
          <ArrowLeft size={18} /> Back to {subject?.name || 'Subject'}
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-display font-bold">{chapter.name}</h1>
            </div>
            <p className="text-white/50">{subject?.name} • {currentClass?.name}</p>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setActiveTab('resources')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'resources' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'text-white/60 hover:text-white'}`}
            >
              Resources
            </button>
            <button 
              onClick={() => setActiveTab('quiz')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'quiz' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]' : 'text-white/60 hover:text-white'}`}
            >
              MCQ Quiz
            </button>
          </div>
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
                <div key={res.id} className="glass-card p-6 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                      {getResourceIcon(res.type)}
                    </div>
                    <div>
                      <h3 className="font-bold capitalize">{res.title}</h3>
                      <p className="text-xs text-white/40 uppercase tracking-widest">{res.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setPreviewUrl(res.url)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-neon-blue/20 hover:text-neon-blue transition-all flex items-center gap-2 px-3"
                      title="Preview"
                    >
                      <Eye size={18} />
                      <span className="text-xs font-bold hidden sm:inline">Preview</span>
                    </button>
                    <button 
                      onClick={() => handleDownload(res.url, res.title)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-neon-green/20 hover:text-green-400 transition-all flex items-center gap-2 px-3"
                      title="Download"
                    >
                      <Download size={18} />
                      <span className="text-xs font-bold hidden sm:inline">Download</span>
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
                <div className="glass-card p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-neon-blue/10 flex items-center justify-center mx-auto mb-6 text-neon-blue">
                    <HelpCircle size={40} />
                  </div>
                  <h2 className="text-3xl font-display font-bold mb-4">Ready for a Challenge?</h2>
                  <p className="text-white/50 mb-8">
                    Test your understanding of <strong>{chapter.name}</strong>. 
                    You have 60 seconds to answer {chapter.quiz.length} questions.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button onClick={() => setQuizStarted(true)} className="btn-neon px-10 py-3 text-lg">
                      Start Quiz
                    </button>
                  </div>
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
                    <button onClick={() => setActiveTab('resources')} className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all">
                      Back to Resources
                    </button>
                  </div>
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
                  <div className="flex items-center gap-4">
                    <h3 className="font-bold flex items-center gap-2">
                      <Eye size={18} className="text-neon-blue" /> Document Preview
                    </h3>
                    <button 
                      onClick={() => handleDownload(previewUrl, 'document')}
                      className="text-xs flex items-center gap-1 text-white/40 hover:text-green-400 transition-colors"
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                  <button onClick={() => setPreviewUrl(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X size={24} />
                  </button>
                </div>
                <div className="flex-1 bg-[#525659]">
                  <iframe 
                    src={getPreviewUrl(previewUrl)} 
                    className="w-full h-full border-none"
                    title="PDF Preview"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
