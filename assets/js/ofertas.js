/* Origem 68 — ofertas com links de afiliado (página ofertas.html e bloco na capa) */
(async function () {
  const { api, util } = window.O68;
  const { esc } = util;
  const pagina = document.querySelector('[data-ofertas-pagina]');
  const capa = document.querySelector('[data-ofertas-capa]');
  if (!pagina && !capa) return;

  const LOJAS = { 'mercado livre': 'ml', 'shopee': 'shopee', 'tiktok shop': 'tiktok', 'amazon': 'amazon', 'magalu': 'magalu', 'aliexpress': 'ali', 'shein': 'shein' };
  const classeLoja = l => 'oferta__loja--' + (LOJAS[String(l || '').toLowerCase()] || 'outra');
  const img = u => /^https?:\/\//.test(u || '') ? `https://wsrv.nl/?url=${encodeURIComponent(u)}&w=600&q=75&output=webp` : '';

  const cartao = o => {
    const link = util.linkSeguro(o.link); if (!link) return '';
    const foto = util.linkSeguro(o.imagem_url);
    return `<a class="oferta${o.destaque ? ' oferta--destaque' : ''}" href="${esc(link)}" target="_blank" rel="sponsored nofollow noopener" data-oferta="${esc(o.id)}">
      <div class="oferta__img">${foto ? `<img src="${esc(img(foto))}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${esc(foto)}'">` : '<span>68</span>'}</div>
      <div class="oferta__corpo">
        ${o.loja ? `<span class="oferta__loja ${classeLoja(o.loja)}">${esc(o.loja)}</span>` : ''}
        <h3>${esc(o.titulo)}</h3>
        ${o.descricao ? `<p>${esc(o.descricao)}</p>` : ''}
        <div class="oferta__preco">${o.preco_antigo ? `<s>${esc(o.preco_antigo)}</s>` : ''}${o.preco ? `<b>${esc(o.preco)}</b>` : ''}</div>
        <span class="btn btn--primary btn--sm oferta__btn">Ver oferta <span class="btn__arrow"><svg><use href="#i-arrow"/></svg></span></span>
      </div>
    </a>`;
  };

  // conta o clique sem atrasar a ida para a loja
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-oferta]'); if (a) api.registrarClique(a.dataset.oferta);
  });

  let lista = [];
  try { lista = await api.ofertas(pagina ? 120 : 8); } catch (e) { console.error(e); }

  if (capa) {
    const sec = capa.closest('section');
    capa.innerHTML = lista.slice(0, 4).map(cartao).join('');
    if (sec) sec.hidden = !lista.length;
  }
  if (pagina) {
    document.body.classList.remove('is-loading');
    const lojas = [...new Set(lista.map(o => o.loja).filter(Boolean))];
    const filtros = document.querySelector('[data-ofertas-filtros]');
    let atual = '';
    const desenhar = () => {
      const l = atual ? lista.filter(o => o.loja === atual) : lista;
      pagina.innerHTML = l.map(cartao).join('');
      document.querySelector('[data-ofertas-vazio]').hidden = l.length > 0;
    };
    if (filtros && lojas.length > 1) {
      filtros.innerHTML = ['', ...lojas].map(l => `<button type="button" class="chip${l === atual ? ' is-on' : ''}" data-loja="${esc(l)}">${esc(l || 'Todas')}</button>`).join('');
      filtros.addEventListener('click', e => {
        const b = e.target.closest('[data-loja]'); if (!b) return;
        atual = b.dataset.loja; filtros.querySelectorAll('.chip').forEach(c => c.classList.toggle('is-on', c === b)); desenhar();
      });
    }
    desenhar();
  }
})();
