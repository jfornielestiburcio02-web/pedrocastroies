
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
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (session) {
      router.push('/seleccionemoduloacceso');
    }
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const usuarioInput = formData.get('usuario') as string;
    const contrasena = formData.get('contrasena') as string;

    if (!db) return;

    try {
      const userRef = doc(db, 'usuarios', usuarioInput);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.contrasena === contrasena) {
          // Generar JSESSIONID aleatorio
          const jsessionid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          
          // Actualizar sesión en Firestore
          await updateDoc(userRef, { sesion: jsessionid });

          localStorage.setItem('user_session', JSON.stringify({
            usuario: usuarioInput,
            sesion: jsessionid,
            displayName: userData.nombreCompleto || usuarioInput
          }));

          toast({
            title: "Acceso concedido",
            description: `Bienvenido, sesión ${jsessionid.substring(0, 8)}...`,
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
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#f0f0f0] font-verdana">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Acceso Rayuela</h1>
        </div>

        <Card className="border-border shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="text-xl">Identificación</CardTitle>
            <CardDescription>Introduzca sus credenciales</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="usuario">Usuario</Label>
                <Input id="usuario" name="usuario" type="text" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contrasena">Contraseña</Label>
                <Input id="contrasena" name="contrasena" type="password" required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
              <div className="text-center text-sm">
                <Link href="/register" className="text-primary hover:underline">Registrarse</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
