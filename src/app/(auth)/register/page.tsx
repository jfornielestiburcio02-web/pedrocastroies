
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, isUserLoading, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update basic profile
      await updateProfile(user, { displayName: name });

      // Create UserProfile in Firestore (Non-blocking as per guidelines)
      const profileRef = doc(db, 'user_profiles', user.uid);
      setDocumentNonBlocking(profileRef, {
        id: user.uid,
        firebaseUid: user.uid,
        email: user.email,
        displayName: name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: "Cuenta creada",
        description: "Tu registro ha sido exitoso. Bienvenido a SecureEntry.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: error.message || "Hubo un problema al crear tu cuenta.",
      });
      setIsLoading(false);
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white shadow-lg">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Únete a SecureEntry</h1>
          <p className="text-muted-foreground mt-2">La forma más segura de gestionar tu identidad</p>
        </div>

        <Card className="border-border shadow-xl bg-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-headline">Crear Cuenta</CardTitle>
            <CardDescription>
              Completa los datos para empezar tu experiencia segura
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="name" name="name" placeholder="Juan Pérez" className="pl-10 focus-visible:ring-accent" required />
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
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" name="password" type="password" className="pl-10 focus-visible:ring-accent" required />
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
