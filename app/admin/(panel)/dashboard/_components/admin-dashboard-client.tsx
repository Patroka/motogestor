'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  CheckCircle,
  AlertTriangle,
  Ban,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FadeIn, SlideIn } from '@/components/ui/animate';

interface DashboardData {
  total: number;
  active: number;
  overdue: number;
  blocked: number;
  newThisMonth: number;
  recentShops: Array<{
    id: string;
    name: string;
    ownerName: string | null;
    status: string;
    plan: string;
    createdAt: string;
  }>;
}

const statusBadge: Record<string, string> = {
  'Ativo': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Atrasado': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Bloqueado': 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function AdminDashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Total de Oficinas', value: data?.total ?? 0, icon: Building2, color: 'text-primary', bg: 'bg-primary/10' },
    { title: 'Oficinas Ativas', value: data?.active ?? 0, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'Oficinas Atrasadas', value: data?.overdue ?? 0, icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { title: 'Oficinas Bloqueadas', value: data?.blocked ?? 0, icon: Ban, color: 'text-red-500', bg: 'bg-red-500/10' },
    { title: 'Novas no Mês', value: data?.newThisMonth ?? 0, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
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
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">
            Painel <span className="text-primary">Administrativo</span>
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie todas as oficinas do sistema</p>
        </div>
      </FadeIn>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <SlideIn key={i} from="bottom" delay={i * 0.08}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.bg}`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold font-mono">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
                </CardContent>
              </Card>
            </SlideIn>
          );
        })}
      </div>

      <FadeIn delay={0.3}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Últimas Oficinas Cadastradas
            </CardTitle>
            <Link href="/admin/oficinas">
              <Button variant="ghost" size="sm" className="gap-1">
                Ver todas <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.recentShops ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhuma oficina cadastrada</p>
              )}
              {(data?.recentShops ?? []).map((shop) => (
                <div key={shop.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                  <div>
                    <p className="font-medium text-sm">{shop.name}</p>
                    <p className="text-xs text-muted-foreground">{shop.ownerName ?? '-'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs" variant="outline">{shop.plan}</Badge>
                    <Badge className={`text-xs ${statusBadge[shop.status] ?? ''}`}>{shop.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
