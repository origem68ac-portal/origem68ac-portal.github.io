/* Origem 68 — preenche a capa com as notícias publicadas */
(async function () {
  const { api, util } = window.O68;
  const { esc, fotoHTML, tempoRelativo, minutosLeitura } = util;
  const $ = s => document.querySelector(s);
  const link = n => 'artigo.html?n=' + encodeURIComponent(n.slug);
  const arrow = '<span class="btn__arrow"><svg><use href="#i-arrow"/></svg></span>';
  const fim = () => document.body.classList.remove('is-loading');

  let todas, lidas;
  try { [todas, lidas] = await Promise.all([api.publicadas(40), api.maisLidas(4)]); }
  catch (e) { console.error(e); fim(); return; } // mantém a capa estática se o banco falhar

  // escolhe manchete e destaque; o resto vai para "Últimas" na ordem de publicação
  const usados = new Set();
  const pega = cond => { const n = todas.find(x => !usados.has(x) && cond(x)); if (n) usados.add(n); return n; };
  const manchete = pega(n => n.posicao === 'manchete') || pega(() => true);
  const destaque = pega(n => n.posicao === 'destaque') || pega(() => true);

  const tagsLocal = n => `<span class="tag">${esc(n.editoria)}</span>${n.municipio && n.municipio !== n.editoria ? `<span class="tag">${esc(n.municipio)}</span>` : ''}`;

  const preencher = (sel, n, html) => {
    const el = document.querySelector(`[data-card="${sel}"]`);
    if (!el) return;
    if (!n) { el.hidden = true; return; }
    el.hidden = false; el.href = link(n); el.innerHTML = html(n);
  };

  preencher('manchete', manchete, n => `
    ${n.foto_url ? fotoHTML(n) : fotoHTML(n).replace(/ph--\d/, 'ph--waves')}
    <div class="lead__shade"></div>
    <div class="lead__bignum">68</div>
    <div class="lead__body">
      <div class="lead__tags"><span class="tag tag--hot">${esc(n.editoria)}</span>${n.municipio && n.municipio !== n.editoria ? `<span class="tag">${esc(n.municipio)}</span>` : ''}</div>
      <h1 class="lead__title">${esc(n.titulo)}</h1>
      ${n.linha_fina ? `<p class="lead__sub">${esc(n.linha_fina)}</p>` : ''}
      <div class="lead__foot">
        <div class="meta"><span>Por ${esc(n.autor)}</span><span>${minutosLeitura(n.corpo)} min de leitura</span><span>${tempoRelativo(n.publicado_em)}</span></div>
        <span class="btn btn--cream">Ler reportagem ${arrow}</span>
      </div>
    </div>`);

  preencher('destaque', destaque, n => `
    ${fotoHTML(n)}
    <div class="lead__shade"></div>
    <span class="tag tag--amber" style="align-self:flex-start">${esc(n.municipio || n.editoria)}</span>
    <h3>${esc(n.titulo)}</h3>
    <div class="meta"><span>${esc(n.editoria)}</span><span>${tempoRelativo(n.publicado_em)}</span></div>`);

  const resto = todas.filter(n => !usados.has(n));
  for (let i = 1; i <= 9; i++) {
    const n = resto[i - 1], el = document.querySelector(`[data-card="u${i}"]`);
    if (!el) continue;
    if (el.classList.contains('card--row')) {
      preencher('u' + i, n, n => `${fotoHTML(n)}<div><h3>${esc(n.titulo)}</h3><div class="meta" style="margin-top:6px"><span>${esc(n.editoria)}</span><span>${tempoRelativo(n.publicado_em)}</span></div></div>`);
    } else {
      const comResumo = i <= 3;
      preencher('u' + i, n, n => `
        ${fotoHTML(n, `<span class="card__tag">${tagsLocal(n)}</span>`)}
        <h3>${esc(n.titulo)}</h3>
        ${comResumo && n.linha_fina ? `<p>${esc(n.linha_fina)}</p>` : ''}
        <div class="meta"><span>${tempoRelativo(n.publicado_em)}</span><span>${minutosLeitura(n.corpo)} min</span></div>`);
    }
  }

  const secaoUltimas = document.querySelector('[data-card="u1"]')?.closest('section');
  if (secaoUltimas) secaoUltimas.hidden = !resto.length; // sem notícias suficientes, esconde "Últimas"

  const ol = $('[data-mais-lidas]');
  if (ol && lidas.length) ol.innerHTML = lidas.map(n => `<li><div><a href="${link(n)}">${esc(n.titulo)}</a><small>${esc(n.editoria)}</small></div></li>`).join('');

  const track = $('[data-ticker]');
  if (track && todas.length) {
    const itens = todas.slice(0, 6).map(n => `<a href="${link(n)}">${esc(n.titulo)}</a>`).join('');
    track.innerHTML = itens + itens; // duplicado para o letreiro girar sem emenda
  }
  fim();
})();
