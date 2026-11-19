/**
 * SESSÃO — login, perfil do cliente e dados em tempo real.
 * Eventos: session:changed | session:notifications | session:orders | session:redemptions
 */
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, GoogleAuthProvider, signInWithCredential,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, onSnapshot, setDoc, updateDoc, serverTimestamp, collection, query, where, orderBy, limit,
  writeBatch, runTransaction,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { dayKey, rewardsText } from "./levels.js";

export const session = { user: null, profile: null, ready: false, error: null, notifications: [], orders: [], redemptions: [] };

const emit = (name) => document.dispatchEvent(new CustomEvent(name));
export const toDate = (v) => (v && typeof v.toDate === "function" ? v.toDate() : v instanceof Date ? v : null);

let unsubs = [];
let heartbeat = null;
let creating = false;

function stopFeeds() {
  unsubs.forEach((u) => u());
  unsubs = [];
  if (heartbeat) clearInterval(heartbeat);
  heartbeat = null;
  session.notifications = [];
  session.orders = [];
  session.redemptions = [];
}

async function createProfile(user) {
  if (creating) return;
  creating = true;
  try {
    await setDoc(doc(db, "users", user.uid), {
      email: user.email || "", displayName: user.displayName || "", ffId: "", nick: "",
      photoURL: "", coverURL: "", points: 0, totalOrders: 0, claimedLevels: [], lastClaimDay: null,
      banned: false, bannedUntil: null, banReason: null, setupDone: false,
      createdAt: serverTimestamp(), lastSeen: serverTimestamp(),
    });
  } catch (err) {
    session.error = err;
    session.ready = true;
    emit("session:changed");
  } finally {
    creating = false;
  }
}

function touch(uid) {
  updateDoc(doc(db, "users", uid), { lastSeen: serverTimestamp() }).catch(() => {});
}

function startFeeds(uid) {
  unsubs.push(
    onSnapshot(
      query(collection(db, "users", uid, "notifications"), orderBy("createdAt", "desc"), limit(60)),
      (snap) => {
        session.notifications = snap.docs.map((d) => {
          const data = d.data();
          return { id: d.id, ...data, createdAt: toDate(data.createdAt) || new Date() };
        });
        emit("session:notifications");
      },
      () => {}
    )
  );
  unsubs.push(
    onSnapshot(
      query(collection(db, "redemptions"), where("userId", "==", uid)),
      (snap) => {
        session.redemptions = snap.docs.map((d) => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt) }));
        emit("session:redemptions");
      },
      () => {}
    )
  );
  unsubs.push(
    onSnapshot(
      query(collection(db, "purchases"), where("userId", "==", uid), limit(80)),
      (snap) => {
        session.orders = snap.docs
          .map((d) => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt) || new Date() }))
          .sort((a, b) => b.createdAt - a.createdAt);
        emit("session:orders");
      },
      () => {}
    )
  );

  touch(uid);
  heartbeat = setInterval(() => {
    if (document.visibilityState === "visible") touch(uid);
  }, 120000);
}

onAuthStateChanged(auth, (user) => {
  stopFeeds();
  session.user = user;
  session.profile = null;
  session.error = null;

  if (!user) {
    session.ready = true;
    emit("session:changed");
    return;
  }

  unsubs.push(
    onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (!snap.exists()) {
          createProfile(user);
          return;
        }
        const first = !session.profile;
        session.profile = { uid: user.uid, ...snap.data() };
        session.ready = true;
        emit("session:changed");
        if (first) startFeeds(user.uid);
      },
      (err) => {
        session.error = err;
        session.ready = true;
        emit("session:changed");
      }
    )
  );
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && session.user && session.profile) touch(session.user.uid);
});

/* ---------- estado da conta ---------- */
export function banStatus(profile) {
  if (!profile) return { banned: false };
  if (profile.banned === true) return { banned: true, permanent: true, reason: profile.banReason || "" };
  const until = toDate(profile.bannedUntil);
  if (until && until.getTime() > Date.now()) return { banned: true, permanent: false, until, reason: profile.banReason || "" };
  return { banned: false };
}

/* ---------- ações de conta ---------- */
const FRIENDLY = {
  "auth/email-already-in-use": "Este e-mail já tem conta. Entra ou recupera a senha.",
  "auth/invalid-email": "E-mail inválido.",
  "auth/weak-password": "Senha fraca. Usa pelo menos 6 caracteres.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/too-many-requests": "Muitas tentativas. Aguarda um momento e tenta de novo.",
  "auth/network-request-failed": "Sem ligação à internet. Verifica e tenta de novo.",
  "auth/user-disabled": "Esta conta foi desativada.",
  "auth/missing-password": "Escreve a tua senha.",
  "auth/operation-not-allowed": "Este método de login ainda não está ativo.",
};
export const friendlyAuthError = (err) => FRIENDLY[err && err.code] || "Não foi possível concluir agora. Tenta de novo.";

export const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const logout = () => signOut(auth);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

export function googleAvailable() {
  const P = window.Capacitor && window.Capacitor.Plugins;
  return Boolean(P && P.FirebaseAuthentication);
}

export async function googleLogin() {
  const plugin = window.Capacitor.Plugins.FirebaseAuthentication;
  const result = await plugin.signInWithGoogle();
  const idToken = result && result.credential && result.credential.idToken;
  if (!idToken) throw new Error("google-no-token");
  await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}

/* ---------- perfil ---------- */
export function saveProfile(fields) {
  return updateDoc(doc(db, "users", session.user.uid), fields);
}

/** Reduz e recorta a imagem para caber no documento do Firestore. */
export function compressImage(file, width, height, quality = 0.8, maxBytes = 140000) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      const scale = Math.max(width / img.width, height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
      URL.revokeObjectURL(url);
      let q = quality;
      let out = canvas.toDataURL("image/jpeg", q);
      while (out.length * 0.75 > maxBytes && q > 0.35) {
        q -= 0.1;
        out = canvas.toDataURL("image/jpeg", q);
      }
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };
    img.src = url;
  });
}

/* ---------- notificações ---------- */
export async function markNotificationsRead(ids) {
  if (!ids.length || !session.user) return;
  const batch = writeBatch(db);
  ids.slice(0, 40).forEach((id) => batch.update(doc(db, "users", session.user.uid, "notifications", id), { read: true }));
  await batch.commit();
}

/** Coletar presente de pontos (transação segura: só funciona uma vez por presente). */
export async function collectGift(notificationId) {
  const uid = session.user.uid;
  const userRef = doc(db, "users", uid);
  const notifRef = doc(db, "users", uid, "notifications", notificationId);
  return runTransaction(db, async (tx) => {
    const [userSnap, notifSnap] = await Promise.all([tx.get(userRef), tx.get(notifRef)]);
    if (!notifSnap.exists()) throw new Error("not-found");
    const n = notifSnap.data();
    if (n.type !== "gift" || n.collected) throw new Error("already");
    tx.update(userRef, { points: (userSnap.data().points || 0) + (n.points || 0), lastCollectedId: notificationId });
    tx.update(notifRef, { collected: true, read: true });
    return n.points || 0;
  });
}

/* ---------- recompensas ---------- */
export async function requestReward(level) {
  const p = session.profile;
  const uid = session.user.uid;
  const batch = writeBatch(db);
  batch.set(doc(db, "redemptions", `${uid}_L${level.id}`), {
    userId: uid,
    userName: p.nick || p.displayName || "",
    userEmail: p.email || "",
    ffId: p.ffId || "",
    nick: p.nick || "",
    level: level.id,
    levelName: level.name,
    items: level.rewards,
    points: p.points || 0,
    status: "pendente",
    dayKey: dayKey(),
    createdAt: serverTimestamp(),
  });
  batch.set(doc(collection(db, "users", uid, "notifications")), {
    type: "redeem_sent",
    title: "Solicitação enviada",
    message: `Recebemos o teu pedido de recompensa do nível ${level.name}: ${rewardsText(level)}. Aguarda até 24 horas — fazemos a recarga manualmente e avisamos aqui.`,
    createdAt: serverTimestamp(),
    read: false,
    collected: false,
    from: "sistema",
    meta: { level: level.id },
  });
  await batch.commit();
}
