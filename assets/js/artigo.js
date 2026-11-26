/* Origem 68 — monta a página de matéria a partir de artigo.html?n=<endereço> */
(async function () {
  const { api, util } = window.O68;
  const { esc, fotoHTML, tempoRelativo, dataHora, corpoHTML } = util;
  const a = k => document.querySelector(`[data-a="${k}"]`);
  const link = n => 'artigo.html?n=' + encodeURIComponent(n.slug);
  const fim = () => document.body.classList.remove('is-loading');

  const slug = new URLSearchParams(location.search).get('n');
  let n = null, outras = [];
  try {
    outras = await api.publicadas(12);
    n = slug ? await api.porSlug(slug)
             : (outras.find(x => x.posicao === 'manchete') || outras[0] || null); // sem endereço: abre a manchete
  } catch (e) { console.error(e); }

  if (!n) {
    document.querySelector('[data-artigo-conteudo]').hidden = true;
    a('naoachou').hidden = false;
    document.title = 'Notícia não encontrada — Origem 68';
    fim(); return;
  }

  document.title = `${n.titulo} — Origem 68`;
  const desc = document.querySelector('meta[name="description"]');
  if (desc && n.linha_fina) desc.setAttribute('content', n.linha_fina);

  a('editoria').textContent = n.editoria;
  a('tags').innerHTML = `<span class="tag tag--hot">${esc(n.editoria)}</span>${n.municipio && n.municipio !== n.editoria ? `<span class="tag">${esc(n.municipio)}</span>` : ''}`;
  a('titulo').textContent = n.titulo;
  a('linha_fina').textContent = n.linha_fina || '';
  a('linha_fina').hidden = !n.linha_fina;
  a('autor').textContent = n.autor;
  a('iniciais').textContent = n.autor.split(/\s+/).filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'O68';
  const editada = n.atualizado_em && new Date(n.atualizado_em) - new Date(n.publicado_em) > 10 * 60e3;
  a('datas').textContent = `Publicado em ${dataHora(n.publicado_em)}` + (editada ? ` · Atualizado em ${dataHora(n.atualizado_em)}` : '');

  a('foto').innerHTML = fotoHTML(n).replace('data-credit="', 'style="width:100%;height:100%" data-credit="');
  a('credito').textContent = n.foto_credito || (n.foto_url ? '' : 'Imagem ilustrativa.');

  // texto + anúncio depois do 2º parágrafo
  const artigo = document.querySelector('[data-article]');
  const anuncio = artigo.querySelector('[data-ad="dentro-materia"]');
  artigo.innerHTML = corpoHTML(n.corpo);
  const ps = artigo.querySelectorAll(':scope > p');
  if (anuncio) {
    if (ps.length >= 3) ps[1].after(anuncio); else artigo.appendChild(anuncio);
  }
  // crédito da fonte (matérias feitas a partir de outro veículo ou órgão)
  if (n.fonte_nome) {
    const url = util.linkSeguro(n.fonte_url);
    artigo.insertAdjacentHTML('beforeend', `<p class="article-fonte">Com informações de ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener nofollow">${esc(n.fonte_nome)}</a>` : esc(n.fonte_nome)}.</p>`);
  }

  // compartilhar
  const url = location.origin + location.pathname + '?n=' + encodeURIComponent(n.slug);
  document.querySelector('[data-share="wa"]').href = 'https://wa.me/?text=' + encodeURIComponent(`${n.titulo} ${url}`);
  document.querySelector('[data-share="x"]').href = 'https://x.com/intent/post?text=' + encodeURIComponent(n.titulo) + '&url=' + encodeURIComponent(url);

  // leia também / continue lendo
  const resto = outras.filter(x => x.slug !== n.slug);
  const mesma = resto.filter(x => x.editoria === n.editoria);
  const leia = [...mesma, ...resto.filter(x => !mesma.includes(x))].slice(0, 3);
  a('leia').innerHTML = leia.map(x => `<a href="${link(x)}" class="card card--row">${fotoHTML(x)}<div><h3>${esc(x.titulo)}</h3></div></a>`).join('');
  a('relacionadas').innerHTML = resto.filter(x => !leia.includes(x)).slice(0, 3).map(x => `
    <a href="${link(x)}" class="card col-4">${fotoHTML(x, `<span class="card__tag"><span class="tag">${esc(x.editoria)}</span></span>`)}
      <h3>${esc(x.titulo)}</h3><div class="meta"><span>${tempoRelativo(x.publicado_em)}</span></div></a>`).join('');

  fim();
  window.dispatchEvent(new Event('scroll')); // atualiza a barra de leitura
  api.registrarLeitura(n.slug);
})();
