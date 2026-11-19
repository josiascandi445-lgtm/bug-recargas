/** Central de notificações (sino na barra de cima). */
import { icon } from "./icons.js";
import { session, collectGift, markNotificationsRead } from "./session.js";
import { registerOverlay, unregisterOverlay } from "./overlays.js";
import { escapeHtml } from "./utils/html.js";
import { formatPoints } from "./levels.js";
import { formatDateTime } from "./ui.js";
import { showToast } from "./toast.js";
import { haptic, playSound } from "./feedback.js";

const $ = (id) => document.getElementById(id);
let isOpen = false;

const TYPES = {
  gift: { icon: "gift", tone: "gift", label: "Presente do administrador" },
  redeem_sent: { icon: "clock", tone: "wait", label: "Recompensa" },
  redeem_done: { icon: "checkCircle", tone: "done", label: "Recompensa" },
  redeem_rejected: { icon: "alertCircle", tone: "warn", label: "Recompensa" },
  points: { icon: "trophy", tone: "points", label: "Pontos" },
  ban: { icon: "ban", tone: "warn", label: "Conta" },
  info: { icon: "bell", tone: "info", label: "Aviso" },
};

function unreadCount() {
  return session.notifications.filter((n) => !n.read || (n.type === "gift" && !n.collected)).length;
}

function updateBadge() {
  const n = unreadCount();
  const badge = $("bellBadge");
  badge.textContent = n > 9 ? "9+" : String(n);
  badge.classList.toggle("hidden", n === 0);
}

function cardHTML(n) {
  const t = TYPES[n.type] || TYPES.info;
  const isGift = n.type === "gift";
  const unread = !n.read;
  return `
    <article class="notif-card tone-${t.tone}${unread ? " unread" : ""}">
      <div class="notif-icon">${icon(t.icon)}</div>
      <div class="notif-body">
        <div class="notif-meta"><span>${isGift ? "Presente do administrador" : t.label}</span><time>${formatDateTime(n.createdAt)}</time></div>
        <h3>${escapeHtml(n.title || "")}</h3>
        <p>${escapeHtml(n.message || "")}</p>
        ${
          isGift
            ? `<div class="gift-row">
                 <div class="gift-points"><strong>+${formatPoints(n.points)}</strong><span>pontos</span></div>
                 ${
                   n.collected
                     ? `<span class="gift-done">${icon("check")} Coletado</span>`
                     : `<button class="btn btn-primary" type="button" data-collect="${n.id}">Coletar</button>`
                 }
               </div>`
            : ""
        }
      </div>
    </article>`;
}

export function renderNotifications() {
  updateBadge();
  const list = $("notifList");
  const empty = $("notifEmpty");
  const items = session.notifications;
  empty.classList.toggle("hidden", items.length > 0);
  list.innerHTML = items.map(cardHTML).join("");
}

function open() {
  isOpen = true;
  renderNotifications();
  $("notifOverlay").classList.add("open");
  document.body.classList.add("no-scroll");
  registerOverlay(close);
  setTimeout(() => {
    const ids = session.notifications.filter((n) => !n.read).map((n) => n.id);
    markNotificationsRead(ids).catch(() => {});
  }, 900);
}

function close() {
  isOpen = false;
  unregisterOverlay(close);
  $("notifOverlay").classList.remove("open");
  document.body.classList.remove("no-scroll");
}

export function initNotifications() {
  $("bellBtn").innerHTML = icon("bell") + '<span class="bell-badge hidden" id="bellBadge">0</span>';
  $("bellBtn").addEventListener("click", open);
  $("notifClose").addEventListener("click", close);
  $("notifOverlay").addEventListener("click", (e) => { if (e.target === $("notifOverlay")) close(); });

  $("notifList").addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-collect]");
    if (!btn) return;
    btn.disabled = true;
    try {
      const pts = await collectGift(btn.dataset.collect);
      haptic("success");
      playSound("success");
      showToast(`+${formatPoints(pts)} pontos adicionados`, "success", 2600);
    } catch (err) {
      btn.disabled = false;
      showToast("Não foi possível coletar agora. Tenta de novo.", "error");
    }
  });

  document.addEventListener("session:notifications", () => {
    if (isOpen) renderNotifications();
    else updateBadge();
  });
  document.addEventListener("session:changed", updateBadge);
}
