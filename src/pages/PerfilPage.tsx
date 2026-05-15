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
  const [valorHora, setValorHora] = useState<string>('25.00');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [novaSenha, setNovaSenha] = useState('');
  const [savingSenha, setSavingSenha] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user || isBypass) { setLoadingProfile(false); return; }
      const { data } = await supabase
        .from('profiles').select('*').eq('id', (user as any).id).maybeSingle();
      setNome((data as any)?.nome ?? (data as any)?.full_name ?? '');
      const vh = (data as any)?.valor_hora_trabalho;
      setValorHora(vh != null ? String(vh) : '25.00');
      setLoadingProfile(false);
    };
    load();
  }, [user, isBypass]);

  const handleSalvarPerfil = async () => {
    if (isBypass) {
      toast.error('Sessão de demonstração não permite editar o perfil.');
      return;
    }
    const vh = Number(valorHora);
    if (Number.isNaN(vh) || vh < 0) {
      toast.error('Valor hora inválido.');
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({ nome, valor_hora_trabalho: vh })
      .eq('id', (user as any).id);
    setSavingProfile(false);
    if (error) {
      toast.error('Erro ao salvar perfil', { description: error.message });
      return;
    }
    toast.success('Perfil atualizado!');
  };

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
                  <Input
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1"
                    disabled={isBypass}
                  />
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
                <div>
                  <Label>Valor da hora de trabalho (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorHora}
                    onChange={(e) => setValorHora(e.target.value)}
                    className="mt-1"
                    disabled={isBypass}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Usado nos cálculos de mão de obra da Ficha Técnica.
                  </p>
                </div>
                <Button
                  onClick={handleSalvarPerfil}
                  disabled={savingProfile || isBypass}
                  className="bg-confectionery-pink hover:bg-confectionery-pink/80"
                >
                  {savingProfile ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
                  ) : 'Salvar perfil'}
                </Button>
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
