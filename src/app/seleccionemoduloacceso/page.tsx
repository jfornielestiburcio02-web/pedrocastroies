
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, Shield, User, LogOut, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function SeleccioneModuloAccesoPage() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (!savedSession) {
      router.push('/login');
    } else {
      setSession(JSON.parse(savedSession));
      setIsLoading(false);
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('user_session');
    router.push('/login');
  }

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold font-headline mb-2">Selección de Módulo</h1>
            <p className="text-muted-foreground">Bienvenido, {session.displayName || session.usuario}. Selecciona a dónde deseas ir.</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Salir
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:shadow-lg transition-all cursor-pointer group border-primary/20" onClick={() => router.push('/dashboard')}>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6" />
              </div>
              <CardTitle>Panel de Seguridad</CardTitle>
              <CardDescription>Accede al monitoreo de seguridad y control de acceso manual.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-primary font-medium">
                Ir al Dashboard <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all cursor-pointer group opacity-60 grayscale hover:grayscale-0 hover:opacity-100">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <User className="h-6 w-6" />
              </div>
              <CardTitle>Perfil de Usuario</CardTitle>
              <CardDescription>Gestiona tus datos personales guardados en la base de datos.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-accent font-medium">
                Ver Perfil <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-muted-foreground text-sm">
          <p>Sistema SecureEntry v1.0 - Acceso Protegido por Firestore</p>
        </div>
      </div>
    </div>
  );
}
