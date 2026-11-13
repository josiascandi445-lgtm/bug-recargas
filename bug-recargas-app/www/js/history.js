import { icon } from "./icons.js";

const STORAGE_KEY = "bugshop_purchase_history";
const MAX_ITEMS = 5;

function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeHistory(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* localStorage indisponível — ignora silenciosamente */
  }
}

/** Regista uma recarga no histórico local deste aparelho. */
export function addToHistory(entry) {
  const items = readHistory();
  items.unshift({ ...entry, timestamp: Date.now() });
  writeHistory(items);
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
  const section = document.getElementById("historySection");
  const list = document.getElementById("historyList");
  if (!section || !list) return;

  const items = readHistory();

  if (!items.length) {
    section.classList.add("hidden");
    return;
  }

  section.classList.remove("hidden");
  list.innerHTML = items
    .map(
      (item) => `
        <li class="history-item">
          ${icon("gem")}
          <div class="history-item-info">
            <span class="history-item-title">${item.amountLabel}</span>
            <span class="history-item-date">${formatRelativeDate(item.timestamp)}${item.playerId ? ` · ID ${item.playerId}` : ""}</span>
          </div>
          <span class="history-item-price">${item.priceLabel}</span>
        </li>
      `
    )
    .join("");
}
