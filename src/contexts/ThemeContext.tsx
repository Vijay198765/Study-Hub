import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface ThemeSettings {
  neonBlue: string;
  neonPurple: string;
  neonPink: string;
  neonMagenta: string;
  darkBg: string;
  darkCard: string;
  darkBorder: string;
  textPrimary: string;
  textSecondary: string;
  lightBg: string;
  lightCard: string;
  lightBorder: string;
  lightTextPrimary: string;
  lightTextSecondary: string;
  accentColor: string;
  lightAccentColor: string;
  successColor: string;
  errorColor: string;
  warningColor: string;
  infoColor: string;
  watermarkText: string;
  watermarkSize: number;
  watermarkOpacity: number;
  watermarkRotate: number;
}

const defaultTheme: ThemeSettings = {
  neonBlue: '#00f2ff',
  neonPurple: '#bc13fe',
  neonPink: '#ff00bd',
  neonMagenta: '#ff00e5',
  darkBg: '#0d0d0d',
  darkCard: '#151515',
  darkBorder: '#1c1c1c',
  textPrimary: '#ffffff',
  textSecondary: '#5a5a5f',
  lightBg: '#f8fafc',
  lightCard: '#ffffff',
  lightBorder: '#e2e8f0',
  lightTextPrimary: '#0f172a',
  lightTextSecondary: '#475569',
  accentColor: '#00f2ff',
  lightAccentColor: '#00cce6',
  successColor: '#10b981',
  errorColor: '#ef4444',
  warningColor: '#f59e0b',
  infoColor: '#3b82f6',
  watermarkText: 'Vijay Ninama',
  watermarkSize: 80,
  watermarkOpacity: 0.06,
  watermarkRotate: -35,
};

interface ThemeContextType {
  theme: ThemeSettings;
  updateTheme: (newTheme: Partial<ThemeSettings>) => Promise<void>;
  resetTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>('dark');

  useEffect(() => {
    const unsubTheme = onSnapshot(doc(db, 'settings', 'theme'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ThemeSettings;
        const mergedTheme = { ...defaultTheme, ...data };
        setTheme(mergedTheme);
      } else {
        setTheme(defaultTheme);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/theme'));

    const unsubConfig = onSnapshot(doc(db, 'config', 'site'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.defaultThemeMode) {
          setThemeMode(data.defaultThemeMode);
        } else {
          setThemeMode('dark');
        }
      }
    }, (error) => {
      console.warn("Could not read site config for theme mode, defaulting to dark", error);
    });

    return () => {
      unsubTheme();
      unsubConfig();
    };
  }, []);

  useEffect(() => {
    applyTheme(theme, themeMode);
  }, [theme, themeMode]);

  const applyTheme = (t: ThemeSettings, mode: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement;
    
    let isLight = false;
    if (mode === 'light') {
      isLight = true;
    } else if (mode === 'auto') {
      isLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    }

    root.classList.toggle('light', isLight);
    root.classList.toggle('dark', !isLight);

    const finalBg = isLight ? (t.lightBg || '#f8fafc') : t.darkBg;
    const finalCard = isLight ? (t.lightCard || '#ffffff') : t.darkCard;
    const finalBorder = isLight ? (t.lightBorder || '#e2e8f0') : t.darkBorder;
    const finalTextPrimary = isLight ? (t.lightTextPrimary || '#0f172a') : t.textPrimary;
    const finalTextSecondary = isLight ? (t.lightTextSecondary || '#475569') : t.textSecondary;

    root.style.setProperty('--neon-blue', t.neonBlue);
    root.style.setProperty('--neon-purple', t.neonPurple);
    root.style.setProperty('--neon-pink', t.neonPink);
    root.style.setProperty('--neon-magenta', t.neonMagenta);
    root.style.setProperty('--dark-bg', finalBg);
    root.style.setProperty('--dark-card', finalCard);
    root.style.setProperty('--dark-border', finalBorder);
    root.style.setProperty('--text-primary', finalTextPrimary);
    root.style.setProperty('--text-secondary', finalTextSecondary);
    root.style.setProperty('--accent-color', isLight ? (t.lightAccentColor || t.accentColor) : t.accentColor);
    root.style.setProperty('--success-color', t.successColor);
    root.style.setProperty('--error-color', t.errorColor);
    root.style.setProperty('--warning-color', t.warningColor);
    root.style.setProperty('--info-color', t.infoColor);
    root.style.setProperty('--watermark-text', t.watermarkText);
    root.style.setProperty('--watermark-size', t.watermarkSize.toString());
    root.style.setProperty('--watermark-opacity', isLight ? '0.04' : t.watermarkOpacity.toString());
    root.style.setProperty('--watermark-rotate', t.watermarkRotate.toString());
    
    // Derived colors
    root.style.setProperty('--neon-blue-dim', adjustColor(t.neonBlue, isLight ? -20 : -40));
    root.style.setProperty('--neon-purple-dim', adjustColor(t.neonPurple, isLight ? -20 : -40));
    root.style.setProperty('--accent-dim', adjustColor(t.accentColor, isLight ? -20 : -40));
  };

  // Helper to darken/lighten hex colors for derived variables
  const adjustColor = (hex: string, amt: number) => {
    if (!hex || typeof hex !== 'string' || hex[0] !== '#') return hex;
    try {
      let usePound = true;
      hex = hex.slice(1);
      const num = parseInt(hex, 16);
      if (isNaN(num)) return '#' + hex;
      let r = (num >> 16) + amt;
      if (r > 255) r = 255;
      else if (r < 0) r = 0;
      let b = ((num >> 8) & 0x00FF) + amt;
      if (b > 255) b = 255;
      else if (b < 0) b = 0;
      let g = (num & 0x0000FF) + amt;
      if (g > 255) g = 255;
      else if (g < 0) g = 0;
      return "#" + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
    } catch (_) {
      return hex;
    }
  };

  const updateTheme = async (newTheme: Partial<ThemeSettings>) => {
    await setDoc(doc(db, 'settings', 'theme'), { ...theme, ...newTheme }, { merge: true });
  };

  const resetTheme = async () => {
    await setDoc(doc(db, 'settings', 'theme'), defaultTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
