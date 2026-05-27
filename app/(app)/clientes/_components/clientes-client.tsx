'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Users,
  Plus,
  Search,
  Edit,
  MessageCircle,
  Phone,
  Bike,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import { MotoSelect } from '@/components/moto-select';

interface OrderItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ServiceOrderSummary {
  id: string;
  orderNumber: number;
  status: string;
  totalCost: number;
  laborCost: number;
  partsCost: number;
  description: string;
  partsUsed: string | null;
  paymentMethod: string | null;
  entryDate: string;
  items?: OrderItem[];
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  motorcycle: string | null;
  model: string | null;
  plate: string | null;
  observations: string | null;
  serviceOrders: ServiceOrderSummary[];
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const formatPhone = (phone: string | null) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

const generateWhatsAppLink = (phone: string | null, message: string) => {
  const num = formatPhone(phone);
  if (!num) return '#';
  const encoded = encodeURIComponent(message);
  return `https://wa.me/55${num}?text=${encoded}`;
};

const emptyForm = {
  name: '',
  phone: '',
  motorcycle: '',
  model: '',
  plate: '',
  observations: '',
};

export default function ClientesClient() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [customMessage, setCustomMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCustomers = useCallback(async (q?: string) => {
    try {
      const url = q ? `/api/customers?search=${encodeURIComponent(q)}` : '/api/customers';
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = () => {
    setLoading(true);
    fetchCustomers(search);
  };

  const openNewForm = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEditForm = (customer: Customer) => {
    setEditing(customer);
    setForm({
      name: customer.name ?? '',
      phone: customer.phone ?? '',
      motorcycle: customer.motorcycle ?? '',
      model: customer.model ?? '',
      plate: customer.plate ?? '',
      observations: customer.observations ?? '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? { id: editing.id, ...form } : form;
      const res = await fetch('/api/customers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(editing ? 'Cliente atualizado!' : 'Cliente cadastrado!');
      setFormOpen(false);
      fetchCustomers(search);
    } catch {
      toast.error('Erro ao salvar cliente');
    } finally {
      setSaving(false);
    }
  };

  const openHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setHistoryOpen(true);
  };

  const openWhatsApp = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomMessage('');
    setWhatsappOpen(true);
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
            <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground mt-1">{customers.length} cliente(s) cadastrado(s)</p>
          </div>
          <Button onClick={openNewForm} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Cliente
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou placa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={handleSearch}>Buscar</Button>
        </div>
      </FadeIn>

      <div className="grid gap-4">
        {customers.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum cliente encontrado</CardContent></Card>
        )}
        {customers.map((customer) => (
          <FadeIn key={customer.id}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-lg">{customer.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />{customer.phone}
                        </span>
                      )}
                      {customer.motorcycle && (
                        <span className="flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5" />{customer.motorcycle} {customer.model ?? ''}
                        </span>
                      )}
                      {customer.plate && (
                        <Badge variant="outline" className="font-mono text-xs">{customer.plate}</Badge>
                      )}
                    </div>
                    {customer.observations && (
                      <p className="text-xs text-muted-foreground mt-1">{customer.observations}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditForm(customer)} className="gap-1">
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openHistory(customer)} className="gap-1">
                      <Clock className="w-3.5 h-3.5" /> Histórico
                    </Button>
                    <Button size="sm" variant="default" onClick={() => openWhatsApp(customer)} className="gap-1 bg-green-600 hover:bg-green-700">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
            </div>
            <div>
              <Label>Telefone / WhatsApp</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
            </div>
            <MotoSelect
              motorcycle={form.motorcycle}
              model={form.model}
              onMotorcycleChange={(v) => setForm(prev => ({ ...prev, motorcycle: v }))}
              onModelChange={(v) => setForm(prev => ({ ...prev, model: v }))}
            />
            <div>
              <Label>Placa</Label>
              <Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value.toUpperCase() })} placeholder="ABC-1234" />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} placeholder="Observações sobre o cliente..." />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Cadastrar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historico - {selectedCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(!selectedCustomer?.serviceOrders || selectedCustomer.serviceOrders.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum servico registrado</p>
            )}
            {selectedCustomer?.serviceOrders?.map((order) => {
              // Parse description into list items (split by comma, newline, or common separators)
              const descItems = order.description
                ? order.description.split(/[,\n]+/).map((s: string) => s.trim()).filter(Boolean)
                : [];

              return (
                <div key={order.id} className="rounded-lg border bg-accent/30 overflow-hidden">
                  {/* Header */}
                  <div className="flex justify-between items-center px-3 py-2 bg-accent/50 border-b">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">OS #{order.orderNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(order.entryDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{order.status}</Badge>
                      <span className="text-sm font-bold font-mono text-primary">{formatCurrency(order.totalCost)}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-3 py-2 space-y-2">
                    {/* Servicos listados */}
                    {descItems.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Servicos</p>
                        <ul className="space-y-0.5">
                          {descItems.map((item: string, idx: number) => (
                            <li key={idx} className="text-sm flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Pecas/Itens da OS */}
                    {order.items && order.items.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pecas</p>
                        <ul className="space-y-0.5">
                          {order.items.map((it: OrderItem, idx: number) => (
                            <li key={idx} className="text-sm flex justify-between">
                              <span className="flex items-start gap-1.5">
                                <span className="text-orange-400 mt-0.5">•</span>
                                <span>{it.description}{it.quantity > 1 ? ` (${it.quantity}x)` : ''}</span>
                              </span>
                              <span className="font-mono text-xs text-muted-foreground">{formatCurrency(it.totalPrice)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Valores */}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground pt-1 border-t border-dashed">
                      {order.laborCost > 0 && <span>Mao de obra: <span className="font-mono">{formatCurrency(order.laborCost)}</span></span>}
                      {order.partsCost > 0 && <span>Pecas: <span className="font-mono">{formatCurrency(order.partsCost)}</span></span>}
                      {order.paymentMethod && <span>Pgto: {order.paymentMethod}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Dialog */}
      <Dialog open={whatsappOpen} onOpenChange={setWhatsappOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-500" />
              WhatsApp - {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <a
              href={generateWhatsAppLink(
                selectedCustomer?.phone ?? null,
                `Olá ${selectedCustomer?.name ?? ''}, sua moto está pronta para retirada! Aguardamos você na oficina.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" variant="default">
                🏍️ Avisar Moto Pronta
              </Button>
            </a>
            <a
              href={generateWhatsAppLink(
                selectedCustomer?.phone ?? null,
                `Olá ${selectedCustomer?.name ?? ''}, está na hora de fazer a revisão da sua moto! Agende seu horário conosco.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full gap-2" variant="outline">
                🔧 Lembrete de Revisão
              </Button>
            </a>
            <div className="border-t pt-3">
              <Label>Mensagem Personalizada</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="mt-2"
              />
              <a
                href={customMessage.trim()
                  ? generateWhatsAppLink(selectedCustomer?.phone ?? null, customMessage)
                  : '#'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2"
              >
                <Button
                  className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  disabled={!customMessage.trim()}
                >
                  <MessageCircle className="w-4 h-4" /> Enviar Personalizada
                </Button>
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
