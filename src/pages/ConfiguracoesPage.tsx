import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, UserPlus, Pencil } from 'lucide-react';
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
  const [editing, setEditing] = useState<Row | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editRole, setEditRole] = useState<AppRole>('funcionario');
  const [editSaving, setEditSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

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
    // Cria o usuário via Edge Function (admin client com service_role),
    // preservando a sessão do master atual.
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: {
        email: newEmail,
        password: newPassword,
        nome: newNome,
        role: newRole,
      },
    });
    setCreating(false);
    const errMsg = (error as any)?.message ?? (data as any)?.error;
    if (error || errMsg) {
      if (/already|exists|duplicate/i.test(String(errMsg))) {
        toast.error('E-mail já cadastrado.');
      } else {
        toast.error('Erro ao criar usuário', { description: String(errMsg ?? 'Erro desconhecido') });
      }
      return;
    }
    toast.success('Usuário criado!', {
      description: `${newEmail} cadastrado como ${newRole}.`,
    });
    setOpenCreate(false);
    setNewEmail(''); setNewPassword(''); setNewNome(''); setNewRole('funcionario');
    load();
  };

  const canEditRow = (row: Row) => {
    if (isMaster) return true;
    if (isAdmin) return row.role !== 'master';
    return false;
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setEditNome(row.profile.nome ?? '');
    setEditRole(row.role);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    if (!isMaster && editRole === 'master') {
      toast.error('Admins não podem promover para Master.');
      return;
    }
    setEditSaving(true);
    // Update name
    if (editNome !== (editing.profile.nome ?? '')) {
      const { error: pErr } = await supabase
        .from('profiles').update({ nome: editNome }).eq('id', editing.profile.id);
      if (pErr) {
        setEditSaving(false);
        toast.error('Erro ao atualizar nome', { description: pErr.message });
        return;
      }
    }
    // Update role if changed
    if (editRole !== editing.role) {
      await supabase.from('user_roles').delete().eq('user_id', editing.profile.id);
      const { error: rErr } = await supabase
        .from('user_roles').insert({ user_id: editing.profile.id, role: editRole });
      if (rErr) {
        setEditSaving(false);
        toast.error('Erro ao atualizar permissão', { description: rErr.message });
        return;
      }
    }
    setEditSaving(false);
    toast.success('Usuário atualizado!');
    setEditing(null);
    load();
  };

  const handleResetPassword = async () => {
    if (!editing) return;
    let targetEmail = editing.profile.email ?? null;
    // Fallback: tenta resgatar o e-mail diretamente da tabela profiles
    if (!targetEmail) {
      const { data } = await supabase
        .from('profiles').select('email').eq('id', editing.profile.id).maybeSingle();
      targetEmail = (data as any)?.email ?? null;
    }
    if (!targetEmail) {
      toast.error('Usuário sem e-mail cadastrado.');
      return;
    }
    setResetting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${window.location.origin}/login`,
    });
    setResetting(false);
    if (error) {
      toast.error('Erro ao enviar redefinição', { description: error.message });
      return;
    }
    toast.success('E-mail de redefinição enviado!', {
      description: targetEmail,
    });
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
                      <TableHead className="text-right">Ações</TableHead>
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
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canEditRow(row)}
                            onClick={() => openEdit(row)}
                            title="Editar usuário"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!isMaster && !isAdmin && (
                <p className="text-xs text-muted-foreground mt-4">
                  Somente Master ou Admin podem alterar permissões.
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

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>E-mail</Label>
                <p className="mt-1 text-sm font-mono px-3 py-2 rounded-md bg-muted/50 text-muted-foreground">
                  {editing.profile.email ?? '— (sem e-mail no perfil)'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  O e-mail é gerenciado pela autenticação e não pode ser alterado aqui.
                </p>
              </div>
              <div>
                <Label>Nome</Label>
                <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Role</Label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as AppRole)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {(isMaster ? ROLES : (['funcionario','admin'] as AppRole[])).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {!isMaster && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Admins não podem promover para Master.
                  </p>
                )}
              </div>
              <div className="rounded-md border p-3 bg-muted/30">
                <p className="text-sm font-medium mb-2">Redefinir senha</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Envia um e-mail ao usuário com link para criar nova senha.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={resetting}
                >
                  {resetting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>) : 'Enviar e-mail de redefinição'}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={editSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editSaving}
              className="bg-confectionery-pink hover:bg-confectionery-pink/80"
            >
              {editSaving ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</>) : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ConfiguracoesPage;