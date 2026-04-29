
import React from 'react';
import { Bell, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';

const UserMenu = () => {
  const { user, role, signOut, isBypass } = useAuth();
  const navigate = useNavigate();
  const email = (user as { email?: string } | null)?.email ?? 'Convidado';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex items-center gap-4">
      <button className="relative p-2 rounded-full hover:bg-confectionery-gray/50 animate-hover">
        <Bell size={20} />
        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full hover:bg-confectionery-gray/50 p-1 animate-hover">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-confectionery-purple">
                <User size={16} />
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>
            <div className="text-xs font-normal text-muted-foreground truncate">{email}</div>
            <div className="text-xs font-medium mt-1">
              Role: <span className="uppercase">{role ?? '—'}</span>
              {isBypass && <span className="ml-1 text-amber-600">(bypass)</span>}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configurações</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={handleLogout}>Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserMenu;
