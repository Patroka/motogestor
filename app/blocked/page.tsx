'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Ban, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function BlockedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">Acesso Bloqueado</h1>
          <p className="text-muted-foreground mb-6">
            Sua oficina está com o acesso bloqueado. Entre em contato com o administrador do sistema para regularizar sua situação.
          </p>
          <Button variant="outline" className="gap-2" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut className="w-4 h-4" /> Sair
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
