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
  isLegend?: boolean;
  secretLoginLogged?: boolean;
  totalTimeSpent?: number; // in minutes
  lastActive?: any;
  ip?: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    ip?: string;
  };
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  action: string;
  path?: string;
  ip?: string;
  resolution?: string;
  userAgent?: string;
  timestamp: any;
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
  studentUid?: string;
  studentEmail?: string;
  studentPhotoURL?: string;
  score: number;
  total: number;
  completedAt: any;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  password?: string;
  createdAt: any;
  createdBy: string;
}

export interface Rating {
  id: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  studentPhotoURL?: string;
  score: number; // 1-10
  comment?: string;
  createdAt: any;
}

export interface SiteConfig {
  id: string;
  isRatingEnabled: boolean;
  ratingQuestion?: string;
  ratingOptions?: string[]; // Custom options for rating
  welcomeEmailTemplate: string;
  welcomeEmailSubject: string;
  announcement?: string;
  isAnnouncementActive?: boolean;
  lastUpdated: any;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  url?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: any;
  createdBy: string;
  expiresAt?: any;
}
