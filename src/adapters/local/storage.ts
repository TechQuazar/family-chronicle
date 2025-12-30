// Local storage utilities for the mock backend

const STORAGE_PREFIX = 'buds_';

export function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

export function getFromStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(getStorageKey(key));
    if (!item) return null;
    return JSON.parse(item, dateReviver) as T;
  } catch {
    return null;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  localStorage.setItem(getStorageKey(key), JSON.stringify(value));
}

export function removeFromStorage(key: string): void {
  localStorage.removeItem(getStorageKey(key));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Date reviver for JSON.parse to restore Date objects
function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === 'string') {
    // Check if it's an ISO date string
    const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (dateRegex.test(value)) {
      return new Date(value);
    }
  }
  return value;
}
