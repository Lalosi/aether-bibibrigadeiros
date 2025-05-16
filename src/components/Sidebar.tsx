
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import { 
  Home, 
  PackageOpen, 
  FileText, 
  Users, 
  ShoppingCart, 
  Store, 
  Settings, 
  LogOut 
} from 'lucide-react';

const sidebarItems = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Estoque', path: '/estoque', icon: PackageOpen },
  { name: 'Relatórios', path: '/relatorios', icon: FileText },
  { name: 'Clientes', path: '/clientes', icon: Users },
  { name: 'Pedidos', path: '/pedidos', icon: ShoppingCart },
  { name: 'Loja', path: '/comprar', icon: Store },
];

const Sidebar = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="h-screen w-64 bg-confectionery-gray/50 border-r border-confectionery-pink/20 flex flex-col animate-fade-in">
      <div className="p-5 border-b border-confectionery-pink/20">
        <Logo />
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => (
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
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 w-full text-left animate-hover">
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
