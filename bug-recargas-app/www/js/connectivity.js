import { icon } from "./icons.js";
import { showToast } from "./toast.js";

let banner = null;
let wasOffline = false;

function getBanner() {
  if (banner) return banner;
  banner = document.createElement("div");
  banner.className = "offline-banner";
  banner.innerHTML = `${icon("wifiOff")}<span>Sem conexão com a internet</span>`;
  document.body.prepend(banner);
  return banner;
}

function updateStatus() {
  const el = getBanner();
  if (navigator.onLine) {
    if (wasOffline) {
      showToast("Conexão restabelecida", "success", 2200);
      wasOffline = false;
    }
    el.classList.remove("visible");
  } else {
    wasOffline = true;
    el.classList.add("visible");
  }
}

export function initConnectivityWatcher() {
  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
  if (!navigator.onLine) updateStatus();
}
