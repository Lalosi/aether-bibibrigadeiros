// Centralized environment flags for the Aether ERP.
// All flags are read from import.meta.env (Vite) and exposed as booleans.

const bool = (v: unknown, fallback = false): boolean => {
  if (v === undefined || v === null || v === '') return fallback;
  return String(v).toLowerCase() === 'true' || v === '1';
};

export const config = {
  // Master switch for academic presentation behaviors:
  //  - login bypass with password "teste"
  //  - seed/fictional data fallback for BI charts
  //  - educational POO/SQL popups on action buttons
  presentationMode: bool(import.meta.env.VITE_PRESENTATION_MODE, true),

  // Sidebar visibility flags (default: visible)
  showLoja: bool(import.meta.env.VITE_SHOW_LOJA, true),
  showEstoque: bool(import.meta.env.VITE_SHOW_ESTOQUE, true),
  showRelatorios: bool(import.meta.env.VITE_SHOW_RELATORIOS, true),
  showClientes: bool(import.meta.env.VITE_SHOW_CLIENTES, true),
  showPedidos: bool(import.meta.env.VITE_SHOW_PEDIDOS, true),
  showDashboard: bool(import.meta.env.VITE_SHOW_DASHBOARD, true),

  // Bypass credentials used only when presentationMode is true.
  bypassEmail: 'teste@teste.com',
  bypassPassword: 'teste',
} as const;

export type AppConfig = typeof config;