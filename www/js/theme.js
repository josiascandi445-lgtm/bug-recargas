/** Temas (estilos visuais) e cores de destaque do app. */
export const THEMES = [
  { id: "neon", name: "Neon Gamer", desc: "Escuro com brilho", accent: "#2ee66b", preview: ["#06080c", "#10151d", "#2ee66b"] },
  { id: "claro", name: "Claro Limpo", desc: "Suave e moderno", accent: "#2f7bff", preview: ["#f2f4f8", "#ffffff", "#2f7bff"] },
  { id: "amoled", name: "AMOLED", desc: "Preto total", accent: "#ff7a45", preview: ["#000000", "#0d0d0d", "#ff7a45"] },
  { id: "galaxia", name: "Galáxia", desc: "Roxo em vidro", accent: "#a678ff", preview: ["#120b2b", "#2c2058", "#a678ff"] },
];

export const ACCENTS = [
  { id: "verde", name: "Verde", color: "#2ee66b" },
  { id: "azul", name: "Azul", color: "#2f9bff" },
  { id: "laranja", name: "Laranja", color: "#ff7a45" },
  { id: "rosa", name: "Rosa", color: "#ff4f9a" },
  { id: "roxo", name: "Roxo", color: "#a678ff" },
  { id: "amarelo", name: "Amarelo", color: "#ffc83d" },
  { id: "vermelho", name: "Vermelho", color: "#ff4d4d" },
];

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Cor de texto legível por cima da cor de destaque. */
export function readableOn(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#0b0d12" : "#ffffff";
}

function setSystemBars(lightTheme) {
  try {
    const bars = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SystemBars;
    if (bars && typeof bars.setStyle === "function") {
      const p = bars.setStyle({ style: lightTheme ? "LIGHT" : "DARK" });
      if (p && p.catch) p.catch(() => {});
    }
  } catch { /* melhor esforço */ }
}

export function applyTheme(settings) {
  const theme = THEMES.find((t) => t.id === settings.theme) || THEMES[0];
  const accent = settings.accent || theme.accent;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme.id);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--accent-rgb", hexToRgb(accent).join(","));
  root.style.setProperty("--on-accent", readableOn(accent));
  setSystemBars(theme.id === "claro");
}
