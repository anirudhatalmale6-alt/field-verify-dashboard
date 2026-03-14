/**
 * Offline Queue — Stores form submissions + photos in IndexedDB
 * when network is unavailable, and syncs when back online.
 */

const DB_NAME = 'kospl_offline_queue';
const DB_VERSION = 1;
const STORE_NAME = 'pending_submissions';

interface QueuedSubmission {
  id?: number;
  caseId: string;
  customerName: string;
  reportData: Record<string, unknown>;
  photos: { blob: Blob; label: string; lat: number; lng: number }[];
  queuedAt: string;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queueSubmission(
  caseId: string,
  customerName: string,
  reportData: Record<string, unknown>,
  photos: { file: File; label: string; lat: number; lng: number }[]
): Promise<number> {
  const db = await openDB();
  // Convert File objects to Blobs for IndexedDB storage
  const photoBlobs = await Promise.all(
    photos.map(async (p) => ({
      blob: new Blob([await p.file.arrayBuffer()], { type: p.file.type }),
      label: p.label,
      lat: p.lat,
      lng: p.lng,
    }))
  );

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const item: QueuedSubmission = {
      caseId,
      customerName,
      reportData,
      photos: photoBlobs,
      queuedAt: new Date().toISOString(),
      status: 'pending',
    };
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function getPendingSubmissions(): Promise<QueuedSubmission[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function removeSubmission(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function updateSubmissionStatus(id: number, status: 'pending' | 'syncing' | 'failed', error?: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        item.status = status;
        if (error) item.error = error;
        store.put(item);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Try to sync all pending submissions. Returns count of successfully synced items.
 */
export async function syncPendingSubmissions(): Promise<{ synced: number; failed: number }> {
  const items = await getPendingSubmissions();
  const pending = items.filter(i => i.status === 'pending' || i.status === 'failed');
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    if (!item.id) continue;
    try {
      await updateSubmissionStatus(item.id, 'syncing');

      // Submit report
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.reportData),
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const result = await res.json();

      // Upload photos
      if (item.photos.length > 0 && result.id) {
        const formData = new FormData();
        item.photos.forEach((p, i) => {
          const file = new File([p.blob], `photo_${i}.jpg`, { type: p.blob.type || 'image/jpeg' });
          formData.append('photos', file);
          formData.append('labels', p.label);
          formData.append('latitudes', p.lat.toString());
          formData.append('longitudes', p.lng.toString());
        });

        const photoRes = await fetch(`/api/reports/${result.id}/photos`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!photoRes.ok) {
          console.warn('Photos upload failed for queued submission, but report was created');
        }
      }

      await removeSubmission(item.id);
      synced++;
    } catch (err) {
      await updateSubmissionStatus(item.id, 'failed', (err as Error).message);
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Check if we're online with a lightweight ping
 */
export async function isOnline(): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('/api/auth/me', {
      method: 'HEAD',
      credentials: 'include',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok || res.status === 401; // Even 401 means server is reachable
  } catch {
    return false;
  }
}
