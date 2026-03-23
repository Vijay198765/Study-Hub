import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClipboardList, Trophy, Timer, CheckCircle2, XCircle, ArrowRight, Star, Medal, Users } from 'lucide-react';
import { getTests, saveTestResult, getTestResults } from '../services/dataService';
import { Test, TestResult } from '../types';
import { auth } from '../firebase';

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
        // Sort by score descending, then by time (if available)
        const sorted = [...results].sort((a, b) => b.score - a.score);
        setLeaderboard(sorted);
      });
      return () => unsub();
    }
  }, [selectedTest]);

  const startTest = (test: Test) => {
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

    // Save result if logged in
    if (auth.currentUser) {
      const result: TestResult = {
        id: crypto.randomUUID(),
        testId: activeTest.id,
        testTitle: activeTest.title,
        studentName: auth.currentUser.displayName || auth.currentUser.email || 'Anonymous',
        score: Math.round((finalScore / activeTest.questions.length) * 100),
        total: activeTest.questions.length,
        completedAt: new Date()
      };
      await saveTestResult(result);
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
        {!activeTest ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Test List */}
            <div className="lg:col-span-2 space-y-6">
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
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          startTest(test);
                        }}
                        className="btn-neon bg-neon-blue text-black px-6 py-2 flex items-center gap-2"
                      >
                        Start <ArrowRight size={18} />
                      </button>
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
            </div>

            {/* Leaderboard Sidebar */}
            <div className="space-y-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <Trophy className="text-yellow-400" size={24} />
                  <h2 className="text-xl font-bold text-white">Leaderboard</h2>
                </div>

                {selectedTest ? (
                  <div className="space-y-4">
                    <p className="text-sm text-white/40 mb-4">Top performers for: <span className="text-neon-blue">{selectedTest.title}</span></p>
                    {leaderboard.length > 0 ? (
                      leaderboard.slice(0, 10).map((result, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-400 text-black' : idx === 1 ? 'bg-slate-300 text-black' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-white/10 text-white/40'}`}>
                              {idx + 1}
                            </span>
                            <span className="text-sm text-white font-medium truncate max-w-[120px]">{result.studentName}</span>
                          </div>
                          <div className="flex items-center gap-1 text-neon-blue font-bold">
                            <span>{result.score}</span>
                            <span className="text-[10px] text-white/40">/{result.total}</span>
                          </div>
                        </div>
                      ))
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
                      className="h-full bg-neon-blue shadow-[0_0_10px_rgba(0,229,255,0.5)]"
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
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${answers[currentQuestionIdx] === idx ? 'border-neon-blue bg-neon-blue text-black' : 'border-white/20 group-hover:border-white/40'}`}>
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
                      className={`btn-neon px-10 py-4 flex items-center gap-2 text-lg font-bold ${answers[currentQuestionIdx] === -1 ? 'opacity-50 cursor-not-allowed bg-white/10 text-white/40' : 'bg-neon-blue text-black'}`}
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
                      className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-neon-pink flex items-center justify-center text-white shadow-lg"
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
                      <p className="text-4xl font-bold text-neon-pink">
                        {Math.round((score / activeTest.questions.length) * 100)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-8">
                    <button 
                      onClick={() => setActiveTest(null)}
                      className="btn-neon bg-neon-blue text-black px-12 py-4 text-lg font-bold w-full sm:w-auto"
                    >
                      Back to Tests
                    </button>
                    {!auth.currentUser && (
                      <p className="text-xs text-white/30 italic">
                        Note: You must be logged in to save your results to the leaderboard.
                      </p>
                    )}
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
