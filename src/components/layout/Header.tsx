import React from 'react';
import { Menu, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface HeaderProps {
  setIsOpen: (isOpen: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setIsOpen }) => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Erro ao fazer logout: " + error.message);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      )}
      
      <div className="flex-grow">
        {/* Espaço para título ou barra de pesquisa futura */}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 pr-2 rounded-full">
            <div className="flex items-center space-x-3 cursor-pointer">
              {/* Avatar à esquerda do texto */}
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {profile?.nome ? getInitials(profile.nome) : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              {/* Texto à direita do Avatar */}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium leading-none text-foreground">{profile?.nome || profile?.email}</p>
                <p className="text-xs leading-none text-muted-foreground capitalize">{profile?.perfil}</p>
              </div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile?.nome || 'Usuário'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {profile?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </Link>
          </DropdownMenuItem>
          {/* Removendo o link de Configurações conforme solicitado */}
          {/* {profile?.perfil === 'admin' && (
            <DropdownMenuItem asChild>
              <Link to="/configuracoes">
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
          )} */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
};

export default Header;