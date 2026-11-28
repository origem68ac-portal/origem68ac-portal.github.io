// Leitura pública das notícias (mesma chave publicável usada no site)
export const SUPA = 'https://vsfheoticrdosunjmhvo.supabase.co/rest/v1/';
export const CHAVE = 'sb_publishable_AcscqZ7XdNM1D6iOItPVRA_ZCiva2ZU';
export const SITE = 'https://origem68.pages.dev';

export async function banco(caminho) {
  const r = await fetch(SUPA + caminho, { headers: { apikey: CHAVE }, cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) throw new Error('banco ' + r.status);
  return r.json();
}

export const esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
