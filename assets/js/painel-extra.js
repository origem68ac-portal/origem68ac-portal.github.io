/* Origem 68 — painel: abas "Anúncios" e "Ofertas" */
(function () {
  const { api, util } = window.O68;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = util.esc;

  /* ---------- Anúncios ---------- */
  const ESPACOS = [
    ['topo', 'Topo das páginas (capa e matérias)', '970 × 90 · celular 320 × 100', true],
    ['meio-capa', 'Meio da capa', '970 × 250 · celular 300 × 250', true],
    ['lateral-ultimas', 'Capa, ao lado das Últimas', '300 × 250', false],
    ['antes-newsletter', 'Capa, antes do boletim', '970 × 90 · celular 320 × 100', true],
    ['dentro-materia', 'Dentro da matéria (após o 2º parágrafo)', '300 × 250', false],
    ['lateral-materia', 'Lateral da matéria', '300 × 600 · celular 300 × 250', true],
    ['fim-materia', 'Fim da matéria', '970 × 90 · celular 320 × 100', true]
  ];
  const fa = $('[data-anuncios-form]');
  let anuncios = {};
  const msgA = (t, tipo) => { const m = $('[data-anuncios-msg]'); m.textContent = t; m.className = 'msg grow' + (tipo ? ' is-' + tipo : ''); };

  function desenharAnuncios() {
    $('[data-anuncios-lista]').innerHTML = ESPACOS.map(([id, nome, tam, temCel]) => {
      const a = anuncios[id] || {};
      const prev = u => util.linkSeguro(u) ? `<img src="${esc(u)}" alt="">` : 'Sem imagem';
      return `<div class="p-card" data-espaco="${id}">
        <h2>${esc(nome)} <small>${esc(tam)}</small></h2>
        <div class="grid2">
          <div class="f"><label>O que mostrar</label><select class="in" data-k="modo">
            <option value="padrao">Chamada padrão “Anuncie aqui”</option><option value="imagem">Imagem de anunciante</option>
            <option value="codigo">Código de rede de anúncios</option><option value="oculto">Nada (esconder o espaço)</option></select></div>
          <div class="f"><label>Link ao clicar</label><input class="in" data-k="link" placeholder="https://site-do-anunciante…" value="${esc(a.link || '')}"></div>
        </div>
        <div class="grid2" data-so="imagem">
          <div class="f"><label>Imagem (computador)</label><div class="marca-prev" data-prev="img">${prev(a.img)}</div>
            <label class="btn btn--ghost btn--sm" style="cursor:pointer;align-self:flex-start">Enviar imagem<input type="file" accept="image/png,image/webp,image/jpeg,image/gif" data-subir="img" hidden></label>
            <input type="hidden" data-k="img" value="${esc(a.img || '')}"></div>
          ${temCel ? `<div class="f"><label>Imagem (celular, opcional)</label><div class="marca-prev" data-prev="img_m">${prev(a.img_m)}</div>
            <label class="btn btn--ghost btn--sm" style="cursor:pointer;align-self:flex-start">Enviar imagem<input type="file" accept="image/png,image/webp,image/jpeg,image/gif" data-subir="img_m" hidden></label>
            <input type="hidden" data-k="img_m" value="${esc(a.img_m || '')}"></div>` : ''}
        </div>
        <div class="f" data-so="codigo"><label>Código do anúncio</label><textarea class="in" rows="5" data-k="codigo" placeholder="Cole aqui o código fornecido pela rede de anúncios">${esc(a.codigo || '')}</textarea></div>
      </div>`;
    }).join('');
    $$('[data-espaco]', fa).forEach(c => {
      const sel = $('[data-k="modo"]', c); sel.value = (anuncios[c.dataset.espaco] || {}).modo || 'padrao';
      const mostrar = () => $$('[data-so]', c).forEach(x => { x.hidden = x.dataset.so !== sel.value; });
      sel.addEventListener('change', mostrar); mostrar();
    });
  }
  fa.addEventListener('change', async e => {
    const inp = e.target.closest('[data-subir]'); if (!inp) return;
    const f = inp.files[0]; inp.value = ''; if (!f) return;
    if (f.size > 3 * 1024 * 1024) return msgA('A imagem passa de 3 MB.', 'err');
    const card = inp.closest('[data-espaco]'); msgA('Enviando imagem…');
    try {
      const url = await api.enviarArquivo(f, 'anuncios');
      $(`[data-k="${inp.dataset.subir}"]`, card).value = url;
      $(`[data-prev="${inp.dataset.subir}"]`, card).innerHTML = `<img src="${esc(url)}" alt="">`;
      msgA('Imagem pronta. Clique em "Salvar anúncios".', 'ok');
    } catch (err) { msgA(err.message, 'err'); }
  });
  fa.addEventListener('submit', async e => {
    e.preventDefault();
    const dados = {};
    $$('[data-espaco]', fa).forEach(c => { const o = {}; $$('[data-k]', c).forEach(i => { if (i.value.trim()) o[i.dataset.k] = i.value.trim(); }); dados[c.dataset.espaco] = o; });
    msgA('Salvando…');
    try { await api.salvarBloco('anuncios', dados); anuncios = dados; msgA('Salvo! Já aparece no site.', 'ok'); }
    catch (err) { msgA(err.message, 'err'); }
  });

  /* ---------- Ofertas ---------- */
  const fo = $('[data-oferta-form]');
  let ofertas = [], atual = null;
  const msgO = (t, tipo) => { const m = $('[data-oferta-msg]'); m.textContent = t; m.className = 'msg' + (tipo ? ' is-' + tipo : ''); };
  const prevO = () => { const u = util.linkSeguro(fo.elements.imagem_url.value.trim()); $('[data-oferta-prev]').innerHTML = u ? `<img src="${esc(u)}" alt="">` : 'Sem foto'; };
  function abrirOferta(o) {
    atual = o || null; fo.reset();
    ['link', 'titulo', 'loja', 'preco', 'preco_antigo', 'ordem', 'descricao', 'imagem_url'].forEach(k => { if (o && o[k] != null) fo.elements[k].value = o[k]; });
    fo.elements.destaque.checked = !!(o && o.destaque); fo.elements.ativo.checked = !o || o.ativo;
    $('[data-oferta-titulo]').textContent = o ? 'Editar oferta' : 'Nova oferta';
    $('[data-oferta-apagar]').hidden = !o; prevO(); msgO('');
  }
  async function carregarOfertas() {
    try { ofertas = await api.todasOfertas(); } catch (e) { $('[data-ofertas-lista]').innerHTML = `<p class="empty">${esc(e.message)}</p>`; return; }
    $('[data-ofertas-lista]').innerHTML = ofertas.length ? `<table><thead><tr><th>Produto</th><th>Loja</th><th>Preço</th><th>Cliques</th><th>Situação</th><th></th></tr></thead><tbody>${ofertas.map(o => `
      <tr><td>${esc(o.titulo)}</td><td>${esc(o.loja || '')}</td><td>${esc(o.preco || '')}</td><td>${o.cliques || 0}</td>
      <td><span class="st ${o.ativo ? 'st--pub">No ar' : 'st--ras">Fora do ar'}</span>${o.destaque ? ' <span class="st st--pos">Destaque</span>' : ''}</td>
      <td><button type="button" class="btn btn--ghost btn--sm" data-editar="${esc(o.id)}">Editar</button></td></tr>`).join('')}</tbody></table>` : '<p class="empty">Nenhuma oferta ainda. Cadastre a primeira acima.</p>';
  }
  $('[data-ofertas-lista]').addEventListener('click', e => { const b = e.target.closest('[data-editar]'); if (b) { abrirOferta(ofertas.find(o => String(o.id) === b.dataset.editar)); window.scrollTo(0, 0); } });
  $('[data-oferta-nova]').addEventListener('click', () => abrirOferta(null));
  fo.elements.imagem_url.addEventListener('input', prevO);
  $('[data-oferta-foto]').addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    msgO('Enviando foto…');
    try { fo.elements.imagem_url.value = await api.enviarArquivo(f, 'ofertas'); prevO(); msgO('Foto pronta.', 'ok'); } catch (err) { msgO(err.message, 'err'); }
  });
  /* Mercado Livre: transforma qualquer link comum de produto em link de afiliado
     (acrescenta matt_word e matt_tool, os códigos do programa de afiliados). Links curtos
     (meli.la, mercadolivre.com/sec) já são de afiliado e ficam como estão. */
  let afil = null;
  async function codigosML() {
    if (afil) return afil;
    try { afil = (await api.blocos()).afiliados || {}; } catch (_) { afil = {}; }
    afil = { ml_word: afil.ml_word || 'omaorcosmaia1', ml_tool: afil.ml_tool || '78014764', ...afil };
    if ($('[name="ml_word"]')) { $('[name="ml_word"]').value = afil.ml_word; $('[name="ml_tool"]').value = afil.ml_tool; }
    return afil;
  }
  function linkAfiliadoML(link, c) {
    let u; try { u = new URL(link); } catch (_) { return link; }
    if (!/(^|\.)mercadoli(vre|bre)\.com(\.br)?$/i.test(u.hostname) || /^\/sec\//.test(u.pathname)) return link;
    if (!c.ml_word || !c.ml_tool) return link;
    // limpa rastreios de outras pessoas e da busca, mantém o produto
    [...u.searchParams.keys()].forEach(k => { if (/^(matt_|tracking_id|reco_|c_id|c_uid|sid|position|search_layout|type|deal_print_id|polycard_client|wid|pdp_filters|ref|forceInApp)/i.test(k)) u.searchParams.delete(k); });
    u.hash = '';
    u.searchParams.set('matt_word', c.ml_word);
    u.searchParams.set('matt_tool', c.ml_tool);
    return u.toString();
  }
  async function converterLink() {
    const antes = fo.elements.link.value.trim();
    const depois = linkAfiliadoML(antes, await codigosML());
    if (depois !== antes) { fo.elements.link.value = depois; return true; }
    return false;
  }
  fo.elements.link.addEventListener('change', async () => { if (await converterLink()) msgO('Link do Mercado Livre convertido para o seu link de afiliado. Clique em “Buscar dados do link”.', 'ok'); });
  if ($('[name="ml_salvar"]')) $('[name="ml_salvar"]').addEventListener('click', async () => {
    const dados = { ...(await codigosML()), ml_word: $('[name="ml_word"]').value.trim(), ml_tool: $('[name="ml_tool"]').value.trim() };
    try { await api.salvarBloco('afiliados', dados); afil = dados; msgO('Códigos de afiliado salvos.', 'ok'); } catch (err) { msgO(err.message, 'err'); }
  });

  $('[data-oferta-buscar]').addEventListener('click', async () => {
    await converterLink();
    const link = fo.elements.link.value.trim(), base = (window.O68_CONFIG || {}).roboUrl;
    if (!/^https?:\/\//.test(link)) return msgO('Cole o link primeiro.', 'err');
    if (!base) return msgO('Robô não configurado.', 'err');
    msgO('Buscando…');
    try {
      const r = await fetch(base.replace(/\/$/, '') + '/produto', { method: 'POST', headers: { authorization: 'Bearer ' + await api.token(), 'content-type': 'application/json' }, body: JSON.stringify({ url: link }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || 'Não foi possível ler esse link.');
      if (d.titulo && !fo.elements.titulo.value) fo.elements.titulo.value = d.titulo.slice(0, 200);
      if (d.imagem && !fo.elements.imagem_url.value) { fo.elements.imagem_url.value = d.imagem; prevO(); }
      if (d.loja) fo.elements.loja.value = d.loja;
      if (d.preco && !fo.elements.preco.value) fo.elements.preco.value = d.preco;
      if (d.preco_antigo && !fo.elements.preco_antigo.value) fo.elements.preco_antigo.value = d.preco_antigo;
      msgO(d.titulo || d.imagem ? 'Dados encontrados. Confira e complete o preço.' : 'A loja não liberou os dados; preencha à mão.', d.titulo ? 'ok' : '');
    } catch (err) { msgO(err.message + ' Preencha à mão.', 'err'); }
  });
  fo.addEventListener('submit', async e => {
    e.preventDefault();
    await converterLink();
    const o = { ...(atual ? { id: atual.id } : {}) };
    ['link', 'titulo', 'loja', 'preco', 'preco_antigo', 'descricao', 'imagem_url'].forEach(k => { o[k] = fo.elements[k].value.trim() || null; });
    o.ordem = parseInt(fo.elements.ordem.value, 10) || 0; o.destaque = fo.elements.destaque.checked; o.ativo = fo.elements.ativo.checked;
    if (o.imagem_url && !util.linkSeguro(o.imagem_url)) return msgO('O endereço da imagem precisa começar com https://', 'err');
    msgO('Salvando…');
    try { const s = await api.salvarOferta(o); await carregarOfertas(); abrirOferta(s); msgO('Oferta salva!', 'ok'); }
    catch (err) { msgO(err.message, 'err'); }
  });
  $('[data-oferta-apagar]').addEventListener('click', async () => {
    if (!atual || !confirm(`Apagar "${atual.titulo}"?`)) return;
    try { await api.apagarOferta(atual.id); abrirOferta(null); await carregarOfertas(); msgO('Oferta apagada.', 'ok'); } catch (err) { msgO(err.message, 'err'); }
  });

  // carrega quando a aba é aberta
  $('[data-abas]').addEventListener('click', async e => {
    const b = e.target.closest('[data-aba]'); if (!b) return;
    if (b.dataset.aba === 'anuncios') { try { anuncios = (await api.blocos()).anuncios || {}; } catch (_) {} desenharAnuncios(); }
    if (b.dataset.aba === 'ofertas') { abrirOferta(null); carregarOfertas(); afil = null; codigosML(); }
  });
})();
