
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Loader2, 
  UserCircle, 
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
    const savedSession = localStorage.getItem('user_session');
    if (!savedSession) {
      router.push('/login');
      return;
    }

    try {
      const sessionData = JSON.parse(savedSession);
      if (!sessionData || !sessionData.usuario) {
        router.push('/login');
        return;
      }
      setSession(sessionData);

      // Cargar datos de roles desde Firestore inmediatamente
      const fetchUserRoles = async () => {
        if (!db) return;
        try {
          const userRef = doc(db, 'usuarios', sessionData.usuario);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
          }
        } catch (error) {
          console.error("Error fetching roles:", error);
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
    
    // Configurar rol inicial si es Seguimiento
    if (label === "SEGUIMIENTO") {
      const roles = userData?.rolesUsuario || [];
      if (roles.includes('EsProfesor')) {
        setActiveRole('Profesor');
      } else if (roles.includes('EsAlumno')) {
        setActiveRole('Alumno');
      }
    }
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
      {/* Main Container */}
      <div className="w-full max-w-[950px] bg-white shadow-2xl overflow-hidden border border-gray-200 relative">
        
        {/* Header - Logo Area */}
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-baseline scale-75 md:scale-100 origin-left">
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#9c4d96' }}>r</span>
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#e63946' }}>A</span>
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#ffb703' }}>Y</span>
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#8ecae6' }}>U</span>
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#fb8500' }}>E</span>
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#2a9d8f' }}>L</span>
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#0077b6' }}>A</span>
            </div>
            <div className="hidden md:block h-10 w-[2px] bg-gray-300 mx-2"></div>
            <div className="flex flex-col">
              <span className="text-base md:text-xl font-bold uppercase tracking-widest text-black leading-tight">Plataforma</span>
              <span className="text-base md:text-xl font-bold uppercase tracking-widest text-black leading-tight">EDUCATIVA</span>
              <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-[0.2em] -mt-1">Extremeña</span>
            </div>
          </div>
          
          <Button variant="ghost" onClick={handleLogout} className="text-gray-400 hover:text-destructive gap-2 text-xs uppercase font-bold tracking-tighter">
            <LogOut className="h-4 w-4" /> Salir
          </Button>
        </div>

        {/* View Switcher: Grid vs Content */}
        {!selectedModule ? (
          <>
            {/* Modules Bar (Rayuela Grid) */}
            <div className="bg-[#7d7d7d] py-16 md:py-24 px-8 flex flex-wrap justify-center gap-6 md:gap-12 animate-in fade-in duration-500">
              <ModuleBox label="Gestión" onClick={() => handleModuleClick("GESTIÓN")} borderColor="border-purple-300/40" />
              <ModuleBox label="Secretaría Virtual" onClick={() => handleModuleClick("SECRETARÍA VIRTUAL")} borderColor="border-orange-200/40" />
              <ModuleBox label="Seguimiento" onClick={() => handleModuleClick("SEGUIMIENTO")} borderColor="border-green-200/40" />
            </div>

            {/* Info Text */}
            <div className="p-4 bg-white text-[11px] text-black text-left border-t border-gray-200 italic">
              En esta pantalla se muestran los diferentes servicios a los que usted tiene acceso. Pulse sobre aquel al que desee acceder
            </div>
          </>
        ) : (
          /* Content Area (Contenedor unificado) */
          <div className="animate-in slide-in-from-right-4 fade-in duration-500 relative">
            {/* Switch Role Button - Absolute Top Right in Content Area */}
            {selectedModule === 'SEGUIMIENTO' && hasBothRoles && (
              <div className="absolute top-4 right-4 z-50">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleRole}
                  className="text-[10px] uppercase tracking-tighter bg-white border-primary/20 hover:bg-primary/5 text-primary gap-2 shadow-sm"
                >
                  <SwitchCamera className="h-3 w-3" />
                  Cambiar a {activeRole === 'Profesor' ? 'alumno' : 'profesor'}
                </Button>
              </div>
            )}

            <div className="p-8 md:p-12 space-y-8 bg-white min-h-[400px]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="bg-primary p-2 rounded-lg text-white">
                    <UserCircle className="h-6 w-6" />
                  </div>
                  {selectedModule === 'SEGUIMIENTO' ? 'Módulo de Seguimiento' : `Módulo de ${selectedModule.toLowerCase()}`}
                  {selectedModule === 'SEGUIMIENTO' && activeRole && (
                    <span className="text-sm font-normal text-muted-foreground ml-2 italic">
                      ({activeRole})
                    </span>
                  )}
                </h1>
                <Button variant="ghost" onClick={() => setSelectedModule(null)} className="gap-2 text-gray-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-widest">
                  <ArrowLeft className="h-4 w-4" /> Volver a Rayuela
                </Button>
              </div>

              <div className="text-center space-y-8 py-8">
                <div className="inline-flex items-center gap-4 px-10 py-5 bg-[#7d7d7d] text-white rounded-md shadow-lg">
                  <span className="text-xs font-medium uppercase tracking-[0.3em] opacity-80 border-r border-white/20 pr-4">Área:</span>
                  <span className="text-2xl font-bold tracking-tight">
                    {selectedModule}
                  </span>
                </div>

                <div className="grid gap-6 max-w-2xl mx-auto">
                  {selectedModule === 'SEGUIMIENTO' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <p className="text-gray-600 text-lg leading-relaxed">
                        Bienvenido, ha accedido como <span className="font-bold text-primary">{activeRole}</span>.
                      </p>
                      <div className="p-8 bg-blue-50/50 border border-blue-100 rounded-lg text-sm text-blue-800 italic leading-relaxed">
                        {activeRole === 'Profesor' 
                          ? "Usted se encuentra en el entorno de gestión docente. Desde aquí podrá realizar el seguimiento de faltas, notas y comportamiento de sus alumnos asignados."
                          : "Usted se encuentra en el entorno de seguimiento académico. Desde aquí podrá consultar sus calificaciones, faltas de asistencia y tareas pendientes."
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed border-gray-100 rounded-xl">
                      <p className="text-muted-foreground text-lg italic">
                        Cargando interfaz de {selectedModule.toLowerCase()}...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border-t border-gray-100 p-4 flex items-center justify-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Servicio Activo vía Firestore</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-white p-6 flex justify-end items-center gap-8 border-t border-gray-100">
          <div className="text-right text-[10px] text-gray-600 space-y-0.5 leading-relaxed">
            <p>Proyecto cofinanciado por</p>
            <p>Fondo Europeo de Desarrollo Regional</p>
            <p>Una manera de hacer Europa</p>
          </div>
          <div className="flex items-center gap-2 border border-gray-300 p-1 pr-3">
             <div className="bg-[#003399] p-1">
                <div className="grid grid-cols-4 gap-0.5 w-6 h-4 place-items-center">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-[1.5px] h-[1.5px] bg-yellow-400 rounded-full"></div>
                  ))}
                </div>
             </div>
             <span className="text-[10px] font-bold text-[#003399]">Unión Europea</span>
          </div>
        </div>
      </div>

      {/* Ground Decoration (Rayuela) */}
      <div className="mt-8 opacity-20 transform scale-75 md:scale-100">
        <Image 
          src="https://picsum.photos/seed/floor/800/150" 
          alt="Decoration" 
          width={800} 
          height={150}
          className="grayscale"
        />
      </div>
    </div>
  );
}

function ModuleBox({ label, onClick, borderColor }: { label: string; onClick: () => void; borderColor: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-36 h-36 md:w-44 md:h-44 border-4 ${borderColor} bg-transparent flex items-center justify-center p-6 text-white text-lg font-bold hover:bg-white/10 transition-all text-center leading-tight group shadow-sm active:scale-95`}
    >
      <span className="group-hover:scale-110 transition-transform duration-300">{label}</span>
    </button>
  );
}
