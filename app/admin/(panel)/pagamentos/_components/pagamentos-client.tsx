'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Ban,
  Calendar,
  Search,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';

const statusBadge: Record<string, string> = {
  'Ativo': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Atrasado': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Bloqueado': 'bg-red-500/10 text-red-500 border-red-500/20',
};

const PAYMENT_METHODS = ['Pix', 'Dinheiro', 'Cartão', 'Transferência'];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

export default function PagamentosClient() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
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
      toast.error('Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchShops(); }, [fetchShops]);

  const handleSearch = () => { setLoading(true); fetchShops(search, filterStatus); };
  const handleFilterChange = (s: string) => { setFilterStatus(s); setLoading(true); fetchShops(search, s); };

  const handlePayment = async (shopId: string, action: string, extra?: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, action, ...extra }),
      });
      if (!res.ok) throw new Error();
      const labels: Record<string, string> = {
        markPaid: 'Pagamento registrado!',
        markOverdue: 'Marcado como atrasado!',
        block: 'Acesso bloqueado!',
        updateDueDate: 'Vencimento atualizado!',
      };
      toast.success(labels[action] ?? 'Atualizado!');
      setPaymentOpen(false);
      setDueDateOpen(false);
      fetchShops(search, filterStatus);
    } catch {
      toast.error('Erro na operação');
    } finally {
      setSaving(false);
    }
  };

  const openPayDialog = (shop: any) => {
    setSelectedShop(shop);
    setPayAmount(String(shop.planValue));
    setPayMethod('');
    setPayNotes('');
    setPaymentOpen(true);
  };

  const openDueDateDialog = (shop: any) => {
    setSelectedShop(shop);
    setNewDueDate(shop.dueDate ? shop.dueDate.split('T')[0] : '');
    setDueDateOpen(true);
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
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Controle de Pagamentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os pagamentos de todas as oficinas</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar oficina..."
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
              <SelectItem value="Ativo">Ativo</SelectItem>
              <SelectItem value="Atrasado">Atrasado</SelectItem>
              <SelectItem value="Bloqueado">Bloqueado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleSearch}>Buscar</Button>
        </div>
      </FadeIn>

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
                      <CreditCard className="w-5 h-5 text-primary" />
                      <h3 className="font-bold">{shop.name}</h3>
                      <Badge className={statusBadge[shop.status] ?? ''}>{shop.status}</Badge>
                    </div>
                    <p className="font-bold font-mono text-primary">{formatCurrency(shop.planValue)}/mês</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Último Pagamento</p>
                      <p className="font-medium">{shop.lastPayment ? new Date(shop.lastPayment).toLocaleDateString('pt-BR') : 'Nenhum'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Próximo Vencimento</p>
                      <p className="font-medium font-mono">{shop.dueDate ? new Date(shop.dueDate).toLocaleDateString('pt-BR') : '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Plano</p>
                      <p className="font-medium">{shop.plan}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Dono</p>
                      <p className="font-medium">{shop.ownerName ?? '-'}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => openPayDialog(shop)}>
                      <CheckCircle className="w-3.5 h-3.5" /> Marcar Pago
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-yellow-500" onClick={() => handlePayment(shop.id, 'markOverdue')}>
                      <AlertTriangle className="w-3.5 h-3.5" /> Atrasado
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openDueDateDialog(shop)}>
                      <Calendar className="w-3.5 h-3.5" /> Alterar Vencimento
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-red-500" onClick={() => handlePayment(shop.id, 'block')}>
                      <Ban className="w-3.5 h-3.5" /> Bloquear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      {/* Pay Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento - {selectedShop?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" min={0} step={0.01} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Input value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="Opcional" />
            </div>
            <Button
              onClick={() => handlePayment(selectedShop?.id, 'markPaid', { amount: parseFloat(payAmount) || selectedShop?.planValue, method: payMethod, notes: payNotes })}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {saving ? 'Registrando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Due Date Dialog */}
      <Dialog open={dueDateOpen} onOpenChange={setDueDateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Vencimento - {selectedShop?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nova Data de Vencimento</Label>
              <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
            </div>
            <Button
              onClick={() => handlePayment(selectedShop?.id, 'updateDueDate', { dueDate: newDueDate })}
              disabled={saving || !newDueDate}
              className="w-full"
            >
              {saving ? 'Atualizando...' : 'Atualizar Vencimento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
