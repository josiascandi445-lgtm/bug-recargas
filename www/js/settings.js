import { readJSON, writeJSON, removeKey, KEYS } from "./storage.js";

const DEFAULTS = { theme: "neon", accent: null, haptics: true, sound: false };
let cache = null;

function emit() {
  document.dispatchEvent(new CustomEvent("app:settings-changed", { detail: cache }));
}

export function getSettings() {
  if (!cache) cache = { ...DEFAULTS, ...(readJSON(KEYS.settings, {}) || {}) };
  return cache;
}

export function updateSettings(patch) {
  cache = { ...getSettings(), ...patch };
  writeJSON(KEYS.settings, cache);
  emit();
  return cache;
}

export function resetSettings() {
  cache = { ...DEFAULTS };
  removeKey(KEYS.settings);
  emit();
}
