
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Megaphone, 
  Video, 
  Pin, 
  Files, 
  UserCog, 
  Users, 
  Clock, 
  ShieldCheck, 
  Briefcase, 
  Coins, 
  Award, 
  Key, 
  FileSpreadsheet, 
  Home,
  Gavel,
  ShieldAlert,
  RefreshCw,
  Inbox,
  HeartHandshake,
  Building2,
  Users2,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarItem, SidebarHeading } from '../shared-components';

interface RayuelaSidebarProps {
  activeRole: string | null;
  sidebarMode: 'ACADEMIC' | 'MESSAGING';
  activeSubContent: string | null;
  expandedItems: Record<string, boolean>;
  isTeacherTutor: boolean;
  userRoles: string[];
  alwaysOpen?: boolean;
  onSetSidebarMode: (mode: 'ACADEMIC' | 'MESSAGING') => void;
  onSetActiveSubContent: (content: string) => void;
  onToggleExpanded: (id: string) => void;
}

export function RayuelaSidebar({
  activeRole,
  sidebarMode,
  activeSubContent,
  expandedItems,
  isTeacherTutor,
  userRoles,
  alwaysOpen = true,
  onSetSidebarMode,
  onSetActiveSubContent,
  onToggleExpanded
}: RayuelaSidebarProps) {
  const router = useRouter();
  const [isManualCollapsed, setIsManualCollapsed] = useState(false);

  // La barra está abierta si (AlwaysOpen es true Y no está colapsada manualmente) O si el ratón está encima (vía CSS group-hover)
  const isCurrentlyExpanded = alwaysOpen ? !isManualCollapsed : false;

  return (
    <div className={cn(
      "group relative z-40 bg-[#f4f4f4] border-r border-gray-300 transition-all duration-300 ease-in-out flex flex-col min-h-full overflow-hidden",
      isCurrentlyExpanded ? "w-[250px]" : "w-[60px] hover:w-[250px]"
    )}>
      <div className="flex-1 flex flex-col">
        <div className="flex h-full">
          <div className="w-[60px] min-w-[60px] flex flex-col items-center py-4 gap-4 bg-[#f4f4f4] border-r border-gray-200/50">
            {activeRole === 'Profesor Gestión' || activeRole === 'Coordinacion Bienestar' || activeRole === 'Coordinacion FP Dual' ? (
              <>
                <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><Gavel className="h-5 w-5" /></div>
                <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><Clock className="h-5 w-5" /></div>
                <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><ShieldAlert className="h-5 w-5" /></div>
                <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><Files className="h-5 w-5" /></div>
                <div className="p-2 bg-gray-400 rounded-sm text-white cursor-pointer" onClick={() => router.push('/configuracion')}><UserCog className="h-5 w-5" /></div>
              </>
            ) : (activeRole === 'Profesor' || activeRole === 'PROA+') ? (
              <>
                <div className={cn("p-2 rounded-sm text-white cursor-pointer transition-colors", sidebarMode === 'ACADEMIC' ? "bg-[#89a54e]" : "bg-gray-400")} onClick={() => onSetSidebarMode('ACADEMIC')}><BookOpen className="h-5 w-5" /></div>
                <div className={cn("p-2 rounded-sm text-white cursor-pointer transition-colors", sidebarMode === 'MESSAGING' ? "bg-[#fb8500]" : "bg-gray-400")} onClick={() => onSetSidebarMode('MESSAGING')}><Megaphone className="h-5 w-5" /></div>
                <div className="p-2 bg-gray-400 rounded-sm text-white"><Video className="h-5 w-5" /></div>
                <div className="p-2 bg-gray-400 rounded-sm text-white"><Pin className="h-5 w-5" /></div>
                <div className="p-2 bg-gray-400 rounded-sm text-white"><Files className="h-5 w-5" /></div>
                <div className="p-2 bg-gray-400 rounded-sm text-white cursor-pointer" onClick={() => router.push('/configuracion')}><UserCog className="h-5 w-5" /></div>
              </>
            ) : activeRole === 'Secretaría' ? (
              <>
                <div className="p-2 bg-[#fb8500] rounded-sm text-white"><Briefcase className="h-5 w-5" /></div>
                <div className="p-2 bg-[#fb8500] rounded-sm text-white"><Inbox className="h-5 w-5" /></div>
                <div className="p-2 bg-[#fb8500] rounded-sm text-white"><Coins className="h-5 w-5" /></div>
                <div className="p-2 bg-[#fb8500] rounded-sm text-white"><Award className="h-5 w-5" /></div>
                <div className="p-2 bg-[#fb8500] rounded-sm text-white"><Files className="h-5 w-5" /></div>
                <div className="p-2 bg-[#fb8500] rounded-sm text-white"><Key className="h-5 w-5" /></div>
                <div className="p-2 bg-gray-400 rounded-sm text-white cursor-pointer" onClick={() => router.push('/configuracion')}><UserCog className="h-5 w-5" /></div>
              </>
            ) : activeRole === 'Dirección' ? (
              <>
                <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><Users className="h-5 w-5" /></div>
                <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><Clock className="h-5 w-5" /></div>
                <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><Files className="h-5 w-5" /></div>
                <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><RefreshCw className="h-5 w-5" /></div>
                <div className="p-2 bg-gray-400 rounded-sm text-white cursor-pointer" onClick={() => router.push('/configuracion')}><UserCog className="h-5 w-5" /></div>
              </>
            ) : activeRole === 'Calificador Diagnóstico (coord)' ? (
              <>
                <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><FileSpreadsheet className="h-5 w-5" /></div>
                <div className="p-2 bg-gray-400 rounded-sm text-white"><Files className="h-5 w-5" /></div>
                <div className="p-2 bg-gray-400 rounded-sm text-white cursor-pointer" onClick={() => router.push('/configuracion')}><UserCog className="h-5 w-5" /></div>
              </>
            ) : activeRole === 'act extraesc.(coord)' ? (
              <>
                <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><Home className="h-5 w-5" /></div>
                <div className="p-2 bg-[#9c4d96] rounded-sm text-white"><Files className="h-5 w-5" /></div>
                <div className="p-2 bg-gray-400 rounded-sm text-white cursor-pointer" onClick={() => router.push('/configuracion')}><UserCog className="h-5 w-5" /></div>
              </>
            ) : (
              <>
                <div className="p-2 bg-[#fb8500] rounded-sm text-white"><UserCog className="h-5 w-5" /></div>
                <div className="p-2 bg-gray-400 rounded-sm text-white"><Files className="h-5 w-5" /></div>
                <div className="p-2 bg-gray-400 rounded-sm text-white cursor-pointer" onClick={() => router.push('/configuracion')}><UserCog className="h-5 w-5" /></div>
              </>
            )}

            {/* BOTÓN DE TOGGLE MANUAL (Solo si AlwaysOpen está activo) */}
            {alwaysOpen && (
              <div className="mt-auto pb-4">
                 <button 
                  onClick={() => setIsManualCollapsed(!isManualCollapsed)}
                  className="p-2 bg-white border border-gray-300 rounded-sm text-gray-500 hover:text-black transition-colors shadow-sm"
                 >
                    {isManualCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                 </button>
              </div>
            )}
          </div>
          
          <div className={cn(
            "flex flex-col py-4 w-full bg-white transition-all duration-300 overflow-y-auto",
            isCurrentlyExpanded ? "flex" : "hidden group-hover:flex animate-in fade-in slide-in-from-left-2 duration-300"
          )}>
            <div className="px-2 space-y-0.5">
              {activeRole === 'Coordinacion Bienestar' ? (
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <SidebarHeading label="Ayuda a alumnos" expanded={expandedItems['bienestar_ayuda']} onClick={() => onToggleExpanded('bienestar_ayuda')} />
                    {expandedItems['bienestar_ayuda'] && (
                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                        <SidebarItem color="#9c4d96" label="Recursos" isSubItem onClick={() => onSetActiveSubContent('Recursos')} active={activeSubContent === 'Recursos'} />
                        <SidebarItem color="#9c4d96" label="Guías" isSubItem onClick={() => onSetActiveSubContent('Guías')} active={activeSubContent === 'Guías'} />
                      </div>
                    )}
                  </div>
                </div>
              ) : activeRole === 'Coordinacion FP Dual' ? (
                <div className="space-y-2">
                   <div className="flex flex-col">
                      <SidebarHeading label="Gestión Dual" expanded={expandedItems['dual_root']} onClick={() => onToggleExpanded('dual_root')} />
                      {expandedItems['dual_root'] && (
                        <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                           <SidebarItem color="#9c4d96" label="Gestión de Empresas" isSubItem onClick={() => onSetActiveSubContent('Gestión de Empresas')} active={activeSubContent === 'Gestión de Empresas'} />
                           <SidebarItem color="#9c4d96" label="Alumnado Dual" isSubItem onClick={() => onSetActiveSubContent('Alumnado Dual')} active={activeSubContent === 'Alumnado Dual'} />
                           <SidebarItem color="#9c4d96" label="Convenios y Anexos" isSubItem onClick={() => onSetActiveSubContent('Convenios y Anexos')} active={activeSubContent === 'Convenios y Anexos'} />
                        </div>
                      )}
                   </div>
                </div>
              ) : activeRole === 'Profesor Gestión' ? (
                <div className="space-y-2">
                   <div className="flex flex-col">
                      <SidebarHeading label="Gestión Docente" expanded={expandedItems['horarios']} onClick={() => onToggleExpanded('horarios')} />
                      {expandedItems['horarios'] && (
                        <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                          <SidebarItem color="#9c4d96" label="Ver Horarios" isSubItem onClick={() => onSetActiveSubContent('Ver Horarios')} active={activeSubContent === 'Ver Horarios'} />
                          <SidebarItem color="#9c4d96" label="Mi Horario Personal" isSubItem onClick={() => onSetActiveSubContent('Mi Horario Personal')} active={activeSubContent === 'Mi Horario Personal'} />
                        </div>
                      )}
                   </div>

                   <div className="flex flex-col">
                      <SidebarHeading label="Convivencia Escolar" expanded={expandedItems['conductas']} onClick={() => onToggleExpanded('conductas')} />
                      {expandedItems['conductas'] && (
                        <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                           <div className="flex flex-col">
                              <SidebarHeading label="Conductas contrarias y graves" expanded={expandedItems['graves']} onClick={() => onToggleExpanded('graves')} />
                              {expandedItems['graves'] && (
                                <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                   <SidebarItem color="#9c4d96" label="Alumnado Incidente" isSubItem onClick={() => onSetActiveSubContent('Alumnado Incidente')} active={activeSubContent === 'Alumnado Incidente'} />
                                </div>
                              )}
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="flex flex-col">
                      <SidebarHeading label="Alumnado Centro" expanded={expandedItems['miAlumnado']} onClick={() => onToggleExpanded('miAlumnado')} />
                      {expandedItems['miAlumnado'] && (
                        <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                          <SidebarItem color="#9c4d96" label="Alumnado del centro" isSubItem onClick={() => onSetActiveSubContent('Alumnado del centro')} active={activeSubContent === 'Alumnado del centro'} />
                          <SidebarItem color="#9c4d96" label="Gestión de Grupos" isSubItem onClick={() => onSetActiveSubContent('Gestión de Grupos')} active={activeSubContent === 'Gestión de Grupos'} />
                        </div>
                      )}
                   </div>

                   <div className="flex flex-col">
                      <SidebarHeading label="Alumnado Absentista" expanded={expandedItems['absentistas']} onClick={() => onToggleExpanded('absentistas')} />
                      {expandedItems['absentistas'] && (
                        <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                          <SidebarItem color="#9c4d96" label="Búsqueda directa" isSubItem onClick={() => onSetActiveSubContent('Búsqueda directa')} active={activeSubContent === 'Búsqueda directa'} />
                        </div>
                      )}
                   </div>
                </div>
              ) : (activeRole === 'Profesor' || activeRole === 'PROA+') ? (
                <div className="flex flex-col space-y-2">
                  {sidebarMode === 'ACADEMIC' ? (
                    <>
                      <div className="flex flex-col">
                        <SidebarHeading label="Faltas de asistencia" expanded={expandedItems['faltas']} onClick={() => onToggleExpanded('faltas')} />
                        {expandedItems['faltas'] && (
                          <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                            <SidebarItem color="#89a54e" label="Por materia" isSubItem onClick={() => onSetActiveSubContent('Por materia')} active={activeSubContent === 'Por materia'} />
                            {isTeacherTutor && (
                              <SidebarItem color="#89a54e" label="Funcion tutorial" isSubItem onClick={() => onSetActiveSubContent('Funcion tutorial')} active={activeSubContent === 'Funcion tutorial'} />
                            )}
                            <SidebarItem color="#89a54e" label="Guardias" isSubItem onClick={() => onSetActiveSubContent('Guardias')} active={activeSubContent === 'Guardias'} />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <SidebarHeading label="Calificaciones y nota final" expanded={expandedItems['calificaciones_root']} onClick={() => onToggleExpanded('calificaciones_root')} />
                        {expandedItems['calificaciones_root'] && (
                          <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                            <div className="flex flex-col">
                              <SidebarHeading label="Evaluaciones" expanded={expandedItems['evaluaciones']} onClick={() => onToggleExpanded('evaluaciones')} />
                              {expandedItems['evaluaciones'] && (
                                <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                  <SidebarItem color="#89a54e" label="Exámenes" isSubItem onClick={() => onSetActiveSubContent('Exámenes')} active={activeSubContent === 'Exámenes'} />
                                  <SidebarItem color="#89a54e" label="Tareas" isSubItem onClick={() => onSetActiveSubContent('Tareas')} active={activeSubContent === 'Tareas'} />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <SidebarHeading label="Resumen" expanded={expandedItems['resumen']} onClick={() => onToggleExpanded('resumen')} />
                              {expandedItems['resumen'] && (
                                <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                  <SidebarItem color="#89a54e" label="Calificar" isSubItem onClick={() => onSetActiveSubContent('Calificar')} active={activeSubContent === 'Calificar'} />
                                  {isTeacherTutor && (
                                    <SidebarItem color="#89a54e" label="Evaluación como tutor" isSubItem onClick={() => onSetActiveSubContent('Evaluación como tutor')} active={activeSubContent === 'Evaluación como tutor'} />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <SidebarHeading label="Mi alumnado" expanded={expandedItems['miAlumnado']} onClick={() => onToggleExpanded('miAlumnado')} />
                        {expandedItems['miAlumnado'] && (
                          <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                            <div className="flex flex-col">
                              <SidebarHeading label="Grupos" expanded={expandedItems['grupos_root']} onClick={() => onToggleExpanded('grupos_root')} />
                              {expandedItems['grupos_root'] && (
                                <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                  <SidebarItem color="#89a54e" label="Gestión de Grupos" isSubItem onClick={() => onSetActiveSubContent('Gestión de Grupos')} active={activeSubContent === 'Gestión de Grupos'} />
                                </div>
                              )}
                            </div>
                            {isTeacherTutor && (
                              <SidebarItem color="#89a54e" label="Alumnado de mi tutoria" isSubItem onClick={() => onSetActiveSubContent('Alumnado de mi tutoria')} active={activeSubContent === 'Alumnado de mi tutoria'} />
                            )}
                            <SidebarItem color="#89a54e" label="Alumnado del centro" isSubItem onClick={() => onSetActiveSubContent('Alumnado del centro')} active={activeSubContent === 'Alumnado del centro'} />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <SidebarHeading label="Pruebas de diagnóstico" expanded={expandedItems['pruebas_diag']} onClick={() => onToggleExpanded('pruebas_diag')} />
                        {expandedItems['pruebas_diag'] && (
                          <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                            <SidebarItem color="#89a54e" label="Como Profesor" isSubItem onClick={() => onSetActiveSubContent('Como Profesor')} active={activeSubContent === 'Como Profesor'} />
                            {isTeacherTutor && (
                              <SidebarItem color="#89a54e" label="Como tutor" isSubItem onClick={() => onSetActiveSubContent('Como tutor')} active={activeSubContent === 'Como tutor'} />
                            )}
                            {userRoles.includes('EsDireccion') && (
                              <SidebarItem color="#89a54e" label="Como cargo directivo del centro" isSubItem onClick={() => onSetActiveSubContent('Como cargo directivo del centro')} active={activeSubContent === 'Como cargo directivo del centro'} />
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <SidebarHeading label="Enlaces de interes" expanded={expandedItems['enlaces']} onClick={() => onToggleExpanded('enlaces')} />
                        {expandedItems['enlaces'] && (
                          <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                            <SidebarItem color="#89a54e" label="Mis enlaces" isSubItem onClick={() => onSetActiveSubContent('Mis enlaces')} active={activeSubContent === 'Mis enlaces'} />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <SidebarHeading label="Horario" expanded={expandedItems['horario_profesor']} onClick={() => onToggleExpanded('horario_profesor')} />
                        {expandedItems['horario_profesor'] && (
                          <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                            <SidebarItem color="#89a54e" label="Ver horario" isSubItem onClick={() => onSetActiveSubContent('Mi Horario Personal')} active={activeSubContent === 'Mi Horario Personal'} />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <SidebarHeading label="Notificaciones" expanded={expandedItems['notificaciones_root']} onClick={() => onToggleExpanded('notificaciones_root')} />
                        {expandedItems['notificaciones_root'] && (
                          <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                            <SidebarItem color="#89a54e" label="De Mis Alumnos" isSubItem onClick={() => onSetActiveSubContent('De Mis Alumnos')} active={activeSubContent === 'De Mis Alumnos'} />
                            {isTeacherTutor && (
                              <SidebarItem color="#89a54e" label="De mi tutoría" isSubItem onClick={() => onSetActiveSubContent('De mi tutoría')} active={activeSubContent === 'De mi tutoría'} />
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col">
                      <SidebarHeading label="Mensajería" expanded={expandedItems['mensajeria']} onClick={() => onToggleExpanded('mensajeria')} />
                      {expandedItems['mensajeria'] && (
                        <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                          <SidebarItem color="#fb8500" label="Mis Mensajes" isSubItem onClick={() => onSetActiveSubContent('Mis Mensajes')} active={activeSubContent === 'Mis Mensajes'} />
                          <SidebarItem color="#fb8500" label="Papelera" isSubItem onClick={() => onSetActiveSubContent('Papelera Mensajería')} active={activeSubContent === 'Papelera Mensajería'} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : activeRole === 'Alumno' ? (
                <div className="flex flex-col space-y-2">
                  {sidebarMode === 'ACADEMIC' ? (
                    <>
                      <div className="flex flex-col">
                        <SidebarHeading label="Faltas de asistencia" expanded={expandedItems['faltas_alum']} onClick={() => onToggleExpanded('faltas_alum')} />
                        {expandedItems['faltas_alum'] && (
                          <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                            <SidebarItem color="#89a54e" label="Mis faltas" isSubItem onClick={() => onSetActiveSubContent('Mis faltas')} active={activeSubContent === 'Mis faltas'} />
                            <SidebarItem color="#89a54e" label="Justificar" isSubItem onClick={() => onSetActiveSubContent('Justificar')} active={activeSubContent === 'Justificar'} />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <SidebarHeading label="Comportamiento" expanded={expandedItems['comportamiento_alum']} onClick={() => onToggleExpanded('comportamiento_alum')} />
                        {expandedItems['comportamiento_alum'] && (
                          <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                            <SidebarItem color="#89a54e" label="Negativos / Positivos" isSubItem onClick={() => onSetActiveSubContent('Negativos / Positivos')} active={activeSubContent === 'Negativos / Positivos'} />
                            <SidebarItem color="#89a54e" label="Amonestaciones" isSubItem onClick={() => onSetActiveSubContent('Amonestaciones Alumno')} active={activeSubContent === 'Amonestaciones Alumno'} />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col">
                        <SidebarHeading label="Evaluaciones" expanded={expandedItems['evaluaciones_alum']} onClick={() => onToggleExpanded('evaluaciones_alum')} />
                        {expandedItems['evaluaciones_alum'] && (
                          <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                            <SidebarItem color="#89a54e" label="Calificaciones y nota final" isSubItem onClick={() => onSetActiveSubContent('Calificaciones y nota final')} active={activeSubContent === 'Calificaciones y nota final'} />
                          </div>
                        )}
                      </div>

                      <SidebarItem color="#89a54e" label="Tareas" onClick={() => onSetActiveSubContent('Mis Tareas')} active={activeSubContent === 'Mis Tareas'} />
                      <SidebarItem color="#89a54e" label="Exámenes" onClick={() => onSetActiveSubContent('Mis Exámenes')} active={activeSubContent === 'Mis Exámenes'} />
                      <SidebarItem color="#89a54e" label="Mi horario" onClick={() => onSetActiveSubContent('Mi Horario Alumno')} active={activeSubContent === 'Mi Horario Alumno'} />
                    </>
                  ) : (
                    <div className="flex flex-col">
                      <SidebarHeading label="Mensajería" expanded={expandedItems['mensajeria']} onClick={() => onToggleExpanded('mensajeria')} />
                      {expandedItems['mensajeria'] && (
                        <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                          <SidebarItem color="#fb8500" label="Mis Mensajes" isSubItem onClick={() => onSetActiveSubContent('Mis Mensajes')} active={activeSubContent === 'Mis Mensajes'} />
                          <SidebarItem color="#fb8500" label="Papelera" isSubItem onClick={() => onSetActiveSubContent('Papelera Mensajería')} active={activeSubContent === 'Papelera Mensajería'} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : activeRole === 'Secretaría' ? (
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <SidebarHeading label="Solicitudes recibidas" expanded={expandedItems['solicitudes_root']} onClick={() => onToggleExpanded('solicitudes_root')} />
                    {expandedItems['solicitudes_root'] && (
                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                         <SidebarItem color="#fb8500" label="secodex" isSubItem onClick={() => onSetActiveSubContent('secodex_admin')} active={activeSubContent === 'secodex_admin'} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <SidebarHeading label="Arqueo de caja" expanded={expandedItems['arqueo']} onClick={() => onToggleExpanded('arqueo')} />
                    {expandedItems['arqueo'] && (
                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                        <SidebarItem color="#fb8500" label="Arqueo de caja (Control)" isSubItem onClick={() => onSetActiveSubContent('Arqueo de caja (Control)')} active={activeSubContent === 'Arqueo de caja (Control)'} />
                        <SidebarItem color="#fb8500" label="Gestión Económica" isSubItem onClick={() => onSetActiveSubContent('Gestión Económica')} active={activeSubContent === 'Gestión Económica'} />
                        <SidebarItem color="#fb8500" label="Gastos y ganancias" isSubItem onClick={() => onSetActiveSubContent('Gestión Económica')} active={activeSubContent === 'Gastos y ganancias'} />
                        <SidebarItem color="#fb8500" label="Tasas por descuento" isSubItem onClick={() => onSetActiveSubContent('Tasas por descuento')} active={activeSubContent === 'Tasas por descuento'} />
                        <SidebarItem color="#fb8500" label="Formación Profesional" isSubItem onClick={() => onSetActiveSubContent('Formación Profesional')} active={activeSubContent === 'Formación Profesional'} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <SidebarHeading label="Títulos" expanded={expandedItems['titulos']} onClick={() => onToggleExpanded('titulos')} />
                    {expandedItems['titulos'] && (
                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                        <SidebarItem color="#fb8500" label="Título de bachillerato" isSubItem onClick={() => onSetActiveSubContent('Título de bachillerato')} active={activeSubContent === 'Título de bachillerato'} />
                        <div className="flex flex-col">
                          <SidebarHeading label="Sello de buena práctica" expanded={expandedItems['sello']} onClick={() => onToggleExpanded('sello')} />
                          {expandedItems['sello'] && (
                            <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                              <SidebarItem color="#fb8500" label="seCODEX" isSubItem onClick={() => onSetActiveSubContent('seCODEX')} active={activeSubContent === 'seCODEX'} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <SidebarHeading label="Expedientes" expanded={expandedItems['expedientes']} onClick={() => onToggleExpanded('expedientes')} />
                    {expandedItems['expedientes'] && (
                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                        <SidebarItem color="#fb8500" label="Por Alumno" isSubItem onClick={() => onSetActiveSubContent('Por Alumno')} active={activeSubContent === 'Por Alumno'} />
                        <SidebarItem color="#fb8500" label="Por centro" isSubItem onClick={() => onSetActiveSubContent('Por centro')} active={activeSubContent === 'Por centro'} />
                      </div>
                    )}
                  </div>

                  <SidebarItem color="#fb8500" label="Entrega de credenciales" onClick={() => onSetActiveSubContent('Entrega de credenciales')} active={activeSubContent === 'Entrega de credenciales'} />
                </div>
              ) : activeRole === 'Dirección' ? (
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <SidebarHeading label="Usuarios" expanded={expandedItems['usuarios']} onClick={() => onToggleExpanded('usuarios')} />
                    {expandedItems['usuarios'] && (
                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                        <SidebarItem color="#9c4d96" label="Creación" isSubItem onClick={() => onSetActiveSubContent('Creación de Usuarios')} active={activeSubContent === 'Creación de Usuarios'} />
                        <SidebarItem color="#9c4d96" label="Visualización" isSubItem onClick={() => onSetActiveSubContent('Visualización de Usuarios')} active={activeSubContent === 'Visualización de Usuarios'} />
                        <SidebarItem color="#9c4d96" label="Eliminación" isSubItem onClick={() => onSetActiveSubContent('Visualización de Usuarios')} active={activeSubContent === 'Eliminación de Usuarios'} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <SidebarHeading label="Horarios" expanded={expandedItems['horarios']} onClick={() => onToggleExpanded('horarios')} />
                    {expandedItems['horarios'] && (
                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                        <SidebarItem color="#9c4d96" label="Ver" isSubItem onClick={() => onSetActiveSubContent('Ver Horarios')} active={activeSubContent === 'Ver Horarios'} />
                        <SidebarItem color="#9c4d96" label="Modificar / crear" isSubItem onClick={() => onSetActiveSubContent('Modificar / crear Horarios')} active={activeSubContent === 'Modificar / crear Horarios'} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <SidebarHeading label="Designacion PROA" expanded={expandedItems['proa_root']} onClick={() => onToggleExpanded('proa_root')} />
                    {expandedItems['proa_root'] && (
                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                         <div className="flex flex-col">
                            <SidebarHeading label="PT" expanded={expandedItems['pt_root']} onClick={() => onToggleExpanded('pt_root')} />
                            {expandedItems['pt_root'] && (
                              <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                                 <SidebarItem color="#9c4d96" label="Designar" isSubItem onClick={() => onSetActiveSubContent('Designar PROA+')} active={activeSubContent === 'Designar PROA+'} />
                                 <SidebarItem color="#9c4d96" label="Designar Profesor DAD" isSubItem onClick={() => onSetActiveSubContent('Designar Profesor DAD')} active={activeSubContent === 'Designar Profesor DAD'} />
                              </div>
                            )}
                         </div>
                      </div>
                    )}
                  </div>

                  <SidebarItem color="#9c4d96" label="Sincronizacion Perfiles" onClick={() => onSetActiveSubContent('Sincronizacion Perfiles')} active={activeSubContent === 'Sincronizacion Perfiles'} />

                  <div className="flex flex-col">
                    <SidebarHeading label="Evaluaciones" expanded={expandedItems['evaluaciones_dir']} onClick={() => onToggleExpanded('evaluaciones_dir')} />
                    {expandedItems['evaluaciones_dir'] && (
                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                        <SidebarItem color="#9c4d96" label="Resumen (Tasas)" isSubItem onClick={() => onSetActiveSubContent('Resumen (Tasas)')} active={activeSubContent === 'Resumen (Tasas)'} />
                        <div className="flex flex-col">
                          <SidebarHeading label="Apertura de la evaluación" expanded={expandedItems['apertura_root']} onClick={() => onToggleExpanded('apertura_root')} />
                          {expandedItems['apertura_root'] && (
                            <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                              <SidebarItem color="#9c4d96" label="Gestión de Apertura" isSubItem onClick={() => onSetActiveSubContent('Apertura de la evaluación')} active={activeSubContent === 'Apertura de la evaluación'} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <SidebarHeading label="Resumenes" expanded={expandedItems['resumenes_root']} onClick={() => onToggleExpanded('resumenes_root')} />
                    {expandedItems['resumenes_root'] && (
                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                        <SidebarItem color="#9c4d96" label="Evaluaciones (Gráficas)" isSubItem onClick={() => onSetActiveSubContent('Evaluaciones (Gráficas)')} active={activeSubContent === 'Evaluaciones (Gráficas)'} />
                        <SidebarItem color="#9c4d96" label="Conductas contrarias y graves" isSubItem onClick={() => onSetActiveSubContent('Resumen Conductas')} active={activeSubContent === 'Resumen Conductas'} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <SidebarHeading label="Perfil" expanded={expandedItems['perfil']} onClick={() => onToggleExpanded('perfil')} />
                    {expandedItems['perfil'] && (
                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                        <SidebarItem color="#9c4d96" label="Agregar y quitar" isSubItem onClick={() => onSetActiveSubContent('Agregar y quitar Perfiles')} active={activeSubContent === 'Agregar y quitar Perfiles'} />
                      </div>
                    )}
                  </div>
                </div>
              ) : activeRole === 'Calificador Diagnóstico (coord)' ? (
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <SidebarHeading label="Pruebas de diagnóstico" expanded={expandedItems['pruebas_diag_root']} onClick={() => onToggleExpanded('pruebas_diag_root')} />
                    {expandedItems['pruebas_diag_root'] && (
                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                        <SidebarItem color="#9c4d96" label="Apertura de la evaluación" isSubItem onClick={() => onSetActiveSubContent('Apertura de la evaluación (Diag)')} active={activeSubContent === 'Apertura de la evaluación (Diag)'} />
                        <div className="flex flex-col">
                          <SidebarHeading label="Resultados" expanded={expandedItems['resultados_diag']} onClick={() => onToggleExpanded('resultados_diag')} />
                          {expandedItems['resultados_diag'] && (
                            <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                              <SidebarItem color="#9c4d96" label="Por curso" isSubItem onClick={() => onSetActiveSubContent('Por curso (Diag)')} active={activeSubContent === 'Por curso (Diag)'} />
                              <SidebarItem color="#9c4d96" label="Por alumno" isSubItem onClick={() => onSetActiveSubContent('Por alumno (Diag)')} active={activeSubContent === 'Por alumno (Diag)'} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeRole === 'act extraesc.(coord)' ? (
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <SidebarHeading 
                      label="Actividades Complementarias y Extraescolares" 
                      expanded={expandedItems['extraesc_root']} 
                      onClick={() => onToggleExpanded('extraesc_root')} 
                    />
                    {expandedItems['extraesc_root'] && (
                      <div className="flex flex-col ml-6 border-l border-gray-200 mt-0.5 animate-in slide-in-from-top-1 duration-200">
                        <SidebarItem 
                          color="#9c4d96" 
                          label="Actividades" 
                          isSubItem 
                          onClick={() => onSetActiveSubContent('Actividades Extraescolares')} 
                          active={activeSubContent === 'Actividades Extraescolares'} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <SidebarItem color="#fb8500" label="Panel de Coordinación" onClick={() => onSetActiveSubContent('Panel de Coordinación')} active={activeSubContent === 'Panel de Coordinación'} />
                  <SidebarItem color="#fb8500" label="Documentación" onClick={() => onSetActiveSubContent('Documentación')} active={activeSubContent === 'Documentación'} />
                  <SidebarItem color="#fb8500" label="Calendario de Actividades" onClick={() => onSetActiveSubContent('Calendario')} active={activeSubContent === 'Calendario'} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
