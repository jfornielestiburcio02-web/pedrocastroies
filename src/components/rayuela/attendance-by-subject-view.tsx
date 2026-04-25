
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Loader2, 
  Search, 
  History, 
  ThumbsUp, 
  ThumbsDown, 
  Check, 
  Trash2,
  AlertCircle,
  X,
  CheckCircle2,
  Layout,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where 
} from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  deleteDocumentNonBlocking, 
  setDocumentNonBlocking, 
  updateDocumentNonBlocking 
} from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function AttendanceBySubjectView({ profesorId, manualScheduleId }: { profesorId: string, manualScheduleId?: string }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(manualScheduleId || null);
  const [historyAlumnoId, setHistoryAlumnoId] = useState<string | null>(null);
  const db = useFirestore();
  const { toast } = useToast();

  const dayOfWeek = useMemo(() => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[new Date(selectedDate).getDay()];
  }, [selectedDate]);

  // CARGA DE HORARIOS: Consulta simple para evitar fallos de índices
  const schedulesQuery = useMemoFirebase(() => {
    if (manualScheduleId || !db || !profesorId) return null;
    return query(
      collection(db, 'horarios'), 
      where('profesorId', '==', profesorId)
    );
  }, [db, profesorId, manualScheduleId]);

  const { data: rawSchedules, isLoading: loadingSchedules } = useCollection(schedulesQuery);
  
  const schedules = useMemo(() => {
    if (!rawSchedules) return [];
    // Filtramos por día en memoria para asegurar compatibilidad total
    return rawSchedules
      .filter(s => s.dia === dayOfWeek)
      .sort((a, b) => (a.horaInicio || "").localeCompare(b.horaInicio || ""));
  }, [rawSchedules, dayOfWeek]);

  const manualScheduleQuery = useMemoFirebase(() => {
    if (!manualScheduleId || !db) return null;
    return doc(db, 'horarios', manualScheduleId);
  }, [db, manualScheduleId]);

  const { data: manualScheduleData } = useDoc(manualScheduleQuery);

  const currentSchedule = useMemo(() => {
    if (manualScheduleId) return manualScheduleData;
    return schedules.find(s => s.id === selectedScheduleId);
  }, [schedules, selectedScheduleId, manualScheduleId, manualScheduleData]);

  // CONSULTA DE ASISTENCIAS: Filtrado en memoria para evitar índices compuestos
  const attendanceQuery = useMemoFirebase(() => {
    if (!db || !selectedScheduleId) return null;
    return query(
      collection(db, 'asistenciasInasistencias'),
      where('claseId', '==', selectedScheduleId)
    );
  }, [db, selectedScheduleId]);

  const { data: rawAttendances } = useCollection(attendanceQuery);
  const attendances = useMemo(() => rawAttendances?.filter(a => a.fecha === selectedDate), [rawAttendances, selectedDate]);

  // CONSULTA DE COMPORTAMIENTOS: Filtrado en memoria
  const behaviorQuery = useMemoFirebase(() => {
    if (!db || !selectedScheduleId) return null;
    return query(
      collection(db, 'comportamientos'),
      where('claseId', '==', selectedScheduleId)
    );
  }, [db, selectedScheduleId]);

  const { data: rawBehaviors } = useCollection(behaviorQuery);
  const behaviors = useMemo(() => rawBehaviors?.filter(b => b.fecha === selectedDate), [rawBehaviors, selectedDate]);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);

  const { data: allUsers } = useCollection(usersQuery);

  const students = useMemo(() => {
    if (!currentSchedule || !allUsers) return [];
    return allUsers.filter(u => currentSchedule.alumnosIds?.includes(u.id));
  }, [currentSchedule, allUsers]);

  const scheduleDeferredMessage = (alumnoId: string, attendanceId: string) => {
    if (!db || !currentSchedule) return;
    const profUser = allUsers?.find(u => u.id === profesorId);
    const profName = profUser?.nombrePersona || profUser?.usuario || profesorId;

    setTimeout(async () => {
      const docRef = doc(db, 'asistenciasInasistencias', attendanceId);
      const freshSnap = await getDoc(docRef);
      if (freshSnap.exists() && freshSnap.data().tipo === 'I') {
        setDocumentNonBlocking(doc(collection(db, 'mensajes')), {
          remitenteId: 'SISTEMA',
          destinatarioId: alumnoId,
          asunto: 'Aviso de Falta de Asistencia',
          cuerpo: `Se ha registrado una nueva falta de asistencia a las ${currentSchedule.horaInicio}\n\nGrupo: ${currentSchedule.asignatura}\nProfesor: ${profName}`,
          leido: false,
          eliminado: false,
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
    }, 15000);
  };

  const handleCycleAttendance = (alumnoId: string) => {
    if (!db || !selectedScheduleId) return;
    const attendanceId = `${alumnoId}_${selectedScheduleId}_${selectedDate}`;
    const docRef = doc(db, 'asistenciasInasistencias', attendanceId);
    const existing = attendances?.find(a => a.id === attendanceId);
    const currentStatus = existing?.tipo || 'A';
    
    let nextStatus = 'A';
    if (currentStatus === 'A' || currentStatus === '') nextStatus = 'I';
    else if (currentStatus === 'I') nextStatus = 'R';
    else if (currentStatus === 'R') nextStatus = 'A';

    if (nextStatus === 'A') {
      if (existing?.motivo) updateDocumentNonBlocking(docRef, { tipo: '' });
      else if (existing) deleteDocumentNonBlocking(docRef);
      return;
    }

    setDocumentNonBlocking(docRef, {
      alumnoId,
      claseId: selectedScheduleId,
      grupoId: currentSchedule?.grupoId || "",
      fecha: selectedDate,
      tipo: nextStatus,
      profesorId, 
      createdAt: existing?.createdAt || new Date().toISOString()
    }, { merge: true });
    
    if (nextStatus === 'I') scheduleDeferredMessage(alumnoId, attendanceId);
  };

  const handleToggleBehavior = (alumnoId: string, tipo: 'Positivo' | 'Negativo') => {
    if (!db || !selectedScheduleId) return;
    const behaviorId = `${alumnoId}_${selectedScheduleId}_${selectedDate}_behavior`;
    const docRef = doc(db, 'comportamientos', behaviorId);
    const existing = behaviors?.find(b => b.id === behaviorId);
    if (existing && existing.tipo === tipo) {
      deleteDocumentNonBlocking(docRef);
      return;
    }
    setDocumentNonBlocking(docRef, {
      alumnoId,
      claseId: selectedScheduleId,
      grupoId: currentSchedule?.grupoId || "",
      fecha: selectedDate,
      tipo: tipo,
      profesorId, 
      createdAt: new Date().toISOString()
    }, { merge: true });
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-7xl mx-auto w-full font-verdana">
      <div className="bg-[#f2f2f2] border p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm rounded-lg">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {!manualScheduleId && (
            <div className="flex items-center gap-2">
              <Label className="text-[11px] font-bold text-gray-600 uppercase">Fecha:</Label>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedScheduleId(null); }}
                className="h-8 border-gray-300 w-[150px] text-[11px] font-bold"
              />
            </div>
          )}

          <div className="flex items-center gap-2 min-w-[300px]">
            <Label className="text-[11px] font-bold text-gray-600 uppercase">Sesión:</Label>
            {loadingSchedules ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#89a54e]" />
            ) : manualScheduleId ? (
              <div className="h-8 flex items-center px-3 border border-gray-300 rounded-md bg-white text-[11px] font-bold w-full uppercase">
                {manualScheduleData?.horaInicio}-{manualScheduleData?.horaFin} | {manualScheduleData?.asignatura}
              </div>
            ) : (
              <Select onValueChange={setSelectedScheduleId} value={selectedScheduleId || ""}>
                <SelectTrigger className="h-8 border-gray-300 text-[11px] font-bold">
                  <SelectValue placeholder={schedules.length > 0 ? "Seleccione sesión..." : "Sin horario este día"} />
                </SelectTrigger>
                <SelectContent>
                  {schedules.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-[11px] font-bold uppercase">
                      {s.horaInicio}-{s.horaFin} | {s.asignatura}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="flex gap-4">
           <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#EB8A5F] rounded-sm"></div><span className="text-[10px] font-bold text-gray-500 uppercase">Falta</span></div>
           <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#FFCD2D] rounded-sm"></div><span className="text-[10px] font-bold text-gray-500 uppercase">Retraso</span></div>
           <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-[#78B64E] rounded-sm"></div><span className="text-[10px] font-bold text-gray-500 uppercase">Justificada</span></div>
        </div>
      </div>

      {selectedScheduleId && (
        <div className="bg-blue-50 border border-blue-100 p-2 px-4 rounded-full w-fit flex items-center gap-2 animate-pulse">
           <UserCheck className="h-3.5 w-3.5 text-blue-600" />
           <span className="text-[9px] font-bold text-blue-800 uppercase tracking-widest">
             Registros vinculados al profesor: {profesorId}
           </span>
        </div>
      )}

      {!selectedScheduleId ? (
        <div className="py-20 text-center opacity-30 flex flex-col items-center">
          <Search className="h-12 w-12 mb-4" />
          <p className="italic text-sm">Seleccione una sesión para pasar lista.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center animate-in zoom-in-95 duration-300">
           {students.map(student => {
             const attendanceId = `${student.id}_${selectedScheduleId}_${selectedDate}`;
             const studentAttendance = attendances?.find(a => a.id === attendanceId);
             const currentStatus = studentAttendance?.tipo || 'A';
             const behaviorId = `${student.id}_${selectedScheduleId}_${selectedDate}_behavior`;
             const studentBehavior = behaviors?.find(b => b.id === behaviorId);
             
             return (
               <div key={student.id} className="itemAlumnoEnClase relative group pt-3">
                  <Avatar className="imagenAlumnoEnClase" onClick={() => setHistoryAlumnoId(student.id)}>
                    <AvatarImage src={student.imagenPerfil} />
                    <AvatarFallback>{student.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="nombreAlumno px-2 mt-2">{student.nombrePersona || student.usuario}</div>
                  <div className="w-full px-2 mt-1">
                    <button onClick={() => currentStatus !== 'J' && handleCycleAttendance(student.id)} data-state={currentStatus || 'A'} className="botonFalta h-8 font-bold">
                      {currentStatus === 'I' ? 'Injustif.' : currentStatus === 'R' ? 'Retraso' : currentStatus === 'J' ? 'Justif.' : 'Asiste'}
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-4 mt-2">
                     <button onClick={() => handleToggleBehavior(student.id, 'Positivo')} className={cn("transition-transform hover:scale-110", studentBehavior?.tipo === 'Positivo' ? "text-green-600 scale-125" : "text-gray-300")}><ThumbsUp className="h-5 w-5" /></button>
                     <button onClick={() => handleToggleBehavior(student.id, 'Negativo')} className={cn("transition-transform hover:scale-110", studentBehavior?.tipo === 'Negativo' ? "text-red-600 scale-125" : "text-gray-300")}><ThumbsDown className="h-5 w-5" /></button>
                  </div>
               </div>
             );
           })}
        </div>
      )}
    </div>
  );
}
