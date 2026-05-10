
"use client";

import React, { useState, useMemo } from 'react';
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Phone,
  Mail,
  FileText,
  XCircle,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, writeBatch, getDocs } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AttendanceJustificationViewProps {
  alumno: any;
  onClose: () => void;
  profesorId: string;
}

export function AttendanceJustificationView({ alumno, onClose, profesorId }: AttendanceJustificationViewProps) {
  const db = useFirestore();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  // 1. Obtener TODOS los grupos para resolución dinámica
  const groupsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'gruposAlumnos');
  }, [db]);
  const { data: allGroups } = useCollection(groupsQuery);

  // 2. Obtener TODAS las sesiones de horario
  const schedulesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'horarios');
  }, [db]);
  const { data: allSchedules, isLoading: loadingSchedule } = useCollection(schedulesQuery);

  // 3. Filtrar horarios que pertenecen al alumno (por ID estático O por vinculación de curso al grupo)
  const studentSchedules = useMemo(() => {
    if (!allSchedules || !allGroups || !alumno) return [];
    
    // IDs de grupos que corresponden al curso del alumno (Sincro dinámica)
    const courseGroupIds = allGroups
      .filter(g => g.cursoVinculado === alumno.cursoAlumno)
      .map(g => g.id);

    return allSchedules.filter(s => 
      s.alumnosIds?.includes(alumno.id) || 
      (s.grupoId && courseGroupIds.includes(s.grupoId))
    );
  }, [allSchedules, allGroups, alumno]);

  // 4. Obtener asistencias de la semana
  const attendanceQuery = useMemoFirebase(() => {
    if (!db || !alumno?.id) return null;
    return query(
      collection(db, 'asistenciasInasistencias'), 
      where('alumnoId', '==', alumno.id),
      where('fecha', '>=', format(weekStart, 'yyyy-MM-dd')),
      where('fecha', '<=', format(weekEnd, 'yyyy-MM-dd'))
    );
  }, [db, alumno?.id, weekStart, weekEnd]);

  const { data: attendances } = useCollection(attendanceQuery);

  // 5. Determinar qué días de la semana tienen clases
  const activeDays = useMemo(() => {
    if (!studentSchedules) return [];
    const daysInHorario = Array.from(new Set(studentSchedules.map(s => s.dia)));
    const allWeekDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    return allWeekDays.filter(day => daysInHorario.includes(day));
  }, [studentSchedules]);

  // 6. Materias únicas del alumno
  const uniqueSubjects = useMemo(() => {
    if (!studentSchedules) return [];
    return Array.from(new Set(studentSchedules.map(s => s.asignatura))).sort();
  }, [studentSchedules]);

  const getDayFullStatus = (diaNombre: string) => {
    if (studentSchedules.length === 0 || !attendances) return null;
    const diaIndex = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].indexOf(diaNombre);
    const targetDate = format(addDays(weekStart, diaIndex), 'yyyy-MM-dd');
    const daySessions = studentSchedules.filter(s => s.dia === diaNombre);
    
    if (daySessions.length === 0) return null;

    const dayAtts = attendances.filter(a => a.fecha === targetDate && daySessions.some(s => s.id === a.claseId));
    
    if (dayAtts.length === 0) return null;

    const allInj = dayAtts.length >= daySessions.length && dayAtts.every(a => a.tipo === 'I' && a.isFullDay);
    const allJust = dayAtts.length >= daySessions.length && dayAtts.every(a => a.tipo === 'J' && a.isFullDay);

    if (allInj) return 'I';
    if (allJust) return 'J';
    return null;
  };

  const handleDayAction = async (diaNombre: string, action: 'Inj' | 'Just' | 'Delete') => {
    if (!db || studentSchedules.length === 0) return;
    
    const diaIndex = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].indexOf(diaNombre);
    const targetDate = format(addDays(weekStart, diaIndex), 'yyyy-MM-dd');
    const daySessions = studentSchedules.filter(s => s.dia === diaNombre);
    
    const batch = writeBatch(db);
    
    // 1. ELIMINACIÓN PREVIA de cualquier registro este día
    const existingDayQuery = query(
      collection(db, 'asistenciasInasistencias'),
      where('alumnoId', '==', alumno.id),
      where('fecha', '==', targetDate)
    );
    const snap = await getDocs(existingDayQuery);
    snap.forEach(d => batch.delete(d.ref));

    // 2. APLICAR NUEVA ACCIÓN
    if (action !== 'Delete') {
      daySessions.forEach(session => {
        const attendanceId = `${alumno.id}_${session.id}_${targetDate}`;
        const docRef = doc(db, 'asistenciasInasistencias', attendanceId);
        
        batch.set(docRef, {
          alumnoId: alumno.id,
          claseId: session.id,
          fecha: targetDate,
          tipo: action === 'Just' ? 'J' : 'I',
          motivo: action === 'Just' ? 'Día Completo' : 'Día Completo (Inj)',
          profesorId,
          isFullDay: true,
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      });

      if (action === 'Inj') {
        addDocumentNonBlocking(collection(db, 'mensajes'), {
          remitenteId: 'SISTEMA',
          destinatarioId: alumno.id,
          asunto: 'Aviso de Asistencia: Día Completo',
          cuerpo: `Se ha registrado una falta de dia completo para tu persona el dia ${format(addDays(weekStart, diaIndex), 'dd/MM/yyyy')}`,
          leido: false,
          eliminado: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    await batch.commit();
  };

  const handleJustifyHour = (claseId: string, fecha: string) => {
    if (!db) return;
    const attendanceId = `${alumno.id}_${claseId}_${fecha}`;
    setDocumentNonBlocking(doc(db, 'asistenciasInasistencias', attendanceId), {
      alumnoId: alumno.id,
      claseId,
      fecha,
      tipo: 'J',
      motivo: 'Justificada por Tutor',
      profesorId,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleDeleteHour = (claseId: string, fecha: string) => {
    if (!db) return;
    const attendanceId = `${alumno.id}_${claseId}_${fecha}`;
    deleteDocumentNonBlocking(doc(db, 'asistenciasInasistencias', attendanceId));
  };

  if (loadingSchedule) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="animate-in fade-in duration-300 space-y-4 w-full font-verdana pb-10">
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col md:flex-row items-center gap-4 relative">
         <button onClick={onClose} className="absolute top-2 right-2 text-gray-300 hover:text-red-600 transition-colors">
            <XCircle className="h-5 w-5" />
         </button>
         
         <Avatar className="h-16 w-16 border shadow-sm">
           <AvatarImage src={alumno?.imagenPerfil} />
           <AvatarFallback className="text-lg font-bold text-gray-400 bg-gray-50">{alumno?.usuario?.substring(0,2).toUpperCase()}</AvatarFallback>
         </Avatar>
         
         <div className="flex-1 space-y-1 text-center md:text-left">
            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">{alumno?.nombrePersona || alumno?.usuario}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 text-[9px] font-bold text-blue-600 uppercase">
               <span className="hover:underline cursor-pointer flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> Llamada</span>
               <span className="hover:underline cursor-pointer flex items-center gap-1"><FileText className="h-2.5 w-2.5" /> Carta</span>
               <span className="hover:underline cursor-pointer flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> Mensaje</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-3 text-[9px] font-bold text-gray-500 uppercase">
               <span>Semana del {format(weekStart, 'dd/MM')} al {format(weekEnd, 'dd/MM')}</span>
               <Badge className="bg-blue-50 text-blue-700 border-none font-bold text-[8px]">{alumno.cursoAlumno}</Badge>
            </div>
         </div>
      </div>

      <div className="flex items-center justify-between bg-white/50 p-1.5 rounded-lg border border-gray-100">
         <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, -7))} className="h-7 gap-1 text-[9px] font-bold uppercase shadow-sm"><ChevronLeft className="h-3 w-3" /> Ant.</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 7))} className="h-7 gap-1 text-[9px] font-bold uppercase shadow-sm">Sig. <ChevronRight className="h-3 w-3" /></Button>
         </div>
         <Button className="bg-[#fb8500] hover:bg-[#e07600] text-white text-[9px] font-bold uppercase h-7 px-4 shadow-sm rounded-full">Justificar por motivo</Button>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse text-[9px]">
             <thead>
                <tr className="bg-gray-50/50">
                   <th className="border-b border-r p-2 w-40 bg-white"></th>
                   {activeDays.map((dayNombre) => {
                      const diaIndex = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].indexOf(dayNombre);
                      const date = addDays(weekStart, diaIndex);
                      const dayStatus = getDayFullStatus(dayNombre);

                      return (
                        <th key={dayNombre} className="border-b border-r p-0 min-w-[120px] last:border-r-0">
                           <div className="flex flex-col items-center py-2 space-y-1.5">
                              <div className="text-center">
                                 <span className="text-blue-500 font-bold block">{format(date, 'd MMM')}</span>
                                 <span className="text-blue-900 font-black uppercase tracking-tighter">{dayNombre}</span>
                              </div>
                              <div className="flex flex-col items-center gap-1">
                                 <div className="flex gap-1.5">
                                    <button 
                                      onClick={() => handleDayAction(dayNombre, 'Inj')} 
                                      className={cn(
                                        "border px-3 py-1 text-[9px] font-black rounded transition-all active:scale-95 uppercase shadow-sm",
                                        dayStatus === 'I' ? "bg-[#e63946] text-white border-red-700" : "bg-white border-gray-300 text-gray-700"
                                      )}
                                    >
                                      INJ
                                    </button>
                                    <button 
                                      onClick={() => handleDayAction(dayNombre, 'Just')} 
                                      className={cn(
                                        "border px-3 py-1 text-[9px] font-black rounded transition-all active:scale-95 uppercase shadow-sm",
                                        dayStatus === 'J' ? "bg-[#78B64E] text-white border-green-700" : "bg-white border-gray-300 text-gray-700"
                                      )}
                                    >
                                      JUST
                                    </button>
                                 </div>
                                 {dayStatus && (
                                   <button 
                                     onClick={() => handleDayAction(dayNombre, 'Delete')}
                                     className="text-red-500 hover:text-red-700 font-bold text-[8px] uppercase underline mt-0.5"
                                   >
                                     Eliminar día completo
                                   </button>
                                 )}
                              </div>
                           </div>
                        </th>
                      );
                   })}
                </tr>
             </thead>
             <tbody>
                {uniqueSubjects.length === 0 ? (
                  <tr><td colSpan={activeDays.length + 1} className="p-10 text-center italic text-gray-400">No hay clases asignadas para este alumno en el censo.</td></tr>
                ) : (
                  uniqueSubjects.map((subject) => (
                    <tr key={subject} className="hover:bg-gray-50/30 transition-colors h-14">
                       <td className="border-b border-r p-2 text-[9px] font-bold text-gray-500 uppercase bg-gray-50/20">
                          {subject}
                       </td>
                       {activeDays.map((dayNombre) => {
                          const diaIndex = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].indexOf(dayNombre);
                          const targetDate = format(addDays(weekStart, diaIndex), 'yyyy-MM-dd');
                          const session = studentSchedules?.find(s => s.dia === dayNombre && s.asignatura === subject);
                          
                          if (!session) return <td key={dayNombre} className="border-b border-r last:border-r-0 bg-gray-100/5"></td>;

                          const attendance = attendances?.find(a => a.claseId === session.id && a.fecha === targetDate);
                          const isInj = attendance?.tipo === 'I';
                          const isJust = attendance?.tipo === 'J';

                          return (
                            <td key={dayNombre} className="border-b border-r last:border-r-0 p-2 align-middle text-center">
                               {isInj && (
                                 <div className="flex items-center justify-center gap-2 animate-in zoom-in-95 duration-200">
                                    <span className="boton_rectangulo scale-75" data-type="I">Inj</span>
                                    <div className="flex flex-col gap-0.5 items-start">
                                       <button 
                                        onClick={() => handleJustifyHour(session.id, targetDate)}
                                        className="bg-white border border-gray-300 px-2 py-0.5 text-[8px] font-bold rounded hover:bg-blue-50 text-gray-600 transition-all uppercase"
                                       >
                                         Just
                                       </button>
                                       <button 
                                        onClick={() => handleDeleteHour(session.id, targetDate)}
                                        className="text-red-500 hover:text-red-700 text-[7px] font-bold uppercase underline"
                                       >
                                         Eliminar
                                       </button>
                                    </div>
                                 </div>
                               )}
                               
                               {isJust && (
                                 <div className="flex items-center justify-center gap-2 animate-in fade-in duration-300">
                                    <span className="boton_rectangulo scale-75" data-type="J">Just</span>
                                    <button 
                                     onClick={() => handleDeleteHour(session.id, targetDate)}
                                     className="text-red-500 hover:text-red-700 text-[7px] font-bold uppercase underline"
                                    >
                                      Eliminar
                                    </button>
                                 </div>
                               )}
                            </td>
                          );
                       })}
                    </tr>
                  ))
                )}
             </tbody>
          </table>
      </div>
    </div>
  );
}
