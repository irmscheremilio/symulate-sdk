/**
 * LocalStorage persistence for browser environments
 * Provides persistent storage that survives page refreshes
 */

const LOCALSTORAGE_KEY = 'symulate-collections';

/**
 * Browser environment detection
 */
const isBrowser = typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined';

/**
 * Load all collection data from localStorage
 */
async function loadAllData(): Promise<Record<string, any[]>> {
  if (!isBrowser) {
    return {};
  }

  try {
    const stored = (globalThis as any).localStorage?.getItem(LOCALSTORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return {};
  } catch (error) {
    console.warn('[Symulate] Failed to load from localStorage:', error);
    return {};
  }
}

/**
 * Save all collection data to localStorage
 */
async function saveAllData(data: Record<string, any[]>): Promise<void> {
  if (!isBrowser) {
    return;
  }

  try {
    (globalThis as any).localStorage?.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[Symulate] Failed to save to localStorage:', error);

    // Check if quota exceeded
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('[Symulate] LocalStorage quota exceeded. Consider using fewer collections or smaller datasets.');
    }
    throw error;
  }
}

/**
 * Load data for specific collection
 */
export async function loadFromLocalStorage<T>(collectionName: string): Promise<T[] | null> {
  const allData = await loadAllData();
  return allData[collectionName] || null;
}

/**
 * Save data for specific collection
 */
export async function saveToLocalStorage<T>(collectionName: string, data: T[]): Promise<void> {
  const allData = await loadAllData();
  allData[collectionName] = data;
  await saveAllData(allData);
}

/**
 * Delete data for specific collection
 */
export async function deleteFromLocalStorage(collectionName: string): Promise<void> {
  const allData = await loadAllData();
  delete allData[collectionName];
  await saveAllData(allData);
}

/**
 * Clear all persisted data from localStorage
 */
export async function clearLocalStorage(): Promise<void> {
  if (!isBrowser) {
    return;
  }

  try {
    (globalThis as any).localStorage?.removeItem(LOCALSTORAGE_KEY);
  } catch (error) {
    console.error('[Symulate] Failed to clear localStorage:', error);
  }
}
