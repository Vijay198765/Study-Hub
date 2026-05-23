import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import SnakeArena from '../components/Snake/SnakeArena';
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
  Hash,
  Info,
  Eye,
  Shield
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- Types ---
type GameState = 'start' | 'memorizing' | 'playing' | 'end';

// --- Hooks ---
const useGameHistory = (maxSize: number = 100) => {
  const [history, setHistory] = useState<string[]>([]);
  
  const addToHistory = useCallback((item: string) => {
    setHistory(prev => {
      const newHistory = [item, ...prev];
      if (newHistory.length > maxSize) return newHistory.slice(0, maxSize);
      return newHistory;
    });
  }, [maxSize]);

  const isInHistory = useCallback((item: string) => history.includes(item), [history]);

  const clearHistory = useCallback(() => setHistory([]), []);

  return { addToHistory, isInHistory, clearHistory };
};

interface Game {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const GAMES: Game[] = [
  { id: 'snake-io', name: 'Snake .io Arena', description: 'Steer smoothly, eat pellets, and cut off bots to grow giant!', icon: Gamepad2, color: 'from-emerald-400 to-blue-500' },
  { id: 'math-sprint', name: 'Math Sprint', description: 'Solve arithmetic problems as fast as you can!', icon: Hash, color: 'from-blue-500 to-cyan-500' },
  { id: 'memory-matrix', name: 'Memory Matrix', description: 'Find matching pairs of cards.', icon: Brain, color: 'from-purple-500 to-pink-500' },
  { id: 'reaction-test', name: 'Reaction Test', description: 'Click as soon as the screen turns green!', icon: Zap, color: 'from-yellow-500 to-orange-500' },
  { id: 'color-rush', name: 'Color Rush', description: 'Pick the color that matches the word!', icon: Palette, color: 'from-green-500 to-emerald-500' },
  { id: 'speed-clicker', name: 'Speed Clicker', description: 'Click the target as many times as possible!', icon: MousePointer2, color: 'from-red-500 to-rose-500' },
  { id: 'word-scramble', name: 'Word Scramble', description: 'Unscramble the words as fast as you can!', icon: RotateCcw, color: 'from-indigo-500 to-violet-500' },
  { id: 'space-dodge', name: 'Space Dodge', description: 'Dodge asteroids in deep space!', icon: Target, color: 'from-slate-700 to-slate-900' },
  { id: 'capital-finder', name: 'Capital Finder', description: 'Test your geography knowledge!', icon: Target, color: 'from-orange-500 to-red-500' },
  { id: 'guess-ans', name: 'Guess Ans', description: 'Guess the correct answer from options!', icon: Hash, color: 'from-pink-500 to-rose-500' },
];

// --- Sub-components (Games) ---

// 1. Math Sprint
const MathSprint = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [problem, setProblem] = useState({ a: 0, b: 0, op: '+', answer: 0 });
  const [options, setOptions] = useState<number[]>([]);
  const { addToHistory, isInHistory, clearHistory } = useGameHistory(100);

  const generateProblem = useCallback(() => {
    const ops = ['+', '-', '*'];
    let a, b, op, answer, key;
    let attempts = 0;

    do {
      op = ops[Math.floor(Math.random() * ops.length)];
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
      key = `${a}${op}${b}`;
      attempts++;
    } while (isInHistory(key) && attempts < 200);

    addToHistory(key);

    const wrongOptions = new Set<number>();
    while (wrongOptions.size < 3) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const wrong = answer + offset;
      if (wrong !== answer && wrong > 0) wrongOptions.add(wrong);
    }

    const allOptions = [...Array.from(wrongOptions), answer].sort(() => Math.random() - 0.5);
    setProblem({ a, b, op, answer });
    setOptions(allOptions);
  }, [isInHistory, addToHistory]);

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
    clearHistory();
    generateProblem();
  };

  const handleAnswer = (selected: number) => {
    if (selected === problem.answer) {
      setScore(prev => prev + 1);
      generateProblem();
    } else {
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
      .map((value, index) => ({ id: index, value, flipped: true, matched: false }));
    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setGameState('memorizing');

    setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, flipped: false })));
      setGameState('playing');
    }, 7000);
  };

  const handleCardClick = (index: number) => {
    if (gameState !== 'playing' || flippedIndices.length === 2 || cards[index].flipped || cards[index].matched) return;

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

      {(gameState === 'playing' || gameState === 'memorizing') && (
        <div className="w-full max-w-md">
          <div className="flex justify-between mb-8 text-xl font-mono">
            <span>Matches: {matches}/{icons.length}</span>
            <span>Moves: {moves}</span>
          </div>
          {gameState === 'memorizing' && (
            <div className="text-center text-yellow-400 mb-4 animate-pulse font-bold">
              Memorize the cards!
            </div>
          )}
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
  const { addToHistory, isInHistory, clearHistory } = useGameHistory(100);

  const colors = [
    { name: 'Red', class: 'bg-red-500', text: 'text-red-500' },
    { name: 'Blue', class: 'bg-blue-500', text: 'text-blue-500' },
    { name: 'Green', class: 'bg-green-500', text: 'text-green-500' },
    { name: 'Yellow', class: 'bg-yellow-400', text: 'text-yellow-400' },
    { name: 'Purple', class: 'bg-purple-500', text: 'text-purple-500' },
    { name: 'Pink', class: 'bg-pink-500', text: 'text-pink-500' },
    { name: 'Orange', class: 'bg-orange-500', text: 'text-orange-500' },
    { name: 'Cyan', class: 'bg-cyan-500', text: 'text-cyan-500' },
    { name: 'Emerald', class: 'bg-emerald-500', text: 'text-emerald-500' },
    { name: 'Indigo', class: 'bg-indigo-500', text: 'text-indigo-500' },
  ];

  const generateRound = useCallback(() => {
    let wordColor, textColor, key;
    let attempts = 0;

    do {
      wordColor = colors[Math.floor(Math.random() * colors.length)];
      textColor = colors[Math.floor(Math.random() * colors.length)];
      key = `${wordColor.name}-${textColor.name}`;
      attempts++;
    } while (isInHistory(key) && attempts < 200);

    addToHistory(key);
    setTarget({ word: wordColor.name, color: textColor.name, colorClass: textColor.text });

    const shuffled = [...colors].sort(() => Math.random() - 0.5).slice(0, 4);
    // Ensure the correct answer is in the options
    if (!shuffled.find(c => c.name === wordColor.name)) {
      shuffled[Math.floor(Math.random() * 4)] = wordColor;
    }
    setOptions(shuffled.map(c => ({ color: c.name, colorClass: c.class })));
  }, [isInHistory, addToHistory]);

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
    clearHistory();
    generateRound();
  };

  const handleAnswer = (selectedColor: string) => {
    if (selectedColor === target.word) {
      setScore(prev => prev + 1);
      generateRound();
    } else {
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

          <div className="grid grid-cols-2 gap-4">
            {options.map((opt, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAnswer(opt.color)}
                className={`h-24 rounded-2xl shadow-lg border-2 border-white/10 ${opt.colorClass}`}
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
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
      if (score > 20) confetti();
    }
  }, [gameState, timeLeft === 0]); // Only re-run when gameState changes or time hits 0

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
            className="absolute w-16 h-16 rounded-full bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)] border-4 border-white flex items-center justify-center -translate-x-1/2 -translate-y-1/2 z-30"
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
  const [options, setOptions] = useState<string[]>([]);
  const { addToHistory, isInHistory, clearHistory } = useGameHistory(100);

  const words = [
    'REACT', 'VITE', 'TAILWIND', 'TYPESCRIPT', 'FIREBASE', 'STUDY', 'LEARNING', 'EDUCATION', 'KNOWLEDGE', 'FUTURE', 
    'MATH', 'BOOK', 'READ', 'TEST', 'EXAM', 'PASS', 'QUIZ', 'CODE', 'DATA', 'FILE', 'USER', 'SYSTEM', 'LOGIC', 
    'BRAIN', 'MIND', 'THINK', 'SMART', 'GENIUS', 'FOCUS', 'POWER', 'SPEED', 'QUICK', 'FAST', 'LIGHT', 'SPACE', 
    'EARTH', 'MOON', 'STAR', 'SUN', 'PLANET', 'GALAXY', 'UNIVERSE', 'ATOM', 'CELL', 'LIFE', 'WORLD', 'PEACE', 
    'LOVE', 'HOPE', 'DREAM', 'GOAL', 'PLAN', 'WORK', 'PLAY', 'GAME', 'FUN', 'JOY', 'HAPPY', 'SMILE', 'LAUGH',
    'MUSIC', 'ART', 'DANCE', 'SONG', 'FILM', 'MOVIE', 'STORY', 'TALE', 'MYTH', 'LEGEND', 'HERO', 'BRAVE', 'STRONG',
    'CALM', 'QUIET', 'SILENT', 'SOUND', 'VOICE', 'WORD', 'TEXT', 'PAGE', 'PAPER', 'PEN', 'INK', 'DRAW', 'PAINT',
    'COLOR', 'BLUE', 'RED', 'GREEN', 'GOLD', 'SILVER', 'IRON', 'STEEL', 'WOOD', 'STONE', 'ROCK', 'SAND', 'WAVE',
    'OCEAN', 'SEA', 'RIVER', 'LAKE', 'RAIN', 'SNOW', 'ICE', 'FIRE', 'HEAT', 'COLD', 'WIND', 'STORM', 'CLOUD',
    'BREEZE', 'NIGHT', 'DAY', 'MORNING', 'EVENING', 'SUMMER', 'WINTER', 'SPRING', 'AUTUMN', 'LEAF', 'TREE', 'FLOWER',
    'BIRD', 'FISH', 'CAT', 'DOG', 'HORSE', 'LION', 'TIGER', 'BEAR', 'WOLF', 'FOX', 'DEER', 'RABBIT', 'EAGLE',
    'SHARK', 'WHALE', 'DOLPHIN', 'SNAKE', 'FROG', 'TURTLE', 'BEE', 'ANT', 'SPIDER', 'FLY', 'WASP', 'MOTH', 'BUG',
    'DESERT', 'FOREST', 'JUNGLE', 'VALLEY', 'HILL', 'PEAK', 'CAVE', 'ISLAND', 'COAST', 'SHORE', 'BEACH', 'SAND',
    'CITY', 'TOWN', 'VILLAGE', 'STREET', 'ROAD', 'PATH', 'BRIDGE', 'TOWER', 'HOUSE', 'HOME', 'ROOM', 'DOOR', 'WINDOW',
    'CHAIR', 'TABLE', 'BED', 'LAMP', 'CLOCK', 'WATCH', 'PHONE', 'RADIO', 'TV', 'CAMERA', 'PHOTO', 'IMAGE', 'PICTURE',
    'FRAME', 'GLASS', 'CUP', 'PLATE', 'FORK', 'KNIFE', 'SPOON', 'BOWL', 'FOOD', 'DRINK', 'WATER', 'MILK', 'JUICE',
    'BREAD', 'CAKE', 'FRUIT', 'APPLE', 'PEAR', 'PEACH', 'PLUM', 'GRAPE', 'MELON', 'BERRY', 'NUT', 'SEED', 'PLANT'
  ];

  const generateWord = useCallback(() => {
    let original, key;
    let attempts = 0;

    do {
      original = words[Math.floor(Math.random() * words.length)];
      key = original;
      attempts++;
    } while (isInHistory(key) && attempts < 200);

    addToHistory(key);
    const scrambled = original.split('').sort(() => Math.random() - 0.5).join('');
    
    // Generate 3 wrong options
    const wrongOptions = new Set<string>();
    while (wrongOptions.size < 3) {
      const wrong = words[Math.floor(Math.random() * words.length)];
      if (wrong !== original) wrongOptions.add(wrong);
    }

    const allOptions = [...Array.from(wrongOptions), original].sort(() => Math.random() - 0.5);
    setWord({ original, scrambled });
    setOptions(allOptions);
  }, [isInHistory, addToHistory]);

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
    clearHistory();
    generateWord();
  };

  const handleAnswer = (selected: string) => {
    if (selected === word.original) {
      setScore(prev => prev + 1);
      generateWord();
    } else {
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

          <div className="grid grid-cols-2 gap-4">
            {options.map((opt, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(opt)}
                className="glass-card p-4 text-lg font-bold hover:neon-border transition-all uppercase"
              >
                {opt}
              </motion.button>
            ))}
          </div>
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
  const [highScore, setHighScore] = useState(() => {
    try {
      return Number(localStorage.getItem('space_dodge_high_score') || '0');
    } catch {
      return 0;
    }
  });
  const [playerPos, setPlayerPos] = useState(50);
  const [obstacles, setObstacles] = useState<{ id: number, x: number, y: number, speed: number, size: number, char: string }[]>([]);
  const [lasers, setLasers] = useState<{ id: number, x: number, y: number }[]>([]);
  const [powerups, setPowerups] = useState<{ id: number, x: number, y: number, type: 'shield' | 'bonus' }[]>([]);
  const [shieldActive, setShieldActive] = useState(false);
  const [shieldTimeLeft, setShieldTimeLeft] = useState(0);
  const [stars, setStars] = useState<{ id: number, x: number, y: number, size: number, speed: number }[]>(() => 
    Array.from({ length: 45 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.8 + 0.2
    }))
  );
  
  const requestRef = React.useRef<number>(0);
  const lastTimeRef = React.useRef<number>(0);
  const keysPressedRef = React.useRef<Record<string, boolean>>({});
  const lastShotTimeRef = React.useRef<number>(0);

  // Sound synthesis via Web Audio API 
  const playSoundEffect = (type: 'laser' | 'powerup' | 'explosion' | 'click' | 'shield') => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const now = ctx.currentTime;
      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.08);
        gainNode.gain.setValueAtTime(0.04, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gainNode.gain.setValueAtTime(0.06, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'powerup') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'shield') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.12);
        osc.frequency.linearRampToValueAtTime(440, now + 0.3);
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'explosion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.6);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (_) {}
  };

  const fireLaser = () => {
    const now = Date.now();
    if (now - lastShotTimeRef.current > 220) { // Max 4.5 shots per second
      playSoundEffect('laser');
      setLasers(prev => [...prev, { id: now, x: playerPos, y: 85 }]);
      lastShotTimeRef.current = now;
    }
  };

  const update = useCallback((time: number) => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(update);
      return;
    }
    const deltaTime = Math.min(50, time - lastTimeRef.current); // Clamp delta to prevent crazy physics
    lastTimeRef.current = time;

    // Smooth ship steering
    let moveDir = 0;
    if (keysPressedRef.current['ArrowLeft'] || keysPressedRef.current['a'] || keysPressedRef.current['A']) moveDir -= 1;
    if (keysPressedRef.current['ArrowRight'] || keysPressedRef.current['d'] || keysPressedRef.current['D']) moveDir += 1;
    if (keysPressedRef.current[' '] || keysPressedRef.current['ArrowUp'] || keysPressedRef.current['w']) {
      fireLaser();
    }

    if (moveDir !== 0) {
      const shipSpeed = 0.082 * deltaTime;
      setPlayerPos(prev => Math.max(5, Math.min(95, prev + moveDir * shipSpeed)));
    }

    // Move starfield particle effects
    setStars(prev => prev.map(s => {
      let newY = s.y + s.speed * 0.12 * deltaTime;
      if (newY > 100) {
        newY = 0;
        return { ...s, y: newY, x: Math.random() * 100 };
      }
      return { ...s, y: newY };
    }));

    // Scroll active lasers
    setLasers(prev => {
      const moved = prev.map(l => ({ ...l, y: l.y - 0.45 * deltaTime }));
      return moved.filter(l => l.y > 0);
    });

    // Reduce protective shield timer
    setShieldTimeLeft(prev => {
      if (prev <= 0) {
        if (shieldActive) setShieldActive(false);
        return 0;
      }
      return Math.max(0, prev - deltaTime);
    });

    // Handle incoming hazards (asteroids, garbage) with scaling level difficulty
    setObstacles(prev => {
      const difficultyMultiplier = Math.min(2.5, 1 + score / 1500);
      const moved = prev.map(o => ({ ...o, y: o.y + o.speed * 0.05 * deltaTime * difficultyMultiplier }));
      let filtered = moved.filter(o => o.y < 105);

      // Verify laser projectile collisions
      setLasers(lPrev => {
        let activeLasers = [...lPrev];
        filtered = filtered.filter(obs => {
          const hitIdx = activeLasers.findIndex(l => Math.abs(l.x - obs.x) < 8 && Math.abs(l.y - obs.y) < 7);
          if (hitIdx !== -1) {
            playSoundEffect('explosion');
            activeLasers.splice(hitIdx, 1);
            setScore(s => s + 75); // Get points for shooting meteor!
            return false; 
          }
          return true;
        });
        return activeLasers;
      });

      // Verify player body collisions
      const playerCollision = filtered.some(o => o.y > 83 && o.y < 93 && Math.abs(o.x - playerPos) < 6);
      if (playerCollision) {
        if (shieldActive) {
          // Explode the asteroid but save the player!
          playSoundEffect('explosion');
          setShieldActive(false);
          setShieldTimeLeft(0);
          filtered = filtered.filter(o => !(o.y > 83 && o.y < 93 && Math.abs(o.x - playerPos) < 6));
        } else {
          playSoundEffect('explosion');
          setGameState('end');
          setHighScore(h => {
            const finalScore = score;
            if (finalScore > h) {
              try {
                localStorage.setItem('space_dodge_high_score', finalScore.toString());
              } catch (_) {}
              return finalScore;
            }
            return h;
          });
          return [];
        }
      }

      // Random asteroid generator
      const spawnRate = 0.015 * difficultyMultiplier;
      if (Math.random() < spawnRate && filtered.length < 15) {
        const chars = ['☄️', '🪨', '🪐', '👾'];
        const randomChar = chars[Math.floor(Math.random() * chars.length)];
        filtered.push({
          id: Date.now() + Math.random(),
          x: Math.random() * 90 + 5,
          y: -5,
          speed: Math.random() * 2 + 1.2,
          size: Math.random() * 1.5 + 0.8,
          char: randomChar
        });
      }
      return filtered;
    });

    // Scroll active powerups on field
    setPowerups(prev => {
      const moved = prev.map(p => ({ ...p, y: p.y + 0.08 * deltaTime }));
      let filtered = moved.filter(p => p.y < 105);

      // Check collision with player ship
      const activePowerups = filtered.filter(p => {
        const caught = p.y > 82 && p.y < 94 && Math.abs(p.x - playerPos) < 8;
        if (caught) {
          if (p.type === 'shield') {
            playSoundEffect('shield');
            setShieldActive(true);
            setShieldTimeLeft(6000); // 6 seconds immunity shield
          } else {
            playSoundEffect('powerup');
            setScore(s => s + 300); // Instant 300 boost points
          }
          return false;
        }
        return true;
      });

      // Spawn rate of positive power-ups
      if (Math.random() < 0.003 && activePowerups.length < 2) {
        activePowerups.push({
          id: Date.now() + Math.random(),
          x: Math.random() * 90 + 5,
          y: -5,
          type: Math.random() > 0.4 ? 'shield' : 'bonus'
        });
      }
      return activePowerups;
    });

    // Score ticking increments
    setScore(prev => prev + 1);
    requestRef.current = requestAnimationFrame(update);
  }, [playerPos, score, shieldActive]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameState !== 'playing') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setPlayerPos(Math.max(5, Math.min(95, x)));
  };

  const startMission = () => {
    playSoundEffect('powerup');
    setScore(0);
    setObstacles([]);
    setLasers([]);
    setPowerups([]);
    setShieldActive(false);
    setShieldTimeLeft(0);
    setGameState('playing');
    lastTimeRef.current = 0;
  };

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, update]);

  // Handle continuous keys inputs tracking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
      }
      keysPressedRef.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div 
      className="relative w-full h-[520px] bg-zinc-950 rounded-2xl overflow-hidden border border-white/10 touch-none flex flex-col justify-between"
      onPointerMove={handlePointerMove}
    >
      {/* Dynamic Starfield Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {stars.map(s => (
          <div 
            key={s.id}
            className="absolute bg-white rounded-full opacity-60 animate-pulse"
            style={{ 
              left: `${s.x}%`, 
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`
            }}
          />
        ))}
      </div>

      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 bg-black/70 backdrop-blur-sm px-6">
          <div className="w-[84px] h-[84px] rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(59,130,246,0.2)]">
            <Target size={44} className="text-blue-400 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <h2 className="text-3xl font-extrabold mb-3 text-white tracking-wider uppercase">Space Dodge</h2>
          <p className="text-white/60 mb-6 max-w-sm text-sm leading-relaxed">
            Shoot lasers with <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-white text-xs">SPACE / ArrowUp</span> & steer with <span className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-white text-xs">ARROW KEYS</span> or touch/drag to dodge! Shot rocks yield bonus scores.
          </p>
          <div className="flex flex-col items-center gap-3 mb-8">
            <span className="text-xs text-white/40 uppercase tracking-widest">Personal High Score</span>
            <div className="text-xl font-mono font-extrabold text-blue-400 bg-blue-900/10 px-4 py-1.5 rounded-lg border border-blue-500/20">
              🏆 {highScore} pts
            </div>
          </div>
          <button onClick={startMission} className="btn-neon bg-blue-500 text-black px-10 py-3.5 font-bold uppercase tracking-wider text-sm rounded-xl">
            Launch Fighter
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <>
          {/* Top Panel Indicators */}
          <div className="absolute top-4 inset-x-4 flex justify-between items-center z-10 pointer-events-none select-none">
            <div className="flex flex-col">
              <span className="text-[10px] text-white/40 uppercase tracking-widest">Mission Score</span>
              <span className="text-2xl font-mono font-bold text-white leading-none">{score}</span>
            </div>

            {shieldActive && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-emerald-400 font-mono text-xs animate-bounce">
                <Shield size={14} className="animate-spin" /> SHIELD: {Math.ceil(shieldTimeLeft / 1000)}s
              </div>
            )}

            <div className="flex flex-col items-end">
              <span className="text-[10px] text-white/40 uppercase tracking-widest">Best Record</span>
              <span className="text-sm font-mono text-blue-400 leading-none">🏆 {highScore}</span>
            </div>
          </div>

          {/* Shooting instruction reminder */}
          <div className="absolute bottom-4 left-4 text-[10px] font-mono text-white/20 select-none hidden sm:block">
            ☄️ Space to shoot lasers • Move cursor to navigate
          </div>

          {/* Flying player spaceship */}
          <motion.div 
            animate={{ left: `${playerPos}%` }}
            transition={{ type: 'tween', duration: 0.05 }}
            className="absolute bottom-12 w-10 h-10 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none"
          >
            {/* Plasma Forcefield Shield Glow */}
            {shieldActive && (
              <div className="absolute -inset-4 rounded-full border-2 border-emerald-400/40 bg-emerald-500/5 animate-pulse blur-[1px] shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
            )}
            
            <div className="text-3xl filter drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]">
              🚀
            </div>

            {/* Jet Fire Exhaust Engine */}
            <div className="w-1.5 h-4 bg-gradient-to-t from-red-500 via-orange-400 to-transparent mt-[-4px] animate-bounce" />
          </motion.div>

          {/* Projectile Lasers lasers */}
          {lasers.map(l => (
            <div 
              key={l.id} 
              className="absolute w-1 h-3 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,1)]"
              style={{ left: `${l.x}%`, top: `${l.y}%` }}
            />
          ))}

          {/* Laser obstacles meteor rocks */}
          {obstacles.map(o => (
            <div 
              key={o.id} 
              className="absolute text-center select-none"
              style={{ 
                left: `${o.x}%`, 
                top: `${o.y}%`,
                fontSize: `${o.size * 18}px`,
                transform: 'translate(-55%, -55%)'
              }}
            >
              {o.char}
            </div>
          ))}

          {/* Floating Powerups */}
          {powerups.map(p => (
            <div 
              key={p.id} 
              className={`absolute text-2xl select-none animate-bounce flex items-center justify-center w-8 h-8 rounded-full border shadow-[0_0_15px_rgba(255,255,255,0.2)]`}
              style={{ 
                left: `${p.x}%`, 
                top: `${p.y}%`,
                borderColor: p.type === 'shield' ? 'rgba(52,211,153,0.4)' : 'rgba(251,191,36,0.4)',
                backgroundColor: p.type === 'shield' ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {p.type === 'shield' ? '🛡️' : '💎'}
            </div>
          ))}
        </>
      )}

      {gameState === 'end' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 bg-black/80 backdrop-blur-md px-6">
          <div className="text-6xl mb-4 animate-bounce">💥</div>
          <h2 className="text-3xl font-extrabold mb-2 text-red-500 uppercase tracking-widest">Ship Destroyed</h2>
          <p className="text-white/60 mb-6 text-sm">You collided with an orbital comet!</p>
          
          <div className="grid grid-cols-2 gap-4 max-w-xs w-full mb-8">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Score Gained</span>
              <span className="text-xl font-mono font-bold text-white">{score}</span>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-center">
              <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Current Best</span>
              <span className="text-xl font-mono font-bold text-blue-400">🏆 {highScore}</span>
            </div>
          </div>

          <button onClick={startMission} className="btn-neon bg-red-500 text-black px-12 py-3.5 font-bold uppercase tracking-wider text-sm rounded-xl">
            Quick Restart
          </button>
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
  const { addToHistory, isInHistory, clearHistory } = useGameHistory(100);

  const data = [
    { country: 'France', capital: 'Paris' },
    { country: 'Japan', capital: 'Tokyo' },
    { country: 'Brazil', capital: 'Brasília' },
    { country: 'India', capital: 'New Delhi' },
    { country: 'Australia', capital: 'Canberra' },
    { country: 'Canada', capital: 'Ottawa' },
    { country: 'Egypt', capital: 'Cairo' },
    { country: 'Germany', capital: 'Berlin' },
    { country: 'Italy', capital: 'Rome' },
    { country: 'Spain', capital: 'Madrid' },
    { country: 'UK', capital: 'London' },
    { country: 'USA', capital: 'Washington D.C.' },
    { country: 'China', capital: 'Beijing' },
    { country: 'Russia', capital: 'Moscow' },
    { country: 'South Africa', capital: 'Pretoria' },
    { country: 'Mexico', capital: 'Mexico City' },
    { country: 'Argentina', capital: 'Buenos Aires' },
    { country: 'Turkey', capital: 'Ankara' },
    { country: 'South Korea', capital: 'Seoul' },
    { country: 'Indonesia', capital: 'Jakarta' },
    { country: 'Thailand', capital: 'Bangkok' },
    { country: 'Vietnam', capital: 'Hanoi' },
    { country: 'Greece', capital: 'Athens' },
    { country: 'Portugal', capital: 'Lisbon' },
    { country: 'Sweden', capital: 'Stockholm' },
    { country: 'Norway', capital: 'Oslo' },
    { country: 'Finland', capital: 'Helsinki' },
    { country: 'Denmark', capital: 'Copenhagen' },
    { country: 'Switzerland', capital: 'Bern' },
    { country: 'Austria', capital: 'Vienna' },
    { country: 'Belgium', capital: 'Brussels' },
    { country: 'Netherlands', capital: 'Amsterdam' },
    { country: 'Poland', capital: 'Warsaw' },
    { country: 'Czech Republic', capital: 'Prague' },
    { country: 'Hungary', capital: 'Budapest' },
    { country: 'Ireland', capital: 'Dublin' },
    { country: 'New Zealand', capital: 'Wellington' },
    { country: 'Singapore', capital: 'Singapore' },
    { country: 'Malaysia', capital: 'Kuala Lumpur' },
    { country: 'Philippines', capital: 'Manila' },
    { country: 'Pakistan', capital: 'Islamabad' },
    { country: 'Bangladesh', capital: 'Dhaka' },
    { country: 'Nigeria', capital: 'Abuja' },
    { country: 'Kenya', capital: 'Nairobi' },
    { country: 'Ethiopia', capital: 'Addis Ababa' },
    { country: 'Morocco', capital: 'Rabat' },
    { country: 'Colombia', capital: 'Bogotá' },
    { country: 'Peru', capital: 'Lima' },
    { country: 'Chile', capital: 'Santiago' },
    { country: 'Saudi Arabia', capital: 'Riyadh' },
    { country: 'UAE', capital: 'Abu Dhabi' },
    { country: 'Israel', capital: 'Jerusalem' },
    { country: 'Iran', capital: 'Tehran' },
    { country: 'Iraq', capital: 'Baghdad' },
    { country: 'Ukraine', capital: 'Kyiv' },
    { country: 'Romania', capital: 'Bucharest' },
    { country: 'Bulgaria', capital: 'Sofia' },
    { country: 'Croatia', capital: 'Zagreb' },
    { country: 'Serbia', capital: 'Belgrade' },
    { country: 'Slovakia', capital: 'Bratislava' },
    { country: 'Slovenia', capital: 'Ljubljana' },
    { country: 'Estonia', capital: 'Tallinn' },
    { country: 'Latvia', capital: 'Riga' },
    { country: 'Lithuania', capital: 'Vilnius' },
    { country: 'Iceland', capital: 'Reykjavik' },
    { country: 'Luxembourg', capital: 'Luxembourg' },
    { country: 'Malta', capital: 'Valletta' },
    { country: 'Cyprus', capital: 'Nicosia' },
    { country: 'Albania', capital: 'Tirana' },
    { country: 'Montenegro', capital: 'Podgorica' },
    { country: 'North Macedonia', capital: 'Skopje' },
    { country: 'Bosnia and Herzegovina', capital: 'Sarajevo' },
    { country: 'Moldova', capital: 'Chisinau' },
    { country: 'Georgia', capital: 'Tbilisi' },
    { country: 'Armenia', capital: 'Yerevan' },
    { country: 'Azerbaijan', capital: 'Baku' },
    { country: 'Kazakhstan', capital: 'Astana' },
    { country: 'Uzbekistan', capital: 'Tashkent' },
    { country: 'Turkmenistan', capital: 'Ashgabat' },
    { country: 'Kyrgyzstan', capital: 'Bishkek' },
    { country: 'Tajikistan', capital: 'Dushanbe' },
    { country: 'Mongolia', capital: 'Ulaanbaatar' },
    { country: 'Nepal', capital: 'Kathmandu' },
    { country: 'Sri Lanka', capital: 'Sri Jayawardenepura Kotte' },
    { country: 'Myanmar', capital: 'Naypyidaw' },
    { country: 'Cambodia', capital: 'Phnom Penh' },
    { country: 'Laos', capital: 'Vientiane' },
    { country: 'Jordan', capital: 'Amman' },
    { country: 'Lebanon', capital: 'Beirut' },
    { country: 'Oman', capital: 'Muscat' },
    { country: 'Qatar', capital: 'Doha' },
    { country: 'Kuwait', capital: 'Kuwait City' },
    { country: 'Bahrain', capital: 'Manama' },
    { country: 'Yemen', capital: 'Sana\'a' },
    { country: 'Algeria', capital: 'Algiers' },
    { country: 'Tunisia', capital: 'Tunis' },
    { country: 'Libya', capital: 'Tripoli' },
    { country: 'Sudan', capital: 'Khartoum' },
    { country: 'Ghana', capital: 'Accra' },
    { country: 'Ivory Coast', capital: 'Yamoussoukro' },
    { country: 'Senegal', capital: 'Dakar' },
    { country: 'Uganda', capital: 'Kampala' },
    { country: 'Tanzania', capital: 'Dodoma' },
    { country: 'Zambia', capital: 'Lusaka' },
    { country: 'Zimbabwe', capital: 'Harare' },
    { country: 'Botswana', capital: 'Gaborone' },
    { country: 'Namibia', capital: 'Windhoek' },
    { country: 'Angola', capital: 'Luanda' },
    { country: 'Madagascar', capital: 'Antananarivo' },
    { country: 'Cuba', capital: 'Havana' },
    { country: 'Jamaica', capital: 'Kingston' },
    { country: 'Panama', capital: 'Panama City' },
    { country: 'Costa Rica', capital: 'San José' },
    { country: 'Ecuador', capital: 'Quito' },
    { country: 'Uruguay', capital: 'Montevideo' },
    { country: 'Paraguay', capital: 'Asunción' },
    { country: 'Bolivia', capital: 'Sucre' },
    { country: 'Venezuela', capital: 'Caracas' },
  ];

  const generateRound = useCallback(() => {
    let item, key;
    let attempts = 0;

    do {
      item = data[Math.floor(Math.random() * data.length)];
      key = item.country;
      attempts++;
    } while (isInHistory(key) && attempts < 200);

    addToHistory(key);
    const others = data.filter(d => d.capital !== item.capital).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [item.capital, ...others.map(o => o.capital)].sort(() => Math.random() - 0.5);
    setRound({ country: item.country, capital: item.capital, options });
  }, [isInHistory, addToHistory]);

  const handleAnswer = (ans: string) => {
    if (ans === round.capital) {
      setScore(prev => prev + 1);
      generateRound();
      if (score + 1 === 20) {
        setGameState('end');
        confetti();
      }
    } else {
      generateRound();
    }
  };

  const startQuiz = () => {
    setScore(0);
    setGameState('playing');
    clearHistory();
    generateRound();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
      {gameState === 'start' && (
        <div className="text-center">
          <Target size={64} className="mx-auto mb-6 text-orange-400" />
          <h2 className="text-3xl font-bold mb-4">Capital Finder</h2>
          <p className="text-white/60 mb-8">How well do you know world capitals? Get 20 correct to win!</p>
          <button onClick={startQuiz} className="btn-neon px-8 py-3">Start Quiz</button>
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
          <div className="mt-12 text-center text-white/40">Score: {score}/20</div>
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

// 8. Guess Ans
const GuessAns = () => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [problem, setProblem] = useState({ question: '', answer: '' });
  const [options, setOptions] = useState<string[]>([]);
  const { addToHistory, isInHistory, clearHistory } = useGameHistory(100);

  const data = [
    { q: 'What is 5 + 7?', a: '12', o: ['10', '11', '13'] },
    { q: 'What is the capital of India?', a: 'New Delhi', o: ['Mumbai', 'Kolkata', 'Chennai'] },
    { q: 'Which planet is known as the Red Planet?', a: 'Mars', o: ['Venus', 'Jupiter', 'Saturn'] },
    { q: 'What is the largest ocean?', a: 'Pacific', o: ['Atlantic', 'Indian', 'Arctic'] },
    { q: 'How many continents are there?', a: '7', o: ['5', '6', '8'] },
    { q: 'What is the square root of 64?', a: '8', o: ['6', '7', '9'] },
    { q: 'Which gas do plants absorb?', a: 'CO2', o: ['Oxygen', 'Nitrogen', 'Hydrogen'] },
    { q: 'Who wrote "Romeo and Juliet"?', a: 'Shakespeare', o: ['Dickens', 'Hemingway', 'Austen'] },
    { q: 'What is the fastest land animal?', a: 'Cheetah', o: ['Lion', 'Leopard', 'Tiger'] },
    { q: 'Which element has the symbol "O"?', a: 'Oxygen', o: ['Gold', 'Silver', 'Iron'] },
    { q: 'What is the largest planet in our solar system?', a: 'Jupiter', o: ['Saturn', 'Neptune', 'Mars'] },
    { q: 'How many colors are in a rainbow?', a: '7', o: ['6', '8', '5'] },
    { q: 'Which country is known as the Land of the Rising Sun?', a: 'Japan', o: ['China', 'Korea', 'Thailand'] },
    { q: 'What is the currency of Japan?', a: 'Yen', o: ['Dollar', 'Euro', 'Won'] },
    { q: 'Which is the smallest continent?', a: 'Australia', o: ['Europe', 'Antarctica', 'South America'] },
    { q: 'What is the boiling point of water?', a: '100°C', o: ['90°C', '110°C', '120°C'] },
    { q: 'Which is the longest river in the world?', a: 'Nile', o: ['Amazon', 'Yangtze', 'Mississippi'] },
    { q: 'Who painted the Mona Lisa?', a: 'Da Vinci', o: ['Picasso', 'Van Gogh', 'Michelangelo'] },
    { q: 'What is the hardest natural substance?', a: 'Diamond', o: ['Gold', 'Iron', 'Steel'] },
    { q: 'Which planet is closest to the Sun?', a: 'Mercury', o: ['Venus', 'Earth', 'Mars'] },
    { q: 'How many bones are in the adult human body?', a: '206', o: ['200', '210', '215'] },
    { q: 'Which is the largest desert in the world?', a: 'Sahara', o: ['Gobi', 'Kalahari', 'Arabian'] },
    { q: 'What is the main ingredient in chocolate?', a: 'Cocoa', o: ['Sugar', 'Milk', 'Vanilla'] },
    { q: 'Which is the tallest mountain in the world?', a: 'Everest', o: ['K2', 'Kangchenjunga', 'Lhotse'] },
    { q: 'Who discovered gravity?', a: 'Newton', o: ['Einstein', 'Galileo', 'Tesla'] },
    { q: 'What is the capital of France?', a: 'Paris', o: ['Lyon', 'Marseille', 'Nice'] },
    { q: 'Which animal is known as the King of the Jungle?', a: 'Lion', o: ['Tiger', 'Elephant', 'Bear'] },
    { q: 'How many legs does a spider have?', a: '8', o: ['6', '10', '12'] },
    { q: 'Which is the largest country by area?', a: 'Russia', o: ['Canada', 'China', 'USA'] },
    { q: 'What is the chemical symbol for water?', a: 'H2O', o: ['CO2', 'O2', 'NaCl'] },
    { q: 'What is the capital of Italy?', a: 'Rome', o: ['Milan', 'Venice', 'Florence'] },
    { q: 'Which is the largest animal in the world?', a: 'Blue Whale', o: ['Elephant', 'Giraffe', 'Shark'] },
    { q: 'How many minutes are in an hour?', a: '60', o: ['50', '70', '80'] },
    { q: 'What is the color of an emerald?', a: 'Green', o: ['Red', 'Blue', 'Yellow'] },
    { q: 'Which planet is known as the Morning Star?', a: 'Venus', o: ['Mars', 'Jupiter', 'Mercury'] },
    { q: 'What is the main gas in the air we breathe?', a: 'Nitrogen', o: ['Oxygen', 'CO2', 'Argon'] },
    { q: 'How many days are in a leap year?', a: '366', o: ['365', '364', '367'] },
    { q: 'What is the largest organ in the human body?', a: 'Skin', o: ['Liver', 'Heart', 'Lungs'] },
    { q: 'Which is the smallest prime number?', a: '2', o: ['1', '3', '5'] },
    { q: 'What is the capital of Germany?', a: 'Berlin', o: ['Munich', 'Frankfurt', 'Hamburg'] },
    { q: 'Which ocean is between Europe and America?', a: 'Atlantic', o: ['Pacific', 'Indian', 'Arctic'] },
    { q: 'How many sides does a hexagon have?', a: '6', o: ['5', '7', '8'] },
    { q: 'What is the freezing point of water?', a: '0°C', o: ['-10°C', '10°C', '32°C'] },
    { q: 'Which bird is a symbol of peace?', a: 'Dove', o: ['Eagle', 'Owl', 'Swan'] },
    { q: 'What is the capital of Spain?', a: 'Madrid', o: ['Barcelona', 'Seville', 'Valencia'] },
    { q: 'Which is the largest state in the USA by area?', a: 'Alaska', o: ['Texas', 'California', 'Montana'] },
    { q: 'How many strings does a standard guitar have?', a: '6', o: ['4', '5', '12'] },
    { q: 'What is the capital of Canada?', a: 'Ottawa', o: ['Toronto', 'Vancouver', 'Montreal'] },
    { q: 'Which fruit is known as the "king of fruits"?', a: 'Durian', o: ['Mango', 'Apple', 'Banana'] },
    { q: 'What is the capital of Australia?', a: 'Canberra', o: ['Sydney', 'Melbourne', 'Brisbane'] },
    { q: 'Which is the most spoken language in the world?', a: 'Mandarin', o: ['English', 'Spanish', 'Hindi'] },
    { q: 'How many players are in a soccer team on the field?', a: '11', o: ['10', '12', '9'] },
    { q: 'What is the capital of Brazil?', a: 'Brasília', o: ['Rio de Janeiro', 'São Paulo', 'Salvador'] },
    { q: 'Which is the largest moon of Saturn?', a: 'Titan', o: ['Europa', 'Ganymede', 'Callisto'] },
    { q: 'What is the capital of Russia?', a: 'Moscow', o: ['Saint Petersburg', 'Kazan', 'Novosibirsk'] },
    { q: 'Which metal is liquid at room temperature?', a: 'Mercury', o: ['Gold', 'Silver', 'Copper'] },
    { q: 'How many hearts does an octopus have?', a: '3', o: ['1', '2', '8'] },
    { q: 'What is the capital of Japan?', a: 'Tokyo', o: ['Osaka', 'Kyoto', 'Nagoya'] },
    { q: 'Which is the largest land-locked country?', a: 'Kazakhstan', o: ['Mongolia', 'Chad', 'Niger'] },
    { q: 'What is the capital of Egypt?', a: 'Cairo', o: ['Alexandria', 'Giza', 'Luxor'] },
    { q: 'Which is the most abundant element in the universe?', a: 'Hydrogen', o: ['Helium', 'Oxygen', 'Carbon'] },
    { q: 'How many teeth does an adult human typically have?', a: '32', o: ['28', '30', '34'] },
    { q: 'What is the capital of China?', a: 'Beijing', o: ['Shanghai', 'Guangzhou', 'Shenzhen'] },
    { q: 'Which is the largest internal organ?', a: 'Liver', o: ['Heart', 'Kidneys', 'Stomach'] },
    { q: 'What is the capital of Mexico?', a: 'Mexico City', o: ['Guadalajara', 'Monterrey', 'Cancun'] },
    { q: 'Which is the only continent without a desert?', a: 'Europe', o: ['Antarctica', 'South America', 'Australia'] },
    { q: 'How many planets are in our solar system?', a: '8', o: ['7', '9', '10'] },
    { q: 'What is the capital of South Africa?', a: 'Pretoria', o: ['Cape Town', 'Johannesburg', 'Durban'] },
    { q: 'Which is the largest species of shark?', a: 'Whale Shark', o: ['Great White', 'Hammerhead', 'Tiger Shark'] },
    { q: 'What is the capital of Turkey?', a: 'Ankara', o: ['Istanbul', 'Izmir', 'Antalya'] },
    { q: 'Which is the most dense planet in our solar system?', a: 'Earth', o: ['Jupiter', 'Saturn', 'Mars'] },
    { q: 'How many years are in a millennium?', a: '1000', o: ['100', '500', '2000'] },
    { q: 'What is the capital of Argentina?', a: 'Buenos Aires', o: ['Córdoba', 'Rosario', 'Mendoza'] },
    { q: 'Which is the largest bay in the world?', a: 'Bay of Bengal', o: ['Hudson Bay', 'Baffin Bay', 'Gulf of Mexico'] },
    { q: 'What is the capital of Thailand?', a: 'Bangkok', o: ['Phuket', 'Chiang Mai', 'Pattaya'] },
    { q: 'Which is the smallest country in the world?', a: 'Vatican City', o: ['Monaco', 'Nauru', 'Tuvalu'] },
    { q: 'How many seconds are in a day?', a: '86400', o: ['3600', '43200', '100000'] },
    { q: 'What is the capital of Greece?', a: 'Athens', o: ['Thessaloniki', 'Patras', 'Heraklion'] },
    { q: 'Which is the largest island in the world?', a: 'Greenland', o: ['New Guinea', 'Borneo', 'Madagascar'] },
    { q: 'What is the capital of Portugal?', a: 'Lisbon', o: ['Porto', 'Braga', 'Coimbra'] },
    { q: 'Which is the most common blood type?', a: 'O+', o: ['A+', 'B+', 'AB+'] },
    { q: 'How many valves does the human heart have?', a: '4', o: ['2', '3', '5'] },
    { q: 'What is the capital of Sweden?', a: 'Stockholm', o: ['Gothenburg', 'Malmö', 'Uppsala'] },
    { q: 'Which is the largest flower in the world?', a: 'Rafflesia', o: ['Titan Arum', 'Sunflower', 'Lotus'] },
    { q: 'What is the capital of Norway?', a: 'Oslo', o: ['Bergen', 'Trondheim', 'Stavanger'] },
    { q: 'Which is the most famous comet?', a: 'Halley', o: ['Encke', 'Hale-Bopp', 'Hyakutake'] },
    { q: 'How many keys are on a standard piano?', a: '88', o: ['76', '84', '92'] },
    { q: 'What is the capital of Finland?', a: 'Helsinki', o: ['Espoo', 'Tampere', 'Vantaa'] },
    { q: 'Which is the largest peninsula in the world?', a: 'Arabian', o: ['Indian', 'Indochinese', 'Scandinavian'] },
    { q: 'What is the capital of Denmark?', a: 'Copenhagen', o: ['Aarhus', 'Odense', 'Aalborg'] },
    { q: 'Which is the most abundant metal in Earth\'s crust?', a: 'Aluminum', o: ['Iron', 'Magnesium', 'Titanium'] },
    { q: 'How many rings are on the Olympic flag?', a: '5', o: ['4', '6', '7'] },
    { q: 'What is the capital of Switzerland?', a: 'Bern', o: ['Zurich', 'Geneva', 'Basel'] },
    { q: 'Which is the largest bird in the world?', a: 'Ostrich', o: ['Emu', 'Albatross', 'Penguin'] },
    { q: 'What is the capital of Austria?', a: 'Vienna', o: ['Salzburg', 'Innsbruck', 'Graz'] },
    { q: 'Which is the most popular sport in the world?', a: 'Soccer', o: ['Cricket', 'Basketball', 'Tennis'] },
    { q: 'How many players are on a basketball team on the court?', a: '5', o: ['6', '7', '4'] },
    { q: 'What is the capital of Belgium?', a: 'Brussels', o: ['Antwerp', 'Ghent', 'Bruges'] },
    { q: 'Which is the largest sea in the world?', a: 'Philippine Sea', o: ['Coral Sea', 'Arabian Sea', 'South China Sea'] },
    { q: 'What is the capital of Netherlands?', a: 'Amsterdam', o: ['Rotterdam', 'The Hague', 'Utrecht'] },
    { q: 'Which is the most populated city in the world?', a: 'Tokyo', o: ['Delhi', 'Shanghai', 'Sao Paulo'] },
    { q: 'How many colors are in the Italian flag?', a: '3', o: ['2', '4', '5'] },
    { q: 'What is the capital of Poland?', a: 'Warsaw', o: ['Kraków', 'Łódź', 'Wrocław'] },
    { q: 'Which is the largest lake in Africa?', a: 'Victoria', o: ['Tanganyika', 'Malawi', 'Chad'] },
    { q: 'What is the capital of Ireland?', a: 'Dublin', o: ['Cork', 'Galway', 'Limerick'] },
    { q: 'Which is the most famous desert in Asia?', a: 'Gobi', o: ['Thar', 'Karakum', 'Taklamakan'] },
    { q: 'How many sides does a pentagon have?', a: '5', o: ['4', '6', '7'] },
    { q: 'What is the capital of New Zealand?', a: 'Wellington', o: ['Auckland', 'Christchurch', 'Dunedin'] },
    { q: 'Which is the largest reef system?', a: 'Great Barrier Reef', o: ['Belize Barrier Reef', 'New Caledonia Barrier Reef', 'Andros Barrier Reef'] },
    { q: 'What is the capital of Singapore?', a: 'Singapore', o: ['Kuala Lumpur', 'Jakarta', 'Bangkok'] },
    { q: 'Which is the most expensive spice?', a: 'Saffron', o: ['Vanilla', 'Cardamom', 'Cinnamon'] },
    { q: 'How many states are in India?', a: '28', o: ['29', '27', '30'] },
    { q: 'What is the capital of Malaysia?', a: 'Kuala Lumpur', o: ['Putrajaya', 'George Town', 'Johor Bahru'] },
    { q: 'Which is the largest canyon in the world?', a: 'Grand Canyon', o: ['Copper Canyon', 'Fish River Canyon', 'Colca Canyon'] },
    { q: 'What is the capital of Philippines?', a: 'Manila', o: ['Quezon City', 'Davao City', 'Cebu City'] },
    { q: 'Which is the most active volcano?', a: 'Kilauea', o: ['Etna', 'Stromboli', 'Yasur'] },
    { q: 'How many bones are in a shark?', a: '0', o: ['10', '50', '100'] },
    { q: 'What is the capital of Pakistan?', a: 'Islamabad', o: ['Karachi', 'Lahore', 'Faisalabad'] },
    { q: 'Which is the largest cat species?', a: 'Tiger', o: ['Lion', 'Leopard', 'Jaguar'] },
    { q: 'What is the capital of Bangladesh?', a: 'Dhaka', o: ['Chittagong', 'Khulna', 'Rajshahi'] },
    { q: 'Which is the most common element in Earth\'s atmosphere?', a: 'Nitrogen', o: ['Oxygen', 'Argon', 'CO2'] },
    { q: 'How many legs does a butterfly have?', a: '6', o: ['4', '8', '2'] },
    { q: 'What is the capital of Nigeria?', a: 'Abuja', o: ['Lagos', 'Kano', 'Ibadan'] },
    { q: 'Which is the largest moon of Jupiter?', a: 'Ganymede', o: ['Callisto', 'Io', 'Europa'] },
    { q: 'What is the capital of Kenya?', a: 'Nairobi', o: ['Mombasa', 'Kisumu', 'Nakuru'] },
    { q: 'Which is the most famous ship that sank?', a: 'Titanic', o: ['Lusitania', 'Bismarck', 'Endurance'] },
    { q: 'How many players are on a volleyball team on the court?', a: '6', o: ['5', '7', '4'] },
    { q: 'What is the capital of Ethiopia?', a: 'Addis Ababa', o: ['Dire Dawa', 'Mekelle', 'Gondar'] },
    { q: 'Which is the largest rodent in the world?', a: 'Capybara', o: ['Beaver', 'Porcupine', 'Nutria'] },
  ];

  const generateRound = useCallback(() => {
    let item, key;
    let attempts = 0;

    do {
      item = data[Math.floor(Math.random() * data.length)];
      key = item.q;
      attempts++;
    } while (isInHistory(key) && attempts < 200);

    addToHistory(key);
    const shuffledOptions = [item.a, ...item.o].sort(() => Math.random() - 0.5);
    setProblem({ question: item.q, answer: item.a });
    setOptions(shuffledOptions);
  }, [isInHistory, addToHistory]);

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
    setTimeLeft(30);
    setGameState('playing');
    clearHistory();
    generateRound();
  };

  const handleAnswer = (selected: string) => {
    if (selected === problem.answer) {
      setScore(prev => prev + 1);
      generateRound();
    } else {
      generateRound();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
      {gameState === 'start' && (
        <div className="text-center">
          <Hash size={64} className="mx-auto mb-6 text-pink-400" />
          <h2 className="text-3xl font-bold mb-4">Guess Ans</h2>
          <p className="text-white/60 mb-8">Quickly guess the correct answer from 4 options!</p>
          <button onClick={startGame} className="btn-neon px-8 py-3">Start Game</button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full">
          <div className="flex justify-between items-center mb-12">
            <div className="text-pink-400 font-mono text-2xl">Time: {timeLeft}s</div>
            <div className="text-emerald-400 font-mono text-2xl">Score: {score}</div>
          </div>

          <motion.div 
            key={problem.question}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-bold text-center mb-12"
          >
            {problem.question}
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            {options.map((opt, idx) => (
              <button key={idx} onClick={() => handleAnswer(opt)} className="glass-card p-6 text-lg font-bold hover:neon-border transition-all">
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'end' && (
        <div className="text-center">
          <Trophy size={80} className="mx-auto mb-6 text-yellow-400" />
          <h2 className="text-4xl font-bold mb-4">Time's Up!</h2>
          <p className="text-xl text-white/60 mb-8">Score: <span className="text-white font-bold">{score}</span></p>
          <button onClick={startGame} className="btn-neon px-8 py-3">Play Again</button>
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
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const handleGameSelect = (gameId: string) => {
    if (gameId === 'snake-io') {
      navigate('/play-snake');
    } else {
      setSelectedGame(gameId);
    }
  };

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
      case 'guess-ans': return <GuessAns />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-transparent text-white">
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
                    onClick={() => handleGameSelect(game.id)}
                  >
                    <div className="glass-card p-8 h-full relative overflow-hidden group-hover:neon-border transition-all">
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.color} opacity-5 blur-3xl group-hover:opacity-20 transition-opacity`}></div>
                      
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-6 shadow-lg`}>
                        {React.createElement(game.icon, { className: "text-white w-7 h-7" } as any)}
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
