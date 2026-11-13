/** "Meus IDs" — vários IDs de jogador guardados neste aparelho. */
import { readJSON, writeJSON, readRaw, writeRaw, removeKey, KEYS } from "./storage.js";

export const MAX_IDS = 10;

function emit() {
  document.dispatchEvent(new CustomEvent("app:myids-changed"));
}

export function getMyIds() {
  const list = readJSON(KEYS.myIds, []);
  return Array.isArray(list) ? list : [];
}

function persist(list) {
  writeJSON(KEYS.myIds, list);
  emit();
}

export function findMyId(id) {
  return getMyIds().find((item) => item.id === id) || null;
}

export function displayName(item) {
  return item.label || item.nick || "Jogador";
}

/** Devolve { ok, existed } ou { ok:false, reason:"limit" }. */
export function saveMyId({ id, label = "", nick = null }) {
  const list = getMyIds();
  const existing = list.find((item) => item.id === id);
  if (existing) {
    if (label) existing.label = label;
    if (nick) existing.nick = nick;
    persist(list);
    return { ok: true, existed: true };
  }
  if (list.length >= MAX_IDS) return { ok: false, reason: "limit" };
  list.push({ id, label, nick, createdAt: Date.now() });
  persist(list);
  return { ok: true, existed: false };
}

export function updateMyIdNick(id, nick) {
  if (!nick) return;
  const list = getMyIds();
  const existing = list.find((item) => item.id === id);
  if (!existing || existing.nick === nick) return;
  existing.nick = nick;
  persist(list);
}

export function removeMyId(id) {
  persist(getMyIds().filter((item) => item.id !== id));
  if (readRaw(KEYS.activeId) === id) setActiveId(null);
}

export function setActiveId(id) {
  if (id) writeRaw(KEYS.activeId, id);
  else removeKey(KEYS.activeId);
  emit();
}

/** ID ativo: o escolhido, ou o único guardado. */
export function getActiveId() {
  const list = getMyIds();
  const chosen = readRaw(KEYS.activeId);
  if (chosen && list.some((item) => item.id === chosen)) return chosen;
  return list.length === 1 ? list[0].id : null;
}

export function clearMyIds() {
  removeKey(KEYS.myIds);
  removeKey(KEYS.activeId);
  emit();
}
