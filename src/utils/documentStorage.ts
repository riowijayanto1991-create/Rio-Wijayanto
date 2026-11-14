import { MonthlyReportDocument, DutyRosterDocument } from '../types';
import { OFFICIAL_OCTOBER_ROSTER_DOCUMENT } from '../data/officialOctoberRoster';

const DB_NAME = 'whms_archive_db';
const DB_VERSION = 3;
const STORE_NAME = 'monthly_documents';
const ROSTER_STORE_NAME = 'duty_rosters';
const LOCAL_STORAGE_KEY = 'whms_monthly_documents_cache';
const ROSTER_LOCAL_STORAGE_KEY = 'whms_roster_documents_cache';

/**
 * Open or initialize the IndexedDB for large document archiving
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(ROSTER_STORE_NAME)) {
          db.createObjectStore(ROSTER_STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        console.warn('IndexedDB upgrade blocked by another connection');
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Save full document (including base64 fileData) to IndexedDB and metadata cache
 */
export async function saveDocumentLocally(docItem: MonthlyReportDocument): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(docItem);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Also update lightweight metadata in localStorage
    try {
      const current = getLocalMetadataCache();
      const stripped = { ...docItem };
      // Omit heavy fileData from localStorage to respect 5MB localStorage limit
      delete stripped.fileData;
      const updated = [stripped, ...current.filter(d => d.id !== docItem.id)];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore localStorage quota errors
    }
  } catch (err) {
    console.warn('IndexedDB write warning, fallback to memory:', err);
  }
}

/**
 * Get single document with full fileData from IndexedDB
 */
export async function getDocumentWithFileData(id: string): Promise<MonthlyReportDocument | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Get all stored documents from IndexedDB
 */
export async function getAllLocalDocuments(): Promise<MonthlyReportDocument[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Delete a document from IndexedDB and localStorage
 */
export async function deleteDocumentLocally(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });

    try {
      const current = getLocalMetadataCache();
      const updated = current.filter(d => d.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
}

/**
 * Get fast synchronous metadata cache from localStorage
 */
export function getLocalMetadataCache(): MonthlyReportDocument[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Save Duty Roster document locally
 */
export async function saveRosterLocally(rosterDoc: DutyRosterDocument): Promise<void> {
  // Always update local storage metadata first as resilient immediate fallback
  try {
    const stripped = { ...rosterDoc };
    delete stripped.fileData;
    const raw = localStorage.getItem(ROSTER_LOCAL_STORAGE_KEY);
    const current: DutyRosterDocument[] = raw ? JSON.parse(raw) : [];
    const updated = [stripped, ...current.filter(r => r.id !== rosterDoc.id)];
    localStorage.setItem(ROSTER_LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(ROSTER_STORE_NAME)) {
      console.warn(`Object store "${ROSTER_STORE_NAME}" not present, using localStorage cache.`);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(ROSTER_STORE_NAME, 'readwrite');
      const store = tx.objectStore(ROSTER_STORE_NAME);
      const req = store.put(rosterDoc);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB roster write warning:', err);
  }
}

/**
 * Get duty roster with full fileData from IndexedDB
 */
export async function getRosterWithFileData(id: string): Promise<DutyRosterDocument | null> {
  try {
    const db = await openDB();
    if (!db.objectStoreNames.contains(ROSTER_STORE_NAME)) {
      return null;
    }
    return new Promise((resolve) => {
      const tx = db.transaction(ROSTER_STORE_NAME, 'readonly');
      const store = tx.objectStore(ROSTER_STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Get all stored duty roster documents from IndexedDB or localStorage
 */
export async function getAllLocalRosters(): Promise<DutyRosterDocument[]> {
  try {
    const db = await openDB();
    if (db.objectStoreNames.contains(ROSTER_STORE_NAME)) {
      const items: DutyRosterDocument[] = await new Promise((resolve) => {
        const tx = db.transaction(ROSTER_STORE_NAME, 'readonly');
        const store = tx.objectStore(ROSTER_STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
      if (items && items.length > 0) {
        if (!items.some(d => d.periodeBulan.toLowerCase() === 'oktober' && d.periodeTahun === 2026)) {
          return [OFFICIAL_OCTOBER_ROSTER_DOCUMENT, ...items];
        }
        return items;
      }
    }
  } catch (err) {
    console.warn('Error reading IndexedDB rosters, fallback to localStorage:', err);
  }

  const cached = getLocalRosterMetadataCache();
  if (!cached.some(d => d.periodeBulan.toLowerCase() === 'oktober' && d.periodeTahun === 2026)) {
    return [OFFICIAL_OCTOBER_ROSTER_DOCUMENT, ...cached];
  }
  return cached;
}

/**
 * Get synchronous metadata cache for duty rosters from localStorage
 */
export function getLocalRosterMetadataCache(): DutyRosterDocument[] {
  try {
    const raw = localStorage.getItem(ROSTER_LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!parsed.some(d => d.periodeBulan.toLowerCase() === 'oktober' && d.periodeTahun === 2026)) {
          return [OFFICIAL_OCTOBER_ROSTER_DOCUMENT, ...parsed];
        }
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [OFFICIAL_OCTOBER_ROSTER_DOCUMENT];
}

/**
 * Delete duty roster document locally
 */
export async function deleteRosterLocally(id: string): Promise<void> {
  try {
    const db = await openDB();
    if (db.objectStoreNames.contains(ROSTER_STORE_NAME)) {
      await new Promise<void>((resolve) => {
        const tx = db.transaction(ROSTER_STORE_NAME, 'readwrite');
        const store = tx.objectStore(ROSTER_STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    }
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem(ROSTER_LOCAL_STORAGE_KEY);
    if (raw) {
      const current: DutyRosterDocument[] = JSON.parse(raw);
      const updated = current.filter(r => r.id !== id);
      localStorage.setItem(ROSTER_LOCAL_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
}

/**
 * Merge Firestore duty roster documents with local IndexedDB records
 */
export async function mergeRostersWithLocalCache(
  firestoreDocs: DutyRosterDocument[]
): Promise<DutyRosterDocument[]> {
  try {
    const merged: DutyRosterDocument[] = [];
    const seenIds = new Set<string>();

    for (const doc of firestoreDocs) {
      seenIds.add(doc.id);
      if (doc.fileData && doc.fileData.startsWith('data:')) {
        merged.push(doc);
      } else {
        const localDoc = await getRosterWithFileData(doc.id);
        if (localDoc && localDoc.fileData) {
          merged.push({ ...doc, fileData: localDoc.fileData });
        } else {
          merged.push(doc);
        }
      }
    }

    // Include local docs not in firestore
    const localDocs = await getAllLocalRosters();
    for (const loc of localDocs) {
      if (!seenIds.has(loc.id)) {
        seenIds.add(loc.id);
        merged.push(loc);
      }
    }

    if (!merged.some(d => d.periodeBulan.toLowerCase() === 'oktober' && d.periodeTahun === 2026)) {
      merged.unshift(OFFICIAL_OCTOBER_ROSTER_DOCUMENT);
    }

    return merged;
  } catch {
    if (!firestoreDocs.some(d => d.periodeBulan.toLowerCase() === 'oktober' && d.periodeTahun === 2026)) {
      return [OFFICIAL_OCTOBER_ROSTER_DOCUMENT, ...firestoreDocs];
    }
    return firestoreDocs;
  }
}


