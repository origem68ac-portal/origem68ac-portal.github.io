/* Origem 68 — "stories" das ofertas: bolinha flutuante com anel colorido (como no Instagram).
   O anel fica colorido enquanto houver oferta que a pessoa ainda não viu; tocar abre as ofertas
   uma a uma, em tela cheia, passando sozinhas a cada 6 segundos. */
(async function () {
  const { api, util } = window.O68 || {};
  if (!api || !api.ofertas) return;
  let ofertas = [];
  try { ofertas = (await api.ofertas(15)).filter(o => o.imagem_url && util.linkSeguro(o.link)); } catch (_) { return; }
  if (!ofertas.length) return;

  const CV = 'o68-stories-vistas';
  let vistas = new Set();
  try { vistas = new Set(JSON.parse(localStorage.getItem(CV) || '[]')); } catch (_) {}
  const salvarVistas = () => { try { localStorage.setItem(CV, JSON.stringify([...vistas].slice(-200))); } catch (_) {} };
  const novas = () => ofertas.filter(o => !vistas.has(o.id)).length;
  const img = (u, w) => /^https?:\/\//.test(u || '') ? `https://wsrv.nl/?url=${encodeURIComponent(u)}&w=${w}&h=${w}&fit=cover&output=webp&q=80` : u;
  const esc = util.esc;
  const preco = v => v == null || v === '' ? '' : (isNaN(+v) ? String(v) : 'R$ ' + Number(v).toFixed(2).replace('.', ','));

  // bolinha flutuante
  const bola = document.createElement('button');
  bola.type = 'button';
  bola.className = 'story-bola';
  bola.setAttribute('aria-label', 'Ver ofertas do dia');
  const desenharBola = () => {
    const n = novas(), capa = ofertas.find(o => !vistas.has(o.id)) || ofertas[0];
    bola.classList.toggle('is-vista', !n);
    bola.innerHTML = `<span class="story-bola__anel"><img src="${esc(img(capa.imagem_url, 160))}" alt="" onerror="this.style.visibility='hidden'"></span>
      <span class="story-bola__txt">Ofertas</span>${n ? `<span class="story-bola__n">${n > 9 ? '9+' : n}</span>` : ''}`;
  };
  desenharBola();
  document.body.appendChild(bola);
  requestAnimationFrame(() => bola.classList.add('is-on'));

  // visualizador
  let tela = null, i = 0, timer = null, t0 = 0, pausado = false, restante = 6000;
  const DUR = 6000;
  function abrir(inicio) {
    i = inicio;
    tela = document.createElement('div');
    tela.className = 'story';
    tela.setAttribute('role', 'dialog');
    tela.setAttribute('aria-label', 'Ofertas');
    tela.innerHTML = `<div class="story__box">
      <div class="story__barras">${ofertas.map(() => '<span><i></i></span>').join('')}</div>
      <div class="story__topo"><span class="story__marca"><b>Origem 68</b> · Ofertas</span><button type="button" class="story__fechar" aria-label="Fechar">✕</button></div>
      <div class="story__conteudo" data-c></div>
      <button type="button" class="story__nav story__nav--ant" aria-label="Anterior"></button>
      <button type="button" class="story__nav story__nav--prox" aria-label="Próxima"></button>
    </div>`;
    document.body.appendChild(tela);
    document.documentElement.classList.add('story-aberto');
    tela.querySelector('.story__fechar').onclick = fechar;
    tela.querySelector('.story__nav--ant').onclick = () => ir(i - 1);
    tela.querySelector('.story__nav--prox').onclick = () => ir(i + 1);
    tela.addEventListener('click', e => { if (e.target === tela) fechar(); });
    const box = tela.querySelector('.story__box');
    box.addEventListener('pointerdown', e => { if (!e.target.closest('a,button')) pausar(true); });
    box.addEventListener('pointerup', () => pausar(false));
    box.addEventListener('pointerleave', () => pausar(false));
    document.addEventListener('keydown', tecla);
    mostrar();
  }
  function tecla(e) { if (e.key === 'Escape') fechar(); if (e.key === 'ArrowRight') ir(i + 1); if (e.key === 'ArrowLeft') ir(i - 1); }
  function fechar() {
    clearTimeout(timer);
    if (tela) tela.remove();
    tela = null;
    document.documentElement.classList.remove('story-aberto');
    document.removeEventListener('keydown', tecla);
    desenharBola();
  }
  function ir(n) { if (n < 0) n = 0; if (n >= ofertas.length) return fechar(); i = n; mostrar(); }
  function mostrar() {
    const o = ofertas[i];
    vistas.add(o.id); salvarVistas();
    const barras = tela.querySelectorAll('.story__barras i');
    barras.forEach((b, k) => { b.style.transition = 'none'; b.style.width = k < i ? '100%' : '0%'; });
    const atual = barras[i];
    requestAnimationFrame(() => requestAnimationFrame(() => { atual.style.transition = `width ${DUR}ms linear`; atual.style.width = '100%'; }));
    const desc = o.preco_antigo && +o.preco_antigo > +o.preco ? Math.round((1 - o.preco / o.preco_antigo) * 100) : 0;
    tela.querySelector('[data-c]').innerHTML = `
      <div class="story__foto"><img src="${esc(img(o.imagem_url, 900))}" data-orig="${esc(o.imagem_url)}" alt="" onerror="this.onerror=null;this.src=this.dataset.orig"></div>
      <div class="story__info">
        ${o.loja ? `<span class="story__loja">${esc(o.loja)}</span>` : ''}
        <h3>${esc(o.titulo)}</h3>
        <div class="story__preco">${o.preco_antigo ? `<s>${esc(preco(o.preco_antigo))}</s>` : ''}${o.preco ? `<b>${esc(preco(o.preco))}</b>` : ''}${desc > 0 ? `<em>-${desc}%</em>` : ''}</div>
        <a class="story__cta" href="${esc(util.linkSeguro(o.link))}" target="_blank" rel="noopener sponsored nofollow" data-oferta="${esc(o.id)}">Ver oferta</a>
        <small>Link de afiliado · ${i + 1} de ${ofertas.length} · <a href="ofertas.html">todas as ofertas</a></small>
      </div>`;
    tela.querySelector('[data-oferta]').addEventListener('click', () => api.registrarClique(o.id));
    clearTimeout(timer); restante = DUR; t0 = Date.now(); pausado = false;
    timer = setTimeout(() => ir(i + 1), DUR);
  }
  // segurar o dedo pausa (como no Instagram)
  function pausar(sim) {
    if (!tela || sim === pausado) return;
    const barra = tela.querySelectorAll('.story__barras i')[i];
    if (sim) {
      pausado = true; clearTimeout(timer); restante -= Date.now() - t0;
      const w = getComputedStyle(barra).width; barra.style.transition = 'none'; barra.style.width = w;
    } else {
      pausado = false; t0 = Date.now();
      requestAnimationFrame(() => { barra.style.transition = `width ${Math.max(0, restante)}ms linear`; barra.style.width = '100%'; });
      timer = setTimeout(() => ir(i + 1), Math.max(0, restante));
    }
  }
  bola.addEventListener('click', () => { const k = ofertas.findIndex(o => !vistas.has(o.id)); abrir(k < 0 ? 0 : k); });
})();
