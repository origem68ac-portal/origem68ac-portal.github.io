/* =========================================================
   ORIGEM 68 — camada de dados
   Mesma interface para o modo demonstração (navegador) e
   para o Supabase. Usada pelo site e pelo painel.
   ========================================================= */
(function () {
  const cfg = window.O68_CONFIG || {};
  const MODO = cfg.supabaseUrl && cfg.supabaseChave ? 'supabase' : 'demo';
  const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';

  /* ---------------- utilidades ---------------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'noticia';

  // Texto simples → HTML seguro.  Parágrafos separados por linha em branco.
  //   ## Intertítulo      > Citação (linha seguinte com "— autor" vira crédito)
  //   - item de lista     **negrito**     [texto](https://link)
  const inline = t => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  function corpoHTML(texto) {
    return String(texto || '').replace(/\r/g, '').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean).map(b => {
      if (b.startsWith('## ')) return `<h2>${inline(b.slice(3))}</h2>`;
      if (b.startsWith('>')) {
        const linhas = b.split('\n').map(l => l.replace(/^>\s?/, ''));
        const cite = linhas.length > 1 && /^[—-]/.test(linhas[linhas.length - 1]) ? linhas.pop() : '';
        return `<blockquote>${inline(linhas.join(' '))}${cite ? `<cite>${inline(cite)}</cite>` : ''}</blockquote>`;
      }
      if (/^- /.test(b)) return `<ul>${b.split('\n').map(l => `<li>${inline(l.replace(/^-\s?/, ''))}</li>`).join('')}</ul>`;
      return `<p>${inline(b).replace(/\n/g, '<br>')}</p>`;
    }).join('\n');
  }

  const minutosLeitura = t => Math.max(1, Math.round(String(t || '').split(/\s+/).length / 200));

  function tempoRelativo(data) {
    if (!data) return '';
    const d = new Date(data), s = (Date.now() - d) / 1000;
    if (s < 60) return 'Agora';
    if (s < 3600) return `Há ${Math.floor(s / 60)} min`;
    if (s < 86400) { const h = Math.floor(s / 3600); return `Há ${h} hora${h > 1 ? 's' : ''}`; }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'America/Rio_Branco' });
  }
  const dataHora = data => data ? new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Rio_Branco' }) : '';

  // Sem foto: mancha de luz laranja, sempre a mesma para a mesma notícia
  const phVariante = slug => 'ph--' + (1 + [...String(slug)].reduce((a, c) => a + c.charCodeAt(0), 0) % 6);
  // Fotos servidas já reduzidas e comprimidas (WebP ~1000 px) pelo wsrv.nl; se falhar, carrega a original
  const fotoLeve = (url, w = 1000) => /^https?:\/\//.test(url || '') ? `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=72&output=webp` : url;
  function fotoHTML(n, extra = '') {
    const img = n.foto_url ? `<img src="${esc(fotoLeve(n.foto_url))}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${esc(n.foto_url)}'">` : '';
    return `<div class="ph ${n.foto_url ? 'has-img' : phVariante(n.slug)}" data-credit="${esc(n.foto_credito || '')}">${img}${extra}</div>`;
  }

  // Links digitados no painel: só http(s), mailto e tel
  const linkSeguro = u => { u = String(u || '').trim(); return /^(https?:\/\/|mailto:|tel:)/i.test(u) ? u : ''; };
  const youtubeId = u => { const m = String(u || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/); return m ? m[1] : ''; };

  const EDITORIAS = ['Rio Branco', 'Interior', 'Política', 'Economia', 'Amazônia', 'Saúde', 'Educação', 'Segurança', 'Esporte', 'Cultura', 'Negócios', 'Cidades', 'Brasil', 'Tecnologia', 'Curiosidades'];
  const MUNICIPIOS = ['Acrelândia', 'Assis Brasil', 'Brasiléia', 'Bujari', 'Capixaba', 'Cruzeiro do Sul', 'Epitaciolândia', 'Feijó', 'Jordão', 'Mâncio Lima', 'Manoel Urbano', 'Marechal Thaumaturgo', 'Plácido de Castro', 'Porto Acre', 'Porto Walter', 'Rio Branco', 'Rodrigues Alves', 'Santa Rosa do Purus', 'Sena Madureira', 'Senador Guiomard', 'Tarauacá', 'Xapuri'];

  /* ---------------- conteúdo de exemplo ---------------- */
  const h = n => new Date(Date.now() - n * 3600e3).toISOString();
  const txt = 'Este é um texto de exemplo do modo demonstração. Pelo painel da redação, você pode editar esta notícia, trocar a foto ou apagá-la.\n\nAs notícias publicadas aparecem na capa automaticamente, na ordem em que foram publicadas.';
  const DEMO = [
    { slug: 'o-acre-que-acorda-antes-do-sol', titulo: 'O Acre que acorda antes do sol: a rotina de quem vive do rio', linha_fina: 'Ribeirinhos, feirantes e barqueiros contam como a cheia e a seca redesenham a vida no estado — e o que muda para quem depende das águas para chegar à cidade.', editoria: 'Amazônia', posicao: 'manchete', h: 2, leituras: 120,
      corpo: 'Às quatro e meia da manhã, o porto ainda está escuro, mas já não está em silêncio. Motores de rabeta tossem, caixas de farinha mudam de mão, alguém grita o preço da banana. Para milhares de acreanos, o dia começa assim — com o rio como estrada, mercado e relógio.\n\nEste é um texto de exemplo para demonstrar o layout de matéria do Origem 68.\n\n## Quando a água sobe\n\nNa cheia, bairros inteiros da capital mudam de rotina. A Defesa Civil acompanha o nível do rio várias vezes ao dia.\n\n> “O rio dá e o rio tira. A gente aprende a ler a água desde criança.”\n— Morador da Base, em Rio Branco (depoimento ilustrativo)\n\n## Quando a água desce\n\nNa seca, o problema se inverte: bancos de areia surgem no meio do canal e viagens que levavam horas passam a levar dias.\n\n- Defesa Civil: 199\n- Corpo de Bombeiros: 193\n- SAMU: 192' },
    { slug: 'novo-terminal-segundo-distrito', titulo: 'Prefeitura anuncia novo terminal e integração de linhas no Segundo Distrito', editoria: 'Rio Branco', posicao: 'destaque', h: 0.7, leituras: 64 },
    { slug: 'assembleia-vota-orcamento', titulo: 'Assembleia Legislativa vota orçamento estadual para o próximo ano', linha_fina: 'Projeto prevê aumento de recursos para saúde e manutenção de ramais.', editoria: 'Política', h: 1, leituras: 98 },
    { slug: 'exportacoes-estrada-do-pacifico', titulo: 'Exportações pela Estrada do Pacífico batem recorde no semestre', linha_fina: 'Castanha, madeira certificada e carne lideram a pauta rumo ao Peru.', editoria: 'Economia', h: 2.2, leituras: 77 },
    { slug: 'vacinacao-alto-jurua', titulo: 'Campanha de vacinação chega às comunidades do Alto Juruá', linha_fina: 'Equipes seguem de barco por até três dias para atender aldeias e seringais.', editoria: 'Saúde', municipio: 'Marechal Thaumaturgo', h: 3, leituras: 41 },
    { slug: 'internet-via-satelite-escolas', titulo: 'Escolas estaduais terão internet via satélite até o fim do ano letivo', editoria: 'Educação', h: 4, leituras: 35 },
    { slug: 'classico-arena-da-floresta', titulo: 'Clássico Rio Branco x Atlético Acreano lota a Arena da Floresta', editoria: 'Esporte', h: 5, leituras: 110 },
    { slug: 'mercado-velho-programacao', titulo: 'Mercado Velho ganha programação cultural aos sábados', editoria: 'Cultura', h: 6, leituras: 22 },
    { slug: 'delegacia-brasileia', titulo: 'Polícia Civil inaugura nova delegacia em Brasiléia', editoria: 'Segurança', municipio: 'Brasiléia', h: 7, leituras: 18 },
    { slug: 'startups-bioeconomia', titulo: 'Startups acreanas apostam em bioeconomia e açaí', editoria: 'Negócios', h: 8, leituras: 15 },
    { slug: 'voo-direto-rio-branco', titulo: 'Aeroporto de Rio Branco terá novo voo direto', editoria: 'Cidades', h: 9, leituras: 88 }
  ].map((n, i) => ({
    id: 'demo-' + (i + 1), linha_fina: '', corpo: txt, municipio: '', foto_url: '', foto_credito: '', autor: 'Redação Origem 68',
    posicao: 'normal', status: 'publicado', ...n, publicado_em: h(n.h), criado_em: h(n.h), atualizado_em: h(n.h)
  }));

  /* ---------------- modo demonstração ---------------- */
  const KEY = 'o68-demo-noticias';
  const demoLer = () => {
    try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (_) {}
    return DEMO.map(n => ({ ...n }));
  };
  const demoGravar = lista => {
    try { localStorage.setItem(KEY, JSON.stringify(lista)); }
    catch (e) { throw new Error('O navegador ficou sem espaço para o modo demonstração. Use fotos menores ou apague notícias de teste.'); }
  };
  const porData = (a, b) => new Date(b.publicado_em || b.criado_em) - new Date(a.publicado_em || a.criado_em);

  const BKEY = 'o68-demo-blocos';
  const blocosLer = () => { try { return JSON.parse(localStorage.getItem(BKEY)) || {}; } catch (_) { return {}; } };
  const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const demo = {
    async lista({ editoria, municipio, q, limite = 18, pular = 0 } = {}) {
      const t = semAcento(q);
      const l = demoLer().filter(n => n.status === 'publicado'
        && (!editoria || n.editoria === editoria) && (!municipio || n.municipio === municipio)
        && (!t || semAcento(n.titulo + ' ' + n.linha_fina).includes(t))).sort(porData);
      return { itens: l.slice(pular, pular + limite), mais: l.length > pular + limite };
    },
    async blocos() { return blocosLer(); },
    async salvarBloco(chave, dados) { const b = blocosLer(); b[chave] = dados; try { localStorage.setItem(BKEY, JSON.stringify(b)); } catch (_) {} },
    async apagarBloco(chave) { const b = blocosLer(); delete b[chave]; try { localStorage.setItem(BKEY, JSON.stringify(b)); } catch (_) {} },
    async inscrever() {},
    async inscritos() { return []; },
    async roboVistos() { return []; },
    async ofertas() { return []; },
    registrarVisita() {},
    async estatisticas() { throw new Error('A visão geral só funciona conectada ao banco.'); },
    async registrarClique() {},
    async todasOfertas() { return []; },
    async salvarOferta() { throw new Error('Ofertas só funcionam conectadas ao banco.'); },
    async apagarOferta() {},
    async publicadas(limite = 30) { return demoLer().filter(n => n.status === 'publicado').sort(porData).slice(0, limite); },
    async recentes(limite = 120, pular = 0) { return demoLer().filter(n => n.status === 'publicado').sort(porData).slice(pular, pular + limite); },
    async maisLidas(limite = 4) { return demoLer().filter(n => n.status === 'publicado').sort((a, b) => b.leituras - a.leituras).slice(0, limite); },
    async porSlug(slug) { return demoLer().find(n => n.slug === slug && n.status === 'publicado') || null; },
    async registrarLeitura(slug) { const l = demoLer(); const n = l.find(x => x.slug === slug); if (n) { n.leituras++; try { demoGravar(l); } catch (_) {} } },
    async entrar() { return { email: 'demonstracao' }; },
    async sair() {},
    async sessao() { return { email: 'demonstracao' }; },
    async todas() { return demoLer().sort(porData); },
    async salvar(n) {
      const l = demoLer(), agora = new Date().toISOString();
      if (l.some(x => x.slug === n.slug && x.id !== n.id)) throw new Error('Já existe uma notícia com esse endereço (slug). Mude o título ou o slug.');
      if (n.status === 'publicado' && !n.publicado_em) n.publicado_em = agora;
      if (n.id) { const i = l.findIndex(x => x.id === n.id); l[i] = { ...l[i], ...n, atualizado_em: agora }; }
      else l.push({ leituras: 0, ...n, id: 'demo-' + Date.now(), criado_em: agora, atualizado_em: agora });
      demoGravar(l); return n;
    },
    async apagar(id) { demoGravar(demoLer().filter(n => n.id !== id)); },
    async enviarFoto(arquivo) { return reduzirImagem(arquivo, 1400, 0.78); },
    async enviarArquivo(arquivo) { return reduzirImagem(arquivo, 600, 0.9); },
    async restaurarExemplos() { try { localStorage.removeItem(KEY); } catch (_) {} }
  };

  // Reduz a foto no próprio navegador (fotos de celular chegam com vários MB)
  function reduzirImagem(arquivo, max, q, comoBlob) {
    return new Promise((ok, erro) => {
      const img = new Image(), url = URL.createObjectURL(arquivo);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        if (comoBlob) c.toBlob(b => b ? ok(b) : erro(new Error('Não foi possível preparar a foto.')), 'image/jpeg', q);
        else ok(c.toDataURL('image/jpeg', q));
      };
      img.onerror = () => erro(new Error('Não foi possível ler essa imagem.'));
      img.src = url;
    });
  }

  /* ---------------- Supabase ---------------- */
  let clientePromise = null;
  function cliente() {
    if (!clientePromise) clientePromise = new Promise((ok, erro) => {
      if (window.supabase) return ok(window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseChave));
      const s = document.createElement('script'); s.src = SUPABASE_JS;
      s.onload = () => ok(window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseChave));
      s.onerror = () => erro(new Error('Não foi possível carregar a conexão com o banco.'));
      document.head.appendChild(s);
    });
    return clientePromise;
  }
  const ok = ({ data, error }) => { if (error) throw new Error(traduzErro(error.message)); return data; };
  const traduzErro = m => /Invalid login/i.test(m) ? 'E-mail ou senha incorretos.'
    : /duplicate key.*slug/i.test(m) ? 'Já existe uma notícia com esse endereço (slug).'
    : /row-level security/i.test(m) ? 'Seu usuário ainda não está liberado como editor.' : m;
  const CAMPOS = 'id,slug,titulo,linha_fina,corpo,editoria,municipio,foto_url,foto_credito,autor,posicao,status,publicado_em,leituras,criado_em,atualizado_em,fonte_nome,fonte_url,origem';
  const CAMPOS_LISTA = 'id,slug,titulo,linha_fina,editoria,municipio,foto_url,foto_credito,autor,posicao,publicado_em,corpo';
  const limpaBusca = q => String(q || '').replace(/[,()%*\\'"]/g, ' ').trim().slice(0, 80);

  // Leitura pública direto na API (sem carregar a biblioteca do Supabase: o site abre bem mais rápido no celular)
  const REST = String(cfg.supabaseUrl || '').replace(/\/$/, '') + '/rest/v1/';
  async function rest(caminho, opcoes = {}) {
    const r = await fetch(REST + caminho, { ...opcoes, headers: { apikey: cfg.supabaseChave, ...(opcoes.headers || {}) } });
    if (!r.ok) { let m = ''; try { m = (await r.json()).message; } catch (_) {} throw new Error(traduzErro(m || 'Falha ao falar com o banco (' + r.status + ').')); }
    return r.status === 204 ? null : r.json();
  }
  const enc = encodeURIComponent;
  const PUB = 'status=eq.publicado&order=publicado_em.desc';

  const remoto = {
    async lista({ editoria, municipio, q, limite = 18, pular = 0 } = {}) {
      let p = `noticias?select=${CAMPOS_LISTA}&${PUB}&offset=${pular}&limit=${limite + 1}`;
      if (editoria) p += '&editoria=eq.' + enc(editoria);
      if (municipio) p += '&municipio=eq.' + enc(municipio);
      const t = limpaBusca(q).replace(/[.:]/g, ' ');
      if (t) p += '&or=' + enc(`(titulo.ilike.*${t}*,linha_fina.ilike.*${t}*,corpo.ilike.*${t}*)`);
      const itens = await rest(p);
      return { itens: itens.slice(0, limite), mais: itens.length > limite };
    },
    async blocos() {
      return Object.fromEntries((await rest('blocos?select=chave,dados')).map(b => [b.chave, b.dados]));
    },
    async salvarBloco(chave, dados) {
      const c = await cliente();
      ok(await c.from('blocos').upsert({ chave, dados, atualizado_em: new Date().toISOString() }));
    },
    async apagarBloco(chave) { const c = await cliente(); ok(await c.from('blocos').delete().eq('chave', chave)); },
    async inscrever(email) {
      try {
        await rest('inscritos', { method: 'POST', headers: { 'content-type': 'application/json', prefer: 'return=minimal' }, body: JSON.stringify({ email: String(email).trim().toLowerCase() }) });
      } catch (e) {
        if (!/duplicate key|já existe/i.test(e.message)) throw new Error('Não foi possível concluir a inscrição. Confira o e-mail.');
      }
    },
    async inscritos() { const c = await cliente(); return ok(await c.from('inscritos').select('email,criado_em').order('criado_em', { ascending: false }).limit(5000)); },
    async roboVistos(limite = 60) { const c = await cliente(); return ok(await c.from('robo_vistos').select('*').order('criado_em', { ascending: false }).limit(limite)); },
    // ---------- estatísticas ----------
    registrarVisita(pagina) {
      try { fetch(REST + 'rpc/registrar_visita', { method: 'POST', keepalive: true, headers: { apikey: cfg.supabaseChave, 'content-type': 'application/json' }, body: JSON.stringify({ p_pagina: pagina }) }); } catch (_) {}
    },
    async estatisticas(desdeISO) {
      const c = await cliente(), dia = desdeISO.slice(0, 10);
      const [noticias, leituras, visitas, robo, inscritos, ofertas] = await Promise.all([
        c.from('noticias').select('id,titulo,slug,status,origem,editoria,municipio,leituras,publicado_em,criado_em,foto_url,autor').order('criado_em', { ascending: false }).limit(5000),
        c.from('leituras_dia').select('dia,noticia_id,n').gte('dia', dia).limit(20000),
        c.from('visitas_dia').select('dia,pagina,n').gte('dia', dia).limit(5000),
        c.from('robo_vistos').select('decisao,fonte,criado_em').gte('criado_em', desdeISO).limit(10000),
        c.from('inscritos').select('criado_em').limit(20000),
        c.from('ofertas').select('titulo,loja,cliques,ativo').order('cliques', { ascending: false }).limit(200)
      ].map(p => p.then(ok)));
      return { noticias, leituras, visitas, robo, inscritos, ofertas };
    },
    // ---------- ofertas (links de afiliado) ----------
    async ofertas(limite = 60) { return rest(`ofertas?select=id,titulo,descricao,preco,preco_antigo,loja,link,imagem_url,destaque&ativo=eq.true&order=destaque.desc,ordem.asc,criado_em.desc&limit=${limite}`); },
    registrarClique(id) {
      try { fetch(REST + 'rpc/registrar_clique_oferta', { method: 'POST', keepalive: true, headers: { apikey: cfg.supabaseChave, 'content-type': 'application/json' }, body: JSON.stringify({ p_id: id }) }); } catch (_) {}
    },
    async todasOfertas() { const c = await cliente(); return ok(await c.from('ofertas').select('*').order('destaque', { ascending: false }).order('ordem').order('criado_em', { ascending: false }).limit(500)); },
    async salvarOferta(o) {
      const c = await cliente(); const { id, cliques, criado_em, ...dados } = o;
      dados.atualizado_em = new Date().toISOString();
      if (id) return ok(await c.from('ofertas').update(dados).eq('id', id).select().single());
      return ok(await c.from('ofertas').insert(dados).select().single());
    },
    async apagarOferta(id) { const c = await cliente(); ok(await c.from('ofertas').delete().eq('id', id)); },
    async publicadas(limite = 30) { return rest(`noticias?select=${CAMPOS_LISTA},fonte_nome&${PUB}&limit=${limite}`); },
    // versão leve (sem o texto): para as seções por editoria e o "Mais notícias" da capa
    async recentes(limite = 120, pular = 0) { return rest(`noticias?select=id,slug,titulo,linha_fina,editoria,municipio,foto_url,foto_credito,publicado_em&${PUB}&offset=${pular}&limit=${limite}`); },
    async maisLidas(limite = 4) { return rest(`noticias?select=slug,titulo,editoria&status=eq.publicado&publicado_em=gte.${enc(new Date(Date.now() - 7 * 864e5).toISOString())}&order=leituras.desc&limit=${limite}`); },
    async porSlug(slug) { return (await rest(`noticias?select=${CAMPOS}&status=eq.publicado&slug=eq.${enc(slug)}&limit=1`))[0] || null; },
    async registrarLeitura(slug) { try { await rest('rpc/registrar_leitura', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ p_slug: slug }) }); } catch (_) {} },
    async entrar(email, senha) { const c = await cliente(); return ok(await c.auth.signInWithPassword({ email, password: senha })).user; },
    async sair() { const c = await cliente(); await c.auth.signOut(); },
    async sessao() { const c = await cliente(); const { data } = await c.auth.getSession(); return data.session ? data.session.user : null; },
    async token() { const c = await cliente(); const { data } = await c.auth.getSession(); return data.session ? data.session.access_token : ''; },
    async todas() { const c = await cliente(); return ok(await c.from('noticias').select(CAMPOS).order('criado_em', { ascending: false }).limit(300)); },
    async salvar(n) {
      const c = await cliente(); const { id, leituras, criado_em, atualizado_em, ...dados } = n;
      if (id) return ok(await c.from('noticias').update(dados).eq('id', id).select().single());
      return ok(await c.from('noticias').insert(dados).select().single());
    },
    async apagar(id) { const c = await cliente(); ok(await c.from('noticias').delete().eq('id', id)); },
    // Arquivos da marca (logo, ícone): sobem como estão, para manter o fundo transparente
    async enviarArquivo(arquivo, pasta = 'marca') {
      if (!/^image\/(png|webp|jpeg|gif)$/.test(arquivo.type)) throw new Error('Use PNG, WebP, JPG ou GIF.');
      const c = await cliente();
      const ext = { 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/gif': 'gif' }[arquivo.type];
      const caminho = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      ok(await c.storage.from('fotos').upload(caminho, arquivo, { cacheControl: '31536000', upsert: false, contentType: arquivo.type }));
      return c.storage.from('fotos').getPublicUrl(caminho).data.publicUrl;
    },
    async enviarFoto(arquivo) {
      const c = await cliente();
      const caminho = `${new Date().toISOString().slice(0, 7)}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
      const foto = await reduzirImagem(arquivo, 1600, 0.82, true);
      ok(await c.storage.from('fotos').upload(caminho, foto, { cacheControl: '31536000', upsert: false, contentType: 'image/jpeg' }));
      return c.storage.from('fotos').getPublicUrl(caminho).data.publicUrl;
    }
  };

  window.O68 = {
    modo: MODO,
    api: MODO === 'supabase' ? remoto : demo,
    util: { esc, slugify, corpoHTML, minutosLeitura, tempoRelativo, dataHora, fotoHTML, youtubeId, linkSeguro, EDITORIAS, MUNICIPIOS }
  };
})();
