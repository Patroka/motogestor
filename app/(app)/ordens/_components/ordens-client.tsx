'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ClipboardList,
  Plus,
  Search,
  Edit,
  MessageCircle,
  ExternalLink,
  Filter,
  Trash2,
  Package,
  FileText,
  ScanBarcode,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import { MotoSelect } from '@/components/moto-select';

const STATUSES = [
  'Recebida',
  'Em análise',
  'Aguardando aprovação',
  'Em manutenção',
  'Pronta para retirada',
  'Entregue',
];

const PAYMENT_METHODS = ['Dinheiro', 'Pix', 'Cartão', 'Transferência'];

const statusColors: Record<string, string> = {
  'Recebida': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Em análise': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Aguardando aprovação': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Em manutenção': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Pronta para retirada': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Entregue': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  motorcycle: string | null;
  model: string | null;
  plate: string | null;
}

interface OrderItem {
  id?: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: number;
  customerId: string;
  motorcycle: string | null;
  model: string | null;
  plate: string | null;
  description: string;
  partsUsed: string | null;
  laborCost: number;
  partsCost: number;
  discount: number;
  totalCost: number;
  status: string;
  paymentMethod: string | null;
  entryDate: string;
  estimatedDate: string | null;
  customer: { name: string; phone: string | null };
  items?: OrderItem[];
}

interface ShopInfo {
  name: string;
  phone: string | null;
  address: string | null;
}

interface ProductResult {
  id: string;
  name: string;
  salePrice: number;
  quantity: number;
  compatibleMotorcycles?: string | null;
}

const parseCompatModels = (compat: string | null | undefined): string => {
  if (!compat) return '';
  try {
    const arr = JSON.parse(compat);
    if (!Array.isArray(arr)) return '';
    return arr.map((c: any) => {
      const models = Array.isArray(c.models) && c.models.length > 0 ? c.models.join(', ') : '';
      return models ? `${c.brand}: ${models}` : c.brand;
    }).join(' | ');
  } catch { return ''; }
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const formatPhone = (phone: string | null) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

export default function OrdensClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [shopInfo, setShopInfo] = useState<ShopInfo>({ name: 'MotoGestor Pro', phone: null, address: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formMotorcycle, setFormMotorcycle] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formPlate, setFormPlate] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLaborCost, setFormLaborCost] = useState<string | number>('');
  const [formProductCost, setFormProductCost] = useState('' as string | number);
  const [formPaymentMethod, setFormPaymentMethod] = useState('');
  const [formEstimatedDate, setFormEstimatedDate] = useState('');
  const [formStatus, setFormStatus] = useState('Recebida');
  const [formItems, setFormItems] = useState<OrderItem[]>([]);

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<ProductResult[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  // Barcode scanner
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeSearching, setBarcodeSearching] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const laborNum = parseFloat(String(formLaborCost)) || 0;
  const itemsCost = formItems.reduce((sum, it) => sum + (it.totalPrice || 0), 0);
  const manualProductCost = parseFloat(String(formProductCost)) || 0;
  const productNum = itemsCost > 0 ? itemsCost + manualProductCost : manualProductCost;
  const calculatedTotal = Math.max(laborNum + productNum, 0);

  const fetchOrders = useCallback(async (s?: string, status?: string) => {
    try {
      const params = new URLSearchParams();
      if (s) params.set('search', s);
      if (status && status !== 'all') params.set('status', status);
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Erro ao carregar ordens');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetch('/api/shop-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data?.name) setShopInfo({ name: data.name, phone: data.phone ?? null, address: data.address ?? null });
      })
      .catch(() => {});
  }, [fetchOrders, fetchCustomers]);

  const handleSearch = () => {
    setLoading(true);
    fetchOrders(search, filterStatus);
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setLoading(true);
    fetchOrders(search, status);
  };

  const resetForm = () => {
    setFormCustomerId('');
    setFormMotorcycle('');
    setFormModel('');
    setFormPlate('');
    setFormDescription('');
    setFormLaborCost('');
    setFormProductCost('');
    setFormPaymentMethod('');
    setFormEstimatedDate('');
    setFormStatus('Recebida');
    setFormItems([]);
    setProductSearch('');
    setProductResults([]);
  };

  const openNewForm = () => {
    setEditing(null);
    resetForm();
    setFormOpen(true);
  };

  const openEditForm = (order: Order) => {
    setEditing(order);
    setFormCustomerId(order.customerId);
    setFormMotorcycle(order.motorcycle ?? '');
    setFormModel(order.model ?? '');
    setFormPlate(order.plate ?? '');
    setFormDescription(order.description);
    setFormLaborCost(order.laborCost || '');
    setFormProductCost(order.partsCost || '');
    setFormPaymentMethod(order.paymentMethod ?? '');
    setFormEstimatedDate(order.estimatedDate ? order.estimatedDate.split('T')[0] : '');
    setFormStatus(order.status);
    setFormItems(order.items?.map(it => ({
      productId: it.productId ?? null,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
    })) ?? []);
    setProductSearch('');
    setProductResults([]);
    setFormOpen(true);
  };

  const handleCustomerSelect = (customerId: string) => {
    const c = customers.find((x) => x.id === customerId);
    setFormCustomerId(customerId);
    if (c) {
      setFormMotorcycle(c.motorcycle ?? '');
      setFormModel(c.model ?? '');
      setFormPlate(c.plate ?? '');
    }
  };

  // Product search
  const searchProducts = async () => {
    if (!productSearch.trim()) return;
    setSearchingProducts(true);
    try {
      const params = new URLSearchParams({ search: productSearch });
      if (formMotorcycle && formMotorcycle !== 'Outra') params.set('brand', formMotorcycle);
      if (formModel) params.set('model', formModel);
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProductResults(Array.isArray(data) ? data : []);
    } catch { setProductResults([]); }
    finally { setSearchingProducts(false); }
  };

  const addProductItem = (p: ProductResult) => {
    setFormItems([...formItems, {
      productId: p.id,
      description: p.name,
      quantity: 1,
      unitPrice: p.salePrice,
      totalPrice: p.salePrice,
    }]);
    setProductResults([]);
    setProductSearch('');
  };

  const addManualItem = () => {
    setFormItems([...formItems, {
      productId: null,
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    }]);
  };

  const lookupBarcode = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setBarcodeSearching(true);
    try {
      const res = await fetch(`/api/products?barcode=${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const product = await res.json();
        if (product && product.id) {
          // Check if already in list - if so, increment quantity
          const existingIdx = formItems.findIndex(it => it.productId === product.id);
          if (existingIdx >= 0) {
            const updated = [...formItems];
            updated[existingIdx].quantity += 1;
            updated[existingIdx].totalPrice = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
            setFormItems(updated);
            toast.success(`${product.name} - quantidade atualizada (${updated[existingIdx].quantity}x)`);
          } else {
            if ((product.quantity ?? 0) <= 0) {
              toast.warning(`${product.name} - estoque zerado!`);
            }
            setFormItems(prev => [...prev, {
              productId: product.id,
              description: product.name,
              quantity: 1,
              unitPrice: product.salePrice ?? 0,
              totalPrice: product.salePrice ?? 0,
            }]);
            toast.success(`${product.name} adicionado!`);
          }
        } else {
          toast.error('Produto nao encontrado com esse codigo de barras');
        }
      } else {
        toast.error('Produto nao encontrado com esse codigo de barras');
      }
    } catch {
      toast.error('Erro ao buscar produto');
    } finally {
      setBarcodeSearching(false);
      setBarcodeInput('');
      setTimeout(() => barcodeRef.current?.focus(), 100);
    }
  }, [formItems]);

  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...formItems];
    (updated[idx] as any)[field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      updated[idx].totalPrice = (updated[idx].quantity || 0) * (updated[idx].unitPrice || 0);
    }
    setFormItems(updated);
  };

  const removeItem = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!formCustomerId) { toast.error('Selecione um cliente'); return; }
    if (!formDescription.trim()) { toast.error('Descrição é obrigatória'); return; }
    setSaving(true);
    try {
      const body: any = {
        customerId: formCustomerId,
        motorcycle: formMotorcycle || null,
        model: formModel || null,
        plate: formPlate || null,
        description: formDescription,
        laborCost: laborNum,
        partsCost: productNum,
        discount: 0,
        paymentMethod: formPaymentMethod || null,
        estimatedDate: formEstimatedDate || null,
        items: formItems.length > 0 ? formItems : undefined,
      };
      if (editing) {
        body.id = editing.id;
        body.status = formStatus;
      }
      const res = await fetch('/api/orders', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(editing ? 'Ordem atualizada!' : 'Ordem criada!');
      setFormOpen(false);
      fetchOrders(search, filterStatus);
    } catch {
      toast.error('Erro ao salvar ordem');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (order: Order, newStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Status alterado para: ${newStatus}`);
      fetchOrders(search, filterStatus);
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const getTrackingUrl = (orderId: string) => {
    if (typeof window !== 'undefined') return `${window.location.origin}/tracking/${orderId}`;
    return `/tracking/${orderId}`;
  };

  const sendTrackingLink = (order: Order) => {
    const url = getTrackingUrl(order.id);
    const phone = formatPhone(order.customer?.phone);
    if (!phone) { toast.error('Cliente sem telefone cadastrado'); return; }
    const msg = encodeURIComponent(`Olá ${order.customer?.name ?? ''}, acompanhe o status da sua moto aqui: ${url}`);
    window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
  };

  const sendOSWhatsApp = (order: Order) => {
    const phone = formatPhone(order.customer?.phone);
    if (!phone) { toast.error('Cliente sem telefone cadastrado'); return; }
    const trackUrl = getTrackingUrl(order.id);
    const entryFmt = order.entryDate ? new Date(order.entryDate).toLocaleDateString('pt-BR') : '-';
    const estimFmt = order.estimatedDate ? new Date(order.estimatedDate).toLocaleDateString('pt-BR') : 'A definir';

    const lines: string[] = [
      `📋 *ORDEM DE SERVIÇO #${order.orderNumber}*`,
      `━━━━━━━━━━━━━━━━━━`,
      ``,
      `👤 *Cliente:* ${order.customer?.name ?? '-'}`,
      `🏍️ *Moto:* ${order.motorcycle ?? '-'}${order.model ? ' ' + order.model : ''}`,
      `🔖 *Placa:* ${order.plate ?? '-'}`,
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `📝 *Serviço:*`,
      `${order.description || '-'}`,
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `💰 *Valores:*`,
      `  Mão de obra: ${formatCurrency(order.laborCost)}`,
    ];

    if ((order.partsCost ?? 0) > 0) {
      lines.push(`  Produto: ${formatCurrency(order.partsCost)}`);
    }
    if ((order.discount ?? 0) > 0) {
      lines.push(`  Desconto: -${formatCurrency(order.discount)}`);
    }
    lines.push(
      `  *TOTAL: ${formatCurrency(order.totalCost)}*`,
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `📅 Entrada: ${entryFmt}`,
      `📅 Previsão: ${estimFmt}`,
      `📌 Status: *${order.status}*`,
      order.paymentMethod ? `💳 Pagamento: ${order.paymentMethod}` : '',
      ``,
      `🔗 Acompanhe online:`,
      trackUrl,
      ``,
      `━━━━━━━━━━━━━━━━━━`,
      `🔧 *${shopInfo.name}*`,
    );
    if (shopInfo.address) lines.push(`📍 ${shopInfo.address}`);
    if (shopInfo.phone) lines.push(`📞 ${shopInfo.phone}`);

    const msg = encodeURIComponent(lines.filter(Boolean).join('\n'));
    window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
  };

  const sendReadyMessage = (order: Order) => {
    const phone = formatPhone(order.customer?.phone);
    if (!phone) { toast.error('Cliente sem telefone cadastrado'); return; }
    const msg = encodeURIComponent(`Olá ${order.customer?.name ?? ''}, sua moto está pronta para retirada! Aguardamos você na oficina.`);
    window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank');
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
            <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Ordens de Serviço</h1>
            <p className="text-muted-foreground mt-1">{orders.length} ordem(ns) encontrada(s)</p>
          </div>
          <Button onClick={openNewForm} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Ordem
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, placa ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" sideOffset={4}>
              <SelectItem value="all">Todos</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleSearch}>Buscar</Button>
        </div>
      </FadeIn>

      <div className="grid gap-4">
        {orders.length === 0 && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma ordem encontrada</CardContent></Card>
        )}
        {orders.map((order) => (
          <FadeIn key={order.id}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4 lg:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-lg">OS #{order.orderNumber}</h3>
                      <Badge className={statusColors[order.status] ?? 'bg-gray-500/10 text-gray-400'}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xl font-bold font-mono text-primary">{formatCurrency(order.totalCost)}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Cliente: </span><span className="font-medium">{order.customer?.name ?? '-'}</span></div>
                    <div><span className="text-muted-foreground">Moto: </span><span className="font-medium">{order.motorcycle ?? '-'} {order.model ?? ''}</span></div>
                    <div><span className="text-muted-foreground">Placa: </span><Badge variant="outline" className="font-mono text-xs">{order.plate ?? '-'}</Badge></div>
                  </div>

                  <p className="text-sm text-muted-foreground">{order.description}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>Mão de obra: <span className="font-mono">{formatCurrency(order.laborCost)}</span></div>
                    {(order.partsCost ?? 0) > 0 && <div>Produto: <span className="font-medium">{formatCurrency(order.partsCost)}</span></div>}
                    <div>Pagamento: <span className="font-medium">{order.paymentMethod ?? '-'}</span></div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button size="sm" variant="outline" onClick={() => openEditForm(order)} className="gap-1">
                      <Edit className="w-3.5 h-3.5" /> Editar
                    </Button>

                    {order.status !== 'Entregue' && (
                      <Select onValueChange={(val) => updateStatus(order, val)}>
                        <SelectTrigger className="h-8 w-auto text-xs">
                          <SelectValue placeholder="Alterar status" />
                        </SelectTrigger>
                        <SelectContent position="popper" side="bottom" sideOffset={4}>
                          {STATUSES.filter((s) => s !== order.status).map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Button size="sm" variant="outline" onClick={() => sendOSWhatsApp(order)} className="gap-1 text-green-600 border-green-600/30 hover:bg-green-50 dark:hover:bg-green-950">
                      <FileText className="w-3.5 h-3.5" /> Enviar OS
                    </Button>

                    <Button size="sm" variant="outline" onClick={() => sendTrackingLink(order)} className="gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> Enviar Link
                    </Button>

                    {order.status === 'Pronta para retirada' && (
                      <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700" onClick={() => sendReadyMessage(order)}>
                        <MessageCircle className="w-3.5 h-3.5" /> Avisar Cliente
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Editar OS #${editing.orderNumber}` : 'Nova Ordem de Serviço'}</DialogTitle>
          <DialogDescription className="sr-only">Formulário de ação</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente *</Label>
              <Select value={formCustomerId} onValueChange={handleCustomerSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" sideOffset={4}>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <MotoSelect
              motorcycle={formMotorcycle}
              model={formModel}
              onMotorcycleChange={setFormMotorcycle}
              onModelChange={setFormModel}
            />
            <div>
              <Label>Placa</Label>
              <Input value={formPlate} onChange={(e) => setFormPlate(e.target.value.toUpperCase())} />
            </div>

            <div>
              <Label>Descrição do Serviço *</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descreva o serviço a ser realizado..." />
            </div>

            {/* ============ BARCODE SCANNER + ITEMS ============ */}
            <div className="space-y-3 p-3 rounded-lg border border-dashed border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2">
                <ScanBarcode className="w-5 h-5 text-primary" />
                <Label className="text-sm font-semibold text-primary">Pecas (Codigo de Barras)</Label>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={barcodeRef}
                    placeholder="Escaneie ou digite o codigo de barras..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        lookupBarcode(barcodeInput);
                      }
                    }}
                    disabled={barcodeSearching}
                    className="pr-10"
                  />
                  {barcodeSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                  )}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => lookupBarcode(barcodeInput)}
                  disabled={barcodeSearching || !barcodeInput.trim()}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {/* Busca por nome */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ou busque pelo nome da peca..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchProducts())}
                />
                <Button type="button" size="sm" variant="outline" onClick={searchProducts} disabled={searchingProducts}>
                  {searchingProducts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {/* Product search results */}
              {productResults.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2 bg-background">
                  {productResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left text-sm p-2 rounded hover:bg-muted flex justify-between items-center"
                      onClick={() => addProductItem(p)}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-xs font-mono text-muted-foreground ml-2 whitespace-nowrap">
                        {formatCurrency(p.salePrice)} | Est: {p.quantity}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Items list */}
              {formItems.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Itens adicionados:</Label>
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-md bg-background border text-sm">
                      <div className="flex-1 min-w-0">
                        {item.productId ? (
                          <span className="font-medium truncate block">{item.description}</span>
                        ) : (
                          <Input
                            placeholder="Descricao"
                            value={item.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                            className="h-7 text-xs"
                          />
                        )}
                      </div>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-14 h-7 text-xs text-center"
                      />
                      <span className="text-xs text-muted-foreground">x</span>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-20 h-7 text-xs"
                      />
                      <span className="text-xs font-mono font-bold whitespace-nowrap min-w-[70px] text-right">
                        {formatCurrency(item.totalPrice)}
                      </span>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeItem(idx)}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-1 text-sm font-semibold">
                    <span>Subtotal pecas:</span>
                    <span className="font-mono text-primary">{formatCurrency(itemsCost)}</span>
                  </div>
                </div>
              )}

              <Button type="button" size="sm" variant="ghost" onClick={addManualItem} className="gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" /> Adicionar item manual
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mao de Obra (R$)</Label>
                <Input type="number" min={0} step={0.01} placeholder="0,00" value={formLaborCost} onChange={(e) => setFormLaborCost(e.target.value)} />
              </div>
              <div>
                <Label>Outros custos (R$)</Label>
                <Input type="number" min={0} step={0.01} placeholder="0,00" value={formProductCost} onChange={(e) => setFormProductCost(e.target.value)} />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-primary/10">
              <div className="flex flex-wrap justify-between text-xs text-muted-foreground gap-1">
                <span>Mao de obra: {formatCurrency(laborNum)}</span>
                {itemsCost > 0 && <span>Pecas: {formatCurrency(itemsCost)}</span>}
                {manualProductCost > 0 && <span>Outros: {formatCurrency(manualProductCost)}</span>}
              </div>
              <div className="text-center mt-1">
                <span className="text-sm text-muted-foreground">Total: </span>
                <span className="text-xl font-bold font-mono text-primary">{formatCurrency(calculatedTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={formPaymentMethod} onValueChange={setFormPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4}>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data Prevista</Label>
                <Input type="date" value={formEstimatedDate} onChange={(e) => setFormEstimatedDate(e.target.value)} />
              </div>
            </div>

            {editing && (
              <div>
                <Label>Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4}>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Salvando...' : editing ? 'Atualizar Ordem' : 'Criar Ordem'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
