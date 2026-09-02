// Cliente de sincronización híbrido: LocalStorage + Cloudflare D1
// Funciona offline de forma instantánea y sincroniza en la nube al estar en Cloudflare Pages

const isBrowser = typeof window !== "undefined";

export async function fetchStateFromCloud() {
  if (!isBrowser) return null;
  try {
    const res = await fetch("/api/state", { method: "GET" });
    if (!res.ok) return null;
    const json = await res.json();
    if (json && json.success && json.data && Object.keys(json.data).length > 0) {
      return json.data;
    }
    return null;
  } catch (e) {
    // Si estamos en local sin el worker levantado, retorna null silenciosamente
    return null;
  }
}

export async function syncKeyWithCloud(key, value) {
  if (!isBrowser) return;
  try {
    await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  } catch (e) {
    // Fallback silencioso a offline
  }
}

export async function loadKeyWithSync(key, fallback) {
  if (!isBrowser) return fallback;
  try {
    // 1. Primero intentar cargar de localStorage para carga inmediata (0ms)
    const local = window.localStorage.getItem(key);
    let parsedLocal = null;
    if (local) {
      try {
        parsedLocal = JSON.parse(local);
      } catch (e) {
        parsedLocal = null;
      }
    }

    return parsedLocal !== null ? parsedLocal : fallback;
  } catch (e) {
    return fallback;
  }
}

export async function saveKeyWithSync(key, value) {
  if (!isBrowser) return;
  try {
    // 1. Guardar localmente
    window.localStorage.setItem(key, JSON.stringify(value));
    // 2. Sincronizar en segundo plano con D1
    syncKeyWithCloud(key, value);
  } catch (e) {
    console.error("Storage error", key, e);
  }
}
