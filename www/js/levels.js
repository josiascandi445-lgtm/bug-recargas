/**
 * NÍVEIS E PONTOS — Bug Shop Recargas
 * ------------------------------------------------------------
 * Este ficheiro é igual no app e no painel admin.
 * Para mudar metas, recompensas ou textos, altera só aqui
 * (e mantém as metas iguais nas regras do Firestore).
 *
 * Como funciona:
 *  - Os pontos só sobem (nunca são gastos).
 *  - O nível é a faixa onde os pontos estão (Iniciante 0–1000, etc.).
 *  - Ao chegar à meta de um nível, a recompensa desse nível
 *    fica disponível para coletar (1 recompensa por dia).
 */
export const LEVELS = [
  {
    id: 1, key: "iniciante", name: "Iniciante", from: 0, target: 1000,
    color: "#8b96a8", emblem: "star", seal: null,
    rewards: [{ name: "Assinatura Semanal Económica", qty: 2 }],
    perks: [{ icon: "ticket", text: "2 assinaturas semanais económicas" }],
  },
  {
    id: 2, key: "flexivel", name: "Flexível", from: 1000, target: 3000,
    color: "#4aa3ff", emblem: "zap", seal: null,
    rewards: [{ name: "Recarga de 78 Diamantes", qty: 1 }],
    perks: [
      { icon: "gem", text: "1 recarga de 78 diamantes" },
      { icon: "gift", text: "Presente do pacote do nível (quando houver)" },
    ],
  },
  {
    id: 3, key: "boss", name: "Boss", from: 3000, target: 5000,
    color: "#c3ccd8", emblem: "award", seal: "silver",
    rewards: [
      { name: "Recarga de 120 Diamantes", qty: 1 },
      { name: "Assinatura Semanal Económica", qty: 1 },
    ],
    perks: [
      { icon: "badge", text: "Selo prateado no perfil" },
      { icon: "gem", text: "1 recarga de 120 diamantes" },
      { icon: "gift", text: "Presente do pacote do nível (quando houver)" },
      { icon: "ticket", text: "1 assinatura semanal económica" },
    ],
  },
  {
    id: 4, key: "vip", name: "VIP", from: 5000, target: 8000,
    color: "#34d058", emblem: "crown", seal: "verified",
    rewards: [
      { name: "Recarga de 120 Diamantes", qty: 2 },
      { name: "Assinatura Semanal Económica", qty: 2 },
    ],
    perks: [
      { icon: "badgeCheck", text: "Selo verificado verde Bug Shop" },
      { icon: "gem", text: "2 recargas de 120 diamantes" },
      { icon: "ticket", text: "2 assinaturas semanais económicas" },
    ],
  },
];

export const MAX_POINTS = LEVELS[LEVELS.length - 1].target;
export const BUGSHOP_GREEN = "#34d058";

/** Pontos ganhos por compra concluída. */
export function pointsForPrice(price) {
  if (!price || price <= 0) return 0;
  return price >= 1000 ? 250 : 200;
}

export function getLevel(points) {
  const p = Number(points) || 0;
  let current = LEVELS[0];
  for (const level of LEVELS) if (p >= level.from) current = level;
  return current;
}

export function levelProgress(points) {
  const p = Math.max(0, Number(points) || 0);
  const level = getLevel(p);
  const maxed = level.id === LEVELS.length && p >= level.target;
  const span = level.target - level.from;
  const done = Math.min(span, Math.max(0, p - level.from));
  const next = LEVELS[level.id] || null; // próximo nível (índice = id)
  return {
    level, next, maxed, points: p,
    pct: maxed ? 100 : Math.round((done / span) * 100),
    remaining: Math.max(0, level.target - p),
  };
}

/** Recompensas já desbloqueadas pelos pontos (meta atingida). */
export function unlockedLevels(points) {
  return LEVELS.filter((l) => (Number(points) || 0) >= l.target);
}

export function formatPoints(n) {
  return (Number(n) || 0).toLocaleString("pt-PT");
}

/** Dia (AAAA-MM-DD) no fuso de Luanda (UTC+1) — usado no limite de 1 recompensa por dia. */
export function dayKey(date = new Date()) {
  return new Date(date.getTime() + 3600000).toISOString().slice(0, 10);
}

export function rewardsText(level) {
  return level.rewards.map((r) => `${r.qty}× ${r.name}`).join(" + ");
}
