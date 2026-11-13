import { getActivePromotions, getActiveSalinhaEvents } from "./utils/db.js";
import { formatKz } from "./utils/whatsapp.js";
import { icon } from "./icons.js";
import { openModal } from "./script.js";

const promoSection = document.getElementById("promoEventsSection");
const promoGrid = document.getElementById("promoEventsGrid");
const salinhaSection = document.getElementById("salinhaSection");
const salinhaGrid = document.getElementById("salinhaGrid");

const countdownTimers = [];

function toMillis(value) {
  if (!value) return null;
  if (typeof value.toMillis === "function") return value.toMillis();
  return null;
}

function formatCountdown(targetMillis) {
  const diff = targetMillis - Date.now();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, "0");
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function registerCountdown(el, targetMillis, onExpire) {
  function tick() {
    const text = formatCountdown(targetMillis);
    if (text === null) {
      onExpire();
      return;
    }
    el.textContent = text;
  }
  tick();
  const intervalId = setInterval(tick, 1000);
  countdownTimers.push(intervalId);
}

/* ---------------------------------------------------------
   PROMOÇÕES
--------------------------------------------------------- */
function renderPromotions(promotions) {
  if (!promotions.length) {
    promoSection.classList.add("hidden");
    return;
  }

  promoSection.classList.remove("hidden");
  promoGrid.innerHTML = "";

  promotions.forEach((promo) => {
    const card = document.createElement("article");
    card.className = "promo-event-card";

    card.innerHTML = `
      <span class="promo-event-tag">${icon("flame")} Oferta por tempo limitado</span>
      <span class="promo-event-title">${icon("gem")} ${promo.title || "Pacote"}</span>
      <div class="promo-event-price-row">
        ${promo.basePrice ? `<span class="price-old">${formatKz(promo.basePrice)}</span>` : ""}
        <span class="promo-event-price">${formatKz(promo.promoPrice)}</span>
      </div>
      <div class="promo-event-countdown">
        ${icon("zap")} <span class="countdown-value">--:--:--</span>
      </div>
      <button class="btn btn-primary btn-block" type="button">Comprar</button>
    `;

    const countdownEl = card.querySelector(".countdown-value");
    const endMillis = toMillis(promo.endAt);

    if (endMillis) {
      registerCountdown(countdownEl, endMillis, () => {
        card.remove();
        if (!promoGrid.children.length) promoSection.classList.add("hidden");
      });
    }

    card.querySelector("button").addEventListener("click", () => {
      const syntheticProduct = {
        id: `promo-${promo.id}`,
        category: "promocao",
        name: promo.title || "Pacote em promoção",
        amountLabel: promo.title || "Pacote em promoção",
      };
      const priceInfo = {
        finalPrice: promo.promoPrice,
        originalPrice: promo.basePrice || null,
        onPromotion: Boolean(promo.basePrice),
      };
      openModal(syntheticProduct, priceInfo);
    });

    promoGrid.appendChild(card);
  });
}

/* ---------------------------------------------------------
   SALINHA
--------------------------------------------------------- */
function renderSalinha(events) {
  if (!events.length) {
    salinhaSection.classList.add("hidden");
    return;
  }

  salinhaSection.classList.remove("hidden");
  salinhaGrid.innerHTML = "";

  events.forEach((item) => {
    const card = document.createElement("article");
    card.className = "salinha-card";

    const eventMillis = toMillis(item.eventAt);
    const eventDate = eventMillis ? new Date(eventMillis) : null;
    const dateLabel = eventDate
      ? eventDate.toLocaleString("pt-PT", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
      : "";

    card.innerHTML = `
      <span class="promo-event-tag">${icon("gamepad")} Evento</span>
      <h3 class="salinha-title">${item.text || "Salinha Valendo Dima"}</h3>
      <span class="salinha-date">${dateLabel}</span>
      <div class="promo-event-countdown">
        ${icon("zap")} <span class="countdown-value">--:--:--</span>
      </div>
      <a class="btn btn-primary btn-block" href="${item.groupLink || "#"}" target="_blank" rel="noopener">Participar</a>
    `;

    const countdownEl = card.querySelector(".countdown-value");
    if (eventMillis) {
      registerCountdown(countdownEl, eventMillis, () => {
        countdownEl.textContent = "Começou!";
      });
    }

    salinhaGrid.appendChild(card);
  });
}

/* ---------------------------------------------------------
   INICIALIZAÇÃO
--------------------------------------------------------- */
async function initEvents() {
  try {
    const [promotions, salinhaEvents] = await Promise.all([getActivePromotions(), getActiveSalinhaEvents()]);
    renderPromotions(promotions);
    renderSalinha(salinhaEvents);
  } catch (err) {
    // Sem eventos ativos ou falha silenciosa — o site continua normal sem essas seções.
    promoSection.classList.add("hidden");
    salinhaSection.classList.add("hidden");
  }
}

initEvents();
