'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Wrench,
  Users,
  Wallet,
  AlertTriangle,
  TrendingUp,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { FadeIn, SlideIn } from '@/components/ui/animate';

interface DashboardData {
  dailyRevenue: number;
  servicesCompleted: number;
  customersServed: number;
  cashBalance: number;
  lowStockProducts: Array<{ id: string; name: string; quantity: number; minQuantity: number }>;
  recentOrders: Array<{ id: string; orderNumber: number; customerName: string; status: string; totalCost: number }>;
}

export default function DashboardClient() {
  const { data: session } = useSession() || {};
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showValues, setShowValues] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r?.json?.())
      .then((d: any) => setData(d ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const shopName = (session?.user as any)?.shopName ?? 'Oficina';
  const formatCurrency = (v: number | null | undefined) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

  const hidden = 'R$ ••••••';

  const cards = [
    {
      title: 'Faturamento Hoje',
      value: showValues ? formatCurrency(data?.dailyRevenue) : hidden,
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      isMoney: true,
    },
    {
      title: 'Servicos Realizados',
      value: String(data?.servicesCompleted ?? 0),
      icon: Wrench,
      color: 'text-primary',
      bg: 'bg-primary/10',
      isMoney: false,
    },
    {
      title: 'Clientes Atendidos',
      value: String(data?.customersServed ?? 0),
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      isMoney: false,
    },
    {
      title: 'Saldo do Caixa',
      value: showValues ? formatCurrency(data?.cashBalance) : hidden,
      icon: Wallet,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      isMoney: true,
    },
  ];

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">
              Bem-vindo, <span className="text-primary">{shopName}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Acompanhe o resumo da sua oficina</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowValues((v) => !v)}
            title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
            className="shrink-0"
          >
            {showValues ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </Button>
        </div>
      </FadeIn>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards?.map?.((card: any, i: number) => {
          const Icon = card?.icon;
          return (
            <SlideIn key={i} from="bottom" delay={i * 0.1}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card?.bg ?? ''}`}>
                      {Icon && <Icon className={`w-5 h-5 ${card?.color ?? ''}`} />}
                    </div>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xl lg:text-2xl font-bold font-mono">{card?.value ?? '0'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card?.title ?? ''}</p>
                </CardContent>
              </Card>
            </SlideIn>
          );
        }) ?? []}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <FadeIn delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Últimas Ordens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(data?.recentOrders ?? [])?.length === 0 && (
                  <p className="text-muted-foreground text-sm">Nenhuma ordem recente</p>
                )}
                {(data?.recentOrders ?? [])?.map?.((order: any) => (
                  <div
                    key={order?.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">OS #{order?.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{order?.customerName ?? ''}</p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          order?.status === 'Entregue'
                            ? 'default'
                            : order?.status === 'Pronta para retirada'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {order?.status ?? ''}
                      </Badge>
                      <p className="text-xs font-mono mt-1">{showValues ? formatCurrency(order?.totalCost) : hidden}</p>
                    </div>
                  </div>
                )) ?? []}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.4}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(data?.lowStockProducts ?? [])?.length === 0 && (
                  <p className="text-muted-foreground text-sm">Nenhum produto com estoque baixo</p>
                )}
                {(data?.lowStockProducts ?? [])?.map?.((p: any) => (
                  <div
                    key={p?.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                  >
                    <p className="font-medium text-sm">{p?.name ?? ''}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-destructive">{p?.quantity ?? 0}</span>
                      <span className="text-xs text-muted-foreground">/ {p?.minQuantity ?? 0}</span>
                    </div>
                  </div>
                )) ?? []}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
