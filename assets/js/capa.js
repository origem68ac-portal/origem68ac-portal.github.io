/* Origem 68 — preenche a capa com as notícias publicadas e os blocos editáveis */
(async function () {
  const { api, util } = window.O68;
  const { esc, fotoHTML, tempoRelativo, minutosLeitura } = util;
  const $ = s => document.querySelector(s);
  const link = n => 'artigo.html?n=' + encodeURIComponent(n.slug);
  const arrow = '<span class="btn__arrow"><svg><use href="#i-arrow"/></svg></span>';
  const fim = () => document.body.classList.remove('is-loading');
  const blocosP = window.O68.blocos || api.blocos().catch(() => ({}));

  // Municípios (não depende do banco)
  const ORDEM = ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá', 'Feijó', 'Brasiléia', 'Epitaciolândia', 'Xapuri', 'Senador Guiomard', 'Plácido de Castro', 'Acrelândia', 'Capixaba', 'Porto Acre', 'Bujari', 'Assis Brasil', 'Manoel Urbano', 'Santa Rosa do Purus', 'Jordão', 'Mâncio Lima', 'Rodrigues Alves', 'Porto Walter', 'Marechal Thaumaturgo'];
  const mun = $('[data-municipios]');
  if (mun) mun.innerHTML = ORDEM.map(m => `<a class="chip" href="lista.html?municipio=${encodeURIComponent(m)}">${esc(m)}</a>`).join('');

  let todas = [], lidas = [];
  try { [todas, lidas] = await Promise.all([api.publicadas(40), api.maisLidas(4)]); }
  catch (e) { console.error(e); }

  // ---------- manchete, destaque e últimas ----------
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

  // Mais lidas (se ainda não há leituras, mostra as mais recentes)
  const ol = $('[data-mais-lidas]');
  const listaLidas = lidas.length ? lidas : todas.slice(0, 4);
  if (ol) {
    ol.innerHTML = listaLidas.map(n => `<li><div><a href="${link(n)}">${esc(n.titulo)}</a><small>${esc(n.editoria)}</small></div></li>`).join('');
    ol.closest('.mostread').hidden = !listaLidas.length;
  }

  // Letreiro "Agora"
  const track = $('[data-ticker]');
  if (track) {
    const itens = todas.slice(0, 6).map(n => `<a href="${link(n)}">${esc(n.titulo)}</a>`).join('');
    track.innerHTML = itens + itens; // duplicado para o letreiro girar sem emenda
    track.closest('.ticker').hidden = !todas.length;
  }
  fim();

  // ---------- blocos editáveis ----------
  const b = await blocosP;

  // Pulso do dia
  const pulso = $('[data-pulso]');
  if (pulso) {
    const item = (icone, valor, texto) => `<div class="pulse__item"><span class="pulse__icon"><svg><use href="#i-${icone}"/></svg></span><div><b>${esc(valor)}</b><small>${esc(texto)}</small></div></div>`;
    const desenhar = clima => {
      const p = b.pulso || {}, itens = [];
      if (clima) itens.push(item('sun', `${clima.max}° / ${clima.min}°`, `Rio Branco · ${clima.ceu}${clima.chuva != null ? ` · chuva ${clima.chuva}%` : ''}`));
      if (clima && clima.pm25 != null) itens.push(item('flame', `Ar: ${window.O68.qualidadeAr(clima.pm25)}`, `Fumaça (MP2,5): ${clima.pm25} µg/m³ em Rio Branco`));
      if (p.rio_nivel) itens.push(item('drop', p.rio_nivel, p.rio_info || 'Rio Acre em Rio Branco'));
      if (p.boi_valor) itens.push(item('coin', p.boi_valor, p.boi_info || 'Arroba do boi'));
      if (p.extra_valor) itens.push(item('bus', p.extra_valor, p.extra_info || ''));
      pulso.innerHTML = itens.join('');
      pulso.style.setProperty('--n', Math.max(1, itens.length));
      pulso.hidden = !itens.length;
    };
    desenhar(null);
    (window.O68.clima || Promise.resolve(null)).then(desenhar);
  }

  // Vitrine de editorias: a notícia mais recente de cada uma
  const vit = $('[data-vitrine]');
  if (vit) {
    const v = b.vitrine || {};
    const eds = (v.editorias && v.editorias.length ? v.editorias : ['Amazônia', 'Cultura', 'Economia', 'Interior']).slice(0, 4);
    const cores = ['cream', 'orange', 'dark', 'amber'];
    const achados = await Promise.all(eds.map(async ed => {
      const n = todas.find(x => x.editoria === ed);
      if (n) return n;
      try { return (await api.lista({ editoria: ed, limite: 1 })).itens[0] || null; } catch (_) { return null; }
    }));
    const tiles = eds.map((ed, i) => achados[i] ? `
      <a href="${link(achados[i])}" class="tile tile--${cores[i]}">
        <div class="tile__top"><span class="tile__cat">${esc(ed)}</span><span class="tile__go"><svg><use href="#i-arrow"/></svg></span></div>
        <div><h3>${esc(achados[i].titulo)}</h3><small>${tempoRelativo(achados[i].publicado_em)} · ${minutosLeitura(achados[i].corpo)} min</small></div>
      </a>` : '').join('');
    vit.innerHTML = tiles;
    if (v.titulo) $('[data-vitrine-titulo]').textContent = v.titulo;
    $('[data-secao="vitrine"]').hidden = !tiles.trim();
  }

  // Vídeos e podcasts
  const mid = $('[data-midia]');
  if (mid) {
    const itens = ((b.midia || {}).itens || []).filter(x => x && x.titulo && util.linkSeguro(x.url));
    if (itens.length) {
      const [d, ...outros] = itens;
      const yt = util.youtubeId(d.url);
      const capa = x => { const id = util.youtubeId(x.url); return id ? `<div class="ph has-img"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy"></div>` : '<div class="ph ph--3"></div>'; };
      mid.innerHTML = `
        <div class="player" data-player>
          ${capa(d)}
          <div class="player__ui">
            ${d.tipo ? `<span class="tag tag--hot">${esc(d.tipo)}</span>` : ''}
            <h3>${esc(d.titulo)}</h3>
            <div class="player__row">
              ${yt ? `<button class="btn btn--cream" type="button" data-play="${yt}">Assistir ${arrow}</button>`
                   : `<a class="btn btn--cream" href="${esc(util.linkSeguro(d.url))}" target="_blank" rel="noopener">Abrir ${arrow}</a>`}
              ${d.duracao ? `<span class="meta" style="margin-left:16px"><span>${esc(d.duracao)}</span></span>` : ''}
            </div>
          </div>
        </div>
        <div class="pods">${outros.slice(0, 4).map(x => `
          <a href="${esc(util.linkSeguro(x.url))}" target="_blank" rel="noopener" class="pod">${capa(x)}<div><h4>${esc(x.titulo)}</h4><small>${esc([x.tipo, x.duracao].filter(Boolean).join(' · '))}</small></div><span class="pod__play"><svg><use href="#i-play"/></svg></span></a>`).join('')}
        </div>`;
      const btn = mid.querySelector('[data-play]');
      if (btn) btn.addEventListener('click', () => {
        mid.querySelector('[data-player]').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${btn.dataset.play}?autoplay=1" title="${esc(d.titulo)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>`;
      });
      $('[data-secao="midia"]').hidden = false;
    }
  }

  // Colunas de opinião
  const col = $('[data-colunas]');
  if (col) {
    const itens = ((b.colunas || {}).itens || []).filter(x => x && x.frase && x.nome);
    col.innerHTML = itens.slice(0, 3).map(x => {
      const url = util.linkSeguro(x.link) || (x.link && /^artigo\.html\?n=/.test(x.link) ? x.link : '');
      const ini = x.nome.replace(/^coluna\s+/i, '').split(/\s+/).filter(w => w.length > 2).slice(0, 2).map(w => w[0]).join('').toUpperCase();
      const tag = url ? 'a' : 'div';
      return `<${tag} ${url ? `href="${esc(url)}"` : ''} class="column"><blockquote>${esc(x.frase)}</blockquote>
        <div class="author"><span class="avatar">${esc(ini || '68')}</span><div><b>${esc(x.nome)}</b><small>${esc(x.assunto || '')}</small></div></div></${tag}>`;
    }).join('');
    $('[data-secao="colunas"]').hidden = !itens.length;
  }

  // Boletim
  const bol = b.boletim || {};
  if (bol.titulo) $('[data-boletim="titulo"]').textContent = bol.titulo;
  if (bol.texto) $('[data-boletim="texto"]').textContent = bol.texto;
})();
