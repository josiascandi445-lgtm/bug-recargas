/** Vibração e sons do app (respeitam as definições). */
import { getSettings } from "./settings.js";

function plugins() {
  return (window.Capacitor && window.Capacitor.Plugins) || {};
}

function safe(fn) {
  try {
    const result = fn();
    if (result && typeof result.catch === "function") result.catch(() => {});
  } catch { /* melhor esforço */ }
}

export function haptic(kind = "light") {
  if (!getSettings().haptics) return;
  const H = plugins().Haptics;
  if (H) {
    if (kind === "success") safe(() => H.notification({ type: "SUCCESS" }));
    else if (kind === "error") safe(() => H.notification({ type: "ERROR" }));
    else if (kind === "medium") safe(() => H.impact({ style: "MEDIUM" }));
    else safe(() => H.impact({ style: "LIGHT" }));
    return;
  }
  if (navigator.vibrate) {
    safe(() => navigator.vibrate(kind === "light" ? 10 : kind === "medium" ? 20 : [20, 40, 20]));
  }
}

let audioCtx = null;
function getAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone(ctx, freq, start, duration, volume = 0.05, type = "sine") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playSound(kind = "tap") {
  if (!getSettings().sound) return;
  safe(() => {
    const ctx = getAudio();
    if (!ctx) return;
    const t = ctx.currentTime;
    if (kind === "success") {
      tone(ctx, 660, t, 0.12);
      tone(ctx, 880, t + 0.1, 0.12);
      tone(ctx, 1320, t + 0.2, 0.2);
    } else if (kind === "error") {
      tone(ctx, 220, t, 0.22, 0.06, "triangle");
    } else {
      tone(ctx, 880, t, 0.06, 0.04);
    }
  });
}
