import { icon } from "./icons.js";
import { registerOverlay, unregisterOverlay } from "./overlays.js";

const $ = (id) => document.getElementById(id);

export function askConfirm({ title, text, okLabel = "Confirmar", danger = false }) {
  return new Promise((resolve) => {
    const overlay = $("confirmOverlay");
    $("confirmTitle").textContent = title;
    $("confirmText").textContent = text;
    const ok = $("confirmOk");
    const cancel = $("confirmCancel");
    ok.textContent = okLabel;
    ok.classList.toggle("btn-danger", danger);

    const finish = (value) => {
      unregisterOverlay(onBack);
      overlay.classList.remove("open");
      ok.onclick = cancel.onclick = overlay.onclick = null;
      resolve(value);
    };
    const onBack = () => finish(false);
    ok.onclick = () => finish(true);
    cancel.onclick = () => finish(false);
    overlay.onclick = (e) => { if (e.target === overlay) finish(false); };
    registerOverlay(onBack);
    overlay.classList.add("open");
  });
}

/** Janela de resultado (sucesso/aviso) com até 2 botões. */
export function showResultDialog({ iconName = "checkCircle", tone = "success", title, text, primary = "Entendi", secondary = null, onSecondary = null }) {
  const overlay = $("resultOverlay");
  const box = $("resultIcon");
  box.className = `result-icon tone-${tone}`;
  box.innerHTML = icon(iconName);
  $("resultTitle").textContent = title;
  $("resultText").textContent = text;
  const p = $("resultPrimary");
  const s = $("resultSecondary");
  p.textContent = primary;
  s.classList.toggle("hidden", !secondary);
  if (secondary) s.textContent = secondary;

  const close = () => {
    unregisterOverlay(close);
    overlay.classList.remove("open");
    p.onclick = s.onclick = overlay.onclick = null;
  };
  p.onclick = close;
  s.onclick = () => { close(); if (onSecondary) onSecondary(); };
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
  registerOverlay(close);
  overlay.classList.add("open");
}
