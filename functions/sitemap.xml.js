// Mapa do site para o Google: páginas fixas + todas as notícias publicadas
import { banco, esc, SITE } from './_lib.js';

export async function onRequest() {
  let noticias = [];
  try {
    noticias = await banco('noticias?select=slug,publicado_em&status=eq.publicado&order=publicado_em.desc&limit=5000');
  } catch (_) {}
  const hoje = new Date().toISOString();
  const urls = [
    `<url><loc>${SITE}/</loc><lastmod>${noticias[0] ? noticias[0].publicado_em : hoje}</lastmod><changefreq>hourly</changefreq><priority>1.0</priority></url>`,
    `<url><loc>${SITE}/lista</loc><changefreq>hourly</changefreq><priority>0.8</priority></url>`,
    `<url><loc>${SITE}/ofertas</loc><changefreq>daily</changefreq><priority>0.5</priority></url>`,
    ...noticias.filter(n => n.slug).map(n =>
      `<url><loc>${SITE}/artigo?n=${esc(encodeURIComponent(n.slug))}</loc>${n.publicado_em ? `<lastmod>${esc(n.publicado_em)}</lastmod>` : ''}<priority>0.7</priority></url>`)
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}
