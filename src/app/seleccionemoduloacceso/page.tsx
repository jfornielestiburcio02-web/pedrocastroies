
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  ArrowLeft,
  X,
  Clock,
  BookOpen,
  MessageSquare,
  Home,
  Monitor,
  UserCircle,
  ShieldCheck,
  LifeBuoy,
  Briefcase,
  Volume2,
  Video,
  Pin,
  Files,
  UserCog,
  ChevronDown,
  ChevronRight,
  Users,
  Megaphone,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, query, collection, where } from 'firebase/firestore';
import { cn } from '@/lib/utils';

// Importación de componentes modulares de Rayuela
import { AttendanceBySubjectView } from '@/components/rayuela/attendance-by-subject-view';
import { GuardDutyView } from '@/components/rayuela/guard-duty-view';
import { AlumnadoIncidenteView } from '@/components/rayuela/alumnado-incidente-view';
import { MessagingView } from '@/components/rayuela/messaging-view';
import { TutorialFunctionView } from '@/components/rayuela/tutorial-function-view';
import { ScheduleListView, ScheduleCreationView, MyScheduleView } from '@/components/rayuela/schedule-views';
import { SidebarItem, SidebarHeading, ModuleBox } from '@/components/rayuela/shared-components';
import { MyTutoringStudentsView, CenterStudentsView } from '@/components/rayuela/student-management-views';
import { EvaluationsView } from '@/components/rayuela/evaluations-views';
import { EvaluationOpeningView, GradingStatsView } from '@/components/rayuela/management-evaluation-views';

export default function SeleccioneModuloAccesoPage() {
  const [session, setSession] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [activeSubContent, setActiveSubContent] = useState<string | null>(null);
  const [sidebarMode, setSidebarMode] = useState<'ACADEMIC' | 'MESSAGING'>('ACADEMIC');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'faltas': false,
    'conductas': false,
    'graves': false,
    'usuarios': false,
    'horarios': false,
    'mensajeria': false,
    'miAlumnado': false,
    'horario_profesor': false,
    'calificaciones_root': false,
    'evaluaciones': false,
    'resumen': false,
    'evaluaciones_dir': false,
    'apertura_root': false
  });
  
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
            if (roles.includes('EsDireccion')) setActiveRole('Dirección');
            else if (roles.includes('EsCau')) setActiveRole('CAU');
            else if (roles.includes('EsProfesor')) setActiveRole('Profesor');
            else if (roles.includes('EsAlumno')) setActiveRole('Alumno');
            else if (roles.includes('EsSecretaria')) setActiveRole('Secretaría');
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

  // Hook para contar mensajes no leídos
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
      setActiveRole('Dirección');
    } else if (label === "Secretaría Virtual") {
      setActiveRole('Secretaría');
    } else if (label.startsWith("CAU")) {
      setActiveRole('CAU');
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    router.push('/login');
  };

  const getRoleDisplayName = (role: string) => {
    if (role === 'EsDireccion') return 'Dirección';
    if (role === 'EsCau') return 'CAU';
    if (role === 'EsProfesor') return 'Profesor';
    if (role === 'EsAlumno') return 'Alumno';
    if (role === 'EsSecretaria') return 'Secretaría';
    return role;
  };

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userRoles = Array.from(new Set(userData?.rolesUsuario || [])) as string[];
  const canSeeSeguimiento = userRoles.includes('EsProfesor') || userRoles.includes('EsAlumno');
  const canSeeGestion = userRoles.includes('EsDireccion');
  const canSeeSecretaria = userRoles.includes('EsSecretaria');
  const canSeeCau = userRoles.includes('EsCau');

  const isTeacherTutor = userData?.esTutor && userData?.esTutor !== "";

  return (
    <div className="min-h-screen bg-white font-verdana flex flex-col w-full overflow-x-hidden">
      {selectedModule && (
        <div className="w-full bg-[#e9e9e9] border-b border-gray-300 p-2 flex flex-col md:flex-row items-center justify-between shadow-sm animate-in fade-in slide-in-from-top duration-500 z-50">
          <div className="flex items-center gap-4 w-full md:w-auto px-2">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-white shadow-sm bg-gray-200">
                <AvatarImage src={userData?.imagenPerfil} />
                <AvatarFallback>{session.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                  {unreadCount}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-[13px] text-black">
                  {userData?.nombrePersona || session.usuario} ({activeRole})
                </span>
              </div>
              <span className="text-[11px] text-gray-600">
                I.E.S Pedro Castro (Com. Madrid)
              </span>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-gray-500 font-medium">
                <span className="hover:underline cursor-pointer">Documentos solicitados</span>
                <span className="hover:underline cursor-pointer">Configuración</span>
                <span className="hover:underline cursor-pointer">Manuales</span>
                <span className="hover:underline cursor-pointer" onClick={() => { setSelectedModule('SEGUIMIENTO'); setSidebarMode('MESSAGING'); setActiveSubContent('Mis Mensajes'); }}>Nuevo mensaje</span>
                <span className="hover:underline cursor-pointer" onClick={() => { setSelectedModule('SEGUIMIENTO'); setSidebarMode('MESSAGING'); setActiveSubContent('Mis Mensajes'); }}>Mis mensajes</span>
              </div>
              <div className="flex gap-4 mt-2">
                <Clock className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                <BookOpen className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => { setSelectedModule(null); setActiveSubContent(null); }} />
                <Home className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => { setSelectedModule(null); setActiveSubContent(null); }} />
                <MessageSquare className={cn("h-4 w-4 cursor-pointer", unreadCount > 0 ? "text-red-600" : "text-[#fb8500]")} onClick={() => { setSelectedModule('SEGUIMIENTO'); setSidebarMode('MESSAGING'); setActiveSubContent('Mis Mensajes'); }} />
              </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center text-center max-w-[300px]">
            <p className="text-[9px] text-gray-500 uppercase leading-tight">Proyecto cofinanciado por</p>
            <p className="text-[10px] font-bold text-gray-600 leading-tight">Fondo Europeo de Desarrollo Regional.</p>
            <p className="text-[10px] text-gray-500 leading-tight italic">Una manera de hacer Europa</p>
          </div>

          <div className="flex items-center gap-4 mt-4 md:mt-0 px-2">
            <div className="flex gap-2 items-center">
              {userRoles.map((roleKey: string) => {
                const displayName = getRoleDisplayName(roleKey);
                const isActive = activeRole === displayName;
                
                return (
                  <button 
                    key={roleKey}
                    onClick={() => { setActiveRole(displayName); setActiveSubContent(null); }}
                    className={cn(
                      "flex flex-col items-center group transition-all p-1 rounded-sm border",
                      isActive 
                        ? "bg-[#fb8500] border-[#fb8500] text-white" 
                        : "bg-white border-gray-300 text-gray-400 hover:border-[#fb8500]/50"
                    )}
                  >
                    <div className={cn(
                      "p-1 rounded-sm",
                      isActive ? "bg-white/20" : "bg-gray-100"
                    )}>
                      {roleKey === 'EsDireccion' && <ShieldCheck className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
                      {roleKey === 'EsCau' && <LifeBuoy className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
                      {roleKey === 'EsProfesor' && <Monitor className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
                      {roleKey === 'EsAlumno' && <UserCircle className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
                      {roleKey === 'EsSecretaria' && <Briefcase className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
                    </div>
                    <span className={cn(
                      "text-[8px] font-bold uppercase mt-0.5 tracking-tighter",
                      isActive ? "text-white" : "text-gray-500"
                    )}>
                      {displayName}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-1 border-l pl-4 border-gray-300">
               <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none bg-gray-500 text-white hover:bg-gray-600" onClick={() => { setSelectedModule(null); setActiveSubContent(null); }}>
                    <Home className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="h-6 w-6 rounded-none bg-gray-700 text-white hover:bg-black">
                    <X className="h-3 w-3" />
                  </Button>
               </div>
            </div>
          </div>
        </div>
      )}

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

      <div className="flex-1 flex w-full relative">
        {selectedModule && (activeRole === 'Profesor' || activeRole === 'Dirección') && (
          <div className="group relative z-40 bg-[#f4f4f4] border-r border-gray-300 w-[60px] hover:w-[250px] transition-all duration-300 ease-in-out flex flex-col min-h-full overflow-hidden">
            <div className="flex-1 flex flex-col">
              <div className="flex h-full">
                <div className="w-[60px] min-w-[60px] flex flex-col items-center py-4 gap-4 bg-[#f4f4f4] border-r border-gray-200/50">
                  {activeRole === 'Profesor' ? (
                    <>
                      <div className={cn("p-2 rounded-sm text-white cursor-pointer transition-colors", sidebarMode === 'ACADEMIC' ? "bg-[#89a54e]" : "bg-gray-400")} onClick={() => setSidebarMode('ACADEMIC')}><BookOpen className="h-5 w-5" /></div>
                      <div className={cn("p-2 rounded-sm text-white cursor-pointer transition-colors", sidebarMode === 'MESSAGING' ? "bg-[#fb8500]" : "bg-gray-400")} onClick={() => setSidebarMode('MESSAGING')}><Megaphone className="h-5 w-5" /></div>
                      <div className="p-2 bg-gray-400 rounded-sm text-white"><Video className="h-5 w-5" /></div>
                      <div className="p-2 bg-gray-400 rounded-sm text-white"><Pin className="h-5 w-5" /></div>
                      <div className="p-2 bg-gray-400 rounded-sm text-white"><Files className="h-5 w-5" /></div>
                      <div className="p-2 bg-gray-400 rounded-sm text-white"><UserCog className="h-5 w-5" /></div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><Users className="h-5 w-5" /></div>
                      <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><Clock className="h-5 w-5" /></div>
                      <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><Files className="h-5 w-5" /></div>
                      <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><ShieldCheck className="h-5 w-5" /></div>
                      <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><UserCog className="h-5 w-5" /></div>
                    </>
                  )}
                </div>
                
                <div className="hidden group-hover:flex flex-col py-4 w-full bg-white animate-in fade-in slide-in-from-left-2 duration-300 overflow-y-auto">
                  <div className="px-2 space-y-0.5">
                    {activeRole === 'Profesor' ? (
                      <div className="flex flex-col space-y-2">
                        {sidebarMode === 'ACADEMIC' ? (
                          <>
                            <div className="flex flex-col">
                              <SidebarHeading label="Faltas de asistencia" expanded={expandedItems['faltas']} onClick={() => toggleExpanded('faltas')} />
                              {expandedItems['faltas'] && (
                                <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                  <SidebarItem color="#89a54e" label="Por materia" isSubItem onClick={() => setActiveSubContent('Por materia')} active={activeSubContent === 'Por materia'} />
                                  {isTeacherTutor && (
                                    <SidebarItem color="#89a54e" label="Funcion tutorial" isSubItem onClick={() => setActiveSubContent('Funcion tutorial')} active={activeSubContent === 'Funcion tutorial'} />
                                  )}
                                  <SidebarItem color="#89a54e" label="Guardias" isSubItem onClick={() => setActiveSubContent('Guardias')} active={activeSubContent === 'Guardias'} />
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col">
                               <SidebarHeading label="Conductas contrarias" expanded={expandedItems['conductas']} onClick={() => toggleExpanded('conductas')} />
                              {expandedItems['conductas'] && (
                                <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                   <div className="flex flex-col">
                                      <SidebarHeading label="Conductas contrarias y graves" expanded={expandedItems['graves']} onClick={() => toggleExpanded('graves')} />
                                      {expandedItems['graves'] && (
                                        <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                           <SidebarItem color="#89a54e" label="Alumnado Incidente" isSubItem onClick={() => setActiveSubContent('Alumnado Incidente')} active={activeSubContent === 'Alumnado Incidente'} />
                                        </div>
                                      )}
                                   </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col">
                              <SidebarHeading label="Calificaciones y nota final" expanded={expandedItems['calificaciones_root']} onClick={() => toggleExpanded('calificaciones_root')} />
                              {expandedItems['calificaciones_root'] && (
                                <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                  <div className="flex flex-col">
                                    <SidebarHeading label="Evaluaciones" expanded={expandedItems['evaluaciones']} onClick={() => toggleExpanded('evaluaciones')} />
                                    {expandedItems['evaluaciones'] && (
                                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                        <SidebarItem color="#89a54e" label="Exámenes" isSubItem onClick={() => setActiveSubContent('Exámenes')} active={activeSubContent === 'Exámenes'} />
                                        <SidebarItem color="#89a54e" label="Tareas" isSubItem onClick={() => setActiveSubContent('Tareas')} active={activeSubContent === 'Tareas'} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <SidebarHeading label="Resumen" expanded={expandedItems['resumen']} onClick={() => toggleExpanded('resumen')} />
                                    {expandedItems['resumen'] && (
                                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                        <SidebarItem color="#89a54e" label="Calificar" isSubItem onClick={() => setActiveSubContent('Calificar')} active={activeSubContent === 'Calificar'} />
                                        {isTeacherTutor && (
                                          <SidebarItem color="#89a54e" label="Evaluación como tutor" isSubItem onClick={() => setActiveSubContent('Evaluación como tutor')} active={activeSubContent === 'Evaluación como tutor'} />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col">
                              <SidebarHeading label="Mi alumnado" expanded={expandedItems['miAlumnado']} onClick={() => toggleExpanded('miAlumnado')} />
                              {expandedItems['miAlumnado'] && (
                                <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                  {isTeacherTutor && (
                                    <SidebarItem color="#89a54e" label="Alumnado de mi tutoria" isSubItem onClick={() => setActiveSubContent('Alumnado de mi tutoria')} active={activeSubContent === 'Alumnado de mi tutoria'} />
                                  )}
                                  <SidebarItem color="#89a54e" label="Alumnado del centro" isSubItem onClick={() => setActiveSubContent('Alumnado del centro')} active={activeSubContent === 'Alumnado del centro'} />
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col">
                              <SidebarHeading label="Horario" expanded={expandedItems['horario_profesor']} onClick={() => toggleExpanded('horario_profesor')} />
                              {expandedItems['horario_profesor'] && (
                                <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                  <SidebarItem color="#89a54e" label="Ver horario" isSubItem onClick={() => setActiveSubContent('Mi Horario Personal')} active={activeSubContent === 'Mi Horario Personal'} />
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col">
                            <SidebarHeading label="Mensajería" expanded={expandedItems['mensajeria']} onClick={() => toggleExpanded('mensajeria')} />
                            {expandedItems['mensajeria'] && (
                              <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                <SidebarItem color="#fb8500" label="Mis Mensajes" isSubItem onClick={() => setActiveSubContent('Mis Mensajes')} active={activeSubContent === 'Mis Mensajes'} />
                                <SidebarItem color="#fb8500" label="Papelera" isSubItem onClick={() => setActiveSubContent('Papelera Mensajería')} active={activeSubContent === 'Papelera Mensajería'} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <SidebarHeading label="Usuarios" expanded={expandedItems['usuarios']} onClick={() => toggleExpanded('usuarios')} />
                          {expandedItems['usuarios'] && (
                            <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                              <SidebarItem color="#9c4d96" label="Creación" isSubItem onClick={() => setActiveSubContent('Creación de Usuarios')} active={activeSubContent === 'Creación de Usuarios'} />
                              <SidebarItem color="#9c4d96" label="Eliminación" isSubItem onClick={() => setActiveSubContent('Eliminación de Usuarios')} active={activeSubContent === 'Eliminación de Usuarios'} />
                              <SidebarItem color="#9c4d96" label="Visualización" isSubItem onClick={() => setActiveSubContent('Visualización de Usuarios')} active={activeSubContent === 'Visualización de Usuarios'} />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <SidebarHeading label="Horarios" expanded={expandedItems['horarios']} onClick={() => toggleExpanded('horarios')} />
                          {expandedItems['horarios'] && (
                            <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                              <SidebarItem color="#9c4d96" label="Ver" isSubItem onClick={() => setActiveSubContent('Ver Horarios')} active={activeSubContent === 'Ver Horarios'} />
                              <SidebarItem color="#9c4d96" label="Modificar / crear" isSubItem onClick={() => setActiveSubContent('Modificar / crear Horarios')} active={activeSubContent === 'Modificar / crear Horarios'} />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <SidebarHeading label="Evaluaciones" expanded={expandedItems['evaluaciones_dir']} onClick={() => toggleExpanded('evaluaciones_dir')} />
                          {expandedItems['evaluaciones_dir'] && (
                            <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                              <SidebarItem color="#9c4d96" label="Resumen (Tasas)" isSubItem onClick={() => setActiveSubContent('Resumen (Tasas)')} active={activeSubContent === 'Resumen (Tasas)'} />
                              <div className="flex flex-col">
                                <SidebarHeading label="Apertura de la evaluación" expanded={expandedItems['apertura_root']} onClick={() => toggleExpanded('apertura_root')} />
                                {expandedItems['apertura_root'] && (
                                  <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                    <SidebarItem color="#9c4d96" label="Gestión de Apertura" isSubItem onClick={() => setActiveSubContent('Apertura de la evaluación')} active={activeSubContent === 'Apertura de la evaluación'} />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
            <div className="flex-1 animate-in fade-in duration-300 relative bg-white flex flex-col w-full p-4 md:p-8">
               <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
                <div className="flex items-center justify-between border-b pb-4 mb-6">
                  <h1 className="text-lg md:text-xl font-bold text-gray-800 uppercase tracking-tight flex items-center gap-2">
                    {activeSubContent ? activeSubContent : (selectedModule === 'CAU' ? 'CENTRO ATENCIÓN DE USUARIOS' : selectedModule)}
                  </h1>
                  <Button variant="ghost" onClick={() => { setSelectedModule(null); setActiveSubContent(null); }} className="gap-2 text-gray-500 hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest">
                    <ArrowLeft className="h-3 w-3" /> Volver al menú
                  </Button>
                </div>

                <div className="flex-1">
                  {activeSubContent === 'Modificar / crear Horarios' ? (
                    <ScheduleCreationView />
                  ) : activeSubContent === 'Ver Horarios' ? (
                    <ScheduleListView />
                  ) : activeSubContent === 'Mi Horario Personal' ? (
                    <MyScheduleView profesorId={session.usuario} />
                  ) : activeSubContent === 'Por materia' ? (
                    <AttendanceBySubjectView profesorId={session.usuario} />
                  ) : activeSubContent === 'Funcion tutorial' ? (
                    <TutorialFunctionView profesorId={session.usuario} grupoTutorizado={userData?.esTutor} />
                  ) : activeSubContent === 'Guardias' ? (
                    <GuardDutyView profesorId={session.usuario} />
                  ) : activeSubContent === 'Alumnado Incidente' ? (
                    <AlumnadoIncidenteView profesorId={session.usuario} />
                  ) : activeSubContent === 'Mis Mensajes' ? (
                    <MessagingView mode="inbox" usuarioId={session.usuario} />
                  ) : activeSubContent === 'Papelera Mensajería' ? (
                    <MessagingView mode="trash" usuarioId={session.usuario} />
                  ) : activeSubContent === 'Alumnado de mi tutoria' ? (
                    <MyTutoringStudentsView grupoTutorizado={userData?.esTutor} />
                  ) : activeSubContent === 'Alumnado del centro' ? (
                    <CenterStudentsView />
                  ) : activeSubContent === 'Exámenes' ? (
                    <EvaluationsView profesorId={session.usuario} type="exam" />
                  ) : activeSubContent === 'Tareas' ? (
                    <EvaluationsView profesorId={session.usuario} type="task" />
                  ) : activeSubContent === 'Resumen (Tasas)' ? (
                    <GradingStatsView />
                  ) : activeSubContent === 'Apertura de la evaluación' ? (
                    <EvaluationOpeningView />
                  ) : activeSubContent ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                       <div className="bg-white border rounded-lg p-10 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                          <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center",
                            activeRole === 'Profesor' ? "bg-[#89a54e]/10 text-[#89a54e]" : "bg-[#9c4d96]/10 text-[#9c4d96]"
                          )}>
                             <Files className="h-8 w-8" />
                          </div>
                          <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">{activeSubContent}</h2>
                          <p className="text-gray-500 italic max-w-md">
                            Contenido del módulo de {selectedModule?.toLowerCase()} para la sección de {activeSubContent.toLowerCase()}.
                          </p>
                       </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="p-12 border-2 border-gray-100 bg-gray-50/30 rounded-3xl w-full text-center space-y-6 shadow-inner">
                          <p className="text-xl text-gray-600">Acceso activo como <span className="font-bold text-primary">{activeRole}</span></p>
                          <div className="bg-white p-8 rounded-xl border border-gray-200 text-base text-gray-700 italic leading-relaxed shadow-sm max-w-3xl mx-auto">
                            {activeRole === 'Profesor' 
                              ? "Seleccione una opción del menú lateral para comenzar el seguimiento de sus alumnos." 
                              : activeRole === 'Alumno'
                              ? "Entorno de seguimiento académico activo para consulta de notas y asistencia personal."
                              : activeRole === 'Dirección'
                              ? "Entorno de gestión del equipo directivo para la administración del centro."
                              : activeRole === 'Secretaría'
                              ? "Entorno de secretaría virtual para trámites administrativos y expedientes."
                              : activeRole === 'CAU'
                              ? "Entorno de soporte técnico y atención de usuarios activo."
                              : `Entorno de gestión activa para el perfil de ${activeRole}.`}
                          </div>
                          <div className="flex justify-center pt-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                              Sesión OK
                            </div>
                          </div>
                      </div>
                    </div>
                  )}
                </div>
               </div>
            </div>
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
