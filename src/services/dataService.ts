import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Class, Subject, Chapter } from '../types';

// Classes
export const getClasses = (callback: (classes: Class[]) => void) => {
  const path = 'classes';
  const q = query(collection(db, path), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const classes = snapshot.docs.map(doc => doc.data() as Class);
    callback(classes);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const saveClass = async (cls: Class) => {
  const path = `classes/${cls.id}`;
  try {
    await setDoc(doc(db, 'classes', cls.id), cls);
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
  const q = query(collection(db, path), where('classId', '==', classId), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const subjects = snapshot.docs.map(doc => doc.data() as Subject);
    callback(subjects);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const saveSubject = async (subject: Subject) => {
  const path = `subjects/${subject.id}`;
  try {
    await setDoc(doc(db, 'subjects', subject.id), subject);
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
  const q = query(collection(db, path), where('subjectId', '==', subjectId), orderBy('name'));
  return onSnapshot(q, (snapshot) => {
    const chapters = snapshot.docs.map(doc => doc.data() as Chapter);
    callback(chapters);
  }, (error) => handleFirestoreError(error, OperationType.GET, path));
};

export const saveChapter = async (chapter: Chapter) => {
  const path = `chapters/${chapter.id}`;
  try {
    await setDoc(doc(db, 'chapters', chapter.id), chapter);
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
