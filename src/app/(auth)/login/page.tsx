
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    // Comprobar sesión manual en localStorage
    const session = localStorage.getItem('user_session');
    if (session) {
      router.push('/seleccionemoduloacceso');
    }
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const usuario = formData.get('usuario') as string;
    const contrasena = formData.get('contrasena') as string;

    if (!db) return;

    try {
      const userRef = doc(db, 'usuarios', usuario);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.contrasena === contrasena) {
          // Sesión exitosa
          localStorage.setItem('user_session', JSON.stringify({
            usuario: userData.usuario,
            email: userData.email,
            displayName: userData.nombreCompleto
          }));

          toast({
            title: "Bienvenido de nuevo",
            description: `Hola ${userData.nombreCompleto || usuario}, acceso concedido.`,
          });
          router.push('/seleccionemoduloacceso');
        } else {
          throw new Error("Contraseña incorrecta");
        }
      } else {
        throw new Error("El usuario no existe");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de acceso",
        description: error.message || "Credenciales inválidas.",
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background font-verdana">
      <div className="w-full max-w-[400px] animate-in fade-in zoom-in duration-500">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">SecureEntry</h1>
          <p className="text-muted-foreground mt-2">Acceso manual vía Firestore</p>
        </div>

        <Card className="border-border shadow-xl bg-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tu usuario y contraseña de la colección
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="usuario">Usuario</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="usuario" 
                    name="usuario" 
                    type="text" 
                    placeholder="nombre_usuario" 
                    className="pl-10 focus-visible:ring-accent" 
                    required 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contrasena">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="contrasena" 
                    name="contrasena" 
                    type="password" 
                    className="pl-10 focus-visible:ring-accent" 
                    required 
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white shadow-md transition-all active:scale-95" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Entrar <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <div className="text-center text-sm">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="font-medium text-primary hover:text-accent transition-colors">
                  Regístrate ahora
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
