import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Heart, Send, Trash2, CornerDownRight, 
  User, X, MessageCircle, Info, AlertCircle, ThumbsUp
} from 'lucide-react';
import { 
  collection, addDoc, onSnapshot, query, orderBy, 
  serverTimestamp, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

interface SiteComment {
  id: string;
  userName: string;
  text: string;
  likes: number;
  likedBy: string[];
  parentId?: string;
  createdAt: any;
}

export default function LiveComments() {
  const [comments, setComments] = useState<SiteComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userName, setUserName] = useState<string>(localStorage.getItem('site_user_name') || '');
  const [showNamePrompt, setShowNamePrompt] = useState(!localStorage.getItem('site_user_name'));
  const [tempName, setTempName] = useState('');
  const [replyTo, setReplyTo] = useState<SiteComment | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check admin status
    if (auth.currentUser?.email === 'vijayninama683@gmail.com') {
      setIsAdmin(true);
    }

    const q = query(collection(db, 'siteComments'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SiteComment));
      setComments(data);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSetName = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setUserName(tempName.trim());
      localStorage.setItem('site_user_name', tempName.trim());
      setShowNamePrompt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !userName) return;

    const commentData: any = {
      userName,
      text: newComment.trim(),
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp()
    };
    
    if (replyTo?.id) {
      commentData.parentId = replyTo.id;
    }

    try {
      await addDoc(collection(db, 'siteComments'), commentData);
      setNewComment('');
      setReplyTo(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'siteComments');
    }
  };

  const handleLike = async (comment: SiteComment) => {
    const userId = auth.currentUser?.uid || 'anonymous_' + userName;
    const isLiked = comment.likedBy?.includes(userId);

    try {
      const commentRef = doc(db, 'siteComments', comment.id);
      if (isLiked) {
        await updateDoc(commentRef, {
          likes: (comment.likes || 1) - 1,
          likedBy: arrayRemove(userId)
        });
      } else {
        await updateDoc(commentRef, {
          likes: (comment.likes || 0) + 1,
          likedBy: arrayUnion(userId)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `siteComments/${comment.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await deleteDoc(doc(db, 'siteComments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `siteComments/${id}`);
    }
  };

  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-black text-white font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl sm:text-7xl font-display font-bold uppercase tracking-tighter mb-4"
          >
            Live <span className="text-neon-blue">Wall</span>
          </motion.h1>
          <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">
            Share your thoughts about the platform
          </p>
        </div>

        {/* Name Prompt Overlay */}
        <AnimatePresence>
          {showNamePrompt && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-6 text-neon-blue">
                  <User size={32} />
                  <h2 className="text-2xl font-display font-bold uppercase">Who are you?</h2>
                </div>
                <p className="text-gray-400 mb-6 font-mono text-sm">
                  Please enter your name to join the conversation.
                </p>
                <form onSubmit={handleSetName} className="space-y-4">
                  <input 
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-blue transition-colors"
                    autoFocus
                  />
                  <button 
                    type="submit"
                    className="w-full bg-neon-blue text-black font-bold py-3 rounded-xl hover:bg-neon-blue/90 transition-colors uppercase tracking-wider"
                  >
                    Enter Wall
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments Area */}
        <div 
          ref={scrollRef}
          className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 sm:p-8 mb-8 min-h-[500px] max-h-[600px] overflow-y-auto custom-scrollbar"
        >
          {rootComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
              <MessageCircle size={48} className="opacity-20" />
              <p className="font-mono text-sm uppercase tracking-widest">No comments yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {rootComments.map((comment: SiteComment) => (
                  <div key={comment.id} className="space-y-4">
                    <CommentItem 
                      comment={comment} 
                      onLike={() => handleLike(comment)}
                      onReply={() => setReplyTo(comment)}
                      onDelete={() => handleDelete(comment.id)}
                      isAdmin={isAdmin}
                      currentUserId={auth.currentUser?.uid || 'anonymous_' + userName}
                    />
                    
                    {/* Replies */}
                    <div className="ml-8 sm:ml-12 space-y-4 border-l border-zinc-800 pl-4 sm:pl-8">
                      {getReplies(comment.id).map((reply: SiteComment) => (
                        <div key={reply.id}>
                          <CommentItem 
                            comment={reply}
                            onLike={() => handleLike(reply)}
                            onDelete={() => handleDelete(reply.id)}
                            isAdmin={isAdmin}
                            isReply={true}
                            currentUserId={auth.currentUser?.uid || 'anonymous_' + userName}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="relative">
          <AnimatePresence>
            {replyTo && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-0 right-0 mb-4 bg-neon-blue/10 border border-neon-blue/20 p-3 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-neon-blue text-sm font-medium">
                  <CornerDownRight size={16} />
                  <span>Replying to <span className="font-bold">{replyTo.userName}</span></span>
                </div>
                <button 
                  onClick={() => setReplyTo(null)}
                  className="text-neon-blue hover:bg-neon-blue/20 p-1 rounded-md transition-colors"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex-grow relative">
              <textarea 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={userName ? `Posting as ${userName}...` : "Write a comment..."}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-neon-blue transition-all resize-none h-16 sm:h-20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            <button 
              type="submit"
              disabled={!newComment.trim()}
              className="bg-neon-blue text-black p-4 sm:px-8 rounded-2xl font-bold hover:bg-neon-blue/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={20} />
              <span className="hidden sm:inline uppercase tracking-wider">Post</span>
            </button>
          </form>
          <div className="mt-4 flex justify-between items-center px-2">
            <button 
              onClick={() => setShowNamePrompt(true)}
              className="text-xs text-gray-500 hover:text-neon-blue transition-colors font-mono uppercase"
            >
              Change Name ({userName})
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono uppercase">
              <Info size={12} />
              <span>Be respectful to others</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ 
  comment, 
  onLike, 
  onReply, 
  onDelete, 
  isAdmin, 
  isReply = false,
  currentUserId
}: { 
  comment: SiteComment; 
  onLike: () => void | Promise<void>; 
  onReply?: () => void | Promise<void>; 
  onDelete: () => void | Promise<void>; 
  isAdmin: boolean;
  isReply?: boolean;
  currentUserId: string;
}) {
  const isLiked = comment.likedBy?.includes(currentUserId);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group relative ${isReply ? 'bg-transparent' : 'bg-zinc-800/30 p-4 sm:p-6 rounded-2xl border border-zinc-800/50'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isReply ? 'bg-zinc-800' : 'bg-neon-blue/20 text-neon-blue'}`}>
            {comment.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-sm sm:text-base">{comment.userName}</span>
            <span className="text-[10px] sm:text-xs text-gray-500 ml-2 font-mono">
              {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
            </span>
          </div>
        </div>
        {isAdmin && (
          <button 
            onClick={onDelete}
            className="text-gray-600 hover:text-red-500 transition-colors p-1"
            title="Delete abusive comment"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      
      <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-4">
        {comment.text}
      </p>

      <div className="flex items-center gap-4">
        <button 
          onClick={onLike}
          className={`flex items-center gap-1.5 text-xs font-bold transition-all ${isLiked ? 'text-neon-blue' : 'text-gray-500 hover:text-white'}`}
        >
          <ThumbsUp size={14} className={isLiked ? 'fill-neon-blue' : ''} />
          <span>{comment.likes || 0}</span>
        </button>
        
        {!isReply && onReply && (
          <button 
            onClick={onReply}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-neon-blue transition-all"
          >
            <MessageSquare size={14} />
            <span>Reply</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
