import { icon } from "./icons.js";
import { readJSON, writeJSON, KEYS } from "./storage.js";
import { escapeHtml } from "./utils/html.js";
import { formatKz } from "./utils/whatsapp.js";
import { session } from "./session.js";
import { pointsForPrice } from "./levels.js";

const MAX_LOCAL = 30;
const STATUS = {
  pendente: { label: "Pendente", cls: "wait" },
  pago: { label: "Pago", cls: "info" },
  concluido: { label: "Concluído", cls: "done" },
};

function readLocal() {
  const items = readJSON(KEYS.history, []);
  return Array.isArray(items) ? items : [];
}

/** Guarda também uma cópia local (usada só se a conta ainda não carregou). */
export function addToHistory(entry) {
  const items = readLocal();
  items.unshift({ ...entry, timestamp: Date.now() });
  writeJSON(KEYS.history, items.slice(0, MAX_LOCAL));
  renderHistory();
}

function formatRelativeDate(date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const time = date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Hoje, ${time}`;
  if (date.toDateString() === yesterday.toDateString()) return `Ontem, ${time}`;
  return `${date.toLocaleDateString("pt-PT")}, ${time}`;
}

function currentItems() {
  if (session.user) {
    return session.orders.map((o) => ({
      amountLabel: o.amountLabel || o.productName || "Recarga",
      price: o.price || 0,
      priceLabel: formatKz(o.price || 0),
      playerId: o.playerId,
      productId: o.productId,
      date: o.createdAt,
      status: o.status || "pendente",
      pointsAwarded: o.pointsAwarded || 0,
    }));
  }
  return readLocal().map((o) => ({
    amountLabel: o.amountLabel, priceLabel: o.priceLabel, price: 0, playerId: o.playerId,
    productId: o.productId, date: new Date(o.timestamp), status: null, pointsAwarded: 0,
  }));
}

export function renderHistory() {
  const list = document.getElementById("historyList");
  const empty = document.getElementById("historyEmpty");
  if (!list || !empty) return;

  const items = currentItems();
  if (!items.length) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  list.innerHTML = items
    .map((item, index) => {
      const st = item.status ? STATUS[item.status] || STATUS.pendente : null;
      const pts = item.status === "concluido" && item.pointsAwarded
        ? `<span class="pts-chip earned">+${item.pointsAwarded} pts</span>`
        : item.status && item.status !== "concluido" && item.price > 0
          ? `<span class="pts-chip">Ganha ${pointsForPrice(item.price)} pts ao concluir</span>`
          : "";
      return `
        <li class="history-item">
          <span class="h-icon">${icon("gem")}</span>
          <div class="history-item-info">
            <span class="history-item-title">${escapeHtml(item.amountLabel)}</span>
            <span class="history-item-date">${formatRelativeDate(item.date)}${item.playerId ? ` · ID ${escapeHtml(item.playerId)}` : ""}</span>
            <span class="h-tags">${st ? `<span class="chip chip-${st.cls}">${st.label}</span>` : ""}${pts}</span>
          </div>
          <div class="history-item-side">
            <span class="history-item-price">${escapeHtml(item.priceLabel)}</span>
            ${item.productId ? `<button type="button" class="history-repeat" data-repeat="${index}">${icon("repeat")} Repetir</button>` : ""}
          </div>
        </li>`;
    })
    .join("");

  list.querySelectorAll("[data-repeat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = items[Number(btn.dataset.repeat)];
      if (!item) return;
      document.dispatchEvent(new CustomEvent("app:repeat-order", { detail: { productId: item.productId, playerId: item.playerId } }));
    });
  });
}

document.addEventListener("session:orders", renderHistory);
document.addEventListener("session:changed", renderHistory);
