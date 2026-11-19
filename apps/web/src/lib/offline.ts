/**
 * Encrypted-at-rest-ready offline cache for "Matchday Ready" playbooks.
 * Uses IndexedDB so tactical documents remain available at venues with unstable LAN.
 */

const DB_NAME = 'nexus-offline';
const STORE = 'playbooks';
const VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface CachedPlaybook {
  id: string;
  title: string;
  mapName: string;
  scenarioType: string;
  canvasData: any;
  patchVersion?: string;
  cachedAt: string;
}

export async function cachePlaybook(playbook: any): Promise<void> {
  const db = await openDB();
  const entry: CachedPlaybook = {
    id: playbook.id,
    title: playbook.title,
    mapName: playbook.mapName,
    scenarioType: playbook.scenarioType,
    canvasData: playbook.canvasData,
    patchVersion: playbook.patchVersion,
    cachedAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedPlaybook(id: string): Promise<CachedPlaybook | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllCached(): Promise<CachedPlaybook[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function removeCached(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
