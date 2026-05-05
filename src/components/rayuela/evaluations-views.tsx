"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Loader2, 
  Search, 
  Calendar, 
  Plus, 
  Save, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from '@/firebase/non-blocking-updates';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EvaluationsViewProps {
  profesorId: string;
  type: 'exam' | 'task';
}

export function EvaluationsView({ profesorId, type }: EvaluationsViewProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null); 
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setActiveItemId(null);
    setIsCreating(false);
    setSelectedScheduleId(null);
  }, [type]);

  const [formData, setFormData] = useState({
    titulo: '',
    mostrarAlumno: true,
    ponderacion: 5,
  });

  const dayOfWeek = useMemo(() => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const date = new Date(selectedDate);
    const dayIndex = isNaN(date.getTime()) ? 0 : date.getDay();
    return days[dayIndex] || "Lunes";
  }, [selectedDate]);

  const schedulesQuery = useMemoFirebase(() => {
    if (!db || !profesorId || !dayOfWeek) return null;
    return query(
      collection(db, 'horarios'), 
      where('profesorId', '==', profesorId), 
      where('dia', '==', dayOfWeek)
    );
  }, [db, profesorId, dayOfWeek]);

  const { data: schedules } = useCollection(schedulesQuery);
  const currentSchedule = useMemo(() => schedules?.find(s => s.id === selectedScheduleId), [schedules, selectedScheduleId]);

  // Fetch group data for dynamic student resolution
  const groupDocRef = useMemoFirebase(() => {
    if (!db || !currentSchedule?.grupoId) return null;
    return doc(db, 'gruposAlumnos', currentSchedule.grupoId);
  }, [db, currentSchedule?.grupoId]);
  const { data: groupData } = useDoc(groupDocRef);

  const itemsQuery = useMemoFirebase(() => {
    if (!db || !selectedScheduleId || !type) return null;
    return query(
      collection(db, type === 'exam' ? 'examenes' : 'tareas'),
      where('claseId', '==', selectedScheduleId),
      orderBy('createdAt', 'desc')
    );
  }, [db, selectedScheduleId, type]);

  const { data: items, isLoading: loadingItems } = useCollection(itemsQuery);
  const activeItem = useMemo(() => items?.find(i => i.id === activeItemId), [items, activeItemId]);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);
  const { data: allUsers } = useCollection(usersQuery);

  const students = useMemo(() => {
    if (!currentSchedule || !allUsers) return [];
    
    // RESOLUCIÓN DINÁMICA: Si el grupo es por curso, usamos el curso.
    if (groupData?.cursoVinculado) {
       return allUsers.filter(u => u.cursoAlumno === groupData.cursoVinculado && u.rolesUsuario?.includes('EsAlumno'));
    }
    
    return allUsers.filter(u => currentSchedule.alumnosIds?.includes(u.id));
  }, [currentSchedule, allUsers, groupData]);

  const handleCreate = () => {
    if (!db || !selectedScheduleId || !formData.titulo) {
      toast({ variant: "destructive", title: "Incompleto", description: "Rellene el título del registro." });
      return;
    }

    const collectionName = type === 'exam' ? 'examenes' : 'tareas';
    const data = type === 'exam' ? {
      titulo: formData.titulo,
      mostrarAlumno: formData.mostrarAlumno,
      ponderacion: formData.ponderacion,
      profesorId,
      claseId: selectedScheduleId,
      fecha: selectedDate,
      notas: {},
      createdAt: new Date().toISOString()
    } : {
      titulo: formData.titulo,
      profesorId,
      claseId: selectedScheduleId,
      fecha: selectedDate,
      entregas: {},
      createdAt: new Date().toISOString()
    };

    addDocumentNonBlocking(collection(db, collectionName), data);

    if (students && students.length > 0) {
      const profUser = allUsers?.find(u => u.id === profesorId);
      const profName = profUser?.nombrePersona || profUser?.usuario || profesorId;
      const cosa = type === 'exam' ? `un EXAMEN (${formData.titulo})` : `una TAREA (${formData.titulo})`;
      const fechaFormateada = format(new Date(selectedDate), 'dd/MM/yyyy', { locale: es });

      students.forEach((student: any) => {
        addDocumentNonBlocking(collection(db, 'mensajes'), {
          remitenteId: 'SISTEMA',
          destinatarioId: student.id,
          asunto: type === 'exam' ? 'Atención: Nuevo Examen' : 'Atención: Nueva Tarea',
          cuerpo: `Atención, el profesor ${profName} ha puesto ${cosa} el día ${fechaFormateada}.\n\nGrupo de atención de ${profName}`,
          leido: false,
          eliminado: false,
          createdAt: new Date().toISOString()
        });
      });
    }

    toast({ title: "Registro creado", description: "Se ha notificado a los alumnos correctamente." });
    setIsCreating(false);
    setFormData({ titulo: '', mostrarAlumno: true, ponderacion: 5 });
  };

  const handleUpdateStudent = (studentId: string, value: any) => {
    if (!db || !activeItem) return;
    const collectionName = type === 'exam' ? 'examenes' : 'tareas';
    const field = type === 'exam' ? 'notas' : 'entregas';
    updateDocumentNonBlocking(doc(db, collectionName, activeItem.id), {
      [`${field}.${studentId}`]: value
    });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, type === 'exam' ? 'examenes' : 'tareas', id));
    toast({ title: "Registro eliminado" });
    if (activeItemId === id) setActiveItemId(null);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-7xl mx-auto w-full font-verdana">
      <div className="bg-[#f2f2f2] border p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm rounded-lg">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Label className="text-[11px] font-bold text-gray-600 uppercase">Día lectivo:</Label>
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => { setSelectedDate(e.target.value); setSelectedScheduleId(null); setActiveItemId(null); }}
              className="h-8 border-gray-300 w-[150px] text-[11px] font-bold"
            />
          </div>
          <div className="flex items-center gap-2 min-w-[280px]">
            <Label className="text-[11px] font-bold text-gray-600 uppercase">Clase:</Label>
            <Select onValueChange={(val) => { setSelectedScheduleId(val); setActiveItemId(null); }} value={selectedScheduleId || ""}>
              <SelectTrigger className="h-8 border-gray-300 text-[11px] font-bold">
                <SelectValue placeholder="Seleccione sesión..." />
              </SelectTrigger>
              <SelectContent>
                {schedules?.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-[11px]">{s.horaInicio}-{s.horaFin} | {s.asignatura}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {selectedScheduleId && (
          <Button onClick={() => setIsCreating(true)} size="sm" className="bg-[#89a54e] hover:bg-[#728a41] text-white text-[10px] font-bold uppercase gap-2 h-8">
            <Plus className="h-3.5 w-3.5" /> Nueva {type === 'exam' ? 'Evaluación' : 'Tarea'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border rounded-lg overflow-hidden flex flex-col min-h-[400px]">
            <div className="bg-gray-50 border-b p-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Registros de {type === 'exam' ? 'exámenes' : 'tareas'}</span>
              <Layout className="h-4 w-4 text-gray-300" />
            </div>
            <ScrollArea className="flex-1">
              {!selectedScheduleId ? (
                <div className="p-8 text-center text-[11px] text-gray-400 italic">Elija una clase para ver los registros.</div>
              ) : items?.length === 0 ? (
                <div className="p-8 text-center text-[11px] text-gray-400 italic">No hay registros.</div>
              ) : (
                <div className="flex flex-col">
                  {items?.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setActiveItemId(item.id)}
                      className={cn(
                        "p-4 border-b cursor-pointer transition-all flex items-center justify-between group",
                        activeItemId === item.id ? "bg-blue-50 border-l-4 border-l-[#89a54e]" : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{format(new Date(item.fecha), 'dd MMM yyyy', { locale: es })}</span>
                        <h4 className="text-[13px] font-bold text-gray-700 truncate">{item.titulo}</h4>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <div className="lg:col-span-8">
           {isCreating ? (
             <div className="bg-white border rounded-lg p-8 space-y-8 animate-in slide-in-from-right-2 duration-300">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="bg-[#89a54e] p-2 rounded-lg text-white"><Plus className="h-5 w-5" /></div>
                  <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Nuevo Registro</h3>
                </div>
                <div className="space-y-6">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase">Título de la actividad</Label>
                    <Input placeholder="Ej: Control Tema 3" className="text-sm font-bold h-10 border-gray-300" value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})} />
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Button variant="outline" onClick={() => setIsCreating(false)} className="text-[11px] font-bold uppercase h-10 px-6">Cancelar</Button>
                  <Button onClick={handleCreate} className="bg-[#89a54e] hover:bg-[#728a41] text-white text-[11px] font-bold uppercase h-10 px-8">Guardar registro</Button>
                </div>
             </div>
           ) : activeItem ? (
             <div className="bg-white border rounded-lg overflow-hidden shadow-sm flex flex-col animate-in fade-in duration-300">
                <div className="bg-[#89a54e] p-6 text-white flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-3 rounded-lg">{type === 'exam' ? <GraduationCap className="h-6 w-6" /> : <ClipboardList className="h-6 w-6" />}</div>
                      <div>
                        <h3 className="text-lg font-bold uppercase tracking-tight">{activeItem.titulo}</h3>
                        <p className="text-white/80 text-[10px] font-bold uppercase">{groupData?.cursoVinculado ? `Sincronización Curso: ${groupData.cursoVinculado}` : 'Grupo Estático'}</p>
                      </div>
                   </div>
                   <Badge className="bg-white text-[#89a54e] font-bold text-[9px]">{students.length} ALUMNOS</Badge>
                </div>
                <div className="p-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {students.map(student => {
                        const rawVal = type === 'exam' ? (activeItem.notas?.[student.id]) : (activeItem.entregas?.[student.id]);
                        const val = (rawVal === undefined || rawVal === null) ? '' : rawVal;
                        return (
                          <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50 hover:bg-white transition-all group">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border"><AvatarImage src={student.imagenPerfil} /><AvatarFallback className="text-[10px]">{student.usuario?.substring(0,2).toUpperCase()}</AvatarFallback></Avatar>
                                <span className="text-[11px] font-bold text-gray-700 truncate max-w-[120px]">{student.nombrePersona || student.usuario}</span>
                             </div>
                             <div className="w-16">
                               {type === 'exam' ? (
                                 <Input type="number" step="0.1" className="h-8 text-center text-xs font-bold border-gray-300" placeholder="0.0" value={val} onChange={(e) => handleUpdateStudent(student.id, parseFloat(e.target.value) || 0)} />
                               ) : (
                                 <div className="flex justify-center"><Switch checked={!!val} onCheckedChange={(checked) => handleUpdateStudent(student.id, checked)} /></div>
                               )}
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
                <div className="bg-gray-50 border-t p-4 flex items-center justify-between px-8">
                   <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase"><CheckCircle2 className="h-4 w-4 text-green-500" /> Sincronizado dinámicamente</div>
                   <Button variant="ghost" onClick={() => setActiveItemId(null)} className="text-[10px] font-bold uppercase text-gray-500 hover:text-black gap-2"><ChevronRight className="h-3 w-3" /> Cerrar</Button>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center py-20 bg-gray-50 border border-dashed rounded-xl opacity-50 space-y-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300"><Layout className="h-10 w-10" /></div>
                <div className="text-center"><p className="text-gray-600 font-bold uppercase text-xs">Sin selección</p></div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
