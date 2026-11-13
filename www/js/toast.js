import { icon } from "./icons.js";

let container = null;

function getContainer() {
  if (container) return container;
  container = document.createElement("div");
  container.className = "toast-container";
  container.setAttribute("aria-live", "polite");
  container.setAttribute("role", "status");
  document.body.appendChild(container);
  return container;
}

const ICONS_BY_TYPE = {
  success: "checkCircle",
  error: "alertCircle",
  info: "zap",
};

/**
 * Mostra uma notificação curta no canto da tela.
 * type: "success" | "error" | "info"
 */
export function showToast(message, type = "info", duration = 3200) {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `${icon(ICONS_BY_TYPE[type] || "zap")}<span>${message}</span>`;

  getContainer().appendChild(el);

  requestAnimationFrame(() => el.classList.add("visible"));

  setTimeout(() => {
    el.classList.remove("visible");
    setTimeout(() => el.remove(), 220);
  }, duration);
}
