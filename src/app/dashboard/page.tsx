
import React from 'react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { 
  ShieldCheck, 
  LogOut, 
  User, 
  Settings, 
  Bell, 
  Key, 
  Activity,
  ChevronRight,
  Database,
  Lock
} from 'lucide-react';
import { getSession, logout } from '@/lib/auth-mock';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
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
                <p className="text-sm font-medium">Demo User</p>
                <p className="text-xs text-muted-foreground">demo@example.com</p>
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
            <form action={logout}>
              <Button variant="ghost" size="icon" type="submit" className="rounded-full text-muted-foreground hover:text-destructive">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Panel de Seguridad</h1>
            <p className="text-muted-foreground">Monitorea y gestiona la seguridad de tu identidad digital.</p>
          </div>
          <Badge variant="secondary" className="w-fit gap-1.5 px-3 py-1 font-medium text-primary bg-primary/10">
            <ShieldCheck className="h-3.5 w-3.5" /> Sesión Protegida
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
              data-ai-hint="network security cyber"
            />
          )}
          <div className="absolute inset-0 flex flex-col justify-center p-8 text-white">
            <h2 className="text-2xl font-bold sm:text-4xl font-headline">Tu seguridad es nuestra prioridad</h2>
            <p className="mt-2 max-w-md text-primary-foreground/90 sm:text-lg">
              Utilizamos técnicas avanzadas de cifrado para asegurar que solo tú tengas acceso a tu información.
            </p>
            <Button variant="secondary" className="mt-6 w-fit bg-white text-primary hover:bg-white/90">
              Ver reporte detallado
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Intentos de Acceso', value: '1,240', icon: Activity, trend: '+2.5%', color: 'text-accent' },
            { label: 'Dispositivos Activos', value: '3', icon: Database, trend: 'Estable', color: 'text-primary' },
            { label: 'Alertas Recientes', value: '0', icon: Bell, trend: '-100%', color: 'text-green-500' },
            { label: 'Último Cambio', value: 'Hace 5d', icon: Key, trend: 'Seguro', color: 'text-primary' },
          ].map((stat, i) => (
            <Card key={i} className="overflow-hidden border-border transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-muted ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <span className={`font-semibold ${stat.trend.startsWith('+') ? 'text-destructive' : 'text-green-500'}`}>
                    {stat.trend}
                  </span>
                  <span className="ml-1 text-muted-foreground text-[10px] uppercase font-bold">vs el mes pasado</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom Sections */}
        <div className="grid gap-8 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline">Actividad de Inicio de Sesión</CardTitle>
                <CardDescription>Registro histórico de tus conexiones recientes.</CardDescription>
              </div>
              <Button variant="outline" size="sm">Ver Todo</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { device: 'MacBook Pro 14"', location: 'Madrid, ES', time: 'Ahora mismo', status: 'Activo' },
                  { device: 'iPhone 15 Pro', location: 'Madrid, ES', time: 'Hoy, 09:12 AM', status: 'Completado' },
                  { device: 'Windows PC (Brave)', location: 'Valencia, ES', time: 'Ayer, 11:45 PM', status: 'Cerrado' },
                  { device: 'iPad Air', location: 'Barcelona, ES', time: '12 May, 04:30 PM', status: 'Completado' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg p-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border shadow-sm">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{item.device}</p>
                        <p className="text-xs text-muted-foreground">{item.location} • {item.time}</p>
                      </div>
                    </div>
                    <Badge variant={item.status === 'Activo' ? 'default' : 'secondary'} className="text-[10px]">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Configuración Rápida</CardTitle>
              <CardDescription>Ajustes de seguridad esenciales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-between hover:bg-primary/5 hover:text-primary">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4" />
                  <span>Editar Perfil</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="w-full justify-between hover:bg-primary/5 hover:text-primary">
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4" />
                  <span>Cambiar Contraseña</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="w-full justify-between hover:bg-primary/5 hover:text-primary">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Autenticación 2FA</span>
                </div>
                <Badge className="bg-green-500 text-[10px]">ON</Badge>
              </Button>
              <Button variant="ghost" className="w-full justify-between hover:bg-primary/5 hover:text-primary">
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  <span>Privacidad</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Separator className="my-4" />
              <div className="rounded-xl bg-accent/5 p-4 border border-accent/20">
                <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Tu Nivel de Seguridad</p>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-bold text-accent">Excelente</span>
                  <span className="text-sm font-medium text-accent">98/100</span>
                </div>
                <div className="h-2 w-full bg-accent/20 rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-[98%] rounded-full shadow-[0_0_10px_rgba(38,185,212,0.5)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
