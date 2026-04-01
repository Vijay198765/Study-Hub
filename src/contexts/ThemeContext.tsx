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
  accentColor: string;
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
  accentColor: '#00f2ff',
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

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'theme'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as ThemeSettings;
        const mergedTheme = { ...defaultTheme, ...data };
        setTheme(mergedTheme);
        applyTheme(mergedTheme);
      } else {
        applyTheme(defaultTheme);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/theme'));

    return () => unsubscribe();
  }, []);

  const applyTheme = (t: ThemeSettings) => {
    const root = document.documentElement;
    root.style.setProperty('--neon-blue', t.neonBlue);
    root.style.setProperty('--neon-purple', t.neonPurple);
    root.style.setProperty('--neon-pink', t.neonPink);
    root.style.setProperty('--neon-magenta', t.neonMagenta);
    root.style.setProperty('--dark-bg', t.darkBg);
    root.style.setProperty('--dark-card', t.darkCard);
    root.style.setProperty('--dark-border', t.darkBorder);
    root.style.setProperty('--text-primary', t.textPrimary);
    root.style.setProperty('--text-secondary', t.textSecondary);
    root.style.setProperty('--accent-color', t.accentColor);
    root.style.setProperty('--success-color', t.successColor);
    root.style.setProperty('--error-color', t.errorColor);
    root.style.setProperty('--warning-color', t.warningColor);
    root.style.setProperty('--info-color', t.infoColor);
    root.style.setProperty('--watermark-text', t.watermarkText);
    root.style.setProperty('--watermark-size', t.watermarkSize.toString());
    root.style.setProperty('--watermark-opacity', t.watermarkOpacity.toString());
    root.style.setProperty('--watermark-rotate', t.watermarkRotate.toString());
    
    // Derived colors
    root.style.setProperty('--neon-blue-dim', adjustColor(t.neonBlue, -40));
    root.style.setProperty('--neon-purple-dim', adjustColor(t.neonPurple, -40));
    root.style.setProperty('--accent-dim', adjustColor(t.accentColor, -40));
  };

  // Helper to darken/lighten hex colors for derived variables
  const adjustColor = (hex: string, amt: number) => {
    let usePound = false;
    if (hex[0] === "#") {
      hex = hex.slice(1);
      usePound = true;
    }
    const num = parseInt(hex, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255;
    else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255;
    else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
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
