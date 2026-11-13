/**
 * PRODUTOS — BUG RECARGAS
 * ------------------------------------------------------------
 * Este é o ÚNICO lugar onde os preços devem ser alterados.
 * Não existem preços "soltos" em nenhum outro arquivo do projeto.
 *
 * Fonte dos dados: imagens fornecidas pelo cliente.
 *   - Categoria "diamantes"      -> tabela normal/principal de pacotes
 *   - Categoria "passe"          -> tabela de descontos exclusivos
 *                                   para quem tem o Passe de Nível
 *
 * NOTA DE REVISÃO (não inventado, sinalizado para o cliente):
 *   1. O valor "Ativação do Passe de Nível" (5.000 Kz) veio de uma
 *      linha separada na imagem da tabela de pacotes. Confirme se
 *      esse é o produto certo para representar a ativação do passe.
 *   2. A imagem da tabela de descontos do passe trazia a linha
 *      "200 Diamantes - 1.500 Kz" repetida 4 vezes seguidas.
 *      Foi mantida apenas 1 ocorrência (possível erro de tabela/print).
 */

export const products = [
  // ---------------------------------------------------------
  // DIAMANTES — pacotes normais
  // ---------------------------------------------------------
  { id: "diamonds-mini", category: "diamantes", name: "Pacote Mini", baseAmount: 65, bonus: 13, amountLabel: "65 + 13 Diamantes", price: 900 },
  { id: "diamonds-lite", category: "diamantes", name: "Pacote Lite", baseAmount: 100, bonus: 20, amountLabel: "100 + 20 Diamantes", price: 1200 },
  { id: "diamonds-ligeiro", category: "diamantes", name: "Pacote Ligeiro", baseAmount: 310, bonus: 62, amountLabel: "310 + 62 Diamantes", price: 3500 },
  { id: "diamonds-medio", category: "diamantes", name: "Pacote Médio", baseAmount: 520, bonus: 104, amountLabel: "520 + 104 Diamantes", price: 5500 },
  { id: "diamonds-pro", category: "diamantes", name: "Pacote Pro", baseAmount: 1060, bonus: 212, amountLabel: "1.060 + 212 Diamantes", price: 11500 },
  { id: "diamonds-mensal", category: "diamantes", name: "Pacote Mensal", baseAmount: 5600, bonus: 1120, amountLabel: "5.600 + 1.120 Diamantes", price: 52000 },

  // ---------------------------------------------------------
  // PASSE DE NÍVEL — ativação + diamantes com desconto exclusivo
  // ---------------------------------------------------------
  { id: "passe-ativacao", category: "passe", name: "Ativação do Passe de Nível", amountLabel: "Passe de Nível", price: 5000, note: "Ativa o Passe de Nível na sua conta." },
  { id: "passe-120", category: "passe", name: "Diamantes com desconto (Passe ativo)", baseAmount: 120, bonus: 0, amountLabel: "120 Diamantes", price: 1000 },
  { id: "passe-200", category: "passe", name: "Diamantes com desconto (Passe ativo)", baseAmount: 200, bonus: 0, amountLabel: "200 Diamantes", price: 1500 },
  { id: "passe-350", category: "passe", name: "Diamantes com desconto (Passe ativo)", baseAmount: 350, bonus: 0, amountLabel: "350 Diamantes", price: 2000, weekendPromoPrice: 1800, hasWeekendPromo: true },
];

export function getProductById(id) {
  return products.find((p) => p.id === id) || null;
}

export function getProductsByCategory(category) {
  return products.filter((p) => p.category === category);
}
