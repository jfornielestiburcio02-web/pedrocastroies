
"use client";

import React, { useMemo } from 'react';
import { 
  Loader2, 
  Bell, 
  Search, 
  Calendar, 
  UserCircle, 
  BookOpen, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TeacherNotificationsViewProps {
  profesorId: string;
  mode: 'my-students' | 'tutoring';
  grupoTutorizado?: string;
}

export function TeacherNotificationsView({ profesorId, mode, grupoTutorizado }: TeacherNotificationsViewProps) {
  const db = useFirestore();

  // 1. Obtener todas las notificaciones (asistencias con tipo vacío y motivo presente)
  // Simplificamos eliminando orderBy para evitar errores de índices
  const notificationsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'asistenciasInasistencias'),
      where('tipo', '==', '')
    );
  }, [db]);

  const { data: allNotifications, isLoading: loadingNotifications } = useCollection(notificationsQuery);

  // 2. Obtener datos de apoyo (usuarios y horarios)
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);
  const { data: allUsers } = useCollection(usersQuery);

  const schedulesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'horarios');
  }, [db]);
  const { data: allSchedules } = useCollection(schedulesQuery);

  // 3. Filtrar notificaciones según el modo y Ordenar en Memoria
  const filteredNotifications = useMemo(() => {
    if (!allNotifications || !allUsers) return [];

    let results = [];
    if (mode === 'my-students') {
      results = allNotifications.filter(n => n.profesorId === profesorId);
    } else {
      if (!grupoTutorizado) return [];
      const tutoringStudentsIds = allUsers
        .filter(u => u.cursoAlumno === grupoTutorizado && u.rolesUsuario?.includes('EsAlumno'))
        .map(u => u.id);
      
      results = allNotifications.filter(n => tutoringStudentsIds.includes(n.alumnoId));
    }

    // Ordenar por fecha descendente en memoria para seguridad total
    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [allNotifications, allUsers, mode, profesorId, grupoTutorizado]);

  const getStudentInfo = (id: string) => {
    return allUsers?.find(u => u.id === id);
  };

  const getAsignatura = (claseId: string) => {
    return allSchedules?.find(s => s.id === claseId)?.asignatura || "Materia";
  };

  if (loadingNotifications) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-5xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="bg-[#f8f9fa] border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#89a54e] p-2 rounded-lg text-white">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-gray-700 uppercase">
                {mode === 'my-students' ? 'Avisos de mis alumnos' : `Avisos del grupo: ${grupoTutorizado}`}
              </span>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Registro de intenciones de falta / justificaciones previas</p>
            </div>
          </div>
          <Badge className="bg-gray-100 text-gray-500 border-none font-bold text-[10px]">
            {filteredNotifications.length} AVISOS
          </Badge>
        </div>

        <ScrollArea className="flex-1">
          {filteredNotifications.length === 0 ? (
            <div className="p-20 text-center space-y-4 opacity-40">
               <Bell className="h-16 w-16 mx-auto text-gray-200" />
               <p className="text-sm italic">No hay avisos pendientes de revisión.</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {filteredNotifications.map((notif) => {
                const student = getStudentInfo(notif.alumnoId);
                return (
                  <div key={notif.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 group">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage src={student?.imagenPerfil} />
                        <AvatarFallback className="bg-gray-100 text-gray-400 font-bold">
                          {student?.usuario?.substring(0,2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-800 uppercase">
                            {student?.nombrePersona || student?.usuario}
                          </span>
                          <Badge variant="outline" className="text-[8px] font-bold border-blue-100 text-blue-600 bg-blue-50">
                            {student?.cursoAlumno}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(notif.fecha), 'EEEE d MMMM', { locale: es })}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-3 w-3" />
                            {getAsignatura(notif.claseId)}
                          </div>
                        </div>

                        <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200">
                           <p className="text-xs text-gray-600 font-medium leading-relaxed italic">
                             "{notif.motivo}"
                           </p>
                        </div>
                      </div>
                    </div>

                    <div className="md:w-48 flex flex-col justify-center items-end gap-3 shrink-0 pt-4 md:pt-0 md:border-l md:pl-6 border-gray-100">
                       <div className="flex flex-col items-end">
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Enviado el</span>
                          <span className="text-[10px] text-gray-600 font-bold">
                            {notif.createdAt ? format(new Date(notif.createdAt), 'dd/MM/yyyy HH:mm') : 'Fecha desconocida'}
                          </span>
                       </div>
                       <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          <AlertCircle className="h-3 w-3" /> Pendiente de validar
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4">
         <Info className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
         <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-800 uppercase tracking-tight">Información de Seguimiento</h4>
            <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
              Esta sección centraliza las notificaciones enviadas proactivamente por los alumnos. Para que la falta sea **Justificada**, el profesor de la materia deberá validar el motivo desde el panel de asistencia por materia del día correspondiente.
            </p>
         </div>
      </div>
    </div>
  );
}
