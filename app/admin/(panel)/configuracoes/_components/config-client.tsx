'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Save } from 'lucide-react';
import { toast } from 'sonner';
import { FadeIn } from '@/components/ui/animate';

export default function ConfigClient() {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) {
          setConfig({
            systemName: d.systemName ?? 'MotoGestor Pro',
            planProfissional: d.planProfissional ?? '149.90',
            planPremium: d.planPremium ?? '249.90',
            ...d,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error();
      toast.success('Configurações salvas!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
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
    <div className="space-y-6 max-w-3xl mx-auto">
      <FadeIn>
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground mt-1">Configurações gerais do sistema</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome do Sistema</Label>
              <Input
                value={config.systemName ?? ''}
                onChange={(e) => setConfig({ ...config, systemName: e.target.value })}
                placeholder="MotoGestor Pro"
              />
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              💰 Valores Padrão dos Planos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Profissional (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={config.planProfissional ?? ''}
                  onChange={(e) => setConfig({ ...config, planProfissional: e.target.value })}
                />
              </div>
              <div>
                <Label>Premium (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={config.planPremium ?? ''}
                  onChange={(e) => setConfig({ ...config, planPremium: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn delay={0.3}>
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </FadeIn>
    </div>
  );
}
