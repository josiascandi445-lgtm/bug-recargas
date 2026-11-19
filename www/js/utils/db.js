import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ---------------------------------------------------------
   CONTADOR DE COMPRAS
   Documento único: stats/purchases -> { total: number }
--------------------------------------------------------- */
export async function getPurchaseCount() {
  const ref = doc(db, "stats", "purchases");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().total || 0 : 0;
}

export async function incrementPurchaseCount() {
  const ref = doc(db, "stats", "purchases");
  await setDoc(ref, { total: increment(1) }, { merge: true });
}

/* ---------------------------------------------------------
   REGISTO DE COMPRAS (para o painel admin)
   Coleção "purchases": um documento por pedido.
   Isto é uma ADIÇÃO — não substitui o contador acima, que
   continua a funcionar exatamente como antes.
--------------------------------------------------------- */
export async function logPurchase({ playerId, nickname, productName, amountLabel, category, price, couponCode, userId, userName, productId }) {
  await addDoc(collection(db, "purchases"), {
    playerId: playerId || null,
    nickname: nickname || null,
    productName: productName || null,
    amountLabel: amountLabel || null,
    category: category || null,
    price: typeof price === "number" ? price : 0,
    couponCode: couponCode || null,
    userId: userId || null,
    userName: userName || null,
    productId: productId || null,
    status: "pendente",
    createdAt: serverTimestamp(),
  });
}

/* ---------------------------------------------------------
   EVENTOS PÚBLICOS (promoções + salinha)
   Leitura pública, só o painel admin escreve.
--------------------------------------------------------- */
export async function getActivePromotions() {
  const now = Timestamp.now();
  const q = query(collection(db, "promotions"), where("endAt", ">", now));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => !p.startAt || p.startAt.toMillis() <= Date.now());
}

export async function getActiveSalinhaEvents() {
  const q = query(collection(db, "salinha"), where("active", "==", true));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------------------------------------------------------
   CUPÕES
   Documento com ID = o próprio código (maiúsculas), para que a
   busca pública seja uma leitura direta (get), não uma listagem
   — as regras do Firestore permitem "get" público mas só o admin
   pode "listar" a coleção inteira.
--------------------------------------------------------- */
export async function getCouponByCode(code) {
  const ref = doc(db, "coupons", code.trim().toUpperCase());
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function redeemCoupon(code) {
  const ref = doc(db, "coupons", code.trim().toUpperCase());
  await updateDoc(ref, { usedCount: increment(1) });
}
