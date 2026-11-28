// Coloca título, resumo e foto de cada notícia no HTML da página de matéria,
// para o Google e as prévias de WhatsApp/Instagram/Facebook enxergarem sem rodar JavaScript.
import { banco, esc, SITE } from './_lib.js';

export async function onRequest(ctx) {
  const url = new URL(ctx.request.url);
  const resp = await ctx.next();
  const ehArtigo = url.pathname === '/artigo' || url.pathname === '/artigo.html';
  const slug = url.searchParams.get('n');
  if (!ehArtigo || !slug || resp.status !== 200) return resp;
  if (!(resp.headers.get('content-type') || '').includes('text/html')) return resp;

  let n;
  try {
    const r = await banco('noticias?select=titulo,linha_fina,foto_url,publicado_em,autor,editoria&status=eq.publicado&slug=eq.' + encodeURIComponent(slug) + '&limit=1');
    n = r[0];
  } catch (_) { return resp; }
  if (!n) return resp;

  const titulo = `${n.titulo} — Origem 68`;
  const desc = String(n.linha_fina || n.titulo).slice(0, 300);
  const canon = `${SITE}/artigo?n=${encodeURIComponent(slug)}`;
  const foto = n.foto_url || `${SITE}/assets/img/og.png`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'NewsArticle',
    headline: String(n.titulo).slice(0, 110), description: desc, image: [foto],
    datePublished: n.publicado_em, mainEntityOfPage: canon,
    author: { '@type': n.autor ? 'Person' : 'Organization', name: n.autor || 'Origem 68' },
    publisher: { '@type': 'Organization', name: 'Origem 68', logo: { '@type': 'ImageObject', url: `${SITE}/assets/img/og.png` } }
  };
  const extra = `
  <link rel="canonical" href="${esc(canon)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Origem 68">
  <meta property="og:title" content="${esc(n.titulo)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${esc(canon)}">
  <meta property="og:image" content="${esc(foto)}">
  <meta name="twitter:card" content="summary_large_image">
  ${n.publicado_em ? `<meta property="article:published_time" content="${esc(n.publicado_em)}">` : ''}
  <script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;

  return new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(titulo); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute('content', desc); } })
    .on('head', { element(e) { e.append(extra, { html: true }); } })
    .transform(resp);
}
