// config.js — isi dengan project Supabase kamu (aman untuk exposed di frontend,
// ini ANON key, bukan service_role key).
const SUPABASE_CONFIG = {
  URL: 'https://guobvhghlrlgcqbfgzdn.supabase.co',
  ANON_KEY: 'sb_publishable_pT0S-ws6hJKRI7ptL7uhAg_A_GtFdFf',
  // URL Edge Function pengganti Apps Script SCRIPT_URL:
  TASKS_API_URL: 'https://guobvhghlrlgcqbfgzdn.supabase.co/functions/v1/tasks-api',
  // Kalau kamu punya edge function lain (mis. utk Design Requests), tambahkan di sini juga.
  LOGIN_PAGE: 'login.html'
};

// administration.html membaca CONFIG.ADMIN_GAS_WEB_APP_URL (nama variabel lama
// dipertahankan supaya file administration.html TIDAK perlu diubah sama sekali).
const CONFIG = {
  ADMIN_GAS_WEB_APP_URL: 'https://guobvhghlrlgcqbfgzdn.supabase.co/functions/v1/administration-api'
};
 
