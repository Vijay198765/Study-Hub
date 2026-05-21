import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertDriveUrl(url: string | undefined): string {
  if (!url) return '';
  
  // Handle Google Drive links
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/d\/([^/&?]+)/) || url.match(/id=([^&?#]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      // Use LH3 proxy with s0 for original resolution
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}=s0`;
    }
  }

  // Handle Google Profile Photos and Google User Content
  if (url.includes('googleusercontent.com') || url.includes('google.com') || url.includes('ggpht.com')) {
    let processedUrl = url;
    // Replace size parameters like =s96-c, =s400, =s32, /s96-c/ with original version =s0 or /s0/
    processedUrl = processedUrl.replace(/=s\d+[^&?#]*/g, '=s0');
    processedUrl = processedUrl.replace(/\/s\d+[^/]*\//g, '/s0/');
    
    // Also handle h96-c or w96-c parameters
    processedUrl = processedUrl.replace(/=[hw]\d+[^&?#]*/g, '=s0');
    processedUrl = processedUrl.replace(/\/w\d+[^/]*\//g, '/s0/');
    processedUrl = processedUrl.replace(/\/h\d+[^/]*\//g, '/s0/');
    
    return processedUrl;
  }

  // Handle GitHub Avatars size parameter
  if (url.includes('githubusercontent.com')) {
    let processedUrl = url;
    // Replace s=... parameter with s=1000 for maximum resolution
    processedUrl = processedUrl.replace(/([?&])s=\d+/g, '$1s=1000');
    return processedUrl;
  }

  // Handle Twitter Avatars size parameter
  if (url.includes('twimg.com')) {
    // Twitter avatars usually end with _normal.jpg or _normal.png or similar
    return url.replace('_normal.', '_400x400.');
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

    // Handle standard subclasses of Error
    if (val instanceof Error) {
      return {
        name: val.name,
        message: val.message,
        stack: val.stack,
        ...(typeof (val as any).code !== 'undefined' ? { code: (val as any).code } : {}),
        ...(typeof (val as any).customData !== 'undefined' ? { customData: cleanObjectForSerialization((val as any).customData, seen) } : {})
      };
    }

    // Handle Date
    if (val instanceof Date) return val.toISOString();
    
    // Handle RegExp
    if (val instanceof RegExp) return val.toString();

    // Handle Array
    if (Array.isArray(val)) {
      return val.map(item => cleanObjectForSerialization(item, seen));
    }

    // Only deeply traverse plain objects
    const proto = Object.getPrototypeOf(val);
    const isPlain = proto === null || proto === Object.prototype;
    
    if (!isPlain) {
      // Class instances (like Three.js objects or React components)
      return `[${val.constructor?.name || 'Object'}]`;
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
