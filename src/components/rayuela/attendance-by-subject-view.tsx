
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
  UserCheck,
  Calendar,
  Clock,
  Bell
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
import { ScrollArea } from '@/components/ui/scroll-area';
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

  // CARGA DE HORARIOS
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

  // CONSULTA DE ASISTENCIAS
  const attendanceQuery = useMemoFirebase(() => {
    if (!db || !selectedScheduleId) return null;
    return query(
      collection(db, 'asistenciasInasistencias'),
      where('claseId', '==', selectedScheduleId)
    );
  }, [db, selectedScheduleId]);

  const { data: rawAttendances } = useCollection(attendanceQuery);
  const attendances = useMemo(() => rawAttendances?.filter(a => a.fecha === selectedDate), [rawAttendances, selectedDate]);

  // CONSULTA DE COMPORTAMIENTOS
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

  const handleCycleAttendance = (alumnoId: string) => {
    if (!db || !selectedScheduleId) return;
    const attendanceId = `${alumnoId}_${selectedScheduleId}_${selectedDate}`;
    const docRef = doc(db, 'asistenciasInasistencias', attendanceId);
    const existing = attendances?.find(a => a.id === attendanceId);
    
    // Ciclo: A (Nada/Aviso) -> I (Injustificada) -> R (Retraso) -> J (Justificada) -> A (Presente)
    const currentStatus = existing?.tipo || 'A';
    let nextStatus = 'A';

    if (currentStatus === 'A' || currentStatus === '') nextStatus = 'I';
    else if (currentStatus === 'I') nextStatus = 'R';
    else if (currentStatus === 'R') nextStatus = 'J';
    else if (currentStatus === 'J') nextStatus = 'A';

    if (nextStatus === 'A') {
      // Si el profesor vuelve a Presente, limpiamos el tipo. 
      // Si habia un motivo previo del alumno (notificación), lo dejamos como aviso (tipo '')
      if (existing?.motivo) {
        updateDocumentNonBlocking(docRef, { tipo: '' });
      } else {
        deleteDocumentNonBlocking(docRef);
      }
      return;
    }

    setDocumentNonBlocking(docRef, {
      alumnoId,
      claseId: selectedScheduleId,
      grupoId: currentSchedule?.grupoId || "",
      fecha: selectedDate,
      tipo: nextStatus,
      profesorId, 
      createdAt: existing?.createdAt || new Date().toISOString(),
      motivo: existing?.motivo || ""
    }, { merge: true });
  };

  const handleToggleBehavior = (alumnoId: string, tipo: 'Positivo' | 'Negativo') => {
    if (!db || !selectedScheduleId) return;
    
    const attendanceId = `${alumnoId}_${selectedScheduleId}_${selectedDate}`;
    const attendance = attendances?.find(a => a.id === attendanceId);
    
    // Bloquear si el alumno está marcado como ausente
    if (attendance?.tipo === 'I' || attendance?.tipo === 'J') {
      toast({ 
        variant: "destructive", 
        title: "Operación no permitida", 
        description: "El alumno está marcado como ausente." 
      });
      return;
    }

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
             Sesión conectada con Rayuela - Profesor ID: {profesorId}
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
             
             // Lógica visual del bultito rojo de notificación (Aviso del alumno)
             const hasNotification = studentAttendance?.tipo === '' && !!studentAttendance?.motivo;
             
             const currentStatus = studentAttendance?.tipo || 'A';
             const isAbsent = currentStatus === 'I' || currentStatus === 'J';
             
             const behaviorId = `${student.id}_${selectedScheduleId}_${selectedDate}_behavior`;
             const studentBehavior = behaviors?.find(b => b.id === behaviorId);
             
             return (
               <div key={student.id} className="itemAlumnoEnClase relative group pt-3">
                  {/* BULTITO ROJO DE NOTIFICACIÓN */}
                  {hasNotification && (
                    <div className="absolute -top-1 -right-1 z-20">
                      <div className="bg-red-600 text-white rounded-full p-1.5 shadow-lg animate-bounce border-2 border-white">
                        <Bell className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  )}

                  <Avatar className="imagenAlumnoEnClase relative" onClick={() => setHistoryAlumnoId(student.id)}>
                    <AvatarImage src={student.imagenPerfil} />
                    <AvatarFallback>{student.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                       <History className="h-6 w-6 text-white" />
                    </div>
                  </Avatar>
                  
                  <div className="nombreAlumno px-2 mt-2">{student.nombrePersona || student.usuario}</div>
                  
                  <div className="w-full px-2 mt-1">
                    <button 
                      onClick={() => handleCycleAttendance(student.id)} 
                      data-state={currentStatus || 'A'} 
                      className={cn(
                        "botonFalta h-8 font-bold relative transition-all",
                        hasNotification && currentStatus === '' && "border-red-500 text-red-700 bg-red-50"
                      )}
                    >
                      {currentStatus === 'I' ? 'Injustif.' : 
                       currentStatus === 'R' ? 'Retraso' : 
                       currentStatus === 'J' ? 'Justif.' : 
                       hasNotification ? 'Aviso' : 'Asiste'}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-4 mt-2">
                     <button 
                      onClick={() => handleToggleBehavior(student.id, 'Positivo')} 
                      disabled={isAbsent}
                      className={cn(
                        "transition-all", 
                        studentBehavior?.tipo === 'Positivo' ? "text-green-600 scale-125" : "text-gray-300 hover:text-green-400",
                        isAbsent && "opacity-20 cursor-not-allowed"
                      )}
                     >
                       <ThumbsUp className="h-5 w-5" />
                     </button>
                     <button 
                      onClick={() => handleToggleBehavior(student.id, 'Negativo')} 
                      disabled={isAbsent}
                      className={cn(
                        "transition-all", 
                        studentBehavior?.tipo === 'Negativo' ? "text-red-600 scale-125" : "text-gray-300 hover:text-red-400",
                        isAbsent && "opacity-20 cursor-not-allowed"
                      )}
                     >
                       <ThumbsDown className="h-5 w-5" />
                     </button>
                  </div>
               </div>
             );
           })}
        </div>
      )}

      {historyAlumnoId && (
        <StudentHistoryDialog 
          alumnoId={historyAlumnoId} 
          onClose={() => setHistoryAlumnoId(null)} 
          claseId={selectedScheduleId!}
        />
      )}
    </div>
  );
}

function StudentHistoryDialog({ alumnoId, onClose, claseId }: { alumnoId: string, onClose: () => void, claseId: string }) {
  const db = useFirestore();
  const [alumno, setAlumno] = useState<any>(null);

  useEffect(() => {
    if (db && alumnoId) {
      getDoc(doc(db, 'usuarios', alumnoId)).then(s => s.exists() && setAlumno(s.data()));
    }
  }, [db, alumnoId]);

  const historyQuery = useMemoFirebase(() => {
    if (!db || !alumnoId || !claseId) return null;
    return query(
      collection(db, 'asistenciasInasistencias'),
      where('alumnoId', '==', alumnoId),
      where('claseId', '==', claseId)
    );
  }, [db, alumnoId, claseId]);

  const { data: rawHistory, isLoading } = useCollection(historyQuery);
  
  const history = useMemo(() => {
    return (rawHistory || [])
      .filter(h => h.tipo !== '') // Solo mostramos faltas reales en el historial rápido
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [rawHistory]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-xl font-verdana p-0 border-none overflow-hidden">
        <DialogHeader className="bg-[#89a54e] p-6 text-white shrink-0">
           <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                 <AvatarImage src={alumno?.imagenPerfil} />
                 <AvatarFallback>{alumno?.usuario?.substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                 <DialogTitle className="text-sm font-bold uppercase tracking-widest">Historial de Asistencia</DialogTitle>
                 <DialogDescription className="text-white/80 text-[10px] font-bold uppercase">
                   {alumno?.nombrePersona || alumno?.usuario} - Materia Actual
                 </DialogDescription>
              </div>
           </div>
        </DialogHeader>

        <div className="p-0 bg-white">
           <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#89a54e]" /></div>
              ) : history.length === 0 ? (
                <div className="py-20 text-center text-gray-400 italic text-sm">No constan faltas ni retrasos previos en esta materia.</div>
              ) : (
                <div className="flex flex-col">
                   {history.map((record) => (
                     <div key={record.id} className="p-4 border-b flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col gap-0.5">
                           <div className="flex items-center gap-2">
                             <Calendar className="h-3 w-3 text-gray-400" />
                             <span className="text-xs font-bold text-gray-700">{format(new Date(record.fecha), 'dd/MM/yyyy')}</span>
                           </div>
                           <span className="text-[10px] text-gray-400 uppercase font-medium ml-5">{format(new Date(record.fecha), 'EEEE', { locale: es })}</span>
                        </div>
                        
                        <div className="flex items-center gap-6">
                           {record.motivo && (
                             <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[9px] font-bold uppercase max-w-[150px] truncate">
                               <AlertCircle className="h-3 w-3" /> {record.motivo}
                             </div>
                           )}
                           <Badge className={cn(
                             "text-[9px] font-bold border-none px-3 py-1 uppercase",
                             record.tipo === 'I' ? "bg-orange-100 text-orange-700" :
                             record.tipo === 'R' ? "bg-yellow-100 text-yellow-700" :
                             record.tipo === 'J' ? "bg-green-100 text-green-700" :
                             "bg-blue-50 text-blue-600"
                           )}>
                             {record.tipo === 'I' ? 'Falta' : record.tipo === 'R' ? 'Retraso' : record.tipo === 'J' ? 'Justificada' : 'Notificada'}
                           </Badge>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </ScrollArea>
        </div>

        <DialogFooter className="bg-gray-50 p-4 border-t">
           <Button onClick={onClose} className="w-full bg-gray-800 hover:bg-black text-white text-[11px] font-bold uppercase h-10 shadow-md">Cerrar Historial</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
