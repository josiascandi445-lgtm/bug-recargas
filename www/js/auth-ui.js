/** Ecrãs de entrar / criar conta e de configuração do perfil ("Quase lá"). */
import { icon } from "./icons.js";
import {
  session, login, register, logout, resetPassword, friendlyAuthError, googleAvailable, googleLogin,
  saveProfile, compressImage,
} from "./session.js";
import { validatePlayerId } from "./utils/whatsapp.js";
import { fetchNickname } from "./utils/nickname.js";
import { avatarHTML, safeImage } from "./ui.js";
import { saveMyId, getActiveId, setActiveId } from "./myids.js";
import { registerOverlay, unregisterOverlay } from "./overlays.js";
import { showToast } from "./toast.js";
import { haptic } from "./feedback.js";
import { escapeHtml } from "./utils/html.js";

const $ = (id) => document.getElementById(id);
let mode = "login";
let setupMode = "first";
let pendingAvatar = null;
let pendingCover = null;

/* ---------------- entrar / criar conta ---------------- */
function setMode(next) {
  mode = next;
  document.querySelectorAll("[data-auth-tab]").forEach((b) => b.classList.toggle("active", b.dataset.authTab === next));
  $("authConfirmField").classList.toggle("hidden", next !== "register");
  $("forgotBtn").classList.toggle("hidden", next !== "login");
  $("authSubmit").textContent = next === "login" ? "Entrar" : "Criar conta";
  $("authPassword").setAttribute("autocomplete", next === "login" ? "current-password" : "new-password");
  $("authTitle").textContent = next === "login" ? "Bem-vindo de volta" : "Cria a tua conta";
  $("authSub").textContent = next === "login"
    ? "Entra para ver os teus pontos, nível e recompensas."
    : "Ganha pontos em cada recarga e troca por recompensas.";
  $("authError").textContent = "";
}

function authError(message) {
  $("authError").innerHTML = message ? `${icon("alertCircle")} ${escapeHtml(message)}` : "";
}

function initAuthForm() {
  document.querySelectorAll("[data-auth-tab]").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.authTab)));

  $("pwToggle").innerHTML = icon("eye");
  $("pwToggle").addEventListener("click", () => {
    const input = $("authPassword");
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    $("pwToggle").innerHTML = icon(show ? "eyeOff" : "eye");
  });

  $("authForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = $("authEmail").value.trim().toLowerCase();
    const password = $("authPassword").value;
    authError("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return authError("Escreve um e-mail válido.");
    if (password.length < 6) return authError("A senha precisa de pelo menos 6 caracteres.");
    if (mode === "register" && password !== $("authConfirm").value) return authError("As senhas não são iguais.");

    const btn = $("authSubmit");
    btn.disabled = true;
    btn.innerHTML = `${icon("loader")} Aguarda...`;
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password);
      haptic("success");
    } catch (err) {
      authError(friendlyAuthError(err));
      haptic("error");
    } finally {
      btn.disabled = false;
      btn.textContent = mode === "login" ? "Entrar" : "Criar conta";
    }
  });

  $("forgotBtn").addEventListener("click", async () => {
    const email = $("authEmail").value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return authError("Escreve o teu e-mail acima para recuperar a senha.");
    try {
      await resetPassword(email);
      authError("");
      showToast("Enviámos um link de recuperação para o teu e-mail.", "success", 4000);
    } catch (err) {
      authError(friendlyAuthError(err));
    }
  });

  const showGoogle = googleAvailable();
  $("googleDivider").classList.toggle("hidden", !showGoogle);
  $("googleBtn").classList.toggle("hidden", !showGoogle);
  $("googleBtn").addEventListener("click", async () => {
    authError("");
    try {
      await googleLogin();
    } catch (err) {
      const text = String((err && (err.message || err.code)) || "");
      if (!/cancel/i.test(text)) authError("Não foi possível entrar com o Google agora.");
    }
  });

  setMode("login");
}

/* ---------------- configuração do perfil ---------------- */
function paintPreviews() {
  const p = session.profile || {};
  const avatarSrc = pendingAvatar || safeImage(p.photoURL);
  const coverSrc = pendingCover || safeImage(p.coverURL);
  $("setupAvatar").innerHTML = avatarHTML({ ...p, photoURL: avatarSrc });
  $("setupCover").style.backgroundImage = coverSrc ? `url("${coverSrc}")` : "";
  $("setupCover").classList.toggle("has-image", Boolean(coverSrc));
}

export function openSetup(nextMode) {
  setupMode = nextMode;
  const p = session.profile || {};
  pendingAvatar = null;
  pendingCover = null;
  $("setupFfId").value = p.ffId || "";
  $("setupNick").value = p.nick || "";
  $("setupError").textContent = "";
  const first = nextMode === "first";
  $("setupStep").textContent = first ? "Quase lá" : "Perfil";
  $("setupTitle").textContent = first ? "Configura o teu perfil" : "Editar perfil";
  $("setupSub").textContent = first
    ? "Só falta o teu ID do Free Fire, o teu Nick e (se quiseres) as tuas fotos."
    : "Atualiza os teus dados e as tuas fotos.";
  $("setupSave").textContent = first ? "Concluir e entrar" : "Guardar alterações";
  $("setupClose").classList.toggle("hidden", first);
  $("setupLogout").classList.toggle("hidden", !first);
  paintPreviews();
  if (!first) {
    $("setupScreen").classList.add("open");
    registerOverlay(closeSetup);
  }
}

function closeSetup() {
  unregisterOverlay(closeSetup);
  $("setupScreen").classList.remove("open");
}

async function pickImage(inputEl, w, h, quality, maxBytes, assign) {
  const file = inputEl.files && inputEl.files[0];
  inputEl.value = "";
  if (!file) return;
  try {
    assign(await compressImage(file, w, h, quality, maxBytes));
    paintPreviews();
  } catch {
    showToast("Não foi possível usar essa imagem.", "error");
  }
}

function initSetupForm() {
  $("avatarPick").innerHTML = icon("camera");
  $("coverPick").innerHTML = `${icon("camera")}<span>Foto de capa</span>`;
  $("setupClose").innerHTML = icon("x");
  $("avatarPick").addEventListener("click", () => $("avatarFile").click());
  $("coverPick").addEventListener("click", () => $("coverFile").click());
  $("avatarFile").addEventListener("change", () => pickImage($("avatarFile"), 192, 192, 0.82, 40000, (v) => (pendingAvatar = v)));
  $("coverFile").addEventListener("change", () => pickImage($("coverFile"), 800, 300, 0.78, 110000, (v) => (pendingCover = v)));
  $("setupClose").addEventListener("click", closeSetup);
  $("setupLogout").addEventListener("click", () => logout());

  $("setupFetchNick").addEventListener("click", async () => {
    const r = validatePlayerId($("setupFfId").value);
    if (!r.valid) {
      $("setupError").innerHTML = `${icon("alertCircle")} ${escapeHtml(r.message)}`;
      return;
    }
    $("setupError").textContent = "";
    const btn = $("setupFetchNick");
    btn.disabled = true;
    btn.innerHTML = `${icon("loader")} A buscar`;
    try {
      $("setupNick").value = (await fetchNickname(r.value)).slice(0, 20);
    } catch (err) {
      $("setupError").innerHTML = `${icon("alertCircle")} ${escapeHtml(err.message || "Não foi possível encontrar esse ID.")}`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Buscar Nick";
    }
  });

  $("setupSave").addEventListener("click", async () => {
    const r = validatePlayerId($("setupFfId").value);
    const nick = $("setupNick").value.trim();
    if (!r.valid) return ($("setupError").innerHTML = `${icon("alertCircle")} ${escapeHtml(r.message)}`);
    if (nick.length < 3) return ($("setupError").innerHTML = `${icon("alertCircle")} O Nick precisa de pelo menos 3 caracteres.`);

    const fields = { ffId: r.value, nick, displayName: nick, setupDone: true };
    if (pendingAvatar) fields.photoURL = pendingAvatar;
    if (pendingCover) fields.coverURL = pendingCover;

    const btn = $("setupSave");
    btn.disabled = true;
    btn.innerHTML = `${icon("loader")} A guardar...`;
    try {
      await saveProfile(fields);
      saveMyId({ id: r.value, nick });
      if (!getActiveId()) setActiveId(r.value);
      haptic("success");
      if (setupMode === "edit") {
        closeSetup();
        showToast("Perfil atualizado", "success", 2000);
      }
    } catch (err) {
      $("setupError").innerHTML = `${icon("alertCircle")} Não foi possível guardar agora. Tenta de novo.`;
      haptic("error");
    } finally {
      btn.disabled = false;
      btn.textContent = setupMode === "first" ? "Concluir e entrar" : "Guardar alterações";
    }
  });

  document.addEventListener("profile:edit", () => openSetup("edit"));
}

export function initAuthUI() {
  initAuthForm();
  initSetupForm();
  $("googleBtn").insertAdjacentHTML(
    "afterbegin",
    `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6Z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1Z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48Z"/></svg>`
  );
}
