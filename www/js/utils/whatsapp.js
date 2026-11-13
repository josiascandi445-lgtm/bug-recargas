/**
 * WHATSAPP — BUG RECARGAS
 * Para trocar o número no futuro, altere apenas a constante abaixo.
 */
export const WHATSAPP_NUMBER = "244951129314";

function buildMessage(product, priceInfo, playerId, nickname, coupon) {
  const linhas = [
    "Olá, Bug Recargas! Quero fazer uma recarga de Free Fire.",
    "",
    `Produto: ${product.amountLabel}`,
  ];

  if (coupon) {
    linhas.push(`Cupão: ${coupon.code} (-${formatKz(coupon.discountKz)})`);
  }

  linhas.push(`Preço: ${formatKz(priceInfo.finalPrice)}`, `ID do jogador: ${playerId}`);

  if (nickname) {
    linhas.push(`Nick: ${nickname}`);
  }

  linhas.push("", "Gostaria de finalizar o pedido.");
  return linhas.join("\n");
}

export function formatKz(value) {
  return `${value.toLocaleString("pt-PT")} Kz`;
}

export function generateWhatsAppLink(product, priceInfo, playerId, nickname, coupon) {
  const message = buildMessage(product, priceInfo, playerId, nickname, coupon);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export function validatePlayerId(rawValue) {
  const value = (rawValue || "").trim();

  if (!value) {
    return { valid: false, message: "Informe o ID da sua conta Free Fire." };
  }
  if (!/^\d+$/.test(value)) {
    return { valid: false, message: "O ID deve conter apenas números." };
  }
  if (value.length < 5 || value.length > 12) {
    return { valid: false, message: "Informe um ID de jogador válido." };
  }
  return { valid: true, message: "", value };
}
