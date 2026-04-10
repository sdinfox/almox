import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, MessageSquare, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Footer from '@/components/layout/Footer';

const SubscriptionExpired = () => {
  const { profile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl border-t-4 border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-3xl font-bold">Período de Teste Expirado</CardTitle>
            <CardDescription className="text-lg">
              Sua conta da empresa <span className="font-bold text-foreground">{profile?.organization?.name}</span> precisa de uma assinatura ativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2 py-6">
            <div className="border rounded-xl p-6 space-y-4 bg-muted/30">
              <div className="flex items-center gap-2 text-primary font-bold">
                <ShieldCheck className="h-5 w-5" />
                Plano Basic
              </div>
              <p className="text-sm text-muted-foreground">Ideal para pequenas equipes que estão começando.</p>
              <div className="text-2xl font-bold">R$ 157<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
              <Button className="w-full" variant="outline" disabled>Em Breve</Button>
            </div>
            <div className="border-2 border-primary rounded-xl p-6 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] px-2 py-1 font-bold uppercase">Popular</div>
              <div className="flex items-center gap-2 text-primary font-bold">
                <CreditCard className="h-5 w-5" />
                Plano Pro
              </div>
              <p className="text-sm text-muted-foreground">Controle total com relatórios avançados e mais usuários.</p>
              <div className="text-2xl font-bold">R$ 319<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
              <Button className="w-full">Falar com Consultor</Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="ghost" onClick={handleLogout}>Sair da Conta</Button>
            <Button variant="secondary">
              <MessageSquare className="mr-2 h-4 w-4" />
              Suporte
            </Button>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default SubscriptionExpired;