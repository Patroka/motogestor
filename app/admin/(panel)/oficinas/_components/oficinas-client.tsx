'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2,
  Plus,
  Search,
  Edit,
  CheckCircle,
  AlertTriangle,
  Ban,
  Eye,
  Filter,
  Phone,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import Link from 'next/link';

const PLANS = ['Profissional', 'Premium'];
const STATUSES = ['Ativo', 'Atrasado', 'Bloqueado'];

const statusBadge: Record<string, string> = {
  'Ativo': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Atrasado': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Bloqueado': 'bg-red-500/10 text-red-500 border-red-500/20',
};

interface Shop {
  id: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  plan: string;
  planValue: number;
  status: string;
  dueDate: string | null;
  createdAt: string;
  users: Array<{ email: string; name: string }>;
  _count: { customers: number; serviceOrders: number };
}

const emptyForm = {
  shopName: '',
  ownerName: '',
  whatsapp: '',
  email: '',
  password: '',
  plan: 'Profissional',
  planValue: '149.90',
  dueDate: '',
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

export default function OficinasClient() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editForm, setEditForm] = useState<any>({});
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchShops = useCallback(async (s?: string, status?: string) => {
    try {
      const params = new URLSearchParams();
      if (s) params.set('search', s);
      if (status && status !== 'all') params.set('status', status);
      const res = await fetch(`/api/admin/shops?${params.toString()}`);
      const data = await res.json();
      setShops(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Erro ao carregar oficinas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleSearch = () => {
    setLoading(true);
    fetchShops(search, filterStatus);
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setLoading(true);
    fetchShops(search, status);
  };

  const handleCreate = async () => {
    if (!form.shopName || !form.email || !form.password) {
      toast.error('Nome, email e senha são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.error ?? 'Erro'); return; }
      toast.success('Oficina criada com sucesso!');
      setFormOpen(false);
      setForm(emptyForm);
      fetchShops(search, filterStatus);
    } catch {
      toast.error('Erro ao criar oficina');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (shop: Shop) => {
    setEditingShop(shop);
    setEditForm({
      name: shop.name,
      ownerName: shop.ownerName ?? '',
      phone: shop.phone ?? '',
      plan: shop.plan,
      planValue: String(shop.planValue),
      dueDate: shop.dueDate ? shop.dueDate.split('T')[0] : '',
      status: shop.status,
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingShop) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/shops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingShop.id, ...editForm }),
      });
      if (!res.ok) throw new Error();
      toast.success('Oficina atualizada!');
      setEditOpen(false);
      fetchShops(search, filterStatus);
    } catch {
      toast.error('Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (shopId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/shops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shopId, action }),
      });
      if (!res.ok) throw new Error();
      const labels: Record<string, string> = { activate: 'Ativada', overdue: 'Marcada como atrasada', block: 'Bloqueada' };
      toast.success(`Oficina ${labels[action] ?? 'atualizada'}!`);
      fetchShops(search, filterStatus);
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <FadeIn>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Gestão de Oficinas</h1>
            <p className="text-muted-foreground mt-1">{shops.length} oficina(s) cadastrada(s)</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setFormOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Oficina
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou WhatsApp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleSearch}>Buscar</Button>
        </div>
      </FadeIn>

      {/* Shops list */}
      <div className="grid gap-4">
        {shops.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma oficina encontrada</CardContent></Card>
        )}
        {shops.map((shop) => (
          <FadeIn key={shop.id}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 lg:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-lg">{shop.name}</h3>
                      <Badge className={statusBadge[shop.status] ?? ''}>{shop.status}</Badge>
                    </div>
                    <Badge variant="outline">{shop.plan} - {formatCurrency(shop.planValue)}</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Dono: </span>
                      <span className="font-medium">{shop.ownerName ?? '-'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{shop.phone ?? '-'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs">{shop.users?.[0]?.email ?? '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vencimento: </span>
                      <span className="font-mono text-xs">
                        {shop.dueDate ? new Date(shop.dueDate).toLocaleDateString('pt-BR') : '-'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Link href={`/admin/oficinas/${shop.id}`}>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Eye className="w-3.5 h-3.5" /> Detalhes
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openEdit(shop)}>
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </Button>
                    {shop.status !== 'Ativo' && (
                      <Button size="sm" variant="outline" className="gap-1 text-green-500 border-green-500/30 hover:bg-green-500/10" onClick={() => changeStatus(shop.id, 'activate')}>
                        <CheckCircle className="w-3.5 h-3.5" /> Ativar
                      </Button>
                    )}
                    {shop.status !== 'Atrasado' && (
                      <Button size="sm" variant="outline" className="gap-1 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10" onClick={() => changeStatus(shop.id, 'overdue')}>
                        <AlertTriangle className="w-3.5 h-3.5" /> Atrasado
                      </Button>
                    )}
                    {shop.status !== 'Bloqueado' && (
                      <Button size="sm" variant="outline" className="gap-1 text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={() => changeStatus(shop.id, 'block')}>
                        <Ban className="w-3.5 h-3.5" /> Bloquear
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Oficina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Oficina *</Label>
              <Input value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} placeholder="Moto Center Express" />
            </div>
            <div>
              <Label>Nome do Dono</Label>
              <Input value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} placeholder="João Silva" />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <Label>Email de Acesso *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="oficina@email.com" />
            </div>
            <div>
              <Label>Senha *</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Senha de acesso" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plano</Label>
                <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" min={0} step={0.01} value={form.planValue} onChange={(e) => setForm({ ...form, planValue: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Data de Vencimento</Label>
              <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <Button onClick={handleCreate} disabled={saving} className="w-full">
              {saving ? 'Criando...' : 'Criar Conta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Oficina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Oficina</Label>
              <Input value={editForm.name ?? ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Nome do Dono</Label>
              <Input value={editForm.ownerName ?? ''} onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })} />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={editForm.phone ?? ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plano</Label>
                <Select value={editForm.plan ?? 'Profissional'} onValueChange={(v) => setEditForm({ ...editForm, plan: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" min={0} step={0.01} value={editForm.planValue ?? ''} onChange={(e) => setEditForm({ ...editForm, planValue: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={editForm.status ?? 'Ativo'} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input type="date" value={editForm.dueDate ?? ''} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} />
              </div>
            </div>
            <Button onClick={handleEdit} disabled={saving} className="w-full">
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
