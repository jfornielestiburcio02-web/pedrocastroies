
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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
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

  // Limpiar selección cuando cambia el tipo (Exámenes <-> Tareas)
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
    return allUsers.filter(u => currentSchedule.alumnosIds?.includes(u.id));
  }, [currentSchedule, allUsers]);

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
    toast({ title: "Registro creado", description: "Ahora puede gestionar el detalle de los alumnos." });
    setIsCreating(false);
    setFormData({ titulo: '', mostrarAlumno: true, ponderacion: 5 });
  };

  const handleUpdateStudent = (studentId: string, value: any) => {
    if (!db || !activeItem) return;
    const collectionName = type === 'exam' ? 'examenes' : 'tareas';
    const field = type === 'exam' ? 'notas' : 'entregas';
    
    let safeValue = value;
    if (type === 'exam' && typeof value === 'number' && isNaN(value)) {
      safeValue = 0;
    }
    
    updateDocumentNonBlocking(doc(db, collectionName, activeItem.id), {
      [`${field}.${studentId}`]: safeValue
    });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, type === 'exam' ? 'examenes' : 'tareas', id));
    toast({ title: "Registro eliminado", description: "Se ha borrado de Rayuela correctamente." });
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
                <SelectValue placeholder="Seleccione sesión de su horario..." />
              </SelectTrigger>
              <SelectContent>
                {schedules?.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-[11px]">
                    {s.horaInicio}-{s.horaFin} | {s.asignatura}
                  </SelectItem>
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
                <div className="p-8 text-center text-[11px] text-gray-400 italic">No hay {type === 'exam' ? 'exámenes' : 'tareas'} registrados.</div>
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
                        {type === 'exam' && (
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-[8px] font-bold py-0">{item.ponderacion} PUNTOS</Badge>
                            {item.mostrarAlumno && <Badge className="bg-green-100 text-green-700 border-none text-[8px] font-bold py-0">VISIBLE</Badge>}
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      >
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
                  <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Nuevo Registro de {type === 'exam' ? 'Examen' : 'Tarea'}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase">Título de la actividad</Label>
                      <Input 
                        placeholder="Ej: Control Tema 3" 
                        className="text-sm font-bold h-10 border-gray-300"
                        value={formData.titulo}
                        onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                      />
                    </div>

                    {type === 'exam' && (
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold text-gray-400 uppercase">Ponderación</Label>
                          <span className="text-sm font-bold text-[#89a54e]">{formData.ponderacion} / 10</span>
                        </div>
                        <Slider 
                          value={[formData.ponderacion]} 
                          max={10} 
                          min={1} 
                          step={1}
                          onValueChange={(val) => setFormData({...formData, ponderacion: val[0]})}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {type === 'exam' && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label className="text-[11px] font-bold text-gray-700">Mostrar a alumno</Label>
                          <p className="text-[9px] text-gray-400">¿Desea que el alumno vea su nota?</p>
                        </div>
                        <Switch 
                          checked={formData.mostrarAlumno} 
                          onCheckedChange={(val) => setFormData({...formData, mostrarAlumno: val})} 
                        />
                      </div>
                    )}
                    
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-[10px] text-blue-800 font-bold uppercase leading-relaxed">
                      Se asociará al grupo de {currentSchedule?.asignatura || 'esta sesión'} del día {format(new Date(selectedDate), 'd MMMM', { locale: es })}.
                    </div>
                  </div>
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
                      <div className="bg-white/20 p-3 rounded-lg">
                        {type === 'exam' ? <GraduationCap className="h-6 w-6" /> : <ClipboardList className="h-6 w-6" />}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold uppercase tracking-tight">{activeItem.titulo}</h3>
                        <p className="text-white/80 text-[10px] font-bold uppercase">
                          {type === 'exam' ? `EXAMEN (POND. ${activeItem.ponderacion})` : 'SEGUIMIENTO DE TAREA'}
                        </p>
                      </div>
                   </div>
                   <Badge className="bg-white text-[#89a54e] font-bold text-[9px]">{students.length} ALUMNOS</Badge>
                </div>

                <div className="p-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {students.map(student => {
                        const rawVal = type === 'exam' ? (activeItem.notas?.[student.id]) : (activeItem.entregas?.[student.id]);
                        const val = (rawVal === undefined || rawVal === null || (typeof rawVal === 'number' && isNaN(rawVal))) ? '' : rawVal;
                        
                        return (
                          <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50/50 hover:bg-white transition-all group">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 border">
                                  <AvatarImage src={student.imagenPerfil} />
                                  <AvatarFallback className="text-[10px]">{student.usuario?.substring(0,2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-[11px] font-bold text-gray-700 truncate max-w-[120px]">{student.nombrePersona || student.usuario}</span>
                             </div>

                             <div className="w-16">
                               {type === 'exam' ? (
                                 <Input 
                                   type="number" 
                                   step="0.1" 
                                   className="h-8 text-center text-xs font-bold border-gray-300"
                                   placeholder="0.0"
                                   value={val}
                                   onChange={(e) => {
                                      const num = parseFloat(e.target.value);
                                      handleUpdateStudent(student.id, isNaN(num) ? 0 : num);
                                   }}
                                 />
                               ) : (
                                 <div className="flex justify-center">
                                    <Switch 
                                      checked={!!val} 
                                      onCheckedChange={(checked) => handleUpdateStudent(student.id, checked)}
                                    />
                                 </div>
                               )}
                             </div>
                          </div>
                        );
                      })}
                   </div>
                </div>
                
                <div className="bg-gray-50 border-t p-4 flex items-center justify-between px-8">
                   <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                     <CheckCircle2 className="h-4 w-4 text-green-500" />
                     Sincronizado con Rayuela
                   </div>
                   <Button variant="ghost" onClick={() => setActiveItemId(null)} className="text-[10px] font-bold uppercase text-gray-500 hover:text-black gap-2">
                     <ChevronRight className="h-3 w-3" /> Cerrar edición
                   </Button>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center py-20 bg-gray-50 border border-dashed rounded-xl opacity-50 space-y-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                  <Layout className="h-10 w-10" />
                </div>
                <div className="text-center">
                  <p className="text-gray-600 font-bold uppercase text-xs">Sin selección</p>
                  <p className="text-gray-400 italic text-[11px]">Seleccione un registro lateral para editar las notas.</p>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
