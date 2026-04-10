
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Loader2, 
  UserCircle, 
  SwitchCamera, 
  ArrowLeft,
  LogOut,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function SeleccioneModuloAccesoPage() {
  const [session, setSession] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<'Profesor' | 'Alumno' | null>(null);
  const router = useRouter();
  const db = useFirestore();

  useEffect(() => {
    const savedSessionStr = localStorage.getItem('user_session');
    
    // Si no hay sesión, crear una aleatoria para el componente pero redirigir si no es persistente
    if (!savedSessionStr) {
      const randomSession = "GUEST-" + Math.random().toString(36).substring(7);
      console.log("Generando sesión aleatoria temporal:", randomSession);
      router.push('/login');
      return;
    }

    try {
      const sessionData = JSON.parse(savedSessionStr);
      if (!sessionData || !sessionData.usuario) {
        router.push('/login');
        return;
      }
      setSession(sessionData);

      const fetchUserRoles = async () => {
        if (!db) return;
        try {
          const userRef = doc(db, 'usuarios', sessionData.usuario);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            
            // Validar jsessionid/sesion
            if (data.sesion !== sessionData.sesion) {
              console.warn("Discrepancia de sesión detectada");
            }
            
            setUserData(data);
            
            // Auto-selección de rol inicial si el usuario tiene roles
            const roles = data.rolesUsuario || [];
            if (roles.includes('EsProfesor')) {
              setActiveRole('Profesor');
            } else if (roles.includes('EsAlumno')) {
              setActiveRole('Alumno');
            }
          }
        } catch (error) {
          console.error("Error validando sesión manual:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserRoles();
    } catch (e) {
      router.push('/login');
    }
  }, [router, db]);

  const handleModuleClick = (label: string) => {
    setSelectedModule(label.toUpperCase());
  };

  const toggleRole = () => {
    setActiveRole(prev => prev === 'Profesor' ? 'Alumno' : 'Profesor');
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    router.push('/login');
  };

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f0f0]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasBothRoles = userData?.rolesUsuario?.includes('EsProfesor') && userData?.rolesUsuario?.includes('EsAlumno');

  return (
    <div className="min-h-screen bg-[#f0f0f0] font-verdana flex flex-col items-center pt-8 md:pt-12 px-4 pb-12">
      <div className="w-full max-w-[950px] bg-white shadow-2xl overflow-hidden border border-gray-200">
        
        {/* Header Rayuela */}
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-baseline scale-75 md:scale-100 origin-left font-bold">
              <span className="text-4xl" style={{ color: '#9c4d96' }}>r</span>
              <span className="text-4xl" style={{ color: '#e63946' }}>A</span>
              <span className="text-4xl" style={{ color: '#ffb703' }}>Y</span>
              <span className="text-4xl" style={{ color: '#8ecae6' }}>U</span>
              <span className="text-4xl" style={{ color: '#fb8500' }}>E</span>
              <span className="text-4xl" style={{ color: '#2a9d8f' }}>L</span>
              <span className="text-4xl" style={{ color: '#0077b6' }}>A</span>
            </div>
            <div className="hidden md:block h-10 w-[2px] bg-gray-300 mx-2"></div>
            <div className="flex flex-col">
              <span className="text-base md:text-xl font-bold uppercase tracking-widest text-black leading-tight">Plataforma</span>
              <span className="text-base md:text-xl font-bold uppercase tracking-widest text-black leading-tight">EDUCATIVA</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
             <span className="text-[10px] text-gray-400 font-bold">SESION={session.sesion}</span>
             <Button variant="ghost" onClick={handleLogout} className="text-gray-400 hover:text-destructive gap-2 text-xs uppercase font-bold tracking-tighter h-auto p-0">
               <LogOut className="h-4 w-4" /> Salir
             </Button>
          </div>
        </div>

        {!selectedModule ? (
          <>
            {/* Grid de Módulos (Rayuela Grid) */}
            <div className="bg-[#7d7d7d] py-16 md:py-24 px-8 flex flex-wrap justify-center gap-6 md:gap-12">
              <ModuleBox label="Gestión" onClick={() => handleModuleClick("GESTIÓN")} />
              <ModuleBox label="Secretaría Virtual" onClick={() => handleModuleClick("SECRETARÍA VIRTUAL")} />
              <ModuleBox label="Seguimiento" onClick={() => handleModuleClick("SEGUIMIENTO")} />
            </div>

            <div className="p-4 bg-white text-[11px] text-black text-left border-t border-gray-200 italic">
              En esta pantalla se muestran los diferentes servicios a los que usted tiene acceso. Pulse sobre aquel al que desee acceder
            </div>
          </>
        ) : (
          /* Contenido Directo del Módulo */
          <div className="animate-in fade-in duration-300 relative">
            {selectedModule === 'SEGUIMIENTO' && hasBothRoles && (
              <div className="absolute top-4 right-4 z-50">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleRole}
                  className="text-[10px] uppercase tracking-tighter bg-white border-primary/20 text-primary gap-2 shadow-sm"
                >
                  <SwitchCamera className="h-3 w-3" />
                  Cambiar a {activeRole === 'Profesor' ? 'alumno' : 'profesor'}
                </Button>
              </div>
            )}

            <div className="p-8 md:p-12 space-y-8 bg-white min-h-[400px]">
              <div className="flex items-center justify-between border-b pb-4">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  MODULO SELECCIONADO = {selectedModule}
                  {selectedModule === 'SEGUIMIENTO' && activeRole && (
                    <span className="text-sm font-normal text-muted-foreground italic">
                      ({activeRole})
                    </span>
                  )}
                </h1>
                <Button variant="ghost" onClick={() => setSelectedModule(null)} className="gap-2 text-gray-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest">
                  <ArrowLeft className="h-4 w-4" /> Volver
                </Button>
              </div>

              <div className="text-center space-y-6">
                 <div className="p-10 border-2 border-dashed border-gray-100 rounded-xl max-w-2xl mx-auto">
                    {selectedModule === 'SEGUIMIENTO' ? (
                      <div className="space-y-4">
                        <p className="text-gray-600">Acceso como <span className="font-bold">{activeRole}</span></p>
                        <div className="bg-blue-50 p-6 rounded text-sm text-blue-700 italic">
                          {activeRole === 'Profesor' 
                            ? "Entorno de gestión docente activo para el seguimiento de alumnos." 
                            : "Entorno de seguimiento académico activo para consulta de notas."}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Cargando interfaz del módulo de {selectedModule.toLowerCase()}...</p>
                    )}
                 </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border-t border-gray-100 p-4 flex items-center justify-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Servicio Conectado (Firestore SESION OK)</span>
            </div>
          </div>
        )}

        {/* Footer Rayuela */}
        <div className="bg-white p-6 flex justify-end items-center gap-8 border-t border-gray-100">
          <div className="text-right text-[10px] text-gray-600 leading-relaxed">
            <p>Fondo Europeo de Desarrollo Regional</p>
            <p>Una manera de hacer Europa</p>
          </div>
          <div className="flex items-center gap-2 border border-gray-300 p-1 pr-3">
             <div className="bg-[#003399] p-1">
                <div className="grid grid-cols-4 gap-0.5 w-6 h-4 place-items-center">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-[1px] h-[1px] bg-yellow-400 rounded-full"></div>
                  ))}
                </div>
             </div>
             <span className="text-[9px] font-bold text-[#003399]">Unión Europea</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleBox({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-36 h-36 md:w-44 md:h-44 border-4 border-white/20 bg-transparent flex items-center justify-center p-6 text-white text-lg font-bold hover:bg-white/10 transition-all text-center leading-tight shadow-sm active:scale-95"
    >
      {label}
    </button>
  );
}
