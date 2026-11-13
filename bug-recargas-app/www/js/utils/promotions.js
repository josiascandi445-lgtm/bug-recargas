/**
 * PROMOÇÕES — BUG RECARGAS
 * Lógica 100% no navegador (sem backend), baseada na data/hora local.
 * Sábado e domingo -> promoção de fim de semana ativa.
 */

export function isWeekendPromotion() {
  const day = new Date().getDay(); // 0 = domingo, 6 = sábado
  return day === 0 || day === 6;
}

export function getProductPrice(product) {
  if (product.hasWeekendPromo && isWeekendPromotion()) {
    return {
      finalPrice: product.weekendPromoPrice,
      originalPrice: product.price,
      onPromotion: true,
    };
  }
  return { finalPrice: product.price, originalPrice: null, onPromotion: false };
}
