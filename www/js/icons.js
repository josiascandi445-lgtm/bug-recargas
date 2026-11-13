/**
 * ÍCONES — Bug Shop Recargas
 * ------------------------------------------------------------
 * SVGs inline, leves, sem dependência externa (sem biblioteca
 * nova a instalar). Todos no mesmo estilo (stroke, 24x24,
 * cantos arredondados) para manter consistência visual.
 */

const stroke = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

export const icons = {
  gem: `<svg viewBox="0 0 24 24" ${stroke}><path d="M6 3h12l4 6-10 12L2 9Z"/><path d="M11 3 8 9l4 12 4-12-3-6"/><path d="M2 9h20"/></svg>`,
  ticket: `<svg viewBox="0 0 24 24" ${stroke}><path d="M2 9a3 3 0 1 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 1 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v14"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" ${stroke}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>`,
  shieldCheck: `<svg viewBox="0 0 24 24" ${stroke}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  smartphone: `<svg viewBox="0 0 24 24" ${stroke}><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>`,
  gamepad: `<svg viewBox="0 0 24 24" ${stroke}><path d="M6 12h4M8 10v4"/><circle cx="16" cy="11" r="1" fill="currentColor"/><circle cx="18.5" cy="13.5" r="1" fill="currentColor"/><path d="M17.5 6h-11a4.5 4.5 0 0 0-4.4 5.5l1 4.2A3 3 0 0 0 6 18a3 3 0 0 0 2.6-1.5L9.5 15h5l.9 1.5A3 3 0 0 0 18 18a3 3 0 0 0 2.9-2.3l1-4.2A4.5 4.5 0 0 0 17.5 6Z"/></svg>`,
  flame: `<svg viewBox="0 0 24 24" ${stroke}><path d="M8.5 14.5A3.5 3.5 0 0 0 12 18a3.5 3.5 0 0 0 3.5-3.5c0-1.6-1-2.6-2-3.5-.5.9-.8 1.3-1.5 1.5A3 3 0 0 1 10 9c0-1.3 1-2 1-3.5C8 7 6 10 6 13a6 6 0 0 0 2.5 1.5Z"/><path d="M12 2c1 3-2 4-2 7a4 4 0 0 0 8 0c0-3-2-4-2-7-1 1.5-2 2-2 2s-1-.5-2-2Z"/></svg>`,
  x: `<svg viewBox="0 0 24 24" ${stroke}><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" ${stroke}><path d="M4 6h16M4 12h16M4 18h16"/></svg>`,
  search: `<svg viewBox="0 0 24 24" ${stroke}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" ${stroke}><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  check: `<svg viewBox="0 0 24 24" ${stroke}><path d="M20 6 9 17l-5-5"/></svg>`,
  checkCircle: `<svg viewBox="0 0 24 24" ${stroke}><path d="M22 11.1V12a10 10 0 1 1-6-9.2"/><path d="m22 4-10 10-3-3"/></svg>`,
  alertCircle: `<svg viewBox="0 0 24 24" ${stroke}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`,
  loader: `<svg viewBox="0 0 24 24" ${stroke} class="icon-spin"><path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/></svg>`,
  wifiOff: `<svg viewBox="0 0 24 24" ${stroke}><path d="M2 2 22 22M8.5 16.5a5 5 0 0 1 7 0M5 12.5a9.9 9.9 0 0 1 3-2.1M19 12.5a9.9 9.9 0 0 0-2.3-2.8M12 20h.01M15.5 8.5A14 14 0 0 1 22 10"/></svg>`,
  messageCircle: `<svg viewBox="0 0 24 24" ${stroke}><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1-5.3A8.4 8.4 0 1 1 21 11.5Z"/></svg>`,
  history: `<svg viewBox="0 0 24 24" ${stroke}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 5v5h5"/><path d="M12 7v5l3 3"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" ${stroke}><path d="m6 9 6 6 6-6"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" ${stroke}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" ${stroke}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,

  home: `<svg viewBox="0 0 24 24" ${stroke}><path d="m3 11 9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>`,
  sliders: `<svg viewBox="0 0 24 24" ${stroke}><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" ${stroke}><path d="M12 5v14M5 12h14"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" ${stroke}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/></svg>`,
  palette: `<svg viewBox="0 0 24 24" ${stroke}><circle cx="13.5" cy="6.5" r="1" fill="currentColor"/><circle cx="17.5" cy="10.5" r="1" fill="currentColor"/><circle cx="8.5" cy="7.5" r="1" fill="currentColor"/><circle cx="6.5" cy="12.5" r="1" fill="currentColor"/><path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2H18a4 4 0 0 0 4-4c0-5-4.5-9.4-10-9.4Z"/></svg>`,
  volume: `<svg viewBox="0 0 24 24" ${stroke}><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>`,
  vibrate: `<svg viewBox="0 0 24 24" ${stroke}><path d="m2 8 2 2-2 2 2 2-2 2M22 8l-2 2 2 2-2 2 2 2"/><rect x="8" y="5" width="8" height="14" rx="1"/></svg>`,
  idCard: `<svg viewBox="0 0 24 24" ${stroke}><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8.5" cy="11" r="2"/><path d="M5.5 16c.5-1.5 1.7-2.2 3-2.2s2.5.7 3 2.2M14 10h5M14 14h4"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" ${stroke}><path d="m9 6 6 6-6 6"/></svg>`,
  repeat: `<svg viewBox="0 0 24 24" ${stroke}><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>`,
  helpCircle: `<svg viewBox="0 0 24 24" ${stroke}><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" ${stroke}><path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="M19 15v4M17 17h4"/></svg>`,
  info: `<svg viewBox="0 0 24 24" ${stroke}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" ${stroke}><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
};

/** Retorna um <span> com o SVG do ícone pronto a inserir no DOM. */
export function icon(name, extraClass = "") {
  const svg = icons[name] || "";
  return `<span class="icon ${extraClass}" aria-hidden="true">${svg}</span>`;
}
