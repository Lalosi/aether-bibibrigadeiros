
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import SearchBar from './SearchBar';
import UserMenu from './UserMenu';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';

const Header = ({ title, onMenuClick }: { title: string; onMenuClick?: () => void }) => {
  const isMobile = useIsMobile();
  
  return (
    <header className="flex justify-between items-center py-4 px-4 md:px-8 animate-fade-in bg-white/50 backdrop-blur-sm border-b border-confectionery-pink/20 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        {isMobile && onMenuClick && (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden">
            <Menu size={20} />
            <span className="sr-only">Abrir menu</span>
          </Button>
        )}
        <h1 className="text-xl md:text-2xl font-semibold truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <div className={`${isMobile ? 'hidden' : 'block'}`}>
          <SearchBar />
        </div>
        <UserMenu />
      </div>
    </header>
  );
};

export default Header;
