
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { doc, query, collection, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';

// Layout Components
import { RayuelaHeader } from '@/components/rayuela/layout/rayuela-header';
import { RayuelaSidebar } from '@/components/rayuela/layout/rayuela-sidebar';
import { RayuelaContentManager } from '@/components/rayuela/layout/rayuela-content-manager';
import { ModuleBox } from '@/components/rayuela/shared-components';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SeleccioneModuloAccesoPage() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [activeSubContent, setActiveSubContent] = useState<string | null>(null);
  const [sidebarMode, setSidebarMode] = useState<'ACADEMIC' | 'MESSAGING'>('ACADEMIC');
  const [isChangeProfileOpen, setIsChangeProfileOpen] = useState(false);
  
  const [targetIncidentData, setTargetIncidentData] = useState<{ studentId: string } | null>(null);

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'faltas': false,
    'conductas': false,
    'graves': false,
    'usuarios': false,
    'horarios': false,
    'mensajeria': false,
    'miAlumnado': false,
    'grupos_root': false,
    'horario_profesor': false,
    'calificaciones_root': false,
    'evaluaciones': false,
    'resumen': false,
    'evaluaciones_dir': false,
    'apertura_root': false,
    'resumenes_root': false,
    'faltas_alum': false,
    'comportamiento_alum': false,
    'evaluaciones_alum': false,
    'notificaciones_root': false,
    'arqueo': false,
    'titulos': false,
    'sello': false,
    'expedientes': false,
    'perfil': false,
    'pruebas_diag': false,
    'pruebas_diag_root': false,
    'resultados_diag': false,
    'enlaces': false,
    'extraesc_root': false,
    'proa_root': false,
    'pt_root': false,
    'sincro_root': false,
    'bienestar_ayuda': false,
    'dual_root': false
  });
  
  const router = useRouter();
  const db = useFirestore();

  useEffect(() => {
    const savedSessionStr = sessionStorage.getItem('user_session');
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
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !session?.usuario) return null;
    return doc(db, 'usuarios', session.usuario);
  }, [db, session?.usuario]);

  const { data: userData, isLoading: loadingUserData } = useDoc(userDocRef);

  useEffect(() => {
    if (userData && !activeRole) {
      const roles = userData.rolesUsuario || [];
      if (roles.includes('EsDireccion')) setActiveRole('Dirección');
      else if (roles.includes('EsCau')) setActiveRole('CAU');
      else if (roles.includes('EsProfesor')) setActiveRole('Profesor');
      else if (roles.includes('EsAlumno')) setActiveRole('Alumno');
      else if (roles.includes('EsSecretaria')) setActiveRole('Secretaría');
      else if (roles.includes('EsCiudadano')) setActiveRole('Ciudadano');
      setIsLoading(false);
    } else if (userData) {
      setIsLoading(false);
    }
  }, [userData, activeRole]);

  const allAvailableProfiles = useMemo(() => {
    if (!userData) return [];
    
    const roleMap: Record<string, string> = {
      'EsDireccion': 'Dirección',
      'EsCau': 'CAU',
      'EsProfesor': 'Profesor',
      'EsAlumno': 'Alumno',
      'EsSecretaria': 'Secretaría',
      'EsCiudadano': 'Ciudadano'
    };

    const baseRoles = (userData.rolesUsuario || []);
    const roles = baseRoles.map((r: string) => ({
      id: r,
      label: roleMap[r] || r,
      type: 'ROLE'
    }));

    if (baseRoles.includes('EsProfesor')) {
      roles.push({
        id: 'ProfesorGestionVirtual',
        label: 'Profesor Gestión',
        type: 'ROLE'
      });
    }

    const additional = (userData.perfilesAdicionales || []).map((p: string) => ({
      id: p,
      label: p,
      type: 'SUBPROFILE'
    }));

    return [...roles, ...additional];
  }, [userData]);

  const unreadMessagesQuery = useMemoFirebase(() => {
    if (!db || !session?.usuario) return null;
    return query(
      collection(db, 'mensajes'),
      where('destinatarioId', '==', session.usuario),
      where('leido', '==', false),
      where('eliminado', '==', false)
    );
  }, [db, session?.usuario]);

  const { data: unreadMessages } = useCollection(unreadMessagesQuery);
  const unreadCount = unreadMessages?.length || 0;

  const handleModuleClick = (label: string) => {
    setSelectedModule(label.toUpperCase());
    setActiveSubContent(null);
    setSidebarMode('ACADEMIC');
    
    const roles = userData?.rolesUsuario || [];
    if (label === "Seguimiento") {
      if (roles.includes('EsProfesor')) setActiveRole('Profesor');
      else if (roles.includes('EsAlumno')) setActiveRole('Alumno');
    } else if (label === "Gestión") {
      if (roles.includes('EsDireccion')) {
        setActiveRole('Dirección');
      } else if (roles.includes('EsProfesor')) {
        setActiveRole('Profesor Gestión');
      }
    } else if (label === "Secretaría Virtual") {
      if (roles.includes('EsSecretaria')) {
        setActiveRole('Secretaría');
      } else if (roles.includes('EsCiudadano')) {
        setActiveRole('Ciudadano');
      }
    } else if (label.startsWith("CAU")) {
      setActiveRole('CAU');
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user_session');
    router.push('/login');
  };

  const handleNavigateToIncident = (studentId: string) => {
    setActiveSubContent('Alumnado Incidente');
    setTargetIncidentData({ studentId });
  };

  if (isLoading || loadingUserData || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userRoles = Array.from(new Set(userData?.rolesUsuario || [])) as string[];
  const canSeeSeguimiento = userRoles.includes('EsProfesor') || userRoles.includes('EsAlumno');
  const canSeeGestion = userRoles.includes('EsDireccion') || userRoles.includes('EsProfesor');
  const canSeeSecretaria = userRoles.includes('EsSecretaria') || userRoles.includes('EsCiudadano');
  const canSeeCau = userRoles.includes('EsCau');

  const isTeacherTutor = userData?.esTutor && userData?.esTutor !== "";
  
  const effectiveTeacherId = userData?.esDADDe || session.usuario;

  const showSidebar = selectedModule && 
    activeRole !== 'Ciudadano' &&
    (activeRole === 'Profesor' || 
     activeRole === 'Dirección' || 
     activeRole === 'Alumno' || 
     activeRole === 'Secretaría' || 
     activeRole === 'PROA+' || 
     activeRole === 'Profesor Gestión' || 
     userData?.perfilesAdicionales?.includes(activeRole));

  return (
    <div className="min-h-screen bg-white font-verdana flex flex-col w-full overflow-x-hidden">
      {selectedModule && (
        <RayuelaHeader 
          userData={userData}
          activeRole={activeRole}
          unreadCount={unreadCount}
          allAvailableProfiles={allAvailableProfiles}
          onSetModule={setSelectedModule}
          onSetActiveSubContent={setActiveSubContent}
          onSetSidebarMode={setSidebarMode}
          onOpenProfileDialog={() => setIsChangeProfileOpen(true)}
          onSetActiveRole={setActiveRole}
          onLogout={handleLogout}
        />
      )}

      <Dialog open={isChangeProfileOpen} onOpenChange={setIsChangeProfileOpen}>
        <DialogContent className="max-w-4xl p-0 border-none overflow-hidden font-verdana bg-white/95 backdrop-blur-md">
          <DialogHeader className="bg-[#fb8500] p-10 text-white text-center">
             <DialogTitle className="text-3xl font-bold uppercase tracking-widest mb-2">Selección de Perfil</DialogTitle>
             <DialogDescription className="text-white/80 text-lg uppercase font-medium">
               Elija el perfil bajo el cual desea operar
             </DialogDescription>
          </DialogHeader>
          
          <div className="p-12">
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allAvailableProfiles.map((profile) => (
                   <button
                    key={profile.id}
                    onClick={() => { setActiveRole(profile.label); setActiveSubContent(null); setIsChangeProfileOpen(false); }}
                    className={cn(
                      "flex flex-col items-center justify-center p-8 rounded-xl border-4 transition-all duration-300 hover:scale-105 active:scale-95 group",
                      activeRole === profile.label 
                        ? "bg-[#fb8500] border-[#fb8500] text-white shadow-xl" 
                        : "bg-white border-gray-100 text-gray-400 hover:border-orange-200"
                    )}
                   >
                      <div className="text-sm font-bold uppercase tracking-tight text-center leading-tight">
                        {profile.label}
                      </div>
                      {activeRole === profile.label && (
                        <Badge className="mt-3 bg-white text-[#fb8500] border-none font-bold text-[10px]">ACTIVO</Badge>
                      )}
                   </button>
                ))}
             </div>
          </div>
          <div className="bg-gray-50 p-6 flex justify-center border-t">
             <Button variant="ghost" onClick={() => setIsChangeProfileOpen(false)} className="text-gray-400 uppercase font-bold text-xs hover:text-black">
               Cancelar cambio
             </Button>
          </div>
        </DialogContent>
      </Dialog>

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
             <div className="flex gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/configuracion')} className="text-[10px] text-gray-500 hover:text-black p-0 h-auto">
                  Configuración
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[10px] text-gray-500 hover:text-black p-0 h-auto">
                  Cerrar sesión
                </Button>
             </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex w-full relative">
        {showSidebar && (
          <RayuelaSidebar 
            activeRole={activeRole}
            sidebarMode={sidebarMode}
            activeSubContent={activeSubContent}
            expandedItems={expandedItems}
            isTeacherTutor={isTeacherTutor}
            userRoles={userRoles}
            alwaysOpen={userData?.mantenerSidebarAbierta !== false}
            onSetSidebarMode={setSidebarMode}
            onSetActiveSubContent={setActiveSubContent}
            onToggleExpanded={toggleExpanded}
          />
        )}

        <div className="flex-1 flex flex-col w-full overflow-y-auto">
          {!selectedModule ? (
            <>
              <div className="flex-1 bg-[#7d7d7d] flex flex-wrap items-center justify-center content-center gap-8 md:gap-16 p-8 min-h-[400px]">
                {canSeeGestion && <ModuleBox label="Gestión" onClick={() => handleModuleClick("Gestión")} />}
                {canSeeSecretaria && <ModuleBox label="Secretaría Virtual" onClick={() => handleModuleClick("Secretaría Virtual")} />}
                {canSeeSeguimiento && <ModuleBox label="Seguimiento" onClick={() => handleModuleClick("Seguimiento")} />}
                {canSeeCau && <ModuleBox label="CAU" onClick={() => handleModuleClick("CAU")} />}
                
                {!canSeeGestion && !canSeeSecretaria && !canSeeSeguimiento && !canSeeCau && (
                  <p className="text-white text-xl italic opacity-50">No tiene módulos asignados a su perfil</p>
                )}
              </div>

              <div className="w-full p-4 bg-white text-[12px] text-black text-left border-t border-gray-200 italic px-8">
                En esta pantalla se muestran los diferentes servicios a los que usted tiene acceso. Pulse sobre aquel al que desee acceder
              </div>
            </>
          ) : (
            <RayuelaContentManager 
              activeSubContent={activeSubContent}
              selectedModule={selectedModule}
              activeRole={activeRole}
              effectiveTeacherId={effectiveTeacherId}
              usuarioId={session.usuario}
              userData={userData}
              onSetSelectedModule={setSelectedModule}
              onSetActiveSubContent={setActiveSubContent}
              onNavigateToIncident={handleNavigateToIncident}
              targetIncidentStudentId={targetIncidentData?.studentId}
              onActionComplete={() => setTargetIncidentData(null)}
              onSetSidebarMode={setSidebarMode}
            />
          )}

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
    </div>
  );
}
