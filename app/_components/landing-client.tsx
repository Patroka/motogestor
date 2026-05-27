'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Wrench,
  Users,
  ClipboardList,
  Package,
  DollarSign,
  BarChart3,
  Smartphone,
  Shield,
  Zap,
  ChevronRight,
  Check,
  ArrowRight,
  Menu,
  X,
  Link2,
  MessageCircle,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export default function LandingClient({ isLoggedIn, isAdmin }: Props) {
  const [mobileMenu, setMobileMenu] = useState(false);
  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(scrollYProgress, [0, 0.05], ['rgba(10,12,20,0)', 'rgba(10,12,20,0.95)']);

  const dashboardLink = isAdmin ? '/admin/dashboard' : isLoggedIn ? '/dashboard' : '/login';
  const ctaLabel = isLoggedIn ? 'Acessar Painel' : 'Começar Agora';

  return (
    <div className="min-h-screen bg-[#0a0c14] text-white overflow-x-hidden">
      {/* ─── Header ─── */}
      <motion.header
        style={{ backgroundColor: headerBg }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold font-display tracking-tight">MotoGestor Pro</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm text-gray-400 hover:text-white transition-colors">Funcionalidades</a>
            <a href="#planos" className="text-sm text-gray-400 hover:text-white transition-colors">Planos</a>
            <a href="#depoimentos" className="text-sm text-gray-400 hover:text-white transition-colors">Depoimentos</a>
            <Link href={dashboardLink}>
              <Button size="sm" className="gap-1.5">
                {ctaLabel} <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </nav>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-white/5 bg-[#0a0c14]/95 backdrop-blur-lg"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#funcionalidades" onClick={() => setMobileMenu(false)} className="block text-sm text-gray-400 hover:text-white py-2">Funcionalidades</a>
              <a href="#planos" onClick={() => setMobileMenu(false)} className="block text-sm text-gray-400 hover:text-white py-2">Planos</a>
              <a href="#depoimentos" onClick={() => setMobileMenu(false)} className="block text-sm text-gray-400 hover:text-white py-2">Depoimentos</a>
              <Link href={dashboardLink} onClick={() => setMobileMenu(false)}>
                <Button className="w-full gap-1.5">
                  {ctaLabel} <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-red-600/15 rounded-full blur-[120px]" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 text-xs sm:text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Sistema completo para oficinas de motos
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold tracking-tight leading-[1.1]"
          >
            Gerencie sua oficina{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">
              com inteligência
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg lg:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Controle clientes, ordens de serviço, estoque, caixa e muito mais.
            Tudo em um só lugar, simples e rápido.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link href={isLoggedIn ? dashboardLink : '/login'}>
              <Button size="lg" className="w-full sm:w-auto gap-2 text-base px-8 py-6 shadow-lg shadow-red-600/25">
                {ctaLabel} <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#funcionalidades">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-6 border-white/10 hover:bg-white/5">
                Conhecer recursos
              </Button>
            </a>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-14 grid grid-cols-3 gap-4 max-w-md mx-auto"
          >
            {[
              { value: '100%', label: 'Online' },
              { value: '24/7', label: 'Disponível' },
              { value: '0', label: 'Instalação' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold font-mono text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="funcionalidades" className="py-20 sm:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Tudo que sua oficina precisa
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Funcionalidades pensadas para o dia a dia da oficina de motos
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-20 sm:py-28 px-4 bg-gradient-to-b from-transparent via-red-950/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Simples de usar
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Comece a usar em minutos — sem complicação
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center relative"
              >
                <div className="w-14 h-14 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold font-mono text-red-500">{i + 1}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+50px)] w-[calc(100%-100px)] border-t border-dashed border-white/10" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="planos" className="py-20 sm:py-28 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Planos acessíveis
            </h2>
            <p className="mt-4 text-gray-400 max-w-xl mx-auto">
              Escolha o plano ideal para o tamanho da sua oficina
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`relative rounded-2xl border p-6 sm:p-8 flex flex-col ${
                  plan.popular
                    ? 'border-red-500/40 bg-gradient-to-b from-red-950/20 to-transparent shadow-xl shadow-red-600/10'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-red-600 text-xs font-bold">
                    Mais popular
                  </div>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{plan.subtitle}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-bold font-mono">R$ {plan.price}</span>
                  <span className="text-gray-400 text-sm">/mês</span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={isLoggedIn ? dashboardLink : '/login'} className="mt-8 block">
                  <Button
                    className={`w-full gap-2 ${
                      plan.popular ? 'shadow-lg shadow-red-600/25' : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    {isLoggedIn ? 'Acessar Painel' : 'Começar agora'} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="depoimentos" className="py-20 sm:py-28 px-4 bg-gradient-to-b from-transparent via-red-950/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              O que nossos clientes dizem
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed italic">"{t.quote}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-red-400 font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.shop}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <Wrench className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
              Pronto para transformar{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-400">
                sua oficina?
              </span>
            </h2>
            <p className="mt-4 text-gray-400 max-w-lg mx-auto">
              Cadastre-se gratuitamente e comece a organizar sua oficina hoje mesmo.
            </p>
            <Link href={isLoggedIn ? dashboardLink : '/login'} className="mt-8 inline-block">
              <Button size="lg" className="gap-2 text-base px-10 py-6 shadow-lg shadow-red-600/25">
                {ctaLabel} <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center">
              <Wrench className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-bold">MotoGestor Pro</span>
          </div>
          <p className="text-xs text-gray-500">
            © 2026 MotoGestor Pro. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Feature Card ─── */
function FeatureCard({ feature, index }: { feature: (typeof FEATURES)[number]; index: number }) {
  const Icon = feature.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 hover:border-red-500/30 hover:bg-red-950/10 transition-all duration-300"
    >
      <div className="w-10 h-10 rounded-xl bg-red-600/10 flex items-center justify-center mb-4 group-hover:bg-red-600/20 transition-colors">
        <Icon className="w-5 h-5 text-red-500" />
      </div>
      <h3 className="text-base sm:text-lg font-bold mb-1.5">{feature.title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
    </motion.div>
  );
}

/* ─── Data ─── */
const FEATURES = [
  {
    icon: Users,
    title: 'Cadastro de Clientes',
    description: 'Gerencie clientes com dados da moto, histórico de serviços e contato via WhatsApp.',
  },
  {
    icon: ClipboardList,
    title: 'Ordens de Serviço',
    description: 'Crie e acompanhe OS com status detalhado, do recebimento à entrega.',
  },
  {
    icon: Link2,
    title: 'Link de Acompanhamento',
    description: 'Envie um link público para o cliente acompanhar o status da moto em tempo real.',
  },
  {
    icon: Package,
    title: 'Controle de Estoque',
    description: 'Gerencie peças e produtos com alertas de estoque baixo e movimentações.',
  },
  {
    icon: DollarSign,
    title: 'Caixa e Financeiro',
    description: 'Abertura/fechamento de caixa, registro de entradas e saídas em tempo real.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios Completos',
    description: 'Faturamento diário/mensal, serviços realizados e análise de desempenho.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Integrado',
    description: 'Envie mensagens prontas para clientes: moto pronta, lembrete de revisão e mais.',
  },
  {
    icon: Smartphone,
    title: '100% Responsivo',
    description: 'Use no celular, tablet ou computador. Funciona perfeitamente em qualquer tela.',
  },
  {
    icon: Shield,
    title: 'Seguro e Confiável',
    description: 'Seus dados protegidos com criptografia. Acesso exclusivo por login e senha.',
  },
];

const STEPS = [
  {
    title: 'Crie sua conta',
    description: 'Cadastre-se em segundos com nome, email e senha. Sua oficina é criada automaticamente.',
  },
  {
    title: 'Configure sua oficina',
    description: 'Cadastre clientes, produtos e comece a criar ordens de serviço imediatamente.',
  },
  {
    title: 'Gerencie tudo',
    description: 'Acompanhe serviços, controle estoque, caixa e veja relatórios do seu negócio.',
  },
];

const PLANS = [
  {
    name: 'Profissional',
    subtitle: 'Para oficinas em crescimento',
    price: '149,90',
    popular: false,
    features: [
      'Clientes ilimitados',
      'Ordens de serviço ilimitadas',
      'Controle de estoque completo',
      'Caixa e financeiro',
      'Relatórios detalhados',
      'Link de acompanhamento',
      'WhatsApp integrado',
    ],
  },
  {
    name: 'Premium',
    subtitle: 'Para oficinas de alto volume',
    price: '249,90',
    popular: true,
    features: [
      'Tudo do plano Profissional',
      'Múltiplos usuários por oficina',
      'Relatórios em PDF',
      'Suporte prioritário',
      'Personalização da marca',
      'Backup automático',
      'Atualizações antecipadas',
    ],
  },
];

const TESTIMONIALS = [
  {
    name: 'Ricardo Santos',
    shop: 'RS Motos - São Paulo/SP',
    quote: 'Antes era tudo no papel e eu perdia tempo demais. Agora controlo tudo pelo celular, até envio o link de acompanhamento pro cliente. Mudou minha rotina!',
  },
  {
    name: 'Fernanda Lima',
    shop: 'Moto Express - Belo Horizonte/MG',
    quote: 'O controle de estoque me salvou. Agora nunca fico sem peça na hora de fazer um serviço. O sistema avisa quando tá acabando.',
  },
  {
    name: 'Carlos Mendes',
    shop: 'Oficina do Carlão - Rio de Janeiro/RJ',
    quote: 'Meus clientes adoram receber o link pra acompanhar o serviço. Diminuiu muito as ligações perguntando se a moto tá pronta.',
  },
];
