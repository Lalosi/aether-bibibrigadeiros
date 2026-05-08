import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, KeyRound, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PerfilPage = () => {
  const { user, role, isBypass } = useAuth();
  const email = (user as { email?: string } | null)?.email ?? '';
  const [nome, setNome] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [novaSenha, setNovaSenha] = useState('');
  const [savingSenha, setSavingSenha] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user || isBypass) { setLoadingProfile(false); return; }
      const { data } = await supabase
        .from('profiles').select('*').eq('id', (user as any).id).maybeSingle();
      setNome((data as any)?.nome ?? (data as any)?.full_name ?? '');
      setLoadingProfile(false);
    };
    load();
  }, [user, isBypass]);

  const handleAlterarSenha = async () => {
    if (isBypass) {
      toast.error('Sessão de demonstração não permite alterar senha.');
      return;
    }
    if (novaSenha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSavingSenha(true);
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    setSavingSenha(false);
    if (error) {
      toast.error('Erro ao alterar senha', { description: error.message });
      return;
    }
    toast.success('Senha alterada com sucesso!');
    setNovaSenha('');
  };

  return (
    <MainLayout title="Meu Perfil">
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-confectionery-pink" /> Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingProfile ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
              </div>
            ) : (
              <>
                <div>
                  <Label>Nome</Label>
                  <Input value={nome} readOnly className="mt-1" />
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input value={email} readOnly className="mt-1" />
                </div>
                <div>
                  <Label>Role</Label>
                  <div className="mt-1">
                    <Badge className="capitalize bg-confectionery-pink text-white">
                      {role ?? '—'}
                    </Badge>
                    {isBypass && (
                      <span className="ml-2 text-xs text-amber-600">(modo demonstração)</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-confectionery-pink" /> Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nova senha</Label>
              <Input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleAlterarSenha}
              disabled={savingSenha || isBypass}
              className="bg-confectionery-pink hover:bg-confectionery-pink/80"
            >
              {savingSenha ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
              ) : 'Alterar senha'}
            </Button>
            {isBypass && (
              <p className="text-xs text-muted-foreground">
                Indisponível em sessão de demonstração.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PerfilPage;
