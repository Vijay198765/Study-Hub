import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { convertDriveUrl } from '../lib/utils';
import { Class, Subject, Chapter, User, Test, TestResult } from '../types';

// Helper to remove undefined fields before saving to Firestore
const cleanData = (data: any) => {
  const clean: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      clean[key] = data[key];
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

// Users
export const getUsers = (callback: (users: User[]) => void) => {
  const path = 'users';
  return onSnapshot(collection(db, path), (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data() as User);
    callback(users);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const saveUser = async (user: User) => {
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
