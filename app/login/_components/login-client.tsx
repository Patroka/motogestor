'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench, Mail, Lock, User, Store } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginClient() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    shopName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...(prev ?? {}), [e?.target?.name]: e?.target?.value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: form?.email,
        password: form?.password,
        redirect: false,
      });
      if (result?.error) {
        toast.error('Email ou senha inválidos');
      } else {
        router.replace('/dashboard');
      }
    } catch {
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    if (!form?.email) {
      toast.error('Digite seu email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      if (res.ok) {
        setForgotSent(true);
      } else {
        toast.error('Erro ao enviar email');
      }
    } catch {
      toast.error('Erro ao processar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? 'Erro ao criar conta');
        return;
      }
      const result = await signIn('credentials', {
        email: form?.email,
        password: form?.password,
        redirect: false,
      });
      if (result?.ok) {
        router.replace('/dashboard');
      }
    } catch {
      toast.error('Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Wrench className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight">MotoGestor Pro</h1>
          <p className="text-muted-foreground mt-1">Gestão inteligente para sua oficina</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isForgot ? 'Recuperar Senha' : isLogin ? 'Entrar' : 'Criar Conta'}</CardTitle>
            <CardDescription>
              {isForgot
                ? 'Enviaremos um link para redefinir sua senha'
                : isLogin
                  ? 'Acesse o painel da sua oficina'
                  : 'Cadastre sua oficina no sistema'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Forgot Password - Success State */}
            {isForgot && forgotSent ? (
              <div className="text-center py-4 space-y-4">
                <Mail className="w-12 h-12 text-primary mx-auto" />
                <div>
                  <p className="font-medium">Email enviado!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Se existe uma conta com o email <strong>{form.email}</strong>, você receberá um link para redefinir sua senha.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Verifique também a caixa de spam.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { setIsForgot(false); setForgotSent(false); }}
                >
                  Voltar ao login
                </Button>
              </div>
            ) : isForgot ? (
              /* Forgot Password - Form */
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgotEmail">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="forgotEmail"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={form?.email ?? ''}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => setIsForgot(false)}
                  >
                    Voltar ao login
                  </button>
                </div>
              </form>
            ) : (
            /* Normal Login/Signup Form */
            <>
            <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        placeholder="Seu nome"
                        value={form?.name ?? ''}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shopName">Nome da Oficina</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="shopName"
                        name="shopName"
                        placeholder="Ex: Moto Center"
                        value={form?.shopName ?? ''}
                        onChange={handleChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={form?.email ?? ''}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={form?.password ?? ''}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar Conta'}
              </Button>
            </form>
            {isLogin && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors"
                  onClick={() => { setIsForgot(true); setForgotSent(false); }}
                >
                  Esqueci minha senha
                </button>
              </div>
            )}
            <div className="mt-3 text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
              </button>
            </div>
            </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
