'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Package,
  Plus,
  Search,
  Edit,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  X,
  Bike,
  ScanBarcode,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import { MOTO_BRANDS, MOTO_MODELS } from '@/lib/moto-data';

interface CompatEntry {
  brand: string;
  models: string[];
}

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  description: string | null;
  compatibleMotorcycles: string | null;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  salePrice: number;
}

const formatCurrency = (v: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const BRANDS_FOR_COMPAT = MOTO_BRANDS.filter(b => b !== 'Outra');

export default function EstoqueClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '', barcode: '', quantity: '' as string | number, minQuantity: '' as string | number,
    costPrice: '' as string | number, salePrice: '' as string | number,
  });
  const [compatList, setCompatList] = useState<CompatEntry[]>([]);
  const [compatBrand, setCompatBrand] = useState('');
  const [compatModels, setCompatModels] = useState<string[]>([]);
  const [stockForm, setStockForm] = useState({ action: 'entrada', quantity: '' as string | number, reason: '' });
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeSearching, setBarcodeSearching] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const lookupBarcode = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setBarcodeSearching(true);
    try {
      const res = await fetch(`/api/products?barcode=${encodeURIComponent(code.trim())}`);
      if (res.ok) {
        const product = await res.json();
        if (product?.id) {
          toast.success(`Produto encontrado: ${product.name}`);
          setStockProduct(product);
          setStockForm({ action: 'saida', quantity: '', reason: 'Saída por código de barras' });
          setStockOpen(true);
        }
      } else {
        toast.error('Nenhum produto encontrado com este código de barras');
      }
    } catch {
      toast.error('Erro ao buscar produto');
    } finally {
      setBarcodeSearching(false);
      setBarcodeInput('');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (showLowOnly) params.set('lowOnly', 'true');
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res?.json?.();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, showLowOnly]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openNewForm = () => {
    setEditing(null);
    setForm({ name: '', barcode: '', quantity: '', minQuantity: '', costPrice: '', salePrice: '' });
    setCompatList([]);
    setCompatBrand('');
    setCompatModels([]);
    setFormOpen(true);
  };

  const openEditForm = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name ?? '',
      barcode: p.barcode ?? '',
      quantity: p.quantity ?? '',
      minQuantity: p.minQuantity ?? '',
      costPrice: p.costPrice ?? '',
      salePrice: p.salePrice ?? '',
    });
    try {
      setCompatList(p.compatibleMotorcycles ? JSON.parse(p.compatibleMotorcycles) : []);
    } catch { setCompatList([]); }
    setCompatBrand('');
    setCompatModels([]);
    setFormOpen(true);
  };

  const addCompat = () => {
    if (!compatBrand || compatModels.length === 0) {
      toast.error('Selecione a marca e pelo menos um modelo');
      return;
    }
    const existing = compatList.find(c => c.brand === compatBrand);
    if (existing) {
      const merged = Array.from(new Set([...existing.models, ...compatModels]));
      setCompatList(compatList.map(c => c.brand === compatBrand ? { ...c, models: merged } : c));
    } else {
      setCompatList([...compatList, { brand: compatBrand, models: [...compatModels] }]);
    }
    setCompatBrand('');
    setCompatModels([]);
  };

  const removeCompat = (brand: string) => {
    setCompatList(compatList.filter(c => c.brand !== brand));
  };

  const handleSave = async () => {
    if (!form?.name) { toast.error('Descrição obrigatória'); return; }
    try {
      const payload: any = {
        name: form.name,
        barcode: form.barcode?.trim() || null,
        quantity: parseInt(String(form.quantity)) || 0,
        minQuantity: parseInt(String(form.minQuantity)) || 0,
        costPrice: parseFloat(String(form.costPrice)) || 0,
        salePrice: parseFloat(String(form.salePrice)) || 0,
        compatibleMotorcycles: compatList.length > 0 ? JSON.stringify(compatList) : null,
      };
      if (editing) payload.id = editing.id;
      const res = await fetch('/api/products', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(editing ? 'Produto atualizado!' : 'Produto adicionado!');
        setFormOpen(false);
        setEditing(null);
        fetchProducts();
      } else {
        toast.error('Erro ao salvar');
      }
    } catch {
      toast.error('Erro ao salvar');
    }
  };

  const handleStock = async () => {
    if (!stockProduct) return;
    const qty = parseInt(String(stockForm?.quantity)) || 0;
    if (qty <= 0) { toast.error('Quantidade inválida'); return; }
    if (stockForm?.action === 'saida' && qty > (stockProduct?.quantity ?? 0)) {
      toast.error(`Quantidade maior que estoque disponível (${stockProduct?.quantity ?? 0})`);
      return;
    }
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: stockProduct.id,
          stockAction: stockForm?.action,
          stockQuantity: stockForm?.quantity,
          stockReason: stockForm?.reason,
        }),
      });
      if (res.ok) {
        toast.success('Estoque atualizado!');
        setStockOpen(false);
        setStockProduct(null);
        fetchProducts();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Erro ao atualizar estoque');
      }
    } catch {
      toast.error('Erro ao atualizar estoque');
    }
  };

  const brandModels = compatBrand ? (MOTO_MODELS[compatBrand] ?? []) : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight flex items-center gap-2">
              <Package className="w-7 h-7 text-primary" />
              Estoque
            </h1>
            <p className="text-muted-foreground mt-1">Controle de peças e produtos</p>
          </div>
          <Button onClick={openNewForm} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Produto
          </Button>
        </div>
      </FadeIn>

      {/* Barcode Scanner Input */}
      <FadeIn delay={0.05}>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium shrink-0">
                <ScanBarcode className="w-5 h-5 text-primary" />
                Baixa por Código de Barras
              </div>
              <div className="relative flex-1 w-full">
                <Input
                  ref={barcodeRef}
                  placeholder="Clique aqui e bipe o produto com o leitor..."
                  value={barcodeInput}
                  onChange={(e: any) => setBarcodeInput(e?.target?.value ?? '')}
                  onKeyDown={(e: any) => {
                    if (e.key === 'Enter' && barcodeInput.trim()) {
                      e.preventDefault();
                      lookupBarcode(barcodeInput);
                    }
                  }}
                  className="pr-10 font-mono"
                  autoComplete="off"
                />
                {barcodeSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Posicione o cursor no campo acima e use o leitor USB. O sistema localiza o produto e abre a tela de saída automaticamente.
            </p>
          </CardContent>
        </Card>
      </FadeIn>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e: any) => setSearch(e?.target?.value ?? '')}
            className="pl-10"
          />
        </div>
        <Button
          variant={showLowOnly ? 'default' : 'outline'}
          onClick={() => setShowLowOnly(!showLowOnly)}
          className="gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Estoque Baixo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (products ?? [])?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum produto encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          <div className="hidden lg:grid grid-cols-6 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
            <span className="col-span-2">Produto</span>
            <span className="text-center">Estoque</span>
            <span className="text-right">Preço Custo</span>
            <span className="text-right">Preço Venda</span>
            <span className="text-right">Ações</span>
          </div>
          {(products ?? [])?.map?.((p: Product) => {
            const isLow = (p?.quantity ?? 0) <= (p?.minQuantity ?? 0);
            return (
              <Card key={p?.id} className={`hover:shadow-md transition-shadow ${isLow ? 'border-yellow-500/50' : ''}`}>
                <CardContent className="p-4">
                  <div className="lg:grid lg:grid-cols-6 lg:gap-4 lg:items-center space-y-2 lg:space-y-0">
                    <div className="col-span-2">
                      <p className="font-semibold">{p?.name ?? ''}</p>
                      {p?.barcode && <p className="text-xs text-muted-foreground font-mono flex items-center gap-1"><ScanBarcode className="w-3 h-3" />{p.barcode}</p>}
                    </div>
                    <div className="text-center">
                      <span className={`font-mono font-bold ${isLow ? 'text-yellow-500' : ''}`}>{p?.quantity ?? 0}</span>
                      <span className="text-xs text-muted-foreground"> / mín {p?.minQuantity ?? 0}</span>
                      {isLow && <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 inline ml-1" />}
                    </div>
                    <div className="text-right font-mono text-sm">{formatCurrency(p?.costPrice)}</div>
                    <div className="text-right font-mono text-sm">{formatCurrency(p?.salePrice)}</div>
                    <div className="flex gap-1 justify-end">
                      <Button variant="outline" size="sm" onClick={() => openEditForm(p)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-green-500" onClick={() => { setStockProduct(p); setStockForm({ action: 'entrada', quantity: '', reason: '' }); setStockOpen(true); }}>
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-500" onClick={() => { setStockProduct(p); setStockForm({ action: 'saida', quantity: '', reason: '' }); setStockOpen(true); }}>
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }) ?? []}
        </div>
      )}

      {/* Product Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição do Produto *</Label>
              <Input
                value={form?.name ?? ''}
                onChange={(e: any) => setForm({ ...form, name: e?.target?.value ?? '' })}
                placeholder="Ex: Pastilha de freio dianteira Honda CG 150"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ScanBarcode className="w-4 h-4 text-muted-foreground" />
                Código de Barras (EAN)
              </Label>
              <Input
                value={form?.barcode ?? ''}
                onChange={(e: any) => setForm({ ...form, barcode: e?.target?.value ?? '' })}
                placeholder="Bipe com o leitor ou digite manualmente"
                className="font-mono"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Use o leitor USB ou digite o código EAN do produto.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number" min="0" placeholder="0"
                  value={form?.quantity ?? ''}
                  onChange={(e: any) => setForm({ ...form, quantity: e?.target?.value ?? '' })}
                />
              </div>
              <div className="space-y-2">
                <Label>Qtd. Mínima</Label>
                <Input
                  type="number" min="0" placeholder="0"
                  value={form?.minQuantity ?? ''}
                  onChange={(e: any) => setForm({ ...form, minQuantity: e?.target?.value ?? '' })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço Custo (R$)</Label>
                <Input
                  type="number" min="0" step="0.01" placeholder="0,00"
                  value={form?.costPrice ?? ''}
                  onChange={(e: any) => setForm({ ...form, costPrice: e?.target?.value ?? '' })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preço Venda (R$)</Label>
                <Input
                  type="number" min="0" step="0.01" placeholder="0,00"
                  value={form?.salePrice ?? ''}
                  onChange={(e: any) => setForm({ ...form, salePrice: e?.target?.value ?? '' })}
                />
              </div>
            </div>

            {/* Motos Compatíveis */}
            <div className="space-y-3 border rounded-lg p-3">
              <Label className="flex items-center gap-2"><Bike className="w-4 h-4" /> Motos Compatíveis</Label>

              <div className="flex gap-2">
                <Select value={compatBrand} onValueChange={(v) => { setCompatBrand(v); setCompatModels([]); }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Marca" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" sideOffset={4}>
                    {BRANDS_FOR_COMPAT.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="sm" onClick={addCompat} disabled={!compatBrand || compatModels.length === 0}>
                  Adicionar
                </Button>
              </div>

              {compatBrand && brandModels.length > 0 && (
                <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto border rounded p-2">
                  {brandModels.map((m) => (
                    <label key={m} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent rounded px-1 py-0.5">
                      <Checkbox
                        checked={compatModels.includes(m)}
                        onCheckedChange={(checked) => {
                          setCompatModels(checked ? [...compatModels, m] : compatModels.filter(x => x !== m));
                        }}
                      />
                      {m}
                    </label>
                  ))}
                </div>
              )}

              {compatList.length > 0 && (
                <div className="space-y-1">
                  {compatList.map((c) => (
                    <div key={c.brand} className="flex items-center justify-between bg-accent/50 rounded px-2 py-1 text-xs">
                      <span><strong>{c.brand}</strong>: {c.models.join(', ')}</span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => removeCompat(c.brand)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={handleSave} className="w-full">{editing ? 'Salvar' : 'Adicionar'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Movement */}
      <Dialog open={stockOpen} onOpenChange={setStockOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {stockForm?.action === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque'} - {stockProduct?.name ?? ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Estoque atual: <span className="font-bold">{stockProduct?.quantity ?? 0}</span></p>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" min="1" max={stockForm?.action === 'saida' ? (stockProduct?.quantity ?? 0) : undefined} placeholder="Digite a quantidade" value={stockForm?.quantity ?? ''} onChange={(e: any) => { const val = e?.target?.value; setStockForm({ ...(stockForm ?? {}), quantity: val === '' ? '' : (parseInt(val) || 0) }); }} />
              {stockForm?.action === 'saida' && <p className="text-xs text-muted-foreground">Máximo disponível: <span className="font-semibold">{stockProduct?.quantity ?? 0}</span></p>}
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input value={stockForm?.reason ?? ''} onChange={(e: any) => setStockForm({ ...(stockForm ?? {}), reason: e?.target?.value ?? '' })} placeholder="Ex: Compra fornecedor" />
            </div>
            <Button onClick={handleStock} className="w-full">
              {stockForm?.action === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
