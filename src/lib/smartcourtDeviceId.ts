/**
 * Anonymous repeat-contributor key (browser localStorage). Client-only persistence.
 * Matches signup-sheet fallback when crypto.randomUUID is unavailable (non-secure origins).
 */
const STORAGE_KEY = 'smartcourt_device_id';

function newRandomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Returns a stable id for this browser profile; creates and stores one if missing. */
export function getOrCreateSmartcourtDeviceId(): string {
  if (typeof window === 'undefined') {
    return newRandomId();
  }
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = newRandomId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return newRandomId();
  }
}

/** Call once on mount in client shells so the id exists before first submit. */
export function ensureSmartcourtDeviceIdOnPageLoad(): void {
  getOrCreateSmartcourtDeviceId();
}
