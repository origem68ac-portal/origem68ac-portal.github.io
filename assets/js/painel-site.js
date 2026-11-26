/* Origem 68 — painel: abas "Capa e site", "Robô" e "Inscritos" */
(function () {
  const { api, util } = window.O68;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  let blocos = null;

  /* ---------- troca de abas ---------- */
  const carregadas = {};
  function aba(qual) {
    $$('[data-aba]').forEach(b => b.classList.toggle('is-on', b.dataset.aba === qual));
    $$('[data-aba-view]').forEach(v => v.hidden = v.dataset.abaView !== qual);
    if (qual === 'site' && !carregadas.site) { carregadas.site = true; carregarSite(); }
    if (qual === 'robo') carregarRobo();
    if (qual === 'inscritos') carregarInscritos();
    window.scrollTo(0, 0);
  }
  $('[data-abas]').addEventListener('click', e => { const b = e.target.closest('[data-aba]'); if (b) aba(b.dataset.aba); });
  $('[data-nova]').addEventListener('click', () => aba('noticias'), true);

  /* ---------- formulários de blocos ---------- */
  // campos repetidos (vídeos, colunas): copia a linha modelo N vezes
  $$('[data-repetir]').forEach(box => {
    const modelo = box.firstElementChild, n = +box.dataset.repetir;
    for (let i = 1; i < n; i++) box.appendChild(modelo.cloneNode(true));
    [...box.children].forEach((linha, i) => $$('[name]', linha).forEach(inp => { inp.name = `${box.dataset.nome}[${i}].${inp.name}`; }));
  });
  $$('[data-opcoes="editorias"]').forEach(s => { s.innerHTML = util.EDITORIAS.map(e => `<option>${util.esc(e)}</option>`).join(''); });

  // nome "itens[0].titulo" ↔ objeto { itens: [{ titulo }] }
  const partes = nome => nome.split(/[\[\].]+/).filter(Boolean).map(p => /^\d+$/.test(p) ? +p : p);
  function lerForm(form) {
    const d = {};
    $$('[name]', form).forEach(inp => {
      const ps = partes(inp.name); let o = d;
      ps.forEach((p, i) => {
        if (i === ps.length - 1) o[p] = inp.value.trim();
        else o = o[p] = o[p] || (typeof ps[i + 1] === 'number' ? [] : {});
      });
    });
    // tira linhas vazias das listas
    Object.keys(d).forEach(k => { if (Array.isArray(d[k]) && typeof d[k][0] === 'object') d[k] = d[k].filter(x => x && Object.values(x).some(Boolean)); });
    return d;
  }
  function preencherForm(form, d) {
    $$('[name]', form).forEach(inp => {
      const v = partes(inp.name).reduce((o, p) => (o == null ? o : o[p]), d);
      if (v != null && v !== '') inp.value = v;
      else if (inp.type === 'color') inp.value = inp.defaultValue; // sem cor salva: volta à cor original
      else if (inp.tagName !== 'SELECT') inp.value = '';
    });
  }
  const aviso = (form, t, tipo) => { const m = $('.msg', form); m.textContent = t; m.className = 'msg' + (tipo ? ' is-' + tipo : ''); };

  async function carregarSite() {
    try { blocos = await api.blocos(); } catch (e) { blocos = {}; }
    $$('form[data-bloco]').forEach(f => preencherForm(f, blocos[f.dataset.bloco] || {}));
    const v = $('form[data-bloco="vitrine"]');
    if (!(blocos.vitrine && blocos.vitrine.editorias)) ['Amazônia', 'Cultura', 'Economia', 'Interior'].forEach((e, i) => { v.elements[`editorias[${i}]`].value = e; });
    previewMarca();
    abrirPagina();
  }
  $$('form[data-bloco]').forEach(form => form.addEventListener('submit', async e => {
    e.preventDefault();
    const dados = lerForm(form);
    if (form.dataset.bloco === 'midia' && dados.itens.some(x => x.url && !util.linkSeguro(x.url))) return aviso(form, 'Os links precisam começar com https://', 'err');
    aviso(form, 'Salvando…');
    try {
      await api.salvarBloco(form.dataset.bloco, dados);
      if (blocos) blocos[form.dataset.bloco] = dados;
      aviso(form, 'Salvo! Já aparece no site.', 'ok');
    } catch (err) { aviso(form, err.message, 'err'); }
  }));

  /* ---------- marca: envio de logo e ícone ---------- */
  const fm = $('form[data-bloco="marca"]');
  function previewMarca() {
    $$('[data-prev]', fm).forEach(p => {
      const url = util.linkSeguro(fm.elements[p.dataset.prev].value);
      p.innerHTML = url ? `<img src="${util.esc(url)}" alt="">` : (p.dataset.prev === 'logo_url' ? 'Sem imagem: usa o nome acima' : 'Padrão');
    });
  }
  $$('[data-subir]', fm).forEach(inp => inp.addEventListener('change', async () => {
    const f = inp.files[0]; inp.value = ''; if (!f) return;
    if (f.size > 2 * 1024 * 1024) return aviso(fm, 'O arquivo passa de 2 MB.', 'err');
    aviso(fm, 'Enviando…');
    try { fm.elements[inp.dataset.subir].value = await api.enviarArquivo(f); previewMarca(); aviso(fm, 'Imagem pronta. Clique em "Salvar marca".', 'ok'); }
    catch (err) { aviso(fm, err.message, 'err'); }
  }));
  $$('[data-tirar]', fm).forEach(b => b.addEventListener('click', () => { fm.elements[b.dataset.tirar].value = ''; previewMarca(); }));
  $('[data-cores-padrao]', fm).addEventListener('click', () => { fm.elements.cor1.value = '#ff5d0a'; fm.elements.cor2.value = '#fbb931'; });
  fm.addEventListener('submit', () => { try { localStorage.setItem('o68-marca', JSON.stringify(lerForm(fm))); } catch (_) {} });

  /* ---------- páginas institucionais ---------- */
  const pf = $('[data-pagina-form]'), sel = $('[data-pagina-sel]');
  function abrirPagina() {
    const pg = (blocos || {})['pagina:' + sel.value] || {};
    pf.elements.titulo.value = pg.titulo || sel.options[sel.selectedIndex].text.replace(/ \/.*/, '');
    pf.elements.corpo.value = pg.corpo || '';
    $('[data-pagina-ver]').href = 'pagina.html?p=' + sel.value;
    $('[data-pagina-ver]').hidden = !pg.titulo; $('[data-pagina-apagar]').hidden = !pg.titulo;
    aviso(pf, pg.titulo ? 'Publicada.' : 'Ainda não publicada.');
  }
  sel.addEventListener('change', abrirPagina);
  pf.addEventListener('submit', async e => {
    e.preventDefault();
    const dados = { titulo: pf.elements.titulo.value.trim(), corpo: pf.elements.corpo.value.trim() };
    if (!dados.corpo) return aviso(pf, 'Escreva o texto da página.', 'err');
    aviso(pf, 'Salvando…');
    try { await api.salvarBloco('pagina:' + sel.value, dados); blocos['pagina:' + sel.value] = dados; abrirPagina(); aviso(pf, 'Página salva e publicada.', 'ok'); }
    catch (err) { aviso(pf, err.message, 'err'); }
  });
  $('[data-pagina-apagar]').addEventListener('click', async () => {
    if (!confirm('Tirar esta página do ar? O texto será apagado.')) return;
    try { await api.apagarBloco('pagina:' + sel.value); delete blocos['pagina:' + sel.value]; abrirPagina(); aviso(pf, 'Página retirada do site.', 'ok'); }
    catch (err) { aviso(pf, err.message, 'err'); }
  });

  /* ---------- robô ---------- */
  const DECISAO = { publicado: ['st--pub', 'Publicada'], rascunho: ['st--ras', 'Rascunho'], descartado: ['st--desc', 'Descartada'], erro: ['st--desc', 'Erro'] };
  async function carregarRobo() {
    const f = $('form[data-bloco="robo"]');
    try { if (!blocos) blocos = await api.blocos(); preencherForm(f, blocos.robo || {}); } catch (_) {}
    const box = $('[data-robo-lista]');
    try {
      const l = await api.roboVistos(80);
      box.innerHTML = l.length ? `<table><thead><tr><th>Quando</th><th>Fonte</th><th>Notícia</th><th>Decisão</th><th>Motivo</th><th></th></tr></thead><tbody>${l.map(x => {
        const [cls, txt] = DECISAO[x.decisao] || ['st--ras', x.decisao || ''];
        const url = util.linkSeguro(x.url);
        return `<tr><td style="white-space:nowrap">${util.dataHora(x.criado_em)}</td><td>${util.esc(x.fonte)}</td><td>${url ? `<a href="${util.esc(url)}" target="_blank" rel="noopener">${util.esc(x.titulo)}</a>` : util.esc(x.titulo)}</td><td><span class="st ${cls}">${txt}</span></td><td>${util.esc(x.motivo || '')}</td><td>${(x.decisao === 'descartado' || x.decisao === 'erro') && url ? `<button type="button" class="btn btn--ghost btn--sm" data-forcar="${util.esc(url)}" style="white-space:nowrap">Aproveitar</button>` : ''}</td></tr>`;
      }).join('')}</tbody></table>` : '<p class="empty">O robô ainda não rodou.</p>';
    } catch (e) { box.innerHTML = `<p class="empty">${util.esc(e.message)}</p>`; }
  }

  // comandos para o robô (Cloudflare Worker), autenticados com a sessão do editor
  async function comandoRobo(caminho, corpo) {
    const base = (window.O68_CONFIG || {}).roboUrl;
    if (!base) throw new Error('O endereço do robô ainda não foi configurado.');
    const token = await api.token();
    const r = await fetch(base.replace(/\/$/, '') + caminho, { method: 'POST', headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.erro || 'O robô não respondeu.');
    return d;
  }
  const roboMsg = (t, tipo) => { const m = $('[data-robo-msg]'); m.textContent = t; m.className = 'msg' + (tipo ? ' is-' + tipo : ''); };
  $('[data-robo-rodar]').addEventListener('click', async e => {
    e.target.disabled = true; roboMsg('Rodando… isso leva de 30 segundos a 2 minutos.');
    try {
      const d = await comandoRobo('/rodar');
      roboMsg(d.pausado ? 'O robô está pausado.' : d.novas === 0 ? 'Nada novo nas fontes agora.'
        : `Avaliou ${d.avaliadas}, descartou ${d.descartadas} e escreveu ${(d.feitas || []).length}.`, 'ok');
      carregarRobo();
    } catch (err) { roboMsg(err.message, 'err'); }
    finally { e.target.disabled = false; }
  });
  $('[data-robo-telegram]').addEventListener('click', async () => {
    roboMsg('Conectando…');
    try { const d = await comandoRobo('/telegram'); roboMsg(`Telegram conectado${d.nome ? ' (' + d.nome + ')' : ''}. Veja a mensagem de teste.`, 'ok'); }
    catch (err) { roboMsg(err.message, 'err'); }
  });

  // aproveitar notícia barrada: o robô escreve a matéria e ela abre como rascunho no editor
  $('[data-robo-lista]').addEventListener('click', async e => {
    const b = e.target.closest('[data-forcar]'); if (!b) return;
    b.disabled = true; b.textContent = 'Escrevendo…'; roboMsg('O robô está escrevendo a matéria (leva até 1 minuto)…');
    try { const d = await comandoRobo('/forcar', { url: b.dataset.forcar }); location.href = 'painel.html?abrir=' + encodeURIComponent(d.id); }
    catch (err) { roboMsg(err.message, 'err'); b.disabled = false; b.textContent = 'Aproveitar'; window.scrollTo(0, 0); }
  });

  /* ---------- inscritos ---------- */
  let inscritos = [];
  async function carregarInscritos() {
    const box = $('[data-inscritos-lista]');
    try { inscritos = await api.inscritos(); } catch (e) { inscritos = []; box.innerHTML = `<p class="empty">${util.esc(e.message)}</p>`; return; }
    $('[data-inscritos-total]').textContent = inscritos.length === 1 ? '1 pessoa inscrita.' : `${inscritos.length} pessoas inscritas.`;
    box.innerHTML = inscritos.length ? `<table><thead><tr><th>E-mail</th><th>Desde</th></tr></thead><tbody>${inscritos.map(i => `<tr><td>${util.esc(i.email)}</td><td>${util.dataHora(i.criado_em)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Ninguém se inscreveu ainda.</p>';
  }
  $('[data-inscritos-csv]').addEventListener('click', () => {
    const csv = 'email;inscrito_em\n' + inscritos.map(i => `${i.email};${util.dataHora(i.criado_em)}`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'inscritos-origem68.csv'; a.click(); URL.revokeObjectURL(a.href);
  });
})();
