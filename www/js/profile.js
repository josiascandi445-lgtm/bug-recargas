/** Barra de cima (utilizador) + ecrã de Perfil: nível, progresso, recompensas e benefícios. */
import { icon } from "./icons.js";
import { session, requestReward } from "./session.js";
import { LEVELS, levelProgress, getLevel, formatPoints, rewardsText, dayKey } from "./levels.js";
import { avatarHTML, sealSVG, levelEmblem, displayName, safeImage } from "./ui.js";
import { escapeHtml } from "./utils/html.js";
import { askConfirm, showResultDialog } from "./dialogs.js";
import { showToast } from "./toast.js";
import { haptic, playSound } from "./feedback.js";
import { WHATSAPP_NUMBER } from "./utils/whatsapp.js";

const $ = (id) => document.getElementById(id);
let openLevelId = null;

/* ---------------- barra de cima ---------------- */
export function renderTopBar() {
  const p = session.profile;
  if (!p) return;
  const lv = getLevel(p.points);
  const av = $("barAvatar");
  av.innerHTML = avatarHTML(p);
  av.style.setProperty("--lvl", lv.color);
  $("barName").innerHTML = `<span class="bar-name-text">${escapeHtml(displayName(p))}</span>${lv.seal ? sealSVG(lv.seal, 15) : ""}`;
  const pill = $("barLevel");
  pill.textContent = lv.name;
  pill.style.setProperty("--lv", lv.color);
  $("barPoints").innerHTML = `${icon("star")}<span>${formatPoints(p.points)} pts</span>`;
}

/* ---------------- progresso ---------------- */
function progressHTML(p) {
  const pr = levelProgress(p.points);
  const lv = pr.level;
  const nodes = LEVELS.map((l, i) => {
    const done = p.points >= l.target;
    const current = !done && l.id === lv.id;
    const prevDone = i > 0 && p.points >= LEVELS[i - 1].target;
    return `
      <div class="j-node ${done ? "done" : current ? "current" : "locked"}${prevDone ? " link-done" : ""}" style="--lv:${l.color}">
        <span class="j-dot">${done ? icon("check") : icon(l.emblem)}</span>
        <small>${l.name}</small>
      </div>`;
  }).join("");

  const note = pr.maxed
    ? `Nível máximo alcançado. Obrigado por fazer parte da Bug Shop!`
    : `Faltam <strong>${formatPoints(pr.remaining)} pts</strong> para completar o nível ${escapeHtml(lv.name)} e liberar a recompensa.`;

  return `
    <div class="progress-head">
      ${levelEmblem(lv)}
      <div class="progress-title">
        <span class="eyebrow">Nível atual</span>
        <h2>${escapeHtml(lv.name)} ${lv.seal ? sealSVG(lv.seal, 18) : ""}</h2>
      </div>
      <div class="progress-points"><strong>${formatPoints(p.points)}</strong><span>/ ${formatPoints(lv.target)} pts</span></div>
    </div>
    <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pr.pct}">
      <div class="progress-fill" style="width:${pr.pct}%;--lv:${lv.color}"></div>
    </div>
    <div class="progress-foot"><span>${pr.pct}%</span><span>Meta: ${formatPoints(lv.target)} pts</span></div>
    <p class="progress-note">${note}</p>
    <div class="journey">${nodes}</div>`;
}

/* ---------------- recompensas ---------------- */
function rewardsHTML(p) {
  const claimed = new Set(p.claimedLevels || []);
  const today = dayKey();
  const reds = session.redemptions;
  const usedToday = reds.some((r) => r.dayKey === today) || p.lastClaimDay === today;
  const unlocked = LEVELS.filter((l) => p.points >= l.target);

  const rows = unlocked.map((l) => {
    const red = reds.find((r) => r.level === l.id);
    const done = claimed.has(l.id) || (red && red.status === "feito");
    const pending = red && red.status === "pendente";
    let action;
    if (done) action = `<span class="chip chip-done">${icon("check")} Coletada</span>`;
    else if (pending) action = `<span class="chip chip-wait">${icon("clock")} Em análise</span>`;
    else if (usedToday) action = `<button class="btn btn-ghost btn-sm" type="button" disabled>Volta amanhã</button>`;
    else action = `<button class="btn btn-primary btn-sm" type="button" data-claim-level="${l.id}">Coletar</button>`;
    return `
      <div class="reward-row${done ? " is-done" : ""}">
        ${levelEmblem(l)}
        <div class="reward-info"><strong>Nível ${l.id} · ${escapeHtml(l.name)}</strong><span>${escapeHtml(rewardsText(l))}</span></div>
        ${action}
      </div>`;
  });

  const nextLocked = LEVELS.find((l) => p.points < l.target);
  const teaser = nextLocked
    ? `<div class="reward-row is-locked">
         <span class="level-emblem locked">${icon("lock")}</span>
         <div class="reward-info"><strong>Nível ${nextLocked.id} · ${escapeHtml(nextLocked.name)}</strong><span>${escapeHtml(rewardsText(nextLocked))}</span></div>
         <span class="chip chip-lock">${formatPoints(nextLocked.target)} pts</span>
       </div>`
    : "";

  const pendingCount = rows.length;
  const hint = usedToday && unlocked.some((l) => !claimed.has(l.id) && !reds.find((r) => r.level === l.id))
    ? `<p class="reward-hint">${icon("clock")} Só é possível coletar 1 recompensa por dia. Volta amanhã para a próxima.</p>`
    : pendingCount
      ? `<p class="reward-hint">${icon("info")} Ao coletar, a recarga é feita manualmente em até 24 horas.</p>`
      : "";

  return `
    <div class="card-head"><h2>${icon("gift")} Recompensas</h2></div>
    ${rows.join("")}${teaser}${hint}`;
}

/* ---------------- níveis e benefícios ---------------- */
function levelsHTML(p) {
  const current = getLevel(p.points);
  return LEVELS.map((l) => {
    const done = p.points >= l.target;
    const isCurrent = l.id === current.id && !done;
    const open = openLevelId === l.id || (openLevelId === null && isCurrent);
    const state = done ? `<span class="chip chip-done">${icon("check")} Completo</span>`
      : isCurrent ? `<span class="chip chip-current">Atual</span>`
      : `<span class="chip chip-lock">${icon("lock")} Bloqueado</span>`;
    const mini = isCurrent
      ? `<div class="mini-track"><div style="width:${levelProgress(p.points).pct}%;background:${l.color}"></div></div>`
      : "";
    return `
      <div class="level-item${open ? " open" : ""}${done ? " is-done" : ""}${isCurrent ? " is-current" : ""}" style="--lv:${l.color}">
        <button class="level-head" type="button" data-level-toggle="${l.id}">
          ${levelEmblem(l)}
          <span class="level-title"><strong>${escapeHtml(l.name)} ${l.seal ? sealSVG(l.seal, 15) : ""}</strong><small>${formatPoints(l.from)} – ${formatPoints(l.target)} pts</small></span>
          ${state}
          <span class="level-chev">${icon("chevronDown")}</span>
        </button>
        <div class="level-body">
          ${mini}
          <ul class="perk-list">${l.perks.map((k) => `<li>${icon(k.icon)}<span>${escapeHtml(k.text)}</span></li>`).join("")}</ul>
        </div>
      </div>`;
  }).join("");
}

/* ---------------- ecrã ---------------- */
export function renderProfile() {
  const p = session.profile;
  if (!p) return;
  const lv = getLevel(p.points);

  const cover = safeImage(p.coverURL);
  $("profileCover").style.backgroundImage = cover ? `url("${cover}")` : "";
  $("profileCover").classList.toggle("has-image", Boolean(cover));

  const av = $("profileAvatar");
  av.innerHTML = avatarHTML(p);
  av.style.setProperty("--lvl", lv.color);

  $("profileName").innerHTML = `<span class="bar-name-text">${escapeHtml(displayName(p))}</span>${lv.seal ? sealSVG(lv.seal, 22) : ""}`;
  $("profileSub").innerHTML = `${p.ffId ? `ID ${escapeHtml(p.ffId)}` : "ID não definido"} <span class="dot">•</span> ${escapeHtml(p.email || "")}`;

  $("statPoints").textContent = formatPoints(p.points);
  $("statLevel").textContent = `${lv.id} · ${lv.name}`;
  const orders = typeof p.totalOrders === "number" ? p.totalOrders : session.orders.filter((o) => o.status === "concluido").length;
  $("statOrders").textContent = formatPoints(orders);

  $("progressCard").innerHTML = progressHTML(p);
  $("rewardsCard").innerHTML = rewardsHTML(p);
  $("levelsList").innerHTML = levelsHTML(p);
}

function claimWhatsappLink(level) {
  const p = session.profile;
  const text = `Olá! Pedi a recompensa do nível ${level.name} no app (${rewardsText(level)}).\nNick: ${p.nick}\nID: ${p.ffId}\nE-mail: ${p.email}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function initProfile() {
  $("screen-profile").addEventListener("click", async (event) => {
    const toggle = event.target.closest("[data-level-toggle]");
    if (toggle) {
      const id = Number(toggle.dataset.levelToggle);
      const item = toggle.closest(".level-item");
      const willOpen = !item.classList.contains("open");
      openLevelId = willOpen ? id : 0;
      document.querySelectorAll(".level-item").forEach((el) => el.classList.remove("open"));
      if (willOpen) item.classList.add("open");
      return;
    }

    const claim = event.target.closest("[data-claim-level]");
    if (!claim) return;
    const level = LEVELS.find((l) => l.id === Number(claim.dataset.claimLevel));
    if (!level) return;

    const ok = await askConfirm({
      title: `Coletar recompensa do nível ${level.name}?`,
      text: `Vamos pedir: ${rewardsText(level)}. A recarga é feita manualmente em até 24 horas. Só podes coletar 1 recompensa por dia.`,
      okLabel: "Coletar",
    });
    if (!ok) return;

    claim.disabled = true;
    try {
      await requestReward(level);
      haptic("success");
      playSound("success");
      showResultDialog({
        iconName: "clock",
        tone: "wait",
        title: "Solicitação enviada",
        text: "Recebemos o teu pedido. Aguarda até 24 horas — vamos fazer a recarga manualmente e avisar-te aqui no app.",
        primary: "Entendi",
        secondary: "Avisar também no WhatsApp",
        onSecondary: () => window.open(claimWhatsappLink(level)),
      });
    } catch (err) {
      claim.disabled = false;
      haptic("error");
      showToast("Não foi possível pedir agora. Verifica a ligação ou se já pediste esta recompensa.", "error", 4200);
    }
  });

  $("editProfileBtn").addEventListener("click", () => document.dispatchEvent(new CustomEvent("profile:edit")));

  const refresh = () => {
    renderTopBar();
    renderProfile();
  };
  document.addEventListener("session:changed", refresh);
  document.addEventListener("session:redemptions", renderProfile);
  document.addEventListener("session:orders", renderProfile);
}
