import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, Trophy, Timer, CheckCircle2, XCircle, ArrowRight, Star, Medal, Users, Lock, Info } from 'lucide-react';
import { getTests, saveTestResult, getTestResults } from '../services/dataService';
import { Test, TestResult } from '../types';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { calculateRanks } from '../utils/ranking';
import UserName from '../components/UserName';

export default function Tests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [testCompleted, setTestCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    const isSpecial = localStorage.getItem('isSpecialLogin') === 'true';
    const specialName = localStorage.getItem('studentName') || 'Vijay-Admin';

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user) {
        setIsGuest(false);
        unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
          if (doc.exists()) {
            setUserProfile(doc.data());
          } else if (isSpecial) {
            // Fallback if profile not created yet but we have special flags
            setUserProfile({
              uid: user.uid,
              name: specialName,
              email: 'vijay-admin@special.com',
              role: 'admin',
              photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay'
            });
          }
        }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));
      } else if (isSpecial) {
        setIsGuest(false);
        setUserProfile({
          uid: 'special-vijay-admin',
          name: specialName,
          email: 'vijay-admin@special.com',
          role: 'student',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay'
        });
      } else {
        setIsGuest(true);
        setUserProfile(null);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  useEffect(() => {
    const unsub = getTests((data) => {
      setTests(data.filter(t => t.active));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (selectedTest) {
      const unsub = getTestResults(selectedTest.id, (results) => {
        // Deduplicate by student name, keeping the latest result
        const latestByName: { [key: string]: TestResult } = {};
        
        // Sort by time descending first to ensure we pick the latest one for each name
        const sortedByTime = [...results].sort((a, b) => {
          const timeA = a.completedAt?.toMillis?.() || a.completedAt?.getTime?.() || 0;
          const timeB = b.completedAt?.toMillis?.() || b.completedAt?.getTime?.() || 0;
          return timeB - timeA;
        });

        sortedByTime.forEach(res => {
          const nameKey = res.studentName.toLowerCase().trim();
          if (!latestByName[nameKey]) {
            latestByName[nameKey] = res;
          }
        });

        const deduplicated = Object.values(latestByName);

        // Sort by score descending, then by time
        const sorted = deduplicated.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          const timeA = a.completedAt?.toMillis?.() || a.completedAt?.getTime?.() || 0;
          const timeB = b.completedAt?.toMillis?.() || b.completedAt?.getTime?.() || 0;
          return timeB - timeA;
        });
        setLeaderboard(sorted);
      });
      return () => unsub();
    }
  }, [selectedTest]);

  const startTest = (test: Test) => {
    if (isGuest) return;
    
    setActiveTest(test);
    setCurrentQuestionIdx(0);
    setAnswers(new Array(test.questions.length).fill(-1));
    setTestCompleted(false);
    setScore(0);
  };

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIdx] = optionIdx;
    setAnswers(newAnswers);
  };

  // Keyboard Support for Questions
  useEffect(() => {
    if (!activeTest || testCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Keys 1-4 for options
      if (['1', '2', '3', '4'].includes(e.key)) {
        const optionIdx = parseInt(e.key) - 1;
        if (activeTest.questions[currentQuestionIdx] && activeTest.questions[currentQuestionIdx].options[optionIdx]) {
          handleAnswer(optionIdx);
        }
      }

      // Enter to move next
      if (e.key === 'Enter' && answers[currentQuestionIdx] !== -1) {
        nextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTest, currentQuestionIdx, answers, testCompleted]);

  const nextQuestion = () => {
    if (currentQuestionIdx < (activeTest?.questions.length || 0) - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    if (!activeTest) return;

    let finalScore = 0;
    activeTest.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        finalScore++;
      }
    });

    setScore(finalScore);
    setTestCompleted(true);

    // Save result
    const nameToSave = userProfile?.name || auth.currentUser?.displayName || 'Anonymous';
    const emailToSave = userProfile?.email || auth.currentUser?.email || '';
    
    const result: TestResult = {
      id: crypto.randomUUID(),
      testId: activeTest.id,
      testTitle: activeTest.title,
      studentName: nameToSave,
      studentUid: auth.currentUser?.uid,
      studentEmail: emailToSave,
      studentPhotoURL: userProfile?.photoURL || auth.currentUser?.photoURL || '',
      score: finalScore,
      total: activeTest.questions.length,
      completedAt: new Date()
    };
    
    try {
      await saveTestResult(result);
      // Refresh leaderboard for the current test
      const unsub = getTestResults(activeTest.id, (results) => {
        // Deduplicate by student name, keeping the latest result
        const latestByName: { [key: string]: TestResult } = {};
        
        const sortedByTime = [...results].sort((a, b) => {
          const timeA = a.completedAt?.toMillis?.() || a.completedAt?.getTime?.() || 0;
          const timeB = b.completedAt?.toMillis?.() || b.completedAt?.getTime?.() || 0;
          return timeB - timeA;
        });

        sortedByTime.forEach(res => {
          const nameKey = res.studentName.toLowerCase().trim();
          if (!latestByName[nameKey]) {
            latestByName[nameKey] = res;
          }
        });

        const deduplicated = Object.values(latestByName);

        const sorted = deduplicated.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          const timeA = a.completedAt?.toMillis?.() || a.completedAt?.getTime?.() || 0;
          const timeB = b.completedAt?.toMillis?.() || b.completedAt?.getTime?.() || 0;
          return timeB - timeA;
        });
        setLeaderboard(sorted);
      });
      // We don't need to keep this unsub as it's just a one-time refresh or short-lived
      setTimeout(unsub, 2000); 
    } catch (error) {
      console.error("Error saving test result:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto">
        {isGuest && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-neon-blue/10 border border-neon-blue/20 rounded-2xl flex items-center gap-4 text-neon-blue"
          >
            <div className="w-10 h-10 rounded-xl bg-neon-blue/20 flex items-center justify-center shrink-0">
              <Info size={20} />
            </div>
            <div className="flex-1">
              <p className="font-medium">Guest Mode Active</p>
              <p className="text-sm opacity-70 text-white/60">You can view leaderboards, but you need to log in to participate in tests.</p>
            </div>
          </motion.div>
        )}

        {(!activeTest || testCompleted) ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Test List or Results */}
            <div className="lg:col-span-2 space-y-6">
              {testCompleted && activeTest ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card p-8 text-center space-y-8"
                >
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue mx-auto mb-4">
                      <Trophy size={48} />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                      <Star size={16} />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-3xl font-display font-bold text-white mb-2">Test Completed!</h2>
                    <p className="text-white/40">Great job, <span className="text-neon-blue font-bold"><UserName userUid={auth.currentUser?.uid} fallback={userProfile?.name || 'Student'} /></span>! Here's your performance:</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Score</p>
                      <p className="text-3xl font-bold text-neon-blue">{score}/{activeTest.questions.length}</p>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-[10px] font-bold text-white/40 uppercase mb-1">Accuracy</p>
                      <p className="text-3xl font-bold text-indigo-600">
                        {activeTest.questions.length > 0 ? Math.round((score / activeTest.questions.length) * 100) : 0}%
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={() => {
                        setActiveTest(null);
                        setTestCompleted(false);
                      }}
                      className="btn-neon px-12 py-3 w-full sm:w-auto"
                    >
                      Back to All Tests
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                      <ClipboardList size={28} />
                    </div>
                    <div>
                      <h1 className="text-3xl font-display font-bold text-white">Available Tests</h1>
                      <p className="text-white/40">Test your knowledge and climb the leaderboard</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {isGuest && (
                      <div className="p-8 bg-neon-blue/5 border border-dashed border-neon-blue/20 rounded-3xl text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-neon-blue/10 flex items-center justify-center mx-auto text-neon-blue">
                          <Lock size={32} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">Login to Start Tests</h3>
                          <p className="text-sm text-white/40 max-w-sm mx-auto">You are currently in Guest Mode. Please log in to participate in tests, save your scores, and compete on the leaderboard.</p>
                        </div>
                        <button 
                          onClick={() => window.location.href = '/login'}
                          className="btn-neon px-8 py-3"
                        >
                          Login Now
                        </button>
                      </div>
                    )}
                    {tests.map((test) => (
                      <motion.div 
                        key={test.id}
                        whileHover={{ scale: 1.01 }}
                        className={`p-6 bg-white/5 border rounded-2xl transition-all cursor-pointer ${selectedTest?.id === test.id ? 'border-neon-blue bg-neon-blue/5' : 'border-white/10 hover:border-white/20'}`}
                        onClick={() => setSelectedTest(test)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60">
                              <Medal size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-white">{test.title}</h3>
                              <p className="text-sm text-white/40">
                                {test.questions.length} Questions • {test.questions.length * 1} min
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isGuest) startTest(test);
                              }}
                              disabled={isGuest}
                              className={`btn-neon px-6 py-2 flex items-center gap-2 ${isGuest ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isGuest ? <Lock size={18} /> : 'Start'} <ArrowRight size={18} />
                            </button>
                            {isGuest && (
                              <p className="text-[10px] text-neon-blue/60 font-bold uppercase tracking-tighter">Login Required</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {tests.length === 0 && (
                      <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                        <ClipboardList size={48} className="mx-auto text-white/10 mb-4" />
                        <p className="text-white/30 italic">No active tests available at the moment.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Leaderboard Sidebar */}
            <div className="space-y-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="text-yellow-400" size={24} />
                  <h2 className="text-xl font-bold text-white">Leaderboard</h2>
                </div>

                {(selectedTest || (testCompleted && activeTest)) ? (
                  <div className="space-y-4">
                    <p className="text-sm text-white/40 mb-4">Top performers for: <span className="text-neon-blue">{(testCompleted && activeTest) ? activeTest.title : selectedTest?.title}</span></p>
                    {leaderboard.length > 0 ? (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {(() => {
                          const ranks = calculateRanks(leaderboard);
                          const currentUserName = userProfile?.name || '';
                          return leaderboard.map((result, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${result.studentUid === (auth.currentUser?.uid || 'special-vijay-admin') ? 'bg-neon-blue/10 border-neon-blue/50' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold shrink-0 ${
                                  ranks[idx] === 1 ? 'bg-yellow-400 text-black' : 
                                  ranks[idx] === 2 ? 'bg-slate-300 text-black' : 
                                  ranks[idx] === 3 ? 'bg-amber-600 text-white' : 
                                  'bg-white/10 text-white/40'
                                }`}>
                                  #{ranks[idx]}
                                </div>
                                <UserName 
                                  userUid={result.studentUid || ''} 
                                  fallback={result.studentName} 
                                  fallbackPhoto={result.studentPhotoURL}
                                  showPhoto={true}
                                  photoClassName="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold shrink-0 bg-white/10 text-white/40"
                                  className={`text-sm font-medium truncate ${result.studentUid === (auth.currentUser?.uid || 'special-vijay-admin') ? 'text-neon-blue' : 'text-white'}`}
                                />
                                {result.studentUid === (auth.currentUser?.uid || 'special-vijay-admin') && <span className="text-[8px] uppercase bg-neon-blue/20 px-1 rounded text-neon-blue font-bold">You</span>}
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <div className="flex items-center gap-1 text-neon-blue font-bold">
                                  <span>{result.score}</span>
                                  <span className="text-[10px] text-white/40">/{result.total}</span>
                                </div>
                                <p className="text-[10px] text-white/20 uppercase tracking-tighter">
                                  {result.completedAt?.toDate ? result.completedAt.toDate().toLocaleDateString() : 'Recent'}
                                </p>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-10 opacity-40 italic text-sm">
                        No results yet. Be the first!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <Medal size={40} className="mx-auto text-white/10 mb-4" />
                    <p className="text-sm text-white/30 italic">Select a test to view its leaderboard</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              {!testCompleted ? (
                <motion.div 
                  key="question"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setActiveTest(null)}
                        className="p-2 text-white/40 hover:text-white transition-all"
                      >
                        <XCircle size={24} />
                      </button>
                      <div>
                        <h2 className="text-xl font-bold text-white">{activeTest.title}</h2>
                        <div className="flex items-center gap-2 text-xs text-white/40">
                          <span>Question {currentQuestionIdx + 1} of {activeTest.questions.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-neon-blue">
                      <Timer size={20} />
                      <span className="font-mono font-bold">Live</span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-8">
                    <motion.div 
                      className="h-full bg-neon-blue shadow-lg shadow-neon-blue/20"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestionIdx + 1) / activeTest.questions.length) * 100}%` }}
                    />
                  </div>

                  <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-8">
                    <h3 className="text-2xl font-medium text-white leading-relaxed">
                      {activeTest.questions[currentQuestionIdx].question}
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                      {activeTest.questions[currentQuestionIdx].options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          className={`p-5 rounded-2xl text-left transition-all border-2 flex items-center justify-between group ${answers[currentQuestionIdx] === idx ? 'border-neon-blue bg-neon-blue/10 text-white' : 'border-white/5 bg-white/5 text-white/60 hover:border-white/20 hover:text-white'}`}
                        >
                          <span className="font-medium">{option}</span>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${answers[currentQuestionIdx] === idx ? 'border-neon-blue bg-neon-blue text-white' : 'border-white/20 group-hover:border-white/40'}`}>
                            {answers[currentQuestionIdx] === idx && <CheckCircle2 size={14} />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={nextQuestion}
                      disabled={answers[currentQuestionIdx] === -1}
                      className={`btn-neon px-10 py-4 flex items-center gap-2 text-lg font-bold ${answers[currentQuestionIdx] === -1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {currentQuestionIdx === activeTest.questions.length - 1 ? 'Finish Test' : 'Next Question'}
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-8 py-12"
                >
                  <div className="relative inline-block">
                    <div className="w-32 h-32 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue mx-auto mb-6">
                      <Trophy size={64} />
                    </div>
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring' }}
                      className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg"
                    >
                      <Star size={24} />
                    </motion.div>
                  </div>

                  <div>
                    <h2 className="text-4xl font-display font-bold text-white mb-2">Test Completed!</h2>
                    <p className="text-white/40">Great job! Here's how you performed:</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-xs font-bold text-white/40 uppercase mb-1">Your Score</p>
                      <p className="text-4xl font-bold text-neon-blue">{score}</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-xs font-bold text-white/40 uppercase mb-1">Accuracy</p>
                      <p className="text-4xl font-bold text-indigo-600">
                        {Math.round((score / activeTest.questions.length) * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-8">
                    <button 
                      onClick={() => {
                        setActiveTest(null);
                        setTestCompleted(false);
                      }}
                      className="btn-neon px-12 py-4 text-lg w-full sm:w-auto"
                    >
                      Back to Tests
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
