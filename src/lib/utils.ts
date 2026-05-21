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
  const cleanObjectForSerialization = (val: any, seen = new WeakSet()): any => {
    if (val === null || val === undefined) return val;
    
    // Primitive types
    if (typeof val !== 'object' && typeof val !== 'function') return val;
    
    // Treat functions gracefully
    if (typeof val === 'function') {
      return `[Function: ${val.name || 'anonymous'}]`;
    }

    // Check circular references
    if (seen.has(val)) {
      return '[Circular]';
    }
    seen.add(val);

    // Handle common complex objects represented as strings to prevent deep traversal
    try {
      if (val instanceof Node || (typeof val.nodeType === 'number' && typeof val.nodeName === 'string')) {
        return '[DOM Node]';
      }
      if ('_firestore' in val || 'firestore' in val || '_delegate' in val) {
        return `[Firebase ${val.constructor?.name || 'Object'}]`;
      }
    } catch (_) {
      return '[Object]';
    }

    // Handle Date
    if (val instanceof Date) return val.toISOString();
    
    // Handle RegExp
    if (val instanceof RegExp) return val.toString();

    // Handle Array
    if (Array.isArray(val)) {
      return val.map(item => cleanObjectForSerialization(item, seen));
    }

    // Handle Plain Object and others
    const cleaned: any = {};
    
    // Get all enumerable keys, or fallback to Object.getOwnPropertyNames
    let keys: string[] = [];
    try {
      keys = Object.keys(val);
    } catch (_) {
      try {
        keys = Object.getOwnPropertyNames(val);
      } catch (__) {
        return String(val);
      }
    }

    for (const key of keys) {
      // Avoid prototype properties unless they are self-properties
      if (!Object.prototype.hasOwnProperty.call(val, key)) continue;

      try {
        const item = val[key];
        
        // Skip properties that might be hazardous
        if (key === 'toJSON' && typeof item === 'function') {
          // Skip custom toJSON representation if we want custom traversal (e.g. for circularity prevention)
          continue; 
        }

        cleaned[key] = cleanObjectForSerialization(item, seen);
      } catch (_) {
        cleaned[key] = '[Unreadable Property]';
      }
    }
    
    return cleaned;
  };

  try {
    const cleaned = cleanObjectForSerialization(obj);
    return JSON.stringify(cleaned, null, indent);
  } catch (error) {
    try {
      return String(obj);
    } catch (_) {
      return '[Serialization Error]';
    }
  }
}
