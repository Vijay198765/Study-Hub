import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Send, Heart, Smile, Meh, Frown, Angry } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RatingModal({ isOpen, onClose }: RatingModalProps) {
  const [score, setScore] = useState<number>(10);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (!auth.currentUser) return;

      // Check if rating is enabled in config
      const configSnap = await getDoc(doc(db, 'config', 'site'));
      if (configSnap.exists() && configSnap.data().isRatingEnabled === false) {
        setIsEnabled(false);
        return;
      }

      // Check if user has already rated
      const q = query(
        collection(db, 'ratings'),
        where('studentUid', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setHasRated(true);
      }
    };

    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    try {
      const ratingData: any = {
        studentUid: auth.currentUser.uid,
        studentName: auth.currentUser.displayName || 'Anonymous',
        studentEmail: auth.currentUser.email || 'No Email',
        score,
        comment,
        createdAt: serverTimestamp()
      };

      if (auth.currentUser.photoURL) {
        ratingData.studentPhotoURL = auth.currentUser.photoURL;
      }

      await addDoc(collection(db, 'ratings'), ratingData);
      setHasRated(true);
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEmoji = (val: number, size: number = 48) => {
    if (val >= 9) return <Heart className="text-pink-500 fill-pink-500" size={size} />;
    if (val >= 7) return <Smile className="text-emerald-500" size={size} />;
    if (val >= 5) return <Meh className="text-yellow-500" size={size} />;
    if (val >= 3) return <Frown className="text-orange-500" size={size} />;
    return <Angry className="text-red-500" size={size} />;
  };

  const getLabel = (val: number) => {
    if (val >= 9) return "Excellent!";
    if (val >= 7) return "Good";
    if (val >= 5) return "Average";
    if (val >= 3) return "Poor";
    return "Terrible";
  };

  if (!isEnabled || hasRated) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm glass-card p-6 text-center overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"></div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/20 hover:text-white transition-all"
            >
              <X size={18} />
            </button>

            <div className="mb-4 flex justify-center">
              <motion.div
                key={score}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {getEmoji(score, 40)}
              </motion.div>
            </div>

            <h2 className="text-xl font-display font-bold text-white mb-1">Rate Your Experience</h2>
            <p className="text-white/40 text-xs mb-6">How would you rate Study-hub out of 10?</p>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/20">
                  <span>Sad</span>
                  <span className="text-neon-blue">{score}/10</span>
                  <span>Happy</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="1"
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                />
                <p className="text-base font-bold text-white uppercase tracking-tighter">{getLabel(score)}</p>
              </div>

              <div className="space-y-2">
                <textarea 
                  placeholder="Any suggestions? (Optional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-xs focus:border-neon-blue outline-none transition-all resize-none h-20"
                />
              </div>

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-neon w-full py-3 flex items-center justify-center gap-2 uppercase tracking-widest text-xs font-bold disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    Submit Rating
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
