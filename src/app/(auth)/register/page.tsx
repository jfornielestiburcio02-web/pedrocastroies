
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const usuario = formData.get('usuario') as string;
    const nombre = formData.get('nombre') as string;
    const email = formData.get('email') as string;
    const contrasena = formData.get('contrasena') as string;

    if (!db) return;

    try {
      // 1. Verificar si el usuario ya existe
      const userRef = doc(db, 'usuarios', usuario);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        throw new Error("El nombre de usuario ya está en uso.");
      }

      // 2. Guardar en Firestore directamente
      await setDoc(userRef, {
        usuario,
        nombreCompleto: nombre,
        email,
        contrasena, // Almacenado como string segun requerimiento
        createdAt: new Date().toISOString()
      });

      // 3. Crear sesión manual
      localStorage.setItem('user_session', JSON.stringify({
        usuario,
        email,
        displayName: nombre
      }));

      toast({
        title: "Cuenta creada",
        description: "Bienvenido a SecureEntry. Tu usuario ha sido registrado.",
      });
      router.push('/seleccionemoduloacceso');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: error.message || "Hubo un problema al crear tu cuenta.",
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white shadow-lg">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Únete a SecureEntry</h1>
          <p className="text-muted-foreground mt-2">Crea tu usuario en Firestore</p>
        </div>

        <Card className="border-border shadow-xl bg-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-headline">Crear Cuenta</CardTitle>
            <CardDescription>
              Tus datos se guardarán en la colección 'usuarios'
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="usuario">Nombre de Usuario (ID)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="usuario" name="usuario" placeholder="juan_perez" className="pl-10 focus-visible:ring-accent" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="nombre" name="nombre" placeholder="Juan Pérez" className="pl-10 focus-visible:ring-accent" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" name="email" type="email" placeholder="ejemplo@correo.com" className="pl-10 focus-visible:ring-accent" required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contrasena">Contraseña (String)</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="contrasena" name="contrasena" type="password" className="pl-10 focus-visible:ring-accent" required />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white shadow-md transition-all active:scale-95" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <>Registrarse <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
              <div className="text-center text-sm">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="font-medium text-primary hover:text-accent transition-colors">
                  Inicia sesión
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
