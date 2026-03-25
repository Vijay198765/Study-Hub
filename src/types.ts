export type ResourceType = 'notes' | 'pdf' | 'qa' | 'practice' | 'test';

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  url: string;
  enabled: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  classId: string;
  name: string;
  resources: Resource[];
  quiz: QuizQuestion[];
  quizEnabled: boolean;
  isImportant: boolean;
  enabled: boolean;
  order?: number;
}

export interface Subject {
  id: string;
  classId: string;
  name: string;
  enabled: boolean;
  order?: number;
}

export interface Class {
  id: string;
  name: string;
  enabled: boolean;
  order?: number;
}

export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'student';
  name?: string;
  photoURL?: string;
  createdAt: any;
}

export interface UserProfile extends User {}

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Test {
  id: string;
  classId: string;
  title: string;
  questions: TestQuestion[];
  active: boolean;
  createdAt: any;
}

export interface TestResult {
  id: string;
  testId: string;
  testTitle: string;
  studentName: string;
  studentEmail?: string;
  score: number;
  total: number;
  completedAt: any;
}
