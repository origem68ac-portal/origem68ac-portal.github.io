/* Origem 68 — gerador de posts para o Instagram (aba "Instagram" do painel)
   Formatos: Feed 1080×1440 · Stories 1080×1920 · Reels 1080×1920 (vídeo) · temas escuro e claro */
(function () {
  const { api, util } = window.O68;
  const $ = (s, el = document) => el.querySelector(s);
  const raiz = $('[data-aba-view="insta"]');
  if (!raiz) return;

  const W = 1080;
  const FORMATOS = {
    feed:    { h: 1440, nome: 'Feed' },
    stories: { h: 1920, nome: 'Stories' },
    reels:   { h: 1920, nome: 'Reels' },
  };
  const TEMAS = {
    escuro: { bg: '#0D0806', txt: '#FFF6EA', sub: 'rgba(255,246,234,.80)', dim: 'rgba(255,246,234,.58)' },
    claro:  { bg: '#FAF5EE', txt: '#17100C', sub: '#4A3B31', dim: '#8A776A' },
  };
  const DUR = 8; // segundos do vídeo do Reels

  const est = { noticias: [], n: null, img: null, fmt: 'feed', tema: 'escuro', fx: 0.5, fy: 0.5, zoom: 1 };
  const prev = $('[data-ig-canvas]');
  const msg = (t, tipo) => { const m = $('[data-ig-msg]'); m.textContent = t || ''; m.className = 'msg' + (tipo ? ' is-' + tipo : ''); };

  /* ---------- fontes e imagens ---------- */
  let fontesProntas = null;
  const fontes = () => fontesProntas || (fontesProntas = Promise.all([
    document.fonts.load('800 80px Outfit'), document.fonts.load('700 30px Onest'),
    document.fonts.load('500 30px Onest'), document.fonts.load('600 30px Onest'),
  ]).catch(() => {}));

  function carregarImg(url, viaProxy) {
    return new Promise((ok, erro) => {
      if (!url) return ok(null);
      const im = new Image();
      const local = /^(data|blob):/.test(url);
      const doSupabase = /\.supabase\.co\//.test(url);
      if (!local) im.crossOrigin = 'anonymous';
      im.onload = () => ok(im);
      im.onerror = () => (!local && !viaProxy) ? carregarImg(proxy(url), true).then(ok, erro) : erro(new Error('Não consegui carregar a foto.'));
      im.src = local || (doSupabase && !viaProxy) || viaProxy ? url : proxy(url);
    });
  }
  const proxy = url => /wsrv\.nl/.test(url) ? url : `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=1800&output=jpg&q=88`;

  /* ---------- desenho ---------- */
  function linhas(ctx, texto, max) {
    const out = []; let l = '';
    for (const p of String(texto || '').trim().split(/\s+/).filter(Boolean)) {
      const t = l ? l + ' ' + p : p;
      if (ctx.measureText(t).width > max && l) { out.push(l); l = p; } else l = t;
    }
    if (l) out.push(l);
    return out;
  }
  function cortar(ctx, ls, n, max) {
    if (ls.length <= n) return ls;
    const r = ls.slice(0, n); let u = r[n - 1] + '…';
    while (ctx.measureText(u).width > max && u.length > 2) u = u.replace(/\s*\S*…$/, '…');
    r[n - 1] = u; return r;
  }
  const fTit = s => `800 ${s}px Outfit, Onest, Arial, sans-serif`;
  const fTxt = (p, s) => `${p} ${s}px Onest, Arial, sans-serif`;
  const esp = (ctx, px) => { if ('letterSpacing' in ctx) ctx.letterSpacing = px + 'px'; };

  function logo(ctx, x, y, s, cor) {
    const base = y + s * 0.8;
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.font = fTit(s); esp(ctx, -s * 0.033); ctx.fillStyle = cor;
    ctx.fillText('ORIGEM', x, base);
    const w1 = ctx.measureText('ORIGEM').width;
    const s2 = s * 1.13; ctx.font = fTit(s2); esp(ctx, -s2 * 0.058);
    const x2 = x + w1 + s * 0.03, w2 = ctx.measureText('68').width;
    const g = ctx.createLinearGradient(x2, base - s2, x2 + w2, base);
    g.addColorStop(0, '#FF5D0A'); g.addColorStop(1, '#F88F22');
    ctx.fillStyle = g; ctx.fillText('68', x2, base);
    // traço do logo (o mesmo do logo.svg, convertido)
    const kx = w2 / 160, ky = s / 92;
    const P = (px, py) => [x2 + (px - 352) * kx, base + (py - 86) * ky];
    const gs = ctx.createLinearGradient(x2, 0, x2 + w2, 0);
    gs.addColorStop(0, '#FBB931'); gs.addColorStop(1, '#FFE3B3');
    ctx.beginPath(); ctx.moveTo(...P(352, 92));
    ctx.bezierCurveTo(...P(390, 104), ...P(420, 70), ...P(452, 58));
    ctx.bezierCurveTo(...P(484, 46), ...P(500, 50), ...P(512, 40));
    ctx.bezierCurveTo(...P(498, 64), ...P(470, 72), ...P(446, 82));
    ctx.bezierCurveTo(...P(422, 92), ...P(386, 112), ...P(352, 92));
    ctx.closePath(); ctx.fillStyle = gs; ctx.fill();
    esp(ctx, 0);
    return x2 + w2 - x;
  }

  function pilula(ctx, x, y, texto, s, alinhar) {
    ctx.font = fTxt(700, s); esp(ctx, s * 0.18);
    const t = String(texto || '').toUpperCase();
    const padX = s * 1.1, h = s * 2.15, w = ctx.measureText(t).width + padX * 2 - s * 0.18;
    const x0 = alinhar === 'dir' ? x - w : x;
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, '#FF5D0A'); g.addColorStop(1, '#FBB931');
    ctx.beginPath(); ctx.roundRect(x0, y, w, h, h / 2); ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = '#17100C'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(t, x0 + padX, y + h / 2 + s * 0.06);
    esp(ctx, 0); ctx.textBaseline = 'alphabetic';
    return { w, h };
  }

  function capa(ctx, img, x, y, w, h, fx, fy, zoom) {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    if (img) {
      const k = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
      const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
      ctx.drawImage(img, x + (w - dw) * fx, y + (h - dh) * fy, dw, dh);
    } else {
      ctx.fillStyle = '#1a0f09'; ctx.fillRect(x, y, w, h);
      const g = ctx.createRadialGradient(x + w * 0.68, y + h * 0.32, 10, x + w * 0.68, y + h * 0.32, Math.max(w, h) * 0.7);
      g.addColorStop(0, 'rgba(120,75,20,.85)'); g.addColorStop(1, 'rgba(13,8,6,0)');
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      const g2 = ctx.createRadialGradient(x + w * 0.15, y + h * 0.75, 10, x + w * 0.15, y + h * 0.75, w * 0.7);
      g2.addColorStop(0, 'rgba(140,50,10,.55)'); g2.addColorStop(1, 'rgba(13,8,6,0)');
      ctx.fillStyle = g2; ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  }

  // quanto do texto cabe: diminui o título até caber na altura disponível
  function ajustar(ctx, o, maxW, maxH, ini, min, maxLinhas, comTag) {
    for (let s = ini; s >= min; s -= 2) {
      ctx.font = fTit(s); esp(ctx, -s * 0.025);
      const tl = linhas(ctx, o.titulo, maxW);
      if (tl.length > maxLinhas && s > min) continue;
      const fs = Math.max(28, Math.min(40, Math.round(s * 0.44)));
      ctx.font = fTxt(500, fs); esp(ctx, 0);
      let fl = o.fina ? cortar(ctx, linhas(ctx, o.fina, maxW), 3, maxW) : [];
      const tagH = comTag ? Math.round(fs * 0.8) * 2.15 + 30 : 0;
      const alt = () => tagH + Math.min(tl.length, maxLinhas) * s * 1.06 + (fl.length ? 26 + fl.length * fs * 1.36 : 0);
      while (fl.length && alt() > maxH) fl = fl.slice(0, -1);
      if (alt() <= maxH || s <= min) {
        ctx.font = fTit(s); esp(ctx, -s * 0.025);
        return { s, tl: cortar(ctx, tl, maxLinhas, maxW), fs, fl, tagH, h: alt() };
      }
    }
  }

  const aparece = (t, ini) => t == null ? 1 : Math.max(0, Math.min(1, (t - ini) / 0.6));
  const suave = a => 1 - Math.pow(1 - a, 3);

  function desenhar(cv, o, t, guia) {
    const F = FORMATOS[o.fmt], T = TEMAS[o.tema], H = F.h;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);

    const reels = o.fmt === 'reels', stories = o.fmt === 'stories';
    const mx = 80, dirLim = reels ? W - 190 : W - 80, maxW = dirLim - mx;
    const topo = o.fmt === 'feed' ? 90 : reels ? 230 : 210;
    const baixo = o.fmt === 'feed' ? H - 90 : reels ? H - 430 : H - 250;
    const zoom = o.zoom * (t == null ? 1 : 1 + 0.09 * (t / DUR));
    const claro = o.tema === 'claro';
    const fotoH = claro ? Math.round(H * (o.fmt === 'feed' ? 0.56 : reels ? 0.47 : 0.53)) : H;

    // foto
    capa(ctx, o.img, 0, 0, W, fotoH, o.fx, o.fy, zoom);
    // sombra no topo (logo legível)
    let g = ctx.createLinearGradient(0, 0, 0, topo + 260);
    g.addColorStop(0, 'rgba(13,8,6,.72)'); g.addColorStop(1, 'rgba(13,8,6,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, topo + 260);
    if (!claro) {
      g = ctx.createLinearGradient(0, H * 0.3, 0, H);
      g.addColorStop(0, 'rgba(13,8,6,0)'); g.addColorStop(0.45, 'rgba(13,8,6,.86)'); g.addColorStop(1, 'rgba(13,8,6,.97)');
      ctx.fillStyle = g; ctx.fillRect(0, H * 0.3, W, H * 0.7);
    } else {
      ctx.fillStyle = T.bg; ctx.fillRect(0, fotoH, W, H - fotoH);
      g = ctx.createLinearGradient(0, fotoH - 120, 0, fotoH);
      g.addColorStop(0, 'rgba(13,8,6,0)'); g.addColorStop(1, 'rgba(13,8,6,.25)');
      ctx.fillStyle = g; ctx.fillRect(0, fotoH - 120, W, 120);
    }

    // logo + etiqueta no topo
    const ls = o.fmt === 'feed' ? 56 : 62;
    logo(ctx, mx, topo, ls, '#FFF6EA');
    const tagS = o.fmt === 'feed' ? 25 : 27;
    const tagNoTopo = !reels && !claro && o.tag;
    if (tagNoTopo) pilula(ctx, W - 80, topo + ls * 0.4 - tagS * 1.07, o.tag, tagS, 'dir');

    // rodapé
    ctx.globalAlpha = aparece(t, 1.5);
    let rodH;
    if (stories || reels) {
      ctx.font = fTxt(700, 30); esp(ctx, 1);
      const cta = 'Leia no portal  •  link na bio';
      const w = ctx.measureText(cta).width + 76, h = 76, y = baixo - h;
      ctx.beginPath(); ctx.roundRect(mx, y, w, h, h / 2);
      ctx.fillStyle = claro ? '#17100C' : 'rgba(255,246,234,.12)'; ctx.fill();
      if (!claro) { ctx.strokeStyle = 'rgba(255,246,234,.28)'; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.fillStyle = claro ? '#FFF6EA' : '#FFF6EA'; ctx.textBaseline = 'middle';
      ctx.fillText(cta, mx + 38, y + h / 2 + 1); ctx.textBaseline = 'alphabetic'; esp(ctx, 0);
      rodH = h + 44;
    } else {
      ctx.font = fTxt(600, 26); esp(ctx, 26 * 0.12); ctx.fillStyle = T.dim;
      ctx.fillText('ORIGEM68.PAGES.DEV', mx, baixo); esp(ctx, 0);
      rodH = 26 + 40;
    }
    ctx.globalAlpha = 1;

    // texto principal
    const fimTexto = baixo - rodH;
    const iniTexto = claro ? fotoH + (o.tag ? 70 : 64) : topo + ls + 120;
    const comTag = !!o.tag && !tagNoTopo && !claro;
    const L = ajustar(ctx, o, maxW, fimTexto - iniTexto, o.fmt === 'feed' ? 84 : reels ? 78 : 92, 50, o.fmt === 'feed' ? 4 : 5, comTag);
    let y = claro ? iniTexto : fimTexto - L.h;

    if (claro && o.tag) { // etiqueta sobre a borda da foto
      ctx.globalAlpha = aparece(t, 0.2);
      pilula(ctx, mx, fotoH - tagS * 1.07, o.tag, tagS);
      ctx.globalAlpha = 1;
    }
    if (comTag) {
      ctx.globalAlpha = aparece(t, 0.2);
      pilula(ctx, mx, y, o.tag, Math.round(L.fs * 0.8));
      ctx.globalAlpha = 1; y += L.tagH;
    }
    const a1 = suave(aparece(t, 0.45));
    ctx.save(); ctx.globalAlpha = a1; ctx.translate(0, (1 - a1) * 40);
    ctx.font = fTit(L.s); esp(ctx, -L.s * 0.025); ctx.fillStyle = T.txt; ctx.textBaseline = 'top';
    L.tl.forEach((l, i) => ctx.fillText(l, mx, y + i * L.s * 1.06));
    ctx.restore();
    y += L.tl.length * L.s * 1.06;
    if (L.fl.length) {
      const a2 = suave(aparece(t, 0.95));
      ctx.save(); ctx.globalAlpha = a2; ctx.translate(0, (1 - a2) * 24);
      y += 26; ctx.font = fTxt(500, L.fs); esp(ctx, 0); ctx.fillStyle = T.sub; ctx.textBaseline = 'top';
      L.fl.forEach((l, i) => ctx.fillText(l, mx, y + i * L.fs * 1.36));
      ctx.restore();
    }
    ctx.textBaseline = 'alphabetic'; esp(ctx, 0);

    if (guia && (stories || reels)) { // áreas que o Instagram cobre (só na prévia)
      ctx.fillStyle = 'rgba(229,72,77,.22)';
      ctx.fillRect(0, 0, W, reels ? 220 : 200); ctx.fillRect(0, H - (reels ? 420 : 240), W, reels ? 420 : 240);
      if (reels) ctx.fillRect(W - 170, 900, 170, H - 1320);
      ctx.font = fTxt(700, 26); ctx.fillStyle = '#fff';
      ctx.fillText('Área coberta pelo Instagram', 30, H - 30);
    }
  }

  /* ---------- estado → prévia ---------- */
  const opcoes = (extra = {}) => ({
    fmt: est.fmt, tema: est.tema, img: est.img, fx: est.fx, fy: est.fy, zoom: est.zoom,
    titulo: $('[name="ig-titulo"]').value.trim() || 'Título da notícia',
    fina: $('[name="ig-fina"]').value.trim(),
    tag: $('[name="ig-tag"]').value.trim(),
    ...extra,
  });
  let agendado = 0;
  function atualizar() {
    cancelAnimationFrame(agendado);
    agendado = requestAnimationFrame(async () => {
      await fontes();
      desenhar(prev, opcoes(), null, $('[name="ig-guia"]').checked);
      $('[data-ig-video]').hidden = est.fmt !== 'reels';
      $('[data-ig-baixar]').textContent = est.fmt === 'reels' ? 'Baixar capa do Reels (JPG)' : 'Baixar imagem (JPG)';
      $('[data-ig-dim]').textContent = `${W} × ${FORMATOS[est.fmt].h} px`;
    });
  }

  function legenda() {
    const n = est.n || {};
    const tit = $('[name="ig-titulo"]').value.trim(), fina = $('[name="ig-fina"]').value.trim();
    const tag = s => '#' + String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^./, c => c.toUpperCase());
    const hs = [...new Set(['#Acre', n.municipio && tag(n.municipio), n.editoria && tag(n.editoria), '#Origem68', '#NotíciasDoAcre'].filter(Boolean))];
    return [tit, fina, '', '📲 Leia a matéria completa no portal: link na bio.', '', hs.join(' ')].filter((l, i, a) => l || a[i - 1]).join('\n').trim();
  }

  async function escolherNoticia(n) {
    est.n = n || null; est.img = null; est.fx = 0.5; est.fy = 0.5; est.zoom = 1;
    ['fx', 'fy'].forEach(k => $(`[name="ig-${k}"]`).value = 50); $('[name="ig-zoom"]').value = 100;
    $('[name="ig-titulo"]').value = n ? n.titulo : '';
    $('[name="ig-fina"]').value = n ? (n.linha_fina || '') : '';
    $('[name="ig-tag"]').value = n ? (n.municipio || n.editoria || '') : '';
    $('[data-ig-legenda]').value = n ? legenda() : '';
    atualizar();
    if (n && n.foto_url) {
      msg('Carregando a foto…');
      try { est.img = await carregarImg(n.foto_url); msg(''); }
      catch (e) { msg('A foto desta notícia não pôde ser usada. Envie outra pelo botão “Usar outra foto”.', 'err'); }
      atualizar();
    }
  }

  /* ---------- exportar ---------- */
  const nomeArq = (fmt, tema, ext) => `origem68-${(est.n && est.n.slug || 'post').slice(0, 50)}-${fmt}-${tema}.${ext}`;
  const paraBlob = (cv, tipo = 'image/jpeg') => new Promise(r => cv.toBlob(r, tipo, 0.93));
  function baixar(blob, nome) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  async function imagem(fmt, tema) {
    await fontes(); const cv = document.createElement('canvas');
    desenhar(cv, opcoes({ fmt, tema }), null, false);
    return new File([await paraBlob(cv)], nomeArq(fmt, tema, 'jpg'), { type: 'image/jpeg' });
  }
  async function compartilharOuBaixar(arquivos) {
    if (navigator.canShare && matchMedia('(pointer: coarse)').matches && navigator.canShare({ files: arquivos })) {
      try { await navigator.share({ files: arquivos }); return 'Enviado.'; }
      catch (e) { if (e.name === 'AbortError') return ''; }
    }
    for (const f of arquivos) { baixar(f, f.name); await new Promise(r => setTimeout(r, 350)); }
    return arquivos.length > 1 ? `${arquivos.length} imagens baixadas.` : 'Imagem baixada.';
  }

  $('[data-ig-baixar]').addEventListener('click', async () => {
    msg('Gerando…'); msg(await compartilharOuBaixar([await imagem(est.fmt, est.tema)]), 'ok');
  });
  $('[data-ig-todos]').addEventListener('click', async () => {
    msg('Gerando as 4 imagens…');
    const arqs = [];
    for (const fmt of ['feed', 'stories']) for (const tema of ['escuro', 'claro']) arqs.push(await imagem(fmt, tema));
    msg(await compartilharOuBaixar(arqs), 'ok');
  });

  function tipoVideo() {
    if (!window.MediaRecorder) return null;
    return ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm']
      .find(t => MediaRecorder.isTypeSupported(t)) || null;
  }
  $('[data-ig-video]').addEventListener('click', async e => {
    const tipo = tipoVideo(), btn = e.currentTarget;
    if (!tipo) return msg('Este navegador não grava vídeo. Use o Chrome atualizado.', 'err');
    await fontes(); btn.disabled = true;
    const cv = document.createElement('canvas'); const o = opcoes({ fmt: 'reels' });
    desenhar(cv, o, 0, false);
    const rec = new MediaRecorder(cv.captureStream(30), { mimeType: tipo, videoBitsPerSecond: 8e6 });
    const partes = []; rec.ondataavailable = ev => ev.data.size && partes.push(ev.data);
    const fim = new Promise(r => rec.onstop = r);
    rec.start(250);
    const t0 = performance.now();
    await new Promise(r => {
      (function quadro() {
        const t = (performance.now() - t0) / 1000;
        desenhar(cv, o, Math.min(t, DUR), false);
        // a prévia acompanha a gravação
        prev.getContext('2d').drawImage(cv, 0, 0);
        msg(`Gravando o vídeo… ${Math.max(0, Math.ceil(DUR - t))}s (deixe esta aba aberta)`);
        if (t < DUR) requestAnimationFrame(quadro); else r();
      })();
    });
    rec.stop(); await fim; btn.disabled = false;
    const ext = tipo.includes('mp4') ? 'mp4' : 'webm';
    const arq = new File(partes, nomeArq('reels', est.tema, ext), { type: tipo.split(';')[0] });
    const r = await compartilharOuBaixar([arq]);
    msg(r && ext === 'webm' ? 'Vídeo baixado em WebM. Se o Instagram não aceitar, use o Chrome atualizado no computador (grava em MP4).' : (r === 'Imagem baixada.' ? 'Vídeo baixado.' : r), 'ok');
    atualizar();
  });

  $('[data-ig-copiar]').addEventListener('click', async () => {
    const t = $('[data-ig-legenda]');
    try { await navigator.clipboard.writeText(t.value); } catch (_) { t.select(); document.execCommand('copy'); }
    msg('Legenda copiada.', 'ok');
  });

  /* ---------- controles ---------- */
  raiz.addEventListener('click', e => {
    const b = e.target.closest('[data-ig-fmt],[data-ig-tema]'); if (!b) return;
    if (b.dataset.igFmt) { est.fmt = b.dataset.igFmt; raiz.querySelectorAll('[data-ig-fmt]').forEach(x => x.classList.toggle('is-on', x === b)); }
    if (b.dataset.igTema) { est.tema = b.dataset.igTema; raiz.querySelectorAll('[data-ig-tema]').forEach(x => x.classList.toggle('is-on', x === b)); }
    atualizar();
  });
  raiz.addEventListener('input', e => {
    const nm = e.target.name || '';
    if (nm === 'ig-fx') est.fx = e.target.value / 100;
    if (nm === 'ig-fy') est.fy = e.target.value / 100;
    if (nm === 'ig-zoom') est.zoom = e.target.value / 100;
    if (nm === 'ig-busca') return filtrar();
    if (/^ig-(titulo|fina)$/.test(nm)) $('[data-ig-legenda]').value = legenda();
    if (nm !== 'ig-legenda') atualizar();
  });
  $('[name="ig-guia"]').addEventListener('change', atualizar);
  $('[data-ig-sel]').addEventListener('change', e => escolherNoticia(est.noticias.find(n => String(n.id) === e.target.value)));
  $('[data-ig-foto]').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    try { est.img = await carregarImg(URL.createObjectURL(f)); msg(''); atualizar(); } catch (err) { msg(err.message, 'err'); }
  });
  $('[data-ig-semfoto]').addEventListener('click', () => { est.img = null; atualizar(); });

  function filtrar() {
    const busca = $('[name="ig-busca"]').value.trim();
    const q = busca ? util.slugify(busca).replace(/-/g, ' ') : '';
    const sel = $('[data-ig-sel]'), atual = sel.value;
    const itens = est.noticias.filter(n => !q || util.slugify(n.titulo).replace(/-/g, ' ').includes(q));
    sel.innerHTML = '<option value="">— Escolha uma notícia —</option>' + itens.map(n =>
      `<option value="${util.esc(n.id)}">${util.esc(n.titulo.length > 90 ? n.titulo.slice(0, 88) + '…' : n.titulo)}</option>`).join('');
    sel.value = atual;
  }

  window.O68.igDesenhar = (cv, extra, t, guia) => fontes().then(() => desenhar(cv, opcoes(extra), t, guia));

  let carregado = false;
  async function abrirAba() {
    atualizar();
    if (carregado) return; carregado = true;
    try { est.noticias = await api.recentes(80); } catch (e) { msg(e.message, 'err'); }
    filtrar();
    if (est.noticias[0]) { $('[data-ig-sel]').value = est.noticias[0].id; escolherNoticia(est.noticias[0]); }
  }
  $('[data-abas]').addEventListener('click', e => { const b = e.target.closest('[data-aba]'); if (b && b.dataset.aba === 'insta') abrirAba(); });
})();
