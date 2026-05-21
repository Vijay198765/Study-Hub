import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { convertDriveUrl } from '../lib/utils';
import { Class, Subject, Chapter, User, Test, TestResult, Folder } from '../types';

// Helper to remove undefined fields recursively and prevent circularity
const cleanData = (data: any, seen = new WeakSet()) => {
  if (data === null || typeof data !== 'object') return data;
  
  if (seen.has(data)) return undefined; // Avoid circularity
  seen.add(data);

  if (Array.isArray(data)) {
    return data.map(item => cleanData(item, seen)).filter(item => item !== undefined);
  }

  const clean: any = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value !== undefined) {
      // Basic circularity check for specific firebase/internal objects
      if (value && typeof value === 'object' && ('_firestore' in value || 'firestore' in value || 'nodeType' in value)) {
        return; // Skip these
      }
      const cleanedValue = cleanData(value, seen);
      if (cleanedValue !== undefined) {
        clean[key] = cleanedValue;
      }
    }
  });
  return clean;
};

// Tests
export const getTests = (callback: (tests: Test[]) => void) => {
  const path = 'tests';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => doc.data() as Test));
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const saveTest = async (test: Test) => {
  const path = `tests/${test.id}`;
  try {
    await setDoc(doc(db, 'tests', test.id), cleanData(test));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const removeTest = async (id: string) => {
  const path = `tests/${id}`;
  try {
    await deleteDoc(doc(db, 'tests', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Test Results
export const getTestResults = (testId: string, callback: (results: TestResult[]) => void) => {
  const path = 'testResults';
  // Order by score descending. Note: This may require a composite index in Firestore.
  // We'll also sort client-side in the callback to ensure correctness.
  const q = query(collection(db, path), where('testId', '==', testId));
  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestResult));
    const sorted = results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const timeA = a.completedAt?.toMillis?.() || a.completedAt?.getTime?.() || 0;
      const timeB = b.completedAt?.toMillis?.() || b.completedAt?.getTime?.() || 0;
      return timeB - timeA;
    });
    callback(sorted);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const getGlobalLeaderboard = (callback: (results: TestResult[]) => void) => {
  const path = 'testResults';
  const q = query(collection(db, path), orderBy('score', 'desc'), limit(20));
  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestResult));
    // Ensure strict sorting client-side as well
    const sorted = results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const timeA = a.completedAt?.toMillis?.() || a.completedAt?.getTime?.() || 0;
      const timeB = b.completedAt?.toMillis?.() || b.completedAt?.getTime?.() || 0;
      return timeB - timeA;
    });
    callback(sorted.slice(0, 10));
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

// Classes
export const getClasses = (callback: (classes: Class[]) => void) => {
  const path = 'classes';
  console.log("dataService: Fetching classes from path:", path);
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    console.log(`dataService: Received ${snapshot.size} classes`);
    const classes = snapshot.docs.map(doc => doc.data() as Class);
    // Fallback to name if order is missing
    const sorted = classes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
    callback(sorted);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const saveClass = async (cls: Class) => {
  const path = `classes/${cls.id}`;
  try {
    await setDoc(doc(db, 'classes', cls.id), cleanData(cls));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const removeClass = async (id: string) => {
  const path = `classes/${id}`;
  try {
    await deleteDoc(doc(db, 'classes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Subjects
export const getSubjectsByClass = (classId: string, callback: (subjects: Subject[]) => void) => {
  const path = 'subjects';
  const q = query(collection(db, path), where('classId', '==', classId));
  return onSnapshot(q, (snapshot) => {
    const subjects = snapshot.docs.map(doc => doc.data() as Subject);
    const sorted = subjects.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
    callback(sorted);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const saveSubject = async (subject: Subject) => {
  const path = `subjects/${subject.id}`;
  try {
    await setDoc(doc(db, 'subjects', subject.id), cleanData(subject));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const removeSubject = async (id: string) => {
  const path = `subjects/${id}`;
  try {
    await deleteDoc(doc(db, 'subjects', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Chapters
export const getChaptersBySubject = (subjectId: string, callback: (chapters: Chapter[]) => void) => {
  const path = 'chapters';
  const q = query(collection(db, path), where('subjectId', '==', subjectId));
  return onSnapshot(q, (snapshot) => {
    const chapters = snapshot.docs.map(doc => doc.data() as Chapter);
    const sorted = chapters.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
    callback(sorted);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const saveChapter = async (chapter: Chapter) => {
  const path = `chapters/${chapter.id}`;
  try {
    await setDoc(doc(db, 'chapters', chapter.id), cleanData(chapter));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const removeChapter = async (id: string) => {
  const path = `chapters/${id}`;
  try {
    await deleteDoc(doc(db, 'chapters', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Folders
export const getFolders = (callback: (folders: Folder[]) => void) => {
  const path = 'folders';
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const folders = snapshot.docs.map(doc => doc.data() as Folder);
    const sorted = folders.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
    callback(sorted);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const getFoldersByParent = (parentId: string | null, contextId: { chapterId?: string, subjectId?: string, classId?: string }, callback: (folders: Folder[]) => void) => {
  const path = 'folders';
  let q = query(collection(db, path));
  
  if (parentId) {
    q = query(q, where('parentId', '==', parentId));
  } else {
    // If no parent, it must be a root folder for a specific context
    if (contextId.chapterId) q = query(q, where('chapterId', '==', contextId.chapterId), where('parentId', '==', null));
    else if (contextId.subjectId) q = query(q, where('subjectId', '==', contextId.subjectId), where('parentId', '==', null));
    else if (contextId.classId) q = query(q, where('classId', '==', contextId.classId), where('parentId', '==', null));
  }
  
  return onSnapshot(q, (snapshot) => {
    const folders = snapshot.docs.map(doc => doc.data() as Folder);
    const sorted = folders.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
    callback(sorted);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const saveFolder = async (folder: Folder) => {
  const path = `folders/${folder.id}`;
  try {
    await setDoc(doc(db, 'folders', folder.id), cleanData(folder));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const removeFolder = async (id: string) => {
  const path = `folders/${id}`;
  try {
    await deleteDoc(doc(db, 'folders', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Users
export const getUsers = (callback: (users: User[]) => void) => {
  const path = 'users';
  return onSnapshot(collection(db, path), (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data() as User);
    callback(users);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const saveUser = async (user: User) => {
  // If anonymous or has Special Student name/email, do not save it
  if (user.email?.toLowerCase() === 'anonymous@studyhub.com' || user.name === 'Special Student') {
    console.log("Skipping saving special student/anonymous profile to Firestore.");
    return;
  }

  const path = `users/${user.uid}`;
  
  // Sanitize photo URL if it's a Drive link
  if (user.photoURL) {
    user.photoURL = convertDriveUrl(user.photoURL);
  }

  // Specific constraint for tagged email
  if (user.email?.toLowerCase() === 'tagoreteam2025@gmail.com') {
    user.name = 'Hania Aamir';
  }

  try {
    await setDoc(doc(db, 'users', user.uid), cleanData(user));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const purgeSpecialStudentDocs = async () => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', 'anonymous@studyhub.com'));
  try {
    const snap = await getDocs(q);
    const promises = snap.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(promises);
    console.log(`Programmatic cleanup: purged ${snap.size} registered anonymous@studyhub.com user profiles.`);
  } catch (error) {
    console.error("Failed to programmatically purge special student users:", error);
  }
};

export const removeUser = async (uid: string) => {
  const path = `users/${uid}`;
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const saveTestResult = async (result: TestResult) => {
  const path = `testResults/${result.id}`;
  try {
    await setDoc(doc(db, 'testResults', result.id), cleanData(result));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const saveSiteComment = async (comment: any) => {
  const path = `siteComments/${comment.id}`;
  try {
    await setDoc(doc(db, 'siteComments', comment.id), cleanData(comment));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
