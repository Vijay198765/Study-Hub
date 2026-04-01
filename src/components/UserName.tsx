import React, { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';

// Global cache and listeners to avoid redundant fetches across components
const userCache: { [uid: string]: { name: string; photoURL?: string } } = {};
const listeners: { [uid: string]: { 
  unsubscribe: () => void; 
  subscribers: Set<(data: { name: string; photoURL?: string }) => void>;
} } = {};

interface UserNameProps {
  userUid?: string;
  fallback?: string;
  fallbackPhoto?: string;
  className?: string;
  showPhoto?: boolean;
  photoClassName?: string;
}

export default function UserName({ 
  userUid, 
  fallback = "Student", 
  fallbackPhoto,
  className = "", 
  showPhoto = false,
  photoClassName = "w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
}: UserNameProps) {
  const [user, setUser] = useState<{ name: string; photoURL?: string } | null>(
    userUid ? userCache[userUid] || null : null
  );

  useEffect(() => {
    if (!userUid) return;

    const updateState = (data: { name: string; photoURL?: string }) => {
      setUser(data);
    };

    // If we already have a listener for this UID, just subscribe to updates
    if (listeners[userUid]) {
      listeners[userUid].subscribers.add(updateState);
      // If we already have cached data, set it immediately
      if (userCache[userUid]) {
        setUser(userCache[userUid]);
      }
    } else {
      // Create a new listener
      const subscribers = new Set<typeof updateState>();
      subscribers.add(updateState);
      
      // We can only listen to the current user's profile due to security rules
      // (PII protection prevents reading other users' documents)
      if (userUid === auth.currentUser?.uid) {
        const unsubscribe = onSnapshot(doc(db, 'users', userUid), (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const userData = { 
              name: data.name || fallback, 
              photoURL: data.photoURL || fallbackPhoto 
            };
            userCache[userUid] = userData;
            subscribers.forEach(sub => sub(userData));
          } else {
            const userData = { name: fallback, photoURL: fallbackPhoto };
            userCache[userUid] = userData;
            subscribers.forEach(sub => sub(userData));
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${userUid}`);
        });
        listeners[userUid] = { unsubscribe, subscribers };
      } else {
        // For other users, we rely on the fallback data provided via props
        const userData = { name: fallback, photoURL: fallbackPhoto };
        userCache[userUid] = userData;
        subscribers.forEach(sub => sub(userData));
        listeners[userUid] = { unsubscribe: () => {}, subscribers };
      }
    }

    return () => {
      if (userUid && listeners[userUid]) {
        listeners[userUid].subscribers.delete(updateState);
        // If no more subscribers, we could unsubscribe, but keeping it might be better for performance if they navigate back
        // For now, let's keep it to avoid flicker on re-mounts
      }
    };
  }, [userUid, fallback, fallbackPhoto]);

  const displayName = user?.name || fallback;
  const displayPhoto = user?.photoURL || fallbackPhoto;

  if (showPhoto) {
    return (
      <div className="flex items-center gap-3">
        <div className={photoClassName}>
          {displayPhoto ? (
            <img src={displayPhoto} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <span className={className}>{displayName}</span>
      </div>
    );
  }

  return <span className={className}>{displayName}</span>;
}
