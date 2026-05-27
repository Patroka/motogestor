'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Wrench,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Package,
  Users,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Smartphone,
  Banknote,
  Wallet,
} from 'lucide-react';
import { FadeIn } from '@/components/ui/animate';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const statusColors: Record<string, string> = {
  'Recebida': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Em análise': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'Aguardando aprovação': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  'Em manutenção': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Pronta para retirada': 'bg-green-500/10 text-green-500 border-green-500/20',
  'Entregue': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const PERIODS = [
  { value: 'today', label: 'Hoje' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: 'month', label: 'Este mês' },
  { value: 'all', label: 'Todo período' },
] as const;

type TabKey = 'overview' | 'revenue' | 'services' | 'lowstock';

const TABS: { key: TabKey; label: string; icon: React.ElementType; shortLabel: string }[] = [
  { key: 'overview', label: 'Visão Geral', icon: BarChart3, shortLabel: 'Geral' },
  { key: 'revenue', label: 'Faturamento', icon: DollarSign, shortLabel: 'Faturamento' },
  { key: 'services', label: 'Serviços', icon: Wrench, shortLabel: 'Serviços' },
  { key: 'lowstock', label: 'Estoque Baixo', icon: AlertTriangle, shortLabel: 'Estoque' },
];

export default function RelatoriosClient() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [period, setPeriod] = useState('all');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAllOrders, setShowAllOrders] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    setShowAllOrders(false);
    fetch(`/api/reports?type=${activeTab}&period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [activeTab, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? '';

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <FadeIn>
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Acompanhe o desempenho da sua oficina
          </p>
        </div>
      </FadeIn>

      {/* Tab Navigation */}
      <FadeIn delay={0.05}>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap
                  transition-all duration-200 flex-shrink-0
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'bg-card hover:bg-accent text-muted-foreground hover:text-foreground border border-border'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </FadeIn>

      {/* Period Selector - not for lowstock */}
      {activeTab !== 'lowstock' && (
        <FadeIn delay={0.1}>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`
                  px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all flex-shrink-0
                  ${period === p.value
                    ? 'bg-accent text-foreground border border-primary/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent'
                  }
                `}
              >
                {p.label}
              </button>
            ))}
          </div>
        </FadeIn>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <FadeIn delay={0.15}>
          {activeTab === 'overview' && <OverviewTab data={data} periodLabel={periodLabel} />}
          {activeTab === 'revenue' && (
            <RevenueTab data={data} periodLabel={periodLabel} showAll={showAllOrders} setShowAll={setShowAllOrders} />
          )}
          {activeTab === 'services' && (
            <ServicesTab data={data} periodLabel={periodLabel} showAll={showAllOrders} setShowAll={setShowAllOrders} />
          )}
          {activeTab === 'lowstock' && <LowStockTab data={data} />}
        </FadeIn>
      )}
    </div>
  );
}

/* ───── Overview Tab ───── */
function OverviewTab({ data, periodLabel }: { data: any; periodLabel: string }) {
  if (!data) return <EmptyState />;

  const cards = [
    {
      label: 'Faturamento',
      value: formatCurrency(data.totalRevenue ?? 0),
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Ticket Médio',
      value: formatCurrency(data.avgTicket ?? 0),
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Total de OS',
      value: String(data.totalOrders ?? 0),
      icon: ClipboardList,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'OS Concluídas',
      value: String(data.completedOrders ?? 0),
      icon: Wrench,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Clientes',
      value: String(data.totalCustomers ?? 0),
      icon: Users,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Produtos',
      value: String(data.totalProducts ?? 0),
      icon: Package,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Período: {periodLabel}</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{card.label}</p>
                    <p className={`text-lg sm:text-2xl font-bold font-mono mt-1 ${card.color} truncate`}>
                      {card.value}
                    </p>
                  </div>
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0 ml-2`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ───── Revenue Tab ───── */
function RevenueTab({
  data,
  periodLabel,
  showAll,
  setShowAll,
}: {
  data: any;
  periodLabel: string;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
}) {
  if (!data) return <EmptyState />;

  const orders = data.orders ?? [];
  const visibleOrders = showAll ? orders : orders.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Revenue card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Faturamento — {periodLabel}</p>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-primary mt-1">
                {formatCurrency(data.total ?? 0)}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {data.count ?? 0} registro(s) no período
            {(data.totalManual ?? 0) > 0 && (
              <span> • {formatCurrency(data.totalManual)} de entradas manuais</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Revenue by payment method */}
      {data.revenueByMethod && Object.keys(data.revenueByMethod).length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Faturamento por Forma de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.entries(data.revenueByMethod).map(([method, amount]: [string, any]) => {
                const methodIcons: Record<string, React.ReactNode> = {
                  'Dinheiro': <Banknote className="w-5 h-5 text-green-500" />,
                  'Pix': <Smartphone className="w-5 h-5 text-cyan-500" />,
                  'Cartão': <CreditCard className="w-5 h-5 text-violet-500" />,
                  'Outros': <Wallet className="w-5 h-5 text-muted-foreground" />,
                };
                const methodColors: Record<string, string> = {
                  'Dinheiro': 'text-green-500',
                  'Pix': 'text-cyan-500',
                  'Cartão': 'text-violet-500',
                  'Outros': 'text-muted-foreground',
                };
                return (
                  <div key={method} className="p-3 rounded-lg bg-accent/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {methodIcons[method] || methodIcons['Outros']}
                      <span className="text-sm font-medium">{method}</span>
                    </div>
                    <span className={`font-mono font-bold text-sm ${methodColors[method] || methodColors['Outros']}`}>
                      {formatCurrency(Number(amount))}
                    </span>
                  </div>
                );
              })}
            </div>
            {(data.totalManual ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                Inclui {formatCurrency(data.totalManual)} de entradas manuais do caixa
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Revenue by day */}
      {data.revenueByDay && Object.keys(data.revenueByDay).length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm sm:text-base">Faturamento por Dia</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2">
            {Object.entries(data.revenueByDay)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 10)
              .map(([day, amount]: [string, any]) => {
                const maxAmount = Math.max(...Object.values(data.revenueByDay).map(Number));
                const barWidth = maxAmount > 0 ? (Number(amount) / maxAmount) * 100 : 0;
                const [y, m, d] = day.split('-');
                const formatted = `${d}/${m}`;
                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-10 flex-shrink-0 font-mono">{formatted}</span>
                    <div className="flex-1 h-6 bg-accent/50 rounded overflow-hidden">
                      <div
                        className="h-full bg-primary/80 rounded transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-medium w-20 text-right flex-shrink-0">
                      {formatCurrency(Number(amount))}
                    </span>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      )}

      {/* Orders list */}
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum serviço concluído neste período
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">
            {orders.length} ordem(ns) concluída(s)
          </p>
          {visibleOrders.map((order: any) => (
            <Card key={order.id}>
              <CardContent className="p-3 sm:p-4 flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">OS #{order.orderNumber}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {order.customer?.name ?? '-'}
                  </p>
                </div>
                <p className="font-bold font-mono text-sm sm:text-base flex-shrink-0 text-primary">
                  {formatCurrency(order.totalCost)}
                </p>
              </CardContent>
            </Card>
          ))}
          {orders.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" /> Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" /> Ver todas ({orders.length})
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ───── Services Tab ───── */
function ServicesTab({
  data,
  periodLabel,
  showAll,
  setShowAll,
}: {
  data: any;
  periodLabel: string;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
}) {
  if (!data) return <EmptyState />;

  const orders = data.orders ?? [];
  const visibleOrders = showAll ? orders : orders.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Total card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Total de Serviços — {periodLabel}
              </p>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-primary mt-1">
                {data.total ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Wrench className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status breakdown */}
      {data.byStatus && Object.keys(data.byStatus).length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm sm:text-base">Por Status</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2">
            {Object.entries(data.byStatus).map(([status, count]: [string, any]) => {
              const total = data.total || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={status} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-accent/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] sm:text-xs flex-shrink-0 ${statusColors[status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}
                    >
                      {status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{pct}%</span>
                    <span className="font-bold font-mono text-sm w-6 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Payment methods breakdown */}
      {data.byPayment && Object.keys(data.byPayment).length > 0 && (
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm sm:text-base">Formas de Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2">
            {Object.entries(data.byPayment).map(([method, count]: [string, any]) => (
              <div key={method} className="flex justify-between items-center p-2 rounded-lg bg-accent/30">
                <span className="text-sm">{method}</span>
                <span className="font-bold font-mono text-sm">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Orders list */}
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum serviço registrado neste período
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground px-1">
            Listagem de ordens
          </p>
          {visibleOrders.map((order: any) => (
            <Card key={order.id}>
              <CardContent className="p-3 sm:p-4 flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">OS #{order.orderNumber}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {order.customer?.name ?? '-'}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] sm:text-xs flex-shrink-0 ${statusColors[order.status] ?? ''}`}
                >
                  {order.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
          {orders.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" /> Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" /> Ver todas ({orders.length})
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/* ───── Low Stock Tab ───── */
function LowStockTab({ data }: { data: any }) {
  if (!data) return <EmptyState />;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Produtos com Estoque Baixo</p>
              <p className="text-2xl sm:text-3xl font-bold font-mono text-destructive mt-1">
                {data.total ?? 0}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>

      {(data.products ?? []).length === 0 ? (
        <div className="text-center py-8">
          <Package className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Estoque em dia! Nenhum produto abaixo do mínimo.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(data.products ?? []).map((product: any) => (
            <Card key={product.id}>
              <CardContent className="p-3 sm:p-4 flex justify-between items-center gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">{product.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{product.category ?? '-'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold font-mono text-destructive text-sm sm:text-base">{product.quantity}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Mín: {product.minQuantity}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───── Empty State ───── */
function EmptyState() {
  return (
    <div className="text-center py-12">
      <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-muted-foreground text-sm">Não foi possível carregar os dados</p>
    </div>
  );
}