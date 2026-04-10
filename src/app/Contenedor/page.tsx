
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContenedorPage() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    const module = localStorage.getItem('selected_module');
    
    if (!savedSession) {
      router.push('/login');
    } else {
      setSession(JSON.parse(savedSession));
      setSelectedModule(module);
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 font-verdana">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Contenedor de Módulo</h1>
          <Button variant="outline" onClick={() => router.push('/seleccionemoduloacceso')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver a Selección
          </Button>
        </div>
        
        <div className="bg-card border rounded-xl p-12 text-center shadow-sm space-y-6">
          <div className="inline-block px-6 py-3 bg-primary text-white font-bold rounded-md shadow-lg text-xl tracking-tight">
            MODULO SELECCIONADO = {selectedModule || 'NINGUNO'}
          </div>
          <p className="text-muted-foreground text-lg italic">
            Bienvenido al módulo principal. Aquí se cargará el contenido específico del área seleccionada.
          </p>
        </div>
      </div>
    </div>
  );
}
