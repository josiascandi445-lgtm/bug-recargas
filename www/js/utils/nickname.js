/**
 * Busca o Nick do jogador a partir do ID, usando a Netlify Function
 * como ponte. Os serviços de origem (Render, plano gratuito) podem
 * estar "a dormir" e demorar para acordar — por isso, se a função
 * responder com 503 ("a aquecer"), tentamos de novo automaticamente
 * algumas vezes antes de desistir.
 */

// Dentro do app os ficheiros correm localmente, então a função do Netlify
// tem de ser chamada pelo endereço completo do site.
const API_BASE =
  window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform()
    ? "https://bug-recarga.netlify.app"
    : "";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const RETRY_DELAYS_MS = [0, 2500, 4000, 6000, 8000]; // ~20s de espera total, em tentativas

export async function fetchNickname(playerId, onRetry) {
  let lastErrorMessage = "Não foi possível consultar o ID agora. Tente novamente em instantes.";

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (RETRY_DELAYS_MS[attempt]) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
    if (attempt > 0 && typeof onRetry === "function") {
      onRetry(attempt, RETRY_DELAYS_MS.length);
    }

    let response;
    try {
      response = await fetch(`${API_BASE}/.netlify/functions/ff-nick?uid=${encodeURIComponent(playerId)}`);
    } catch (networkErr) {
      lastErrorMessage = "Falha de conexão. Verifique sua internet e tente novamente.";
      continue;
    }

    const data = await response.json().catch(() => ({}));

    if (response.status === 200 && data.nickname) {
      return data.nickname;
    }

    if (response.status === 404) {
      // Resposta definitiva: o jogador realmente não foi encontrado.
      throw new Error(data.error || "Jogador não encontrado.");
    }

    if (response.status === 400) {
      throw new Error(data.error || "ID inválido.");
    }

    // 503 ou outro erro transitório -> tenta de novo no próximo loop
    lastErrorMessage = data.error || lastErrorMessage;
  }

  throw new Error(lastErrorMessage);
}

/**
 * Dispara um "ping" silencioso para os servidores de consulta,
 * sem esperar nem tratar a resposta — serve só para começar a
 * "acordar" o servidor gratuito do Render enquanto o cliente
 * ainda está a digitar o ID, ganhando tempo antes do clique real
 * em "Ver Nick".
 */
export function warmupNicknameServers() {
  const urls = [
    "https://freefireinfo-zy9l.onrender.com/",
    "https://free-ff-api-src-5plp.onrender.com/",
  ];

  urls.forEach((url) => {
    fetch(url, { mode: "no-cors" }).catch(() => {});
  });
}
