
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import {
  Home,
  PackageOpen,
  FileText,
  Users,
  ShoppingCart,
  Store,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { config } from '@/lib/config';
import type { AppRole } from '@/integrations/supabase/client';

type Item = {
  name: string;
  path: string;
  icon: LucideIcon;
  show: boolean;
  allow: AppRole[];
};

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    toast({
      title: 'Logout realizado',
      description: 'Você saiu da sua conta com sucesso',
    });
    navigate('/login');
  };

  const items: Item[] = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, show: config.showDashboard, allow: ['admin', 'master'] },
    { name: 'Estoque', path: '/estoque', icon: PackageOpen, show: config.showEstoque, allow: ['admin', 'master'] },
    { name: 'Relatórios', path: '/relatorios', icon: FileText, show: config.showRelatorios, allow: ['admin', 'master'] },
    { name: 'Clientes', path: '/clientes', icon: Users, show: config.showClientes, allow: ['funcionario', 'admin', 'master'] },
    { name: 'Pedidos', path: '/pedidos', icon: ShoppingCart, show: config.showPedidos, allow: ['funcionario', 'admin', 'master'] },
    { name: 'Loja', path: '/comprar', icon: Store, show: config.showLoja, allow: ['funcionario', 'admin', 'master'] },
  ];

  const visible = items.filter((i) => i.show && (!role || i.allow.includes(role)));

  return (
    <div className="h-screen w-64 bg-confectionery-gray/50 border-r border-confectionery-pink/20 flex flex-col animate-fade-in">
      <div className="p-5 border-b border-confectionery-pink/20">
        <Logo />
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {visible.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg animate-hover ${
              isActive(item.path)
                ? 'bg-confectionery-pink text-primary-foreground'
                : 'hover:bg-confectionery-pink/20'
            }`}
          >
            <item.icon size={18} />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-confectionery-pink/20 space-y-2">
        <Link to="/configuracoes" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-confectionery-pink/20 animate-hover">
          <Settings size={18} />
          <span>Configurações</span>
        </Link>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 w-full text-left animate-hover"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
