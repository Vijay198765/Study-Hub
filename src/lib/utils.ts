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
  const cache = new Set();
  
  try {
    const stringified = JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          // Check for circular references
          if (cache.has(value)) {
            return '[Circular]';
          }
          
          // Basic depth limiting or complex object handling
          try {
            // Handle Firebase objects specifically by names
            const constructorName = value.constructor?.name;
            if (constructorName && ['DocumentReference', 'Query', 'Firestore', 'Auth', 'UserImpl', 'Timestamp'].includes(constructorName)) {
              return `[Firebase ${constructorName}]`;
            }
            
            // Handle large/complex objects like DOM elements or Three.js objects
            if (value instanceof Node || (typeof value.nodeType === 'number' && typeof value.nodeName === 'string')) {
              return '[DOM Node]';
            }
            
            if (constructorName && (constructorName.startsWith('WebGL') || constructorName === 'Scene' || constructorName === 'Camera')) {
              return `[Three.js ${constructorName}]`;
            }
          } catch (e) {
            // If constructor access fails, just continue
          }

          cache.add(value);
        }
        return value;
      },
      indent
    );
    return stringified;
  } catch (error) {
    console.error('safeStringify failed:', error);
    return '[Serialization Error]';
  } finally {
    cache.clear();
  }
}
