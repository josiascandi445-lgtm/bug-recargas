/** Peças visuais reutilizáveis: avatar, selos, emblemas de nível, datas. */
import { icon } from "./icons.js";
import { escapeHtml } from "./utils/html.js";

export function displayName(profile) {
  return (profile && (profile.nick || profile.displayName || (profile.email || "").split("@")[0])) || "Jogador";
}

export function safeImage(src) {
  return typeof src === "string" && src.startsWith("data:image/") ? src : "";
}

export function avatarHTML(profile) {
  const src = safeImage(profile && profile.photoURL);
  if (src) return `<img src="${src}" alt="" />`;
  return `<span>${escapeHtml(displayName(profile).charAt(0).toUpperCase())}</span>`;
}

export function sealSVG(kind, size = 18) {
  if (!kind) return "";
  const verified = kind === "verified";
  const fill = verified ? "#34d058" : "#c3ccd8";
  const check = verified ? "#ffffff" : "#586274";
  const label = verified ? "Selo verificado" : "Selo prateado";
  return `<svg class="seal seal-${kind}" width="${size}" height="${size}" viewBox="0 0 24 24" role="img" aria-label="${label}"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" fill="${fill}"/><path d="m9 12 2 2 4-4" fill="none" stroke="${check}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

export function levelEmblem(level) {
  return `<span class="level-emblem" style="--lv:${level.color}">${icon(level.emblem)}</span>`;
}

export function formatDateTime(date) {
  if (!date) return "—";
  const d = date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
  const t = date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  return `${d} às ${t}`;
}
