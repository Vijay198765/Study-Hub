import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Trophy, RefreshCcw, Brain, Zap, Target, Star, BookOpen, GraduationCap } from 'lucide-react';
import confetti from 'canvas-confetti';

type GameType = 'math' | 'memory' | 'scramble' | 'none';

export default function Games() {
  const [activeGame, setActiveGame] = useState<GameType>('none');

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-sm font-medium mb-4"
          >
            <Gamepad2 size={16} /> Student Bonus Zone
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4">Mind Games</h1>
          <p className="text-white/50 max-w-2xl mx-auto">
            Take a break from studying and sharpen your brain with these mini-games.
          </p>
        </div>

        {activeGame === 'none' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GameCard 
              title="Math Sprint" 
              desc="Solve as many equations as you can in 30 seconds!"
              icon={<Zap className="text-neon-blue" />}
              color="blue"
              onClick={() => setActiveGame('math')}
            />
            <GameCard 
              title="Memory Matrix" 
              desc="Match the pairs of educational icons."
              icon={<Brain className="text-neon-purple" />}
              color="purple"
              onClick={() => setActiveGame('memory')}
            />
            <GameCard 
              title="Word Scramble" 
              desc="Unscramble scientific and educational terms."
              icon={<Target className="text-neon-pink" />}
              color="pink"
              onClick={() => setActiveGame('scramble')}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <button 
              onClick={() => setActiveGame('none')}
              className="mb-8 flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            >
              <RefreshCcw size={16} /> Back to Games
            </button>
            
            <div className="glass-card p-8 min-h-[400px] flex flex-col items-center justify-center">
              {activeGame === 'math' && <MathSprint />}
              {activeGame === 'memory' && <MemoryMatrix />}
              {activeGame === 'scramble' && <WordScramble />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GameCard({ title, desc, icon, color, onClick }: any) {
  const colors: any = {
    blue: "hover:border-neon-blue/50 hover:shadow-[0_0_30px_rgba(0,242,255,0.1)]",
    purple: "hover:border-neon-purple/50 hover:shadow-[0_0_30px_rgba(188,19,254,0.1)]",
    pink: "hover:border-neon-pink/50 hover:shadow-[0_0_30px_rgba(255,0,255,0.1)]"
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`glass-card p-8 cursor-pointer transition-all border border-white/5 ${colors[color]}`}
    >
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-white/40 text-sm mb-6">{desc}</p>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/20">
        Click to Play <ArrowRight size={12} />
      </div>
    </motion.div>
  );
}

function MathSprint() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [problem, setProblem] = useState({ a: 0, b: 0, op: '+', ans: 0 });
  const [userInput, setUserInput] = useState('');
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');

  const generateProblem = useCallback(() => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, ans;
    
    if (op === '*') {
      a = Math.floor(Math.random() * 10) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      ans = a * b;
    } else {
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      ans = op === '+' ? a + b : a - b;
    }
    
    setProblem({ a, b, op, ans });
    setUserInput('');
  }, []);

  useEffect(() => {
    let timer: any;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0) {
      setGameState('end');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
    generateProblem();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userInput) === problem.ans) {
      setScore(s => s + 1);
      generateProblem();
    } else {
      setUserInput('');
    }
  };

  if (gameState === 'start') {
    return (
      <div className="text-center">
        <Zap className="text-neon-blue w-16 h-16 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-4">Math Sprint</h2>
        <p className="text-white/50 mb-8">Solve as many as you can in 30 seconds!</p>
        <button onClick={startGame} className="btn-neon px-12 py-3">Start Game</button>
      </div>
    );
  }

  if (gameState === 'end') {
    return (
      <div className="text-center">
        <Trophy className="text-neon-yellow w-16 h-16 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-2">Time's Up!</h2>
        <p className="text-5xl font-display font-bold text-neon-blue mb-4">{score}</p>
        <p className="text-white/50 mb-8">Problems Solved</p>
        <button onClick={startGame} className="btn-neon px-12 py-3">Play Again</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md text-center">
      <div className="flex justify-between items-center mb-12">
        <div className="text-left">
          <p className="text-xs text-white/30 uppercase font-bold">Score</p>
          <p className="text-2xl font-bold text-neon-blue">{score}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-white/30 uppercase font-bold">Time</p>
          <p className={`text-2xl font-bold ${timeLeft < 10 ? 'text-neon-pink animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </p>
        </div>
      </div>

      <div className="text-6xl font-display font-bold mb-12 tracking-tighter">
        {problem.a} {problem.op === '*' ? '×' : problem.op} {problem.b} = ?
      </div>

      <form onSubmit={handleSubmit}>
        <input 
          autoFocus
          type="number"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-6 text-4xl text-center font-bold focus:border-neon-blue outline-none transition-all"
          placeholder="Answer..."
        />
      </form>
    </div>
  );
}

function MemoryMatrix() {
  const icons = [Zap, Brain, Target, Star, BookOpen, GraduationCap];
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const initGame = useCallback(() => {
    const deck = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((Icon, index) => ({ id: index, Icon }));
    setCards(deck);
    setFlipped([]);
    setSolved([]);
    setMoves(0);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleFlip = (id: number) => {
    if (flipped.length === 2 || flipped.includes(id) || solved.includes(id)) return;
    
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].Icon === cards[second].Icon) {
        setSolved([...solved, first, second]);
        setFlipped([]);
        if (solved.length + 2 === cards.length) {
          confetti({ particleCount: 150, spread: 100 });
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="text-center w-full max-w-xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Memory Matrix</h2>
        <div className="text-sm text-white/50 font-bold uppercase tracking-widest">Moves: {moves}</div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || solved.includes(card.id);
          return (
            <div 
              key={card.id}
              onClick={() => handleFlip(card.id)}
              className={`aspect-square rounded-2xl cursor-pointer transition-all duration-500 preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}
            >
              <div className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl backface-hidden flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-neon-purple/20"></div>
              </div>
              <div className="absolute inset-0 bg-neon-purple/20 border border-neon-purple/50 rounded-2xl backface-hidden rotate-y-180 flex items-center justify-center">
                <card.Icon className="text-white w-8 h-8" />
              </div>
            </div>
          );
        })}
      </div>

      {solved.length === cards.length && cards.length > 0 && (
        <button onClick={initGame} className="btn-neon mt-12 px-8 py-2">Play Again</button>
      )}
    </div>
  );
}

function WordScramble() {
  const words = ["SCIENCE", "PHYSICS", "BIOLOGY", "HISTORY", "ALGEBRA", "GEOMETRY", "STUDENT", "FUTURE"];
  const [currentWord, setCurrentWord] = useState('');
  const [scrambled, setScrambled] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');

  const nextWord = useCallback(() => {
    const word = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(word);
    setScrambled(word.split('').sort(() => Math.random() - 0.5).join(''));
    setUserInput('');
    setFeedback('');
  }, []);

  useEffect(() => {
    nextWord();
  }, [nextWord]);

  const checkWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.toUpperCase() === currentWord) {
      setScore(s => s + 1);
      setFeedback('Correct! ✨');
      confetti({ particleCount: 50, spread: 40 });
      setTimeout(nextWord, 1500);
    } else {
      setFeedback('Try again! ❌');
    }
  };

  return (
    <div className="text-center w-full max-w-md">
      <div className="mb-8">
        <p className="text-xs text-white/30 uppercase font-bold tracking-widest mb-2">Score: {score}</p>
        <h2 className="text-3xl font-bold">Word Scramble</h2>
      </div>

      <div className="glass-card p-12 mb-8 bg-white/5">
        <div className="text-5xl font-display font-bold tracking-[0.2em] text-neon-pink mb-4">
          {scrambled}
        </div>
        <p className="text-xs text-white/20 uppercase font-bold">Unscramble the word</p>
      </div>

      <form onSubmit={checkWord} className="space-y-4">
        <input 
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-4 text-2xl text-center font-bold focus:border-neon-pink outline-none transition-all uppercase"
          placeholder="Your answer..."
        />
        <button type="submit" className="btn-neon w-full py-4 bg-neon-pink/20 border-neon-pink/50 text-neon-pink hover:bg-neon-pink hover:text-white">
          Check Answer
        </button>
      </form>

      <div className="mt-6 h-6 font-bold text-neon-pink">
        {feedback}
      </div>
    </div>
  );
}

function ArrowRight({ size }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}
