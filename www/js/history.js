import { icon } from "./icons.js";
import { readJSON, writeJSON, removeKey, KEYS } from "./storage.js";
import { escapeHtml } from "./utils/html.js";

const MAX_ITEMS = 30;

export function readHistory() {
  const items = readJSON(KEYS.history, []);
  return Array.isArray(items) ? items : [];
}

/** Regista uma recarga no histórico local deste aparelho. */
export function addToHistory(entry) {
  const items = readHistory();
  items.unshift({ ...entry, timestamp: Date.now() });
  writeJSON(KEYS.history, items.slice(0, MAX_ITEMS));
  renderHistory();
}

export function clearHistory() {
  removeKey(KEYS.history);
  renderHistory();
}

function formatRelativeDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const time = date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Hoje, ${time}`;
  if (isYesterday) return `Ontem, ${time}`;
  return `${date.toLocaleDateString("pt-PT")}, ${time}`;
}

export function renderHistory() {
  const list = document.getElementById("historyList");
  const empty = document.getElementById("historyEmpty");
  const clearBtn = document.getElementById("historyClearBtn");
  if (!list || !empty) return;

  const items = readHistory();
  if (clearBtn) clearBtn.classList.toggle("hidden", !items.length);

  if (!items.length) {
    list.innerHTML = "";
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");
  list.innerHTML = items
    .map(
      (item, index) => `
        <li class="history-item">
          ${icon("gem")}
          <div class="history-item-info">
            <span class="history-item-title">${escapeHtml(item.amountLabel)}</span>
            <span class="history-item-date">${formatRelativeDate(item.timestamp)}${item.playerId ? ` · ID ${escapeHtml(item.playerId)}` : ""}</span>
          </div>
          <div class="history-item-side">
            <span class="history-item-price">${escapeHtml(item.priceLabel)}</span>
            ${item.productId ? `<button type="button" class="history-repeat" data-repeat="${index}">${icon("repeat")} Repetir</button>` : ""}
          </div>
        </li>`
    )
    .join("");

  list.querySelectorAll("[data-repeat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = items[Number(btn.dataset.repeat)];
      if (!item) return;
      document.dispatchEvent(
        new CustomEvent("app:repeat-order", { detail: { productId: item.productId, playerId: item.playerId } })
      );
    });
  });
}
