import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit2, Trash2, GripVertical, Save, X, 
  ChevronRight, ChevronDown, Search, Users, 
  BookOpen, Layers, BarChart3, CheckCircle2, 
  AlertCircle, ExternalLink, FileText, HelpCircle,
  ArrowUp, ArrowDown, Info, Upload, RefreshCcw, Eye, Copy,
  MessageSquare, ClipboardList, Trophy, Palette, Layout, LayoutDashboard, Zap, Type, Download, LogOut, Lock, Unlock, UserPlus,
  Star, Shield, Globe, Bell, Settings, Clock, Gamepad2, Sun, Moon, CloudRain, Cloud, Smartphone, Crown, Fingerprint, ShieldAlert, Image
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { storage, db, auth, handleFirestoreError, OperationType } from '../firebase';
import { signOut } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
  collection, query, orderBy, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp, getDocs, setDoc, updateDoc, where 
} from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  getClasses, saveClass, removeClass, 
  getSubjectsByClass, saveSubject, removeSubject, 
  getChaptersBySubject, saveChapter, removeChapter, 
  getUsers, saveUser, removeUser,
  getTests, saveTest, removeTest,
  saveTestResult, saveSiteComment
} from '../services/dataService';
import { cn, convertDriveUrl } from '../lib/utils';
import { Class, Subject, Chapter, User, Resource, QuizQuestion, Test, TestQuestion, TestResult, ActivityLog, Notification, News, SiteConfig, SecretProfile } from '../types';
import { DEFAULT_MCQS } from '../constants/mcqs';
import { useTheme } from '../contexts/ThemeContext';

import { SST_TEST_QUESTIONS, SCIENCE_TEST_QUESTIONS } from '../constants/mcqData';

type AdminTab = 'classes' | 'subjects' | 'chapters' | 'users' | 'comments' | 'tests' | 'stats' | 'chapterTests' | 'results' | 'theme' | 'groups' | 'ratings' | 'logs' | 'site' | 'notifications' | 'news' | 'userMessages' | 'identity';
type EditTab = 'basic' | 'resources' | 'quiz' | 'questions';

const DraggableAny = Draggable as any;

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSpecialAdmin, setIsSpecialAdmin] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLimitedAdmin, setIsLimitedAdmin] = useState(false);
  const [sessionAllowedTabs, setSessionAllowedTabs] = useState<string[]>([]);
  const [unlockKey, setUnlockKey] = useState('');
  const [unlockError, setUnlockError] = useState(false);
  const [unlockAttempts, setUnlockAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

  const isSuperAdmin = auth.currentUser?.email?.toLowerCase() === 'vijayninama683@gmail.com';

  useEffect(() => {
    if (isUnlocked && isLimitedAdmin && siteConfig) {
      const allowedTabs = sessionAllowedTabs.length > 0 
        ? sessionAllowedTabs 
        : (siteConfig?.limitedAdminTabs || ['chapters', 'chapterTests', 'subjects']);
      
      if (allowedTabs.length > 0 && !allowedTabs.includes(activeTab)) {
        setActiveTab(allowedTabs[0] as AdminTab);
      }
    }
  }, [isUnlocked, isLimitedAdmin, siteConfig, activeTab, sessionAllowedTabs]);

  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    
    const checkAdminStatus = async () => {
      if (auth.currentUser) {
        const isSpecial = localStorage.getItem('isSpecialLogin') === 'true';
        const isAdminLogin = localStorage.getItem('isAdminLogin') === 'true';
        setIsSpecialAdmin(isSpecial && isAdminLogin);

        const userRef = doc(db, 'users', auth.currentUser.uid);
        unsubUser = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setIsAdmin(data.role === 'admin');
            
            // Auto-unlock if it's a special secret login session
            if (isSpecial) {
              setIsUnlocked(true);
              const isSuper = auth.currentUser?.email?.toLowerCase() === 'vijayninama683@gmail.com';
              const limited = !isSuper;
              setIsLimitedAdmin(limited);
              
              if (limited) {
                const stored = localStorage.getItem('sessionAllowedTabs');
                if (stored) {
                  try {
                    setSessionAllowedTabs(JSON.parse(stored));
                  } catch (e) {
                    console.error("Error parsing stored tabs:", e);
                  }
                }
              }
            }
          }
        }, (err) => {
          console.error("Admin check failed:", err);
          setIsAdmin(false);
        });
      } else {
        setIsAdmin(false);
        setIsSpecialAdmin(false);
      }
    };
    
    checkAdminStatus();
    
    return () => {
      if (unsubUser) unsubUser();
    };
  }, []);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string, message: string, onConfirm: () => void, singleButton?: boolean } | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [siteComments, setSiteComments] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userMessages, setUserMessages] = useState<any[]>([]);
  
  const [pinUserId, setPinUserId] = useState('');
  const [pinDuration, setPinDuration] = useState('24'); // Default 24 hours
  const [selectedIdentityUid, setSelectedIdentityUid] = useState('');
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [newNews, setNewNews] = useState({ title: '', message: '', type: 'info', url: '' });
  const [isAddingNotif, setIsAddingNotif] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'info', url: '' });
  const [isAddingUserMsg, setIsAddingUserMsg] = useState(false);
  const [newUserMsg, setNewUserMsg] = useState({ userId: '', message: '', duration: 10, showCount: 1 });
  
  const shouldShowTab = (tabId: string) => {
    if (!isLimitedAdmin) return true;
    const allowedTabs = sessionAllowedTabs.length > 0 
      ? sessionAllowedTabs 
      : (siteConfig?.limitedAdminTabs || ['chapters', 'chapterTests']);
    return allowedTabs.includes(tabId);
  };
  
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [editTab, setEditTab] = useState<EditTab>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'class' | 'subject' | 'chapter' | 'user' | 'test' | 'group' | 'rating', id: string, name: string } | null>(null);
  const [uploadingResource, setUploadingResource] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const [isBackingUp, setIsBackingUp] = useState(false);

  const saveSiteConfig = async (newConfig: any) => {
    try {
      await setDoc(doc(db, 'config', 'site'), {
        ...siteConfig,
        ...newConfig,
        lastUpdated: serverTimestamp()
      }, { merge: true });
      setToast({ message: 'Settings saved!', type: 'success' });
    } catch (err) {
      console.error("Error saving config:", err);
      setToast({ message: 'Failed to save settings.', type: 'error' });
    }
  };

  const downloadBackup = async () => {
    setIsBackingUp(true);
    try {
      const collections = [
        'classes', 'subjects', 'chapters', 'users', 
        'quizHistory', 'comments', 'tests', 'testResults', 'siteComments'
      ];
      
      const backupData: any = {};
      
      for (const colName of collections) {
        const querySnapshot = await getDocs(collection(db, colName));
        backupData[colName] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `studyhub_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setToast({ message: 'Backup downloaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Backup error:', error);
      setToast({ message: 'Failed to generate backup', type: 'error' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileUpload = async (file: File, resourceId: string, index: number) => {
    if (!file || uploadingResource === resourceId) return;
    
    // Limit file size to 10MB for better performance and to prevent hanging
    if (file.size > 10 * 1024 * 1024) {
      setToast({ message: "File is too large. Please upload a PDF smaller than 10MB.", type: 'error' });
      return;
    }

    setUploadingResource(resourceId);
    setUploadProgress(prev => ({ ...prev, [resourceId]: 0 }));
    
    try {
      const storageRef = ref(storage, `resources/${Date.now()}_${file.name}`);
      const metadata = {
        contentType: file.type || 'application/pdf',
      };
      
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, [resourceId]: progress }));
          console.log(`Upload progress for ${resourceId}: ${progress}%`);
        }, 
        (error) => {
          console.error("Upload failed with error:", error);
          setUploadingResource(null);
          
          let message = "Failed to upload file. ";
          if (error.code === 'storage/unauthorized') {
            message += "Please check your Firebase Storage rules in the console.";
          } else if (error.code === 'storage/canceled') {
            message += "Upload was canceled.";
          } else {
            message += "Please check your internet connection and try again.";
          }
          setToast({ message, type: 'error' });
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const newResources = [...editingEntity.resources];
          newResources[index].url = downloadURL;
          setEditingEntity({ ...editingEntity, resources: newResources });
          setUploadingResource(null);
          console.log("Upload successful! URL:", downloadURL);
        }
      );
    } catch (err) {
      console.error("Error initiating upload:", err);
      setUploadingResource(null);
      setToast({ message: "An unexpected error occurred while starting the upload.", type: 'error' });
    }
  };

  // Toast timer
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load initial data
  useEffect(() => {
    if (!isAdmin && !isSpecialAdmin) return;
    
    console.log("AdminPanel: Attaching data listeners for user:", auth.currentUser?.uid);
    const unsubClasses = getClasses(setClasses);
    const unsubUsers = getUsers(setUsers);
    const unsubTests = getTests(setTests);
    
    const qResults = query(collection(db, 'testResults'), orderBy('completedAt', 'desc'));
    const unsubResults = onSnapshot(qResults, (snapshot) => {
      setTestResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TestResult)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'testResults'));
    
    const q = query(collection(db, 'siteComments'), orderBy('createdAt', 'desc'));
    const unsubComments = onSnapshot(q, (snapshot) => {
      setSiteComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'siteComments'));

    const unsubGroups = onSnapshot(collection(db, 'groups'), (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'groups'));

    const unsubRatings = onSnapshot(query(collection(db, 'ratings'), orderBy('createdAt', 'desc')), (snapshot) => {
      setRatings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'ratings'));

    const unsubNews = onSnapshot(query(collection(db, 'news'), orderBy('createdAt', 'desc')), (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'news'));

    const unsubNotifications = onSnapshot(query(collection(db, 'notifications'), orderBy('createdAt', 'desc')), (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'notifications'));

    const unsubLogs = onSnapshot(query(collection(db, 'activityLogs'), orderBy('timestamp', 'desc')), (snapshot) => {
      setActivityLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'activityLogs'));

    const unsubMessages = onSnapshot(query(collection(db, 'userMessages'), orderBy('createdAt', 'desc')), (snapshot) => {
      setUserMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'userMessages'));

    const unsubConfig = onSnapshot(doc(db, 'config', 'site'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSiteConfig({ 
          id: snap.id, 
          welcomeEmailSubject: '',
          welcomeEmailTemplate: '',
          welcomeEmailSender: 'tagoreteam2025@gmail.com',
          emailjsServiceId: '',
          emailjsTemplateId: '',
          emailjsPublicKey: '',
          isRatingEnabled: true,
          ...data 
        });
      } else {
        // Initialize default config
        setDoc(doc(db, 'config', 'site'), {
          isRatingEnabled: true,
          welcomeEmailSubject: 'Welcome to Study-hub!',
          welcomeEmailTemplate: 'Hello {name}, welcome to Study-hub! We are glad to have you here.',
          welcomeEmailSender: 'tagoreteam2025@gmail.com',
          announcement: '',
          isAnnouncementActive: false,
          lastUpdated: serverTimestamp()
        });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'config/site'));

    return () => {
      unsubClasses();
      unsubUsers();
      unsubTests();
      unsubResults();
      unsubComments();
      unsubGroups();
      unsubRatings();
      unsubNews();
      unsubNotifications();
      unsubLogs();
      unsubMessages();
      unsubConfig();
    };
  }, [auth.currentUser?.uid, isAdmin, isSpecialAdmin]);

  // Load subjects when class changes
  useEffect(() => {
    if (selectedClassId) {
      const unsubSubjects = getSubjectsByClass(selectedClassId, setSubjects);
      return () => unsubSubjects();
    } else {
      setSubjects([]);
      setSelectedSubjectId('');
    }
  }, [selectedClassId]);

  // Load chapters when subject changes
  useEffect(() => {
    if (selectedSubjectId) {
      const unsubChapters = getChaptersBySubject(selectedSubjectId, setChapters);
      return () => unsubChapters();
    } else {
      setChapters([]);
    }
  }, [selectedSubjectId]);

  // Reordering functions
  const handleMove = async (type: 'class' | 'subject' | 'chapter', index: number, direction: 'up' | 'down') => {
    let list: any[] = [];
    let saveFn: any;

    if (type === 'class') {
      list = [...classes];
      saveFn = saveClass;
    } else if (type === 'subject') {
      list = [...subjects];
      saveFn = saveSubject;
    } else if (type === 'chapter') {
      list = [...chapters];
      saveFn = saveChapter;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= list.length) return;

    // Create a copy of the list to reorder
    const newList = [...list];
    const [movedItem] = newList.splice(index, 1);
    newList.splice(newIndex, 0, movedItem);

    // Update orders for all items to ensure they are consistent and unique
    try {
      const updates = newList.map((item, idx) => {
        if (item.order !== idx) {
          return saveFn({ ...item, order: idx });
        }
        return Promise.resolve();
      });
      
      await Promise.all(updates);
      setToast({ message: 'Order updated successfully', type: 'success' });
    } catch (error) {
      console.error("Error updating order:", error);
      setToast({ message: 'Failed to update order', type: 'error' });
    }
  };

  const handleAddNews = async () => {
    if (!newNews.title || !newNews.message) return;
    try {
      await addDoc(collection(db, 'news'), {
        ...newNews,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid
      });
      setNewNews({ title: '', message: '', type: 'info', url: '' });
      setIsAddingNews(false);
      setToast({ message: 'News added!', type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'news');
    }
  };

  const deleteNews = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'news', id));
      setToast({ message: 'News deleted!', type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'news');
    }
  };

  const handleAddNotification = async () => {
    if (!newNotif.title || !newNotif.message) return;
    try {
      // 1. Clear old notifications (Don't save any old)
      const querySnapshot = await getDocs(collection(db, 'notifications'));
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // 2. Add as a fresh document (provides a unique ID for the "seen" check)
      await addDoc(collection(db, 'notifications'), {
        ...newNotif,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid
      });
      setNewNotif({ title: '', message: '', type: 'info', url: '' });
      setIsAddingNotif(false);
      setToast({ message: 'Alert pushed to active users!', type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'notifications');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
      setToast({ message: 'Notification deleted!', type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'notifications');
    }
  };

  const handleAddUserMessage = async () => {
    if (!newUserMsg.userId || !newUserMsg.message) return;
    try {
      await addDoc(collection(db, 'userMessages'), {
        ...newUserMsg,
        createdAt: serverTimestamp()
      });
      setNewUserMsg({ userId: '', message: '', duration: 10, showCount: 1 });
      setIsAddingUserMsg(false);
      setToast({ message: 'Targeted message sent!', type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'userMessages');
    }
  };

  const deleteUserMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'userMessages', id));
      setToast({ message: 'Message removed!', type: 'success' });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'userMessages');
    }
  };

  const handleDelete = async (type: 'class' | 'subject' | 'chapter' | 'user' | 'test' | 'group' | 'rating', id: string, name: string) => {
    setDeleteConfirm({ type: type as any, id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    
    if (type === 'class') await removeClass(id);
    else if (type === 'subject') await removeSubject(id);
    else if (type === 'chapter') await removeChapter(id);
    else if (type === 'user') await removeUser(id);
    else if (type === 'test') await removeTest(id);
    else if (type === 'group') await deleteDoc(doc(db, 'groups', id));
    else if (type === 'rating') await deleteDoc(doc(db, 'ratings', id));
    
    setDeleteConfirm(null);
  };

  const handleEdit = (entity: any, type: string) => {
    setEditingEntity({ ...entity, type });
    setEditTab('basic');
  };

  const handleSave = async () => {
    if (!editingEntity) return;
    setIsSaving(true);
    try {
      // Create a copy and remove the 'type' field which is only for UI state
      const { type, ...dataToSave } = editingEntity;
      
      if (type === 'class') await saveClass(dataToSave as Class);
      else if (type === 'subject') await saveSubject(dataToSave as Subject);
      else if (type === 'chapter') await saveChapter(dataToSave as Chapter);
      else if (type === 'test') await saveTest(dataToSave as Test);
      else if (type === 'notification') {
        const notifRef = doc(db, 'notifications', dataToSave.id);
        await setDoc(notifRef, {
          ...dataToSave,
          createdAt: serverTimestamp()
        }, { merge: true });
      }
      else if (type === 'group') {
        const groupRef = doc(db, 'groups', dataToSave.id);
        // Clean undefined fields
        const cleanData = Object.fromEntries(
          Object.entries(dataToSave).filter(([_, v]) => v !== undefined)
        );
        await setDoc(groupRef, {
          ...cleanData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      
      setEditingEntity(null);
      setToast({ message: "Changes saved successfully!", type: 'success' });
    } catch (error: any) {
      console.error("Error saving:", error);
      let errorMessage = "Failed to save changes.";
      try {
        const errorData = JSON.parse(error.message);
        if (errorData.error.includes("insufficient permissions")) {
          errorMessage = "Permission denied. Please check security rules.";
        }
      } catch (e) {
        // Not a JSON error
      }
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const addNew = (type: 'class' | 'subject' | 'chapter' | 'test' | 'group') => {
    const id = Date.now().toString();
    const order = type === 'class' ? classes.length : (type === 'subject' ? subjects.length : (type === 'chapter' ? chapters.length : 0));
    
    let newEntity: any = { id, name: 'New ' + type, enabled: true, order };
    
    if (type === 'subject') {
      if (!selectedClassId) {
        setToast({ message: "Please select a class first", type: 'error' });
        return;
      }
      newEntity.classId = selectedClassId;
    } else if (type === 'chapter') {
      if (!selectedSubjectId) {
        setToast({ message: "Please select a subject first", type: 'error' });
        return;
      }
      newEntity.subjectId = selectedSubjectId;
      newEntity.classId = selectedClassId;
      newEntity.resources = [];
      newEntity.quiz = [];
      newEntity.quizEnabled = true;
      newEntity.isImportant = false;
    } else if (type === 'test') {
      newEntity = {
        id: crypto.randomUUID(),
        classId: selectedClassId || (classes[0]?.id || ''),
        title: 'New Test',
        questions: [],
        active: true,
        createdAt: new Date()
      };
    } else if (type === 'group') {
      newEntity = {
        id: Date.now().toString(),
        name: 'New Group',
        description: 'A new discussion group',
        password: '',
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid || 'admin'
      };
    }
    
    setEditingEntity({ ...newEntity, type });
    setEditTab('basic');
  };

  // Stats data
  const statsData = [
    { name: 'Classes', value: classes.length },
    { name: 'Chapters', value: chapters.length },
    { name: 'Tests', value: tests.length },
    { name: 'Users', value: users.filter(u => u.email?.toLowerCase() !== 'vijayninama683@gmail.com').length },
  ];

  const COLORS = ['#00E5FF', '#A855F7', '#EC4899', '#10B981'];

  const { theme, updateTheme, resetTheme } = useTheme();

  const seedSpecialTests = async () => {
    setIsSaving(true);
    try {
      const sstTest: Test = {
        id: 'sst-special-test',
        classId: selectedClassId || (classes[0]?.id || 'default'),
        title: 'SST Special Test (20 MCQs)',
        questions: SST_TEST_QUESTIONS,
        active: true,
        createdAt: new Date()
      };
      const scienceTest: Test = {
        id: 'science-special-test',
        classId: selectedClassId || (classes[0]?.id || 'default'),
        title: 'Science Special Test (20 MCQs)',
        questions: SCIENCE_TEST_QUESTIONS,
        active: true,
        createdAt: new Date()
      };
      await saveTest(sstTest);
      await saveTest(scienceTest);
      setToast({ message: "Special tests seeded successfully!", type: 'success' });
    } catch (error) {
      console.error("Error seeding tests:", error);
      setToast({ message: "Failed to seed tests.", type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const [isRestoring, setIsRestoring] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const seedMCQTests = async () => {
    if (!window.confirm('This will add 20-question Science and SST tests to the platform. Continue?')) return;
    setIsSeeding(true);
    try {
      const scienceTest = {
        title: 'Science Mega Test (20 MCQ)',
        category: 'Science',
        duration: 20,
        questions: DEFAULT_MCQS['Science'],
        createdAt: serverTimestamp(),
        enabled: true
      };
      const sstTest = {
        title: 'SST Mega Test (20 MCQ)',
        category: 'SST',
        duration: 20,
        questions: DEFAULT_MCQS['History'], // Using History as SST for now
        createdAt: serverTimestamp(),
        enabled: true
      };
      await addDoc(collection(db, 'tests'), scienceTest);
      await addDoc(collection(db, 'tests'), sstTest);
      setToast({ message: 'MCQ Tests seeded successfully!', type: 'success' });
    } catch (error) {
      console.error('Error seeding tests:', error);
      setToast({ message: 'Failed to seed tests', type: 'error' });
    } finally {
      setIsSeeding(false);
    }
  };

  const backupData = async () => {
    setIsBackingUp(true);
    try {
      const data = {
        classes,
        subjects,
        chapters,
        tests,
        testResults,
        siteComments,
        timestamp: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ message: 'Backup created successfully!', type: 'success' });
    } catch (error) {
      console.error("Backup error:", error);
      setToast({ message: 'Failed to create backup', type: 'error' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const restoreData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm('This will overwrite existing data. Are you sure?')) return;

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Restore classes
        if (data.classes) {
          for (const cls of data.classes) await saveClass(cls);
        }
        // Restore subjects
        if (data.subjects) {
          for (const sub of data.subjects) await saveSubject(sub);
        }
        // Restore chapters
        if (data.chapters) {
          for (const ch of data.chapters) await saveChapter(ch);
        }
        // Restore tests
        if (data.tests) {
          for (const t of data.tests) await saveTest(t);
        }
        // Restore test results
        if (data.testResults) {
          for (const res of data.testResults) await saveTestResult(res);
        }
        // Restore site comments
        if (data.siteComments) {
          for (const comment of data.siteComments) {
            await saveSiteComment(comment);
          }
        }

        setToast({ message: 'Data restored successfully!', type: 'success' });
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        console.error("Restore error:", error);
        setToast({ message: 'Failed to restore data. Invalid file format.', type: 'error' });
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  if (!isUnlocked) {
    const isLockedOut = lockoutUntil && Date.now() < lockoutUntil;
    const remainingLockout = lockoutUntil ? Math.ceil((lockoutUntil - Date.now()) / 1000) : 0;

    const handleUnlock = () => {
      if (isLockedOut) return;
      
      const adminEmail = auth.currentUser?.email?.toLowerCase();
      const isSuperAdmin = adminEmail === 'vijayninama683@gmail.com';
      
      const mainKey = siteConfig?.adminUnlockKey || '101987';
      const limitedKey = siteConfig?.secretLoginKey || 'Vijay1987';
      const isSecretEnabled = siteConfig?.secretLoginEnabled !== false;

      // Check for secret profiles
      const profile = siteConfig?.secretProfiles?.find((p: any) => p.key === unlockKey);

      if (unlockKey === mainKey) {
        setIsUnlocked(true);
        setIsLimitedAdmin(false);
        setSessionAllowedTabs([]); // Full access
        setUnlockAttempts(0);
        setLockoutUntil(null);
        setToast({ message: isSuperAdmin ? 'Welcome back, Super Admin!' : 'Admin access granted!', type: 'success' });
      } else if (isSecretEnabled && profile) {
        setIsUnlocked(true);
        // Even with limited key, the super admin gets full permissions
        const limited = !isSuperAdmin;
        setIsLimitedAdmin(limited);
        
        if (limited) {
          const allowed = profile.allowedTabs;
          setSessionAllowedTabs(allowed);
        } else {
          setSessionAllowedTabs([]);
        }

        setUnlockAttempts(0);
        setLockoutUntil(null);
        setToast({ message: isSuperAdmin ? 'Full access granted (Super Admin Bypass)' : 'Limited Admin Access Granted', type: 'info' });
      } else {
        const newAttempts = unlockAttempts + 1;
        setUnlockAttempts(newAttempts);
        setUnlockError(true);
        if (newAttempts >= 3) {
          setLockoutUntil(Date.now() + 60000); // 1 minute lockout
          setUnlockAttempts(0);
          setToast({ message: 'Too many failed attempts. Locked for 1 minute.', type: 'error' });
        }
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4 pt-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass-card p-8 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-neon-blue/10 flex items-center justify-center mx-auto mb-6 text-neon-blue">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2 uppercase tracking-tight">Dashboard Locked</h2>
          <p className="text-white/40 text-sm mb-8">
            {isLockedOut 
              ? `Too many attempts. Try again in ${remainingLockout}s` 
              : 'Enter the security key to access the admin panel.'}
          </p>
          
          <div className="space-y-4">
            <input 
              type="password"
              value={unlockKey}
              onChange={(e) => {
                setUnlockKey(e.target.value);
                setUnlockError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleUnlock();
              }}
              disabled={isLockedOut}
              placeholder="••••"
              className={`w-full bg-white/5 border ${unlockError ? 'border-red-500' : 'border-white/10'} rounded-xl py-4 px-4 text-white text-center text-2xl tracking-[0.5em] focus:border-neon-blue outline-none transition-all font-mono disabled:opacity-50`}
              autoFocus
            />
            {unlockError && !isLockedOut && (
              <motion.p 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-red-500 text-[10px] font-bold uppercase tracking-widest"
              >
                Invalid Security Key ({3 - unlockAttempts} attempts left)
              </motion.p>
            )}
            <button 
              onClick={handleUnlock}
              disabled={isLockedOut}
              className="btn-neon w-full py-4 uppercase tracking-widest font-bold disabled:opacity-50"
            >
              {isLockedOut ? `Locked (${remainingLockout}s)` : 'Unlock Dashboard'}
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full py-3 text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">Admin Panel</h1>
              <p className="text-sm text-white/40">Manage your educational ecosystem.</p>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <button 
                onClick={downloadBackup}
                disabled={isBackingUp}
                title="Download Backup"
                className="px-3 py-2 rounded-xl bg-neon-blue/10 text-neon-blue text-xs font-bold hover:bg-neon-blue/20 transition-all border border-neon-blue/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isBackingUp ? <RefreshCcw size={14} className="animate-spin" /> : <Download size={14} />}
              </button>
              <button 
                onClick={async () => {
                await signOut(auth);
                localStorage.removeItem('isSpecialLogin');
                localStorage.removeItem('isAdminLogin');
                localStorage.removeItem('studentName');
                window.location.href = '/';
              }}
              className="md:hidden px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all border border-red-500/20 flex items-center gap-2"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
            <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end mr-4">
              <span className="text-[10px] text-white/40 font-mono">UID: {auth.currentUser?.uid?.slice(0, 8)}...</span>
              <span className="text-[10px] text-neon-blue font-mono uppercase">Role: {isAdmin ? 'Admin' : (isSpecialAdmin ? 'Special' : 'User')}</span>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="hidden md:flex px-4 py-2 rounded-xl bg-white/5 text-white/60 text-xs font-bold hover:bg-white/10 transition-all border border-white/10 items-center gap-2"
            >
              <RefreshCcw size={14} />
              Refresh
            </button>
            <button 
              onClick={downloadBackup}
              disabled={isBackingUp}
              className="hidden md:flex px-4 py-2 rounded-xl bg-neon-blue/10 text-neon-blue text-xs font-bold hover:bg-neon-blue/20 transition-all border border-neon-blue/20 items-center gap-2 disabled:opacity-50"
            >
              {isBackingUp ? <RefreshCcw size={14} className="animate-spin" /> : <Download size={14} />}
              {isBackingUp ? 'Backing up...' : 'Backup Data'}
            </button>
            <button 
              onClick={async () => {
                await signOut(auth);
                localStorage.removeItem('isSpecialLogin');
                localStorage.removeItem('isAdminLogin');
                localStorage.removeItem('studentName');
                window.location.href = '/';
              }}
              className="hidden md:flex px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all border border-red-500/20 items-center gap-2"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10 overflow-x-auto scrollbar-hide max-w-full sm:max-w-none">
            {shouldShowTab('stats') && (
              <button 
                onClick={() => setActiveTab('stats')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-white text-black font-bold' : 'text-white/60 hover:text-white'}`}
              >
                <BarChart3 size={16} className="inline-block mr-1.5" />
                Dashboard
              </button>
            )}

            {shouldShowTab('chapters') && (
              <button 
                onClick={() => setActiveTab('chapters')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'chapters' ? 'bg-neon-pink text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <FileText size={16} className="inline-block mr-1.5" />
                Chapters
              </button>
            )}

            {shouldShowTab('classes') && (
              <button 
                onClick={() => setActiveTab('classes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'classes' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,229,255,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <Layers size={16} className="inline-block mr-1.5" />
                Classes
              </button>
            )}

            {shouldShowTab('subjects') && (
              <button 
                onClick={() => setActiveTab('subjects')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'subjects' ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <BookOpen size={16} className="inline-block mr-1.5" />
                Subjects
              </button>
            )}

            {shouldShowTab('chapterTests') && (
              <button 
                onClick={() => setActiveTab('chapterTests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'chapterTests' ? 'bg-neon-pink text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <Trophy size={16} className="inline-block mr-1.5" />
                Chapter MCQs
              </button>
            )}

            {shouldShowTab('users') && (
              <button 
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-emerald-500 text-white shadow-[0_0_15_rgba(16,185,129,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <Users size={16} className="inline-block mr-1.5" />
                Users
              </button>
            )}

            {shouldShowTab('identity') && (
              <button 
                onClick={() => setActiveTab('identity')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'identity' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <Fingerprint size={16} className="inline-block mr-1.5" />
                Managed IDs
              </button>
            )}

            {shouldShowTab('groups') && (
              <button 
                onClick={() => setActiveTab('groups')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'groups' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,229,255,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <Globe size={16} className="inline-block mr-1.5" />
                Groups
              </button>
            )}

            {shouldShowTab('site') && (
              <button 
                onClick={() => setActiveTab('site')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'site' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,229,255,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <Globe size={16} className="inline-block mr-1.5" />
                Site Control
              </button>
            )}

            {shouldShowTab('ratings') && (
              <button 
                onClick={() => setActiveTab('ratings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'ratings' ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <Star size={16} className="inline-block mr-1.5" />
                Ratings
              </button>
            )}

            {shouldShowTab('comments') && (
              <button 
                onClick={() => setActiveTab('comments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'comments' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,229,255,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <MessageSquare size={16} className="inline-block mr-1.5" />
                Comments
              </button>
            )}

            {shouldShowTab('tests') && (
              <button 
                onClick={() => setActiveTab('tests')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'tests' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,229,255,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <ClipboardList size={16} className="inline-block mr-1.5" />
                Tests
              </button>
            )}

            {!isLimitedAdmin && (
              <>
                <button 
                  onClick={backupData}
                  disabled={isBackingUp}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  <Download size={16} className="inline-block mr-1.5" />
                  Backup
                </button>
                <label className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap bg-amber-500 text-white hover:bg-amber-600 cursor-pointer">
                  <Upload size={16} className="inline-block mr-1.5" />
                  Restore
                  <input type="file" accept=".json" onChange={restoreData} className="hidden" />
                </label>
              </>
            )}

            {shouldShowTab('results') && (
              <button 
                onClick={() => setActiveTab('results')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'results' ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <Trophy size={16} className="inline-block mr-1.5" />
                Results
              </button>
            )}

            {/* We already rendered stats as Dashboard at the top */}

            {shouldShowTab('logs') && (
              <button 
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'logs' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,229,255,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <ClipboardList size={16} className="inline-block mr-1.5" />
                Logs
              </button>
            )}

            {shouldShowTab('notifications') && (
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'notifications' ? 'bg-neon-pink text-white shadow-[0_0_15px_rgba(236,72,153,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <Zap size={16} className="inline-block mr-1.5" />
                News Ticker
              </button>
            )}

            {shouldShowTab('userMessages') && (
              <button 
                onClick={() => setActiveTab('userMessages')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'userMessages' ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <MessageSquare size={16} className="inline-block mr-1.5" />
                Push Alerts
              </button>
            )}

            {shouldShowTab('theme') && (
              <button 
                onClick={() => setActiveTab('theme')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeTab === 'theme' ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(0,229,255,0.5)]' : 'text-white/60 hover:text-white'}`}
              >
                <Palette size={16} className="inline-block mr-1.5" />
                Theme
              </button>
            )}

            <div className="w-4 shrink-0" />
          </div>

      {/* Content Area */}
        <div className="glass-card p-6 min-h-[600px]">
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-black/40 p-6 rounded-3xl border border-white/10">
                <div>
                  <h2 className="text-3xl font-display font-bold text-neon-pink mb-1">News & Alerts Ticker</h2>
                  <p className="text-white/40 text-xs">These alerts appear in the scrolling ticker for all users</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={async () => {
                      if (confirm('Delete all notification history?')) {
                        const snap = await getDocs(collection(db, 'notifications'));
                        await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
                        setToast({ message: 'All notifications cleared!', type: 'success' });
                      }
                    }}
                    className="p-2 text-white/20 hover:text-red-500 transition-colors"
                    title="Clear All History"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button 
                    onClick={() => setIsAddingNotif(true)}
                    className="btn-neon flex items-center gap-2 border-neon-pink text-neon-pink hover:bg-neon-pink/10"
                  >
                    <Plus size={18} /> New Alert
                  </button>
                </div>
              </div>

              {isAddingNotif && (
                <div className="glass-card p-8 border-neon-pink/30">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold uppercase tracking-tight">Create Alert</h3>
                    <button onClick={() => setIsAddingNotif(false)} className="text-white/40 hover:text-white"><X size={20} /></button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Alert Title</label>
                      <input 
                        type="text" 
                        value={newNotif.title}
                        onChange={(e) => setNewNotif({...newNotif, title: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-neon-pink shadow-[0_0_10px_rgba(236,72,153,0.1)]"
                        placeholder="Important Update"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Short Message</label>
                      <input 
                        type="text" 
                        value={newNotif.message}
                        onChange={(e) => setNewNotif({...newNotif, message: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-neon-pink"
                        placeholder="New practice paper available..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Target URL</label>
                        <input 
                          type="text" 
                          value={newNotif.url}
                          onChange={(e) => setNewNotif({...newNotif, url: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-neon-pink"
                          placeholder="/tests"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Type</label>
                        <select 
                          value={newNotif.type}
                          onChange={(e) => setNewNotif({...newNotif, type: e.target.value as any})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none"
                        >
                          <option value="info">Info</option>
                          <option value="success">Success</option>
                          <option value="warning">Warning</option>
                          <option value="error">Error</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={handleAddNotification} className="btn-neon w-full py-4 uppercase tracking-wider font-bold border-neon-pink text-neon-pink">Push to All Devices</button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {notifications.map((notif) => (
                  <div key={notif.id} className="glass-card p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        notif.type === 'success' ? 'bg-green-500/10 text-green-500' :
                        notif.type === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                        notif.type === 'error' ? 'bg-red-500/10 text-red-500' :
                        'bg-neon-pink/10 text-neon-pink'
                      }`}>
                        <Bell size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{notif.title}</p>
                        <p className="text-xs text-white/40">{notif.message}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteNotification(notif.id)}
                      className="p-2 text-white/20 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-grow max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search classes..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-neon-blue outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => addNew('class')}
                  className="btn-neon bg-neon-blue text-black px-6 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus size={20} />
                  Add Class
                </button>
              </div>

              <div className="grid gap-4">
                {classes.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((cls, index) => (
                    <motion.div 
                      key={cls.id}
                      layout
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-neon-blue/50 transition-all group gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="flex flex-col gap-1 shrink-0">
                          <button 
                            onClick={() => handleMove('class', index, 'up')}
                            disabled={index === 0}
                            className="text-white/20 hover:text-neon-blue disabled:opacity-0"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button 
                            onClick={() => handleMove('class', index, 'down')}
                            disabled={index === classes.length - 1}
                            className="text-white/20 hover:text-neon-blue disabled:opacity-0"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-medium text-white break-words">{cls.name}</h3>
                          <p className="text-xs text-white/40 truncate">ID: {cls.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <button 
                          onClick={() => saveClass({ ...cls, enabled: !cls.enabled })}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${cls.enabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-white/40'}`}
                        >
                          {cls.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <div className="flex items-center gap-2 transition-all">
                          <a 
                            href={`/class/${cls.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-white/60 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all"
                            title="View Page"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <button 
                            onClick={() => handleEdit(cls, 'class')}
                            className="p-2 text-white/60 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete('class', cls.id, cls.name)}
                            className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-full sm:w-64">
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white focus:border-neon-purple outline-none transition-all"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    <option value="" className="bg-dark-bg">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id} className="bg-dark-bg">{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="relative flex-grow max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search subjects..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-neon-purple outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => addNew('subject')}
                  className="btn-neon bg-neon-purple text-white px-6 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus size={20} />
                  Add Subject
                </button>
              </div>

              {!selectedClassId ? (
                <div className="flex flex-col items-center justify-center h-64 text-white/20">
                  <Layers size={48} className="mb-4" />
                  <p>Select a class to manage subjects</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map((subject, index) => (
                    <motion.div 
                      key={subject.id}
                      layout
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-neon-purple/50 transition-all group gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="flex flex-col gap-1 shrink-0">
                          <button 
                            onClick={() => handleMove('subject', index, 'up')}
                            disabled={index === 0}
                            className="text-white/20 hover:text-neon-purple disabled:opacity-0"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button 
                            onClick={() => handleMove('subject', index, 'down')}
                            disabled={index === subjects.length - 1}
                            className="text-white/20 hover:text-neon-purple disabled:opacity-0"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-medium text-white break-words">{subject.name}</h3>
                          <p className="text-xs text-white/40 truncate">ID: {subject.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <button 
                          onClick={() => saveSubject({ ...subject, enabled: !subject.enabled })}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${subject.enabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-white/40'}`}
                        >
                          {subject.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <div className="flex items-center gap-2 transition-all">
                          <a 
                            href={`/class/${selectedClassId}/subject/${subject.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-white/60 hover:text-neon-purple hover:bg-neon-purple/10 rounded-lg transition-all"
                            title="View Page"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <button 
                            onClick={() => handleEdit(subject, 'subject')}
                            className="p-2 text-white/60 hover:text-neon-purple hover:bg-neon-purple/10 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete('subject', subject.id, subject.name)}
                            className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chapters' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-full sm:w-48">
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white focus:border-neon-pink outline-none transition-all"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    <option value="" className="bg-dark-bg">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id} className="bg-dark-bg">{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-48">
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white focus:border-neon-pink outline-none transition-all"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    disabled={!selectedClassId}
                  >
                    <option value="" className="bg-dark-bg">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id} className="bg-dark-bg">{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="relative flex-grow max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search chapters..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-neon-pink outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => addNew('chapter')}
                  className="btn-neon bg-neon-pink text-white px-6 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus size={20} />
                  Add Chapter
                </button>
              </div>

              {!selectedSubjectId ? (
                <div className="flex flex-col items-center justify-center h-64 text-white/20">
                  <BookOpen size={48} className="mb-4" />
                  <p>Select a class and subject to manage chapters</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {chapters.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((chapter, index) => (
                    <motion.div 
                      key={chapter.id}
                      layout
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-neon-pink/50 transition-all group gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="flex flex-col gap-1 shrink-0">
                          <button 
                            onClick={() => handleMove('chapter', index, 'up')}
                            disabled={index === 0}
                            className="text-white/20 hover:text-neon-pink disabled:opacity-0"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button 
                            onClick={() => handleMove('chapter', index, 'down')}
                            disabled={index === chapters.length - 1}
                            className="text-white/20 hover:text-neon-pink disabled:opacity-0"
                          >
                            <ArrowDown size={16} />
                          </button>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="text-lg font-medium text-white break-words">{chapter.name}</h3>
                            {chapter.isImportant && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neon-pink/20 text-neon-pink uppercase tracking-wider shrink-0">Important</span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 truncate">{chapter.resources?.length || 0} Resources • {chapter.quiz?.length || 0} Quiz Questions</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <button 
                          onClick={() => saveChapter({ ...chapter, enabled: !chapter.enabled })}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${chapter.enabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-white/40'}`}
                        >
                          {chapter.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                        <div className="flex items-center gap-2 transition-all">
                          <a 
                            href={`/class/${selectedClassId}/subject/${selectedSubjectId}/chapter/${chapter.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-white/60 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all"
                            title="View Page"
                          >
                            <ExternalLink size={18} />
                          </a>
                          <button 
                            onClick={() => handleEdit(chapter, 'chapter')}
                            className="p-2 text-white/60 hover:text-neon-pink hover:bg-neon-pink/10 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete('chapter', chapter.id, chapter.name)}
                            className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-grow max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-emerald-500 outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => {
                    const headers = ['Name', 'Email', 'Role', 'Created At', 'Photo URL', 'User Agent', 'Platform', 'Language', 'Resolution'];
                    const csvData = users
                      .filter(u => u.email?.toLowerCase() !== 'vijayninama683@gmail.com')
                      .map(u => [
                        u.name || 'Anonymous',
                        u.email,
                        u.role,
                        u.createdAt,
                        u.photoURL || '',
                        u.deviceInfo?.userAgent || 'N/A',
                        u.deviceInfo?.platform || 'N/A',
                        u.deviceInfo?.language || 'N/A',
                        u.deviceInfo?.screenResolution || 'N/A'
                      ]);
                    
                    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement("a");
                    const url = URL.createObjectURL(blob);
                    link.setAttribute("href", url);
                    link.setAttribute("download", `users_data_${new Date().toISOString().split('T')[0]}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setToast({ message: 'User data downloaded!', type: 'success' });
                  }}
                  className="btn-neon bg-emerald-500 text-black px-6 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Download size={20} />
                  Download Data (CSV)
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-4 px-4 text-sm font-medium text-white/40">User</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Email</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Role</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">IP Address</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => u.email?.toLowerCase() !== 'vijayninama683@gmail.com')
                      .filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()) || (u.name?.toLowerCase().includes(searchQuery.toLowerCase())))
                      .map((user) => (
                      <tr key={user.uid} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden relative">
                              {user.photoURL ? (
                                <img src={convertDriveUrl(user.photoURL)} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/40">
                                  <Users size={20} />
                                </div>
                              )}
                              {user.pinnedToTop && (
                                <div className="absolute -top-1 -right-1 bg-yellow-400 text-black rounded-full p-0.5">
                                  <Crown size={10} />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white font-medium">
                                {user.name || 'Anonymous'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white/60">
                          {user.email}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-neon-blue/20 text-neon-blue' : 'bg-white/10 text-white/60'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-white/60 font-mono text-xs">
                          {user.ip || user.deviceInfo?.ip || 'N/A'}
                          {user.deviceInfo && (
                            <div className="text-[10px] text-white/40 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {user.deviceInfo.platform} • {user.deviceInfo.screenResolution}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-4">
                            {user.email !== 'vijayninama683@gmail.com' && (
                              <button 
                                onClick={() => {
                                  const newRole = user.role === 'admin' ? 'student' : 'admin';
                                  saveUser({ ...user, role: newRole });
                                }}
                                className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border transition-all ${user.role === 'admin' ? 'border-neon-blue text-neon-blue bg-neon-blue/5' : 'border-white/20 text-white/40 hover:text-white'}`}
                              >
                                {user.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                              </button>
                            )}
                            {user.email !== 'vijayninama683@gmail.com' && user.uid !== auth.currentUser?.uid && (
                              <button 
                                onClick={() => handleDelete('user', user.uid, user.email)}
                                className="p-2 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-white/20 italic">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-grow max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search comments..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-neon-blue outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {siteComments.filter(c => 
                  c.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (c.userEmail && c.userEmail.toLowerCase().includes(searchQuery.toLowerCase()))
                ).map((comment) => (
                  <div key={comment.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-red-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neon-blue/20 text-neon-blue flex items-center justify-center text-xs font-bold">
                          {comment.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{comment.userName}</span>
                            {comment.userEmail && (
                              <span className="text-[10px] text-neon-blue/60 bg-neon-blue/5 px-1.5 py-0.5 rounded border border-neon-blue/10">
                                {comment.userEmail}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-white/20 font-mono">
                            {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleString() : 'Just now'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setConfirmAction({
                            title: 'Delete Comment',
                            message: 'Are you sure you want to delete this comment?',
                            onConfirm: async () => {
                              try {
                                await deleteDoc(doc(db, 'siteComments', comment.id));
                                setToast({ message: 'Comment deleted!', type: 'success' });
                              } catch (err) {
                                setToast({ message: 'Failed to delete comment.', type: 'error' });
                              }
                              setConfirmAction(null);
                            }
                          });
                        }}
                        className="p-2 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        title="Delete Abusive Comment"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed">{comment.text}</p>
                    <div className="mt-3 flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-white/20">
                      <span>{comment.likes || 0} Likes</span>
                      {comment.parentId && <span className="text-neon-blue">Reply to: {comment.parentId}</span>}
                    </div>
                  </div>
                ))}
                {siteComments.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-white/20">
                    <MessageSquare size={48} className="mb-4" />
                    <p>No comments found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-grow max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search tests..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-neon-blue outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => addNew('test')}
                  className="btn-neon bg-neon-blue text-black px-6 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus size={20} />
                  Add Test
                </button>
              </div>

              <div className="grid gap-4">
                {tests.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).map((test) => (
                  <motion.div 
                    key={test.id}
                    layout
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-neon-blue/50 transition-all group gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue shrink-0">
                        <ClipboardList size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-medium text-white break-words">{test.title}</h3>
                        <p className="text-xs text-white/40 truncate">
                          Class: {classes.find(c => c.id === test.classId)?.name || 'Unknown'} • {test.questions.length} Questions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <button 
                        onClick={() => saveTest({ ...test, active: !test.active })}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${test.active ? 'bg-emerald-500/20 text-emerald-500' : 'bg-white/10 text-white/40'}`}
                      >
                        {test.active ? 'Active' : 'Inactive'}
                      </button>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(test, 'test')}
                          className="p-2 text-white/60 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete('test', test.id, test.title)}
                          className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {tests.length === 0 && (
                  <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <ClipboardList size={48} className="mx-auto text-white/10 mb-4" />
                    <p className="text-white/30 italic">No tests created yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-grow max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search results by name, email or test..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-neon-blue outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => {
                    setConfirmAction({
                      title: 'Clear All Results',
                      message: 'Are you sure you want to delete ALL test results? This action cannot be undone.',
                      onConfirm: async () => {
                        try {
                          const promises = testResults.map(r => deleteDoc(doc(db, 'testResults', r.id)));
                          await Promise.all(promises);
                          setToast({ message: 'All results cleared!', type: 'success' });
                        } catch (err) {
                          setToast({ message: 'Failed to clear results.', type: 'error' });
                        }
                        setConfirmAction(null);
                      }
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all border border-red-500/20"
                >
                  Clear All
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Student</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Test</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Score</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Date</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults
                      .filter(r => 
                        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        r.studentEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.testTitle.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((result) => (
                      <tr key={result.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{result.studentName}</span>
                            <span className="text-xs text-white/40">{result.studentEmail || 'No Email'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white/60">{result.testTitle}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${result.score >= 70 ? 'text-emerald-400' : result.score >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                              {result.score}%
                            </span>
                            <span className="text-xs text-white/20">({result.total} Qs)</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white/40 text-xs">
                          {result.completedAt?.toDate ? result.completedAt.toDate().toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          <button 
                            onClick={() => {
                              setConfirmAction({
                                title: 'Delete Result',
                                message: `Are you sure you want to delete the result for ${result.studentName}?`,
                                onConfirm: async () => {
                                  try {
                                    await deleteDoc(doc(db, 'testResults', result.id));
                                    setToast({ message: 'Result deleted!', type: 'success' });
                                  } catch (err) {
                                    setToast({ message: 'Failed to delete result.', type: 'error' });
                                  }
                                  setConfirmAction(null);
                                }
                              });
                            }}
                            className="p-2 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {testResults.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-white/20">
                    <Trophy size={48} className="mb-4" />
                    <p>No test results found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {statsData.map((stat, i) => (
                  <div key={stat.name} className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-xs sm:text-sm font-medium text-white/40 mb-1">{stat.name}</p>
                    <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">{stat.value}</h3>
                    <div className="w-full h-1 bg-white/10 mt-4 rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all duration-1000" 
                        style={{ width: '100%', backgroundColor: COLORS[i] }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl h-[400px]">
                  <h3 className="text-lg font-medium text-white mb-6">Content Distribution</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff20', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {statsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl h-[400px]">
                  <h3 className="text-lg font-medium text-white mb-6">User Roles</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Admins', value: users.filter(u => u.role === 'admin' && u.email?.toLowerCase() !== 'vijayninama683@gmail.com').length },
                          { name: 'Students', value: users.filter(u => u.role === 'student' && u.email?.toLowerCase() !== 'vijayninama683@gmail.com').length },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#00E5FF" />
                        <Cell fill="#ffffff10" />
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #ffffff20', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'chapterTests' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-white/40 ml-1">Select Class</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-neon-blue transition-all"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                    <option value="" className="bg-dark-bg">All Classes</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id} className="bg-dark-bg">{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-white/40 ml-1">Select Subject</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-neon-blue transition-all"
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    disabled={!selectedClassId}
                  >
                    <option value="" className="bg-dark-bg">All Subjects</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id} className="bg-dark-bg">{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                <input 
                  type="text" 
                  placeholder="Search chapters..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-neon-blue outline-none transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="grid gap-4">
                {chapters
                  .filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((chapter) => (
                    <div 
                      key={chapter.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-neon-pink/50 transition-all group gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-neon-pink/10 flex items-center justify-center text-neon-pink shrink-0">
                          <Trophy size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-medium text-white break-words">{chapter.name}</h3>
                          <p className="text-xs text-white/40 truncate">
                            {classes.find(c => c.id === chapter.classId)?.name} • {subjects.find(s => s.id === chapter.subjectId)?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 mr-2">
                          <input 
                            type="checkbox" 
                            id={`quiz-enabled-${chapter.id}`}
                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-neon-blue focus:ring-neon-blue"
                            checked={chapter.quizEnabled !== false}
                            onChange={async (e) => {
                              const updatedChapter = { ...chapter, quizEnabled: e.target.checked };
                              await saveChapter(updatedChapter);
                            }}
                          />
                          <label htmlFor={`quiz-enabled-${chapter.id}`} className="text-[10px] font-bold text-white/40 uppercase tracking-wider cursor-pointer">
                            {chapter.quizEnabled !== false ? 'Quiz On' : 'Quiz Off'}
                          </label>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60">
                          {chapter.quiz?.length || 0} MCQs
                        </div>
                        <button 
                          onClick={() => {
                            setEditingEntity({ ...chapter, type: 'chapter' });
                            setEditTab('quiz');
                          }}
                          className="btn-neon bg-neon-pink text-white px-4 py-1.5 text-xs flex items-center gap-2"
                        >
                          <Edit2 size={14} />
                          Edit MCQs
                        </button>
                      </div>
                    </div>
                  ))}
                {chapters.length === 0 && selectedSubjectId && (
                  <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Trophy size={48} className="mx-auto text-white/10 mb-4" />
                    <p className="text-white/30 italic">No chapters found for this subject.</p>
                  </div>
                )}
                {!selectedSubjectId && (
                  <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                    <BookOpen size={48} className="mx-auto text-white/10 mb-4" />
                    <p className="text-white/30 italic">Please select a class and subject to manage chapter MCQs.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-grow max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search logs by name, email, action or IP..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-neon-blue outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const headers = ['Date', 'Time', 'User', 'Email', 'Action', 'IP Address', 'Resolution', 'Path', 'User Agent'];
                      const csvData = activityLogs
                        .filter(log => log.userEmail !== 'anonymous@studyhub.com' && log.userEmail?.toLowerCase() !== 'vijayninama683@gmail.com' && !log.isSecret && !log.userName?.includes('Admin'))
                        .map(log => {
                        const dateObj = log.timestamp?.toDate ? log.timestamp.toDate() : new Date();
                        return [
                          dateObj.toLocaleDateString(),
                          dateObj.toLocaleTimeString(),
                          log.userName || 'Anonymous',
                          log.userEmail || 'N/A',
                          log.action,
                          log.ip || 'N/A',
                          log.resolution || 'N/A',
                          log.path || 'N/A',
                          `"${log.userAgent?.replace(/"/g, '""')}"` || 'N/A'
                        ];
                      });
                      
                      const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement("a");
                      const url = URL.createObjectURL(blob);
                      link.setAttribute("href", url);
                      link.setAttribute("download", `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      setToast({ message: 'Logs downloaded successfully!', type: 'success' });
                    }}
                    className="btn-neon bg-neon-blue text-black px-6 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <Download size={20} />
                    Download Logs (CSV)
                  </button>
                  <button 
                    onClick={() => {
                      setConfirmAction({
                        title: 'Clear All Logs',
                        message: 'Are you sure you want to delete ALL activity logs? This action cannot be undone.',
                        onConfirm: async () => {
                          try {
                            const promises = activityLogs.map(l => deleteDoc(doc(db, 'activityLogs', l.id)));
                            await Promise.all(promises);
                            setToast({ message: 'All logs cleared!', type: 'success' });
                          } catch (err) {
                            setToast({ message: 'Failed to clear logs.', type: 'error' });
                          }
                          setConfirmAction(null);
                        }
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all border border-red-500/20"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Timestamp</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">User</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Action</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">IP Address</th>
                      <th className="py-4 px-4 text-sm font-medium text-white/40">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs
                      .filter(l => l.userEmail !== 'anonymous@studyhub.com' && l.userEmail?.toLowerCase() !== 'vijayninama683@gmail.com' && !l.isSecret)
                      .filter(l => 
                        (l.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (l.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (l.ip || '').toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((log) => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="text-white text-xs font-medium">
                              {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleDateString() : 'N/A'}
                            </span>
                            <span className="text-[10px] text-white/40">
                              {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="text-white text-xs font-medium">{log.userName || 'Anonymous'}</span>
                            <span className="text-[10px] text-white/40 truncate max-w-[150px]">{log.userEmail || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs text-neon-blue font-medium">{log.action}</span>
                          {log.path && <p className="text-[10px] text-white/20">Path: {log.path}</p>}
                        </td>
                        <td className="py-4 px-4 text-white/60 font-mono text-xs">
                          {log.ip || 'N/A'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-[10px] text-white/40 space-y-0.5">
                            <p>Res: {log.resolution || 'N/A'}</p>
                            <p className="truncate max-w-[200px]" title={log.userAgent}>UA: {log.userAgent}</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {activityLogs.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-white/20">
                    <ClipboardList size={48} className="mb-4" />
                    <p>No activity logs found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-display font-bold text-white mb-2">Theme Management</h3>
                <p className="text-sm text-white/40">Control the global colors of your application. Changes are applied instantly to all users.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Brand & Accent Colors */}
                <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette size={18} className="text-neon-blue" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Brand & Accent</h4>
                  </div>
                  
                  {[
                    { label: 'Neon Blue', key: 'neonBlue' },
                    { label: 'Neon Purple', key: 'neonPurple' },
                    { label: 'Neon Pink', key: 'neonPink' },
                    { label: 'Neon Magenta', key: 'neonMagenta' },
                    { label: 'Accent Color', key: 'accentColor' },
                  ].map((item) => (
                    <div key={item.key} className="space-y-2">
                      <label className="text-xs text-white/60 flex justify-between">
                        {item.label}
                        <span className="text-[10px] font-mono text-white/20">{(theme as any)[item.key]}</span>
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={(theme as any)[item.key]}
                          onChange={(e) => updateTheme({ [item.key]: e.target.value })}
                          className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={(theme as any)[item.key]}
                          onChange={(e) => updateTheme({ [item.key]: e.target.value })}
                          className="flex-grow bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white outline-none focus:border-white/30"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Surface & Text Colors */}
                <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Layout size={18} className="text-neon-purple" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Surface & Text</h4>
                  </div>

                  {[
                    { label: 'Background', key: 'darkBg' },
                    { label: 'Card Background', key: 'darkCard' },
                    { label: 'Border Color', key: 'darkBorder' },
                    { label: 'Primary Text', key: 'textPrimary' },
                    { label: 'Secondary Text', key: 'textSecondary' },
                  ].map((item) => (
                    <div key={item.key} className="space-y-2">
                      <label className="text-xs text-white/60 flex justify-between">
                        {item.label}
                        <span className="text-[10px] font-mono text-white/20">{(theme as any)[item.key]}</span>
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={(theme as any)[item.key]}
                          onChange={(e) => updateTheme({ [item.key]: e.target.value })}
                          className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={(theme as any)[item.key]}
                          onChange={(e) => updateTheme({ [item.key]: e.target.value })}
                          className="flex-grow bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white outline-none focus:border-white/30"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Functional Colors */}
                <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={18} className="text-yellow-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Functional</h4>
                  </div>

                  {[
                    { label: 'Success', key: 'successColor' },
                    { label: 'Error', key: 'errorColor' },
                    { label: 'Warning', key: 'warningColor' },
                    { label: 'Info', key: 'infoColor' },
                  ].map((item) => (
                    <div key={item.key} className="space-y-2">
                      <label className="text-xs text-white/60 flex justify-between">
                        {item.label}
                        <span className="text-[10px] font-mono text-white/20">{(theme as any)[item.key]}</span>
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={(theme as any)[item.key]}
                          onChange={(e) => updateTheme({ [item.key]: e.target.value })}
                          className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={(theme as any)[item.key]}
                          onChange={(e) => updateTheme({ [item.key]: e.target.value })}
                          className="flex-grow bg-white/5 border border-white/10 rounded-lg px-3 text-sm text-white outline-none focus:border-white/30"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="pt-10">
                    <button 
                      onClick={() => {
                        setConfirmAction({
                          title: 'Reset Theme',
                          message: 'Are you sure you want to reset all colors to default?',
                          onConfirm: async () => {
                            await resetTheme();
                            setConfirmAction(null);
                            setToast({ message: 'Theme reset to default!', type: 'success' });
                          }
                        });
                      }}
                      className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCcw size={14} />
                      Reset to Defaults
                    </button>
                  </div>
                </div>

                {/* Watermark Settings */}
                <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Type size={18} className="text-neon-pink" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">Watermark</h4>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-white/60">Text Content</label>
                    <input 
                      type="text" 
                      value={theme.watermarkText}
                      onChange={(e) => updateTheme({ watermarkText: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-white/60 flex justify-between">
                      Opacity
                      <span>{Math.round(theme.watermarkOpacity * 100)}%</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="0.5" 
                      step="0.01"
                      value={theme.watermarkOpacity}
                      onChange={(e) => updateTheme({ watermarkOpacity: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-pink"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-white/60 flex justify-between">
                      Rotation
                      <span>{theme.watermarkRotate}°</span>
                    </label>
                    <input 
                      type="range" 
                      min="-90" 
                      max="90" 
                      step="1"
                      value={theme.watermarkRotate}
                      onChange={(e) => updateTheme({ watermarkRotate: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-pink"
                    />
                  </div>
                  <div className="pt-4 border-t border-white/10">
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'groups' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-grow max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search groups..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-neon-blue outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => addNew('group')}
                  className="btn-neon bg-neon-blue text-black px-6 py-2 flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus size={20} />
                  Add Group
                </button>
              </div>

              <div className="grid gap-4">
                {groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase())).map((group) => (
                  <motion.div 
                    key={group.id}
                    layout
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-neon-blue/50 transition-all group gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue shrink-0">
                        <Globe size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-medium text-white break-words">{group.name}</h3>
                        <p className="text-xs text-white/40 truncate">{group.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      {group.password && (
                        <div className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold uppercase tracking-widest bg-yellow-400/10 px-2 py-1 rounded-full">
                          <Lock size={10} />
                          Locked
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(group, 'group')}
                          className="p-2 text-white/60 hover:text-neon-blue hover:bg-neon-blue/10 rounded-lg transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete('group', group.id, group.name)}
                          className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'site' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Site Control</h2>
                  <p className="text-sm text-white/40">Manage global website settings and security.</p>
                </div>
                <Globe size={32} className="text-neon-blue" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Site Identity */}
                <div className="space-y-6 p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Layout size={20} className="text-neon-blue" />
                    Site Identity
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60 uppercase tracking-widest">Site Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Study-hub"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all"
                        value={siteConfig?.siteName || ''}
                        onChange={(e) => saveSiteConfig({ siteName: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60 uppercase tracking-widest">Admin Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Vijay Ninama"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all"
                        value={siteConfig?.adminName || ''}
                        onChange={(e) => saveSiteConfig({ adminName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60 uppercase tracking-widest">Co-owner Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Tilak Sahu"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all"
                        value={siteConfig?.coOwnerName || ''}
                        onChange={(e) => saveSiteConfig({ coOwnerName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60 uppercase tracking-widest">Hero Tagline</label>
                      <textarea 
                        rows={2}
                        placeholder="The Future of Learning is Here."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all resize-none"
                        value={siteConfig?.siteSubtitle || ''}
                        onChange={(e) => saveSiteConfig({ siteSubtitle: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* App Features & Support */}
                <div className="space-y-6 p-6 bg-white/5 border border-white/10 rounded-2xl">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Zap size={20} className="text-yellow-400" />
                    App Controls & Status
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {/* Maintenance Mode */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${siteConfig?.maintenanceMode ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-green-500 text-white'}`}>
                              {siteConfig?.maintenanceMode ? <Lock size={20} /> : <Unlock size={20} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">Maintenance Mode</p>
                              <p className="text-[10px] text-white/40">Only admins can view the platform</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ maintenanceMode: !siteConfig?.maintenanceMode })}
                            className={`w-12 h-6 rounded-full transition-all relative ${siteConfig?.maintenanceMode ? 'bg-red-500' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.maintenanceMode ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>
                        
                        {siteConfig?.maintenanceMode && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="px-4 pb-4"
                          >
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Custom Maintenance Message</label>
                            <textarea 
                              value={siteConfig?.maintenanceMessage || ''}
                              onChange={(e) => saveSiteConfig({ maintenanceMessage: e.target.value })}
                              placeholder="e.g., We are upgrading our servers..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-red-500 transition-all min-h-[80px]"
                            />
                          </motion.div>
                        )}
                      </div>

                      {/* Registration Toggle */}
                      <div className="flex items-center justify-between p-4 bg-neon-purple/5 border border-neon-purple/20 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-neon-purple/20 text-neon-purple">
                            <UserPlus size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Student Registration</p>
                            <p className="text-[10px] text-white/40">Allow new students to join</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => saveSiteConfig({ registrationEnabled: siteConfig?.registrationEnabled === false ? true : false })}
                          className={`w-12 h-6 rounded-full transition-all relative ${siteConfig?.registrationEnabled !== false ? 'bg-neon-purple' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.registrationEnabled !== false ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>

                      {/* Leaderboard Toggle */}
                      <div className="flex items-center justify-between p-4 bg-yellow-400/5 border border-yellow-400/20 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-yellow-400/20 text-yellow-400">
                            <Trophy size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Public Leaderboard</p>
                            <p className="text-[10px] text-white/40">Show top students publicly</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => saveSiteConfig({ leaderboardVisible: siteConfig?.leaderboardVisible === false ? true : false })}
                          className={`w-12 h-6 rounded-full transition-all relative ${siteConfig?.leaderboardVisible !== false ? 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]' : 'bg-white/10'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.leaderboardVisible !== false ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>

                      {/* Alert Duration Control */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-neon-blue/5 border border-neon-blue/20 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-neon-blue/20 text-neon-blue">
                               <Bell size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-white">Alert Duration (Seconds)</p>
                               <p className="text-[10px] text-white/40">How long alerts stay on screen</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1 border border-white/10">
                            <input 
                               type="number"
                               min="1"
                               max="60"
                               className="w-12 bg-transparent text-white text-center font-bold outline-none"
                               value={siteConfig?.notificationDuration || 5}
                               onChange={(e) => saveSiteConfig({ notificationDuration: parseInt(e.target.value) || 5 })}
                            />
                            <span className="text-[10px] text-white/20 font-bold uppercase">SEC</span>
                          </div>
                        </div>
                      </div>

                      {/* Global Maintenance Mode */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/20 text-red-500">
                              <Shield size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">Maintenance Mode</p>
                              <p className="text-[10px] text-white/40">Lock site for everyone except admins</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ maintenanceMode: !siteConfig?.maintenanceMode })}
                            className={`w-12 h-6 rounded-full transition-all relative ${siteConfig?.maintenanceMode ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.maintenanceMode ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>
                        
                        {siteConfig?.maintenanceMode && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="px-4 pb-4 space-y-3"
                          >
                            <div>
                              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Maintenance Message</label>
                              <textarea 
                                value={siteConfig?.maintenanceMessage || ''}
                                onChange={(e) => saveSiteConfig({ maintenanceMessage: e.target.value })}
                                placeholder="Website is under maintenance. We will be back soon!"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-red-500 transition-all min-h-[60px]"
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Global Announcement Bar */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-neon-blue/5 border border-neon-blue/20 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-neon-blue/20 text-neon-blue">
                              <Bell size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">Global Announcement Bar</p>
                              <p className="text-[10px] text-white/40">Show marquee at top of site</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ showAnnouncement: !siteConfig?.showAnnouncement })}
                            className={`w-12 h-6 rounded-full transition-all relative ${siteConfig?.showAnnouncement ? 'bg-neon-blue shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.showAnnouncement ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>
                        
                        {siteConfig?.showAnnouncement && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="px-4 pb-4 space-y-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Announcement Text</label>
                                <textarea 
                                  value={siteConfig?.announcementText || ''}
                                  onChange={(e) => saveSiteConfig({ announcementText: e.target.value })}
                                  placeholder="Important: Website is now live!"
                                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-neon-blue transition-all min-h-[60px]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1 block">Banner Color (Hex)</label>
                                <div className="flex gap-2">
                                  <input 
                                    type="text"
                                    value={siteConfig?.announcementColor || '#00E5FF'}
                                    onChange={(e) => saveSiteConfig({ announcementColor: e.target.value })}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-neon-blue transition-all"
                                  />
                                  <div 
                                    className="w-12 h-12 rounded-xl border border-white/10"
                                    style={{ backgroundColor: siteConfig?.announcementColor || '#00E5FF' }}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Feature Toggles Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search Enable */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-white/40"><Search size={18} /></div>
                            <span className="text-xs font-bold text-white/80">Search Bar</span>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ searchEnabled: siteConfig?.searchEnabled === false ? true : false })}
                            className={`w-10 h-5 rounded-full relative transition-all ${siteConfig?.searchEnabled !== false ? 'bg-neon-blue' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.searchEnabled !== false ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        {/* Games Tab Enable */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-white/40"><Gamepad2 size={18} /></div>
                            <span className="text-xs font-bold text-white/80">Games Tab</span>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ gamesEnabled: siteConfig?.gamesEnabled === false ? true : false })}
                            className={`w-10 h-5 rounded-full relative transition-all ${siteConfig?.gamesEnabled !== false ? 'bg-neon-blue' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.gamesEnabled !== false ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        {/* Study Timer Enable */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-white/40"><Clock size={18} /></div>
                            <span className="text-xs font-bold text-white/80">Study Timer</span>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ studyTimerEnabled: !siteConfig?.studyTimerEnabled })}
                            className={`w-10 h-5 rounded-full relative transition-all ${siteConfig?.studyTimerEnabled ? 'bg-neon-blue' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.studyTimerEnabled ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        {/* Leaderboard Enable */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-white/40"><Trophy size={18} /></div>
                            <span className="text-xs font-bold text-white/80">Global Leaderboard</span>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ globalLeaderboardEnabled: !siteConfig?.globalLeaderboardEnabled })}
                            className={`w-10 h-5 rounded-full relative transition-all ${siteConfig?.globalLeaderboardEnabled ? 'bg-neon-blue' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.globalLeaderboardEnabled ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        {/* Guest Mode Enable */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-white/40"><UserPlus size={18} /></div>
                            <span className="text-xs font-bold text-white/80">Guest Mode</span>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ guestModeEnabled: !siteConfig?.guestModeEnabled })}
                            className={`w-10 h-5 rounded-full relative transition-all ${siteConfig?.guestModeEnabled ? 'bg-neon-blue' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.guestModeEnabled ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        {/* Verify User Email */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-white/40"><Shield size={18} /></div>
                            <span className="text-xs font-bold text-white/80">Verify Email</span>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ verifyUserEmail: !siteConfig?.verifyUserEmail })}
                            className={`w-10 h-5 rounded-full relative transition-all ${siteConfig?.verifyUserEmail ? 'bg-neon-blue' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.verifyUserEmail ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>

                         {/* Waterfall Enable */}
                         <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-white/40"><FileText size={18} /></div>
                            <span className="text-xs font-bold text-white/80">PDF Watermark</span>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ watermarkEnabled: !siteConfig?.watermarkEnabled })}
                            className={`w-10 h-5 rounded-full relative transition-all ${siteConfig?.watermarkEnabled ? 'bg-neon-blue' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.watermarkEnabled ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        {/* WhatsApp Support Toggle */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-white/40"><Smartphone size={18} /></div>
                            <span className="text-xs font-bold text-white/80">WA Support</span>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ supportWhatsApp: siteConfig?.supportWhatsApp ? '' : '910000000000' })}
                            className={`w-10 h-5 rounded-full relative transition-all ${siteConfig?.supportWhatsApp ? 'bg-neon-blue' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.supportWhatsApp ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        {/* Show Footer Credit */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-white/40"><Info size={18} /></div>
                            <span className="text-xs font-bold text-white/80">Footer Credit</span>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ showFooterCredit: siteConfig?.showFooterCredit !== false })}
                            className={`w-10 h-5 rounded-full relative transition-all ${siteConfig?.showFooterCredit !== false ? 'bg-neon-blue' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.showFooterCredit !== false ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>

                        {/* Auto Approve Users */}
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-white/40"><Shield size={18} /></div>
                            <span className="text-xs font-bold text-white/80">Auto-Approve</span>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ autoApproveUsers: siteConfig?.autoApproveUsers === true })}
                            className={`w-10 h-5 rounded-full relative transition-all ${siteConfig?.autoApproveUsers === true ? 'bg-neon-blue' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.autoApproveUsers === true ? 'right-0.5' : 'left-0.5'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Custom Watermark & WA Support Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {siteConfig?.watermarkEnabled && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 leading-relaxed">Watermark Text</label>
                            <input 
                              type="text" 
                              value={siteConfig?.watermarkText || 'Study-Hub'}
                              onChange={(e) => saveSiteConfig({ watermarkText: e.target.value })}
                              placeholder="Overlay text..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-neon-blue"
                            />
                          </div>
                        )}
                        {siteConfig?.supportWhatsApp && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 leading-relaxed">WhatsApp Number</label>
                            <input 
                              type="text" 
                              value={siteConfig?.supportWhatsApp || ''}
                              onChange={(e) => saveSiteConfig({ supportWhatsApp: e.target.value })}
                              placeholder="91xxxxxxxxxx"
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-neon-blue"
                            />
                          </div>
                        )}
                      </div>

                      {/* Custom Footer Credit */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 leading-relaxed">Custom Footer Message</label>
                        <input 
                          type="text" 
                          value={siteConfig?.customFooterText || ''}
                          onChange={(e) => saveSiteConfig({ customFooterText: e.target.value })}
                          placeholder="Proudly made by Tagore Team..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-neon-blue"
                        />
                      </div>

                      {/* Logo & Favicon Customization */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-xs font-medium text-white/60 uppercase tracking-widest leading-relaxed">Logo URL (Optional)</label>
                           <input 
                             type="text" 
                             className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all text-sm"
                             value={siteConfig?.logoUrl || ''}
                             onChange={(e) => saveSiteConfig({ logoUrl: e.target.value })}
                             placeholder="https://..."
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-medium text-white/60 uppercase tracking-widest leading-relaxed">Favicon URL (Optional)</label>
                           <input 
                             type="text" 
                             className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all text-sm"
                             value={siteConfig?.faviconUrl || ''}
                             onChange={(e) => saveSiteConfig({ faviconUrl: e.target.value })}
                             placeholder="https://..."
                           />
                        </div>
                      </div>

                      {/* Pinned Scholars on Leaderboard */}
                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-yellow-400/20 text-yellow-400">
                            <Crown size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Pinned Scholars</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Managed Top 10 List (Global)</p>
                          </div>
                        </div>

                        <div className="glass-card p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Select Student</label>
                              <select 
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-yellow-400 appearance-none"
                                value={pinUserId}
                                onChange={(e) => setPinUserId(e.target.value)}
                              >
                                <option value="" className="bg-dark-bg">Choose a student...</option>
                                {users.filter(u => u.name && u.role === 'student' && u.email?.toLowerCase() !== 'vijayninama683@gmail.com').map(u => (
                                  <option key={u.uid} value={u.uid} className="bg-dark-bg">{u.name} ({u.email?.split('@')[0]})</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Duration (Hours)</label>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number"
                                  min="1"
                                  className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-yellow-400"
                                  value={pinDuration}
                                  onChange={(e) => setPinDuration(e.target.value)}
                                />
                                <span className="text-[10px] text-white/20 font-bold">HRS</span>
                              </div>
                            </div>
                            <div className="flex items-end">
                              <button 
                                disabled={!pinUserId}
                                onClick={() => {
                                  const user = users.find(u => u.uid === pinUserId);
                                  if (!user) return;
                                  const hours = parseInt(pinDuration) || 24;
                                  const expiresAt = new Date(Date.now() + hours * 3600000);
                                  const newPinned = [...(siteConfig?.pinnedEntries || [])];
                                  newPinned.push({
                                    uid: user.uid,
                                    name: user.name || 'Scholar',
                                    expiresAt: expiresAt
                                  });
                                  saveSiteConfig({ pinnedEntries: newPinned });
                                  setPinUserId('');
                                  setToast({ message: `${user.name} pinned for ${hours} hours!`, type: 'success' });
                                }}
                                className="w-full bg-yellow-400 text-black font-bold h-[38px] rounded-xl hover:shadow-[0_0_15px_rgba(250,204,21,0.4)] transition-all disabled:opacity-50 text-xs uppercase"
                              >
                                Add to Pinned
                              </button>
                            </div>
                          </div>

                          {/* List of currently pinned */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                            {(siteConfig?.pinnedEntries || []).map((entry, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                                <div className="flex items-center gap-3">
                                   <Crown size={14} className="text-yellow-400" />
                                   <div>
                                     <p className="text-xs font-bold text-white truncate max-w-[150px]">{entry.name}</p>
                                     <p className="text-[10px] text-white/40">Expires: {new Date(entry.expiresAt?.seconds ? entry.expiresAt.seconds * 1000 : entry.expiresAt).toLocaleString()}</p>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => {
                                    const newPinned = siteConfig?.pinnedEntries?.filter((_, i) => i !== idx);
                                    saveSiteConfig({ pinnedEntries: newPinned });
                                  }}
                                  className="p-1.5 text-white/20 hover:text-red-500 transition-colors"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            {(siteConfig?.pinnedEntries || []).length === 0 && (
                              <div className="sm:col-span-2 text-center py-4 text-white/10 italic text-[10px] uppercase tracking-widest">
                                No scholars currently pinned
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* System Optimization Controls */}
                      <div className="pt-4 border-t border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">System Optimization</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 leading-relaxed">Theme Mode</label>
                            <select 
                              value={siteConfig?.defaultThemeMode || 'dark'}
                              onChange={(e) => saveSiteConfig({ defaultThemeMode: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-neon-blue appearance-none"
                            >
                              <option value="dark" className="bg-zinc-900">Always Dark</option>
                              <option value="light" className="bg-zinc-900">Always Light</option>
                              <option value="auto" className="bg-zinc-900">Auto (System)</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 leading-relaxed">BG Effect</label>
                            <select 
                              value={siteConfig?.bgEffect || 'none'}
                              onChange={(e) => saveSiteConfig({ bgEffect: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-neon-blue appearance-none"
                            >
                              <option value="none" className="bg-zinc-900">None</option>
                              <option value="snow" className="bg-zinc-900">Snow Effect</option>
                              <option value="confetti" className="bg-zinc-900">Confetti Rain</option>
                              <option value="stars" className="bg-zinc-900">Star Twinkle</option>
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 leading-relaxed">Time Multiplier</label>
                            <input 
                              type="number" 
                              step="0.1"
                              min="0.5"
                              max="2.0"
                              value={siteConfig?.testTimeMultiplier || 1.0}
                              onChange={(e) => saveSiteConfig({ testTimeMultiplier: parseFloat(e.target.value) })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-neon-blue"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 leading-relaxed">Terms URL</label>
                            <input 
                              type="text" 
                              value={siteConfig?.termsUrl || ''}
                              onChange={(e) => saveSiteConfig({ termsUrl: e.target.value })}
                              placeholder="https://example.com/terms"
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-neon-blue"
                            />
                           </div>
                           <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 leading-relaxed">Privacy URL</label>
                            <input 
                              type="text" 
                              value={siteConfig?.privacyUrl || ''}
                              onChange={(e) => saveSiteConfig({ privacyUrl: e.target.value })}
                              placeholder="https://example.com/privacy"
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-neon-blue"
                            />
                           </div>
                        </div>

                        {/* Social Links Extension */}
                        <div className="pt-4 border-t border-white/5 space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Social & Community</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 leading-relaxed">Instagram</label>
                              <input 
                                type="text" 
                                value={siteConfig?.socialInstagram || ''}
                                onChange={(e) => saveSiteConfig({ socialInstagram: e.target.value })}
                                placeholder="@username"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-neon-pink"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 leading-relaxed">Facebook</label>
                              <input 
                                type="text" 
                                value={siteConfig?.socialFacebook || ''}
                                onChange={(e) => saveSiteConfig({ socialFacebook: e.target.value })}
                                placeholder="fb.com/page"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 leading-relaxed">Support WhatsApp</label>
                              <input 
                                type="text" 
                                value={siteConfig?.supportWhatsApp || ''}
                                onChange={(e) => saveSiteConfig({ supportWhatsApp: e.target.value })}
                                placeholder="+91 00000 00000"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-emerald-500"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1 leading-relaxed">Support Telegram</label>
                              <input 
                                type="text" 
                                value={siteConfig?.supportTelegram || ''}
                                onChange={(e) => saveSiteConfig({ supportTelegram: e.target.value })}
                                placeholder="@channel"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-neon-blue"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Advanced Integrations */}
                        <div className="pt-4 border-t border-white/5 space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Advanced Integrations</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-3">
                              <h5 className="text-[10px] uppercase font-bold text-neon-blue">EmailJS Configuration</h5>
                              <div className="space-y-2">
                                <input 
                                  type="text" 
                                  placeholder="Service ID"
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white outline-none focus:border-neon-blue"
                                  value={siteConfig?.emailjsServiceId || ''}
                                  onChange={(e) => saveSiteConfig({ emailjsServiceId: e.target.value })}
                                />
                                <input 
                                  type="text" 
                                  placeholder="Template ID"
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white outline-none focus:border-neon-blue"
                                  value={siteConfig?.emailjsTemplateId || ''}
                                  onChange={(e) => saveSiteConfig({ emailjsTemplateId: e.target.value })}
                                />
                                <input 
                                  type="password" 
                                  placeholder="Public Key"
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white outline-none focus:border-neon-blue"
                                  value={siteConfig?.emailjsPublicKey || ''}
                                  onChange={(e) => saveSiteConfig({ emailjsPublicKey: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h5 className="text-[10px] uppercase font-bold text-red-400 font-black">Security & Banning</h5>
                              <div className="space-y-2">
                                <label className="text-[10px] text-white/40 uppercase">Banned IP List (Comma separated)</label>
                                <textarea 
                                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white outline-none focus:border-red-500 min-h-[60px]"
                                  placeholder="192.168.1.1, 10.0.0.1"
                                  value={siteConfig?.bannedIps?.join(', ') || ''}
                                  onChange={(e) => saveSiteConfig({ bannedIps: e.target.value.split(',').map(ip => ip.trim()).filter(Boolean) })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isSuperAdmin && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-white/20">Legacy Master Key</label>
                          <input 
                            type="text" 
                            placeholder="Default: Vijay1987"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-neon-blue"
                            value={siteConfig?.secretLoginKey || ''}
                            onChange={(e) => saveSiteConfig({ secretLoginKey: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-white/20">Legacy Master Password (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="Add pass for legacy key"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-neon-blue"
                            value={siteConfig?.secretLoginPassword || ''}
                            onChange={(e) => saveSiteConfig({ secretLoginPassword: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {isSuperAdmin && (
                      <div className="pt-4 border-t border-white/5 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-neon-pink/5 border border-neon-pink/20 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-neon-pink/20 text-neon-pink">
                              <Shield size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-white">Multi-Secret Access System</p>
                               <p className="text-[10px] text-white/40">Manage multiple access codes with custom permissions</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ secretLoginEnabled: !siteConfig?.secretLoginEnabled })}
                            className={`w-12 h-6 rounded-full transition-all relative ${siteConfig?.secretLoginEnabled !== false ? 'bg-neon-pink' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.secretLoginEnabled !== false ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/10 text-white/40">
                              <Eye size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-white">Show Secret Login Entry</p>
                               <p className="text-[10px] text-white/40">Show the "©" clickable link in the footer</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ showSecretLoginEntry: !siteConfig?.showSecretLoginEntry })}
                            className={`w-12 h-6 rounded-full transition-all relative ${siteConfig?.showSecretLoginEntry !== false ? 'bg-neon-blue' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.showSecretLoginEntry !== false ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/10 text-white/40">
                              <LayoutDashboard size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-white">Show Dashboard Link</p>
                               <p className="text-[10px] text-white/40">Show "Dashboard" in Navbar for secret login users</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => saveSiteConfig({ showDashboardLinkForSecret: !siteConfig?.showDashboardLinkForSecret })}
                            className={`w-12 h-6 rounded-full transition-all relative ${siteConfig?.showDashboardLinkForSecret !== false ? 'bg-neon-blue' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${siteConfig?.showDashboardLinkForSecret !== false ? 'right-1' : 'left-1'}`} />
                          </button>
                        </div>

                        {siteConfig?.secretLoginEnabled !== false && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5"
                          >
                            {/* Manage Secret Profiles */}
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-white/60">Access Profiles</h4>
                                <button 
                                  onClick={() => {
                                    const next = [...(siteConfig?.secretProfiles || [])];
                                    next.push({ 
                                      id: Date.now().toString(), 
                                      label: 'New Code', 
                                      key: 'Vijay' + Math.floor(Math.random() * 9000 + 1000), 
                                      password: '',
                                      enabled: true,
                                      allowedTabs: ['chapters', 'chapterTests'] 
                                    });
                                    saveSiteConfig({ secretProfiles: next });
                                  }}
                                  className="text-[10px] font-bold uppercase tracking-widest text-neon-blue hover:text-white transition-colors flex items-center gap-1"
                                >
                                  <Plus size={12} /> Add New Profile
                                </button>
                              </div>
                              <div className="space-y-3">
                                    {(siteConfig?.secretProfiles || []).map((profile: any, pIdx: number) => (
                                      <div key={profile.id} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                          <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-white/20">Label</label>
                                            <input 
                                              type="text"
                                              value={profile.label}
                                              onChange={(e) => {
                                                const next = [...siteConfig.secretProfiles];
                                                next[pIdx].label = e.target.value;
                                                saveSiteConfig({ secretProfiles: next });
                                              }}
                                              className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:border-neon-pink outline-none"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-white/20">Secret Key (User)</label>
                                            <input 
                                              type="text"
                                              value={profile.key}
                                              onChange={(e) => {
                                                const next = [...siteConfig.secretProfiles];
                                                next[pIdx].key = e.target.value;
                                                saveSiteConfig({ secretProfiles: next });
                                              }}
                                              className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white font-mono focus:border-neon-pink outline-none"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[10px] uppercase font-bold text-white/20">Password</label>
                                            <input 
                                              type="text"
                                              placeholder="Required to login"
                                              value={profile.password || ''}
                                              onChange={(e) => {
                                                const next = [...siteConfig.secretProfiles];
                                                next[pIdx].password = e.target.value;
                                                saveSiteConfig({ secretProfiles: next });
                                              }}
                                              className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 px-3 text-xs text-white focus:border-neon-pink outline-none"
                                            />
                                          </div>
                                          <div className="flex-grow pt-4">
                                             <button 
                                               onClick={() => {
                                                 const next = [...siteConfig.secretProfiles];
                                                 next[pIdx].showDashboardLink = !next[pIdx].showDashboardLink;
                                                 saveSiteConfig({ secretProfiles: next });
                                               }}
                                               className={`w-full py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all border ${profile.showDashboardLink ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' : 'bg-white/5 border-white/10 text-white/20'}`}
                                             >
                                               {profile.showDashboardLink ? 'Dashboard Link ON' : 'Dashboard Link OFF'}
                                             </button>
                                          </div>
                                          <div className="flex items-center justify-between gap-2 pt-5">
                                            <div className="flex items-center gap-2">
                                              <button 
                                                onClick={() => {
                                                  const next = [...siteConfig.secretProfiles];
                                                  next[pIdx].enabled = !next[pIdx].enabled;
                                                  saveSiteConfig({ secretProfiles: next });
                                                }}
                                                className={`w-10 h-5 rounded-full transition-all relative ${profile.enabled !== false ? 'bg-emerald-500' : 'bg-red-500/20'}`}
                                              >
                                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${profile.enabled !== false ? 'right-0.5' : 'left-0.5'}`} />
                                              </button>
                                              <span className="text-[10px] font-bold text-white/40 uppercase">{profile.enabled !== false ? 'Active' : 'Disabled'}</span>
                                            </div>
                                            <button 
                                              onClick={() => {
                                                const next = siteConfig.secretProfiles.filter((_: any, i: number) => i !== pIdx);
                                                saveSiteConfig({ secretProfiles: next });
                                              }}
                                              className="p-1.5 text-white/20 hover:text-red-500 transition-colors"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          </div>
                                        </div>

                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                          <label className="text-[10px] uppercase font-bold text-white/20">Permissions</label>
                                          <div className="flex flex-wrap gap-2">
                                            {[
                                              { id: 'chapters', label: 'Chapters' },
                                              { id: 'chapterTests', label: 'Chapter MCQs' },
                                              { id: 'classes', label: 'Classes' },
                                              { id: 'subjects', label: 'Subjects' },
                                              { id: 'users', label: 'Users' },
                                              { id: 'groups', label: 'Groups' },
                                              { id: 'ratings', label: 'Ratings' },
                                              { id: 'comments', label: 'Comments' },
                                              { id: 'tests', label: 'Tests' },
                                              { id: 'results', label: 'Results' },
                                              { id: 'stats', label: 'Stats' },
                                              { id: 'logs', label: 'Logs' },
                                              { id: 'site', label: 'Site settings' },
                                              { id: 'notifications', label: 'News' },
                                              { id: 'userMessages', label: 'User Messages' },
                                              { id: 'theme', label: 'Theme' }
                                            ].map(tab => (
                                              <button
                                                key={tab.id}
                                                onClick={() => {
                                                  const next = [...siteConfig.secretProfiles];
                                                  const currentTabs = profile.allowedTabs || [];
                                                  next[pIdx].allowedTabs = currentTabs.includes(tab.id)
                                                    ? currentTabs.filter((t: string) => t !== tab.id)
                                                    : [...currentTabs, tab.id];
                                                  saveSiteConfig({ secretProfiles: next });
                                                }}
                                                className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                                  (profile.allowedTabs || []).includes(tab.id)
                                                  ? 'bg-neon-pink text-white shadow-[0_0_10px_rgba(255,0,229,0.3)]'
                                                  : 'bg-white/5 text-white/30 hover:bg-white/10'
                                                }`}
                                              >
                                                {tab.label}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    ))}

                                {(siteConfig?.secretProfiles || []).length === 0 && (
                                  <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                    <p className="text-white/20 text-xs italic">No secondary codes created yet.</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-white/5">
                              <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1">Legacy Global Secret Key (Backward Compatibility)</label>
                              <input 
                                type="text"
                                placeholder="e.g. SecretPassword123"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white focus:border-neon-pink outline-none transition-all font-mono"
                                value={siteConfig?.secretLoginKey || ''}
                                onChange={(e) => saveSiteConfig({ secretLoginKey: e.target.value })}
                              />
                            </div>

                            <div className="space-y-3">
                              <label className="text-[10px] uppercase tracking-widest font-bold text-white/40 mb-1">Legacy Permissions (For Legacy Key)</label>
                              <div className="grid grid-cols-2 gap-2">
                                {[
                                  { id: 'chapters', label: 'Chapters' },
                                  { id: 'chapterTests', label: 'Chapter MCQs' },
                                  { id: 'classes', label: 'Classes' },
                                  { id: 'subjects', label: 'Subjects' },
                                  { id: 'users', label: 'Users' },
                                  { id: 'groups', label: 'Groups' },
                                  { id: 'ratings', label: 'Ratings' },
                                  { id: 'comments', label: 'Comments' },
                                  { id: 'tests', label: 'Tests' },
                                  { id: 'results', label: 'Results' },
                                  { id: 'stats', label: 'Stats' },
                                  { id: 'logs', label: 'Logs' },
                                  { id: 'site', label: 'Site Control' },
                                  { id: 'news', label: 'News Manager' },
                                  { id: 'notifications', label: 'Notifications' },
                                  { id: 'theme', label: 'Theme' }
                                ].map(tab => (
                                  <label key={tab.id} className="flex items-center gap-2 cursor-pointer group">
                                    <input 
                                      type="checkbox"
                                      className="hidden"
                                      checked={siteConfig?.limitedAdminTabs ? siteConfig.limitedAdminTabs.includes(tab.id) : ['chapters', 'chapterTests'].includes(tab.id)}
                                      onChange={() => {
                                        const current = siteConfig?.limitedAdminTabs || ['chapters', 'chapterTests'];
                                        const next = current.includes(tab.id) 
                                          ? current.filter((t: string) => t !== tab.id)
                                          : [...current, tab.id];
                                        saveSiteConfig({ limitedAdminTabs: next });
                                      }}
                                    />
                                    <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                                      (siteConfig?.limitedAdminTabs ? siteConfig.limitedAdminTabs.includes(tab.id) : ['chapters', 'chapterTests'].includes(tab.id))
                                      ? 'bg-neon-pink border-neon-pink' 
                                      : 'border-white/20 group-hover:border-white/40'
                                    }`}>
                                      {(siteConfig?.limitedAdminTabs ? siteConfig.limitedAdminTabs.includes(tab.id) : ['chapters', 'chapterTests'].includes(tab.id)) && <CheckCircle2 size={10} />}
                                    </div>
                                    <span className="text-xs text-white/40 group-hover:text-white transition-colors">{tab.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Social & Contact */}
                <div className="space-y-6 p-6 bg-white/5 border border-white/10 rounded-2xl lg:col-span-2">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <MessageSquare size={20} className="text-emerald-400" />
                    Contact & Social Links
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60 uppercase tracking-widest">WhatsApp Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. +91 9876543210"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500 outline-none transition-all"
                        value={siteConfig?.supportWhatsApp || ''}
                        onChange={(e) => saveSiteConfig({ supportWhatsApp: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60 uppercase tracking-widest">Telegram Link</label>
                      <input 
                        type="text" 
                        placeholder="https://t.me/yourgroup"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all"
                        value={siteConfig?.supportTelegram || ''}
                        onChange={(e) => saveSiteConfig({ supportTelegram: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-white/60 uppercase tracking-widest">Support Email</label>
                      <input 
                        type="email" 
                        placeholder="support@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-pink outline-none transition-all"
                        value={siteConfig?.supportEmail || ''}
                        onChange={(e) => saveSiteConfig({ supportEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'userMessages' && (
            <div className="space-y-8">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">Targeted User Messaging</h2>
                  <p className="text-sm text-white/40">Send private messages that appear on a specific user's screen when they come online.</p>
                </div>
                <button 
                  onClick={() => setIsAddingUserMsg(true)}
                  className="btn-neon bg-orange-500 text-white px-8 py-3 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                >
                  <Plus size={20} />
                  New Targeted Message
                </button>
              </div>

              {isAddingUserMsg && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Target User</label>
                       <select 
                         className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500 appearance-none"
                         value={newUserMsg.userId}
                         onChange={(e) => setNewUserMsg({ ...newUserMsg, userId: e.target.value })}
                       >
                         <option value="" className="bg-zinc-900">Select a target...</option>
                          <option value="all" className="bg-zinc-900 border-b border-white/10 text-orange-500 font-bold">📢 ALL USERS (Broadcast Alert)</option>
                         {users.map(u => (
                           <option key={u.uid} value={u.uid} className="bg-zinc-900">{u.name || u.email} ({u.email})</option>
                         ))}
                       </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Duration (Sec)</label>
                        <input 
                          type="number"
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500"
                          value={newUserMsg.duration}
                          onChange={(e) => setNewUserMsg({ ...newUserMsg, duration: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Show Count</label>
                        <input 
                          type="number"
                          className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500"
                          value={newUserMsg.showCount}
                          onChange={(e) => setNewUserMsg({ ...newUserMsg, showCount: parseInt(e.target.value) })}
                          placeholder="Times to show after refresh"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Your Message</label>
                    <textarea 
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-orange-500 min-h-[100px] resize-none"
                      placeholder="Type your private message here..."
                      value={newUserMsg.message}
                      onChange={(e) => setNewUserMsg({ ...newUserMsg, message: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button 
                      onClick={() => setIsAddingUserMsg(false)}
                      className="px-6 py-3 rounded-xl bg-white/5 text-white/40 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddUserMessage}
                      className="px-8 py-3 rounded-xl bg-orange-500 text-white font-bold text-xs uppercase tracking-widest hover:scale-[1.02] shadow-lg"
                    >
                      Send Message
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="grid gap-4">
                {userMessages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    layout
                    className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.07] transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                        <MessageSquare size={24} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">Targeted To</span>
                          <span className="text-xs font-bold text-white uppercase tracking-widest">
                            {msg.userId === 'all' ? '📢 ALL USERS' : (users.find(u => u.uid === msg.userId)?.name || 'Unknown User')}
                          </span>
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed">{msg.message}</p>
                        <div className="flex items-center gap-4 pt-2">
                          <div className="flex items-center gap-1.5 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                            <Clock size={10} /> {msg.duration}s Duration
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-white/20 font-bold uppercase tracking-widest">
                            <RefreshCcw size={10} /> {msg.showCount} Views Remaining
                          </div>
                          <div className="text-[10px] text-white/20 font-bold underline cursor-default">
                             UID: {msg.userId}
                          </div>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteUserMessage(msg.id)}
                      className="p-3 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </motion.div>
                ))}
                {userMessages.length === 0 && (
                  <div className="h-64 flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
                    <MessageSquare size={48} className="mb-4 opacity-10" />
                    <p className="italic text-sm">No targeted messages found.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="space-y-8">
              <div className="bg-black/40 p-8 rounded-3xl border border-white/10">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400">
                    <Fingerprint size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-display font-bold text-white mb-1">Managed Identities</h2>
                    <p className="text-white/40 text-sm italic">Nuclear profile management and identity synchronization</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Selector & Identity Controls */}
                <div className="space-y-6">
                  <div className="glass-card p-6 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users size={20} className="text-indigo-400" />
                      Select Target Scholar
                    </h3>
                    
                    <div className="space-y-4">
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-indigo-500 outline-none transition-all appearance-none"
                        value={selectedIdentityUid}
                        onChange={(e) => setSelectedIdentityUid(e.target.value)}
                      >
                        <option value="" className="bg-zinc-900 text-white/40">Choose a user to manage...</option>
                        {users
                          .filter(u => u.name && u.email?.toLowerCase() !== 'vijayninama683@gmail.com')
                          .map(u => (
                          <option key={u.uid} value={u.uid} className="bg-zinc-900">
                             {u.name} ({u.email || u.uid.substring(0, 8)})
                          </option>
                        ))}
                      </select>

                      {!selectedIdentityUid ? (
                         <div className="p-12 border-2 border-dashed border-white/5 rounded-2xl text-center">
                            <ShieldAlert size={48} className="mx-auto text-white/5 mb-4" />
                            <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Select a user to unlock identity tools</p>
                         </div>
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6 pt-4"
                        >
                          {/* Profile Overview */}
                          {(() => {
                            const user = users.find(u => u.uid === selectedIdentityUid);
                            if (!user) return null;
                            return (
                              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <img 
                                  src={convertDriveUrl(user.photoURL) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                                  className="w-16 h-16 rounded-full border-2 border-indigo-500/50 object-cover" 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'S')}&background=random&color=fff`;
                                  }}
                                />
                                <div>
                                  <p className="text-lg font-bold text-white">{user.name}</p>
                                  <p className="text-xs text-white/40 font-mono">{user.email}</p>
                                  <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1">UID: {user.uid}</p>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Identity Actions */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button 
                              onClick={() => {
                                const user = users.find(u => u.uid === selectedIdentityUid);
                                if (!user) return;
                                const url = prompt('Set New Photo URL (Direct Link):', user.photoURL || '');
                                if (url !== null) {
                                  const finalUrl = convertDriveUrl(url);
                                  saveUser({ ...user, photoURL: finalUrl, photoURLOverridden: true });
                                  setToast({ message: 'Identity photo updated!', type: 'success' });
                                }
                              }}
                              className="flex flex-col items-center justify-center gap-3 p-6 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl hover:bg-indigo-600/20 transition-all group"
                            >
                              <div className="p-3 rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:scale-110 transition-transform">
                                <Image size={24} />
                              </div>
                              <span className="text-xs font-black uppercase tracking-widest">Override Photo URL</span>
                            </button>

                            <button 
                              onClick={async () => {
                                const user = users.find(u => u.uid === selectedIdentityUid);
                                if (!user) return;
                                if (confirm(`NUCLEAR RESET for ${user.name} (${user.email})?\n\nThis will DELETE:\n- ALL Activity Logs\n- ALL Quiz/Test History\n- ALL Progress Data\n\nThis is irreversible!`)) {
                                   setToast({ message: 'Executing Nuclear Reset...', type: 'info' });
                                   try {
                                      // 1. Delete Activity Logs
                                      const logSnap = await getDocs(query(collection(db, 'activityLogs'), where('userId', '==', user.uid)));
                                      await Promise.all(logSnap.docs.map(d => deleteDoc(d.ref)));

                                      // 2. Delete Test Results
                                      const resSnap = await getDocs(query(collection(db, 'testResults'), where('studentUid', '==', user.uid)));
                                      await Promise.all(resSnap.docs.map(d => deleteDoc(d.ref)));

                                      // 3. Delete Progress
                                      const progSnap = await getDocs(query(collection(db, 'userProgress'), where('userId', '==', user.uid)));
                                      await Promise.all(progSnap.docs.map(d => deleteDoc(d.ref)));

                                      // 4. Force Update Profile
                                      await saveUser({ 
                                        ...user, 
                                        totalTimeSpent: 0,
                                        pinnedToTop: false,
                                        showOnLeaderboard: true,
                                        photoURLOverridden: false,
                                        photoURL: '' // Clear photo to force re-fetch from Google
                                      });

                                      setToast({ message: 'Nuclear cleaning finished!', type: 'success' });
                                   } catch (e) {
                                      console.error(e);
                                      setToast({ message: 'Nucleus reset failed.', type: 'error' });
                                   }
                                }
                              }}
                              className="flex flex-col items-center justify-center gap-3 p-6 bg-red-600/10 border border-red-600/20 rounded-2xl hover:bg-red-600/20 transition-all group"
                            >
                              <div className="p-3 rounded-xl bg-red-600/20 text-red-500 group-hover:scale-110 transition-transform">
                                <RefreshCcw size={24} />
                              </div>
                              <span className="text-xs font-black uppercase tracking-widest text-red-500">Nuclear Data Reset</span>
                            </button>

                            <button 
                              onClick={async () => {
                                const user = users.find(u => u.uid === selectedIdentityUid);
                                if (!user) return;
                                if (confirm(`PERMANENTLY DELETE USER DOCUMENT for ${user.name}?\n\nThis will remove them from the database entirely. They will need to log in again to recreat their profile. Any logs/test results will become orphaned unless deleted first.\n\nContinue?`)) {
                                   try {
                                      await removeUser(user.uid);
                                      setSelectedIdentityUid('');
                                      setToast({ message: 'User document deleted.', type: 'success' });
                                   } catch (e) {
                                      console.error(e);
                                      setToast({ message: 'Deletion failed.', type: 'error' });
                                   }
                                }
                              }}
                              className="flex flex-col items-center justify-center gap-3 p-6 bg-red-900/10 border border-red-900/20 rounded-2xl hover:bg-red-900/30 transition-all group lg:col-span-2"
                            >
                              <div className="p-3 rounded-xl bg-red-900/20 text-red-600 group-hover:scale-110 transition-transform">
                                <Trash2 size={24} />
                              </div>
                              <span className="text-xs font-black uppercase tracking-widest text-red-600">Delete User Account Record</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Managed Profiles List */}
                <div className="space-y-6">
                   <div className="glass-card p-6">
                      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Lock size={20} className="text-indigo-400" />
                        Identity Constraints
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-indigo-600/10 border border-indigo-600/20 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Hard-Locked Profile</span>
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">tagoreteam2025@gmail.com</p>
                            <p className="text-xs text-white/40">Permanently locked to identity: <span className="text-indigo-400 font-bold">Hania Aamir</span></p>
                          </div>
                          
                          <button 
                            onClick={async () => {
                              const targetEmail = 'tagoreteam2025@gmail.com';
                              const user = users.find(u => u.email?.toLowerCase() === targetEmail);
                              if (!user) {
                                setToast({ message: 'User not found in list.', type: 'error' });
                                return;
                              }
                              if (confirm(`AUTO-FIX TAGORE TEAM account?\n\nThis will purge all logs, test history, and reset the profile picture to fetch a fresh one from Google.`)) {
                                setSelectedIdentityUid(user.uid);
                                setToast({ message: 'Purging Tagore Team data...', type: 'info' });
                                try {
                                  await getDocs(query(collection(db, 'activityLogs'), where('userId', '==', user.uid))).then(s => Promise.all(s.docs.map(d => deleteDoc(d.ref))));
                                  await getDocs(query(collection(db, 'testResults'), where('studentUid', '==', user.uid))).then(s => Promise.all(s.docs.map(d => deleteDoc(d.ref))));
                                  await getDocs(query(collection(db, 'userProgress'), where('userId', '==', user.uid))).then(s => Promise.all(s.docs.map(d => deleteDoc(d.ref))));
                                  
                                  await saveUser({ 
                                    ...user, 
                                    name: 'Hania Aamir',
                                    photoURL: '', 
                                    photoURLOverridden: false,
                                    totalTimeSpent: 0,
                                    pinnedToTop: false 
                                  });
                                  setToast({ message: 'Tagore Team profile sanitized!', type: 'success' });
                                } catch (e) {
                                  console.error(e);
                                  setToast({ message: 'Sanitization failed.', type: 'error' });
                                }
                              }
                            }}
                            className="w-full py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-indigo-600/30 transition-all"
                          >
                            Force Nucleus Purge & Re-Sync
                          </button>
                          
                          <p className="text-[9px] text-white/20 italic">This profile identity is enforced at the system level to ensure brand consistency.</p>
                        </div>

                        <div className="p-8 border-2 border-dashed border-white/5 rounded-2xl text-center">
                           <p className="text-[10px] text-white/10 font-bold uppercase tracking-widest leading-relaxed">System identity rules are applied during profile synchronization.</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ratings' && (
            <div className="space-y-6">
              {/* Rating Settings Console */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-bold text-white">Rating Modal Control</h3>
                      <p className="text-xs text-white/40 font-medium">Configure how students provide feedback.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 bg-black/20 p-3 rounded-2xl border border-white/5">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">System Status</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${siteConfig?.isRatingEnabled ? 'text-yellow-400' : 'text-white/20'}`}>
                        {siteConfig?.isRatingEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <button 
                      onClick={() => saveSiteConfig({ isRatingEnabled: !siteConfig?.isRatingEnabled })}
                      className={`relative w-14 h-7 rounded-full transition-all duration-500 shadow-inner ${siteConfig?.isRatingEnabled ? 'bg-yellow-400' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 rounded-full bg-black shadow-lg transition-all duration-500 transform ${siteConfig?.isRatingEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {siteConfig?.isRatingEnabled && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-6 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 ml-1">Rating Question</label>
                            <input 
                              type="text" 
                              placeholder="e.g., Rate Your Experience"
                              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-yellow-400 transition-all font-medium"
                              value={siteConfig?.ratingQuestion || ''}
                              onChange={(e) => setSiteConfig({ ...siteConfig, ratingQuestion: e.target.value })}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 ml-1">Custom Options (Comma separated)</label>
                            <textarea 
                              placeholder="e.g., Excellent, Good, Average, Poor"
                              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-yellow-400 transition-all min-h-[100px] font-medium resize-none"
                              value={siteConfig?.ratingOptions?.join(', ') || ''}
                              onChange={(e) => setSiteConfig({ ...siteConfig, ratingOptions: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                            />
                            <p className="text-[10px] text-white/20 ml-1 italic font-medium">Leave empty to use 1-10 star rating.</p>
                          </div>

                          <button 
                            onClick={() => saveSiteConfig({ 
                              ratingQuestion: siteConfig.ratingQuestion,
                              ratingOptions: siteConfig.ratingOptions 
                            })}
                            className="w-full py-4 rounded-xl bg-yellow-400 text-black font-black uppercase tracking-widest text-xs hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(250,204,21,0.2)] flex items-center justify-center gap-2"
                          >
                            <Save size={18} />
                            Update Rating Logic
                          </button>
                        </div>
                        
                        <div className="bg-black/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-4">
                            <Eye size={16} className="text-white/10" />
                          </div>
                          <p className="text-[10px] text-yellow-400/40 uppercase tracking-[0.2em] font-black mb-6">User Interface Preview</p>
                          <div className="space-y-6">
                            <h4 className="text-2xl font-display font-bold text-white leading-tight">
                              {siteConfig?.ratingQuestion || 'Rate Your Experience'}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {siteConfig?.ratingOptions && siteConfig.ratingOptions.length > 0 ? (
                                siteConfig.ratingOptions.map((opt: string, i: number) => (
                                  <div key={i} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                                    {opt}
                                  </div>
                                ))
                              ) : (
                                <div className="flex gap-2">
                                  {[...Array(5)].map((_, i) => <Star key={i} size={28} className="text-yellow-400/20" />)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/10">
                <div className="relative flex-grow max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search ratings..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:border-neon-blue outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                    <span className="text-xs text-white/40 uppercase tracking-widest font-bold">Avg Rating</span>
                    <span className="text-xl font-display font-bold text-yellow-400">
                      {(ratings.reduce((acc, r) => acc + r.score, 0) / (ratings.length || 1)).toFixed(1)}
                    </span>
                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {ratings.filter(r => r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || r.studentEmail.toLowerCase().includes(searchQuery.toLowerCase())).map((rating) => (
                  <motion.div 
                    key={rating.id}
                    layout
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:border-yellow-400/50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={rating.studentPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(rating.studentName)}&background=random`} 
                          alt={rating.studentName}
                          className="w-12 h-12 rounded-full border border-white/10"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h3 className="text-white font-medium">{rating.studentName}</h3>
                          <p className="text-xs text-white/40">{rating.studentEmail}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(10)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={12} 
                                className={`${i < rating.score ? 'text-yellow-400 fill-yellow-400' : 'text-white/10'}`} 
                              />
                            ))}
                            <span className="ml-2 text-xs font-bold text-yellow-400">{rating.score}/10</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete('rating', rating.id, `Rating from ${rating.studentName}`)}
                        className="p-2 text-red-400/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {rating.comment && (
                      <p className="mt-4 text-sm text-white/60 bg-white/5 p-3 rounded-lg border border-white/5 italic">
                        "{rating.comment}"
                      </p>
                    )}
                    <div className="mt-4 flex justify-end">
                      <span className="text-[10px] text-white/20 uppercase tracking-widest">
                        {rating.createdAt?.toDate ? rating.createdAt.toDate().toLocaleString() : 'N/A'}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {ratings.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-white/20">
                    <Star size={48} className="mb-4" />
                    <p>No ratings yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingEntity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingEntity(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-dark-bg border border-white/10 rounded-3xl shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-2xl font-display font-bold text-white">
                    Edit {editingEntity.type.charAt(0).toUpperCase() + editingEntity.type.slice(1)}
                  </h2>
                  <p className="text-sm text-white/40">ID: {editingEntity.id}</p>
                </div>
                <button 
                  onClick={() => setEditingEntity(null)}
                  className="p-2 text-white/40 hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              {editingEntity.type === 'chapter' && (
                <div className="px-6 pt-4 flex items-center gap-4 border-b border-white/10 shrink-0">
                  {!isLimitedAdmin && (
                    <>
                      <button 
                        onClick={() => setEditTab('basic')}
                        className={`pb-4 px-2 text-sm font-medium transition-all relative ${editTab === 'basic' ? 'text-neon-pink' : 'text-white/40 hover:text-white'}`}
                      >
                        Basic Info
                        {editTab === 'basic' && <motion.div layoutId="editTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-pink" />}
                      </button>
                      <button 
                        onClick={() => setEditTab('resources')}
                        className={`pb-4 px-2 text-sm font-medium transition-all relative ${editTab === 'resources' ? 'text-neon-pink' : 'text-white/40 hover:text-white'}`}
                      >
                        Resources ({editingEntity.resources?.length || 0})
                        {editTab === 'resources' && <motion.div layoutId="editTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-pink" />}
                      </button>
                    </>
                  )}
                  {(activeTab === 'chapterTests' || isLimitedAdmin) && (
                    <button 
                      onClick={() => setEditTab('quiz')}
                      className={`pb-4 px-2 text-sm font-medium transition-all relative ${editTab === 'quiz' ? 'text-neon-pink' : 'text-white/40 hover:text-white'}`}
                    >
                      Quiz ({editingEntity.quiz?.length || 0})
                      {editTab === 'quiz' && <motion.div layoutId="editTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-pink" />}
                    </button>
                  )}
                </div>
              )}

              {editingEntity.type === 'test' && (
                <div className="px-6 pt-4 flex items-center gap-4 border-b border-white/10 shrink-0">
                  <button 
                    onClick={() => setEditTab('basic')}
                    className={`pb-4 px-2 text-sm font-medium transition-all relative ${editTab === 'basic' ? 'text-neon-blue' : 'text-white/40 hover:text-white'}`}
                  >
                    Basic Info
                    {editTab === 'basic' && <motion.div layoutId="editTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue" />}
                  </button>
                  <button 
                    onClick={() => setEditTab('questions')}
                    className={`pb-4 px-2 text-sm font-medium transition-all relative ${editTab === 'questions' ? 'text-neon-blue' : 'text-white/40 hover:text-white'}`}
                  >
                    Questions ({editingEntity.questions?.length || 0})
                    {editTab === 'questions' && <motion.div layoutId="editTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue" />}
                  </button>
                </div>
              )}

              <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                {editingEntity.type === 'notification' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Title</label>
                      <input 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all"
                        value={editingEntity.title}
                        onChange={(e) => setEditingEntity({ ...editingEntity, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Message</label>
                      <textarea 
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all min-h-[120px]"
                        value={editingEntity.message}
                        onChange={(e) => setEditingEntity({ ...editingEntity, message: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/60">Type</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all"
                          value={editingEntity.type_notif || editingEntity.type}
                          onChange={(e) => setEditingEntity({ ...editingEntity, type_notif: e.target.value })}
                        >
                          <option value="info">Info</option>
                          <option value="success">Success</option>
                          <option value="warning">Warning</option>
                          <option value="error">Error</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/60">Action URL (Optional)</label>
                        <input 
                          type="text" 
                          placeholder="https://..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all"
                          value={editingEntity.url || ''}
                          onChange={(e) => setEditingEntity({ ...editingEntity, url: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ) : editTab === 'basic' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/60">Name / Title</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white focus:border-neon-blue outline-none transition-all"
                          value={editingEntity.type === 'test' ? editingEntity.title : editingEntity.name}
                          onChange={(e) => setEditingEntity({ ...editingEntity, [editingEntity.type === 'test' ? 'title' : 'name']: e.target.value })}
                        />
                        <button 
                          onClick={async () => {
                            const field = editingEntity.type === 'test' ? 'title' : 'name';
                            if (editingEntity[field]) {
                              setEditingEntity({ ...editingEntity, [field]: '' });
                            } else {
                              try {
                                const text = await navigator.clipboard.readText();
                                if (text) setEditingEntity({ ...editingEntity, [field]: text });
                              } catch (err) {
                                setToast({ message: 'Could not access clipboard', type: 'error' });
                              }
                            }
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all"
                        >
                          {(editingEntity.type === 'test' ? editingEntity.title : editingEntity.name) ? <X size={18} /> : <ClipboardList size={18} />}
                        </button>
                      </div>
                    </div>

                    {editingEntity.type === 'test' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/60">Class</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all"
                          value={editingEntity.classId}
                          onChange={(e) => setEditingEntity({ ...editingEntity, classId: e.target.value })}
                        >
                          {classes.map(c => (
                            <option key={c.id} value={c.id} className="bg-dark-bg">{c.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {editingEntity.type === 'test' && (
                      <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                        <input 
                          type="checkbox" 
                          id="active"
                          className="w-5 h-5 rounded border-white/10 bg-white/5 text-neon-blue focus:ring-neon-blue"
                          checked={editingEntity.active}
                          onChange={(e) => setEditingEntity({ ...editingEntity, active: e.target.checked })}
                        />
                        <label htmlFor="active" className="text-sm font-medium text-white">Active (Visible to students)</label>
                      </div>
                    )}

                    {editingEntity.type === 'chapter' && (
                      <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                        <input 
                          type="checkbox" 
                          id="quizEnabled"
                          className="w-5 h-5 rounded border-white/10 bg-white/5 text-neon-blue focus:ring-neon-blue"
                          checked={editingEntity.quizEnabled !== false}
                          onChange={(e) => setEditingEntity({ ...editingEntity, quizEnabled: e.target.checked })}
                        />
                        <label htmlFor="quizEnabled" className="text-sm font-medium text-white">Enable Quiz (MCQs)</label>
                      </div>
                    )}

                    {editingEntity.type === 'chapter' && (
                      <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                        <input 
                          type="checkbox" 
                          id="isImportant"
                          className="w-5 h-5 rounded border-white/10 bg-white/5 text-neon-pink focus:ring-neon-pink"
                          checked={editingEntity.isImportant}
                          onChange={(e) => setEditingEntity({ ...editingEntity, isImportant: e.target.checked })}
                        />
                        <label htmlFor="isImportant" className="text-sm font-medium text-white">Mark as Important Chapter</label>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                      <input 
                        type="checkbox" 
                        id="enabled"
                        className="w-5 h-5 rounded border-white/10 bg-white/5 text-neon-blue focus:ring-neon-blue"
                        checked={editingEntity.enabled}
                        onChange={(e) => setEditingEntity({ ...editingEntity, enabled: e.target.checked })}
                      />
                      <label htmlFor="enabled" className="text-sm font-medium text-white">Enabled (Visible to students)</label>
                    </div>

                    {editingEntity.type === 'group' && (
                      <div className="space-y-6 pt-4 border-t border-white/10">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white/60">Description</label>
                          <textarea 
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-neon-blue outline-none transition-all resize-none"
                            rows={3}
                            value={editingEntity.description || ''}
                            onChange={(e) => setEditingEntity({ ...editingEntity, description: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white/60">Group Password (Optional)</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white focus:border-neon-blue outline-none transition-all font-mono"
                              placeholder="Leave empty for public group"
                              value={editingEntity.password || ''}
                              onChange={(e) => setEditingEntity({ ...editingEntity, password: e.target.value })}
                            />
                            <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20" />
                          </div>
                          <p className="text-[10px] text-white/20 italic">If set, users will need this password to join the group.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {editTab === 'resources' && editingEntity.type === 'chapter' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">Chapter Resources</h3>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => {
                            setConfirmAction({
                              title: 'Delete All Resources',
                              message: 'Are you sure you want to delete ALL resources for this chapter? This cannot be undone.',
                              onConfirm: () => {
                                setEditingEntity({ ...editingEntity, resources: [] });
                                setConfirmAction(null);
                              }
                            });
                          }}
                          className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-all flex items-center gap-1 uppercase tracking-widest"
                        >
                          <Trash2 size={12} /> Delete All
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              if (text && (text.includes('drive.google.com') || text.includes('http'))) {
                                const newResource: Resource = {
                                  id: Date.now().toString(),
                                  title: 'New Resource (Pasted)',
                                  type: 'pdf',
                                  url: text,
                                  enabled: true
                                };
                                setEditingEntity({
                                  ...editingEntity,
                                  resources: [...(editingEntity.resources || []), newResource]
                                });
                                setToast({ message: 'Resource added from clipboard!', type: 'success' });
                              } else {
                                setToast({ message: 'Please copy a valid link first!', type: 'error' });
                              }
                            } catch (err) {
                              setToast({ message: 'Could not access clipboard. Please paste manually.', type: 'error' });
                            }
                          }}
                          className="text-[10px] font-bold text-neon-blue hover:text-neon-blue/80 transition-all flex items-center gap-1 uppercase tracking-widest"
                        >
                          <Plus size={12} /> Paste Drive Link
                        </button>
                        <button 
                          onClick={() => {
                            const newResource: Resource = {
                              id: Date.now().toString(),
                              title: 'New Resource',
                              type: 'pdf',
                              url: '',
                              enabled: true
                            };
                            setEditingEntity({
                              ...editingEntity,
                              resources: [...(editingEntity.resources || []), newResource]
                            });
                          }}
                          className="text-[10px] font-bold text-neon-pink hover:text-neon-pink/80 transition-all flex items-center gap-1 uppercase tracking-widest"
                        >
                          <Plus size={12} /> Add Resource
                        </button>
                      </div>
                    </div>

                    <DragDropContext onDragEnd={(result) => {
                      if (!result.destination) return;
                      const items = Array.from(editingEntity.resources || []);
                      const [reorderedItem] = items.splice(result.source.index, 1);
                      items.splice(result.destination.index, 0, reorderedItem);
                      setEditingEntity({ ...editingEntity, resources: items });
                    }}>
                      <Droppable droppableId="resources">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                            {(editingEntity.resources || []).map((resource: Resource, index: number) => (
                              <DraggableAny key={resource.id} draggableId={resource.id} index={index}>
                                {(provided: any) => (
                                  <div 
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-start gap-4"
                                  >
                                    <div {...provided.dragHandleProps} className="mt-1 text-white/20">
                                      <GripVertical size={20} />
                                    </div>
                                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-white/40">Title</label>
                                        <div className="relative">
                                          <input 
                                            type="text" 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-3 pr-10 text-sm text-white outline-none focus:border-white/30"
                                            value={resource.title}
                                            onChange={(e) => {
                                              const newResources = [...editingEntity.resources];
                                              newResources[index].title = e.target.value;
                                              setEditingEntity({ ...editingEntity, resources: newResources });
                                            }}
                                          />
                                          <button 
                                                  onClick={async () => {
                                                    const newResources = [...editingEntity.resources];
                                                    if (resource.title) {
                                                      newResources[index].title = '';
                                                    } else {
                                                      try {
                                                        const text = await navigator.clipboard.readText();
                                                        if (text) newResources[index].title = text;
                                                      } catch (err) {
                                                        setToast({ message: 'Could not access clipboard', type: 'error' });
                                                      }
                                                    }
                                                    setEditingEntity({ ...editingEntity, resources: newResources });
                                                  }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all"
                                          >
                                            {resource.title ? <X size={14} /> : <ClipboardList size={14} />}
                                          </button>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-white/40">Type</label>
                                        <select 
                                          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none"
                                          value={resource.type}
                                          onChange={(e) => {
                                            const newResources = [...editingEntity.resources];
                                            newResources[index].type = e.target.value as any;
                                            setEditingEntity({ ...editingEntity, resources: newResources });
                                          }}
                                        >
                                          <option value="pdf" className="bg-dark-bg">PDF Document</option>
                                          <option value="notes" className="bg-dark-bg">Study Notes</option>
                                          <option value="qa" className="bg-dark-bg">Q&A</option>
                                          <option value="practice" className="bg-dark-bg">Practice</option>
                                          <option value="test" className="bg-dark-bg">Test</option>
                                        </select>
                                      </div>
                                      <div className="md:col-span-2 space-y-4">
                                        <div className="p-4 bg-neon-blue/5 border border-neon-blue/20 rounded-2xl">
                                          <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-lg bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                                              <ExternalLink size={18} />
                                            </div>
                                            <div>
                                              <h4 className="text-sm font-bold text-white">Drive Link System</h4>
                                              <p className="text-[10px] text-white/40 uppercase tracking-widest">Recommended Alternative</p>
                                            </div>
                                          </div>
                                          <p className="text-xs text-white/60 mb-3 leading-relaxed">
                                            Since your Firebase Storage is not yet provisioned (as seen in your screenshot), we recommend using **Google Drive**. Just paste the "Anyone with link" URL below.
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            <span className="px-2 py-1 rounded bg-white/5 text-[9px] font-bold text-white/40 border border-white/5">Auto-Preview</span>
                                            <span className="px-2 py-1 rounded bg-white/5 text-[9px] font-bold text-white/40 border border-white/5">No Upload Limit</span>
                                            <span className="px-2 py-1 rounded bg-white/5 text-[9px] font-bold text-white/40 border border-white/5">Faster Loading</span>
                                          </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                              <label className="text-[10px] uppercase tracking-wider font-bold text-white/40">Resource URL / Drive Link</label>
                                              <div className="flex items-center gap-3">
                                                <button 
                                                  onClick={async () => {
                                                    const newResources = [...editingEntity.resources];
                                                    if (resource.url) {
                                                      newResources[index].url = '';
                                                    } else {
                                                      try {
                                                        const text = await navigator.clipboard.readText();
                                                        if (text) newResources[index].url = text;
                                                      } catch (err) {
                                                        setToast({ message: 'Could not access clipboard. Please paste manually.', type: 'error' });
                                                      }
                                                    }
                                                    setEditingEntity({ ...editingEntity, resources: newResources });
                                                  }}
                                                  className="text-[10px] text-neon-blue hover:underline flex items-center gap-1"
                                                >
                                                  {resource.url ? <X size={10} /> : <Plus size={10} />}
                                                  {resource.url ? 'Clear Link' : 'Paste Link'}
                                                </button>
                                                <button 
                                                  onClick={() => setConfirmAction({
                                                    title: 'Google Drive Help',
                                                    message: "1. Upload PDF to Google Drive\n2. Right-click > Share\n3. Set to 'Anyone with the link'\n4. Copy and paste here!\n\nOur system will automatically fix the link for a perfect preview.",
                                                    onConfirm: () => setConfirmAction(null),
                                                    singleButton: true
                                                  })}
                                                  className="text-[10px] text-white/40 hover:text-white flex items-center gap-1"
                                                >
                                                  <Info size={10} /> Help
                                                </button>
                                              </div>
                                            </div>
                                          <div className="flex flex-col sm:flex-row gap-2">
                                            <div className="relative flex-grow">
                                              <input 
                                                type="text" 
                                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 pr-24 text-sm text-white outline-none focus:border-neon-blue transition-all font-mono"
                                                value={resource.url}
                                                onChange={(e) => {
                                                  const newResources = [...editingEntity.resources];
                                                  newResources[index].url = e.target.value;
                                                  setEditingEntity({ ...editingEntity, resources: newResources });
                                                }}
                                                placeholder="Paste Google Drive link (e.g. https://drive.google.com/...)"
                                              />
                                              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                {resource.url && (
                                                  <div className="flex items-center gap-1">
                                                    <button 
                                                      onClick={() => {
                                                        navigator.clipboard.writeText(resource.url);
                                                        setToast({ message: 'Link copied!', type: 'success' });
                                                      }}
                                                      className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-neon-blue"
                                                      title="Copy Link"
                                                    >
                                                      <Copy size={14} />
                                                    </button>
                                                    <a 
                                                      href={resource.url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-neon-purple"
                                                      title="Test Link"
                                                    >
                                                      <Eye size={14} />
                                                    </a>
                                                  </div>
                                                )}
                                                <div className="w-px h-4 bg-white/10 mx-1" />
                                                {resource.url.includes('drive.google.com') ? <ExternalLink size={14} className="text-neon-blue" /> : <Layers size={14} className="text-white/20" />}
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-3 my-2">
                                              <div className="h-px flex-grow bg-white/10"></div>
                                              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">OR UPLOAD TO FIREBASE</span>
                                              <div className="h-px flex-grow bg-white/10"></div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                            <label className="btn-neon bg-white/10 text-white px-4 py-2 rounded-lg cursor-pointer flex items-center justify-center min-w-[120px] relative overflow-hidden h-full">
                                              {uploadingResource === resource.id ? (
                                                <>
                                                  <div 
                                                    className="absolute bottom-0 left-0 h-1 bg-neon-blue transition-all duration-300" 
                                                    style={{ width: `${uploadProgress[resource.id] || 0}%` }}
                                                  />
                                                  <span className="text-xs relative z-10 flex items-center gap-2">
                                                    <RefreshCcw className="w-3 h-3 animate-spin" />
                                                    {Math.round(uploadProgress[resource.id] || 0)}%
                                                  </span>
                                                </>
                                              ) : (
                                                <span className="text-xs font-bold flex items-center gap-2">
                                                  <Upload size={14} /> Upload PDF
                                                </span>
                                              )}
                                              <input 
                                                type="file" 
                                                accept=".pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                  if (e.target.files && e.target.files[0]) {
                                                    const file = e.target.files[0];
                                                    if (file.type !== 'application/pdf') {
                                                      setToast({ message: 'Please select a valid PDF file.', type: 'error' });
                                                      return;
                                                    }
                                                    handleFileUpload(file, resource.id, index);
                                                  }
                                                }}
                                                disabled={uploadingResource === resource.id}
                                              />
                                            </label>
                                              {uploadingResource === resource.id && (
                                                <button 
                                                  onClick={() => {
                                                    setUploadingResource(null);
                                                    setUploadProgress(prev => ({ ...prev, [resource.id]: 0 }));
                                                    setToast({ message: 'Upload cancelled.', type: 'info' });
                                                  }}
                                                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-colors"
                                                >
                                                  <X className="w-4 h-4" />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <p className="text-[9px] text-white/20 italic">
                                              * Note: Direct upload requires Firebase Storage setup (see your screenshot).
                                            </p>
                                            <button 
                                              onClick={() => setConfirmAction({
                                                title: 'Firebase Storage Fix',
                                                message: "FIREBASE STORAGE FIX:\n1. Go to your Firebase Console > Storage.\n2. Click 'Get started' (as shown in your screenshot).\n3. Choose 'Start in test mode' and a location.\n4. Once created, uploads will work!",
                                                onConfirm: () => setConfirmAction(null),
                                                singleButton: true
                                              })}
                                              className="text-[9px] text-neon-pink hover:underline font-bold"
                                            >
                                              Fix 0% Upload Issue
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        const newResources = editingEntity.resources.filter((_: any, i: number) => i !== index);
                                        setEditingEntity({ ...editingEntity, resources: newResources });
                                      }}
                                      className="mt-1 p-2 text-white/20 hover:text-red-400 transition-all"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                )}
                              </DraggableAny>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                )}

                {editTab === 'questions' && editingEntity.type === 'test' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">Test Questions</h3>
                      <button 
                        onClick={() => {
                          const newQuestion: TestQuestion = {
                            id: Date.now().toString(),
                            question: 'New Question',
                            options: ['', '', '', ''],
                            correctAnswer: 0
                          };
                          setEditingEntity({
                            ...editingEntity,
                            questions: [...(editingEntity.questions || []), newQuestion]
                          });
                        }}
                        className="text-sm font-bold text-neon-blue hover:text-neon-blue/80 transition-all flex items-center gap-1"
                      >
                        <Plus size={16} /> Add Question
                      </button>
                    </div>

                    <div className="space-y-6">
                      {(editingEntity.questions || []).map((q: TestQuestion, qIdx: number) => (
                        <div key={q.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4 relative group">
                          <button 
                            onClick={() => {
                              const newQuestions = [...editingEntity.questions];
                              newQuestions.splice(qIdx, 1);
                              setEditingEntity({ ...editingEntity, questions: newQuestions });
                            }}
                            className="absolute top-4 right-4 text-white/20 hover:text-red-400 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                          
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Question {qIdx + 1}</label>
                            <input 
                              type="text" 
                              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white focus:border-neon-blue outline-none transition-all"
                              value={q.question}
                              onChange={(e) => {
                                const newQuestions = [...editingEntity.questions];
                                newQuestions[qIdx].question = e.target.value;
                                setEditingEntity({ ...editingEntity, questions: newQuestions });
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold text-white/40 uppercase">Option {oIdx + 1}</label>
                                  <input 
                                    type="radio" 
                                    name={`correct-${q.id}`}
                                    checked={q.correctAnswer === oIdx}
                                    onChange={() => {
                                      const newQuestions = [...editingEntity.questions];
                                      newQuestions[qIdx].correctAnswer = oIdx;
                                      setEditingEntity({ ...editingEntity, questions: newQuestions });
                                    }}
                                    className="w-3 h-3 text-neon-blue bg-white/5 border-white/20 focus:ring-neon-blue"
                                  />
                                </div>
                                <input 
                                  type="text" 
                                  className={`w-full bg-black/20 border rounded-lg py-1.5 px-3 text-sm text-white outline-none transition-all ${q.correctAnswer === oIdx ? 'border-neon-blue/50 bg-neon-blue/5' : 'border-white/5 focus:border-white/20'}`}
                                  value={opt}
                                  onChange={(e) => {
                                    const newQuestions = [...editingEntity.questions];
                                    newQuestions[qIdx].options[oIdx] = e.target.value;
                                    setEditingEntity({ ...editingEntity, questions: newQuestions });
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editTab === 'quiz' && editingEntity.type === 'chapter' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-white">Quiz Questions</h3>
                      <div className="flex items-center gap-4">
                        {editingEntity.quiz?.length === 0 && (
                          <button 
                            onClick={() => {
                              const subject = subjects.find(s => s.id === editingEntity.subjectId);
                              if (subject) {
                                const subjectName = subject.name.toLowerCase();
                                let defaultQuiz: QuizQuestion[] = [];
                                if (subjectName.includes('science')) defaultQuiz = DEFAULT_MCQS['Science'];
                                else if (subjectName.includes('math')) defaultQuiz = DEFAULT_MCQS['Math'];
                                else if (subjectName.includes('history')) defaultQuiz = DEFAULT_MCQS['History'];
                                else if (subjectName.includes('geography')) defaultQuiz = DEFAULT_MCQS['Geography'];
                                else if (subjectName.includes('civics')) defaultQuiz = DEFAULT_MCQS['Civics'];
                                else if (subjectName.includes('economic')) defaultQuiz = DEFAULT_MCQS['Economics'];

                                if (defaultQuiz.length > 0) {
                                  setEditingEntity({
                                    ...editingEntity,
                                    quiz: defaultQuiz.map(q => ({ ...q, id: Date.now() + Math.random().toString() }))
                                  });
                                  setToast({ message: `Imported ${defaultQuiz.length} default MCQs for ${subject.name}`, type: 'success' });
                                } else {
                                  setToast({ message: "No default MCQs found for this subject type.", type: 'info' });
                                }
                              }
                            }}
                            className="text-xs font-bold text-neon-blue hover:text-neon-blue/80 transition-all flex items-center gap-1 bg-neon-blue/10 px-3 py-1 rounded-lg border border-neon-blue/20"
                          >
                            <RefreshCcw size={14} /> Import Default MCQs
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            const newQuestion: QuizQuestion = {
                              id: Date.now().toString(),
                              question: 'New Question',
                              options: ['', '', '', ''],
                              correctAnswer: 0
                            };
                            setEditingEntity({
                              ...editingEntity,
                              quiz: [...(editingEntity.quiz || []), newQuestion]
                            });
                          }}
                          className="text-sm font-bold text-neon-pink hover:text-neon-pink/80 transition-all flex items-center gap-1"
                        >
                          <Plus size={16} /> Add Question
                        </button>
                      </div>
                    </div>

                    <DragDropContext onDragEnd={(result) => {
                      if (!result.destination) return;
                      const items = Array.from(editingEntity.quiz || []);
                      const [reorderedItem] = items.splice(result.source.index, 1);
                      items.splice(result.destination.index, 0, reorderedItem);
                      setEditingEntity({ ...editingEntity, quiz: items });
                    }}>
                      <Droppable droppableId="quiz">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {(editingEntity.quiz || []).map((question: QuizQuestion, qIndex: number) => (
                              <DraggableAny key={question.id} draggableId={question.id} index={qIndex}>
                                {(provided: any) => (
                                  <div 
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4"
                                  >
                                    <div className="flex items-start justify-between gap-4">
                                      <div {...provided.dragHandleProps} className="mt-1 text-white/20">
                                        <GripVertical size={20} />
                                      </div>
                                      <div className="flex-grow space-y-2">
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-white/40">Question {qIndex + 1}</label>
                                        <textarea 
                                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none resize-none"
                                          rows={2}
                                          value={question.question}
                                          onChange={(e) => {
                                            const newQuiz = [...editingEntity.quiz];
                                            newQuiz[qIndex].question = e.target.value;
                                            setEditingEntity({ ...editingEntity, quiz: newQuiz });
                                          }}
                                        />
                                      </div>
                                      <button 
                                        onClick={() => {
                                          const newQuiz = editingEntity.quiz.filter((_: any, i: number) => i !== qIndex);
                                          setEditingEntity({ ...editingEntity, quiz: newQuiz });
                                        }}
                                        className="mt-1 p-2 text-white/20 hover:text-red-400 transition-all"
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {question.options.map((option, oIndex) => (
                                        <div key={oIndex} className="flex items-center gap-3">
                                          <button 
                                            onClick={() => {
                                              const newQuiz = [...editingEntity.quiz];
                                              newQuiz[qIndex].correctAnswer = oIndex;
                                              setEditingEntity({ ...editingEntity, quiz: newQuiz });
                                            }}
                                            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${question.correctAnswer === oIndex ? 'bg-neon-pink border-neon-pink text-white' : 'border-white/20 text-transparent hover:border-neon-pink/50'}`}
                                          >
                                            <CheckCircle2 size={14} />
                                          </button>
                                          <input 
                                            type="text" 
                                            placeholder={`Option ${oIndex + 1}`}
                                            className="flex-grow bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-white/30"
                                            value={option}
                                            onChange={(e) => {
                                              const newQuiz = [...editingEntity.quiz];
                                              newQuiz[qIndex].options[oIndex] = e.target.value;
                                              setEditingEntity({ ...editingEntity, quiz: newQuiz });
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </DraggableAny>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                )}

              </div>

              <div className="p-6 border-t border-white/10 flex items-center justify-between shrink-0">
                <button 
                  onClick={() => {
                    handleDelete(editingEntity.type, editingEntity.id, editingEntity.name);
                    setEditingEntity(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl transition-all flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete {editingEntity.type}
                </button>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setEditingEntity(null)}
                    className="px-6 py-2 text-sm font-medium text-white/60 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-neon bg-white text-black px-8 py-2 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-dark-card border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-2">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-2xl font-display font-bold text-white">Confirm Delete</h3>
                <p className="text-white/60">
                  Are you sure you want to delete <span className="text-white font-medium">"{deleteConfirm.name}"</span>? 
                  This action cannot be undone and will remove all associated data.
                </p>
                <div className="flex items-center gap-4 w-full pt-4">
                  <button 
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                  >
                    Delete Now
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
              toast.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' :
              toast.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
              'bg-neon-blue/20 border-neon-blue/50 text-neon-blue'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : 
             toast.type === 'error' ? <AlertCircle size={20} /> : 
             <Info size={20} />}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generic Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmAction(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-dark-card border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue mb-2">
                  <HelpCircle size={32} />
                </div>
                <h3 className="text-2xl font-display font-bold text-white">{confirmAction.title}</h3>
                <p className="text-white/60">{confirmAction.message}</p>
                <div className="flex items-center gap-4 w-full pt-4">
                  {!confirmAction.singleButton && (
                    <button 
                      onClick={() => setConfirmAction(null)}
                      className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    onClick={confirmAction.onConfirm}
                    className="flex-1 px-6 py-3 rounded-xl bg-neon-blue text-white font-bold hover:bg-neon-blue/80 transition-all shadow-lg shadow-neon-blue/20"
                  >
                    {confirmAction.singleButton ? 'Got it' : 'Confirm'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    );
  }
