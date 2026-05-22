/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PRESENTATION_MODE?: string;
  readonly VITE_PRESENTATION_PASSWORD?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_DEFAULT_CUSTO_FIXO_PCT?: string;
  readonly VITE_DEFAULT_MARGEM_PCT?: string;
  readonly VITE_SHOW_LOJA?: string;
  readonly VITE_SHOW_ESTOQUE?: string;
  readonly VITE_SHOW_RELATORIOS?: string;
  readonly VITE_SHOW_CLIENTES?: string;
  readonly VITE_SHOW_PEDIDOS?: string;
  readonly VITE_SHOW_DASHBOARD?: string;
  readonly VITE_SHOW_MATERIAS_PRIMAS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
