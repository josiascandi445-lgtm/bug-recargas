/**
 * Ajustes só para o app Android (Capacitor).
 * No site normal (Netlify) este ficheiro não faz nada.
 */
(function () {
  var cap = window.Capacitor;
  var isNative = cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform();
  if (!isNative) return;

  document.documentElement.classList.add("is-native");

  function openExternal(url) {
    var browser = cap.Plugins && cap.Plugins.Browser;
    if (browser && typeof browser.open === "function") {
      browser.open({ url: url });
    } else {
      window.location.href = url;
    }
  }

  // window.open(...) (usado no botão de finalizar pelo WhatsApp)
  window.open = function (url) {
    if (url) openExternal(String(url));
    return null;
  };

  // Links <a target="_blank"> e qualquer link externo
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    if (/^https?:\/\//i.test(href) && href.indexOf("localhost") === -1) {
      event.preventDefault();
      openExternal(href);
    }
  });
})();
