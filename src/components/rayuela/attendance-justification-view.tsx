
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDocs, writeBatch } from 'firebase/firestore';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  // 1. Obtener el horario del alumno para saber qué días y qué materias tiene
  const schedulesQuery = useMemoFirebase(() => {
    if (!db || !alumno?.id) return null;
    return query(collection(db, 'horarios'), where('alumnosIds', 'array-contains', alumno.id));
  }, [db, alumno?.id]);
  const { data: studentSchedules, isLoading: loadingSchedule } = useCollection(schedulesQuery);

  // 2. Obtener asistencias de la semana
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

  // 3. Determinar qué días de la semana tienen clases para el alumno
  const activeDays = useMemo(() => {
    if (!studentSchedules) return [];
    const daysInHorario = Array.from(new Set(studentSchedules.map(s => s.dia)));
    const allWeekDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    return allWeekDays.filter(day => daysInHorario.includes(day));
  }, [studentSchedules]);

  // 4. Materias únicas del alumno
  const uniqueSubjects = useMemo(() => {
    if (!studentSchedules) return [];
    return Array.from(new Set(studentSchedules.map(s => s.asignatura))).sort();
  }, [studentSchedules]);

  const handleJustifyHour = (claseId: string, fecha: string) => {
    if (!db) return;
    const attendanceId = `${alumno.id}_${claseId}_${fecha}`;
    const docRef = doc(db, 'asistenciasInasistencias', attendanceId);
    
    setDocumentNonBlocking(docRef, {
      alumnoId: alumno.id,
      claseId,
      fecha,
      tipo: 'J',
      motivo: 'Justificada por Tutor',
      profesorId,
      createdAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleDayAction = async (diaNombre: string, action: 'Inj' | 'Just') => {
    if (!db || !studentSchedules) return;
    
    // Encontrar la fecha real para ese día de la semana
    const diaIndex = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].indexOf(diaNombre);
    const targetDate = format(addDays(weekStart, diaIndex), 'yyyy-MM-dd');
    
    // Sesiones del alumno para ese día
    const daySessions = studentSchedules.filter(s => s.dia === diaNombre);
    
    const batch = writeBatch(db);
    daySessions.forEach(session => {
      const attendanceId = `${alumno.id}_session_${session.id}_${targetDate}`;
      const docRef = doc(db, 'asistenciasInasistencias', attendanceId);
      
      batch.set(docRef, {
        alumnoId: alumno.id,
        claseId: session.id,
        fecha: targetDate,
        tipo: action === 'Just' ? 'J' : 'I',
        motivo: action === 'Just' ? 'Día Completo' : '',
        profesorId,
        isFullDay: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    await batch.commit();
  };

  if (loadingSchedule) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-verdana animate-in fade-in duration-300">
      {/* Cabecera Estilo Card Rayuela - MODO COMPACTO */}
      <div className="bg-[#f0f0f0] p-4 flex flex-col items-center border-b shadow-sm shrink-0">
        <div className="bg-white p-4 rounded-xl border shadow-sm max-w-2xl w-full flex flex-col items-center gap-4 relative">
           <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-black transition-colors"><XCircle className="h-5 w-5" /></button>
           
           <div className="flex items-center gap-6 w-full justify-center">
              <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                <AvatarImage src={alumno?.imagenPerfil} />
                <AvatarFallback className="text-xl">{alumno?.usuario?.substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="space-y-1">
                 <div className="text-center md:text-left">
                    <p className="text-base font-bold text-gray-700 uppercase leading-tight">{alumno?.nombrePersona || alumno?.usuario}</p>
                    <div className="flex gap-3 mt-1 text-[9px] font-bold text-gray-500 uppercase">
                       <span className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> Llamada</span>
                       <span className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"><FileText className="h-2.5 w-2.5" /> Carta</span>
                       <span className="text-blue-600 hover:underline cursor-pointer flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> Mensaje</span>
                    </div>
                 </div>

                 <div className="flex items-center gap-4 text-[9px] font-bold text-gray-500 uppercase pt-1">
                    <div className="flex items-center gap-1.5">
                       <span>Desde:</span>
                       <div className="bg-white border rounded px-1.5 py-0.5 flex items-center gap-1.5">
                          {format(weekStart, 'dd/MM/yyyy')} <CalendarIcon className="h-2.5 w-2.5 text-gray-400" />
                       </div>
                    </div>
                    <div className="flex items-center gap-1">
                       <span>Hasta:</span>
                       <span className="text-green-600">{format(weekEnd, 'dd/MM/yyyy')}</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Grid de Asistencia - COMPACTO */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-2 bg-white border-b px-4">
           <div className="flex gap-1.5">
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, -7))} className="h-7 gap-1 text-[9px] font-bold uppercase"><ChevronLeft className="h-3 w-3" /> Sem. Ant.</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 7))} className="h-7 gap-1 text-[9px] font-bold uppercase">Sem. Sig. <ChevronRight className="h-3 w-3" /></Button>
           </div>
           <Button className="bg-[#fb8500] hover:bg-[#e07600] text-white text-[9px] font-bold uppercase h-7 px-4 shadow-sm">Justificar por motivo</Button>
        </div>

        <ScrollArea className="flex-1">
           <div className="min-w-max p-4">
              <table className="w-full border-collapse border border-gray-200 shadow-sm text-[10px]">
                 <thead>
                    <tr className="bg-white">
                       <th className="border border-gray-200 p-2 w-48 bg-gray-50"></th>
                       {activeDays.map((dayNombre) => {
                          const diaIndex = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].indexOf(dayNombre);
                          const date = addDays(weekStart, diaIndex);
                          return (
                            <th key={dayNombre} className="border border-gray-200 min-w-[140px] bg-white">
                               <div className="flex flex-col items-center py-2 bg-blue-50/10">
                                  <span className="text-blue-500 font-bold text-[11px]">{format(date, 'd MMMM')}</span>
                                  <span className="text-blue-900 font-black text-[10px] uppercase">{dayNombre}</span>
                                  <div className="flex gap-1 mt-2">
                                     <button onClick={() => handleDayAction(dayNombre, 'Inj')} className="bg-white border border-gray-300 px-3 py-0.5 text-[9px] font-black rounded hover:bg-gray-50 shadow-sm transition-all active:scale-95 uppercase">Inj</button>
                                     <button onClick={() => handleDayAction(dayNombre, 'Just')} className="bg-white border border-gray-300 px-3 py-0.5 text-[9px] font-black rounded hover:bg-gray-50 shadow-sm transition-all active:scale-95 uppercase">Just</button>
                                  </div>
                               </div>
                            </th>
                          );
                       })}
                    </tr>
                 </thead>
                 <tbody>
                    {uniqueSubjects.map((subject) => (
                      <tr key={subject} className="bg-[#f9f9f9] hover:bg-white transition-colors">
                         <td className="border border-gray-200 p-3 text-[10px] font-bold text-gray-500 uppercase bg-white">
                            {subject}
                         </td>
                         {activeDays.map((dayNombre) => {
                            const diaIndex = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].indexOf(dayNombre);
                            const targetDate = format(addDays(weekStart, diaIndex), 'yyyy-MM-dd');
                            
                            const session = studentSchedules?.find(s => s.dia === dayNombre && s.asignatura === subject);
                            
                            if (!session) return <td key={dayNombre} className="border border-gray-200 bg-gray-100/10"></td>;

                            const attendance = attendances?.find(a => a.claseId === session.id && a.fecha === targetDate);
                            const isInj = attendance?.tipo === 'I';
                            const isJust = attendance?.tipo === 'J';
                            const isFullDay = attendance?.isFullDay;

                            return (
                              <td key={dayNombre} className="border border-gray-200 p-2 align-middle h-20">
                                 {isInj && (
                                   <div className="flex items-center gap-1.5 animate-in zoom-in-95 duration-200">
                                      <span className="boton_rectangulo" data-type="I">Inj</span>
                                      <button 
                                       onClick={() => handleJustifyHour(session.id, targetDate)}
                                       className="bg-white border border-gray-300 px-2 py-0.5 text-[9px] font-bold rounded shadow-sm hover:bg-blue-50 text-gray-600 transition-all uppercase"
                                      >
                                        Just
                                      </button>
                                   </div>
                                 )}
                                 
                                 {isJust && (
                                   <div className={cn(
                                     "p-1.5 rounded border flex items-center justify-between gap-1.5 animate-in fade-in duration-300",
                                     isFullDay ? "bg-gray-100 border-gray-300" : "bg-green-50 border-green-200"
                                   )}>
                                      <span className={cn("text-[9px] font-bold uppercase", isFullDay ? "text-gray-600" : "text-green-700")}>
                                        {isFullDay ? 'Just Día' : 'Justificada'}
                                      </span>
                                      <CheckCircle2 className={cn("h-3 w-3", isFullDay ? "text-gray-400" : "text-green-600")} />
                                   </div>
                                 )}
                              </td>
                            );
                         })}
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </ScrollArea>

        <div className="bg-gray-50 border-t p-2 text-center">
           <p className="text-[9px] text-gray-400 italic">
             Para justificar faltas por el mismo motivo, utilice el botón superior.
           </p>
        </div>
      </div>
    </div>
  );
}
