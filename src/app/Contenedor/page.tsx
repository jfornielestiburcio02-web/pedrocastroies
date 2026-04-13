
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, UserCircle, SwitchCamera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ContenedorPage() {
  const [session, setSession] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<'Profesor' | 'Alumno' | null>(null);
  const router = useRouter();
  const db = useFirestore();

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    const module = localStorage.getItem('selected_module');
    
    if (!savedSession) {
      router.push('/error-sesion-inexistente');
      return;
    }

    try {
      const sessionData = JSON.parse(savedSession);
      
      // Validación crítica: Si no hay identificador de usuario, la sesión es inválida
      if (!sessionData || !sessionData.usuario) {
        router.push('/error-sesion-malformada');
        return;
      }

      setSession(sessionData);
      setSelectedModule(module);

      // Fetch user data from Firestore to check roles
      const fetchUserRoles = async () => {
        // Doble comprobación de seguridad para evitar errores de Firebase
        if (!db || !sessionData.usuario) {
          setIsLoading(false);
          return;
        }
        
        try {
          const userRef = doc(db, 'usuarios', sessionData.usuario);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            
            const roles = data.rolesUsuario || [];
            if (roles.includes('EsProfesor')) {
              setActiveRole('Profesor');
            } else if (roles.includes('EsAlumno')) {
              setActiveRole('Alumno');
            }
          }
        } catch (error) {
          console.error("Error fetching roles from Firestore:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserRoles();
    } catch (e) {
      router.push('/error-excepcion-sesion');
    }
  }, [router, db]);

  const toggleRole = () => {
    setActiveRole(prev => prev === 'Profesor' ? 'Alumno' : 'Profesor');
  };

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasBothRoles = userData?.rolesUsuario?.includes('EsProfesor') && userData?.rolesUsuario?.includes('EsAlumno');

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 font-verdana relative">
      {/* Switch Role Button - Top Right */}
      {selectedModule === 'SEGUIMIENTO' && hasBothRoles && (
        <div className="absolute top-4 right-4 z-50">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleRole}
            className="text-[10px] uppercase tracking-tighter bg-white border-primary/20 hover:bg-primary/5 text-primary gap-2"
          >
            <SwitchCamera className="h-3 w-3" />
            Cambiar a {activeRole === 'Profesor' ? 'alumno' : 'profesor'}
          </Button>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg text-white">
                <UserCircle className="h-6 w-6" />
              </div>
              {selectedModule === 'SEGUIMIENTO' ? 'Módulo de Seguimiento' : 'Contenedor de Módulo'}
              {selectedModule === 'SEGUIMIENTO' && activeRole && (
                <span className="text-sm font-normal text-muted-foreground ml-2 italic">
                  ({activeRole})
                </span>
              )}
            </h1>
          </div>
          <Button variant="ghost" onClick={() => router.push('/seleccionemoduloacceso')} className="gap-2 text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Volver a Rayuela
          </Button>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-8 md:p-12 text-center space-y-8">
            <div className="inline-flex items-center gap-4 px-8 py-4 bg-[#7d7d7d] text-white rounded-md shadow-inner">
              <span className="text-sm font-medium uppercase tracking-[0.2em] opacity-80">Área:</span>
              <span className="text-xl font-bold tracking-tight">
                {selectedModule || 'SIN SELECCIONAR'}
              </span>
            </div>

            <div className="grid gap-6 max-w-2xl mx-auto">
              {selectedModule === 'SEGUIMIENTO' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Usted ha accedido como <span className="font-bold text-primary">{activeRole}</span>.
                  </p>
                  <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-blue-800 italic">
                    {activeRole === 'Profesor' 
                      ? "Desde aquí podrá realizar el seguimiento de faltas, notas y comportamiento de sus alumnos asignados."
                      : "Desde aquí podrá consultar sus calificaciones, faltas de asistencia y tareas pendientes."
                    }
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-lg italic">
                  Bienvenido al módulo principal de la plataforma. El contenido se está cargando...
                </p>
              )}
            </div>
          </div>
          
          <div className="bg-gray-50 border-t border-gray-100 p-4 flex items-center justify-center gap-4">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[11px] text-gray-400 uppercase tracking-widest">Servicio Conectado vía Firestore</span>
          </div>
        </div>
      </div>
    </div>
  );
}
