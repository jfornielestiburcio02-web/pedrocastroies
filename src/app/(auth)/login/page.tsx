"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
    // Usamos sessionStorage para que la sesión no sea persistente entre cierres de navegador
    const session = sessionStorage.getItem('user_session');
    if (session) {
      router.push('/seleccionemoduloacceso');
    }
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const usuarioInput = (formData.get('usuario') as string).toLowerCase().trim();
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

          // Guardar en sessionStorage (se borra al cerrar la pestaña)
          sessionStorage.setItem('user_session', JSON.stringify({
            usuario: usuarioInput,
            sesion: jsessionid,
            displayName: userData.nombrePersona || userData.usuario
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

        <Card className="border-border shadow-xl bg-card rounded-none">
          <CardHeader className="bg-gray-50 border-b mb-6">
            <CardTitle className="text-xl uppercase tracking-tighter font-bold">Identificación</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-gray-400">Introduzca sus credenciales de Rayuela</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="usuario" className="text-[10px] font-bold uppercase text-gray-500">Usuario</Label>
                <Input id="usuario" name="usuario" type="text" className="rounded-none border-gray-300" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contrasena" className="text-[10px] font-bold uppercase text-gray-500">Contraseña</Label>
                <Input id="contrasena" name="contrasena" type="password" className="rounded-none border-gray-300" required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 mt-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 rounded-none h-12 font-bold uppercase text-[11px] tracking-widest shadow-md" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
