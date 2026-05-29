'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2,
  ArrowLeft,
  Users,
  ClipboardList,
  Package,
  CreditCard,
  Clock,
  CheckCircle,
  AlertTriangle,
  Ban,
  Mail,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import Link from 'next/link';

const statusBadge: Record<string, string> = {
  'Ativo': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Atrasado': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Bloqueado': 'bg-red-500/10 text-red-500 border-red-500/20',
};

const PAYMENT_METHODS = ['Pix', 'Dinheiro', 'Cartão', 'Transferência'];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

export default function ShopDetailClient({ shopId }: { shopId: string }) {
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchShop = async () => {
    try {
      const res = await fetch(`/api/admin/shops/${shopId}`);
      const data = await res.json();
      setShop(data?.error ? null : data);
    } catch {
      setShop(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, [shopId]);

  const handlePayment = async (action: string, extra?: any) => {
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
      };
      toast.success(labels[action] ?? 'Atualizado!');
      setPaymentOpen(false);
      fetchShop();
    } catch {
      toast.error('Erro na operação');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (action: string) => {
    try {
      const res = await fetch('/api/admin/shops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shopId, action }),
      });
      if (!res.ok) throw new Error();
      toast.success('Status atualizado!');
      fetchShop();
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

  if (!shop) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Oficina não encontrada</p>
        <Link href="/admin/oficinas"><Button variant="outline" className="mt-4">Voltar</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <FadeIn>
        <div className="flex items-center gap-4">
          <Link href="/admin/oficinas">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display font-bold">{shop.name}</h1>
              <Badge className={statusBadge[shop.status] ?? ''}>{shop.status}</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">{shop.ownerName ?? 'Sem dono definido'}</p>
          </div>
        </div>
      </FadeIn>

      {/* Info Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono">{shop._count?.customers ?? 0}</p>
            <p className="text-xs text-muted-foreground">Clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ClipboardList className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono">{shop._count?.serviceOrders ?? 0}</p>
            <p className="text-xs text-muted-foreground">Ordens</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold font-mono">{shop._count?.products ?? 0}</p>
            <p className="text-xs text-muted-foreground">Produtos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CreditCard className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-lg font-bold font-mono">{formatCurrency(shop.planValue)}</p>
            <p className="text-xs text-muted-foreground">Plano {shop.plan}</p>
          </CardContent>
        </Card>
      </div>

      {/* Shop Details + Payment Control */}
      <div className="grid lg:grid-cols-2 gap-6">
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Dados da Oficina
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{shop.phone ?? 'Não informado'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{shop.users?.[0]?.email ?? 'Não informado'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>Cadastrado em: {new Date(shop.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t">
                {shop.status !== 'Ativo' && (
                  <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => changeStatus('activate')}>
                    <CheckCircle className="w-3.5 h-3.5" /> Ativar
                  </Button>
                )}
                {shop.status !== 'Atrasado' && (
                  <Button size="sm" variant="outline" className="gap-1 text-yellow-500" onClick={() => changeStatus('overdue')}>
                    <AlertTriangle className="w-3.5 h-3.5" /> Atrasado
                  </Button>
                )}
                {shop.status !== 'Bloqueado' && (
                  <Button size="sm" variant="outline" className="gap-1 text-red-500" onClick={() => changeStatus('block')}>
                    <Ban className="w-3.5 h-3.5" /> Bloquear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" /> Controle de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Último Pagamento</p>
                  <p className="font-medium">
                    {shop.lastPayment ? new Date(shop.lastPayment).toLocaleDateString('pt-BR') : 'Nenhum'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Próximo Vencimento</p>
                  <p className="font-medium font-mono">
                    {shop.dueDate ? new Date(shop.dueDate).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor do Plano</p>
                  <p className="font-bold font-mono text-primary">{formatCurrency(shop.planValue)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={statusBadge[shop.status] ?? ''}>{shop.status}</Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t">
                <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => {
                  setPayAmount(String(shop.planValue));
                  setPayMethod('');
                  setPayNotes('');
                  setPaymentOpen(true);
                }}>
                  <CheckCircle className="w-3.5 h-3.5" /> Marcar Pago
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-yellow-500" onClick={() => handlePayment('markOverdue')}>
                  <AlertTriangle className="w-3.5 h-3.5" /> Marcar Atrasado
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-red-500" onClick={() => handlePayment('block')}>
                  <Ban className="w-3.5 h-3.5" /> Bloquear
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Payment History */}
      <FadeIn delay={0.3}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(shop.paymentHistory ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum pagamento registrado</p>
              )}
              {(shop.paymentHistory ?? []).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div>
                    <p className="font-medium text-sm">{formatCurrency(p.amount)}</p>
                    <p className="text-xs text-muted-foreground">{p.method ?? '-'} {p.notes ? `- ${p.notes}` : ''}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={p.status === 'Pago' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}>
                      {p.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString('pt-BR') : new Date(p.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Activity Log */}
      <FadeIn delay={0.4}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico de Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(shop.activityLog ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade registrada</p>
              )}
              {(shop.activityLog ?? []).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div>
                    <Badge variant="outline" className="text-xs">{log.action}</Badge>
                    <p className="text-sm mt-1">{log.description}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription className="sr-only">Formulário de ação</DialogDescription>
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
              onClick={() => handlePayment('markPaid', { amount: parseFloat(payAmount) || shop.planValue, method: payMethod, notes: payNotes })}
              disabled={saving}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {saving ? 'Registrando...' : 'Confirmar Pagamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
