/* =========================================================
   ORIGEM 68 — TEMA DO SITE
   ---------------------------------------------------------
   Escolha aqui com qual tema o site abre para quem nunca
   mudou o tema:
       "dark"  → escuro
       "light" → claro
   Se o visitante trocar no botão ☀/☾, a escolha dele fica
   salva no navegador dele e vale nas próximas visitas.
   ========================================================= */
var TEMA_PADRAO = "dark";

(function () {
  var escolhido = null;
  try { escolhido = localStorage.getItem("o68-tema"); } catch (e) {}
  if (escolhido !== "dark" && escolhido !== "light") escolhido = TEMA_PADRAO;
  document.documentElement.setAttribute("data-theme", escolhido);
})();
