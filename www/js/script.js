import { getProductsByCategory, getProductById } from "./data/products.js";
import { getProductPrice } from "./utils/promotions.js";
import { generateWhatsAppLink, validatePlayerId, formatKz } from "./utils/whatsapp.js";
import { fetchNickname, warmupNicknameServers } from "./utils/nickname.js";
import { incrementPurchaseCount, logPurchase, getCouponByCode, redeemCoupon } from "./utils/db.js";
import { bumpCounterDisplay } from "./counter.js";
import { icon } from "./icons.js";
import { showToast } from "./toast.js";
import { initConnectivityWatcher } from "./connectivity.js";
import { addToHistory, renderHistory } from "./history.js";
import { getMyIds, getActiveId, setActiveId, saveMyId, findMyId, updateMyIdNick } from "./myids.js";
import { haptic, playSound } from "./feedback.js";
import { registerOverlay, unregisterOverlay } from "./overlays.js";
import { escapeHtml } from "./utils/html.js";

initConnectivityWatcher();
renderHistory();

/* ---------------------------------------------------------
   ÍCONES ESTÁTICOS (elementos que não mudam depois de montados)
--------------------------------------------------------- */
document.getElementById("splashSpinner").innerHTML = icon("loader");
document.getElementById("modalCloseBtn").innerHTML = icon("x");
document.getElementById("copyIdBtn").innerHTML = icon("copy");

document.getElementById("heroBadges").innerHTML = `
  <span>${icon("shieldCheck")} Sem senha da conta</span>
  <span>${icon("zap")} Atendimento no WhatsApp</span>
  <span>${icon("gamepad")} Feito para jogadores</span>
`;

document.getElementById("counterIconWrap").innerHTML = icon("zap");

document.getElementById("tab-diamantes").innerHTML = `${icon("gem")} Diamantes`;
document.getElementById("tab-passe").innerHTML = `${icon("ticket")} Passe de Nível`;



document.querySelectorAll(".faq-question .icon").forEach((el) => {
  el.innerHTML = icon("chevronDown");
});

/* Mock card do hero: roda entre os pacotes de diamantes a cada 5s,
   com um brilho suave a passar + fade no conteúdo. */
const heroDiamondProducts = getProductsByCategory("diamantes");
const mockCardEl = document.querySelector(".hero-mock-card");
const mockAmountEl = document.getElementById("mockAmount");
const mockPriceEl = document.getElementById("mockPrice");
const mockBuyBtn = document.getElementById("mockBuyBtn");
let heroMockIndex = 0;

mockBuyBtn.addEventListener("click", () => {
  const product = heroDiamondProducts[heroMockIndex];
  if (product) openModal(product);
});

function renderMockProduct(product) {
  const priceInfo = getProductPrice(product);
  mockAmountEl.innerHTML = `${icon("gem")} ${product.amountLabel}`;
  mockPriceEl.textContent = formatKz(priceInfo.finalPrice);
}

if (heroDiamondProducts.length) {
  renderMockProduct(heroDiamondProducts[0]);

  if (heroDiamondProducts.length > 1) {
    setInterval(() => {
      heroMockIndex = (heroMockIndex + 1) % heroDiamondProducts.length;

      mockCardEl.classList.add("fading");
      mockCardEl.classList.add("shine");

      setTimeout(() => {
        renderMockProduct(heroDiamondProducts[heroMockIndex]);
        mockCardEl.classList.remove("fading");
      }, 250);

      setTimeout(() => mockCardEl.classList.remove("shine"), 1150);
    }, 5000);
  }
}

/* ---------------------------------------------------------
   RENDERIZAÇÃO DOS PRODUTOS
--------------------------------------------------------- */
function renderProductCard(product) {
  const priceInfo = getProductPrice(product);
  const categoryIcon = product.category === "passe" ? "ticket" : "gem";

  const card = document.createElement("article");
  card.className = "product-card";

  const promoTag = priceInfo.onPromotion
    ? `<span class="promo-tag">${icon("flame")} Promoção de fim de semana</span>`
    : "";
  const bonusTag = product.bonus ? `<span class="bonus">+${product.bonus} bônus</span>` : "";
  const oldPrice = priceInfo.onPromotion ? `<span class="price-old">${formatKz(priceInfo.originalPrice)}</span>` : "";

  card.innerHTML = `
    ${promoTag}
    <span class="amount">${icon(categoryIcon)} ${product.amountLabel}</span>
    ${bonusTag}
    <div class="price-row">
      ${oldPrice}
      <span class="price-final ${priceInfo.onPromotion ? "promo" : ""}">${formatKz(priceInfo.finalPrice)}</span>
    </div>
    <button class="btn btn-primary btn-block" data-product-id="${product.id}">Comprar</button>
  `;

  return card;
}

function renderCategory(category, gridId) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = "";
  getProductsByCategory(category).forEach((product) => {
    grid.appendChild(renderProductCard(product));
  });
}

renderCategory("diamantes", "grid-diamantes");
renderCategory("passe", "grid-passe");

/* ---------------------------------------------------------
   TABS DE CATEGORIA
--------------------------------------------------------- */
const tabs = document.querySelectorAll(".category-tab");
const panels = document.querySelectorAll(".product-panel");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");

    const category = tab.dataset.category;
    panels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.panel === category);
    });
  });
});

/* ---------------------------------------------------------
   CHECKOUT (MODAL)
--------------------------------------------------------- */
const modalOverlay = document.getElementById("modalOverlay");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const cancelBtn = document.getElementById("cancelBtn");
const playerIdInput = document.getElementById("playerIdInput");
const playerIdError = document.getElementById("playerIdError");
const continueWhatsappBtn = document.getElementById("continueWhatsappBtn");
const checkNickBtn = document.getElementById("checkNickBtn");
const nicknameResult = document.getElementById("nicknameResult");
const nicknameResultIcon = document.getElementById("nicknameResultIcon");
const nicknameValue = document.getElementById("nicknameValue");
const copyIdBtn = document.getElementById("copyIdBtn");
const confirmCheckbox = document.getElementById("confirmCheckbox");
const couponInput = document.getElementById("couponInput");
const applyCouponBtn = document.getElementById("applyCouponBtn");
const removeCouponBtn = document.getElementById("removeCouponBtn");
const couponResult = document.getElementById("couponResult");
const couponResultIcon = document.getElementById("couponResultIcon");
const couponResultValue = document.getElementById("couponResultValue");
const summaryDiscountRow = document.getElementById("summaryDiscountRow");
const summaryDiscount = document.getElementById("summaryDiscount");

const summaryProduct = document.getElementById("summaryProduct");
const summaryAmount = document.getElementById("summaryAmount");
const summaryPrice = document.getElementById("summaryPrice");
const modalIdChips = document.getElementById("modalIdChips");
const saveIdRow = document.getElementById("saveIdRow");
const saveIdCheckbox = document.getElementById("saveIdCheckbox");

let currentProduct = null;
let currentPriceInfo = null;
let currentNickname = null;
let appliedCoupon = null;

function effectiveFinalPrice() {
  if (!currentPriceInfo) return 0;
  if (!appliedCoupon) return currentPriceInfo.finalPrice;
  return Math.max(0, currentPriceInfo.finalPrice - appliedCoupon.discountKz);
}

function updateSummaryPrice() {
  summaryPrice.textContent = formatKz(effectiveFinalPrice());
  if (appliedCoupon) {
    summaryDiscount.textContent = `-${formatKz(appliedCoupon.discountKz)}`;
    summaryDiscountRow.classList.remove("hidden");
  } else {
    summaryDiscountRow.classList.add("hidden");
  }
}

function resetCouponState() {
  appliedCoupon = null;
  couponInput.value = "";
  couponResult.classList.remove("visible", "error", "success");
  removeCouponBtn.classList.add("hidden");
  applyCouponBtn.disabled = false;
  applyCouponBtn.classList.remove("hidden");
  applyCouponBtn.textContent = "Aplicar";
  couponInput.disabled = false;
}

function resetNicknameState() {
  currentNickname = null;
  nicknameResult.classList.remove("visible", "error", "success");
  nicknameValue.textContent = "—";
  copyIdBtn.classList.add("hidden");
}

function updateContinueButtonState() {
  continueWhatsappBtn.disabled = !confirmCheckbox.checked;
}

confirmCheckbox.addEventListener("change", updateContinueButtonState);

function showKnownNickname(nick) {
  currentNickname = nick;
  nicknameResultIcon.innerHTML = icon("checkCircle");
  nicknameValue.textContent = nick;
  nicknameResult.classList.remove("error");
  nicknameResult.classList.add("visible", "success");
  copyIdBtn.classList.remove("hidden");
}

/* Meus IDs: atalhos dentro do checkout */
function renderModalChips() {
  const ids = getMyIds();
  if (!ids.length) {
    modalIdChips.classList.add("hidden");
    modalIdChips.innerHTML = "";
    return;
  }
  modalIdChips.classList.remove("hidden");
  modalIdChips.innerHTML = ids
    .map(
      (item) => `
      <button type="button" class="id-chip small" data-modal-chip="${escapeHtml(item.id)}">
        <strong>${escapeHtml(item.label || item.nick || "Jogador")}</strong>
        <small>${escapeHtml(item.id)}</small>
      </button>`
    )
    .join("");
}

function updateSaveIdRow() {
  const id = playerIdInput.value.trim();
  const show = /^\d{5,12}$/.test(id) && !findMyId(id);
  saveIdRow.classList.toggle("hidden", !show);
}

modalIdChips.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-modal-chip]");
  if (!chip) return;
  const id = chip.dataset.modalChip;
  const item = findMyId(id);
  playerIdInput.value = id;
  playerIdError.textContent = "";
  resetNicknameState();
  if (item && item.nick) showKnownNickname(item.nick);
  updateSaveIdRow();
});

export function openModal(product, priceInfoOverride, options = {}) {
  currentProduct = product;
  currentPriceInfo = priceInfoOverride || getProductPrice(product);

  summaryProduct.textContent = product.name;
  summaryAmount.textContent = product.amountLabel;
  resetCouponState();
  updateSummaryPrice();

  const prefillId = (options && options.playerId) || getActiveId() || "";
  playerIdInput.value = prefillId;
  playerIdError.textContent = "";
  resetNicknameState();
  const knownItem = prefillId ? findMyId(prefillId) : null;
  if (knownItem && knownItem.nick) showKnownNickname(knownItem.nick);
  renderModalChips();
  saveIdCheckbox.checked = true;
  updateSaveIdRow();
  confirmCheckbox.checked = false;
  updateContinueButtonState();
  continueWhatsappBtn.innerHTML = "Continuar pelo WhatsApp";

  modalOverlay.classList.add("open");
  document.body.classList.add("no-scroll");
  registerOverlay(closeModal);
  haptic("light");
  if (!prefillId) playerIdInput.focus();

  // Começa a "acordar" os servidores de consulta de Nick assim que o
  // modal abre, ganhando tempo antes do cliente clicar em "Ver Nick".
  warmupNicknameServers();
}

function closeModal() {
  unregisterOverlay(closeModal);
  modalOverlay.classList.remove("open");
  document.body.classList.remove("no-scroll");
  currentProduct = null;
  currentPriceInfo = null;
  resetNicknameState();
  resetCouponState();
}

document.addEventListener("click", (event) => {
  const buyBtn = event.target.closest("[data-product-id]");
  if (!buyBtn) return;

  const product = getProductById(buyBtn.dataset.productId);
  if (product) openModal(product);
});

modalCloseBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modalOverlay.classList.contains("open")) closeModal();
});

/* Busca o Nick ao clicar em "Ver Nick" */
checkNickBtn.addEventListener("click", async () => {
  const result = validatePlayerId(playerIdInput.value);
  if (!result.valid) {
    playerIdError.innerHTML = `${icon("alertCircle")} ${result.message}`;
    resetNicknameState();
    return;
  }

  playerIdError.textContent = "";
  checkNickBtn.disabled = true;
  checkNickBtn.innerHTML = `${icon("loader")} Buscando...`;
  nicknameResult.classList.remove("visible", "error", "success");
  nicknameResultIcon.innerHTML = icon("loader");
  nicknameValue.textContent = "A consultar...";
  nicknameResult.classList.add("visible");

  const handleRetry = (attempt, total) => {
    nicknameValue.textContent = `Servidor a iniciar, tentando de novo... (${attempt}/${total - 1})`;
  };

  try {
    const nickname = await fetchNickname(result.value, handleRetry);
    currentNickname = nickname;
    updateMyIdNick(result.value, nickname);
    nicknameResultIcon.innerHTML = icon("checkCircle");
    nicknameValue.textContent = nickname;
    nicknameResult.classList.remove("error");
    nicknameResult.classList.add("visible", "success");
    copyIdBtn.classList.remove("hidden");
  } catch (err) {
    currentNickname = null;
    nicknameResultIcon.innerHTML = icon("alertCircle");
    nicknameValue.textContent = err.message || "Não foi possível encontrar esse ID.";
    nicknameResult.classList.add("visible", "error");
  } finally {
    checkNickBtn.disabled = false;
    checkNickBtn.textContent = "Ver Nick";
  }
});

copyIdBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(playerIdInput.value.trim());
    showToast("ID copiado", "success", 1800);
  } catch {
    showToast("Não foi possível copiar automaticamente", "error");
  }
});

/* Aplicar cupão de desconto */
applyCouponBtn.addEventListener("click", async () => {
  const code = couponInput.value.trim().toUpperCase();
  if (!code) return;

  applyCouponBtn.disabled = true;
  applyCouponBtn.innerHTML = `${icon("loader")} A validar...`;
  couponResult.classList.remove("visible", "error", "success");

  try {
    const coupon = await getCouponByCode(code);

    if (!coupon) throw new Error("Cupão inválido.");
    if (!coupon.active) throw new Error("Este cupão está inativo.");
    if ((coupon.usedCount || 0) >= coupon.maxUses) throw new Error("Este cupão já atingiu o limite de usos.");
    if (coupon.productIds && coupon.productIds.length && !coupon.productIds.includes(currentProduct.id)) {
      throw new Error("Este cupão não é válido para este pacote.");
    }

    appliedCoupon = { code: coupon.id, discountKz: coupon.discountKz };
    updateSummaryPrice();

    couponResultIcon.innerHTML = icon("checkCircle");
    couponResultValue.textContent = `${coupon.id} aplicado (-${formatKz(coupon.discountKz)})`;
    couponResult.classList.add("visible", "success");
    removeCouponBtn.classList.remove("hidden");
    couponInput.disabled = true;
    applyCouponBtn.classList.add("hidden");
  } catch (err) {
    appliedCoupon = null;
    updateSummaryPrice();
    couponResultIcon.innerHTML = icon("alertCircle");
    couponResultValue.textContent = err.message;
    couponResult.classList.add("visible", "error");
  } finally {
    applyCouponBtn.disabled = false;
    applyCouponBtn.textContent = "Aplicar";
  }
});

removeCouponBtn.addEventListener("click", () => {
  resetCouponState();
  updateSummaryPrice();
});

/* Se o ID mudar depois de já ter buscado um Nick, invalida o Nick anterior */
playerIdInput.addEventListener("input", () => {
  if (playerIdError.textContent) playerIdError.textContent = "";
  if (currentNickname) resetNicknameState();
  updateSaveIdRow();
});

continueWhatsappBtn.addEventListener("click", async () => {
  if (!currentProduct || !confirmCheckbox.checked) return;

  const result = validatePlayerId(playerIdInput.value);
  if (!result.valid) {
    playerIdError.innerHTML = `${icon("alertCircle")} ${result.message}`;
    playerIdInput.focus();
    return;
  }

  playerIdError.textContent = "";
  continueWhatsappBtn.disabled = true;
  continueWhatsappBtn.innerHTML = `${icon("loader")} Processando...`;

  const finalPrice = effectiveFinalPrice();
  const effectivePriceInfo = { ...currentPriceInfo, finalPrice };

  const link = generateWhatsAppLink(currentProduct, effectivePriceInfo, result.value, currentNickname, appliedCoupon);
  window.open(link, "_blank", "noopener");

  continueWhatsappBtn.innerHTML = `${icon("check")} Pedido enviado`;
  showToast("Pedido enviado! Finalize no WhatsApp.", "success");
  haptic("success");
  playSound("success");

  if (!saveIdRow.classList.contains("hidden") && saveIdCheckbox.checked) {
    const saved = saveMyId({ id: result.value, nick: currentNickname });
    if (saved.ok) {
      setActiveId(result.value);
      showToast("ID guardado em Meus IDs", "success", 2200);
    } else {
      showToast("Limite de 10 IDs atingido. Remove um em Meus IDs.", "info", 3500);
    }
  } else if (findMyId(result.value)) {
    updateMyIdNick(result.value, currentNickname);
    setActiveId(result.value);
  }

  addToHistory({
    amountLabel: currentProduct.amountLabel,
    priceLabel: formatKz(finalPrice),
    playerId: result.value,
    productId: currentProduct.id,
  });

  bumpCounterDisplay();
  incrementPurchaseCount().catch(() => {
    showToast("Pedido enviado, mas não foi possível atualizar o contador agora.", "error", 4000);
  });
  if (appliedCoupon) {
    redeemCoupon(appliedCoupon.code).catch(() => {
      /* não bloqueia o pedido — pior caso, o uso não é contabilizado desta vez */
    });
  }
  logPurchase({
    playerId: result.value,
    nickname: currentNickname,
    productName: currentProduct.name,
    amountLabel: currentProduct.amountLabel,
    category: currentProduct.category,
    price: finalPrice,
    couponCode: appliedCoupon ? appliedCoupon.code : null,
  }).catch(() => {
    /* não bloqueia o pedido — só não entra no painel admin desta vez */
  });

  setTimeout(closeModal, 700);
});

/* ---------------------------------------------------------
   FAQ ACCORDION
--------------------------------------------------------- */
document.querySelectorAll(".faq-item").forEach((item) => {
  const question = item.querySelector(".faq-question");
  question.addEventListener("click", () => {
    const wasOpen = item.classList.contains("open");
    document.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
    if (!wasOpen) item.classList.add("open");
  });
});

/* ---------------------------------------------------------
   REPETIR PEDIDO (botão "Repetir" no Histórico)
--------------------------------------------------------- */
document.addEventListener("app:repeat-order", (event) => {
  const { productId, playerId } = event.detail || {};
  const product = productId ? getProductById(productId) : null;
  if (!product) {
    showToast("Este pedido não pode ser repetido automaticamente.", "info");
    return;
  }
  openModal(product, undefined, { playerId });
});
