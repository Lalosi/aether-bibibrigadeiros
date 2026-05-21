import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';

const AcessoPendente = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const email = (user as { email?: string } | null)?.email ?? '';

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-confectionery-pink/10 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 text-center animate-scale-in">
        <div className="flex justify-center mb-6"><Logo size="large" /></div>
        <h1 className="text-2xl font-semibold mb-2">Acesso Pendente</h1>
        <p className="text-muted-foreground mb-2">
          Sua conta {email && <strong>({email})</strong>} ainda não possui uma permissão atribuída.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Entre em contato com um administrador para liberar seu acesso ao sistema.
        </p>
        <Button onClick={handleLogout} variant="outline" className="w-full">
          Sair
        </Button>
      </div>
    </div>
  );
};

export default AcessoPendente;