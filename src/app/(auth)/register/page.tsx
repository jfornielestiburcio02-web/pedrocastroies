
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
      const userRef = doc(db, 'usuarios', usuario);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        throw new Error("El usuario ya existe.");
      }

      // Generar sesión aleatoria
      const jsessionid = Math.random().toString(36).substring(2, 15);

      await setDoc(userRef, {
        usuario,
        nombreCompleto: nombre,
        email,
        contrasena,
        sesion: jsessionid,
        rolesUsuario: ["EsAlumno"], // Rol por defecto
        createdAt: new Date().toISOString()
      });

      localStorage.setItem('user_session', JSON.stringify({
        usuario,
        sesion: jsessionid,
        displayName: nombre
      }));

      toast({
        title: "Registro exitoso",
        description: "Su cuenta ha sido creada.",
      });
      router.push('/seleccionemoduloacceso');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#f0f0f0] font-verdana">
      <div className="w-full max-w-[400px]">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Registro Nuevo</CardTitle>
            <CardDescription>Cree su perfil educativo</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="usuario">Usuario</Label>
                <Input id="usuario" name="usuario" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input id="nombre" name="nombre" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contrasena">Contraseña</Label>
                <Input id="contrasena" name="contrasena" type="password" required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrarse"}
              </Button>
              <Link href="/login" className="text-sm text-primary hover:underline">Ya tengo cuenta</Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
