import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Heart, Send, Trash2, CornerDownRight, 
  User, X, MessageCircle, Info, AlertCircle, ThumbsUp, Plus,
  Globe, Lock, Shield, Search, ChevronRight
} from 'lucide-react';
import { 
  collection, addDoc, onSnapshot, query, orderBy, 
  serverTimestamp, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove,
  where, getDocs
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import UserName from '../components/UserName';

interface Group {
  id: string;
  name: string;
  description?: string;
  password?: string;
  enabled: boolean;
}

interface SiteComment {
  id: string;
  userName: string;
  userUid?: string;
  userEmail?: string;
  userPhotoURL?: string;
  text: string;
  likes: number;
  likedBy: string[];
  parentId?: string;
  groupId?: string;
  createdAt: any;
}

export default function LiveComments() {
  const [comments, setComments] = useState<SiteComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(true);
  const [replyTo, setReplyTo] = useState<SiteComment | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('public');
  const [groupPassword, setGroupPassword] = useState('');
  const [isGroupLocked, setIsGroupLocked] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [unlockedGroups, setUnlockedGroups] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch groups
    const unsubscribeGroups = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
      setGroups([{ id: 'public', name: 'Public Chat', enabled: true }, ...data.filter(g => g.enabled !== false)]);
    });

    return () => unsubscribeGroups();
  }, []);

  useEffect(() => {
    const group = groups.find(g => g.id === selectedGroupId);
    if (group?.password && !unlockedGroups.includes(selectedGroupId) && selectedGroupId !== 'public') {
      setIsGroupLocked(true);
    } else {
      setIsGroupLocked(false);
    }
  }, [selectedGroupId, groups, unlockedGroups]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      const isSpecial = localStorage.getItem('isSpecialLogin') === 'true';
      const isAdminLogin = localStorage.getItem('isAdminLogin') === 'true';
      const specialName = localStorage.getItem('studentName') || 'Vijay Admin';

      if (user) {
        setIsGuest(false);
        unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setUserProfile(data);
            setIsAdmin(data.role === 'admin');
          } else if (isSpecial && isAdminLogin) {
            // Fallback if profile not created yet but we have special flags
            setUserProfile({
              uid: user.uid,
              name: specialName,
              role: 'admin',
              photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay'
            });
            setIsAdmin(true);
          }
        }, (error) => handleFirestoreError(error, OperationType.GET, `users/${user.uid}`));
      } else if (isSpecial) {
        setIsGuest(false);
        setIsAdmin(isAdminLogin);
        setUserProfile({
          uid: isAdminLogin ? 'special-admin-vijay' : 'special-vijay-admin',
          name: specialName,
          role: isAdminLogin ? 'admin' : 'student',
          photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vijay'
        });
      } else {
        setIsGuest(true);
        setUserProfile(null);
        setIsAdmin(false);
      }
    });

    const q = query(
      collection(db, 'siteComments'), 
      where('groupId', '==', selectedGroupId),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeComments = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SiteComment));
      setComments(data);
    }, (error) => {
      // Fallback for missing index or other errors
      if (error.message?.includes('index')) {
        console.warn("Firestore index required for groupId filtering. Falling back to client-side filtering.");
        const qAll = query(collection(db, 'siteComments'), orderBy('createdAt', 'asc'));
        return onSnapshot(qAll, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SiteComment));
          setComments(data.filter(c => (c.groupId || 'public') === selectedGroupId));
        });
      }
      handleFirestoreError(error, OperationType.GET, 'siteComments');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeComments();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [selectedGroupId]);

  const handleJoinGroup = () => {
    const group = groups.find(g => g.id === selectedGroupId);
    if (group?.password === groupPassword) {
      setUnlockedGroups(prev => [...prev, selectedGroupId]);
      setIsGroupLocked(false);
      setGroupPassword('');
    } else {
      alert("Incorrect password");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGuest || !newComment.trim() || !userProfile?.name || isGroupLocked || isSending) return;

    const commentText = newComment.trim();
    setNewComment('');
    setReplyTo(null);
    setIsSending(true);

    const commentData: any = {
      userName: userProfile.name,
      userEmail: auth.currentUser?.email || userProfile.email || '',
      userPhotoURL: auth.currentUser?.photoURL || userProfile.photoURL || '',
      userUid: auth.currentUser?.uid || userProfile.uid,
      text: commentText,
      likes: 0,
      likedBy: [],
      groupId: selectedGroupId,
      createdAt: serverTimestamp()
    };
    
    if (replyTo?.id) {
      commentData.parentId = replyTo.id;
    }

    try {
      await addDoc(collection(db, 'siteComments'), commentData);
    } catch (error) {
      setNewComment(commentText); // Restore if failed
      handleFirestoreError(error, OperationType.CREATE, 'siteComments');
    } finally {
      setIsSending(false);
    }
  };

  const handleLike = async (comment: SiteComment) => {
    if (isGuest) {
      alert("Please login to like comments");
      return;
    }
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
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
    if (!isAdmin) return;
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl sm:text-7xl font-display font-bold uppercase tracking-tighter mb-4"
          >
            Community <span className="text-neon-blue">Live Club</span>
          </motion.h1>
          <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">
            Join a group and share your thoughts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Groups */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                <Globe size={14} />
                Discussion Groups
              </h2>
              <div className="space-y-2">
                {groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${selectedGroupId === group.id ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'bg-white/5 border-white/5 text-white/60 hover:border-white/20'}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedGroupId === group.id ? 'bg-neon-blue text-black' : 'bg-white/5 text-white/40'}`}>
                        {group.id === 'public' ? <MessageSquare size={16} /> : <Shield size={16} />}
                      </div>
                      <span className="text-sm font-medium truncate">{group.name}</span>
                    </div>
                    {group.password && (
                      <Lock size={12} className={selectedGroupId === group.id ? 'text-neon-blue' : 'text-white/20'} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="lg:col-span-3">
            {isGroupLocked ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-20 h-20 rounded-3xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 mb-6">
                  <Lock size={40} />
                </div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">Private Group</h2>
                <p className="text-white/40 text-sm mb-8 max-w-xs">This group is password protected. Please enter the password to join the conversation.</p>
                
                <div className="w-full max-w-xs space-y-4">
                  <input 
                    type="password" 
                    placeholder="Enter group password"
                    value={groupPassword}
                    onChange={(e) => setGroupPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinGroup()}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-center focus:border-yellow-400 outline-none transition-all"
                  />
                  <button 
                    onClick={handleJoinGroup}
                    className="btn-neon bg-yellow-400 text-black w-full py-3 uppercase tracking-widest font-bold"
                  >
                    Join Group
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue">
                      {selectedGroupId === 'public' ? <MessageSquare size={20} /> : <Shield size={20} />}
                    </div>
                    <div>
                      <h3 className="text-white font-bold">{groups.find(g => g.id === selectedGroupId)?.name}</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">{comments.length} Messages</p>
                    </div>
                  </div>
                </div>

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
                        currentUserId={auth.currentUser?.uid || ''}
                        isGuest={isGuest}
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
                              currentUserId={auth.currentUser?.uid || ''}
                              isGuest={isGuest}
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
                <div className="relative pt-12">
                  <AnimatePresence>
                    {replyTo && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-full left-0 right-0 mb-4 bg-neon-blue/10 border border-neon-blue/20 p-3 rounded-xl flex items-center justify-between z-10"
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

                  {isGuest ? (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
                      <p className="text-gray-400 font-mono text-sm uppercase tracking-widest mb-4">You must be logged in to post messages</p>
                      <button 
                        onClick={() => window.location.href = '/login'}
                        className="btn-neon px-8 py-3 uppercase tracking-wider"
                      >
                        Login to Chat
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="flex gap-4">
                      <div className="flex-grow relative">
                        <textarea 
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder={`Posting to ${groups.find(g => g.id === selectedGroupId)?.name}...`}
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
                        className="btn-neon p-4 sm:px-8 flex items-center gap-2"
                      >
                        <Send size={20} />
                        <span className="hidden sm:inline uppercase tracking-wider">Post</span>
                      </button>
                    </form>
                  )}
                  
                  {!isGuest && (
                    <div className="mt-4 flex justify-end items-center px-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-mono uppercase">
                        <Info size={12} />
                        <span>Be respectful to others</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: SiteComment;
  onLike: () => void;
  onReply?: () => void;
  onDelete: () => void;
  isAdmin: boolean;
  isReply?: boolean;
  currentUserId: string;
  isGuest: boolean;
}

function CommentItem({ 
  comment, 
  onLike, 
  onReply, 
  onDelete, 
  isAdmin, 
  isReply = false,
  currentUserId,
  isGuest
}: CommentItemProps) {
  const isLiked = comment.likedBy?.includes(currentUserId);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`group relative ${isReply ? 'bg-transparent' : 'bg-zinc-800/30 p-4 sm:p-6 rounded-2xl border border-zinc-800/50'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-3">
          <UserName 
            userUid={comment.userUid || ''} 
            fallback={comment.userName} 
            fallbackPhoto={comment.userPhotoURL}
            showPhoto={true}
            photoClassName={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold ${isReply ? 'bg-zinc-800' : 'bg-neon-blue/20 text-neon-blue'}`}
            className="font-bold text-sm sm:text-base"
          />
          {isAdmin && (
            <span className="text-[10px] sm:text-xs text-gray-500 ml-2 font-mono">
              {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
            </span>
          )}
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
        
        {!isReply && onReply && !isGuest && (
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
