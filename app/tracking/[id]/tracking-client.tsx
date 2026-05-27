'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wrench,
  Bike,
  Clock,
  MessageCircle,
  CheckCircle2,
  CircleDot,
  AlertCircle,
} from 'lucide-react';

const STATUSES = ['Recebida', 'Em análise', 'Aguardando aprovação', 'Em manutenção', 'Pronta para retirada', 'Entregue'];

interface TrackingData {
  id: string;
  orderNumber: number;
  customerName: string;
  shopName: string;
  shopPhone: string;
  motorcycle: string | null;
  model: string | null;
  plate: string | null;
  description: string;
  status: string;
  estimatedDate: string | null;
  updatedAt: string;
}

export default function TrackingClient({ orderId }: { orderId: string }) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!orderId) { setLoading(false); setError(true); return; }
    fetch(`/api/orders/${orderId}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r?.json?.();
      })
      .then((d: any) => setData(d ?? null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold">Ordem não encontrada</h2>
            <p className="text-muted-foreground mt-2">O link pode estar incorreto ou expirado.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentIndex = STATUSES?.indexOf?.(data?.status ?? '') ?? -1;
  const whatsNum = (data?.shopPhone ?? '')?.replace?.(/\D/g, '') ?? '';

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-lg mx-auto p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-sm">{data?.shopName ?? 'Oficina'}</h1>
            <p className="text-xs text-muted-foreground">Acompanhamento de Serviço</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Order Info */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold font-mono">OS #{data?.orderNumber ?? 0}</span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                {data?.status ?? ''}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente</span>
                <span className="font-medium">{data?.customerName ?? ''}</span>
              </div>
              {(data?.motorcycle || data?.model) && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Bike className="w-3.5 h-3.5" /> Moto</span>
                  <span className="font-medium">{data?.motorcycle ?? ''} {data?.model ?? ''}</span>
                </div>
              )}
              {data?.plate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Placa</span>
                  <span className="font-medium">{data.plate}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviço</span>
                <span className="font-medium text-right max-w-[60%]">{data?.description ?? ''}</span>
              </div>
              {data?.estimatedDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Previsão</span>
                  <span className="font-medium">{formatDate(data.estimatedDate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Última atualização</span>
                <span className="text-xs">{formatDate(data?.updatedAt ?? null)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Progresso</h3>
            <div className="space-y-0">
              {STATUSES?.map?.((s: string, i: number) => {
                const done = i <= currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <div key={s} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      {done ? (
                        <CheckCircle2 className={`w-5 h-5 ${isCurrent ? 'text-primary' : 'text-green-500'}`} />
                      ) : (
                        <CircleDot className="w-5 h-5 text-muted-foreground/30" />
                      )}
                      {i < (STATUSES?.length ?? 0) - 1 && (
                        <div className={`w-0.5 h-6 ${done ? 'bg-green-500' : 'bg-muted-foreground/20'}`} />
                      )}
                    </div>
                    <span className={`text-sm pb-4 ${isCurrent ? 'font-bold text-primary' : done ? 'font-medium' : 'text-muted-foreground/50'}`}>
                      {s}
                    </span>
                  </div>
                );
              }) ?? []}
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp */}
        {whatsNum && (
          <a
            href={`https://wa.me/55${whatsNum}?text=${encodeURIComponent(`Olá, gostaria de saber sobre minha OS #${data?.orderNumber ?? 0}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 mt-2">
              <MessageCircle className="w-5 h-5" /> Falar no WhatsApp
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
