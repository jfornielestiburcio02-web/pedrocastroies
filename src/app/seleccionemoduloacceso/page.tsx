
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  SwitchCamera, 
  ArrowLeft,
  LogOut
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
    
    if (!savedSessionStr) {
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
            setUserData(data);
            
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasBothRoles = userData?.rolesUsuario?.includes('EsProfesor') && userData?.rolesUsuario?.includes('EsAlumno');

  return (
    <div className="min-h-screen bg-white font-verdana flex flex-col">
      {/* Header Rayuela Full Width */}
      <div className="w-full p-4 md:p-6 flex items-center justify-between border-b border-gray-200 bg-white">
        <div className="flex items-center gap-4">
          <div className="flex items-baseline font-bold scale-90 md:scale-110 origin-left">
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
           <span className="text-[10px] text-gray-400 font-bold uppercase">SESION={session.sesion}</span>
           <Button variant="ghost" onClick={handleLogout} className="text-gray-500 hover:text-destructive gap-2 text-xs uppercase font-bold tracking-tighter h-auto p-0 transition-colors">
             <LogOut className="h-3 w-3" /> Salir
           </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {!selectedModule ? (
          <>
            {/* Grid de Módulos Expandido */}
            <div className="flex-1 bg-[#7d7d7d] flex flex-wrap items-center justify-center content-center gap-8 md:gap-16 p-8">
              <ModuleBox label="Gestión" onClick={() => handleModuleClick("GESTIÓN")} />
              <ModuleBox label="Secretaría Virtual" onClick={() => handleModuleClick("SECRETARÍA VIRTUAL")} />
              <ModuleBox label="Seguimiento" onClick={() => handleModuleClick("SEGUIMIENTO")} />
            </div>

            <div className="w-full p-4 bg-white text-[12px] text-black text-left border-t border-gray-200 italic px-8">
              En esta pantalla se muestran los diferentes servicios a los que usted tiene acceso. Pulse sobre aquel al que desee acceder
            </div>
          </>
        ) : (
          /* Contenido Directo del Módulo Full Screen */
          <div className="flex-1 animate-in fade-in duration-300 relative bg-white flex flex-col">
            {selectedModule === 'SEGUIMIENTO' && hasBothRoles && (
              <div className="absolute top-6 right-8 z-50">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleRole}
                  className="text-[10px] uppercase tracking-tighter bg-white border-primary/20 text-primary gap-2 shadow-sm hover:bg-primary/5"
                >
                  <SwitchCamera className="h-3 w-3" />
                  Cambiar a {activeRole === 'Profesor' ? 'alumno' : 'profesor'}
                </Button>
              </div>
            )}

            <div className="p-8 md:p-12 flex-1 flex flex-col space-y-8">
              <div className="flex items-center justify-between border-b pb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  MODULO SELECCIONADO = {selectedModule}
                  {selectedModule === 'SEGUIMIENTO' && activeRole && (
                    <span className="text-lg font-normal text-muted-foreground italic">
                      ({activeRole})
                    </span>
                  )}
                </h1>
                <Button variant="ghost" onClick={() => setSelectedModule(null)} className="gap-2 text-gray-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-[0.2em]">
                  <ArrowLeft className="h-4 w-4" /> Volver al menú
                </Button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center">
                 <div className="p-12 border-4 border-dashed border-gray-50 rounded-2xl w-full max-w-4xl text-center space-y-6">
                    {selectedModule === 'SEGUIMIENTO' ? (
                      <div className="space-y-6">
                        <p className="text-xl text-gray-600">Acceso como <span className="font-bold text-primary">{activeRole}</span></p>
                        <div className="bg-blue-50/50 p-8 rounded-lg border border-blue-100 text-base text-blue-800 italic leading-relaxed">
                          {activeRole === 'Profesor' 
                            ? "Entorno de gestión docente activo para el seguimiento de alumnos asignados, faltas y calificaciones." 
                            : "Entorno de seguimiento académico activo para consulta de notas y asistencia personal."}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xl">Cargando interfaz del módulo de {selectedModule.toLowerCase()}...</p>
                    )}
                 </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border-t border-gray-100 p-4 flex items-center justify-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[11px] text-gray-400 uppercase tracking-[0.3em] font-bold">Servicio Conectado (Firestore SESION OK)</span>
            </div>
          </div>
        )}

        {/* Footer Rayuela Full Width */}
        <div className="bg-white p-6 flex justify-end items-center gap-8 border-t border-gray-100 px-8">
          <div className="text-right text-[10px] text-gray-500 leading-relaxed font-bold uppercase">
            <p>Fondo Europeo de Desarrollo Regional</p>
            <p>Una manera de hacer Europa</p>
          </div>
          <div className="flex items-center gap-3 border border-gray-200 p-2 pr-4 shadow-sm bg-white">
             <div className="bg-[#003399] p-1.5 rounded-sm">
                <div className="grid grid-cols-4 gap-0.5 w-7 h-5 place-items-center">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-[1.5px] h-[1.5px] bg-yellow-400 rounded-full"></div>
                  ))}
                </div>
             </div>
             <span className="text-[10px] font-bold text-[#003399] uppercase tracking-wider">Unión Europea</span>
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
      className="w-40 h-40 md:w-56 md:h-56 border-4 border-white/30 bg-transparent flex items-center justify-center p-8 text-white text-xl md:text-2xl font-bold hover:bg-white/10 hover:border-white/50 transition-all text-center leading-tight shadow-lg active:scale-95 group"
    >
      <span className="group-hover:scale-110 transition-transform">{label}</span>
    </button>
  );
}
