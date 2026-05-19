import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertDriveUrl(url: string | undefined): string {
  if (!url) return '';
  
  // Handle Google Drive links
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      // Use LH3 proxy with s0 for original resolution
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}=s0`;
    }
  }

  // Handle Google Profile Photos and Google User Content
  // Subdomains: lh3.googleusercontent.com, h3.google.com, photos.google.com, etc.
  if (url.includes('googleusercontent.com') || url.includes('google.com') || url.includes('ggpht.com')) {
    // Replace size parameters like =s96-c, =s400, /s96-c/ etc. with original version s0
    // We target the =s followed by digits and any non-query characters
    let processedUrl = url;
    if (processedUrl.includes('=s')) {
      processedUrl = processedUrl.replace(/=s\d+[^&?#]*/, '=s0');
    }
    // Also handle path components like /s96-c/
    if (processedUrl.match(/\/s\d+[^/]*\//)) {
      processedUrl = processedUrl.replace(/\/s\d+[^/]*\//, '/s0/');
    }
    return processedUrl;
  }
  
  return url;
}

export function safeStringify(obj: any, indent: number = 0): string {
  const cache = new WeakSet();
  
  try {
    const stringified = JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.has(value)) {
            return '[Circular]';
          }
          
          cache.add(value);

          // Handle common complex objects that might cause issues
          try {
            // Check for potential circularity or complex objects by property presence
            if ('_firestore' in value || 'firestore' in value || '_delegate' in value) {
              const constructorName = value.constructor?.name;
              return `[Firebase ${constructorName || 'Object'}]`;
            }

            if (value instanceof Node || (typeof value.nodeType === 'number' && typeof value.nodeName === 'string')) {
              return '[DOM Node]';
            }
          } catch (e) {
            return '[Object]';
          }
        }
        return value;
      },
      indent
    );
    return stringified;
  } catch (error) {
    try {
      // Fallback for extreme cases: just return a simplified string
      return String(obj);
    } catch (e) {
      return '[Serialization Error]';
    }
  }
}
