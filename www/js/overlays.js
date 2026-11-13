/** Pilha de janelas abertas (modal, folhas, etc.) — usada pelo botão "voltar" do Android. */
const stack = [];

export function registerOverlay(closeFn) {
  stack.push(closeFn);
}
export function unregisterOverlay(closeFn) {
  const i = stack.lastIndexOf(closeFn);
  if (i >= 0) stack.splice(i, 1);
}
/** Fecha a janela do topo. Devolve true se havia alguma aberta. */
export function closeTopOverlay() {
  const fn = stack[stack.length - 1];
  if (!fn) return false;
  fn();
  return true;
}
