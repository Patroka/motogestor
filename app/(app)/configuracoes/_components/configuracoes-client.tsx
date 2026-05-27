'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Store, Phone, MapPin, User, Save, Loader2, Download, Database } from 'lucide-react';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';
import { Badge } from '@/components/ui/badge';

interface ShopSettings {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  ownerName: string | null;
}

export function ConfiguracoesClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [shop, setShop] = useState<ShopSettings | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', ownerName: '' });

  useEffect(() => {
    fetch('/api/shop-settings')
      .then((r) => r.json())
      .then((data) => {
        setShop(data);
        setForm({
          name: data.name ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          ownerName: data.ownerName ?? '',
        });
      })
      .catch(() => toast.error('Erro ao carregar configurações'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/shop-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setShop(updated);
      toast.success('Configurações salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="(.+?)"/);
      a.download = match?.[1] ?? `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Backup gerado com sucesso!');
    } catch {
      toast.error('Erro ao gerar backup');
    } finally {
      setBackingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <FadeIn>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Configurações</h1>
            <p className="text-sm text-muted-foreground">Dados da sua oficina</p>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Store className="w-5 h-5" />
              Dados da Oficina
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Store className="w-4 h-4 text-muted-foreground" />
                Nome da Oficina
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Moto Center Express"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerName" className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Nome do Responsável
              </Label>
              <Input
                id="ownerName"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                placeholder="Ex: João da Silva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Telefone / WhatsApp
              </Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Ex: (11) 99999-9999"
              />
              <p className="text-xs text-muted-foreground">
                Este telefone aparecerá nos cupons térmicos e na página de acompanhamento.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Endereço
              </Label>
              <Textarea
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Ex: Rua das Motos, 123 - Centro - São Paulo/SP"
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                O endereço aparecerá nos cupons térmicos impressos.
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5" />
              Backup dos Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gere um backup completo com todos os dados da sua oficina: clientes, ordens de serviço, 
              produtos, movimentações de estoque e caixa. O arquivo será baixado em formato JSON.
            </p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">Clientes</Badge>
              <Badge variant="outline" className="text-xs">Ordens de Serviço</Badge>
              <Badge variant="outline" className="text-xs">Produtos</Badge>
              <Badge variant="outline" className="text-xs">Estoque</Badge>
              <Badge variant="outline" className="text-xs">Caixa</Badge>
              <Badge variant="outline" className="text-xs">Usuários</Badge>
            </div>

            <Button onClick={handleBackup} disabled={backingUp} variant="outline" className="w-full gap-2">
              {backingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {backingUp ? 'Gerando backup...' : 'Gerar Backup Completo'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Recomendamos fazer backups periódicos para sua segurança.
            </p>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
