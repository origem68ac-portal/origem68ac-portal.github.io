/* Origem 68 — lista de notícias: lista.html?editoria=… | ?municipio=… | ?q=… */
(async function () {
  const { api, util } = window.O68;
  const { esc, fotoHTML, tempoRelativo, minutosLeitura } = util;
  const L = k => document.querySelector(`[data-l="${k}"]`);
  const p = new URLSearchParams(location.search);
  const filtro = {
    editoria: util.EDITORIAS.includes(p.get('editoria')) ? p.get('editoria') : '',
    municipio: util.MUNICIPIOS.includes(p.get('municipio')) ? p.get('municipio') : '',
    q: (p.get('q') || '').trim().slice(0, 80)
  };
  document.body.classList.remove('is-loading');

  let titulo = 'Todas as notícias', eyebrow = 'Notícias';
  if (filtro.editoria) { titulo = filtro.editoria; eyebrow = 'Editoria'; }
  if (filtro.municipio) { titulo = filtro.municipio; eyebrow = 'Município'; }
  if (filtro.q) { titulo = `Busca: “${filtro.q}”`; eyebrow = 'Resultados'; }
  L('titulo').textContent = titulo; L('eyebrow').textContent = eyebrow; L('crumb').textContent = titulo;
  document.title = `${titulo} — Origem 68`;
  L('busca').q.value = filtro.q;

  // menu do topo: marca a editoria atual
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('is-active', filtro.editoria && a.textContent.trim() === filtro.editoria));

  // atalhos de editorias
  const principais = ['Rio Branco', 'Interior', 'Política', 'Economia', 'Amazônia', 'Saúde', 'Educação', 'Segurança', 'Esporte', 'Cultura', 'Brasil', 'Tecnologia', 'Curiosidades'];
  L('chips').innerHTML = `<a class="chip${!filtro.editoria && !filtro.municipio && !filtro.q ? ' is-on' : ''}" href="lista.html">Todas</a>` +
    principais.map(e => `<a class="chip${filtro.editoria === e ? ' is-on' : ''}" href="lista.html?editoria=${encodeURIComponent(e)}">${esc(e)}</a>`).join('');

  const card = n => `
    <a href="artigo.html?n=${encodeURIComponent(n.slug)}" class="card col-4">
      ${fotoHTML(n, `<span class="card__tag"><span class="tag">${esc(n.editoria)}</span>${n.municipio && n.municipio !== n.editoria ? `<span class="tag">${esc(n.municipio)}</span>` : ''}</span>`)}
      <h3>${esc(n.titulo)}</h3>
      ${n.linha_fina ? `<p>${esc(n.linha_fina)}</p>` : ''}
      <div class="meta"><span>${tempoRelativo(n.publicado_em)}</span><span>${minutosLeitura(n.corpo)} min</span></div>
    </a>`;

  let pular = 0;
  const POR_PAGINA = 18;
  async function carregar() {
    const btn = L('mais'); btn.disabled = true; btn.textContent = 'Carregando…';
    try {
      const { itens, mais } = await api.lista({ ...filtro, limite: POR_PAGINA, pular });
      L('itens').insertAdjacentHTML('beforeend', itens.map(card).join(''));
      pular += itens.length;
      btn.hidden = !mais;
      L('vazio').hidden = pular > 0;
    } catch (e) {
      console.error(e); L('vazio').hidden = false; L('vazio').textContent = 'Não foi possível carregar as notícias agora. Tente de novo em instantes.';
    } finally { btn.disabled = false; btn.textContent = 'Carregar mais'; }
  }
  L('mais').addEventListener('click', carregar);
  carregar();
})();
