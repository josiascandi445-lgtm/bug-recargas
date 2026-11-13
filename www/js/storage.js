/** Acesso seguro ao localStorage (nunca lança erro). */
export const KEYS = {
  settings: "bugshop_settings",
  myIds: "bugshop_my_ids",
  activeId: "bugshop_active_id",
  history: "bugshop_purchase_history",
  onboarded: "bugshop_onboarded",
};

export function readRaw(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function writeRaw(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
export function removeKey(key) {
  try { localStorage.removeItem(key); } catch { /* ignora */ }
}
export function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function writeJSON(key, value) {
  return writeRaw(key, JSON.stringify(value));
}
