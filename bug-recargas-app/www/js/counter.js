import { getPurchaseCount } from "./utils/db.js";

const counterEl = document.getElementById("purchaseCounterValue");

function animateCount(el, target, duration = 1000) {
  const start = 0;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(start + (target - start) * progress);
    el.textContent = value.toLocaleString("pt-PT");
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

export async function initPurchaseCounter() {
  if (!counterEl) return;
  try {
    const total = await getPurchaseCount();
    animateCount(counterEl, total);
  } catch (err) {
    counterEl.textContent = "—";
  }
}

/** Atualiza o número no card otimisticamente após uma nova compra. */
export function bumpCounterDisplay() {
  if (!counterEl) return;
  const current = parseInt(counterEl.textContent.replace(/\D/g, ""), 10) || 0;
  counterEl.textContent = (current + 1).toLocaleString("pt-PT");
}

initPurchaseCounter();
