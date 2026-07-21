/**
 * Buffer hors ligne IndexedDB pour les points GPS (max 20 / voyage, FIFO).
 */

import { GEO_OFFLINE_BUFFER_MAX } from "@/features/trips/lib/geolocation";

const DB_NAME = "sebavio-geo";
const DB_VERSION = 1;
const STORE = "trip_location_buffer";

export type BufferedLocationPoint = {
  clientPointId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  accuracyM: number | null;
  heading: number | null;
  speedMps: number | null;
  recordedAt: string;
};

/** FIFO pure — testable sans IndexedDB. */
export function applyFifoBuffer(
  existing: BufferedLocationPoint[],
  point: BufferedLocationPoint,
  maxPoints = GEO_OFFLINE_BUFFER_MAX,
): BufferedLocationPoint[] {
  const withoutDup = existing.filter(
    (p) => p.clientPointId !== point.clientPointId,
  );
  return [...withoutDup, point]
    .sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    )
    .slice(-maxPoints);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "clientPointId" });
        store.createIndex("tripId", "tripId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB tx failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB tx aborted"));
  });
}

export async function enqueueLocationPoint(
  point: BufferedLocationPoint,
  maxPoints = GEO_OFFLINE_BUFFER_MAX,
): Promise<void> {
  const db = await openDb();
  try {
    const readTx = db.transaction(STORE, "readonly");
    const index = readTx.objectStore(STORE).index("tripId");
    const existing = await new Promise<BufferedLocationPoint[]>(
      (resolve, reject) => {
        const req = index.getAll(point.tripId);
        req.onsuccess = () =>
          resolve((req.result as BufferedLocationPoint[]) ?? []);
        req.onerror = () => reject(req.error);
      },
    );
    await txDone(readTx);

    const next = applyFifoBuffer(existing, point, maxPoints);

    const writeTx = db.transaction(STORE, "readwrite");
    const store = writeTx.objectStore(STORE);
    for (const old of existing) {
      store.delete(old.clientPointId);
    }
    for (const p of next) {
      store.put(p);
    }
    await txDone(writeTx);
  } finally {
    db.close();
  }
}

export async function listBufferedPoints(
  tripId: string,
): Promise<BufferedLocationPoint[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readonly");
    const index = tx.objectStore(STORE).index("tripId");
    const rows = await new Promise<BufferedLocationPoint[]>(
      (resolve, reject) => {
        const req = index.getAll(tripId);
        req.onsuccess = () =>
          resolve((req.result as BufferedLocationPoint[]) ?? []);
        req.onerror = () => reject(req.error);
      },
    );
    await txDone(tx);
    return rows.sort(
      (a, b) =>
        new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
    );
  } finally {
    db.close();
  }
}

export async function removeBufferedPoints(
  clientPointIds: string[],
): Promise<void> {
  if (clientPointIds.length === 0) return;
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const id of clientPointIds) {
      store.delete(id);
    }
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function clearTripLocationBuffer(tripId: string): Promise<void> {
  const points = await listBufferedPoints(tripId);
  await removeBufferedPoints(points.map((p) => p.clientPointId));
}
