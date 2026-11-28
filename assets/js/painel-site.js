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
  $$('[data-opcoes="editorias"]').forEach(s => { s.innerHTML = (s.hasAttribute('data-vazio') ? '<option value="">Automático</option>' : '') + util.EDITORIAS.map(e => `<option>${util.esc(e)}</option>`).join(''); });

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
    // o robô guarda dados que não estão no formulário (ex.: o Telegram conectado): mantém o que já existe
    if (form.dataset.bloco === 'robo') {
      try { if (!blocos) blocos = await api.blocos(); } catch (_) {}
      Object.assign(dados, { ...((blocos && blocos.robo) || {}), ...dados });
    }
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
    if (!fontesCarregadas) carregarFontes();
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
  const AVISO_COTA = 'A cota grátis de IA de hoje acabou (os “neurônios”). Ela renova todos os dias às 19h, horário do Acre; o robô volta sozinho na rodada seguinte.';

  /* ---------- fontes do robô (bloco "robo_fontes") ---------- */
  let fontesCarregadas = false;
  const TIPOS = [['oficial', 'Oficial'], ['portal', 'Portal'], ['nacional', 'Nacional'], ['geral', 'Pauta geral']];
  const DESC_TIPO = { oficial: 'Governo e prefeituras', portal: 'Sites de notícia do Acre', nacional: 'Brasil: economia, política, esporte', geral: 'Tecnologia, ciência, curiosidades' };
  const opt = (lista, v) => lista.map(([val, txt]) => `<option value="${val}"${val === v ? ' selected' : ''}>${txt}</option>`).join('');
  const hostDe = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (_) { return u || 'sem endereço'; } };
  // cartão de uma fonte: resumo visível + detalhes para editar
  function linhaFonte(f = {}, aberto = false) {
    const el = document.createElement('div');
    const tipo = f.tipo || 'portal';
    const pub = f.publicar || (tipo === 'oficial' ? 'sim' : 'nao');
    el.className = 'fonte' + (f.ativo === 'nao' ? ' is-off' : '');
    el.draggable = true;
    el.innerHTML = `
      <div class="fonte__top">
        <label class="fonte__on" title="Ligar/desligar"><input type="checkbox" data-k="ativo" ${f.ativo === 'nao' ? '' : 'checked'}></label>
        <span class="fonte__nome" data-ver-nome>${util.esc(f.nome || 'Nova fonte')}</span>
      </div>
      <div class="fonte__host" data-ver-host>${util.esc(hostDe(f.url))}</div>
      <div class="fonte__badges" data-ver-badges></div>
      <details ${aberto ? 'open' : ''}><summary>✎ Editar</summary>
        <div class="fonte__edit">
          <input class="in" data-k="nome" placeholder="Nome (aparece no crédito)" value="${util.esc(f.nome || '')}">
          <input class="in" data-k="url" placeholder="https://site.com.br ou endereço do feed" value="${util.esc(f.url || '')}">
          <div class="fonte__row">
            <select class="in" data-k="tipo" title="Tipo">${opt(TIPOS, tipo)}</select>
            <select class="in" data-k="publicar" title="O que fazer com as matérias">${opt([['sim', 'Publicar direto'], ['nao', 'Virar rascunho']], pub)}</select>
            <select class="in" data-k="fotos" title="Fotos">${opt([['sim', 'Usar a foto'], ['nao', 'Sem foto (IA)']], f.fotos === 'nao' ? 'nao' : 'sim')}</select>
          </div>
          <input class="in" data-k="exigir" placeholder="Só se citar: acre, rio branco…" value="${util.esc(f.exigir || '')}">
          <input class="in" data-k="ignorar" placeholder="Ignorar títulos com: ao vivo, vídeo…" value="${util.esc(f.ignorar || '')}">
          <div class="fonte__row">
            <button type="button" class="btn btn--ghost btn--sm" data-fonte-testar>Testar</button>
            <button type="button" class="btn btn--danger btn--sm" data-fonte-tirar>Remover</button>
          </div>
        </div>
      </details>
      <div class="fonte__res" data-fonte-res></div>`;
    resumoFonte(el);
    return el;
  }
  function resumoFonte(el) {
    const f = lerFonte(el);
    $('[data-ver-nome]', el).textContent = f.nome || hostDe(f.url) || 'Nova fonte';
    $('[data-ver-host]', el).textContent = hostDe(f.url);
    $('[data-ver-badges]', el).innerHTML = [
      f.publicar === 'sim' ? '<span class="b-pub">Publica direto</span>' : '<span class="b-ras">Rascunho</span>',
      f.fotos === 'nao' ? '<span>Imagem IA</span>' : '<span>Foto real</span>',
      f.exigir ? '<span class="b-filtro">Só se citar</span>' : '', f.ignorar ? '<span class="b-filtro">Ignora termos</span>' : ''
    ].join('');
    el.classList.toggle('is-off', f.ativo === 'nao');
  }
  const listaFontes = () => $('[data-fontes-lista]');
  const fontesMsg = (t, tipo) => { const m = $('[data-fontes-msg]'); m.textContent = t; m.className = 'msg' + (tipo ? ' is-' + tipo : ''); };
  const colunaDe = tipo => $(`.kanban__col[data-tipo="${tipo}"] [data-cards]`, listaFontes());
  function contar() { $$('.kanban__col', listaFontes()).forEach(c => { $('.kanban__n', c).textContent = $$('.fonte', c).length; }); }
  function desenharFontes(lista) {
    const box = listaFontes();
    box.innerHTML = TIPOS.map(([t, nome]) => `<div class="kanban__col" data-tipo="${t}">
      <div class="kanban__head"><b>${nome}<small>${DESC_TIPO[t]}</small></b><span class="kanban__n">0</span></div>
      <div data-cards style="display:grid;gap:8px"></div>
      <button type="button" class="kanban__add" data-fonte-add="${t}">+ Adicionar</button></div>`).join('');
    lista.forEach(f => (colunaDe(TIPOS.some(([t]) => t === f.tipo) ? f.tipo : 'portal')).appendChild(linhaFonte(f)));
    contar();
  }
  // arrastar cartões entre colunas muda o tipo
  let arrastando = null;
  listaFontes().addEventListener('dragstart', e => { const c = e.target.closest && e.target.closest('.fonte'); if (!c || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return; arrastando = c; c.classList.add('is-arrastando'); e.dataTransfer.effectAllowed = 'move'; });
  listaFontes().addEventListener('dragend', () => { if (arrastando) arrastando.classList.remove('is-arrastando'); arrastando = null; $$('.kanban__col', listaFontes()).forEach(c => c.classList.remove('is-alvo')); });
  listaFontes().addEventListener('dragover', e => { const col = e.target.closest('.kanban__col'); if (!col || !arrastando) return; e.preventDefault(); $$('.kanban__col', listaFontes()).forEach(c => c.classList.toggle('is-alvo', c === col)); });
  listaFontes().addEventListener('drop', e => {
    const col = e.target.closest('.kanban__col'); if (!col || !arrastando) return; e.preventDefault();
    const antes = e.target.closest('.fonte');
    const cards = $('[data-cards]', col);
    if (antes && antes !== arrastando && antes.parentElement === cards) cards.insertBefore(arrastando, antes); else cards.appendChild(arrastando);
    const sel = $('[data-k="tipo"]', arrastando);
    if (sel.value !== col.dataset.tipo) { sel.value = col.dataset.tipo; fontesMsg('Tipo alterado. Clique em “Salvar fontes” para valer.'); }
    contar();
  });
  async function fontesPadrao() {
    const base = ((window.O68_CONFIG || {}).roboUrl || '').replace(/\/$/, '');
    const d = await (await fetch(base + '/fontes-padrao')).json();
    return d.fontes || [];
  }
  async function carregarFontes() {
    fontesCarregadas = true;
    try {
      if (!blocos) blocos = await api.blocos();
      const salvas = blocos.robo_fontes && blocos.robo_fontes.lista;
      desenharFontes(salvas && salvas.length ? salvas : await fontesPadrao());
      if (!(salvas && salvas.length)) fontesMsg('Estas são as fontes padrão. Edite e clique em “Salvar fontes”.');
    } catch (e) { fontesCarregadas = false; listaFontes().innerHTML = `<p class="empty">${util.esc(e.message)}</p>`; }
  }
  const lerFonte = el => Object.fromEntries($$('[data-k]', el).map(i => [i.dataset.k, i.type === 'checkbox' ? (i.checked ? 'sim' : 'nao') : i.value.trim()]));
  $('[data-fontes-padrao]').addEventListener('click', async () => {
    if (!confirm('Trocar a lista atual pelas fontes padrão? (Só vale depois de clicar em “Salvar fontes”.)')) return;
    try { desenharFontes(await fontesPadrao()); fontesMsg('Fontes padrão carregadas. Clique em “Salvar fontes” para valer.'); } catch (e) { fontesMsg(e.message, 'err'); }
  });
  listaFontes().addEventListener('change', e => {
    const el = e.target.closest('.fonte'); if (!el) return;
    if (e.target.dataset.k === 'tipo') { colunaDe(e.target.value).appendChild(el); contar(); }
    resumoFonte(el);
  });
  listaFontes().addEventListener('input', e => { const el = e.target.closest('.fonte'); if (el && /nome|url/.test(e.target.dataset.k || '')) resumoFonte(el); });
  listaFontes().addEventListener('click', async e => {
    const add = e.target.closest('[data-fonte-add]');
    if (add) {
      if ($$('.fonte', listaFontes()).length >= 14) return fontesMsg('O limite é de 14 fontes (plano grátis). Desative ou remova uma.', 'err');
      const el = linhaFonte({ tipo: add.dataset.fonteAdd }, true); colunaDe(add.dataset.fonteAdd).appendChild(el); contar(); $('[data-k="url"]', el).focus();
      return;
    }
    const el = e.target.closest('.fonte'); if (!el) return;
    if (e.target.closest('[data-fonte-tirar]')) { el.remove(); contar(); fontesMsg('Fonte removida. Clique em “Salvar fontes” para valer.'); return; }
    const bt = e.target.closest('[data-fonte-testar]'); if (!bt) return;
    const f = lerFonte(el), res = $('[data-fonte-res]', el);
    if (!/^https?:\/\//.test(f.url)) { res.className = 'fonte__res is-err'; res.textContent = 'Cole o endereço completo, começando com https://'; return; }
    bt.disabled = true; res.className = 'fonte__res'; res.textContent = 'Testando…';
    try {
      const d = await comandoRobo('/fonte-teste', f);
      $('[data-k="url"]', el).value = d.feed;
      if (!f.nome && d.nome) $('[data-k="nome"]', el).value = d.nome;
      resumoFonte(el);
      res.className = 'fonte__res is-ok';
      res.innerHTML = `✓ Feed encontrado: ${d.total} notícias recentes, ${d.comFoto} com foto${d.passam !== d.total ? ` · ${d.passam} passam pelos filtros “só se citar/ignorar”` : ''}.`
        + (d.exemplos.length ? `<ul>${d.exemplos.map(x => `<li>${util.esc(x.titulo)}</li>`).join('')}</ul>` : '') + ' Lembre de clicar em “Salvar fontes”.';
    } catch (err) { res.className = 'fonte__res is-err'; res.textContent = err.message; }
    finally { bt.disabled = false; }
  });
  $('[data-fontes-salvar]').addEventListener('click', async () => {
    const lista = $$('.fonte', listaFontes()).map(lerFonte).filter(f => f.url);
    const ruim = lista.find(f => !/^https?:\/\//.test(f.url));
    if (ruim) return fontesMsg(`Endereço inválido: ${ruim.url}`, 'err');
    if (!lista.some(f => f.ativo !== 'nao')) return fontesMsg('Deixe pelo menos uma fonte ativa.', 'err');
    if (lista.length > 14) return fontesMsg('O limite é de 14 fontes.', 'err');
    lista.forEach(f => { if (!f.nome) try { f.nome = new URL(f.url).hostname.replace(/^www\./, ''); } catch (_) {} });
    fontesMsg('Salvando…');
    try { await api.salvarBloco('robo_fontes', { lista }); blocos.robo_fontes = { lista }; desenharFontes(lista); fontesMsg('Fontes salvas! Valem a partir da próxima rodada.', 'ok'); }
    catch (err) { fontesMsg(err.message, 'err'); }
  });

  // troca imagens de IA pela foto real da notícia original
  $('[data-robo-fotos]').addEventListener('click', async e => {
    e.target.disabled = true;
    let pular = 0, total = 0, sem = 0;
    try {
      for (let volta = 0; volta < 12; volta++) {
        roboMsg(`Procurando as fotos reais nas notícias originais… ${total} trocada(s) até agora.`);
        const d = await comandoRobo('/trocar-fotos', { pular });
        total += d.trocadas.length; sem += d.sem.length; pular = d.proxima;
        if (!d.restantes) break;
      }
      roboMsg(total ? `Pronto: ${total} imagem(ns) de IA trocada(s) pela foto real.${sem ? ` ${sem} notícia(s) não tinham foto utilizável na fonte e continuam com a ilustração.` : ''}`
        : sem ? `Nenhuma troca: as ${sem} notícia(s) com imagem de IA não têm foto utilizável na fonte.` : 'Não há notícias do robô com imagem de IA.', 'ok');
    } catch (err) { roboMsg(err.message, 'err'); }
    finally { e.target.disabled = false; }
  });

  $('[data-robo-rodar]').addEventListener('click', async e => {
    e.target.disabled = true; roboMsg('Rodando… isso leva de 30 segundos a 2 minutos.');
    try {
      const d = await comandoRobo('/rodar');
      roboMsg(d.pausado ? 'O robô está pausado.' : d.cota ? AVISO_COTA : d.novas === 0 ? 'Nada novo nas fontes agora.'
        : `Avaliou ${d.avaliadas}, descartou ${d.descartadas} e escreveu ${(d.feitas || []).length}.`, d.cota ? 'err' : 'ok');
      carregarRobo();
    } catch (err) { roboMsg(err.message, 'err'); }
    finally { e.target.disabled = false; }
  });
  $('[data-robo-canal]').addEventListener('click', async () => {
    roboMsg('Procurando o canal/grupo…');
    try { const d = await comandoRobo('/telegram-canal'); roboMsg(`Canal conectado${d.nome ? ' (' + d.nome + ')' : ''}! As próximas notícias publicadas vão aparecer lá.`, 'ok'); }
    catch (err) { roboMsg(err.message, 'err'); }
  });
  $('[data-robo-pulso]').addEventListener('click', async e => {
    e.target.disabled = true; roboMsg('Pesquisando rio, dólar, gasolina e boi… (até 30 segundos)');
    try {
      const d = await comandoRobo('/pulso'); const p = d.pulso || {};
      roboMsg(`Pulso atualizado (${(d.atualizados || []).join(', ') || 'nada novo'}): rio ${p.rio_nivel || '—'} · dólar ${p.dolar_valor || '—'} · gasolina ${p.extra_valor || '—'} · boi ${p.boi_valor || '—'}.`, 'ok');
      blocos = null;
    } catch (err) { roboMsg(err.message, 'err'); }
    finally { e.target.disabled = false; }
  });
  window.O68.divulgarTelegram = id => comandoRobo('/divulgar', { id }).catch(() => null);
  $('[data-robo-telegram]').addEventListener('click', async () => {
    roboMsg('Conectando…');
    try { const d = await comandoRobo('/telegram'); roboMsg(`Telegram conectado${d.nome ? ' (' + d.nome + ')' : ''}. Veja a mensagem de teste.`, 'ok'); }
    catch (err) { roboMsg(err.message, 'err'); }
  });

  // aproveitar notícia barrada: o robô escreve a matéria e ela abre como rascunho no editor
  $('[data-robo-lista]').addEventListener('click', async e => {
    const b = e.target.closest('[data-forcar]'); if (!b) return;
    $$('[data-forcar]').forEach(x => { x.disabled = true; }); b.textContent = 'Escrevendo…';
    const t0 = Date.now();
    const relogio = setInterval(() => { b.textContent = `Escrevendo… ${Math.round((Date.now() - t0) / 1000)}s`; }, 1000);
    roboMsg('O robô está lendo a fonte, escrevendo a matéria e preparando a imagem. Costuma levar de 10 a 40 segundos.');
    window.scrollTo(0, 0);
    try {
      const d = await comandoRobo('/forcar', { url: b.dataset.forcar });
      clearInterval(relogio); roboMsg('Pronto! Abrindo o rascunho…', 'ok');
      location.href = 'painel.html?abrir=' + encodeURIComponent(d.id);
    } catch (err) {
      clearInterval(relogio); roboMsg(err.message, 'err');
      $$('[data-forcar]').forEach(x => { x.disabled = false; }); b.textContent = 'Aproveitar';
    }
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
