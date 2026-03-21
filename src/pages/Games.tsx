import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Trophy, 
  RotateCcw, 
  Play, 
  ChevronLeft,
  Zap,
  Brain,
  Timer,
  Target,
  MousePointer2,
  Palette,
  Hash
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types ---
type GameState = 'start' | 'playing' | 'end';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const GAMES: Game[] = [
  { id: 'math-sprint', name: 'Math Sprint', description: 'Solve arithmetic problems as fast as you can!', icon: Hash, color: 'from-blue-500 to-cyan-500' },
  { id: 'memory-matrix', name: 'Memory Matrix', description: 'Find matching pairs of cards.', icon: Brain, color: 'from-purple-500 to-pink-500' },
  { id: 'reaction-test', name: 'Reaction Test', description: 'Click as soon as the screen turns green!', icon: Zap, color: 'from-yellow-500 to-orange-500' },
  { id: 'color-rush', name: 'Color Rush', description: 'Pick the color that matches the word!', icon: Palette, color: 'from-green-500 to-emerald-500' },
  { id: 'speed-clicker', name: 'Speed Clicker', description: 'Click the target as many times as possible!', icon: MousePointer2, color: 'from-red-500 to-rose-500' },
  { id: 'word-scramble', name: 'Word Scramble', description: 'Unscramble the words as fast as you can!', icon: RotateCcw, color: 'from-indigo-500 to-violet-500' },
  { id: 'space-dodge', name: 'Space Dodge', description: 'Dodge asteroids in deep space!', icon: Target, color: 'from-slate-700 to-slate-900' },
  { id: 'capital-finder', name: 'Capital Finder', description: 'Test your geography knowledge!', icon: Target, color: 'from-orange-500 to-red-500' },
  { id: 'number-guess', name: 'Number Guess', description: 'Guess the secret number!', icon: Hash, color: 'from-pink-500 to-rose-500' },
];

// --- Sub-components (Games) ---

// 1. Math Sprint
const MathSprint = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [problem, setProblem] = useState({ a: 0, b: 0, op: '+', answer: 0 });
  const [options, setOptions] = useState<number[]>([]);

  const generateProblem = useCallback(() => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;

    if (op === '+') {
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      answer = a + b;
    } else if (op === '-') {
      a = Math.floor(Math.random() * 50) + 20;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
    } else {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
    }

    const wrongOptions = new Set<number>();
    while (wrongOptions.size < 3) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const wrong = answer + offset;
      if (wrong !== answer && wrong > 0) wrongOptions.add(wrong);
    }

    const allOptions = [...Array.from(wrongOptions), answer].sort(() => Math.random() - 0.5);
    setProblem({ a, b, op, answer });
    setOptions(allOptions);
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setGameState('end');
      if (score > 10) confetti();
    }
  }, [gameState, timeLeft, score]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setGameState('playing');
    generateProblem();
  };

  const handleAnswer = (selected: number) => {
    if (selected === problem.answer) {
      setScore(prev => prev + 1);
      generateProblem();
    } else {
      setTimeLeft(prev => Math.max(0, prev - 2)); // Penalty
      generateProblem();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
      {gameState === 'start' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <Hash size={64} className="mx-auto mb-6 text-blue-400" />
          <h2 className="text-3xl font-bold mb-4">Math Sprint</h2>
          <p className="text-white/60 mb-8">Solve as many problems as you can in 30 seconds. Careful: wrong answers cost 2 seconds!</p>
          <button onClick={startGame} className="btn-neon px-8 py-3 text-lg flex items-center gap-2 mx-auto">
            <Play size={20} /> Start Game
          </button>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <div className="w-full">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-2 text-blue-400">
              <Timer size={20} />
              <span className="text-2xl font-mono">{timeLeft}s</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400">
              <Trophy size={20} />
              <span className="text-2xl font-mono">{score}</span>
            </div>
          </div>

          <motion.div 
            key={problem.a + problem.b + problem.op}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center mb-12"
          >
            <div className="text-6xl font-display font-bold tracking-widest">
              {problem.a} {problem.op === '*' ? '×' : problem.op} {problem.b}
            </div>
            <div className="text-2xl text-white/20 mt-4">= ?</div>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {options.map((opt, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(opt)}
                className="glass-card p-6 text-2xl font-bold hover:neon-border transition-all"
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'end' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Trophy size={80} className="mx-auto mb-6 text-yellow-400" />
          <h2 className="text-4xl font-bold mb-2">Game Over!</h2>
          <p className="text-xl text-white/60 mb-8">Your final score: <span className="text-white font-bold">{score}</span></p>
          <button onClick={startGame} className="btn-neon px-8 py-3 flex items-center gap-2 mx-auto">
            <RotateCcw size={20} /> Play Again
          </button>
        </motion.div>
      )}
    </div>
  );
};

// 2. Memory Matrix
const MemoryMatrix = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [cards, setCards] = useState<{ id: number, value: string, flipped: boolean, matched: boolean }[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);

  const icons = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍', '🥝', '🍉'];

  const initGame = () => {
    const deck = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({ id: index, value, flipped: false, matched: false }));
    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setGameState('playing');
  };

  const handleCardClick = (index: number) => {
    if (flippedIndices.length === 2 || cards[index].flipped || cards[index].matched) return;

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [first, second] = newFlipped;
      if (cards[first].value === cards[second].value) {
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[first].matched = true;
          matchedCards[second].matched = true;
          setCards(matchedCards);
          setFlippedIndices([]);
          setMatches(prev => prev + 1);
          if (matches + 1 === icons.length) {
            setGameState('end');
            confetti();
          }
        }, 500);
      } else {
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[first].flipped = false;
          resetCards[second].flipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {gameState === 'start' && (
        <div className="text-center">
          <Brain size={64} className="mx-auto mb-6 text-purple-400" />
          <h2 className="text-3xl font-bold mb-4">Memory Matrix</h2>
          <p className="text-white/60 mb-8">Match all pairs of cards in the fewest moves possible.</p>
          <button onClick={initGame} className="btn-neon px-8 py-3">Start Game</button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full max-w-md">
          <div className="flex justify-between mb-8 text-xl font-mono">
            <span>Matches: {matches}/{icons.length}</span>
            <span>Moves: {moves}</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {cards.map((card, idx) => (
              <motion.div
                key={card.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCardClick(idx)}
                className={`aspect-square rounded-xl cursor-pointer flex items-center justify-center text-3xl transition-all duration-300 ${
                  card.flipped || card.matched 
                    ? 'bg-white/10 border-neon-purple shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                    : 'bg-white/5 border border-white/10 hover:border-white/30'
                }`}
              >
                <AnimatePresence mode="wait">
                  {(card.flipped || card.matched) && (
                    <motion.span
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                    >
                      {card.value}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {gameState === 'end' && (
        <div className="text-center">
          <Trophy size={80} className="mx-auto mb-6 text-yellow-400" />
          <h2 className="text-4xl font-bold mb-4">Well Done!</h2>
          <p className="text-xl text-white/60 mb-8">Completed in {moves} moves.</p>
          <button onClick={initGame} className="btn-neon px-8 py-3">Play Again</button>
        </div>
      )}
    </div>
  );
};

// 3. Color Rush
const ColorRush = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [target, setTarget] = useState({ word: '', color: '', colorClass: '' });
  const [options, setOptions] = useState<{ color: string, colorClass: string }[]>([]);

  const colors = [
    { name: 'Red', class: 'bg-red-500', text: 'text-red-500' },
    { name: 'Blue', class: 'bg-blue-500', text: 'text-blue-500' },
    { name: 'Green', class: 'bg-green-500', text: 'text-green-500' },
    { name: 'Yellow', class: 'bg-yellow-400', text: 'text-yellow-400' },
    { name: 'Purple', class: 'bg-purple-500', text: 'text-purple-500' },
    { name: 'Pink', class: 'bg-pink-500', text: 'text-pink-500' },
  ];

  const generateRound = useCallback(() => {
    const wordColor = colors[Math.floor(Math.random() * colors.length)];
    const textColor = colors[Math.floor(Math.random() * colors.length)];
    setTarget({ word: wordColor.name, color: textColor.name, colorClass: textColor.text });

    const shuffled = [...colors].sort(() => Math.random() - 0.5);
    setOptions(shuffled.map(c => ({ color: c.name, colorClass: c.class })));
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setGameState('end');
      if (score > 15) confetti();
    }
  }, [gameState, timeLeft, score]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(20);
    setGameState('playing');
    generateRound();
  };

  const handleAnswer = (selectedColor: string) => {
    if (selectedColor === target.word) {
      setScore(prev => prev + 1);
      generateRound();
    } else {
      setTimeLeft(prev => Math.max(0, prev - 1));
      generateRound();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
      {gameState === 'start' && (
        <div className="text-center">
          <Palette size={64} className="mx-auto mb-6 text-emerald-400" />
          <h2 className="text-3xl font-bold mb-4">Color Rush</h2>
          <p className="text-white/60 mb-8">Click the color that matches the WORD, not the color of the text!</p>
          <button onClick={startGame} className="btn-neon px-8 py-3">Start Game</button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-2 text-emerald-400">
              <Timer size={20} />
              <span className="text-2xl font-mono">{timeLeft}s</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <Trophy size={20} />
              <span className="text-2xl font-mono">{score}</span>
            </div>
          </div>

          <motion.div 
            key={target.word + target.color}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-7xl font-black text-center mb-16 uppercase tracking-tighter ${target.colorClass}`}
          >
            {target.word}
          </motion.div>

          <div className="grid grid-cols-3 gap-4">
            {options.map((opt, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAnswer(opt.color)}
                className={`h-20 rounded-2xl shadow-lg border-2 border-white/10 ${opt.colorClass}`}
              />
            ))}
          </div>
        </div>
      )}

      {gameState === 'end' && (
        <div className="text-center">
          <Trophy size={80} className="mx-auto mb-6 text-yellow-400" />
          <h2 className="text-4xl font-bold mb-4">Time's Up!</h2>
          <p className="text-xl text-white/60 mb-8">Score: <span className="text-white font-bold">{score}</span></p>
          <button onClick={startGame} className="btn-neon px-8 py-3">Try Again</button>
        </div>
      )}
    </div>
  );
};

// 4. Speed Clicker
const SpeedClicker = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [targetPos, setTargetPos] = useState({ top: '50%', left: '50%' });

  const moveTarget = useCallback(() => {
    const top = Math.floor(Math.random() * 80) + 10 + '%';
    const left = Math.floor(Math.random() * 80) + 10 + '%';
    setTargetPos({ top, left });
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setGameState('end');
      if (score > 20) confetti();
    }
  }, [gameState, timeLeft, score]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(10);
    setGameState('playing');
    moveTarget();
  };

  const handleClick = () => {
    setScore(prev => prev + 1);
    moveTarget();
  };

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <MousePointer2 size={64} className="mb-6 text-rose-400" />
          <h2 className="text-3xl font-bold mb-4">Speed Clicker</h2>
          <p className="text-white/60 mb-8">Click the target as many times as you can in 10 seconds!</p>
          <button onClick={startGame} className="btn-neon px-8 py-3">Start Game</button>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          <div className="absolute top-0 left-0 right-0 flex justify-between p-4 text-2xl font-mono z-20">
            <span className="text-rose-400">Time: {timeLeft}s</span>
            <span className="text-blue-400">Clicks: {score}</span>
          </div>
          <motion.button
            initial={false}
            animate={{ top: targetPos.top, left: targetPos.left }}
            onClick={handleClick}
            className="absolute w-16 h-16 rounded-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)] border-4 border-white flex items-center justify-center -translate-x-1/2 -translate-y-1/2 z-10"
          >
            <Target className="text-white" />
          </motion.button>
        </>
      )}

      {gameState === 'end' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <Trophy size={80} className="mb-6 text-yellow-400" />
          <h2 className="text-4xl font-bold mb-4">Finished!</h2>
          <p className="text-xl text-white/60 mb-8">Total Clicks: <span className="text-white font-bold">{score}</span></p>
          <button onClick={startGame} className="btn-neon px-8 py-3">Try Again</button>
        </div>
      )}
    </div>
  );
};

// 5. Word Scramble
const WordScramble = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [word, setWord] = useState({ original: '', scrambled: '' });
  const [userInput, setUserInput] = useState('');

  const words = ['REACT', 'VITE', 'TAILWIND', 'TYPESCRIPT', 'FIREBASE', 'STUDY', 'LEARNING', 'EDUCATION', 'KNOWLEDGE', 'FUTURE'];

  const generateWord = useCallback(() => {
    const original = words[Math.floor(Math.random() * words.length)];
    const scrambled = original.split('').sort(() => Math.random() - 0.5).join('');
    setWord({ original, scrambled });
    setUserInput('');
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setGameState('end');
      if (score > 5) confetti();
    }
  }, [gameState, timeLeft, score]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(45);
    setGameState('playing');
    generateWord();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.toUpperCase() === word.original) {
      setScore(prev => prev + 1);
      generateWord();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
      {gameState === 'start' && (
        <div className="text-center">
          <RotateCcw size={64} className="mx-auto mb-6 text-blue-400" />
          <h2 className="text-3xl font-bold mb-4">Word Scramble</h2>
          <p className="text-white/60 mb-8">Unscramble the words as fast as you can!</p>
          <button onClick={startGame} className="btn-neon px-8 py-3">Start Game</button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full">
          <div className="flex justify-between items-center mb-12">
            <div className="text-blue-400 font-mono text-2xl">Time: {timeLeft}s</div>
            <div className="text-emerald-400 font-mono text-2xl">Score: {score}</div>
          </div>

          <motion.div 
            key={word.scrambled}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-black text-center mb-12 tracking-[0.5em] text-white/90"
          >
            {word.scrambled}
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              autoFocus
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your answer..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-xl text-center outline-none focus:neon-border transition-all uppercase"
            />
            <button type="submit" className="btn-neon w-full py-4 text-lg">Submit</button>
          </form>
        </div>
      )}

      {gameState === 'end' && (
        <div className="text-center">
          <Trophy size={80} className="mx-auto mb-6 text-yellow-400" />
          <h2 className="text-4xl font-bold mb-4">Time's Up!</h2>
          <p className="text-xl text-white/60 mb-8">Words Unscrambled: <span className="text-white font-bold">{score}</span></p>
          <button onClick={startGame} className="btn-neon px-8 py-3">Try Again</button>
        </div>
      )}
    </div>
  );
};

// 6. Space Dodge
const SpaceDodge = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [playerPos, setPlayerPos] = useState(50);
  const [obstacles, setObstacles] = useState<{ id: number, x: number, y: number }[]>([]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = setInterval(() => {
      setObstacles(prev => {
        const moved = prev.map(o => ({ ...o, y: o.y + 2 }));
        const filtered = moved.filter(o => o.y < 100);
        
        // Collision detection
        const collision = filtered.some(o => o.y > 85 && Math.abs(o.x - playerPos) < 10);
        if (collision) {
          setGameState('end');
          return [];
        }

        if (Math.random() < 0.05) {
          filtered.push({ id: Date.now(), x: Math.random() * 90 + 5, y: 0 });
        }
        return filtered;
      });
      setScore(prev => prev + 1);
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameState, playerPos]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setPlayerPos(prev => Math.max(5, prev - 5));
    if (e.key === 'ArrowRight') setPlayerPos(prev => Math.min(95, prev + 5));
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-full h-[500px] bg-slate-950 rounded-xl overflow-hidden border border-white/10">
      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 bg-black/60 backdrop-blur-sm">
          <Target size={64} className="mb-6 text-blue-400" />
          <h2 className="text-3xl font-bold mb-4">Space Dodge</h2>
          <p className="text-white/60 mb-8">Use Arrow Keys to dodge incoming asteroids!</p>
          <button onClick={() => { setScore(0); setObstacles([]); setGameState('playing'); }} className="btn-neon px-8 py-3">Start Mission</button>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          <div className="absolute top-4 left-4 text-2xl font-mono text-white/40 z-20">Score: {score}</div>
          <motion.div 
            animate={{ left: `${playerPos}%` }}
            className="absolute bottom-10 w-10 h-10 bg-blue-500 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.8)] -translate-x-1/2 flex items-center justify-center"
          >
            🚀
          </motion.div>
          {obstacles.map(o => (
            <div 
              key={o.id} 
              className="absolute w-8 h-8 text-2xl"
              style={{ left: `${o.x}%`, top: `${o.y}%` }}
            >
              ☄️
            </div>
          ))}
        </>
      )}

      {gameState === 'end' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 bg-black/80 backdrop-blur-md">
          <h2 className="text-4xl font-bold mb-4 text-red-500">Mission Failed!</h2>
          <p className="text-xl text-white/60 mb-8">Distance Traveled: {score}m</p>
          <button onClick={() => { setScore(0); setObstacles([]); setGameState('playing'); }} className="btn-neon px-8 py-3">Restart Mission</button>
        </div>
      )}
    </div>
  );
};

// 7. Capital Finder
const CapitalFinder = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState({ country: '', capital: '', options: [] as string[] });

  const data = [
    { country: 'France', capital: 'Paris' },
    { country: 'Japan', capital: 'Tokyo' },
    { country: 'Brazil', capital: 'Brasília' },
    { country: 'India', capital: 'New Delhi' },
    { country: 'Australia', capital: 'Canberra' },
    { country: 'Canada', capital: 'Ottawa' },
    { country: 'Egypt', capital: 'Cairo' },
    { country: 'Germany', capital: 'Berlin' },
  ];

  const generateRound = useCallback(() => {
    const item = data[Math.floor(Math.random() * data.length)];
    const others = data.filter(d => d.capital !== item.capital).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [item.capital, ...others.map(o => o.capital)].sort(() => Math.random() - 0.5);
    setRound({ country: item.country, capital: item.capital, options });
  }, []);

  const handleAnswer = (ans: string) => {
    if (ans === round.capital) {
      setScore(prev => prev + 1);
      generateRound();
      if (score + 1 === 10) {
        setGameState('end');
        confetti();
      }
    } else {
      alert(`Wrong! The capital of ${round.country} is ${round.capital}`);
      generateRound();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
      {gameState === 'start' && (
        <div className="text-center">
          <Target size={64} className="mx-auto mb-6 text-orange-400" />
          <h2 className="text-3xl font-bold mb-4">Capital Finder</h2>
          <p className="text-white/60 mb-8">How well do you know world capitals? Get 10 correct to win!</p>
          <button onClick={() => { setScore(0); setGameState('playing'); generateRound(); }} className="btn-neon px-8 py-3">Start Quiz</button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full">
          <div className="text-center mb-12">
            <p className="text-white/40 uppercase tracking-widest mb-2">What is the capital of</p>
            <h2 className="text-5xl font-bold text-orange-400">{round.country}?</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {round.options.map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} className="glass-card p-6 text-xl font-bold hover:neon-border transition-all">
                {opt}
              </button>
            ))}
          </div>
          <div className="mt-12 text-center text-white/40">Score: {score}/10</div>
        </div>
      )}

      {gameState === 'end' && (
        <div className="text-center">
          <Trophy size={80} className="mx-auto mb-6 text-yellow-400" />
          <h2 className="text-4xl font-bold mb-4">Geography Master!</h2>
          <button onClick={() => { setScore(0); setGameState('playing'); generateRound(); }} className="btn-neon px-8 py-3">Play Again</button>
        </div>
      )}
    </div>
  );
};

// 8. Number Guess
const NumberGuess = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [target, setTarget] = useState(0);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('Guess a number between 1 and 100');
  const [attempts, setAttempts] = useState(0);

  const startNewGame = () => {
    setTarget(Math.floor(Math.random() * 100) + 1);
    setAttempts(0);
    setGuess('');
    setMessage('Guess a number between 1 and 100');
    setGameState('playing');
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(guess);
    if (isNaN(num)) return;

    setAttempts(prev => prev + 1);
    if (num === target) {
      setMessage(`Correct! You found it in ${attempts + 1} attempts.`);
      setGameState('end');
      confetti();
    } else if (num < target) {
      setMessage('Higher! ⬆️');
    } else {
      setMessage('Lower! ⬇️');
    }
    setGuess('');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
      {gameState === 'start' && (
        <div className="text-center">
          <Hash size={64} className="mx-auto mb-6 text-pink-400" />
          <h2 className="text-3xl font-bold mb-4">Number Guess</h2>
          <button onClick={startNewGame} className="btn-neon px-8 py-3">Start Game</button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full text-center">
          <h2 className="text-2xl font-bold mb-8">{message}</h2>
          <form onSubmit={handleGuess} className="space-y-6">
            <input
              autoFocus
              type="number"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-4xl text-center outline-none focus:neon-border transition-all"
            />
            <button type="submit" className="btn-neon w-full py-4 text-xl">Guess</button>
          </form>
          <p className="mt-8 text-white/40">Attempts: {attempts}</p>
        </div>
      )}

      {gameState === 'end' && (
        <div className="text-center">
          <Trophy size={80} className="mx-auto mb-6 text-yellow-400" />
          <h2 className="text-3xl font-bold mb-8">{message}</h2>
          <button onClick={startNewGame} className="btn-neon px-8 py-3">Play Again</button>
        </div>
      )}
    </div>
  );
};

// 9. Reaction Test
const ReactionTest = () => {
  const [gameState, setGameState] = useState<'start' | 'waiting' | 'ready' | 'result'>('start');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const startTest = () => {
    setGameState('waiting');
    const delay = Math.floor(Math.random() * 3000) + 2000;
    const id = setTimeout(() => {
      setGameState('ready');
      setStartTime(Date.now());
    }, delay);
    setTimeoutId(id);
  };

  const handleClick = () => {
    if (gameState === 'waiting') {
      if (timeoutId) clearTimeout(timeoutId);
      setGameState('start');
      alert("Too early! Wait for the green screen.");
    } else if (gameState === 'ready') {
      const time = Date.now() - startTime;
      setReactionTime(time);
      setGameState('result');
      if (time < 300) confetti();
    }
  };

  return (
    <div className="w-full h-full flex flex-center">
      <motion.div 
        onClick={gameState === 'start' || gameState === 'result' ? startTest : handleClick}
        className={`w-full h-full rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${
          gameState === 'waiting' ? 'bg-red-500/20 border-2 border-red-500' :
          gameState === 'ready' ? 'bg-green-500 shadow-[inset_0_0_100px_rgba(0,0,0,0.2)]' :
          'bg-white/5 border border-white/10'
        }`}
      >
        {gameState === 'start' && (
          <div className="text-center p-8">
            <Zap size={64} className="mx-auto mb-6 text-yellow-400" />
            <h2 className="text-3xl font-bold mb-4">Reaction Test</h2>
            <p className="text-white/60">Click as soon as the screen turns green.</p>
            <p className="mt-8 font-mono text-neon-blue animate-pulse">Click anywhere to start</p>
          </div>
        )}

        {gameState === 'waiting' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold">Wait for green...</h2>
          </div>
        )}

        {gameState === 'ready' && (
          <div className="text-center">
            <h2 className="text-6xl font-black text-white drop-shadow-lg">CLICK!</h2>
          </div>
        )}

        {gameState === 'result' && (
          <div className="text-center">
            <Timer size={64} className="mx-auto mb-6 text-blue-400" />
            <h2 className="text-5xl font-bold mb-4">{reactionTime}ms</h2>
            <p className="text-white/60 mb-8">
              {reactionTime < 200 ? "Godlike reflexes! ⚡" : 
               reactionTime < 300 ? "Great job! 🚀" : 
               reactionTime < 400 ? "Not bad! 👍" : "Keep practicing! 🐢"}
            </p>
            <p className="font-mono text-neon-blue animate-pulse">Click to try again</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// --- Main Component ---

export default function Games() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const renderGame = () => {
    switch (selectedGame) {
      case 'math-sprint': return <MathSprint />;
      case 'memory-matrix': return <MemoryMatrix />;
      case 'reaction-test': return <ReactionTest />;
      case 'color-rush': return <ColorRush />;
      case 'speed-clicker': return <SpeedClicker />;
      case 'word-scramble': return <WordScramble />;
      case 'space-dodge': return <SpaceDodge />;
      case 'capital-finder': return <CapitalFinder />;
      case 'number-guess': return <NumberGuess />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-dark-bg text-white">
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!selectedGame ? (
            <motion.div
              key="game-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 rounded-xl bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                  <Gamepad2 size={24} />
                </div>
                <div>
                  <h1 className="text-4xl font-display font-bold">Brain Games</h1>
                  <p className="text-white/40">Sharpen your mind with interactive challenges.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {GAMES.map((game) => (
                  <motion.div
                    key={game.id}
                    whileHover={{ y: -5 }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedGame(game.id)}
                  >
                    <div className="glass-card p-8 h-full relative overflow-hidden group-hover:neon-border transition-all">
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.color} opacity-5 blur-3xl group-hover:opacity-20 transition-opacity`}></div>
                      
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-6 shadow-lg`}>
                        <game.icon className="text-white w-7 h-7" />
                      </div>

                      <h3 className="text-2xl font-bold mb-3 group-hover:neon-text transition-colors">
                        {game.name}
                      </h3>
                      <p className="text-white/50 mb-6">
                        {game.description}
                      </p>

                      <div className="flex items-center text-white/30 group-hover:text-white transition-colors gap-2 text-sm font-medium">
                        Play Now <Play size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="game-view"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              <button 
                onClick={() => setSelectedGame(null)}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group"
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to Games
              </button>

              <div className="glass-card p-12 min-h-[600px] relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-blue/5 blur-[120px] pointer-events-none"></div>
                
                <div className="relative z-10 h-full">
                  {renderGame()}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
