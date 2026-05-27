'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Lock,
  Unlock,
  Clock,
  Wallet,
  CreditCard,
  Smartphone,
  Banknote,
  ChevronDown,
  ChevronUp,
  History,
  RotateCcw,
  Trash2,
  AlertTriangle,
  Search,
  ScanBarcode,
  X,
  Package,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { FadeIn, SlideIn } from '@/components/ui/animate';

const PAYMENT_METHODS = ['Dinheiro', 'Pix', 'Cartão'];

const METHOD_ICON: Record<string, React.ReactNode> = {
  'Dinheiro': <Banknote className="w-4 h-4 text-green-500" />,
  'Pix': <Smartphone className="w-4 h-4 text-cyan-500" />,
  'Cartão': <CreditCard className="w-4 h-4 text-violet-500" />,
  'Outros': <DollarSign className="w-4 h-4 text-muted-foreground" />,
};

const METHOD_COLOR: Record<string, string> = {
  'Dinheiro': 'text-green-500',
  'Pix': 'text-cyan-500',
  'Cartão': 'text-violet-500',
  'Outros': 'text-muted-foreground',
};

interface CashData {
  session: any;
  balance: number;
  totalEntradas: number;
  totalSaidas: number;
  byMethod: Record<string, { entradas: number; saidas: number }>;
  closedSessions: any[];
}

export default function CaixaClient() {
  const [data, setData] = useState<CashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [movDialog, setMovDialog] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [movForm, setMovForm] = useState({ type: 'entrada', amount: '', description: '', paymentMethod: '' });
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Product search for movement
  interface MovItem {
    productId: string | null;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }
  const [movItems, setMovItems] = useState<MovItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeSearching, setBarcodeSearching] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/cash');
      const d = await res?.json?.();
      setData(d ?? null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpen = async () => {
    try {
      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open', openingAmount: parseFloat(openingAmount) || 0 }),
      });
      if (res.ok) {
        toast.success('Caixa aberto!');
        setOpenDialog(false);
        fetchData();
      } else {
        const err = await res?.json?.();
        toast.error(err?.error ?? 'Erro ao abrir caixa');
      }
    } catch {
      toast.error('Erro ao abrir caixa');
    }
  };

  const handleClose = async () => {
    try {
      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', closingAmount: parseFloat(closingAmount) || 0 }),
      });
      if (res.ok) {
        toast.success('Caixa fechado!');
        setCloseDialog(false);
        fetchData();
      } else {
        const err = await res?.json?.();
        toast.error(err?.error ?? 'Erro ao fechar');
      }
    } catch {
      toast.error('Erro ao fechar');
    }
  };

  // Product search by name
  const searchProducts = useCallback(async (query: string) => {
    if (!query || query.length < 2) { setProductResults([]); return; }
    setSearchingProducts(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setProductResults(data?.products ?? data ?? []);
      }
    } catch { setProductResults([]); }
    finally { setSearchingProducts(false); }
  }, []);

  const handleProductSearchChange = (val: string) => {
    setProductSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchProducts(val), 300);
  };

  const lookupBarcode = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setBarcodeSearching(true);
    try {
      const res = await fetch(`/api/products?barcode=${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const product = await res.json();
        if (product?.id) {
          addProductToItems(product);
          toast.success(`${product.name} adicionado!`);
        } else {
          toast.error('Produto não encontrado');
        }
      } else {
        toast.error('Produto não encontrado');
      }
    } catch { toast.error('Erro na busca'); }
    finally {
      setBarcodeSearching(false);
      setBarcodeInput('');
      setTimeout(() => barcodeRef.current?.focus(), 100);
    }
  }, []);

  const addProductToItems = (product: any) => {
    setMovItems(prev => {
      const existIdx = prev.findIndex(i => i.productId === product.id);
      if (existIdx >= 0) {
        const updated = [...prev];
        updated[existIdx].quantity += 1;
        updated[existIdx].totalPrice = updated[existIdx].quantity * updated[existIdx].unitPrice;
        return updated;
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.salePrice ?? 0,
        totalPrice: product.salePrice ?? 0,
      }];
    });
    setProductSearch('');
    setProductResults([]);
  };

  const updateMovItem = (idx: number, field: string, value: any) => {
    setMovItems(prev => {
      const updated = [...prev];
      (updated[idx] as any)[field] = value;
      if (field === 'quantity' || field === 'unitPrice') {
        updated[idx].totalPrice = (updated[idx].quantity || 0) * (updated[idx].unitPrice || 0);
      }
      return updated;
    });
  };

  const removeMovItem = (idx: number) => {
    setMovItems(prev => prev.filter((_, i) => i !== idx));
  };

  const movItemsTotal = movItems.reduce((s, i) => s + (i.totalPrice || 0), 0);

  const handleMovement = async () => {
    const manualAmt = parseFloat(movForm?.amount) || 0;
    const totalAmt = movItemsTotal + manualAmt;
    if (totalAmt <= 0) { toast.error('Valor inválido'); return; }
    if (!movForm?.description && movItems.length === 0) { toast.error('Descrição obrigatória'); return; }

    // Build description from items + manual
    let desc = movForm?.description || '';
    if (movItems.length > 0) {
      const itemDescs = movItems.map(i => `${i.name} x${i.quantity}`);
      desc = desc ? `${itemDescs.join(', ')} | ${desc}` : itemDescs.join(', ');
    }

    try {
      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'movement',
          ...movForm,
          amount: totalAmt,
          description: desc,
          items: movItems.filter(i => i.productId && i.quantity > 0).map(i => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });
      if (res.ok) {
        toast.success('Movimento registrado!');
        setMovDialog(false);
        setMovForm({ type: 'entrada', amount: '', description: '', paymentMethod: '' });
        setMovItems([]);
        setProductSearch('');
        setProductResults([]);
        fetchData();
      } else {
        const err = await res?.json?.();
        toast.error(err?.error ?? 'Erro');
      }
    } catch {
      toast.error('Erro ao registrar');
    }
  };

  const formatCurrency = (v: number | null | undefined) => {
    const num = v ?? 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleString('pt-BR'); } catch { return '—'; }
  };

  const isOpen = data?.session?.status === 'open';
  const closingNum = parseFloat(closingAmount) || 0;

  const handleReopen = async (sessionId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reopen', sessionId }),
      });
      if (res.ok) {
        toast.success('Caixa reaberto com sucesso!');
        setExpandedSession(null);
        fetchData();
      } else {
        const err = await res?.json?.();
        toast.error(err?.error ?? 'Erro ao reabrir');
      }
    } catch {
      toast.error('Erro ao reabrir caixa');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', sessionId }),
      });
      if (res.ok) {
        toast.success('Caixa excluído com sucesso!');
        setConfirmDelete(null);
        setExpandedSession(null);
        fetchData();
      } else {
        const err = await res?.json?.();
        toast.error(err?.error ?? 'Erro ao excluir');
      }
    } catch {
      toast.error('Erro ao excluir caixa');
    } finally {
      setActionLoading(false);
    }
  };

  // Compute byMethod for a closed session
  const getSessionByMethod = (session: any) => {
    const bm: Record<string, { entradas: number; saidas: number }> = {};
    (session?.movements ?? []).forEach((m: any) => {
      const method = m?.paymentMethod || 'Outros';
      if (!bm[method]) bm[method] = { entradas: 0, saidas: 0 };
      if (m?.type === 'entrada') bm[method].entradas += m?.amount ?? 0;
      else bm[method].saidas += m?.amount ?? 0;
    });
    return bm;
  };

  const getSessionTotals = (session: any) => {
    let entradas = 0;
    let saidas = 0;
    (session?.movements ?? []).forEach((m: any) => {
      if (m?.type === 'entrada') entradas += m?.amount ?? 0;
      else saidas += m?.amount ?? 0;
    });
    return { entradas, saidas };
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-primary" />
              Controle de Caixa
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie entradas e saídas</p>
          </div>
          <div className="flex gap-2">
            {!isOpen ? (
              <Button onClick={() => { setOpeningAmount(''); setOpenDialog(true); }} className="gap-2">
                <Unlock className="w-4 h-4" /> Abrir Caixa
              </Button>
            ) : (
              <>
                <Button onClick={() => setMovDialog(true)} variant="outline" className="gap-2">
                  <ArrowUpCircle className="w-4 h-4" /> Registrar Movimento
                </Button>
                <Button onClick={() => { setClosingAmount(''); setCloseDialog(true); }} variant="destructive" className="gap-2">
                  <Lock className="w-4 h-4" /> Fechar Caixa
                </Button>
              </>
            )}
          </div>
        </div>
      </FadeIn>

      {isOpen ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SlideIn from="bottom" delay={0}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <ArrowUpCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">Entradas</span>
                  </div>
                  <p className="text-2xl font-bold font-mono text-green-500">{formatCurrency(data?.totalEntradas)}</p>
                </CardContent>
              </Card>
            </SlideIn>
            <SlideIn from="bottom" delay={0.1}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <ArrowDownCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">Saídas</span>
                  </div>
                  <p className="text-2xl font-bold font-mono text-red-500">{formatCurrency(data?.totalSaidas)}</p>
                </CardContent>
              </Card>
            </SlideIn>
            <SlideIn from="bottom" delay={0.2}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Saldo Atual</span>
                  </div>
                  <p className="text-2xl font-bold font-mono">{formatCurrency(data?.balance)}</p>
                </CardContent>
              </Card>
            </SlideIn>
          </div>

          {/* Payment Method Dashboard */}
          {data?.byMethod && Object.keys(data.byMethod).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Resumo por Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(data.byMethod).map(([method, vals]) => (
                    <div key={method} className="p-3 rounded-lg bg-accent/50 space-y-1">
                      <div className="flex items-center gap-2 font-medium text-sm">
                        {METHOD_ICON[method] || METHOD_ICON['Outros']}
                        {method}
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Entradas</span>
                        <span className={`font-mono font-semibold text-green-500`}>+{formatCurrency(vals.entradas)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Saídas</span>
                        <span className={`font-mono font-semibold text-red-500`}>-{formatCurrency(vals.saidas)}</span>
                      </div>
                      <div className="flex justify-between text-xs border-t border-border pt-1">
                        <span className="text-muted-foreground font-medium">Líquido</span>
                        <span className={`font-mono font-bold ${METHOD_COLOR[method] || METHOD_COLOR['Outros']}`}>
                          {formatCurrency(vals.entradas - vals.saidas)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Movements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Movimentações do Dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(data?.session?.movements ?? [])?.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Nenhuma movimentação registrada</p>
                ) : (
                  (data?.session?.movements ?? [])?.map?.((m: any) => (
                    <div key={m?.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                      <div className="flex items-center gap-3">
                        {m?.type === 'entrada' ? (
                          <ArrowUpCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{m?.description ?? ''}</p>
                          <p className="text-xs text-muted-foreground">
                            {m?.paymentMethod ? `${m.paymentMethod} • ` : ''}{formatDate(m?.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`font-mono font-bold ${m?.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                        {m?.type === 'entrada' ? '+' : '-'}{formatCurrency(m?.amount)}
                      </span>
                    </div>
                  )) ?? []
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-bold">Caixa Fechado</h2>
            <p className="text-muted-foreground mt-1">Abra o caixa para começar a registrar movimentações</p>
          </CardContent>
        </Card>
      )}

      {/* Closed Sessions History */}
      {(data?.closedSessions ?? [])?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Histórico de Fechamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.closedSessions ?? [])?.map?.((s: any) => {
                const isExpanded = expandedSession === s?.id;
                const sTotals = getSessionTotals(s);
                const sByMethod = getSessionByMethod(s);
                return (
                  <div key={s?.id} className="rounded-lg bg-accent/50 overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-3 hover:bg-accent/70 transition-colors"
                      onClick={() => setExpandedSession(isExpanded ? null : s?.id)}
                    >
                      <div className="text-left">
                        <p className="text-sm font-medium">{formatDate(s?.closedAt)}</p>
                        <p className="text-xs text-muted-foreground">Abertura: {formatCurrency(s?.openingAmount)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-mono font-bold text-sm">{formatCurrency(s?.closingAmount)}</p>
                          {(s?.difference ?? 0) !== 0 && (
                            <p className={`text-xs font-mono ${(s?.difference ?? 0) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              Dif: {formatCurrency(s?.difference)}
                            </p>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border px-3 pb-3 space-y-3">
                        {/* Method Summary */}
                        {Object.keys(sByMethod).length > 0 && (
                          <div className="pt-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Por Forma de Pagamento</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {Object.entries(sByMethod).map(([method, vals]) => (
                                <div key={method} className="p-2 rounded-md bg-background space-y-0.5">
                                  <div className="flex items-center gap-1.5 text-xs font-medium">
                                    {METHOD_ICON[method] || METHOD_ICON['Outros']}
                                    {method}
                                  </div>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-green-500 font-mono">+{formatCurrency(vals.entradas)}</span>
                                    <span className="text-red-500 font-mono">-{formatCurrency(vals.saidas)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Totals */}
                        <div className="pt-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Total Entradas</span>
                            <span className="font-mono text-green-500">+{formatCurrency(sTotals.entradas)}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Total Saídas</span>
                            <span className="font-mono text-red-500">-{formatCurrency(sTotals.saidas)}</span>
                          </div>
                        </div>

                        {/* Movements List */}
                        {(s?.movements ?? []).length > 0 && (
                          <div className="pt-2">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Movimentações</p>
                            <div className="space-y-1 max-h-60 overflow-y-auto">
                              {(s?.movements ?? []).map((m: any) => (
                                <div key={m?.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-background text-xs">
                                  <div className="flex items-center gap-2">
                                    {m?.type === 'entrada' ? (
                                      <ArrowUpCircle className="w-3.5 h-3.5 text-green-500" />
                                    ) : (
                                      <ArrowDownCircle className="w-3.5 h-3.5 text-red-500" />
                                    )}
                                    <span>{m?.description ?? ''}</span>
                                    {m?.paymentMethod && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{m.paymentMethod}</Badge>
                                    )}
                                  </div>
                                  <span className={`font-mono font-semibold ${m?.type === 'entrada' ? 'text-green-500' : 'text-red-500'}`}>
                                    {m?.type === 'entrada' ? '+' : '-'}{formatCurrency(m?.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-3 border-t border-border">
                          {s?.status === 'closed' && !isOpen && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs"
                              disabled={actionLoading}
                              onClick={(e) => { e.stopPropagation(); handleReopen(s.id); }}
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Reabrir Caixa
                            </Button>
                          )}
                          {s?.status === 'closed' && isOpen && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs opacity-50"
                              disabled
                              title="Feche o caixa atual antes de reabrir outro"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Reabrir Caixa
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={actionLoading}
                            onClick={(e) => { e.stopPropagation(); setConfirmDelete(s.id); }}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }) ?? []}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Abrir Caixa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor Inicial (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={openingAmount}
                onChange={(e: any) => setOpeningAmount(e?.target?.value ?? '')}
              />
            </div>
            <Button onClick={handleOpen} className="w-full">Abrir Caixa</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Dialog */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Fechar Caixa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Abertura:</span><span className="font-mono">{formatCurrency(data?.session?.openingAmount)}</span></div>
              <div className="flex justify-between"><span>Entradas:</span><span className="font-mono text-green-500">+{formatCurrency(data?.totalEntradas)}</span></div>
              <div className="flex justify-between"><span>Saídas:</span><span className="font-mono text-red-500">-{formatCurrency(data?.totalSaidas)}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Saldo Esperado:</span><span className="font-mono">{formatCurrency(data?.balance)}</span></div>
            </div>

            {/* Method breakdown in close dialog */}
            {data?.byMethod && Object.keys(data.byMethod).length > 0 && (
              <div className="space-y-1 text-xs border rounded-lg p-2">
                <p className="font-semibold text-muted-foreground uppercase tracking-wide mb-1">Por Forma de Pagamento</p>
                {Object.entries(data.byMethod).map(([method, vals]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      {METHOD_ICON[method] || METHOD_ICON['Outros']}
                      {method}
                    </span>
                    <span className={`font-mono font-semibold ${METHOD_COLOR[method] || METHOD_COLOR['Outros']}`}>
                      {formatCurrency(vals.entradas - vals.saidas)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Valor Real em Caixa (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={closingAmount}
                onChange={(e: any) => setClosingAmount(e?.target?.value ?? '')}
              />
            </div>
            {closingAmount !== '' && (
              <div className={`text-sm font-mono font-bold ${(closingNum - (data?.balance ?? 0)) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                Diferença: {formatCurrency(closingNum - (data?.balance ?? 0))}
              </div>
            )}
            <Button onClick={handleClose} variant="destructive" className="w-full">Fechar Caixa</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Excluir Caixa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir este caixa? Todas as movimentações registradas nele serão perdidas.
            </p>
            <p className="text-xs text-destructive font-medium">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)} disabled={actionLoading}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={actionLoading}
                onClick={() => confirmDelete && handleDelete(confirmDelete)}
              >
                {actionLoading ? 'Excluindo...' : 'Sim, Excluir'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={movDialog} onOpenChange={(open) => {
        setMovDialog(open);
        if (!open) {
          setMovItems([]);
          setProductSearch('');
          setProductResults([]);
          setBarcodeInput('');
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar Movimento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={movForm?.type === 'entrada' ? 'default' : 'outline'}
                onClick={() => setMovForm({ ...(movForm ?? {}), type: 'entrada' })}
                className="gap-1"
              >
                <ArrowUpCircle className="w-4 h-4" /> Entrada
              </Button>
              <Button
                variant={movForm?.type === 'saida' ? 'destructive' : 'outline'}
                onClick={() => setMovForm({ ...(movForm ?? {}), type: 'saida' })}
                className="gap-1"
              >
                <ArrowDownCircle className="w-4 h-4" /> Saída
              </Button>
            </div>

            {/* Product Search Section */}
            <div className="space-y-2 border rounded-lg p-3 bg-accent/30">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Package className="w-3.5 h-3.5" /> Produtos do Estoque
              </Label>

              {/* Barcode Input */}
              <div className="relative">
                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={barcodeRef}
                  placeholder="Escanear código de barras..."
                  value={barcodeInput}
                  onChange={(e: any) => setBarcodeInput(e?.target?.value ?? '')}
                  onKeyDown={(e: any) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      lookupBarcode(barcodeInput);
                    }
                  }}
                  className="pl-10 text-sm"
                />
                {barcodeSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
              </div>

              {/* Search by Name */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto por nome..."
                  value={productSearch}
                  onChange={(e: any) => handleProductSearchChange(e?.target?.value ?? '')}
                  className="pl-10 text-sm"
                />
                {searchingProducts && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
              </div>

              {/* Search Results */}
              {productResults.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md bg-background p-1">
                  {productResults.slice(0, 8).map((p: any) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left p-2 rounded hover:bg-accent text-xs flex justify-between items-center gap-2 transition-colors"
                      onClick={() => addProductToItems(p)}
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-muted-foreground">Estoque: {p.quantity ?? 0}</p>
                      </div>
                      <span className="font-mono font-semibold text-primary flex-shrink-0">
                        {formatCurrency(p.salePrice)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Items List */}
              {movItems.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {movItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-md bg-background text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e: any) => updateMovItem(idx, 'quantity', parseInt(e?.target?.value) || 1)}
                        className="w-14 h-7 text-xs text-center p-1"
                      />
                      <span className="text-muted-foreground">×</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e: any) => updateMovItem(idx, 'unitPrice', parseFloat(e?.target?.value) || 0)}
                        className="w-20 h-7 text-xs text-right p-1 font-mono"
                      />
                      <span className="font-mono font-semibold text-primary w-20 text-right flex-shrink-0">
                        {formatCurrency(item.totalPrice)}
                      </span>
                      <button type="button" onClick={() => removeMovItem(idx)} className="text-destructive hover:text-destructive/80">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-1 border-t text-xs">
                    <span className="text-muted-foreground font-medium">Subtotal Produtos</span>
                    <span className="font-mono font-bold text-primary">{formatCurrency(movItemsTotal)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Amount (additional) */}
            <div className="space-y-2">
              <Label>{movItems.length > 0 ? 'Valor adicional (R$)' : 'Valor (R$) *'}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={movForm?.amount ?? ''}
                onChange={(e: any) => setMovForm({ ...(movForm ?? {}), amount: e?.target?.value ?? '' })}
              />
            </div>

            {/* Total display when items + manual */}
            {movItems.length > 0 && (parseFloat(movForm?.amount) || 0) > 0 && (
              <div className="flex justify-between items-center p-2 rounded-lg bg-primary/10 text-sm">
                <span className="font-medium">Total do Movimento</span>
                <span className="font-mono font-bold text-primary">{formatCurrency(movItemsTotal + (parseFloat(movForm?.amount) || 0))}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label>{movItems.length > 0 ? 'Descrição adicional' : 'Descrição *'}</Label>
              <Input value={movForm?.description ?? ''} onChange={(e: any) => setMovForm({ ...(movForm ?? {}), description: e?.target?.value ?? '' })} placeholder="Ex: Serviço troca de óleo" />
            </div>
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select value={movForm?.paymentMethod ?? ''} onValueChange={(v: string) => setMovForm({ ...(movForm ?? {}), paymentMethod: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS?.map?.((p: string) => <SelectItem key={p} value={p}>{p}</SelectItem>) ?? []}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleMovement} className="w-full">
              Registrar {movItemsTotal > 0 ? formatCurrency(movItemsTotal + (parseFloat(movForm?.amount) || 0)) : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
