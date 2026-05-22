// Centralized environment flags for the Aether ERP.
// All flags are read from import.meta.env (Vite) and exposed as booleans.

const bool = (v: unknown, fallback = false): boolean => {
  if (v === undefined || v === null || v === '') return fallback;
  return String(v).toLowerCase() === 'true' || v === '1';
};

const num = (v: unknown, fallback: number): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const str = (v: unknown, fallback: string): string => {
  if (v === undefined || v === null || String(v).trim() === '') return fallback;
  return String(v);
};

export const config = {
  // Master switch for academic presentation behaviors.
  // Defaults to FALSE in production — must be explicitly enabled.
  presentationMode: bool(import.meta.env.VITE_PRESENTATION_MODE, false),

  // Sidebar visibility flags (default: visible)
  showLoja: bool(import.meta.env.VITE_SHOW_LOJA, true),
  showEstoque: bool(import.meta.env.VITE_SHOW_ESTOQUE, true),
  showRelatorios: bool(import.meta.env.VITE_SHOW_RELATORIOS, true),
  showClientes: bool(import.meta.env.VITE_SHOW_CLIENTES, true),
  showPedidos: bool(import.meta.env.VITE_SHOW_PEDIDOS, true),
  showDashboard: bool(import.meta.env.VITE_SHOW_DASHBOARD, true),
  showMateriasPrimas: bool(import.meta.env.VITE_SHOW_MATERIAS_PRIMAS, true),

  // Bypass credentials used only when presentationMode is true.
  bypassEmail: 'teste@teste.com',
  bypassPassword: str(import.meta.env.VITE_PRESENTATION_PASSWORD, 'teste'),

  // Business defaults
  defaultCustoFixoPct: num(import.meta.env.VITE_DEFAULT_CUSTO_FIXO_PCT, 10),
  defaultMargemPct: num(import.meta.env.VITE_DEFAULT_MARGEM_PCT, 100),

  // App branding
  appName: str(import.meta.env.VITE_APP_NAME, 'Aether'),
} as const;

export type AppConfig = typeof config;