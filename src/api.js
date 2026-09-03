// Cliente de sincronización híbrido: LocalStorage + Cloudflare D1
// Funciona offline instantáneamente y sincroniza con Cloudflare D1 en la nube

const isBrowser = typeof window !== "undefined";

// Estado de sincronización actual: 'synced' | 'syncing' | 'local' | 'error'
let currentSyncStatus = "local";
const statusListeners = new Set();

export function getSyncStatus() {
  return currentSyncStatus;
}

export function subscribeSyncStatus(listener) {
  statusListeners.add(listener);
  listener(currentSyncStatus);
  return () => statusListeners.delete(listener);
}

function setSyncStatus(newStatus) {
  if (currentSyncStatus !== newStatus) {
    currentSyncStatus = newStatus;
    statusListeners.forEach((fn) => {
      try {
        fn(currentSyncStatus);
      } catch (err) {
        console.error("Error en listener de sincronización:", err);
      }
    });
  }
}

// Comprueba la salud del backend y si D1 está activo
export async function checkCloudHealth() {
  if (!isBrowser) return { ok: false, d1: false };
  try {
    const res = await fetch("/api/health", { method: "GET" });
    if (!res.ok) return { ok: false, d1: false };
    const json = await res.json();
    return { ok: json?.status === "ok", d1: Boolean(json?.d1) };
  } catch {
    return { ok: false, d1: false };
  }
}

// Obtiene todo el estado almacenado en Cloudflare D1
export async function fetchStateFromCloud() {
  if (!isBrowser) return null;
  try {
    const res = await fetch("/api/state", { method: "GET" });
    if (!res.ok) {
      setSyncStatus("local");
      return null;
    }
    const json = await res.json();
    
    // Si la base de datos D1 no está configurada aún en Cloudflare Pages
    if (json && json.d1_configured === false) {
      setSyncStatus("local");
      return null;
    }

    if (json && json.success && json.data) {
      setSyncStatus("synced");
      return json.data;
    }

    setSyncStatus("local");
    return null;
  } catch (e) {
    setSyncStatus("local");
    return null;
  }
}

// Cola y debounce para evitar peticiones excesivas mientras el usuario escribe
let pendingQueue = {};
let debounceTimer = null;
const DEBOUNCE_MS = 500;

async function flushSyncQueue() {
  if (!isBrowser || Object.keys(pendingQueue).length === 0) return;

  const payload = { ...pendingQueue };
  pendingQueue = {};
  setSyncStatus("syncing");

  try {
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.d1_configured === false) {
        setSyncStatus("local");
      } else {
        setSyncStatus("synced");
      }
    } else {
      setSyncStatus("error");
    }
  } catch (err) {
    console.warn("Fallo de red al sincronizar con Cloudflare D1. Guardado en modo local.", err);
    setSyncStatus("local");
  }
}

export function syncKeyWithCloud(key, value) {
  if (!isBrowser) return;
  pendingQueue[key] = value;
  setSyncStatus("syncing");

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    flushSyncQueue();
  }, DEBOUNCE_MS);
}

export function loadKeyWithSync(key, fallback) {
  if (!isBrowser) return fallback;
  try {
    const local = window.localStorage.getItem(key);
    if (!local) return fallback;
    const parsed = JSON.parse(local);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    return fallback;
  }
}

export function saveKeyWithSync(key, value) {
  if (!isBrowser) return;
  try {
    // 1. Guardar de inmediato en LocalStorage (0ms de latencia para el usuario)
    window.localStorage.setItem(key, JSON.stringify(value));
    // 2. Enviar a Cloudflare D1 con debounce
    syncKeyWithCloud(key, value);
  } catch (e) {
    console.error("Error guardando localmente:", key, e);
  }
}

// Guarda un lote de claves simultáneamente tanto en local como en la nube
export async function saveBatchWithSync(batchObj) {
  if (!isBrowser || !batchObj) return;
  try {
    // 1. Guardar cada clave en localStorage
    for (const [k, v] of Object.entries(batchObj)) {
      window.localStorage.setItem(k, JSON.stringify(v));
    }

    // 2. Sincronizar de inmediato con D1
    setSyncStatus("syncing");
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batchObj),
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.d1_configured === false) {
        setSyncStatus("local");
      } else {
        setSyncStatus("synced");
      }
    } else {
      setSyncStatus("error");
    }
  } catch (e) {
    setSyncStatus("local");
  }
}
