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
  isImportant: boolean;
  enabled: boolean;
}

export interface Subject {
  id: string;
  classId: string;
  name: string;
  enabled: boolean;
}

export interface Class {
  id: string;
  name: string;
  enabled: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'student';
  name?: string;
  photoURL?: string;
  createdAt: any;
}
