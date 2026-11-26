/* =========================================================
   ORIGEM 68 — CONEXÃO COM O BANCO DE NOTÍCIAS
   ---------------------------------------------------------
   Deixe vazio para usar o MODO DEMONSTRAÇÃO: as notícias
   ficam salvas só no navegador de quem está testando.

   Para publicar de verdade, preencha com os dados do projeto
   Supabase (Project Settings > API):
     url   → "Project URL"
     chave → "Publishable key" (pode ficar no site: é pública)
   ========================================================= */
window.O68_CONFIG = {
  supabaseUrl: "https://vsfheoticrdosunjmhvo.supabase.co",
  supabaseChave: "sb_publishable_AcscqZ7XdNM1D6iOItPVRA_ZCiva2ZU",
  // Robô de notícias (Cloudflare Worker) — usado pelos botões da aba "Robô" no painel
  roboUrl: "https://origem68-robo.origem68ac.workers.dev"
};
