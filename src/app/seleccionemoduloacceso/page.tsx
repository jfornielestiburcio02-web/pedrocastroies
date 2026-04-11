
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  ArrowLeft,
  X,
  Clock,
  BookOpen,
  MessageSquare,
  Home,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SeleccioneModuloAccesoPage() {
  const [session, setSession] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
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

      const fetchUserData = async () => {
        if (!db) return;
        try {
          const userRef = doc(db, 'usuarios', sessionData.usuario);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            
            const roles = data.rolesUsuario || [];
            // Prioridad de rol inicial
            if (roles.includes('EsDireccion')) setActiveRole('Dirección');
            else if (roles.includes('EsCau')) setActiveRole('CAU');
            else if (roles.includes('EsProfesor')) setActiveRole('Profesor');
            else if (roles.includes('EsAlumno')) setActiveRole('Alumno');
          }
        } catch (error) {
          console.error("Error validando sesión:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchUserData();
    } catch (e) {
      router.push('/login');
    }
  }, [router, db]);

  const handleModuleClick = (label: string) => {
    setSelectedModule(label.toUpperCase());
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    router.push('/login');
  };

  const getAvailableRoles = () => {
    if (!userData?.rolesUsuario) return [];
    return userData.rolesUsuario.map((r: string) => {
      if (r === 'EsDireccion') return 'Dirección';
      if (r === 'EsCau') return 'CAU';
      if (r === 'EsProfesor') return 'Profesor';
      if (r === 'EsAlumno') return 'Alumno';
      return r;
    });
  };

  const cycleRole = () => {
    const roles = getAvailableRoles();
    const currentIndex = roles.indexOf(activeRole!);
    const nextIndex = (currentIndex + 1) % roles.length;
    setActiveRole(roles[nextIndex]);
  };

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const availableRoles = getAvailableRoles();
  const hasMultipleRoles = availableRoles.length > 1;

  return (
    <div className="min-h-screen bg-white font-verdana flex flex-col w-full overflow-x-hidden">
      {/* Header Estilo Rayuela (Solo aparece si hay un módulo seleccionado) */}
      {selectedModule && (
        <div className="w-full bg-[#e9e9e9] border-b border-gray-300 p-2 flex flex-col md:flex-row items-center justify-between shadow-sm animate-in fade-in slide-in-from-top duration-500">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Perfil */}
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-white shadow-sm bg-gray-200">
                <AvatarImage src={userData?.imagenPerfil || `https://picsum.photos/seed/${session.usuario}/150/150`} />
                <AvatarFallback>{session.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-[#e9e9e9]">
                70
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-[13px] text-black">
                  {userData?.nombreCompleto || session.usuario} ({activeRole})
                </span>
              </div>
              <span className="text-[11px] text-gray-600">
                06007031 - I.E.S. - Eugenio Hermoso (Fregenal de la Sierra)
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-gray-500 font-medium">
                <span className="hover:underline cursor-pointer">Documentos solicitados</span>
                <span className="hover:underline cursor-pointer">Configuración</span>
                <span className="hover:underline cursor-pointer">Manuales</span>
                <span className="hover:underline cursor-pointer">Nuevo mensaje</span>
                <span className="hover:underline cursor-pointer">Mis mensajes</span>
              </div>
              <div className="flex gap-4 mt-2">
                <Clock className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                <BookOpen className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                <Home className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => setSelectedModule(null)} />
                <MessageSquare className="h-4 w-4 text-[#fb8500] cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Sección Central (Cofinanciado) */}
          <div className="hidden lg:flex flex-col items-center text-center max-w-[300px]">
            <p className="text-[9px] text-gray-500 uppercase leading-tight">Proyecto cofinanciado por</p>
            <p className="text-[10px] font-bold text-gray-600 leading-tight">Fondo Europeo de Desarrollo Regional.</p>
            <p className="text-[10px] text-gray-500 leading-tight italic">Una manera de hacer Europa</p>
          </div>

          {/* Lado Derecho (Banderas, Botones, Rol Switch) */}
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <div className="flex items-center gap-2">
               <div className="flex flex-col items-center">
                  <div className="w-12 h-8 border border-gray-300 relative overflow-hidden">
                     <div className="absolute top-0 w-full h-1/3 bg-green-700"></div>
                     <div className="absolute top-1/3 w-full h-1/3 bg-white"></div>
                     <div className="absolute bottom-0 w-full h-1/3 bg-black"></div>
                  </div>
               </div>
               <div className="w-12 h-8 bg-[#003399] flex items-center justify-center relative overflow-hidden border border-gray-300">
                  <div className="grid grid-cols-4 gap-0.5 place-items-center p-1">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-[1.5px] h-[1.5px] bg-yellow-400 rounded-full"></div>
                    ))}
                  </div>
                  <span className="absolute bottom-0 right-0 text-[6px] text-white p-0.5 leading-none">UE</span>
               </div>
            </div>

            <div className="flex flex-col items-center gap-2">
               <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none bg-gray-500 text-white hover:bg-gray-600" onClick={() => setSelectedModule(null)}>
                    <Home className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="h-6 w-6 rounded-none bg-gray-700 text-white hover:bg-black">
                    <X className="h-3 w-3" />
                  </Button>
               </div>
               
               {hasMultipleRoles ? (
                 <div className="flex flex-col items-center group cursor-pointer" onClick={cycleRole}>
                    <div className="bg-[#fb8500] p-1 rounded-sm shadow-sm transition-transform group-hover:scale-105">
                      <Monitor className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-[9px] font-bold text-[#fb8500] uppercase mt-0.5 tracking-tighter">Cambiar perfil</span>
                 </div>
               ) : (
                 <div className="flex flex-col items-center opacity-50 grayscale">
                    <div className="bg-gray-400 p-1 rounded-sm">
                      <Monitor className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase mt-0.5 tracking-tighter">Ciudadano</span>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Segundo Header (Logo Rayuela - Solo se muestra si NO hay módulo seleccionado) */}
      {!selectedModule && (
        <div className="w-full p-6 flex items-center justify-between border-b border-gray-200 bg-white">
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
             <span className="text-[10px] text-gray-400 font-bold uppercase">JSESSIONID={session.sesion}</span>
             <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[10px] text-gray-500 hover:text-black p-0 h-auto">
               Cerrar sesión
             </Button>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col w-full">
        {!selectedModule ? (
          <>
            {/* Grid de Módulos */}
            <div className="flex-1 bg-[#7d7d7d] flex flex-wrap items-center justify-center content-center gap-8 md:gap-16 p-8 min-h-[400px]">
              <ModuleBox label="Gestión" onClick={() => handleModuleClick("Gestión")} />
              <ModuleBox label="Secretaría Virtual" onClick={() => handleModuleClick("Secretaría Virtual")} />
              <ModuleBox label="Seguimiento" onClick={() => handleModuleClick("Seguimiento")} />
            </div>

            <div className="w-full p-4 bg-white text-[12px] text-black text-left border-t border-gray-200 italic px-8">
              En esta pantalla se muestran los diferentes servicios a los que usted tiene acceso. Pulse sobre aquel al que desee acceder
            </div>
          </>
        ) : (
          /* Vista de Módulo Seleccionado */
          <div className="flex-1 animate-in fade-in duration-300 relative bg-white flex flex-col w-full">
            <div className="p-8 md:p-12 flex-1 flex flex-col space-y-8 max-w-7xl mx-auto w-full">
              <div className="flex items-center justify-between border-b pb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 uppercase tracking-tight">
                  MODULO SELECCIONADO = {selectedModule}
                  <span className="text-lg font-normal text-muted-foreground italic">
                    ({activeRole})
                  </span>
                </h1>
                <Button variant="ghost" onClick={() => setSelectedModule(null)} className="gap-2 text-gray-500 hover:text-primary transition-colors text-xs font-bold uppercase tracking-[0.2em]">
                  <ArrowLeft className="h-4 w-4" /> Volver al menú
                </Button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center">
                 <div className="p-16 border-2 border-gray-100 bg-gray-50/30 rounded-3xl w-full text-center space-y-8 shadow-inner">
                    <div className="space-y-6">
                      <p className="text-2xl text-gray-600">Acceso activo como <span className="font-bold text-primary">{activeRole}</span></p>
                      <div className="bg-white p-10 rounded-xl border border-gray-200 text-lg text-gray-700 italic leading-relaxed shadow-sm max-w-3xl mx-auto">
                        {activeRole === 'Profesor' 
                          ? "Entorno de gestión docente activo para el seguimiento de alumnos asignados, faltas y calificaciones." 
                          : activeRole === 'Alumno'
                          ? "Entorno de seguimiento académico activo para consulta de notas y asistencia personal."
                          : `Entorno de gestión administrativa activa para el perfil de ${activeRole}.`}
                      </div>
                    </div>
                    <div className="flex justify-center pt-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase tracking-wider">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Sesión Verificada
                      </div>
                    </div>
                 </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border-t border-gray-100 p-4 flex items-center justify-center gap-4">
              <span className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-bold">Servicio Conectado (Firestore SESION OK)</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-white p-6 flex justify-end items-center gap-8 border-t border-gray-100 px-8 w-full mt-auto">
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
