/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PRESENTATION_MODE?: string;
  readonly VITE_SHOW_LOJA?: string;
  readonly VITE_SHOW_ESTOQUE?: string;
  readonly VITE_SHOW_RELATORIOS?: string;
  readonly VITE_SHOW_CLIENTES?: string;
  readonly VITE_SHOW_PEDIDOS?: string;
  readonly VITE_SHOW_DASHBOARD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
