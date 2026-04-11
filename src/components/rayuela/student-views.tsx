
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { 
  Loader2, 
  Calendar, 
  Clock, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle2, 
  ThumbsUp, 
  ThumbsDown,
  GraduationCap,
  ClipboardList,
  FileText,
  Lock,
  MessageSquare,
  ShieldAlert,
  Pencil,
  Trash2,
  Send,
  Check,
  Search
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, getDocs } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

/**
 * Vista de Faltas para el Alumno
 */
export function StudentAttendanceView({ studentId, onlyUnjustified = false }: { studentId: string, onlyUnjustified?: boolean }) {
  const db = useFirestore();
  const { toast } = useToast();
  
  // Estado para el listado (Mis Faltas)
  const [justifyingId, setJustifyingId] = useState<string | null>(null);
  const [tempMotivo, setMotivo] = useState("");

  // Estado para el formulario proactivo (Justificar)
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    titulo: '',
    descripcion: '',
    sesionesSeleccionadas: [] as string[]
  });

  const dayOfWeek = useMemo(() => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[new Date(formData.fecha).getDay()];
  }, [formData.fecha]);

  // Queries para Mis Faltas
  const attendanceQuery = useMemoFirebase(() => {
    if (!db || !studentId) return null;
    return query(
      collection(db, 'asistenciasInasistencias'),
      where('alumnoId', '==', studentId),
      orderBy('fecha', 'desc')
    );
  }, [db, studentId]);

  const { data: rawAttendances, isLoading: loadingAttendance } = useCollection(attendanceQuery);

  // Queries para Justificar (Horario del día seleccionado)
  const schedulesQuery = useMemoFirebase(() => {
    if (!db || !studentId) return null;
    return query(
      collection(db, 'horarios'),
      where('alumnosIds', 'array-contains', studentId),
      where('dia', '==', dayOfWeek)
    );
  }, [db, studentId, dayOfWeek]);

  const { data: daySchedules, isLoading: loadingSchedules } = useCollection(schedulesQuery);

  const attendances = useMemo(() => {
    if (!rawAttendances) return [];
    if (onlyUnjustified) return []; // No se usa en modo proactivo
    return rawAttendances;
  }, [rawAttendances, onlyUnjustified]);

  const allSchedulesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'horarios');
  }, [db]);
  const { data: allSchedules } = useCollection(allSchedulesQuery);

  const getAsignatura = (claseId: string) => {
    const s = allSchedules?.find(sch => sch.id === claseId);
    return s?.asignatura || "Materia";
  };

  const handleOpenJustify = (att: any) => {
    setJustifyingId(att.id);
    setMotivo(att.motivo || "");
  };

  const handleSaveJustification = () => {
    if (!db || !justifyingId) return;
    const docRef = doc(db, 'asistenciasInasistencias', justifyingId);
    updateDocumentNonBlocking(docRef, { motivo: tempMotivo });
    toast({ title: "Justificación enviada", description: "El profesor recibirá una notificación del motivo." });
    setJustifyingId(null);
  };

  const handleDeleteJustification = (id: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'asistenciasInasistencias', id), { motivo: "" });
    toast({ title: "Justificación eliminada", description: "Se ha borrado el motivo del registro." });
  };

  const handleProactiveSave = async () => {
    if (!db || !formData.fecha || !formData.descripcion || formData.sesionesSeleccionadas.length === 0) {
      toast({ variant: "destructive", title: "Formulario incompleto", description: "Debe indicar el motivo y seleccionar al menos una clase." });
      return;
    }

    // Para cada sesión seleccionada, crear o actualizar el registro de asistencia
    // IMPORTANTE: Se queda como 'I' (Injustificada) hasta que el profe la valide
    formData.sesionesSeleccionadas.forEach(claseId => {
      const schedule = daySchedules?.find(s => s.id === claseId);
      const gradeId = `${studentId}_${claseId}_${formData.fecha}`; // ID determinista para evitar duplicados
      const docRef = doc(db, 'asistenciasInasistencias', gradeId);

      setDocumentNonBlocking(docRef, {
        alumnoId: studentId,
        claseId: claseId,
        fecha: formData.fecha,
        tipo: 'I', // Se mantiene como Injustificada para que el profe la vea y decida
        motivo: `${formData.titulo ? formData.titulo + ': ' : ''}${formData.descripcion}`,
        profesorId: schedule?.profesorId || 'SISTEMA',
        createdAt: new Date().toISOString()
      }, { merge: true });
    });

    toast({ 
      title: "Notificaciones Enviadas", 
      description: `Se ha avisado a los profesores de las ${formData.sesionesSeleccionadas.length} sesiones. El docente deberá validar la falta.` 
    });

    setFormData({ ...formData, titulo: '', descripcion: '', sesionesSeleccionadas: [] });
  };

  const toggleSession = (id: string) => {
    setFormData(prev => ({
      ...prev,
      sesionesSeleccionadas: prev.sesionesSeleccionadas.includes(id)
        ? prev.sesionesSeleccionadas.filter(s => s !== id)
        : [...prev.sesionesSeleccionadas, id]
    }));
  };

  if (loadingAttendance) {
    return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" /></div>;
  }

  // MODO JUSTIFICAR (PROACTIVO)
  if (onlyUnjustified) {
    return (
      <div className="animate-in fade-in duration-500 space-y-6 max-w-4xl mx-auto w-full">
        <div className="bg-white border rounded-xl shadow-lg overflow-hidden">
          <div className="bg-[#fb8500] p-6 text-white flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg"><Send className="h-6 w-6" /></div>
            <div>
              <h2 className="text-lg font-bold uppercase tracking-tight">Formulario de Justificación Oficial</h2>
              <p className="text-white/80 text-[10px] font-bold uppercase">Notifique sus ausencias al centro educativo</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase">1. Seleccione la fecha de la ausencia</Label>
                  <Input 
                    type="date" 
                    value={formData.fecha} 
                    onChange={(e) => setFormData({...formData, fecha: e.target.value, sesionesSeleccionadas: []})}
                    className="h-12 border-gray-300 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase">2. Título / Asunto (Opcional)</Label>
                  <Input 
                    placeholder="Ej: Cita Médica, Trámite DNI..." 
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    className="border-gray-300 h-10 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase">3. Descripción del motivo</Label>
                  <Textarea 
                    placeholder="Detalle brevemente el motivo de su falta..." 
                    className="min-h-[120px] border-gray-300 resize-none text-sm"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold text-gray-400 uppercase flex justify-between">
                  <span>4. Seleccione las sesiones afectadas</span>
                  <span className="text-primary">{formData.sesionesSeleccionadas.length} seleccionadas</span>
                </Label>
                
                <div className="bg-gray-50 border rounded-xl p-4 min-h-[300px]">
                  {loadingSchedules ? (
                    <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-gray-300" /></div>
                  ) : !daySchedules || daySchedules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-2 opacity-40">
                       <Calendar className="h-8 w-8 text-gray-400" />
                       <p className="text-xs italic">No tiene clases asignadas para el día {format(new Date(formData.fecha), 'eeee d', { locale: es })}</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[300px] pr-2">
                      <div className="space-y-2">
                        {daySchedules.sort((a,b) => a.horaInicio.localeCompare(b.horaInicio)).map(session => (
                          <div 
                            key={session.id} 
                            onClick={() => toggleSession(session.id)}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                              formData.sesionesSeleccionadas.includes(session.id)
                                ? "bg-white border-[#fb8500] shadow-sm"
                                : "bg-transparent border-transparent hover:bg-white hover:border-gray-200"
                            )}
                          >
                            <div className="flex items-center gap-3">
                               <Checkbox checked={formData.sesionesSeleccionadas.includes(session.id)} onCheckedChange={() => {}} />
                               <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase">{session.horaInicio} - {session.horaFin}</span>
                                  <span className="text-xs font-bold text-gray-700 uppercase">{session.asignatura}</span>
                               </div>
                            </div>
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              formData.sesionesSeleccionadas.includes(session.id) ? "bg-[#fb8500]" : "bg-gray-200"
                            )}></div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 italic text-center">Los profesores recibirán una notificación de su ausencia.</p>
              </div>
            </div>

            <div className="pt-8 border-t flex items-center justify-between">
               <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center gap-3 max-w-md">
                  <ShieldAlert className="h-5 w-5 text-blue-600 shrink-0" />
                  <p className="text-[10px] text-blue-800 font-bold leading-relaxed uppercase">
                    Esta notificación no justifica automáticamente la falta. El profesorado deberá validar el motivo para cambiar el estado a "Justificada".
                  </p>
               </div>
               <Button 
                onClick={handleProactiveSave}
                className="bg-[#fb8500] hover:bg-[#e07600] text-white px-10 h-12 text-[11px] font-bold uppercase tracking-widest gap-2 shadow-lg"
               >
                 <Send className="h-4 w-4" /> Enviar Notificación
               </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MODO MIS FALTAS (LISTADO)
  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-4xl mx-auto w-full">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#89a54e] p-4 text-white flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h2 className="font-bold text-sm uppercase tracking-tight">Mi Registro de Asistencia</h2>
        </div>
        
        <div className="p-0">
          {attendances?.length === 0 ? (
            <div className="p-20 text-center text-gray-400 italic text-sm">No constan faltas ni retrasos registrados.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Fecha</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Materia</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Tipo</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Acción / Motivo</th>
                </tr>
              </thead>
              <tbody>
                {attendances?.map((att) => (
                  <tr key={att.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">{format(new Date(att.fecha), 'dd/MM/yyyy')}</span>
                        <span className="text-[9px] text-gray-400 uppercase">{format(new Date(att.fecha), 'EEEE', { locale: es })}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium text-gray-600 uppercase">{getAsignatura(att.claseId)}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <Badge className={cn(
                          "text-[9px] font-bold px-2 py-0.5 border-none",
                          att.tipo === 'I' ? "bg-orange-100 text-orange-700" : 
                          att.tipo === 'R' ? "bg-yellow-100 text-yellow-700" : 
                          "bg-green-100 text-green-700"
                        )}>
                          {att.tipo === 'I' ? 'INJUSTIFICADA' : att.tipo === 'R' ? 'RETRASO' : 'JUSTIFICADA'}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {att.motivo ? (
                        <div className="flex items-center justify-end gap-2 group">
                           <span className="text-[10px] text-gray-500 italic max-w-[150px] truncate">{att.motivo}</span>
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100"
                            onClick={() => handleOpenJustify(att)}
                           >
                             <Pencil className="h-3 w-3" />
                           </Button>
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                            onClick={() => handleDeleteJustification(att.id)}
                           >
                             <Trash2 className="h-3 w-3" />
                           </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenJustify(att)}
                          className="h-7 text-[9px] font-bold uppercase border-blue-200 text-blue-700 hover:bg-blue-50 gap-1"
                        >
                          <Send className="h-3 w-3" /> Notificar motivo
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={!!justifyingId} onOpenChange={() => setJustifyingId(null)}>
        <DialogContent className="max-w-md font-verdana p-0 border-none overflow-hidden">
          <DialogHeader className="bg-blue-600 p-6 text-white shrink-0">
             <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
               <MessageSquare className="h-4 w-4" /> Justificación de Ausencia
             </DialogTitle>
             <DialogDescription className="text-white/80 text-[10px] font-bold uppercase">I.E.S Pedro Castro - Secretaría Digital</DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-white space-y-4">
             <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">Motivo de la Falta / Retraso</Label>
                <Textarea 
                  placeholder="Ej: Cita médica, Problema de transporte..." 
                  className="min-h-[120px] text-sm font-medium border-gray-300"
                  value={tempMotivo}
                  onChange={(e) => setMotivo(e.target.value)}
                />
             </div>
             <p className="text-[9px] text-gray-400 italic">Esta información será visible para el profesorado. El docente deberá validar el motivo para oficializar la justificación.</p>
          </div>
          <DialogFooter className="bg-gray-50 p-4 border-t gap-3">
             <Button variant="outline" onClick={() => setJustifyingId(null)} className="text-[10px] font-bold uppercase h-9">Cancelar</Button>
             <Button onClick={handleSaveJustification} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase h-9 shadow-md">Enviar Notificación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Vista de Comportamiento para el Alumno
 */
export function StudentBehaviorView({ studentId, onlyIncidents = false }: { studentId: string, onlyIncidents?: boolean }) {
  const db = useFirestore();

  const behaviorQuery = useMemoFirebase(() => {
    if (!db || !studentId) return null;
    return query(collection(db, 'comportamientos'), where('alumnoId', '==', studentId), orderBy('fecha', 'desc'));
  }, [db, studentId]);

  const incidentsQuery = useMemoFirebase(() => {
    if (!db || !studentId) return null;
    return query(collection(db, 'incidencias'), where('alumnoId', '==', studentId), orderBy('fecha', 'desc'));
  }, [db, studentId]);

  const { data: behaviors } = useCollection(behaviorQuery);
  const { data: incidents, isLoading: loadingIncidents } = useCollection(incidentsQuery);

  if (loadingIncidents) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" /></div>;

  return (
    <div className="animate-in fade-in duration-500 space-y-8 max-w-5xl mx-auto w-full">
      {!onlyIncidents && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-green-100 bg-green-50/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase text-green-700">Puntos Positivos</CardTitle>
                <ThumbsUp className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-700">{behaviors?.filter(b => b.tipo === 'Positivo').length || 0}</p>
              <p className="text-[10px] text-green-600 font-bold uppercase mt-1">Reconocimientos de actitud</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-red-100 bg-red-50/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase text-red-700">Puntos Negativos</CardTitle>
                <ThumbsDown className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-700">{behaviors?.filter(b => b.tipo === 'Negativo').length || 0}</p>
              <p className="text-[10px] text-red-600 font-bold uppercase mt-1">Avisos de conducta contraria</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#e63946] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            <h2 className="font-bold text-sm uppercase tracking-tight">Expediente Disciplinario (Amonestaciones)</h2>
          </div>
          <Badge className="bg-white text-red-600 font-bold">{incidents?.length || 0} REGISTROS</Badge>
        </div>

        <div className="p-6">
          {incidents?.length === 0 ? (
            <div className="py-10 text-center text-gray-400 italic text-sm">No constan amonestaciones en su expediente. ¡Buen trabajo!</div>
          ) : (
            <div className="space-y-4">
              {incidents?.map((inc) => (
                <div key={inc.id} className="p-4 border rounded-lg bg-gray-50 flex flex-col md:flex-row gap-4 justify-between group">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(inc.fecha), 'd MMMM yyyy', { locale: es })}</span>
                      <Badge variant="outline" className={cn(
                        "text-[8px] font-bold uppercase border-none",
                        inc.tipoIncidencia === 'Grave' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {inc.tipoIncidencia}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold text-gray-700 leading-snug">{inc.descripcion}</p>
                    <div className="flex flex-wrap gap-1">
                      {inc.conductas?.map((c: string) => (
                        <span key={c} className="text-[9px] bg-white border px-2 py-0.5 rounded text-gray-500 font-medium uppercase">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="md:w-48 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4 border-gray-200">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Gravedad</p>
                      <p className="text-sm font-bold text-red-600">{inc.gravedad} / 5</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-600 uppercase mt-2">
                      {inc.comunicadoFamilia ? <CheckCircle2 className="h-3 w-3" /> : <div className="w-3 h-3 border rounded-full" />}
                      {inc.comunicadoFamilia ? "Familia informada" : "Pendiente comunicar"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Vista de Calificaciones Finales para el Alumno
 */
export function StudentGradesView({ studentId }: { studentId: string }) {
  const db = useFirestore();

  // Obtener periodos abiertos para alumnos
  const periodosQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'evaluacionesPeriodos'), where('abiertaAlumnos', '==', true));
  }, [db]);

  const { data: periodos, isLoading: loadingPeriodos } = useCollection(periodosQuery);
  const activePeriodo = periodos?.[0];

  const gradesQuery = useMemoFirebase(() => {
    if (!db || !studentId || !activePeriodo) return null;
    return query(collection(db, 'calificacionesFinales'), where('alumnoId', '==', studentId), where('periodoId', '==', activePeriodo.id));
  }, [db, studentId, activePeriodo]);

  const { data: grades } = useCollection(gradesQuery);

  const schedulesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'horarios');
  }, [db]);
  const { data: allSchedules } = useCollection(schedulesQuery);

  const getAsignatura = (claseId: string) => {
    const s = allSchedules?.find(sch => sch.id === claseId);
    return s?.asignatura || "Materia";
  };

  if (loadingPeriodos) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" /></div>;

  if (!activePeriodo) {
    return (
      <div className="py-20 text-center space-y-4 opacity-50">
        <Lock className="h-16 w-16 mx-auto text-gray-300" />
        <h2 className="text-xl font-bold uppercase text-gray-400">Consultas de evaluación cerradas</h2>
        <p className="text-sm italic">Dirección aún no ha habilitado la visualización de notas para este periodo.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-4xl mx-auto w-full">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#89a54e] p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg"><GraduationCap className="h-6 w-6" /></div>
            <div>
              <h2 className="text-lg font-bold uppercase tracking-tight">Boletín: {activePeriodo.periodo}ª EVALUACIÓN</h2>
              <p className="text-white/80 text-[10px] font-bold uppercase">Curso Escolar: {activePeriodo.cursoEscolar}</p>
            </div>
          </div>
          <Badge className="bg-white text-[#89a54e] font-bold uppercase">Oficial</Badge>
        </div>

        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Asignatura</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Calificación</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {grades?.length === 0 ? (
                <tr><td colSpan={3} className="p-10 text-center text-gray-400 italic text-sm">No constan notas registradas en este periodo.</td></tr>
              ) : (
                grades?.map((g) => (
                  <tr key={g.id} className="border-b hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <span className="text-xs font-bold text-gray-700 uppercase">{getAsignatura(g.claseId)}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <Badge className={cn(
                          "text-[11px] font-bold px-3 py-0.5 border-none",
                          g.nota === 'IN' || parseFloat(g.nota) < 5 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        )}>
                          {g.nota}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-start gap-2 text-[10px] text-gray-500 italic">
                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{g.observaciones || "Sin observaciones."}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Vista de Listado de Evaluaciones (Exámenes o Tareas) para el Alumno
 */
export function StudentEvaluationsListView({ studentId, type }: { studentId: string, type: 'exam' | 'task' }) {
  const db = useFirestore();

  const itemsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, type === 'exam' ? 'examenes' : 'tareas'), orderBy('fecha', 'desc'));
  }, [db, type]);

  const { data: items, isLoading } = useCollection(itemsQuery);

  // Filtrar solo aquellos que tengan nota para este alumno
  const myItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
      const field = type === 'exam' ? 'notas' : 'entregas';
      return item[field] && item[field][studentId] !== undefined;
    });
  }, [items, studentId, type]);

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" /></div>;

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-4xl mx-auto w-full">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#89a54e] p-4 text-white flex items-center gap-2">
          {type === 'exam' ? <GraduationCap className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
          <h2 className="font-bold text-sm uppercase tracking-tight">Seguimiento de {type === 'exam' ? 'Exámenes' : 'Tareas'}</h2>
        </div>

        <div className="p-0">
          {myItems.length === 0 ? (
            <div className="p-20 text-center text-gray-400 italic text-sm">No constan registros de {type === 'exam' ? 'exámenes' : 'tareas'} evaluados.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Fecha</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Título Actividad</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">{type === 'exam' ? 'Nota' : 'Estado'}</th>
                </tr>
              </thead>
              <tbody>
                {myItems.map((item) => {
                  const val = type === 'exam' ? item.notas[studentId] : item.entregas[studentId];
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-xs text-gray-500">{format(new Date(item.fecha), 'dd/MM/yyyy')}</td>
                      <td className="p-4">
                        <span className="text-xs font-bold text-gray-700 uppercase">{item.titulo}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          {type === 'exam' ? (
                            <Badge className={cn("text-[10px] font-bold", parseFloat(val) < 5 ? "bg-red-50 text-red-700 border-red-100" : "bg-blue-50 text-blue-700 border-blue-100")}>
                              {val}
                            </Badge>
                          ) : (
                            <Badge className={cn("text-[9px] font-bold uppercase", val ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                              {val ? 'ENTREGADA' : 'NO ENTREGADA'}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Vista de Horario para el Alumno
 */
export function StudentScheduleView({ studentId }: { studentId: string }) {
  const db = useFirestore();

  const schedulesQuery = useMemoFirebase(() => {
    if (!db || !studentId) return null;
    return query(collection(db, 'horarios'), where('alumnosIds', 'array-contains', studentId));
  }, [db, studentId]);

  const { data: schedules, isLoading } = useCollection(schedulesQuery);

  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" /></div>;

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto w-full">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#89a54e] p-4 text-white flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h2 className="font-bold text-sm uppercase tracking-tight">Mi Horario Escolar</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead className="bg-gray-50 border-b">
              <tr>
                {days.map(day => (
                  <th key={day} className="p-3 text-center text-[10px] font-bold text-[#89a54e] uppercase border-r last:border-r-0">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {days.map(day => (
                  <td key={day} className="p-2 align-top border-r last:border-r-0 bg-gray-50/20 h-[500px]">
                    <div className="space-y-2">
                      {schedules?.filter(s => s.dia === day).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)).map(session => (
                        <div key={session.id} className="bg-white p-3 rounded-lg border shadow-sm border-gray-100 flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">{session.horaInicio} - {session.horaFin}</span>
                          <span className="text-[11px] font-bold text-gray-800 uppercase leading-tight">{session.asignatura}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
