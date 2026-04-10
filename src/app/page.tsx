
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirección simple para evitar bucles.
    // Solo redirige una vez basándose en el estado de localStorage.
    const sessionStr = localStorage.getItem('user_session');
    
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session && session.usuario) {
          router.replace('/seleccionemoduloacceso');
          return;
        }
      } catch (e) {
        localStorage.removeItem('user_session');
      }
    }
    
    router.replace('/login');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f0f0]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
