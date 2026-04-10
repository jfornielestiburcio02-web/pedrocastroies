
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ShieldCheck, 
  LogOut, 
  User as UserIcon, 
  Settings, 
  Bell, 
  Key, 
  Activity,
  ChevronRight,
  Database,
  Lock,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function DashboardPage() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Comprobar sesión manual
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

  const userAvatar = PlaceHolderImages.find(img => img.id === 'user-avatar');
  const securityBanner = PlaceHolderImages.find(img => img.id === 'security-banner');

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Lock className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold tracking-tight font-headline">SecureEntry</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
              <Bell className="h-5 w-5" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{session.displayName || session.usuario}</p>
                <p className="text-xs text-muted-foreground">{session.email}</p>
              </div>
              <div className="relative h-9 w-9 overflow-hidden rounded-full border border-border bg-muted shadow-sm">
                {userAvatar && (
                  <Image 
                    src={userAvatar.imageUrl} 
                    alt="User" 
                    fill 
                    className="object-cover"
                    data-ai-hint="user profile avatar"
                  />
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="rounded-full text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Panel de Seguridad Manual</h1>
            <p className="text-muted-foreground">Sesión gestionada vía Firestore Colección.</p>
          </div>
          <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1 font-medium text-primary bg-primary/10">
            <ShieldCheck className="h-3.5 w-3.5" /> Sesión Manual Activa
          </Badge>
        </div>

        {/* Hero Section */}
        <div className="relative mb-8 h-48 w-full overflow-hidden rounded-2xl bg-primary shadow-lg sm:h-64">
          {securityBanner && (
            <Image 
              src={securityBanner.imageUrl} 
              alt="Security" 
              fill 
              className="object-cover mix-blend-overlay opacity-60"
              data-ai-hint="security banner"
            />
          )}
          <div className="absolute inset-0 flex flex-col justify-center p-8 text-white">
            <h2 className="text-2xl font-bold sm:text-4xl font-headline">Tu usuario está en Firestore</h2>
            <p className="mt-2 max-w-md text-primary-foreground/90 sm:text-lg">
              Estás autenticado sin el sistema estándar de Auth, usando una verificación directa de colección.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Usuario Actual', value: session.usuario, icon: UserIcon, trend: 'Válido', color: 'text-accent' },
            { label: 'Base de Datos', value: 'Firestore', icon: Database, trend: 'Conectado', color: 'text-primary' },
            { label: 'Alertas', value: '0', icon: Bell, trend: 'Ninguna', color: 'text-green-500' },
            { label: 'Estado', value: 'Online', icon: Activity, trend: 'Manual', color: 'text-primary' },
          ].map((stat, i) => (
            <Card key={i} className="overflow-hidden border-border transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-xl font-bold mt-1 truncate max-w-[120px]">{stat.value}</h3>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
