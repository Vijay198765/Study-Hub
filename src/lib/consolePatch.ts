/**
 * Safely cleans objects for logging, preventing circular structure errors
 * when the iframe sandboxed environment intercepts console.error / console.warn
 * and runs JSON.stringify on the logged arguments.
 */
export function safeCleanForLogging(val: any, seen = new WeakSet()): any {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object' && typeof val !== 'function') return val;
  if (typeof val === 'function') {
    return `[Function: ${val.name || 'anonymous'}]`;
  }
  
  if (seen.has(val)) {
    return '[Circular]';
  }
  seen.add(val);

  // Handle Date
  if (val instanceof Date) return val.toISOString();
  // Handle RegExp
  if (val instanceof RegExp) return val.toString();

  // Handle standard subclasses of Error (like FirebaseError)
  if (val instanceof Error) {
    const errObj: any = {
      name: val.name,
      message: val.message,
      stack: val.stack
    };
    if ('code' in val) errObj.code = (val as any).code;
    return errObj;
  }

  // Handle DOM elements
  try {
    if (val instanceof Node || (typeof val.nodeType === 'number' && typeof val.nodeName === 'string')) {
      return `[DOM Node: ${val.nodeName}]`;
    }
  } catch (_) {}

  // Handle Array
  if (Array.isArray(val)) {
    return val.map(item => safeCleanForLogging(item, seen));
  }

  // Traverse plain objects
  try {
    const proto = Object.getPrototypeOf(val);
    const isPlain = proto === null || proto === Object.prototype;
    
    if (!isPlain) {
      return `[${val.constructor?.name || 'Object'}]`;
    }
  } catch (_) {
    return '[Object]';
  }

  const cleaned: any = {};
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
    if (!Object.prototype.hasOwnProperty.call(val, key)) continue;
    try {
      cleaned[key] = safeCleanForLogging(val[key], seen);
    } catch (_) {
      cleaned[key] = '[Unreadable]';
    }
  }
  return cleaned;
}

if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = function (...args: any[]) {
    const cleanedArgs = args.map(arg => {
      try {
        return safeCleanForLogging(arg);
      } catch (e) {
        return `[Serialization Error: ${e instanceof Error ? e.message : String(e)}]`;
      }
    });
    originalError.apply(console, cleanedArgs);
  };

  console.warn = function (...args: any[]) {
    const cleanedArgs = args.map(arg => {
      try {
        return safeCleanForLogging(arg);
      } catch (e) {
        return `[Serialization Error: ${e instanceof Error ? e.message : String(e)}]`;
      }
    });
    originalWarn.apply(console, cleanedArgs);
  };
}
