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
  Layout
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
  where, 
  orderBy 
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
  const [viewingReason, setViewingReason] = useState<{name: string, reason: string, alumnoId: string} | null>(null);
  const db = useFirestore();
  const { toast } = useToast();

  const dayOfWeek = useMemo(() => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[new Date(selectedDate).getDay()];
  }, [selectedDate]);

  const schedulesQuery = useMemoFirebase(() => {
    if (manualScheduleId || !db || !profesorId) return null;
    return query(
      collection(db, 'horarios'), 
      where('profesorId', '==', profesorId), 
      where('dia', '==', dayOfWeek)
    );
  }, [db, profesorId, dayOfWeek, manualScheduleId]);

  const { data: fetchedSchedules, isLoading: loadingSchedules } = useCollection(schedulesQuery);
  
  const manualScheduleQuery = useMemoFirebase(() => {
    if (!manualScheduleId || !db) return null;
    return doc(db, 'horarios', manualScheduleId);
  }, [db, manualScheduleId]);

  const { data: manualScheduleData } = useDoc(manualScheduleQuery);

  const schedules = manualScheduleId && manualScheduleData ? [manualScheduleData] : fetchedSchedules;
  const currentSchedule = useMemo(() => schedules?.find(s => s.id === selectedScheduleId), [schedules, selectedScheduleId]);

  // Fetch the linked group to see if it's course-based
  const groupDocRef = useMemoFirebase(() => {
    if (!db || !currentSchedule?.grupoId) return null;
    return doc(db, 'gruposAlumnos', currentSchedule.grupoId);
  }, [db, currentSchedule?.grupoId]);

  const { data: groupData } = useDoc(groupDocRef);

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
    
    // RESOLUCIÓN DINÁMICA: Si el grupo está vinculado a un curso, usamos el curso.
    if (groupData?.cursoVinculado) {
       return allUsers.filter(u => u.cursoAlumno === groupData.cursoVinculado && u.rolesUsuario?.includes('EsAlumno'));
    }
    
    // Fallback: Lista estática de IDs si no hay curso vinculado
    return allUsers.filter(u => currentSchedule.alumnosIds?.includes(u.id));
  }, [currentSchedule, allUsers, groupData]);

  // Lógica de envío de mensaje diferido (15 segundos) con ID determinista
  const scheduleDeferredMessage = (alumnoId: string, attendanceId: string) => {
    if (!db || !currentSchedule) return;

    const profUser = allUsers?.find(u => u.id === profesorId);
    const profName = profUser?.nombrePersona || profUser?.usuario || profesorId;

    setTimeout(async () => {
      const docRef = doc(db, 'asistenciasInasistencias', attendanceId);
      const freshSnap = await getDoc(docRef);
      
      if (freshSnap.exists() && freshSnap.data().tipo === 'I') {
        // La falta sigue siendo Injustificada tras 15s, enviamos mensaje
        setDocumentNonBlocking(doc(collection(db, 'mensajes')), {
          remitenteId: 'SISTEMA',
          destinatarioId: alumnoId,
          asunto: 'Aviso de Falta de Asistencia',
          cuerpo: `Se ha registrado una nueva falta de asistencia a las ${currentSchedule.horaInicio}\n\nGrupo del horario de ${currentSchedule.asignatura}\nProfesor: ${profName}`,
          leido: false,
          eliminado: false,
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
    }, 15000);
  };

  const handleCycleAttendance = (alumnoId: string) => {
    if (!db || !selectedScheduleId) return;

    // ID DETERMINISTA: alumno_clase_fecha (Evita duplicados)
    const attendanceId = `${alumnoId}_${selectedScheduleId}_${selectedDate}`;
    const docRef = doc(db, 'asistenciasInasistencias', attendanceId);
    
    const existing = attendances?.find(a => a.id === attendanceId);
    const currentStatus = existing?.tipo || 'A';
    
    let nextStatus = 'A';
    if (currentStatus === 'A' || currentStatus === '') nextStatus = 'I';
    else if (currentStatus === 'I') nextStatus = 'R';
    else if (currentStatus === 'R') nextStatus = 'A';

    if (nextStatus === 'A') {
      if (existing?.motivo) {
        updateDocumentNonBlocking(docRef, { tipo: '' });
      } else if (existing) {
        deleteDocumentNonBlocking(docRef);
      }
      return;
    }

    const attendanceData = {
      alumnoId,
      claseId: selectedScheduleId,
      grupoId: currentSchedule?.grupoId || "",
      fecha: selectedDate,
      tipo: nextStatus,
      profesorId,
      createdAt: existing?.createdAt || new Date().toISOString()
    };

    setDocumentNonBlocking(docRef, attendanceData, { merge: true });
    
    if (nextStatus === 'I') {
      scheduleDeferredMessage(alumnoId, attendanceId);
    }
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

    const behaviorData = {
      alumnoId,
      claseId: selectedScheduleId,
      grupoId: currentSchedule?.grupoId || "",
      fecha: selectedDate,
      tipo: tipo,
      profesorId,
      createdAt: new Date().toISOString()
    };

    setDocumentNonBlocking(docRef, behaviorData, { merge: true });
  };

  const handleJustifyAbsence = () => {
    if (!db || !viewingReason || !selectedScheduleId) return;
    const attendanceId = `${viewingReason.alumnoId}_${selectedScheduleId}_${selectedDate}`;
    const docRef = doc(db, 'asistenciasInasistencias', attendanceId);
    
    updateDocumentNonBlocking(docRef, {
      tipo: 'J',
      justifiedAt: new Date().toISOString()
    });
    
    toast({ title: "Falta Justificada", description: "Se ha validado el motivo del alumno." });
    setViewingReason(null);
  };

  const getStatusText = (status: string) => {
    if (status === 'A' || status === '') return 'Asiste';
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

        {groupData?.cursoVinculado && (
          <div className="bg-white px-3 py-1 border rounded flex items-center gap-2">
             <CheckCircle2 className="h-3 w-3 text-green-600" />
             <span className="text-[10px] font-bold text-green-600 uppercase tracking-tight">Censo del curso: {groupData.cursoVinculado}</span>
          </div>
        )}

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
             const attendanceId = `${student.id}_${selectedScheduleId}_${selectedDate}`;
             const studentAttendance = attendances?.find(a => a.id === attendanceId);
             const currentStatus = studentAttendance?.tipo || 'A';
             
             const behaviorId = `${student.id}_${selectedScheduleId}_${selectedDate}_behavior`;
             const studentBehavior = behaviors?.find(b => b.id === behaviorId);
             
             const behaviorDisabled = currentStatus === 'I' || currentStatus === 'J';
             const hasJustification = !!studentAttendance?.motivo;

             return (
               <div key={student.id} className="itemAlumnoEnClase relative group flex flex-col items-center pt-3 h-[210px]">
                  <div className="relative">
                    <Avatar className="imagenAlumnoEnClase" onClick={() => setHistoryAlumnoId(student.id)}>
                      <AvatarImage src={student.imagenPerfil} />
                      <AvatarFallback>{student.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    {hasJustification && (
                      <button 
                        onClick={() => setViewingReason({ name: student.nombrePersona || student.usuario, reason: studentAttendance.motivo, alumnoId: student.id })}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full h-6 w-6 border-2 border-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform animate-pulse"
                      >
                        <AlertCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="nombreAlumno px-2 mt-2" onClick={() => setHistoryAlumnoId(student.id)}>
                    {student.nombrePersona || student.usuario}
                  </div>

                  <div className="w-full px-2 mt-1">
                    <button 
                      onClick={() => currentStatus !== 'J' && handleCycleAttendance(student.id)}
                      data-state={currentStatus || 'A'}
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
          grupoId={currentSchedule?.grupoId}
          onClose={() => setHistoryAlumnoId(null)} 
        />
      )}

      <Dialog open={!!viewingReason} onOpenChange={() => setViewingReason(null)}>
        <DialogContent className="max-w-sm font-verdana p-0 border-none overflow-hidden">
          <DialogHeader className="bg-red-600 p-4 text-white text-center">
             <DialogTitle className="text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
               <AlertCircle className="h-4 w-4" /> Notificación del Alumno
             </DialogTitle>
          </DialogHeader>
          <div className="p-6 bg-white space-y-4">
             <div className="space-y-1 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Alumno</span>
                <p className="text-sm font-bold text-gray-800 uppercase">{viewingReason?.name}</p>
             </div>
             <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Motivo enviado:</span>
                <p className="text-xs font-medium text-gray-600 italic leading-relaxed">
                  "{viewingReason?.reason}"
                </p>
             </div>
          </div>
          <DialogFooter className="bg-gray-50 p-3 border-t flex gap-2">
             <Button 
              onClick={handleJustifyAbsence} 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase h-8 shadow-sm gap-2"
             >
               <CheckCircle2 className="h-3 w-3" /> Validar y Justificar
             </Button>
             <Button variant="outline" onClick={() => setViewingReason(null)} className="flex-1 text-[10px] font-bold uppercase h-8">Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AttendanceHistoryDialog({ alumnoId, claseId, grupoId, onClose }: { alumnoId: string, claseId: string, grupoId?: string, onClose: () => void }) {
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
    if (grupoId) {
      return query(
        collection(db, 'asistenciasInasistencias'),
        where('alumnoId', '==', alumnoId),
        where('grupoId', '==', grupoId),
        orderBy('fecha', 'desc')
      );
    }
    return query(
      collection(db, 'asistenciasInasistencias'),
      where('alumnoId', '==', alumnoId),
      where('claseId', '==', claseId),
      orderBy('fecha', 'desc')
    );
  }, [db, alumnoId, claseId, grupoId]);

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
            Alumno: {alumnoName} {grupoId ? "(Seguimiento por Grupo)" : ""}
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
                      item.tipo === 'J' ? "bg-[#78B64E] text-white" :
                      "bg-blue-50 text-blue-600"
                    )}>
                      {item.tipo === 'I' ? 'INJUSTIFICADA' : item.tipo === 'R' ? 'RETRASO' : item.tipo === 'J' ? 'JUSTIFICADA' : 'NOTIFICADA'}
                    </Badge>
                  </div>

                  {item.motivo && (
                    <div className="p-2 bg-white rounded border border-gray-100 text-[10px] italic text-gray-600">
                      <strong>Motivo:</strong> {item.motivo}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1 border-t border-gray-200/50">
                    {item.tipo !== 'J' && justifyingId !== item.id && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setJustifyingId(item.id)}
                        className="h-7 w-7 text-[#008D88] hover:bg-[#008D88]/10"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(item.id)}
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
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
              No constan registros para este alumno en este historial.
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
