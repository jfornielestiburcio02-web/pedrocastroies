
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
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Calendar as CalendarIcon,
  Search,
  History,
  AlertTriangle,
  ExternalLink,
  Check,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';

export default function SeleccioneModuloAccesoPage() {
  const [session, setSession] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [activeSubContent, setActiveSubContent] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'faltas': true,
    'conductas': false,
    'graves': false,
    'usuarios': true,
    'horarios': true
  });
  
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();

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

  const handleModuleClick = (label: string) => {
    setSelectedModule(label.toUpperCase());
    setActiveSubContent(null);
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
                <span className="hover:underline cursor-pointer">Nuevo mensaje</span>
                <span className="hover:underline cursor-pointer">Mis mensajes</span>
              </div>
              <div className="flex gap-4 mt-2">
                <Clock className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                <BookOpen className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                <Home className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => { setSelectedModule(null); setActiveSubContent(null); }} />
                <MessageSquare className="h-4 w-4 text-[#fb8500] cursor-pointer" />
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
                      <div className="p-2 bg-[#89a54e] rounded-sm text-white"><BookOpen className="h-5 w-5" /></div>
                      <div className="p-2 bg-[#89a54e] rounded-sm text-white"><Volume2 className="h-5 w-5" /></div>
                      <div className="p-2 bg-[#89a54e] rounded-sm text-white"><Video className="h-5 w-5" /></div>
                      <div className="p-2 bg-[#89a54e] rounded-sm text-white"><Pin className="h-5 w-5" /></div>
                      <div className="p-2 bg-[#89a54e] rounded-sm text-white"><Files className="h-5 w-5" /></div>
                      <div className="p-2 bg-[#89a54e] rounded-sm text-white"><UserCog className="h-5 w-5" /></div>
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
                        <div className="flex flex-col">
                          <div 
                            onClick={() => toggleExpanded('faltas')}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer group/item transition-colors"
                          >
                            <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm bg-white flex items-center justify-center">
                              {expandedItems['faltas'] ? <ChevronDown className="h-2.5 w-2.5 text-[#89a54e]" /> : <ChevronRight className="h-2.5 w-2.5 text-gray-400" />}
                            </div>
                            <span className="text-[12px] font-bold text-gray-700 whitespace-nowrap">Faltas de asistencia</span>
                          </div>
                          
                          {expandedItems['faltas'] && (
                            <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                              <SidebarItem color="#89a54e" label="Por materia" isSubItem onClick={() => setActiveSubContent('Por materia')} active={activeSubContent === 'Por materia'} />
                              <SidebarItem color="#89a54e" label="Funcion tutorial" isSubItem onClick={() => setActiveSubContent('Funcion tutorial')} active={activeSubContent === 'Funcion tutorial'} />
                              <SidebarItem color="#89a54e" label="Guardias" isSubItem onClick={() => setActiveSubContent('Guardias')} active={activeSubContent === 'Guardias'} />
                            </div>
                          )}
                        </div>

                        {/* Nueva Sección: Conductas contrarias */}
                        <div className="flex flex-col">
                           <div 
                            onClick={() => toggleExpanded('conductas')}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer group/item transition-colors"
                          >
                            <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm bg-white flex items-center justify-center">
                              {expandedItems['conductas'] ? <ChevronDown className="h-2.5 w-2.5 text-[#89a54e]" /> : <ChevronRight className="h-2.5 w-2.5 text-gray-400" />}
                            </div>
                            <span className="text-[12px] font-bold text-gray-700 whitespace-nowrap">Conductas contrarias</span>
                          </div>

                          {expandedItems['conductas'] && (
                            <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                               <div className="flex flex-col">
                                  <div 
                                    onClick={() => toggleExpanded('graves')}
                                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer group/item transition-colors"
                                  >
                                    <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm bg-white flex items-center justify-center">
                                      {expandedItems['graves'] ? <ChevronDown className="h-2.5 w-2.5 text-[#89a54e]" /> : <ChevronRight className="h-2.5 w-2.5 text-gray-400" />}
                                    </div>
                                    <span className="text-[11px] text-gray-500 whitespace-nowrap">Conductas contrarias y graves</span>
                                  </div>
                                  {expandedItems['graves'] && (
                                    <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                       <SidebarItem color="#89a54e" label="Alumnado Incidente" isSubItem onClick={() => setActiveSubContent('Alumnado Incidente')} active={activeSubContent === 'Alumnado Incidente'} />
                                    </div>
                                  )}
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-col">
                          <div 
                            onClick={() => toggleExpanded('usuarios')}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer group/item transition-colors"
                          >
                            <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm bg-white flex items-center justify-center">
                              {expandedItems['usuarios'] ? <ChevronDown className="h-2.5 w-2.5 text-[#9c4d96]" /> : <ChevronRight className="h-2.5 w-2.5 text-gray-400" />}
                            </div>
                            <span className="text-[12px] font-bold text-gray-700 whitespace-nowrap">Usuarios</span>
                          </div>
                          {expandedItems['usuarios'] && (
                            <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                              <SidebarItem color="#9c4d96" label="Creación" isSubItem onClick={() => setActiveSubContent('Creación de Usuarios')} active={activeSubContent === 'Creación de Usuarios'} />
                              <SidebarItem color="#9c4d96" label="Eliminación" isSubItem onClick={() => setActiveSubContent('Eliminación de Usuarios')} active={activeSubContent === 'Eliminación de Usuarios'} />
                              <SidebarItem color="#9c4d96" label="Visualización" isSubItem onClick={() => setActiveSubContent('Visualización de Usuarios')} active={activeSubContent === 'Visualización de Usuarios'} />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <div 
                            onClick={() => toggleExpanded('horarios')}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer group/item transition-colors"
                          >
                            <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm bg-white flex items-center justify-center">
                              {expandedItems['horarios'] ? <ChevronDown className="h-2.5 w-2.5 text-[#9c4d96]" /> : <ChevronRight className="h-2.5 w-2.5 text-gray-400" />}
                            </div>
                            <span className="text-[12px] font-bold text-gray-700 whitespace-nowrap">Horarios</span>
                          </div>
                          {expandedItems['horarios'] && (
                            <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                              <SidebarItem color="#9c4d96" label="Ver" isSubItem onClick={() => setActiveSubContent('Ver Horarios')} active={activeSubContent === 'Ver Horarios'} />
                              <SidebarItem color="#9c4d96" label="Modificar / crear" isSubItem onClick={() => setActiveSubContent('Modificar / crear Horarios')} active={activeSubContent === 'Modificar / crear Horarios'} />
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
                  ) : activeSubContent === 'Por materia' ? (
                    <AttendanceBySubjectView profesorId={session.usuario} />
                  ) : activeSubContent === 'Guardias' ? (
                    <GuardDutyView profesorId={session.usuario} />
                  ) : activeSubContent === 'Alumnado Incidente' ? (
                    <AlumnadoIncidenteView />
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

/**
 * Vista de Alumnado Incidente (Módulo de Conductas Contrarias).
 */
function AlumnadoIncidenteView() {
  const db = useFirestore();
  
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'usuarios'), where('rolesUsuario', 'array-contains', 'EsAlumno'));
  }, [db]);

  const { data: students, isLoading } = useCollection(usersQuery);

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-6xl mx-auto w-full">
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#f8f9fa] border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-bold text-gray-700 uppercase">Gestión de Alumnado Incidente</span>
          </div>
          <Button size="sm" className="bg-[#89a54e] text-white text-[10px] font-bold uppercase h-8 px-4 gap-2">
            <Plus className="h-3 w-3" /> Nueva Incidencia
          </Button>
        </div>

        <div className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase text-gray-500">Alumno</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-500">Grupo</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-500">Nº Incidencias</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-500 text-center">Estado</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase text-gray-500">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students && students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.imagenPerfil} />
                          <AvatarFallback>{student.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold text-gray-700">{student.nombrePersona || student.usuario}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-gray-600">4º ESO - A</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold bg-red-50 text-red-700 border-red-200">
                        {Math.floor(Math.random() * 5)} INCIDENCIAS
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-[9px] font-bold text-[#89a54e] uppercase gap-1">
                        <FileText className="h-3 w-3" /> Ver Expediente
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic text-sm">
                    No se han encontrado registros de alumnos incidentes.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="bg-red-50 border border-red-100 p-4 rounded-lg flex items-start gap-3">
         <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
         <div className="space-y-1">
            <p className="text-xs font-bold text-red-800 uppercase">Aviso de Seguridad Convivencial</p>
            <p className="text-[11px] text-red-700 leading-relaxed italic">
              Los registros aquí mostrados forman parte del expediente disciplinario del centro. Cualquier modificación queda registrada con firma digital del docente.
            </p>
         </div>
      </div>
    </div>
  );
}

/**
 * Vista de Gestión de Guardias para Profesores.
 */
function GuardDutyView({ profesorId }: { profesorId: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const db = useFirestore();

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentDay = useMemo(() => {
    if (!now) return "";
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[now.getDay()];
  }, [now]);

  const currentTimeStr = useMemo(() => {
    if (!now) return "";
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }, [now]);

  // Query para buscar si el profesor actual está de guardia hoy
  const myScheduleQuery = useMemoFirebase(() => {
    if (!db || !profesorId || !currentDay) return null;
    return query(
      collection(db, 'horarios'),
      where('profesorId', '==', profesorId),
      where('dia', '==', currentDay),
      where('esGuardia', '==', true)
    );
  }, [db, profesorId, currentDay]);

  const { data: myDutySlots, isLoading: loadingMyDuty } = useCollection(myScheduleQuery);

  // Comprobar si hay una guardia activa en el tramo horario actual
  const activeDuty = useMemo(() => {
    if (!myDutySlots || !currentTimeStr) return null;
    return myDutySlots.find(slot => currentTimeStr >= slot.horaInicio && currentTimeStr <= slot.horaFin);
  }, [myDutySlots, currentTimeStr]);

  // Query para traer todas las clases lectivas del día
  const allSchedulesQuery = useMemoFirebase(() => {
    if (!db || !currentDay) return null;
    return query(
      collection(db, 'horarios'),
      where('dia', '==', currentDay),
      where('esGuardia', '==', false)
    );
  }, [db, currentDay]);

  const { data: allSchedules } = useCollection(allSchedulesQuery);

  // Filtrar clases que están ocurriendo ahora mismo
  const activeClasses = useMemo(() => {
    if (!allSchedules || !currentTimeStr) return [];
    return allSchedules.filter(slot => currentTimeStr >= slot.horaInicio && currentTimeStr <= slot.horaFin);
  }, [allSchedules, currentTimeStr]);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);

  const { data: allUsers } = useCollection(usersQuery);

  const getProfesorName = (id: string) => {
    const user = allUsers?.find(u => u.id === id);
    return user ? (user.nombrePersona || user.usuario) : id;
  };

  if (loadingMyDuty || !now) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" />
      </div>
    );
  }

  if (selectedClassId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <Button variant="ghost" onClick={() => setSelectedClassId(null)} className="text-[10px] font-bold uppercase gap-2">
            <ArrowLeft className="h-3 w-3" /> Volver al listado de guardia
          </Button>
          <div className="text-[11px] font-bold text-[#89a54e] bg-[#89a54e]/10 px-3 py-1 rounded">MODO GUARDIA ACTIVO</div>
        </div>
        <AttendanceBySubjectView profesorId={profesorId} manualScheduleId={selectedClassId} />
      </div>
    );
  }

  if (!activeDuty) {
    return (
      <div className="animate-in fade-in duration-500 py-20 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
          <Clock className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-800">En este momento no está de guardia</h2>
          <p className="text-gray-400 italic max-w-sm">No consta ninguna sesión de guardia asignada a su perfil para el tramo horario de las {currentTimeStr}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 max-w-6xl mx-auto w-full">
      <div className="bg-[#89a54e] p-6 text-white rounded-xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg"><AlertTriangle className="h-6 w-6" /></div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-tight">Sesión de Guardia Activa</h2>
            <p className="text-white/80 text-sm">Tramo: {activeDuty.horaInicio} - {activeDuty.horaFin} | {currentDay}, {currentTimeStr}</p>
          </div>
        </div>
        <Badge className="bg-white text-[#89a54e] font-bold uppercase px-4 py-1.5 border-none">Asignada</Badge>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase text-gray-500 flex items-center gap-2">
          <Monitor className="h-4 w-4" /> Clases activas en el centro en este momento
        </h3>

        {activeClasses.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-20 rounded-xl text-center text-gray-400 italic">
            No constan clases lectivas activas para este tramo horario.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeClasses.map(cls => (
              <div key={cls.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-[#89a54e] hover:shadow-md transition-all group flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-[9px] font-bold border-gray-300 text-gray-500 uppercase">{cls.horaInicio} - {cls.horaFin}</Badge>
                    <span className="text-[10px] font-bold text-[#89a54e] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      ACCEDER <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 leading-tight">{cls.asignatura}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <UserCircle className="h-3.5 w-3.5" />
                    <span className="font-medium truncate">{getProfesorName(cls.profesorId)}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                    <Users className="h-3.5 w-3.5" />
                    {cls.alumnosIds?.length || 0} ALUMNOS
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedClassId(cls.id)}
                    className="bg-[#89a54e] hover:bg-[#728a41] text-white text-[10px] font-bold uppercase px-4 h-8"
                  >
                    Pasar Lista
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Vista de Faltas por Materia para Profesores.
 * Refactorizada para soportar modo manual (Guardia) y Comportamiento.
 */
function AttendanceBySubjectView({ profesorId, manualScheduleId }: { profesorId: string, manualScheduleId?: string }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(manualScheduleId || null);
  const [historyAlumnoId, setHistoryAlumnoId] = useState<string | null>(null);
  const db = useFirestore();

  const dayOfWeek = useMemo(() => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[new Date(selectedDate).getDay()];
  }, [selectedDate]);

  // Si estamos en modo manual, usamos el ID pasado, si no, buscamos el horario del profesor
  const schedulesQuery = useMemoFirebase(() => {
    if (manualScheduleId || !db || !profesorId) return null;
    return query(
      collection(db, 'horarios'), 
      where('profesorId', '==', profesorId), 
      where('dia', '==', dayOfWeek)
    );
  }, [db, profesorId, dayOfWeek, manualScheduleId]);

  const { data: fetchedSchedules, isLoading: loadingSchedules } = useCollection(schedulesQuery);
  
  // Si estamos en modo manual (Guardia), traemos ese horario específico
  const manualScheduleQuery = useMemoFirebase(() => {
    if (!manualScheduleId || !db) return null;
    return doc(db, 'horarios', manualScheduleId);
  }, [db, manualScheduleId]);

  const { data: manualScheduleData } = useDoc(manualScheduleQuery);

  const schedules = manualScheduleId && manualScheduleData ? [manualScheduleData] : fetchedSchedules;
  const currentSchedule = useMemo(() => schedules?.find(s => s.id === selectedScheduleId), [schedules, selectedScheduleId]);

  const attendanceQuery = useMemoFirebase(() => {
    if (!db || !selectedScheduleId) return null;
    return query(
      collection(db, 'asistenciasInasistencias'),
      where('claseId', '==', selectedScheduleId),
      where('fecha', '==', selectedDate)
    );
  }, [db, selectedScheduleId, selectedDate]);

  const { data: attendances } = useCollection(attendanceQuery);

  const behaviorQuery = useMemoFirebase(() => {
    if (!db || !selectedScheduleId) return null;
    return query(
      collection(db, 'comportamientos'),
      where('claseId', '==', selectedScheduleId),
      where('fecha', '==', selectedDate)
    );
  }, [db, selectedScheduleId, selectedDate]);

  const { data: behaviors } = useCollection(behaviorQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);

  const { data: allUsers } = useCollection(usersQuery);

  const students = useMemo(() => {
    if (!currentSchedule || !allUsers) return [];
    return allUsers.filter(u => currentSchedule.alumnosIds?.includes(u.id));
  }, [currentSchedule, allUsers]);

  const handleCycleAttendance = (alumnoId: string) => {
    if (!db || !selectedScheduleId) return;

    const existing = attendances?.find(a => a.alumnoId === alumnoId);
    const currentStatus = existing?.tipo || 'A';
    
    // Ciclo: A (Asiste) -> I (Injustificada) -> R (Retraso) -> A
    let nextStatus = 'A';
    if (currentStatus === 'A') nextStatus = 'I';
    else if (currentStatus === 'I') nextStatus = 'R';
    else if (currentStatus === 'R') nextStatus = 'A';

    if (nextStatus === 'A') {
      if (existing) {
        deleteDocumentNonBlocking(doc(db, 'asistenciasInasistencias', existing.id));
      }
      return;
    }

    const attendanceData = {
      alumnoId,
      claseId: selectedScheduleId,
      fecha: selectedDate,
      tipo: nextStatus,
      profesorId,
      createdAt: new Date().toISOString()
    };

    if (existing) {
      setDocumentNonBlocking(doc(db, 'asistenciasInasistencias', existing.id), attendanceData, { merge: true });
    } else {
      addDocumentNonBlocking(collection(db, 'asistenciasInasistencias'), attendanceData);
    }
  };

  const handleToggleBehavior = (alumnoId: string, tipo: 'Positivo' | 'Negativo') => {
    if (!db || !selectedScheduleId) return;

    const existing = behaviors?.find(b => b.alumnoId === alumnoId);
    
    // Si ya existe uno del mismo tipo, lo quitamos (toggle off)
    if (existing && existing.tipo === tipo) {
      deleteDocumentNonBlocking(doc(db, 'comportamientos', existing.id));
      return;
    }

    const behaviorData = {
      alumnoId,
      claseId: selectedScheduleId,
      fecha: selectedDate,
      tipo: tipo,
      profesorId,
      createdAt: new Date().toISOString()
    };

    // Si ya existe pero es de otro tipo, lo actualizamos (solo uno por hora)
    if (existing) {
      setDocumentNonBlocking(doc(db, 'comportamientos', existing.id), behaviorData, { merge: true });
    } else {
      addDocumentNonBlocking(collection(db, 'comportamientos'), behaviorData);
    }
  };

  const getStatusText = (status: string) => {
    if (status === 'A') return 'Asiste';
    if (status === 'I') return 'Injustif.';
    if (status === 'R') return 'Retraso';
    if (status === 'J') return 'Justif.';
    return 'Asiste';
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-7xl mx-auto w-full font-verdana">
      <div className="bg-[#f2f2f2] border p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {!manualScheduleId && (
            <div className="flex items-center gap-2">
              <Label className="text-[11px] font-bold text-gray-600">Fecha:</Label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedScheduleId(null); }}
                className="h-8 border-gray-300 w-[150px] text-[11px]"
              />
            </div>
          )}

          <div className="flex items-center gap-2 min-w-[300px]">
            <Label className="text-[11px] font-bold text-gray-600">Sesión:</Label>
            {loadingSchedules ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#89a54e]" />
            ) : manualScheduleId ? (
              <div className="h-8 flex items-center px-3 border border-gray-300 rounded-md bg-white text-[11px] font-bold w-full">
                {manualScheduleData?.horaInicio}-{manualScheduleData?.horaFin} | {manualScheduleData?.asignatura}
              </div>
            ) : (
              <Select onValueChange={setSelectedScheduleId} value={selectedScheduleId || ""}>
                <SelectTrigger className="h-8 border-gray-300 text-[11px]">
                  <SelectValue placeholder={schedules && schedules.length > 0 ? "Seleccione sesión..." : "Sin horario"} />
                </SelectTrigger>
                <SelectContent>
                  {schedules?.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-[11px]">
                      {s.horaInicio}-{s.horaFin} | {s.asignatura}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex gap-4">
           <div className="flex items-center gap-1.5">
             <div className="w-3 h-3 bg-[#EB8A5F] rounded-sm"></div>
             <span className="text-[10px] font-bold text-gray-500 uppercase">Injustificada</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-3 h-3 bg-[#FFCD2D] rounded-sm"></div>
             <span className="text-[10px] font-bold text-gray-500 uppercase">Retraso</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-3 h-3 bg-[#78B64E] rounded-sm"></div>
             <span className="text-[10px] font-bold text-gray-500 uppercase">Justificada</span>
           </div>
        </div>
      </div>

      {!selectedScheduleId ? (
        <div className="py-20 text-center space-y-4">
           <div className="bg-gray-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto text-gray-400">
             <Search className="h-8 w-8" />
           </div>
           <p className="text-gray-500 italic text-sm">Seleccione una sesión de su horario para visualizar los alumnos.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="py-20 text-center text-gray-400 italic text-sm">
          No hay alumnos asignados a este tramo horario.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center animate-in zoom-in-95 duration-300">
           {students.map(student => {
             const studentAttendance = attendances?.find(a => a.alumnoId === student.id);
             const currentStatus = studentAttendance?.tipo || 'A';
             const studentBehavior = behaviors?.find(b => b.alumnoId === student.id);
             
             // Injustificada (I) y Justificada (J) bloquean comportamiento
             const behaviorDisabled = currentStatus === 'I' || currentStatus === 'J';

             return (
               <div key={student.id} className="itemAlumnoEnClase relative group flex flex-col items-center pt-3 h-[210px]">
                  <Avatar className="imagenAlumnoEnClase" onClick={() => setHistoryAlumnoId(student.id)}>
                    <AvatarImage src={student.imagenPerfil} />
                    <AvatarFallback>{student.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="nombreAlumno px-2 mt-2" onClick={() => setHistoryAlumnoId(student.id)}>
                    {student.nombrePersona || student.usuario}
                  </div>

                  <div className="w-full px-2 mt-1">
                    <button 
                      onClick={() => currentStatus !== 'J' && handleCycleAttendance(student.id)}
                      data-state={currentStatus}
                      className={cn(
                        "botonFalta w-full h-8 transition-colors flex items-center justify-center font-bold text-black",
                        currentStatus === 'J' ? "bg-[#78B64E] border-[#78B64E] cursor-default" : "active:scale-95"
                      )}
                    >
                      {getStatusText(currentStatus)}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-4 mt-2 w-full px-4">
                     <button 
                       disabled={behaviorDisabled}
                       onClick={() => handleToggleBehavior(student.id, 'Positivo')}
                       className={cn(
                         "iconoComPos transition-transform hover:scale-110 disabled:opacity-30 disabled:grayscale",
                         studentBehavior?.tipo === 'Positivo' ? "text-green-600 scale-125" : "text-gray-300"
                       )}
                     >
                       <ThumbsUp className={cn("h-5 w-5", studentBehavior?.tipo === 'Positivo' ? "fill-current" : "")} />
                     </button>
                     <button 
                       disabled={behaviorDisabled}
                       onClick={() => handleToggleBehavior(student.id, 'Negativo')}
                       className={cn(
                         "iconoComNeg transition-transform hover:scale-110 disabled:opacity-30 disabled:grayscale",
                         studentBehavior?.tipo === 'Negativo' ? "text-red-600 scale-125" : "text-gray-300"
                       )}
                     >
                       <ThumbsDown className={cn("h-5 w-5", studentBehavior?.tipo === 'Negativo' ? "fill-current" : "")} />
                     </button>
                  </div>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-gray-300 hover:text-[#008D88]"
                      onClick={() => setHistoryAlumnoId(student.id)}
                    >
                      <History className="h-3.5 w-3.5" />
                    </Button>
                  </div>
               </div>
             );
           })}
        </div>
      )}

      {historyAlumnoId && (
        <AttendanceHistoryDialog 
          alumnoId={historyAlumnoId} 
          claseId={selectedScheduleId!} 
          onClose={() => setHistoryAlumnoId(null)} 
        />
      )}
    </div>
  );
}

/**
 * Diálogo de historial de asistencias para un alumno en una clase específica.
 */
function AttendanceHistoryDialog({ alumnoId, claseId, onClose }: { alumnoId: string, claseId: string, onClose: () => void }) {
  const db = useFirestore();
  const [alumnoName, setAlumnoName] = useState("");
  const [justifyingId, setJustifyingId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!db || !alumnoId) return;
    getDoc(doc(db, 'usuarios', alumnoId)).then(snap => {
      if (snap.exists()) setAlumnoName(snap.data().nombrePersona || snap.data().usuario);
    });
  }, [db, alumnoId]);

  const historyQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'asistenciasInasistencias'),
      where('alumnoId', '==', alumnoId),
      where('claseId', '==', claseId),
      orderBy('fecha', 'desc')
    );
  }, [db, alumnoId, claseId]);

  const { data: history, isLoading } = useCollection(historyQuery);

  const handleJustify = (id: string) => {
    if (!db || !motivo) return;
    const docRef = doc(db, 'asistenciasInasistencias', id);
    updateDocumentNonBlocking(docRef, {
      tipo: 'J',
      motivo: motivo,
      justifiedAt: new Date().toISOString()
    });
    setJustifyingId(null);
    setMotivo("");
    toast({ title: "Falta justificada", description: "Se ha registrado el motivo correctamente." });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'asistenciasInasistencias', id));
    toast({ title: "Registro eliminado", description: "La falta ha sido borrada." });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md font-verdana p-0 gap-0 border-none overflow-hidden">
        <DialogHeader className="bg-[#f2f2f2] p-4 text-center">
          <DialogTitle className="text-[14px] font-bold text-black uppercase tracking-tight">Historial de Asistencias</DialogTitle>
          <DialogDescription className="text-[11px] font-bold text-[#008D88] uppercase mt-1">
            Alumno: {alumnoName}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 bg-white">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : history && history.length > 0 ? (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {history.map(item => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-gray-700">{format(new Date(item.fecha), 'EEEE d MMMM', { locale: es })}</span>
                      <span className="text-[9px] text-gray-400 uppercase">Registrado el {format(new Date(item.createdAt), 'HH:mm')}</span>
                    </div>
                    <Badge className={cn(
                      "text-[10px] font-bold px-3 border-none",
                      item.tipo === 'I' ? "bg-[#EB8A5F] text-white" : 
                      item.tipo === 'R' ? "bg-[#FFCD2D] text-gray-800" :
                      "bg-[#78B64E] text-white"
                    )}>
                      {item.tipo === 'I' ? 'INJUSTIFICADA' : item.tipo === 'R' ? 'RETRASO' : 'JUSTIFICADA'}
                    </Badge>
                  </div>

                  {item.tipo === 'J' && item.motivo && (
                    <div className="p-2 bg-white rounded border border-gray-100 text-[10px] italic text-gray-600">
                      <strong>Motivo:</strong> {item.motivo}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1 border-t border-gray-200/50">
                    {item.tipo !== 'J' && justifyingId !== item.id && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setJustifyingId(item.id)}
                        className="h-6 px-2 text-[9px] font-bold text-[#008D88] hover:bg-[#008D88]/10 gap-1 uppercase"
                      >
                        <Check className="h-3 w-3" /> Justificar
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(item.id)}
                      className="h-6 px-2 text-[9px] font-bold text-destructive hover:bg-destructive/10 gap-1 uppercase"
                    >
                      <Trash2 className="h-3 w-3" /> Eliminar
                    </Button>
                  </div>

                  {justifyingId === item.id && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <Textarea 
                        placeholder="Escriba el motivo de la justificación..." 
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        className="text-[10px] min-h-[60px]"
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleJustify(item.id)} 
                          className="flex-1 bg-[#008D88] hover:bg-[#00706b] text-white text-[9px] font-bold h-7 uppercase"
                        >
                          Guardar
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setJustifyingId(null)} 
                          className="flex-1 text-[9px] font-bold h-7 uppercase"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 italic text-sm">
              No constan incidencias de asistencia para este alumno en este horario.
            </div>
          )}
          <div className="mt-6 flex justify-center">
             <Button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white text-[11px] font-bold uppercase h-8 px-6">Cerrar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Vista de visualización de horarios para Dirección.
 */
function ScheduleListView() {
  const db = useFirestore();
  const { toast } = useToast();

  const horariosQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'horarios'), orderBy('dia'), orderBy('horaInicio'));
  }, [db]);

  const { data: schedules, isLoading: loadingSchedules } = useCollection(horariosQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);

  const { data: allUsers } = useCollection(usersQuery);

  const getUserName = (id: string) => {
    const user = allUsers?.find(u => u.id === id);
    return user ? (user.nombrePersona || user.usuario) : id;
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    const docRef = doc(db, 'horarios', id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Horario eliminado",
      description: "El registro ha sido borrado correctamente de Rayuela.",
    });
  };

  if (loadingSchedules) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#9c4d96]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-6xl mx-auto w-full">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#9c4d96] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <h2 className="font-bold text-lg uppercase tracking-tight">Listado General de Horarios</h2>
          </div>
          <span className="text-[10px] font-bold uppercase bg-white/20 px-3 py-1 rounded">
            {schedules?.length || 0} Registros activos
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-bold text-[#9c4d96] uppercase text-[10px]">Día</TableHead>
                <TableHead className="font-bold text-[#9c4d96] uppercase text-[10px]">Tramo Horario</TableHead>
                <TableHead className="font-bold text-[#9c4d96] uppercase text-[10px]">Profesor</TableHead>
                <TableHead className="font-bold text-[#9c4d96] uppercase text-[10px]">Asignatura / Actividad</TableHead>
                <TableHead className="font-bold text-[#9c4d96] uppercase text-[10px]">Alumnos</TableHead>
                <TableHead className="text-right font-bold text-[#9c4d96] uppercase text-[10px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules && schedules.length > 0 ? (
                schedules.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-bold text-gray-700 text-xs">{item.dia}</TableCell>
                    <TableCell className="text-xs text-gray-600 font-mono">
                      {item.horaInicio} - {item.horaFin}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{getUserName(item.profesorId)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.esGuardia ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[9px] font-bold">GUARDIA</Badge>
                        ) : (
                          <span className="text-xs font-semibold text-gray-800">{item.asignatura}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100 font-bold">
                        {item.alumnosIds?.length || 0} PERS.
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic text-sm">
                    No hay horarios registrados en la plataforma.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

/**
 * Vista de creación de horarios para el perfil de Dirección.
 */
function ScheduleCreationView() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);
  
  const { data: allUsers, isLoading: loadingUsers } = useCollection(usersQuery);
  
  const professors = useMemo(() => allUsers?.filter(u => u.rolesUsuario?.includes('EsProfesor')) || [], [allUsers]);
  const students = useMemo(() => allUsers?.filter(u => u.rolesUsuario?.includes('EsAlumno')) || [], [allUsers]);

  const [formData, setFormData] = useState({
    profesorId: '',
    dia: 'Lunes',
    horaInicio: '08:30',
    horaFin: '09:30',
    asignatura: '',
    esGuardia: false,
    alumnosIds: [] as string[]
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (!formData.profesorId || (!formData.asignatura && !formData.esGuardia)) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Debe seleccionar un profesor y asignar una materia o marcar como guardia."
      });
      return;
    }

    setIsSaving(true);
    
    const horariosRef = collection(db, 'horarios');
    addDocumentNonBlocking(horariosRef, {
      ...formData,
      createdAt: new Date().toISOString()
    });

    toast({
      title: "Horario creado",
      description: `Se ha asignado la clase de ${formData.dia} a las ${formData.horaInicio}.`,
    });
    
    setFormData(prev => ({
      ...prev,
      asignatura: '',
      esGuardia: false,
      alumnosIds: []
    }));
    setIsSaving(false);
  };

  const toggleStudent = (id: string) => {
    setFormData(prev => ({
      ...prev,
      alumnosIds: prev.alumnosIds.includes(id) 
        ? prev.alumnosIds.filter(sid => sid !== id)
        : [...prev.alumnosIds, id]
    }));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl mx-auto w-full">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#9c4d96] p-4 text-white flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h2 className="font-bold text-lg uppercase tracking-tight">Nuevo Registro de Horario</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">Profesor Asignado</Label>
                <Select onValueChange={(val) => setFormData({...formData, profesorId: val})} value={formData.profesorId}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Seleccione un profesor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {professors.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombrePersona || p.usuario}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">Día de la semana</Label>
                <Select onValueChange={(val) => setFormData({...formData, dia: val})} value={formData.dia}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500">Hora Inicio</Label>
                  <Input 
                    type="time" 
                    className="border-gray-300"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({...formData, horaInicio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500">Hora Fin</Label>
                  <Input 
                    type="time" 
                    className="border-gray-300"
                    value={formData.horaFin}
                    onChange={(e) => setFormData({...formData, horaFin: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">Nombre de Asignatura / Actividad</Label>
                <Input 
                  placeholder="Ej: Matemáticas II" 
                  className="border-gray-300"
                  value={formData.asignatura}
                  disabled={formData.esGuardia}
                  onChange={(e) => setFormData({...formData, asignatura: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                <Checkbox 
                  id="esGuardia" 
                  checked={formData.esGuardia}
                  onCheckedChange={(checked) => setFormData({...formData, esGuardia: !!checked, asignatura: checked ? 'GUARDIA' : ''})}
                />
                <Label htmlFor="esGuardia" className="text-sm font-bold text-gray-700 cursor-pointer">Es una sesión de GUARDIA</Label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500 flex justify-between">
                  <span>Alumnos Asignados</span>
                  <span className="text-primary">{formData.alumnosIds.length} seleccionados</span>
                </Label>
                <div className="border rounded-lg h-[200px] overflow-y-auto p-2 bg-gray-50/50 space-y-1">
                  {students.length === 0 ? (
                    <p className="text-center text-[11px] text-gray-400 mt-10 italic">No hay alumnos registrados</p>
                  ) : (
                    students.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => toggleStudent(s.id)}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all border",
                          formData.alumnosIds.includes(s.id) 
                            ? "bg-white border-[#9c4d96] shadow-sm" 
                            : "bg-transparent border-transparent hover:bg-white hover:border-gray-200"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors",
                          formData.alumnosIds.includes(s.id) ? "bg-[#9c4d96] border-[#9c4d96]" : "bg-white border-gray-300"
                        )}>
                          {formData.alumnosIds.includes(s.id) && <Plus className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-[12px]">{s.nombrePersona || s.usuario}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t flex items-center justify-end">
             <Button type="submit" disabled={isSaving} className="bg-[#9c4d96] hover:bg-[#833d7d] text-white gap-2 px-8 text-[11px] font-bold uppercase tracking-widest h-12">
               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
               Guardar en Rayuela
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SidebarItem({ label, isSubItem = false, onClick, active = false, color = "#89a54e" }: { label: string; isSubItem?: boolean; onClick?: () => void; active?: boolean; color?: string }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer group/item transition-colors",
        isSubItem ? "pl-4" : "",
        active ? "bg-gray-50" : ""
      )}
    >
      <div className={cn(
        "w-3.5 h-3.5 border border-gray-400 rounded-sm bg-white flex items-center justify-center transition-colors",
        isSubItem ? "w-3 h-3 border-gray-300" : "",
        active ? "border-[var(--sidebar-item-color)]" : "group-hover/item:border-[var(--sidebar-item-color)]"
      )} style={{ "--sidebar-item-color": color } as any}>
        <div className={cn(
          "w-1.5 h-1.5 transition-transform rounded-full",
          active ? "scale-100" : "scale-0 group-hover/item:scale-100"
        )} style={{ backgroundColor: color }} />
      </div>
      <span className={cn(
        "text-[12px] text-gray-700 whitespace-nowrap",
        isSubItem ? "text-gray-500 text-[11px]" : "font-medium",
        active ? "font-bold" : ""
      )} style={{ color: active ? color : undefined }}>{label}</span>
    </div>
  );
}

function ModuleBox({ label, onClick }: { label: string; onClick: () => void }) {
  const isCau = label === "CAU";
  
  return (
    <button 
      onClick={onClick}
      className="w-40 h-40 md:w-56 md:h-56 border-4 border-white/30 bg-transparent flex flex-col items-center justify-center p-4 md:p-8 text-white font-bold hover:bg-white/10 hover:border-white/50 transition-all text-center leading-tight shadow-lg active:scale-95 group"
    >
      {isCau ? (
        <div className="flex flex-col items-center gap-2">
           <span className="text-2xl md:text-3xl">CAU</span>
           <span className="text-[10px] md:text-sm font-normal opacity-90 leading-tight">
             (Centro Atención de Usuarios)
           </span>
        </div>
      ) : (
        <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform">{label}</span>
      )}
    </button>
  );
}
