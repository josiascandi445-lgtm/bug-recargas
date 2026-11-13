/**
 * NETLIFY FUNCTION — Consulta de Nick pelo ID (UID) do Free Fire
 * ------------------------------------------------------------
 * Fontes (serviços de terceiros, não oficiais da Garena, só leitura):
 *   1. PRINCE-LKTEAM  — https://freefireinfo-zy9l.onrender.com
 *   2. Matrixmor      — https://free-ff-api-src-5plp.onrender.com
 *
 * Os dois estão no Render (plano gratuito), que "dorme" o serviço
 * depois de um tempo sem uso — acordar pode levar 30-60s, mais do
 * que o limite de uma função do Netlify (~10s). Por isso:
 *   - Cada tentativa aqui é CURTA (não tenta esperar o acordar todo).
 *   - Se as duas fontes falharem por timeout/rede, devolvemos 503
 *     ("a aquecer") em vez de 404, para o cliente saber que deve
 *     tentar de novo em vez de achar que o jogador não existe.
 *   - O ficheiro js/utils/nickname.js, no navegador, é quem repete
 *     a chamada várias vezes com pausas, dando tempo total suficiente
 *     para o servidor acordar.
 */

const REGION = "BR"; // todos os clientes da Bug Recargas são da região BR

const SOURCES = [
  {
    name: "prince-lkteam",
    url: (uid) => `https://freefireinfo-zy9l.onrender.com/api/v1/player-profile?uid=${encodeURIComponent(uid)}&server=${REGION}`,
  },
  {
    name: "matrixmor",
    url: (uid) => `https://free-ff-api-src-5plp.onrender.com/api/v1/account?region=${REGION}&uid=${encodeURIComponent(uid)}`,
  },
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // o app Android chama esta função de fora do site
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const PER_SOURCE_TIMEOUT_MS = 4500;

/** Procura uma chave "nickname" em qualquer nível do objeto, sem depender do formato exato de cada API. */
function findNickname(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 4) return null;

  for (const key of Object.keys(obj)) {
    if (key.toLowerCase() === "nickname" && typeof obj[key] === "string" && obj[key].trim()) {
      return obj[key].trim();
    }
  }
  for (const key of Object.keys(obj)) {
    if (obj[key] && typeof obj[key] === "object") {
      const found = findNickname(obj[key], depth + 1);
      if (found) return found;
    }
  }
  return null;
}

async function tryFetch(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(PER_SOURCE_TIMEOUT_MS) });
  if (!response.ok) return { ok: false, transient: response.status >= 500 };
  const data = await response.json().catch(() => null);
  const nickname = data ? findNickname(data) : null;
  return { ok: true, nickname };
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const uid = event.queryStringParameters && event.queryStringParameters.uid;

  if (!uid || !/^\d{5,12}$/.test(uid)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      body: JSON.stringify({ error: "ID inválido." }),
    };
  }

  let anySourceUp = false;

  for (const source of SOURCES) {
    try {
      const result = await tryFetch(source.url(uid));
      if (result.ok) {
        anySourceUp = true;
        if (result.nickname) {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json", ...CORS_HEADERS },
            body: JSON.stringify({ nickname: result.nickname, source: source.name }),
          };
        }
      }
    } catch (err) {
      // timeout ou erro de rede -> provavelmente servidor a acordar, tenta a próxima fonte
    }
  }

  if (!anySourceUp) {
    // Nenhuma fonte respondeu a tempo: provavelmente ainda a acordar.
    return {
      statusCode: 503,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      body: JSON.stringify({ error: "Servidor de consulta a iniciar. Tente novamente em instantes." }),
    };
  }

  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    body: JSON.stringify({ error: "Jogador não encontrado." }),
  };
};
