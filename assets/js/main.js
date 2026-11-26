/* Origem 68 — interações do portal */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  // Data de hoje (horário do Acre, UTC-5)
  const today = $('[data-today]');
  if (today) {
    const txt = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Rio_Branco'
    }).format(new Date());
    today.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
  }
  $$('[data-year]').forEach(el => (el.textContent = new Date().getFullYear()));

  // Ticker infinito: duplica os itens
  const track = $('[data-ticker]');
  if (track) track.innerHTML += track.innerHTML;

  // Cabeçalho compacto ao rolar
  const header = $('[data-header]');
  const progress = $('[data-progress]');
  const article = $('[data-article]');
  const onScroll = () => {
    if (header) header.classList.toggle('is-compact', window.scrollY > 60);
    if (progress && article) {
      const r = article.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / (total > 0 ? total : 1)));
      progress.style.width = (p * 100).toFixed(2) + '%';
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Menu
  const drawer = $('[data-drawer]');
  const lock = on => (document.body.style.overflow = on ? 'hidden' : '');
  $$('[data-open-menu]').forEach(b => b.addEventListener('click', () => { drawer.classList.add('is-open'); lock(true); }));
  $$('[data-close-menu]').forEach(b => b.addEventListener('click', () => { drawer.classList.remove('is-open'); lock(false); }));
  if (drawer) $$('a', drawer).forEach(a => a.addEventListener('click', () => { drawer.classList.remove('is-open'); lock(false); }));

  // Busca
  const search = $('[data-search]');
  const openSearch = () => { search.classList.add('is-open'); lock(true); setTimeout(() => $('input', search).focus(), 30); };
  const closeSearch = () => { search.classList.remove('is-open'); lock(false); };
  $$('[data-open-search]').forEach(b => b.addEventListener('click', openSearch));
  $$('[data-close-search]').forEach(b => b.addEventListener('click', closeSearch));
  if (search) {
    search.addEventListener('click', e => { if (e.target === search) closeSearch(); });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSearch(); if (drawer) { drawer.classList.remove('is-open'); lock(false); } }
    if (e.key === '/' && search && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
  });

  // Tema claro/escuro (o padrão fica em assets/js/tema.js)
  const root = document.documentElement;
  const syncThemeBtns = () => {
    const dark = root.getAttribute('data-theme') !== 'light';
    $$('[data-theme-toggle]').forEach(b => {
      b.setAttribute('aria-label', dark ? 'Mudar para tema claro' : 'Mudar para tema escuro');
      b.setAttribute('aria-pressed', String(!dark));
    });
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0D0806' : '#FAF5EE');
  };
  $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('o68-tema', next); } catch (_) { /* navegador sem armazenamento */ }
    syncThemeBtns();
  }));
  syncThemeBtns();

  // Copiar link (página de matéria)
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href); b.setAttribute('aria-label', 'Link copiado'); b.classList.add('is-done'); }
    catch (_) { /* sem permissão de área de transferência */ }
  }));
})();
