/**
 * APP — navegação, temas, definições, Meus IDs e boas-vindas.
 * (A lógica de compra/checkout continua em script.js.)
 */
import { icon } from "./icons.js";
import { getSettings, updateSettings, resetSettings } from "./settings.js";
import { applyTheme, THEMES, ACCENTS, readableOn } from "./theme.js";
import { haptic, playSound } from "./feedback.js";
import {
  getMyIds, getActiveId, setActiveId, saveMyId, removeMyId, updateMyIdNick, clearMyIds, displayName, MAX_IDS,
} from "./myids.js";
import { renderHistory, clearHistory } from "./history.js";
import { showToast } from "./toast.js";
import { validatePlayerId, WHATSAPP_NUMBER } from "./utils/whatsapp.js";
import { fetchNickname } from "./utils/nickname.js";
import { escapeHtml } from "./utils/html.js";
import { registerOverlay, unregisterOverlay, closeTopOverlay } from "./overlays.js";
import { KEYS, readRaw, writeRaw, removeKey } from "./storage.js";

const $ = (id) => document.getElementById(id);
const APP_VERSION = "2.0.0";

/* ---------------------------------------------------------
   ÍCONES ESTÁTICOS + LINKS
--------------------------------------------------------- */
function hydrateIcons() {
  document.querySelectorAll("[data-icon]").forEach((el) => {
    if (el.dataset.iconDone) return;
    el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon));
    el.dataset.iconDone = "1";
  });
}

const whatsappHelpLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá, preciso de ajuda com um pedido.")}`;
$("appHelpBtn").href = whatsappHelpLink;
$("settingsWhatsapp").href = whatsappHelpLink;
$("appVersion").textContent = APP_VERSION;

/* ---------------------------------------------------------
   NAVEGAÇÃO (barra de baixo)
--------------------------------------------------------- */
const navItems = document.querySelectorAll(".bottom-nav [data-nav]");
const screenEls = document.querySelectorAll(".screen");
let currentScreen = "home";

function showScreen(name) {
  if (!$(`screen-${name}`)) return;
  currentScreen = name;
  screenEls.forEach((s) => s.classList.toggle("active", s.dataset.screen === name));
  navItems.forEach((n) => {
    const on = n.dataset.nav === name;
    n.classList.toggle("active", on);
    n.setAttribute("aria-current", on ? "page" : "false");
  });
  window.scrollTo(0, 0);
  if (name === "history") renderHistory();
}

navItems.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.nav !== currentScreen) playSound("tap");
    showScreen(btn.dataset.nav);
  });
});

document.querySelectorAll("[data-go-products]").forEach((btn) => {
  btn.addEventListener("click", () => {
    showScreen("home");
    $("produtos").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

/* ---------------------------------------------------------
   APARÊNCIA: TEMAS E COR DE DESTAQUE
--------------------------------------------------------- */
function themeTileHTML(theme, selected) {
  const [bg, surface, dot] = theme.preview;
  return `
    <button type="button" class="theme-tile${selected ? " selected" : ""}" data-theme-id="${theme.id}" aria-pressed="${selected}">
      <span class="tile-preview" style="background:${bg}">
        <span class="tp-card" style="background:${surface}"></span>
        <span class="tp-dot" style="background:${dot}"></span>
      </span>
      <strong>${theme.name}</strong>
      <small>${theme.desc}</small>
      ${selected ? `<span class="tile-check">${icon("check")}</span>` : ""}
    </button>`;
}

function accentRowHTML(settings) {
  const auto = `
    <button type="button" class="accent-dot auto${!settings.accent ? " selected" : ""}" data-accent="" aria-label="Cor do estilo">
      ${icon("sparkles")}
    </button>`;
  const dots = ACCENTS.map((a) => {
    const selected = settings.accent === a.color;
    return `
      <button type="button" class="accent-dot${selected ? " selected" : ""}" data-accent="${a.color}"
        style="background:${a.color};color:${readableOn(a.color)}" aria-label="${a.name}">
        ${selected ? icon("check") : ""}
      </button>`;
  }).join("");
  return auto + dots;
}

function renderAppearance() {
  const settings = getSettings();
  ["themeGrid", "onbThemeGrid"].forEach((id) => {
    const el = $(id);
    if (el) el.innerHTML = THEMES.map((t) => themeTileHTML(t, t.id === settings.theme)).join("");
  });
  ["accentRow", "onbAccentRow"].forEach((id) => {
    const el = $(id);
    if (el) el.innerHTML = accentRowHTML(settings);
  });
  $("toggleHaptics").setAttribute("aria-checked", String(settings.haptics));
  $("toggleSound").setAttribute("aria-checked", String(settings.sound));
}

document.addEventListener("click", (event) => {
  const tile = event.target.closest("[data-theme-id]");
  if (tile) {
    updateSettings({ theme: tile.dataset.themeId });
    playSound("tap");
    return;
  }
  const dot = event.target.closest("[data-accent]");
  if (dot) {
    updateSettings({ accent: dot.dataset.accent || null });
    playSound("tap");
  }
});

document.addEventListener("app:settings-changed", () => {
  applyTheme(getSettings());
  renderAppearance();
});

function bindToggle(id, key) {
  $(id).addEventListener("click", () => {
    const next = !getSettings()[key];
    updateSettings({ [key]: next });
    if (next) {
      if (key === "sound") playSound("tap");
      else haptic("medium");
    }
  });
}
bindToggle("toggleHaptics", "haptics");
bindToggle("toggleSound", "sound");

/* ---------------------------------------------------------
   FAQ (acordeão nas Definições)
--------------------------------------------------------- */
document.querySelectorAll(".faq-question .icon").forEach((el) => {
  el.innerHTML = icon("chevronDown");
});

/* ---------------------------------------------------------
   MEUS IDS
--------------------------------------------------------- */
const idsOverlay = $("idsOverlay");
const idsList = $("idsList");
const newIdValue = $("newIdValue");
const newIdLabel = $("newIdLabel");
const newIdError = $("newIdError");

function renderMyIds() {
  const ids = getMyIds();
  const active = getActiveId();

  $("myIdsRow").innerHTML =
    ids
      .map(
        (item) => `
      <button type="button" class="id-chip${item.id === active ? " active" : ""}" data-chip-id="${escapeHtml(item.id)}">
        <strong>${escapeHtml(displayName(item))}</strong>
        <small>ID ${escapeHtml(item.id)}</small>
      </button>`
      )
      .join("") +
    `<button type="button" class="id-chip id-chip-add" id="addIdChip">${icon("plus")}<span>Adicionar</span></button>`;

  $("idsCount").textContent = ids.length ? `${ids.length} guardado${ids.length > 1 ? "s" : ""}` : "Nenhum guardado";

  idsList.innerHTML = ids
    .map(
      (item) => `
      <li class="ids-item${item.id === active ? " active" : ""}">
        <button type="button" class="ids-item-main" data-use-id="${escapeHtml(item.id)}">
          <span class="ids-radio"></span>
          <span class="ids-item-text">
            <strong>${escapeHtml(displayName(item))}</strong>
            <small>ID ${escapeHtml(item.id)}${item.nick && item.label ? ` · ${escapeHtml(item.nick)}` : ""}</small>
          </span>
        </button>
        <button type="button" class="icon-btn" data-del-id="${escapeHtml(item.id)}" aria-label="Remover ID">${icon("trash")}</button>
      </li>`
    )
    .join("");
  $("idsEmpty").classList.toggle("hidden", ids.length > 0);
}

$("myIdsRow").addEventListener("click", (event) => {
  if (event.target.closest("#addIdChip")) {
    openIdsSheet(true);
    return;
  }
  const chip = event.target.closest("[data-chip-id]");
  if (!chip) return;
  const id = chip.dataset.chipId;
  setActiveId(getActiveId() === id && getMyIds().length > 1 ? null : id);
});

idsList.addEventListener("click", (event) => {
  const del = event.target.closest("[data-del-id]");
  if (del) {
    removeMyId(del.dataset.delId);
    showToast("ID removido", "info", 1800);
    return;
  }
  const use = event.target.closest("[data-use-id]");
  if (use) {
    setActiveId(use.dataset.useId);
    playSound("tap");
  }
});

function openIdsSheet(focusInput = false) {
  renderMyIds();
  newIdError.textContent = "";
  idsOverlay.classList.add("open");
  document.body.classList.add("no-scroll");
  registerOverlay(closeIdsSheet);
  if (focusInput) setTimeout(() => newIdValue.focus(), 250);
}

function closeIdsSheet() {
  unregisterOverlay(closeIdsSheet);
  idsOverlay.classList.remove("open");
  document.body.classList.remove("no-scroll");
}

$("manageIdsBtn").addEventListener("click", () => openIdsSheet());
$("openIdsSheetBtn").addEventListener("click", () => openIdsSheet());
$("idsCloseBtn").addEventListener("click", closeIdsSheet);
idsOverlay.addEventListener("click", (event) => {
  if (event.target === idsOverlay) closeIdsSheet();
});

$("addIdBtn").addEventListener("click", () => {
  const result = validatePlayerId(newIdValue.value);
  if (!result.valid) {
    newIdError.innerHTML = `${icon("alertCircle")} ${escapeHtml(result.message)}`;
    haptic("error");
    return;
  }
  const saved = saveMyId({ id: result.value, label: newIdLabel.value.trim() });
  if (!saved.ok) {
    newIdError.innerHTML = `${icon("alertCircle")} Limite de ${MAX_IDS} IDs atingido. Remove um para adicionar outro.`;
    haptic("error");
    return;
  }
  if (getMyIds().length === 1) setActiveId(result.value);
  newIdValue.value = "";
  newIdLabel.value = "";
  newIdError.textContent = "";
  haptic("success");
  showToast(saved.existed ? "ID atualizado" : "ID guardado", "success", 1800);

  // procura o Nick em segundo plano (se falhar, o ID continua guardado)
  fetchNickname(result.value)
    .then((nick) => updateMyIdNick(result.value, nick))
    .catch(() => {});
});

document.addEventListener("app:myids-changed", renderMyIds);

/* ---------------------------------------------------------
   CONFIRMAÇÃO (ações que apagam dados)
--------------------------------------------------------- */
const confirmOverlay = $("confirmOverlay");

function askConfirm({ title, text, okLabel = "Confirmar", danger = false }) {
  return new Promise((resolve) => {
    $("confirmTitle").textContent = title;
    $("confirmText").textContent = text;
    const ok = $("confirmOk");
    const cancel = $("confirmCancel");
    ok.textContent = okLabel;
    ok.classList.toggle("btn-danger", danger);

    const finish = (value) => {
      unregisterOverlay(onBack);
      confirmOverlay.classList.remove("open");
      ok.onclick = null;
      cancel.onclick = null;
      confirmOverlay.onclick = null;
      resolve(value);
    };
    const onBack = () => finish(false);

    ok.onclick = () => finish(true);
    cancel.onclick = () => finish(false);
    confirmOverlay.onclick = (event) => {
      if (event.target === confirmOverlay) finish(false);
    };
    registerOverlay(onBack);
    confirmOverlay.classList.add("open");
  });
}

async function confirmClearHistory() {
  const ok = await askConfirm({
    title: "Limpar histórico?",
    text: "As recargas listadas neste aparelho serão apagadas. Os pedidos já enviados não são afetados.",
    okLabel: "Limpar",
    danger: true,
  });
  if (!ok) return;
  clearHistory();
  haptic("success");
  showToast("Histórico limpo", "success", 1800);
}
$("clearHistoryBtn").addEventListener("click", confirmClearHistory);
$("historyClearBtn").addEventListener("click", confirmClearHistory);

$("clearAllBtn").addEventListener("click", async () => {
  const ok = await askConfirm({
    title: "Apagar todos os dados?",
    text: "Vai apagar o histórico, os Meus IDs e as tuas definições neste aparelho. Esta ação não pode ser desfeita.",
    okLabel: "Apagar tudo",
    danger: true,
  });
  if (!ok) return;
  clearHistory();
  clearMyIds();
  resetSettings();
  removeKey(KEYS.onboarded);
  haptic("success");
  showToast("Dados apagados", "success", 2000);
});

/* ---------------------------------------------------------
   BOAS-VINDAS (primeira vez)
--------------------------------------------------------- */
const onboarding = $("onboarding");
const onbSlides = [...onboarding.querySelectorAll(".onb-slide")];
let onbIndex = 0;

function renderOnboarding() {
  onbSlides.forEach((slide, i) => slide.classList.toggle("active", i === onbIndex));
  $("onbDots").innerHTML = onbSlides.map((_, i) => `<span class="${i === onbIndex ? "on" : ""}"></span>`).join("");
  $("onbNext").textContent = onbIndex === onbSlides.length - 1 ? "Começar" : "Seguinte";
}

function onboardingBack() {
  if (onbIndex > 0) {
    onbIndex -= 1;
    renderOnboarding();
  }
}

function openOnboarding() {
  onbIndex = 0;
  renderOnboarding();
  onboarding.classList.remove("hidden");
  registerOverlay(onboardingBack);
}

function finishOnboarding() {
  writeRaw(KEYS.onboarded, "1");
  onboarding.classList.add("hidden");
  unregisterOverlay(onboardingBack);
  haptic("success");
}

$("onbNext").addEventListener("click", () => {
  if (onbIndex < onbSlides.length - 1) {
    onbIndex += 1;
    renderOnboarding();
  } else {
    finishOnboarding();
  }
});
$("onbSkip").addEventListener("click", finishOnboarding);
$("replayOnboardingBtn").addEventListener("click", openOnboarding);

/* ---------------------------------------------------------
   TOQUES, TECLADO E BOTÃO "VOLTAR" DO ANDROID
--------------------------------------------------------- */
document.addEventListener(
  "pointerdown",
  (event) => {
    if (event.target.closest("button, .btn, a.row-btn, .nav-item")) haptic("light");
  },
  { passive: true }
);

// esconde a barra de baixo quando o teclado está aberto
document.addEventListener("focusin", (event) => {
  if (event.target.matches("input, textarea")) {
    document.documentElement.classList.add("kb-open");
    const el = event.target;
    setTimeout(() => el.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
  }
});
document.addEventListener("focusout", () => {
  document.documentElement.classList.remove("kb-open");
});

try {
  const AppPlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (AppPlugin && typeof AppPlugin.addListener === "function") {
    AppPlugin.addListener("backButton", () => {
      if (closeTopOverlay()) return;
      if (currentScreen !== "home") {
        showScreen("home");
        return;
      }
      if (typeof AppPlugin.exitApp === "function") AppPlugin.exitApp();
    });
  }
} catch {
  /* fora do app (navegador) — sem botão voltar nativo */
}

/* ---------------------------------------------------------
   ARRANQUE
--------------------------------------------------------- */
applyTheme(getSettings());
hydrateIcons();
renderAppearance();
renderMyIds();
renderHistory();
showScreen("home");

if (!readRaw(KEYS.onboarded)) openOnboarding();
