/* Origem 68 — partes comuns a todas as páginas públicas:
   links e contatos (editáveis no painel), clima, busca e boletim. */
(function () {
  const { api, util } = window.O68;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Blocos editáveis: carregados uma vez e compartilhados com capa.js
  const blocos = window.O68.blocos = api.blocos().catch(e => { console.error(e); return {}; });

  /* ---------- Clima e ar em Rio Branco (Open-Meteo, grátis, sem chave) ---------- */
  const CODIGOS = { 0: 'Céu limpo', 1: 'Poucas nuvens', 2: 'Sol entre nuvens', 3: 'Nublado', 45: 'Neblina', 48: 'Neblina', 51: 'Garoa fraca', 53: 'Garoa', 55: 'Garoa forte', 61: 'Chuva fraca', 63: 'Chuva', 65: 'Chuva forte', 80: 'Pancadas de chuva', 81: 'Pancadas de chuva', 82: 'Temporal', 95: 'Trovoadas', 96: 'Trovoadas com granizo', 99: 'Trovoadas com granizo' };
  const LAT = -9.97, LON = -67.81;
  function buscarClima() {
    const CK = 'o68-clima';
    try { const c = JSON.parse(sessionStorage.getItem(CK)); if (c && Date.now() - c.t < 30 * 60e3) return Promise.resolve(c.d); } catch (_) {}
    const tempo = fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&timezone=America%2FRio_Branco&forecast_days=1`).then(r => r.json());
    const ar = fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}&current=pm2_5&timezone=America%2FRio_Branco`).then(r => r.json()).catch(() => null);
    return Promise.all([tempo, ar]).then(([t, a]) => {
      const d = {
        agora: Math.round(t.current.temperature_2m),
        max: Math.round(t.daily.temperature_2m_max[0]), min: Math.round(t.daily.temperature_2m_min[0]),
        ceu: CODIGOS[t.daily.weather_code[0]] || '', chuva: t.daily.precipitation_probability_max[0],
        pm25: a && a.current ? Math.round(a.current.pm2_5) : null
      };
      try { sessionStorage.setItem(CK, JSON.stringify({ t: Date.now(), d })); } catch (_) {}
      return d;
    });
  }
  // Classificação do ar pelo MP2,5 (faixas da Resolução Conama 491/2018)
  window.O68.qualidadeAr = pm => pm == null ? null : pm <= 25 ? 'Boa' : pm <= 50 ? 'Moderada' : pm <= 75 ? 'Ruim' : pm <= 125 ? 'Muito ruim' : 'Péssima';
  const clima = window.O68.clima = buscarClima().catch(() => null);

  clima.then(d => {
    const el = $('[data-clima-topo]');
    if (!el || !d) return;
    $('b', el).textContent = d.agora + '°'; el.hidden = false;
  });

  /* ---------- Links e contatos ---------- */
  blocos.then(b => {
    const s = b.site || {};
    const wa = n => { const d = String(n || '').replace(/\D/g, ''); return d ? 'https://wa.me/' + (d.length <= 11 ? '55' + d : d) : ''; };
    const links = {
      instagram: util.linkSeguro(s.instagram), youtube: util.linkSeguro(s.youtube), x: util.linkSeguro(s.x),
      whatsapp: util.linkSeguro(s.whatsapp_canal) || wa(s.whatsapp_redacao),
      whatsapp_canal: util.linkSeguro(s.whatsapp_canal),
      whatsapp_redacao: wa(s.whatsapp_redacao),
      pauta: wa(s.whatsapp_redacao) || (s.email_redacao ? 'mailto:' + s.email_redacao : '')
    };
    $$('[data-link]').forEach(a => {
      const url = links[a.dataset.link];
      if (url) { a.href = url; a.hidden = false; if (/^https?:/.test(url)) { a.target = '_blank'; a.rel = 'noopener'; } }
      else if (a.classList.contains('icon-btn')) a.hidden = true;
    });
    // Páginas institucionais: links só aparecem se a página existir
    $$('[data-pagina]').forEach(a => {
      const existe = !!b['pagina:' + a.dataset.pagina];
      const temLink = a.dataset.link && links[a.dataset.link];
      const li = a.closest('li');
      (li || a).hidden = !existe && !temLink;
    });
    // colunas do rodapé sem nenhum link visível somem
    $$('.footer__grid ul').forEach(ul => { ul.parentElement.hidden = ![...ul.children].some(li => !li.hidden); });
    const aviso = $('[data-site-aviso]');
    if (aviso) aviso.textContent = s.aviso_rodape || '';
    const sobre = $('[data-site-sobre]');
    if (sobre && s.sobre) sobre.textContent = s.sobre;
  });

  /* ---------- Busca ---------- */
  const fb = $('[data-search-form]');
  if (fb) fb.addEventListener('submit', e => {
    e.preventDefault();
    const q = $('input', fb).value.trim();
    if (q) location.href = 'lista.html?q=' + encodeURIComponent(q);
  });

  /* ---------- Boletim por e-mail ---------- */
  const form = $('[data-subscribe]');
  if (form) form.addEventListener('submit', async e => {
    e.preventDefault();
    const okEl = $('[data-subscribe-ok]'), btn = $('button', form);
    btn.disabled = true; okEl.textContent = 'Enviando…';
    try {
      await api.inscrever($('input[type=email]', form).value);
      okEl.textContent = 'Pronto! Seu e-mail foi cadastrado.'; form.reset();
    } catch (err) { okEl.textContent = err.message; }
    finally { btn.disabled = false; }
  });
})();
