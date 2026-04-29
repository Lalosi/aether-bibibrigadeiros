
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import OrderPage from "./pages/OrderPage";
import NotFound from "./pages/NotFound";
import EstoquePage from "./pages/EstoquePage";
import PedidosPage from "./pages/PedidosPage";
import ClientesPage from "./pages/ClientesPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import { AuthProvider, ProtectedRoute } from "./hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={<ProtectedRoute allow={["admin","master"]}><Dashboard /></ProtectedRoute>} />
            <Route path="/comprar" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
            <Route path="/estoque" element={<ProtectedRoute allow={["admin","master"]}><EstoquePage /></ProtectedRoute>} />
            <Route path="/pedidos" element={<ProtectedRoute><PedidosPage /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute allow={["admin","master"]}><RelatoriosPage /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
