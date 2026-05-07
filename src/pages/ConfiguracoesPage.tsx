import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield } from 'lucide-react';
import { supabase, type AppRole } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ProfileRow {
  id: string;
  nome?: string | null;
  email?: string | null;
  [k: string]: any;
}

interface Row {
  profile: ProfileRow;
  role: AppRole;
  roleId?: string | number | null;
}

const ROLES: AppRole[] = ['funcionario', 'admin', 'master'];

const roleBadge = (r: AppRole) =>
  r === 'master' ? 'bg-purple-600' : r === 'admin' ? 'bg-blue-600' : 'bg-slate-500';

const ConfiguracoesPage = () => {
  const { role: currentRole } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('*'),
    ]);
    if (pErr || rErr) {
      toast.error('Erro ao carregar usuários', { description: (pErr ?? rErr)?.message });
      setLoading(false);
      return;
    }
    const priority: AppRole[] = ['master', 'admin', 'funcionario'];
    const merged: Row[] = (profiles ?? []).map((p: any) => {
      const userRoles = (roles ?? []).filter((r: any) => r.user_id === p.id);
      const top = priority.find((pr) => userRoles.some((ur: any) => ur.role === pr));
      const matched = userRoles.find((ur: any) => ur.role === top);
      return {
        profile: p,
        role: (top ?? 'funcionario') as AppRole,
        roleId: matched?.id ?? null,
      };
    });
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const isMaster = currentRole === 'master';

  const handleChangeRole = async (row: Row, newRole: AppRole) => {
    if (!isMaster) {
      toast.error('Apenas Master pode alterar permissões');
      return;
    }
    if (newRole === row.role) return;
    setSavingId(row.profile.id);
    // Remove existing roles for this user, then insert new role.
    const { error: delErr } = await supabase
      .from('user_roles').delete().eq('user_id', row.profile.id);
    if (delErr) {
      setSavingId(null);
      toast.error('Erro ao atualizar permissão', { description: delErr.message });
      return;
    }
    const { error: insErr } = await supabase
      .from('user_roles').insert({ user_id: row.profile.id, role: newRole });
    setSavingId(null);
    if (insErr) {
      toast.error('Erro ao atualizar permissão', { description: insErr.message });
      return;
    }
    toast.success('Permissão atualizada!', {
      description: `${row.profile.nome ?? row.profile.email ?? 'Usuário'} agora é ${newRole}.`,
    });
    load();
  };

  return (
    <MainLayout title="Configurações">
      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList>
          <TabsTrigger value="usuarios">
            <Shield className="h-4 w-4 mr-2" /> Gestão de Usuários
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfis & Permissões</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
                </div>
              ) : rows.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">
                  Nenhum perfil encontrado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Role atual</TableHead>
                      <TableHead>Alterar permissão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.profile.id}>
                        <TableCell className="font-medium">
                          {row.profile.nome ?? row.profile.full_name ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.profile.email ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${roleBadge(row.role)} text-white capitalize`}>
                            {row.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <select
                            disabled={!isMaster || savingId === row.profile.id}
                            value={row.role}
                            onChange={(e) => handleChangeRole(row, e.target.value as AppRole)}
                            className="rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          {savingId === row.profile.id && (
                            <Loader2 className="inline h-4 w-4 ml-2 animate-spin" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!isMaster && (
                <p className="text-xs text-muted-foreground mt-4">
                  Somente usuários com role <strong>master</strong> podem alterar permissões.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default ConfiguracoesPage;