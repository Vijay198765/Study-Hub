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
  isSecret?: boolean;
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
  siteName?: string;
  adminName?: string;
  coOwnerName?: string;
  siteSubtitle?: string;
  announcementText?: string;
  showAnnouncement?: boolean;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  autoApproveUsers?: boolean;
  defaultThemeMode?: 'light' | 'dark' | 'auto';
  ipLockdownEnabled?: boolean;
  showNewBadge?: boolean;
  testTimeMultiplier?: number;
  termsUrl?: string;
  privacyUrl?: string;
  searchEnabled?: boolean;
  gamesEnabled?: boolean;
  liveClubEnabled?: boolean;
  bgEffect?: 'none' | 'snow' | 'confetti' | 'stars';
  secretLoginEnabled?: boolean;
  showSecretLoginEntry?: boolean;
  showDashboardLinkForSecret?: boolean;
  secretLoginKey?: string;
  secretProfiles?: SecretProfile[];
  limitedAdminTabs?: string[];
  adminUnlockKey?: string;
  supportWhatsApp?: string;
  supportTelegram?: string;
  supportEmail?: string;
  welcomeEmailSender?: string;
  emailjsServiceId?: string;
  emailjsTemplateId?: string;
  emailjsPublicKey?: string;
  logoUrl?: string;
  faviconUrl?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  showFooterCredit?: boolean;
  leaderboardVisible?: boolean;
  registrationEnabled?: boolean;
  notificationDuration?: number; // In seconds
  watermarkText?: string;
  watermarkEnabled?: boolean;
  bannedIps?: string[];
  studyTimerEnabled?: boolean;
  globalLeaderboardEnabled?: boolean;
  guestModeEnabled?: boolean;
  customFooterText?: string;
  announcementColor?: string;
  verifyUserEmail?: boolean;
  lastUpdated?: any;
}

export interface UserMessage {
  id: string;
  userId: string;
  message: string;
  duration: number; // Seconds to show
  showCount: number; // Remaining times to show after refresh
  createdAt: any;
}

export interface SecretProfile {
  id: string;
  label: string;
  key: string;
  password?: string;
  enabled?: boolean;
  showDashboardLink?: boolean;
  allowedTabs: string[];
}

export interface News {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  url?: string;
  createdAt: any;
  createdBy: string;
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
