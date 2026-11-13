const STORAGE_KEY = 'as_computer_cached_bootstrap';
const IDB_NAME = 'as_computer_db_v1';
const IDB_STORE = 'snapshots';
const IDB_KEY = 'bootstrap_snapshot';

function openIdb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise(resolve => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveToIdb(snapshot: any): Promise<void> {
  try {
    const db = await openIdb();
    if (!db) return;
    await new Promise<void>(resolve => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(snapshot, IDB_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {
    // Ignore IDB errors silently
  }
}

export async function loadFromIdb(): Promise<any | null> {
  try {
    const db = await openIdb();
    if (!db) return null;
    return await new Promise<any | null>(resolve => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => {
        const val = req.result || null;
        db.close();
        resolve(val);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export function saveLocalBootstrapSnapshot(snapshot: any, cacheVersion: string): void {
  const payload = { ...snapshot, cacheVersion };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('localStorage write warning (falling back to IndexedDB):', e);
  }
  void saveToIdb(payload);
}

export async function loadLocalBootstrapSnapshot(cacheVersion: string): Promise<any | null> {
  try {
    const cachedStr = localStorage.getItem(STORAGE_KEY);
    if (cachedStr) {
      const parsed = JSON.parse(cachedStr);
      if (parsed && parsed.cacheVersion === cacheVersion) {
        return parsed;
      }
      // Migrate older valid offline cache if it actually has user-created records/expenses/purchases
      if (
        parsed &&
        !parsed.cacheVersion &&
        ((parsed.expenses && parsed.expenses.length > 0) ||
          (parsed.purchases && parsed.purchases.length > 0) ||
          (parsed.cashClosings && parsed.cashClosings.length > 0) ||
          (parsed.records && parsed.records.length > 0))
      ) {
        const migrated = { ...parsed, cacheVersion };
        saveLocalBootstrapSnapshot(migrated, cacheVersion);
        return migrated;
      }
    }
  } catch {
    // Ignore parse failure
  }

  const idbData = await loadFromIdb();
  if (idbData && idbData.cacheVersion === cacheVersion) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(idbData));
    } catch {}
    return idbData;
  }

  return null;
}

export async function clearLocalBootstrapSnapshot(): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  try {
    const db = await openIdb();
    if (!db) return;
    await new Promise<void>(resolve => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(IDB_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch {}
}
