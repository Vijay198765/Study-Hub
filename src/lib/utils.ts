import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertDriveUrl(url: string): string {
  if (!url) return url;
  
  // Handle Google Drive links
  if (url.includes('drive.google.com')) {
    // Extract file ID from various formats
    // Format 1: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    // Format 2: https://drive.google.com/open?id=FILE_ID
    const fileIdMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      // Use the standard direct link format
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }
  }
  
  return url;
}
