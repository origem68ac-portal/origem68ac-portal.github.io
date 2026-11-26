/* Origem 68 — painel: aba "Visão geral" (relatório do portal + PDF) */
(function () {
  const { api, util } = window.O68;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = util.esc;
  const fmt = n => Number(n || 0).toLocaleString('pt-BR');
  const diaAcre = d => new Date(d).toLocaleDateString('sv', { timeZone: 'America/Rio_Branco' }); // AAAA-MM-DD
  const diaBR = s => s.slice(8, 10) + '/' + s.slice(5, 7);
  let dias = 7, carregando = false;

  const barras = (lista, max) => lista.length ? `<div class="barras">${lista.map(([nome, v]) => `
    <div class="barra"><span class="barra__nome" title="${esc(nome)}">${esc(nome)}</span><span class="barra__trilho"><i style="width:${max ? Math.max(2, v / max * 100) : 0}%"></i></span><b>${fmt(v)}</b></div>`).join('')}</div>` : '<p class="empty" style="padding:8px 0">Sem dados no período.</p>';
  const contar = (arr, chave) => { const m = new Map(); arr.forEach(x => { const k = typeof chave === 'function' ? chave(x) : x[chave]; if (k) m.set(k, (m.get(k) || 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1]); };
  const card = (titulo, html, classe = '') => `<div class="p-card ${classe}"><h2>${titulo}</h2>${html}</div>`;
  const kpi = (rotulo, valor, extra = '') => `<div class="kpi"><small>${esc(rotulo)}</small><b>${valor}</b>${extra ? `<span>${extra}</span>` : ''}</div>`;

  // gráfico de colunas por dia (visitas e leituras)
  function grafico(diasLista, serieA, serieB) {
    const W = 760, H = 190, base = 165, n = diasLista.length;
    const max = Math.max(1, ...serieA, ...serieB);
    const larg = W / n, w = Math.max(2, larg * 0.36);
    const rotulos = n <= 10 ? 1 : n <= 31 ? 5 : 15;
    const cols = diasLista.map((d, i) => {
      const x = i * larg + larg / 2, ha = serieA[i] / max * (base - 12), hb = serieB[i] / max * (base - 12);
      return `<rect x="${x - w - 1}" y="${base - ha}" width="${w}" height="${ha}" rx="2" fill="#FF5D0A"><title>${diaBR(d)}: ${serieA[i]} visitas</title></rect>
        <rect x="${x + 1}" y="${base - hb}" width="${w}" height="${hb}" rx="2" fill="#FBB931"><title>${diaBR(d)}: ${serieB[i]} leituras</title></rect>
        ${i % rotulos === 0 || i === n - 1 ? `<text x="${x}" y="${base + 16}" text-anchor="middle">${diaBR(d)}</text>` : ''}`;
    }).join('');
    return `<svg class="grafico" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Visitas e leituras por dia">
      <line x1="0" x2="${W}" y1="${base}" y2="${base}" stroke="currentColor" stroke-opacity=".15"/>${cols}
      <text x="4" y="10">${fmt(max)}</text></svg>
      <div class="legenda"><span><i style="background:#FF5D0A"></i>Visitas (páginas abertas)</span><span><i style="background:#FBB931"></i>Leituras de matérias</span></div>`;
  }

  async function carregar() {
    if (carregando) return; carregando = true;
    const box = $('[data-dash]'); box.innerHTML = '<p class="empty">Carregando…</p>';
    const hojeStr = diaAcre(Date.now());
    const inicio = new Date(Date.now() - (dias - 1) * 864e5);
    const inicioStr = diaAcre(inicio);
    const desdeISO = new Date(inicioStr + 'T00:00:00-05:00').toISOString();
    const txt = dias === 1 ? `Hoje, ${diaBR(hojeStr)}` : `De ${diaBR(inicioStr)} a ${diaBR(hojeStr)} (${dias} dias)`;
    $('[data-dash-periodo-txt]').textContent = txt;
    $('[data-dash-cab]').textContent = `${txt} · gerado em ${util.dataHora(new Date())}`;
    let d;
    try { d = await api.estatisticas(desdeISO); }
    catch (e) { box.innerHTML = `<p class="empty">${esc(e.message)}</p>`; carregando = false; return; }

    const noPeriodo = x => x && x >= desdeISO;
    const pubs = d.noticias.filter(n => n.status === 'publicado' && noPeriodo(n.publicado_em));
    const rascunhos = d.noticias.filter(n => n.status === 'rascunho');
    const porId = new Map(d.noticias.map(n => [n.id, n]));

    // séries por dia
    const diasLista = []; for (let i = 0; i < dias; i++) diasLista.push(diaAcre(inicio.getTime() + i * 864e5));
    const visDia = new Map(), leitDia = new Map(), unicosDia = new Map(), porPagina = new Map();
    d.visitas.forEach(v => {
      if (v.pagina === 'visitante') unicosDia.set(v.dia, (unicosDia.get(v.dia) || 0) + v.n);
      else { visDia.set(v.dia, (visDia.get(v.dia) || 0) + v.n); porPagina.set(v.pagina, (porPagina.get(v.pagina) || 0) + v.n); }
    });
    const leitPorNoticia = new Map();
    d.leituras.forEach(l => { leitDia.set(l.dia, (leitDia.get(l.dia) || 0) + l.n); leitPorNoticia.set(l.noticia_id, (leitPorNoticia.get(l.noticia_id) || 0) + l.n); });
    const soma = m => [...m.values()].reduce((a, b) => a + b, 0);
    const totVis = soma(visDia), totUni = soma(unicosDia), totLeit = soma(leitDia);

    const insNovos = d.inscritos.filter(i => noPeriodo(i.criado_em)).length;
    const cliques = d.ofertas.reduce((a, o) => a + (o.cliques || 0), 0);
    const robo = contar(d.robo, 'decisao');
    const roboTot = Object.fromEntries(robo);

    // rankings
    const topLidas = [...leitPorNoticia.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, n]) => [porId.get(id), n]).filter(x => x[0]);
    const topGeral = d.noticias.filter(n => n.status === 'publicado').sort((a, b) => b.leituras - a.leituras).slice(0, 10);
    const eds = contar(pubs, 'editoria').slice(0, 12);
    const muns = contar(pubs, 'municipio').slice(0, 10);
    const origem = contar(pubs, n => n.origem === 'robo' ? 'Robô' : 'Redação');
    const semFoto = pubs.filter(n => !n.foto_url).length;
    const fontes = contar(d.robo.filter(r => r.decisao === 'publicado' || r.decisao === 'rascunho'), 'fonte').slice(0, 10);
    const NOMES_PG = { capa: 'Capa', materia: 'Matérias', lista: 'Listas e busca', ofertas: 'Ofertas', pagina: 'Páginas institucionais' };
    const pags = [...porPagina.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => [NOMES_PG[k] || k, v]);

    box.innerHTML = `
      <div class="kpis">
        ${kpi('Visitas (páginas abertas)', fmt(totVis), dias > 1 ? `média de ${fmt(Math.round(totVis / dias))} por dia` : '')}
        ${kpi('Visitantes únicos', fmt(totUni), 'por dia, somados')}
        ${kpi('Leituras de matérias', fmt(totLeit), totVis ? `${Math.round(totLeit / Math.max(1, totVis) * 100)}% das visitas` : '')}
        ${kpi('Matérias publicadas', fmt(pubs.length), `${fmt(rascunhos.length)} rascunho(s) aguardando`)}
        ${kpi('Publicadas pelo robô', fmt((origem.find(o => o[0] === 'Robô') || [0, 0])[1]), `${fmt((origem.find(o => o[0] === 'Redação') || [0, 0])[1])} pela redação`)}
        ${kpi('Notícias avaliadas pelo robô', fmt(d.robo.length), `${fmt(roboTot.descartado || 0)} descartadas · ${fmt(roboTot.erro || 0)} erros`)}
        ${kpi('Inscritos no boletim', fmt(d.inscritos.length), `+${fmt(insNovos)} no período`)}
        ${kpi('Cliques em ofertas', fmt(cliques), `${fmt(d.ofertas.filter(o => o.ativo).length)} oferta(s) no ar`)}
      </div>
      <div class="dash__grid">
        ${card('Visitas e leituras por dia', grafico(diasLista, diasLista.map(x => visDia.get(x) || 0), diasLista.map(x => leitDia.get(x) || 0)), 'dash__full')}
        ${card('Matérias mais lidas no período', topLidas.length ? `<div class="p-tabela"><table><thead><tr><th>#</th><th>Matéria</th><th>Editoria</th><th>Leituras</th></tr></thead><tbody>${topLidas.map(([n, v], i) => `<tr><td>${i + 1}</td><td>${esc(n.titulo)}</td><td>${esc(n.editoria)}</td><td><b>${fmt(v)}</b></td></tr>`).join('')}</tbody></table></div>` : '<p class="empty" style="padding:8px 0">Sem leituras registradas no período.</p>')}
        ${card('Mais lidas de todos os tempos', `<div class="p-tabela"><table><thead><tr><th>#</th><th>Matéria</th><th>Leituras</th></tr></thead><tbody>${topGeral.map((n, i) => `<tr><td>${i + 1}</td><td>${esc(n.titulo)}</td><td><b>${fmt(n.leituras)}</b></td></tr>`).join('')}</tbody></table></div>`)}
        ${card('Publicações por editoria', barras(eds, eds[0] ? eds[0][1] : 0))}
        ${card('Publicações por município', barras(muns, muns[0] ? muns[0][1] : 0))}
        ${card('Visitas por tipo de página', barras(pags, pags[0] ? pags[0][1] : 0))}
        ${card('Robô: decisões no período', barras(robo.map(([k, v]) => [{ publicado: 'Publicadas direto', rascunho: 'Viraram rascunho', descartado: 'Descartadas', erro: 'Erros' }[k] || k, v]), robo[0] ? robo[0][1] : 0))}
        ${card('Robô: matérias por fonte', barras(fontes, fontes[0] ? fontes[0][1] : 0))}
        ${card('Ofertas mais clicadas', barras(d.ofertas.filter(o => o.cliques).slice(0, 10).map(o => [o.titulo + (o.loja ? ` (${o.loja})` : ''), o.cliques]), d.ofertas[0] ? d.ofertas[0].cliques : 0))}
        ${card('Qualidade das publicações', barras([['Com foto', pubs.length - semFoto], ['Sem foto', semFoto], ['Com ilustração por IA', pubs.filter(n => /IA/.test(n.foto_credito || '')).length]].filter(x => x[1] >= 0), pubs.length))}
      </div>
      <p class="nota-dash">As visitas e leituras por dia passaram a ser contadas a partir de 26/11/2026; antes disso só existe o total de leituras de cada matéria. “Visitantes únicos” conta cada navegador uma vez por dia.</p>`;
    carregando = false;
  }

  $('[data-dash-periodo]').addEventListener('click', e => {
    const b = e.target.closest('[data-dias]'); if (!b) return;
    dias = +b.dataset.dias; $$('[data-dias]').forEach(x => x.classList.toggle('is-on', x === b)); carregar();
  });
  $('[data-dash-pdf]').addEventListener('click', () => {
    // o navegador abre a janela de impressão: escolha "Salvar como PDF"
    const t = document.title; document.title = `Relatório Origem 68 — ${diaAcre(Date.now())}`;
    window.print(); setTimeout(() => { document.title = t; }, 1000);
  });

  // abre ao clicar na aba; e é a primeira tela depois do login (a não ser que tenha vindo um link para editar uma notícia)
  $('[data-abas]').addEventListener('click', e => { const b = e.target.closest('[data-aba]'); if (b && b.dataset.aba === 'geral') carregar(); });
  const app = $('[data-view="app"]');
  const abrirInicio = () => { if (!app.hidden && !new URLSearchParams(location.search).get('abrir')) { $('[data-aba="geral"]').click(); return true; } return false; };
  if (!abrirInicio()) { const ob = new MutationObserver(() => { if (abrirInicio()) ob.disconnect(); }); ob.observe(app, { attributes: true, attributeFilter: ['hidden'] }); }
})();
