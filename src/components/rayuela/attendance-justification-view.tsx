
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
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, writeBatch } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
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

  // 1. Obtener el horario del alumno
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

  // 3. Determinar qué días de la semana tienen clases
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

  const getDayFullStatus = (diaNombre: string) => {
    if (!studentSchedules || !attendances) return null;
    const diaIndex = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].indexOf(diaNombre);
    const targetDate = format(addDays(weekStart, diaIndex), 'yyyy-MM-dd');
    const daySessions = studentSchedules.filter(s => s.dia === diaNombre);
    
    if (daySessions.length === 0) return null;

    const dayAtts = attendances.filter(a => a.fecha === targetDate && daySessions.some(s => s.id === a.claseId));
    
    if (dayAtts.length < daySessions.length) return null;

    const allInj = dayAtts.every(a => a.tipo === 'I');
    const allJust = dayAtts.every(a => a.tipo === 'J');

    if (allInj) return 'I';
    if (allJust) return 'J';
    return null;
  };

  const handleDayAction = async (diaNombre: string, action: 'Inj' | 'Just') => {
    if (!db || !studentSchedules) return;
    
    const currentStatus = getDayFullStatus(diaNombre);
    const isAlreadyActive = (action === 'Inj' && currentStatus === 'I') || (action === 'Just' && currentStatus === 'J');
    
    const diaIndex = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].indexOf(diaNombre);
    const targetDate = format(addDays(weekStart, diaIndex), 'yyyy-MM-dd');
    const daySessions = studentSchedules.filter(s => s.dia === diaNombre);
    
    const batch = writeBatch(db);
    
    daySessions.forEach(session => {
      const attendanceId = `${alumno.id}_${session.id}_${targetDate}`;
      const docRef = doc(db, 'asistenciasInasistencias', attendanceId);
      
      if (isAlreadyActive) {
        // TOGGLE OFF: Eliminar registros para ese día
        batch.delete(docRef);
      } else {
        // TOGGLE ON o CHANGE: Sobrescribir
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
        }, { merge: true });
      }
    });

    await batch.commit();

    if (action === 'Inj' && !isAlreadyActive) {
      addDocumentNonBlocking(collection(db, 'mensajes'), {
        remitenteId: 'SISTEMA',
        destinatarioId: alumno.id,
        asunto: 'Aviso de Asistencia: Día Completo',
        cuerpo: 'Se ha registrado una falta de dia completo para tu persona',
        leido: false,
        eliminado: false,
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleJustifyHour = (claseId: string, fecha: string) => {
    if (!db) return;
    const attendanceId = `${alumno.id}_${claseId}_${fecha}`;
    const docRef = doc(db, 'asistenciasInasistencias', attendanceId);
    
    const batch = writeBatch(db);
    batch.set(docRef, {
      alumnoId: alumno.id,
      claseId,
      fecha,
      tipo: 'J',
      motivo: 'Justificada por Tutor',
      profesorId,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true });
    batch.commit();
  };

  if (loadingSchedule) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="animate-in fade-in duration-300 space-y-6 max-w-7xl mx-auto w-full font-verdana pb-20">
      {/* HEADER CARD ALUMNO */}
      <div className="bg-white p-6 rounded-xl border shadow-md flex flex-col md:flex-row items-center gap-6 relative">
         <button onClick={onClose} className="absolute top-4 right-4 text-gray-300 hover:text-red-600 transition-colors">
            <XCircle className="h-6 w-6" />
         </button>
         
         <Avatar className="h-24 w-24 border-2 border-white shadow-sm ring-2 ring-gray-100">
           <AvatarImage src={alumno?.imagenPerfil} />
           <AvatarFallback className="text-2xl font-bold text-gray-400 bg-gray-50">{alumno?.usuario?.substring(0,2).toUpperCase()}</AvatarFallback>
         </Avatar>
         
         <div className="flex-1 space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">{alumno?.nombrePersona || alumno?.usuario}</h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-bold text-blue-600 uppercase">
               <span className="hover:underline cursor-pointer flex items-center gap-1.5"><Phone className="h-3 w-3" /> Llamada</span>
               <span className="hover:underline cursor-pointer flex items-center gap-1.5"><FileText className="h-3 w-3" /> Carta</span>
               <span className="hover:underline cursor-pointer flex items-center gap-1.5"><Mail className="h-3 w-3" /> Mensaje</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] font-bold text-gray-500 uppercase pt-2">
               <div className="flex items-center gap-2">
                  <span>Desde:</span>
                  <div className="bg-gray-50 border rounded px-2 py-1 flex items-center gap-2">
                     {format(weekStart, 'dd/MM/yyyy')} <CalendarIcon className="h-3 w-3 text-gray-400" />
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <span>Hasta:</span>
                  <span className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">{format(weekEnd, 'dd/MM/yyyy')}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="flex items-center justify-between bg-white/50 p-2 rounded-lg border border-gray-100">
         <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, -7))} className="h-8 gap-2 text-[10px] font-bold uppercase shadow-sm"><ChevronLeft className="h-4 w-4" /> Sem. Ant.</Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 7))} className="h-8 gap-2 text-[10px] font-bold uppercase shadow-sm">Sem. Sig. <ChevronRight className="h-4 w-4" /></Button>
         </div>
         <Button className="bg-[#fb8500] hover:bg-[#e07600] text-white text-[10px] font-bold uppercase h-9 px-6 shadow-md rounded-full">Justificar por motivo</Button>
      </div>

      {/* TABLA DE ASISTENCIA SEMANAL */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse text-[10px]">
             <thead>
                <tr className="bg-gray-50/50">
                   <th className="border-b border-r p-4 w-48 bg-white"></th>
                   {activeDays.map((dayNombre) => {
                      const diaIndex = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].indexOf(dayNombre);
                      const date = addDays(weekStart, diaIndex);
                      const dayStatus = getDayFullStatus(dayNombre);

                      return (
                        <th key={dayNombre} className="border-b border-r p-0 min-w-[140px] last:border-r-0">
                           <div className="flex flex-col items-center py-4 space-y-3">
                              <div className="text-center">
                                 <span className="text-blue-500 font-bold block">{format(date, 'd MMM')}</span>
                                 <span className="text-blue-900 font-black uppercase tracking-tighter">{dayNombre}</span>
                              </div>
                              <div className="flex gap-2">
                                 <button 
                                  onClick={() => handleDayAction(dayNombre, 'Inj')} 
                                  className={cn(
                                    "border px-4 py-1.5 text-[10px] font-black rounded-md transition-all active:scale-95 uppercase shadow-sm",
                                    dayStatus === 'I' 
                                      ? "bg-[#e63946] text-white border-red-700" 
                                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                  )}
                                 >
                                   INJ
                                 </button>
                                 <button 
                                  onClick={() => handleDayAction(dayNombre, 'Just')} 
                                  className={cn(
                                    "border px-4 py-1.5 text-[10px] font-black rounded-md transition-all active:scale-95 uppercase shadow-sm",
                                    dayStatus === 'J' 
                                      ? "bg-[#78B64E] text-white border-green-700" 
                                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                  )}
                                 >
                                   JUST
                                 </button>
                              </div>
                           </div>
                        </th>
                      );
                   })}
                </tr>
             </thead>
             <tbody>
                {uniqueSubjects.map((subject) => (
                  <tr key={subject} className="hover:bg-gray-50/30 transition-colors">
                     <td className="border-b border-r p-4 text-[10px] font-bold text-gray-500 uppercase bg-gray-50/20">
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
                          <td key={dayNombre} className="border-b border-r last:border-r-0 p-3 align-middle h-16">
                             {isInj && (
                               <div className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
                                  <span className="boton_rectangulo scale-90" data-type="I">Inj</span>
                                  <button 
                                   onClick={() => handleJustifyHour(session.id, targetDate)}
                                   className="bg-white border border-gray-300 px-2 py-1 text-[9px] font-bold rounded shadow-sm hover:bg-blue-50 text-gray-600 transition-all uppercase"
                                  >
                                    Just
                                  </button>
                               </div>
                             )}
                             
                             {isJust && (
                               <div className="flex items-center gap-2 animate-in fade-in duration-300">
                                  <span className="boton_rectangulo scale-90" data-type="J">Just</span>
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

      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
         <p className="text-[10px] text-gray-400 italic">
           Pulsar sobre un botón de día completo activo para eliminar todas las faltas de esa jornada.
         </p>
      </div>
    </div>
  );
}
