/* Origem 68 — páginas institucionais: pagina.html?p=quem-somos (texto editado no painel) */
(async function () {
  const { util } = window.O68;
  const P = k => document.querySelector(`[data-p="${k}"]`);
  const chave = (new URLSearchParams(location.search).get('p') || '').replace(/[^a-z0-9-]/g, '');
  document.body.classList.remove('is-loading');
  const b = await window.O68.blocos;
  const pg = b['pagina:' + chave];
  if (!pg || !pg.titulo) {
    P('titulo').textContent = 'Página não encontrada';
    P('crumb').textContent = 'Página não encontrada';
    P('corpo').innerHTML = '<p>Esta página ainda não foi publicada. <a href="index.html">Voltar para a capa</a>.</p>';
    document.title = 'Página não encontrada — Origem 68';
    return;
  }
  P('titulo').textContent = pg.titulo; P('crumb').textContent = pg.titulo;
  P('corpo').innerHTML = util.corpoHTML(pg.corpo);
  document.title = `${pg.titulo} — Origem 68`;
})();
