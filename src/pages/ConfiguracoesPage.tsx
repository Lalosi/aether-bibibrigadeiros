import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNome, setNewNome] = useState('');
  const [newRole, setNewRole] = useState<AppRole>('funcionario');

  const load = async () => {
    setLoading(true);
    const isPrivileged = currentRole === 'master' || currentRole === 'admin';

    // Privileged users: pivot on user_roles (visible to all auth'd users)
    // and left-join profiles. Regular users: only own profile.
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      isPrivileged
        ? supabase.from('profiles').select('*')
        : supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('id, user_id, role, profile:profiles(*)'),
    ]);
    if (pErr || rErr) {
      toast.error('Erro ao carregar usuários', { description: (pErr ?? rErr)?.message });
      setLoading(false);
      return;
    }
    const priority: AppRole[] = ['master', 'admin', 'funcionario'];
    const profileMap = new Map<string, any>();
    for (const p of (profiles ?? []) as any[]) profileMap.set(p.id, p);
    // Enrich from joined profile data inside user_roles
    for (const r of (roles ?? []) as any[]) {
      if (r.profile && !profileMap.has(r.user_id)) profileMap.set(r.user_id, r.profile);
    }
    const profileList: any[] = Array.from(profileMap.values());
    const roleList: any[] = roles ?? [];

    // Start from profiles
    const merged: Row[] = profileList.map((p: any) => {
      const userRoles = roleList.filter((r: any) => r.user_id === p.id);
      const top = priority.find((pr) => userRoles.some((ur: any) => ur.role === pr));
      const matched = userRoles.find((ur: any) => ur.role === top);
      return {
        profile: p,
        role: (top ?? 'funcionario') as AppRole,
        roleId: matched?.id ?? null,
      };
    });

    // Fallback: include users present in user_roles but missing from profiles
    const knownIds = new Set(merged.map((m) => m.profile.id));
    for (const ur of roleList) {
      if (knownIds.has(ur.user_id)) continue;
      const userRoles = roleList.filter((r: any) => r.user_id === ur.user_id);
      const top = priority.find((pr) => userRoles.some((u: any) => u.role === pr));
      merged.push({
        profile: { id: ur.user_id, nome: null, email: null },
        role: (top ?? 'funcionario') as AppRole,
        roleId: ur.id ?? null,
      });
      knownIds.add(ur.user_id);
    }
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const isMaster = currentRole === 'master';
  const isAdmin = currentRole === 'admin';
  const canCreate = isMaster || isAdmin;

  // Master: any role. Admin: funcionario|admin (no master).
  const allowedNewRoles: AppRole[] = isMaster
    ? ['funcionario', 'admin', 'master']
    : isAdmin
    ? ['funcionario', 'admin']
    : [];

  const handleCreateUser = async () => {
    if (!canCreate) return;
    if (!newEmail || !newPassword) {
      toast.error('Preencha e-mail e senha.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (!isMaster && newRole === 'master') {
      toast.error('Apenas Master pode criar usuários Master.');
      return;
    }
    setCreating(true);
    const { data, error } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: { data: { nome: newNome } },
    });
    if (error || !data.user) {
      setCreating(false);
      const msg = error?.message ?? 'Erro desconhecido';
      if (/already/i.test(msg)) {
        toast.error('E-mail já cadastrado.');
      } else {
        toast.error('Erro ao criar usuário', { description: msg });
      }
      return;
    }
    // Insert role
    const { error: roleErr } = await supabase
      .from('user_roles')
      .insert({ user_id: data.user.id, role: newRole });
    setCreating(false);
    if (roleErr) {
      toast.error('Usuário criado, mas falha ao atribuir role', { description: roleErr.message });
      return;
    }
    toast.success('Usuário criado!', {
      description: `${newEmail} cadastrado como ${newRole}.`,
    });
    setOpenCreate(false);
    setNewEmail(''); setNewPassword(''); setNewNome(''); setNewRole('funcionario');
    load();
  };

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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Perfis & Permissões</CardTitle>
              {canCreate && (
                <Button
                  onClick={() => setOpenCreate(true)}
                  className="bg-confectionery-pink hover:bg-confectionery-pink/80"
                >
                  <UserPlus className="h-4 w-4 mr-2" /> Convidar/Criar Usuário
                </Button>
              )}
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
                          {row.profile.email ?? <span className="text-xs font-mono">{row.profile.id}</span>}
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

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar novo usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={newNome} onChange={(e) => setNewNome(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Senha provisória</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Role</Label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as AppRole)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {allowedNewRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {!isMaster && (
                <p className="text-xs text-muted-foreground mt-1">
                  Admins não podem criar usuários Master.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={creating}
              className="bg-confectionery-pink hover:bg-confectionery-pink/80"
            >
              {creating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</>
              ) : 'Criar usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ConfiguracoesPage;