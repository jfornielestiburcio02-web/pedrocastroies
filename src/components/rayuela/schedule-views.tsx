
"use client";

import React, { useState, useMemo } from 'react';
import { 
  Loader2, 
  Clock, 
  Trash2, 
  Save, 
  Plus,
  Calendar,
  AlertCircle,
  Users,
  Layout,
  Pencil,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { 
  collection, 
  query, 
  doc,
  where
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from '@/firebase/non-blocking-updates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

export function ScheduleListView({ activeRole }: { activeRole?: string | null }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  const isReadOnly = activeRole === 'Profesor Gestión';

  const horariosQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'horarios');
  }, [db]);

  const { data: rawSchedules, isLoading: loadingSchedules } = useCollection(horariosQuery);

  const schedules = useMemo(() => {
    if (!rawSchedules) return [];
    const daysOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    return [...rawSchedules].sort((a, b) => {
      const dayDiff = daysOrder.indexOf(a.dia) - daysOrder.indexOf(b.dia);
      if (dayDiff !== 0) return dayDiff;
      return a.horaInicio.localeCompare(b.horaInicio);
    });
  }, [rawSchedules]);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);

  const { data: allUsers } = useCollection(usersQuery);

  const getUserName = (id: string) => {
    const user = allUsers?.find(u => u.id === id);
    return user ? (user.nombrePersona || user.usuario) : id;
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    if (confirm("¿Está seguro de eliminar este horario lectivo?")) {
      const docRef = doc(db, 'horarios', id);
      deleteDocumentNonBlocking(docRef);
      toast({
        title: "Horario eliminado",
        description: "El registro ha sido borrado correctamente de Rayuela.",
      });
    }
  };

  if (loadingSchedules) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#9c4d96]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-6xl mx-auto w-full">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#9c4d96] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <h2 className="font-bold text-lg uppercase tracking-tight">Listado General de Horarios</h2>
          </div>
          <div className="flex items-center gap-4">
            {isReadOnly && (
              <Badge className="bg-white/20 text-white border-none font-bold text-[9px] uppercase tracking-wider">Modo Solo Lectura</Badge>
            )}
            <span className="text-[10px] font-bold uppercase bg-white/20 px-3 py-1 rounded">
              {schedules.length} Registros activos
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-bold text-[#9c4d96] uppercase text-[10px]">Día</TableHead>
                <TableHead className="font-bold text-[#9c4d96] uppercase text-[10px]">Tramo Horario</TableHead>
                <TableHead className="font-bold text-[#9c4d96] uppercase text-[10px]">Profesor</TableHead>
                <TableHead className="font-bold text-[#9c4d96] uppercase text-[10px]">Asignatura / Actividad</TableHead>
                <TableHead className="font-bold text-[#9c4d96] uppercase text-[10px]">Alumnos</TableHead>
                {!isReadOnly && (
                  <TableHead className="text-right font-bold text-[#9c4d96] uppercase text-[10px]">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.length > 0 ? (
                schedules.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                    <TableCell className="font-bold text-gray-700 text-xs">{item.dia}</TableCell>
                    <TableCell className="text-xs text-gray-600 font-mono">
                      {item.horaInicio} - {item.horaFin}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{getUserName(item.profesorId)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.esGuardia ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[9px] font-bold">GUARDIA</Badge>
                        ) : (
                          <span className="text-xs font-semibold text-gray-800 uppercase">{item.asignatura}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100 font-bold">
                        {item.alumnosIds?.length || 0} PERS.
                      </Badge>
                    </TableCell>
                    {!isReadOnly && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setEditingSchedule(item)}
                            className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(item.id)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isReadOnly ? 5 : 6} className="h-40 text-center text-muted-foreground italic text-sm">
                    No hay horarios registrados en la plataforma.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {editingSchedule && (
        <EditScheduleDialog 
          schedule={editingSchedule} 
          onClose={() => setEditingSchedule(null)} 
          allUsers={allUsers || []}
        />
      )}
    </div>
  );
}

function EditScheduleDialog({ schedule, onClose, allUsers }: { schedule: any, onClose: () => void, allUsers: any[] }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ ...schedule });
  const [isSaving, setIsSaving] = useState(false);

  const professors = useMemo(() => allUsers.filter(u => u.rolesUsuario?.includes('EsProfesor')), [allUsers]);

  const professorGroupsQuery = useMemoFirebase(() => {
    if (!db || !formData.profesorId) return null;
    return query(collection(db, 'gruposAlumnos'), where('profesorId', '==', formData.profesorId));
  }, [db, formData.profesorId]);
  const { data: professorGroups } = useCollection(professorGroupsQuery);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSaving(true);
    
    updateDocumentNonBlocking(doc(db, 'horarios', schedule.id), {
      ...formData,
      updatedAt: new Date().toISOString()
    });

    toast({ title: "Horario actualizado", description: "Los cambios se han guardado correctamente." });
    onClose();
  };

  const handleGroupChange = (val: string) => {
    const selectedGroup = professorGroups?.find(g => g.id === val);
    if (selectedGroup) {
      setFormData(prev => ({ 
        ...prev, 
        grupoId: val, 
        alumnosIds: selectedGroup.alumnosIds,
        asignatura: selectedGroup.titulo 
      }));
    }
  };

  const daysOptions = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl font-verdana p-0 border-none overflow-hidden">
        <DialogHeader className="bg-[#9c4d96] p-6 text-white shrink-0">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Pencil className="h-5 w-5" />
                 <DialogTitle className="text-sm font-bold uppercase tracking-widest">Editar Horario Lectivo</DialogTitle>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20"><X className="h-4 w-4" /></Button>
           </div>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="p-8 space-y-6 bg-white">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase">Profesor Asignado</Label>
                    <Select onValueChange={(val) => setFormData({...formData, profesorId: val})} value={formData.profesorId}>
                       <SelectTrigger className="border-gray-300 font-bold text-xs h-9">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          {professors.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.nombrePersona || p.usuario}</SelectItem>)}
                       </SelectContent>
                    </Select>
                 </div>

                 <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-gray-400 uppercase">Día lectivo</Label>
                    <Select onValueChange={(val) => setFormData({...formData, dia: val})} value={formData.dia}>
                       <SelectTrigger className="border-gray-300 font-bold text-xs h-9">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          {daysOptions.map(d => <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>)}
                       </SelectContent>
                    </Select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase">Hora Inicio</Label>
                       <Input type="time" value={formData.horaInicio} onChange={(e) => setFormData({...formData, horaInicio: e.target.value})} className="h-9 font-bold border-gray-300" />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold text-gray-400 uppercase">Hora Fin</Label>
                       <Input type="time" value={formData.horaFin} onChange={(e) => setFormData({...formData, horaFin: e.target.value})} className="h-9 font-bold border-gray-300" />
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">
                    <Checkbox id="edit-guardia" checked={formData.esGuardia} onCheckedChange={(val) => setFormData({...formData, esGuardia: !!val, asignatura: val ? 'GUARDIA' : '', grupoId: '', alumnosIds: []})} />
                    <Label htmlFor="edit-guardia" className="text-xs font-bold text-gray-600 uppercase cursor-pointer">Es una sesión de GUARDIA</Label>
                 </div>

                 {!formData.esGuardia && (
                   <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase">Grupo de Alumnos</Label>
                        <Select onValueChange={handleGroupChange} value={formData.grupoId}>
                           <SelectTrigger className="border-gray-300 font-bold text-xs h-9">
                              <SelectValue placeholder="Seleccione grupo..." />
                           </SelectTrigger>
                           <SelectContent>
                              {professorGroups?.map(g => <SelectItem key={g.id} value={g.id} className="text-xs">{g.titulo}</SelectItem>)}
                           </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase">Materia / Asignatura</Label>
                        <Input value={formData.asignatura} onChange={(e) => setFormData({...formData, asignatura: e.target.value})} className="h-9 font-bold border-gray-300 uppercase" />
                      </div>

                      {formData.alumnosIds?.length > 0 && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center justify-between">
                           <span className="text-[10px] font-bold text-blue-700 uppercase">{formData.alumnosIds.length} Alumnos en grupo</span>
                           <Badge className="bg-blue-600 text-white text-[8px]">VINCULADO</Badge>
                        </div>
                      )}
                   </div>
                 )}
              </div>
           </div>

           <div className="pt-6 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} className="text-[10px] font-bold uppercase h-10 px-6">Cancelar</Button>
              <Button type="submit" disabled={isSaving} className="bg-[#9c4d96] hover:bg-[#833d7d] text-white text-[10px] font-bold uppercase h-10 px-8 gap-2">
                 {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                 Actualizar Registro
              </Button>
           </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MyScheduleView({ profesorId }: { profesorId: string }) {
  const db = useFirestore();
  
  const schedulesQuery = useMemoFirebase(() => {
    if (!db || !profesorId) return null;
    return query(
      collection(db, 'horarios'),
      where('profesorId', '==', profesorId)
    );
  }, [db, profesorId]);

  const { data: rawSchedules, isLoading } = useCollection(schedulesQuery);

  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-full mx-auto space-y-6 overflow-x-hidden">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#89a54e] p-4 text-white flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h2 className="font-bold text-lg uppercase tracking-tight">Mi Horario Semanal</h2>
        </div>

        <div className="p-0 overflow-x-auto">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-gray-50">
              <TableRow>
                {days.map(day => (
                  <TableHead key={day} className="text-center font-bold text-[#89a54e] uppercase text-[10px] min-w-[140px] border-r last:border-r-0">
                    {day}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {days.map(day => {
                  const daySessions = rawSchedules
                    ?.filter(s => s.dia === day)
                    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)) || [];

                  return (
                    <TableCell key={day} className="p-2 align-top border-r last:border-r-0 bg-gray-50/30">
                      <div className="space-y-2">
                        {daySessions.length === 0 ? (
                          <div className="py-8 text-center text-[10px] text-gray-300 italic">Sin sesiones</div>
                        ) : (
                          daySessions.map(session => (
                            <div key={session.id} className={cn(
                              "p-3 rounded-lg border shadow-sm transition-all hover:shadow-md",
                              session.esGuardia ? "bg-red-50 border-red-100" : "bg-white border-gray-100"
                            )}>
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                  {session.horaInicio} - {session.horaFin}
                                </span>
                                <span className={cn(
                                  "text-[11px] font-bold leading-tight uppercase",
                                  session.esGuardia ? "text-red-700" : "text-gray-800"
                                )}>
                                  {session.asignatura}
                                </span>
                                {session.alumnosIds?.length > 0 && (
                                  <div className="mt-1 flex items-center gap-1 text-[8px] font-bold text-blue-600 uppercase">
                                    <Users className="h-2.5 w-2.5" />
                                    {session.alumnosIds.length} Alum.
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3 max-w-6xl mx-auto">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
          <strong>Aviso de Coordinación:</strong> Este horario refleja las sesiones oficiales registradas. El perfil de apoyo (DAD) visualiza automáticamente el mismo horario que el profesor titular vinculado.
        </p>
      </div>
    </div>
  );
}

export function ScheduleCreationView() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);
  const { data: allUsers, isLoading: loadingUsers } = useCollection(usersQuery);
  
  const professors = useMemo(() => allUsers?.filter(u => u.rolesUsuario?.includes('EsProfesor')) || [], [allUsers]);

  const [formData, setFormData] = useState({
    profesorId: '',
    grupoId: '',
    dia: 'Lunes',
    horaInicio: '08:30',
    horaFin: '09:30',
    asignatura: '',
    esGuardia: false,
    alumnosIds: [] as string[]
  });

  const professorGroupsQuery = useMemoFirebase(() => {
    if (!db || !formData.profesorId) return null;
    return query(collection(db, 'gruposAlumnos'), where('profesorId', '==', formData.profesorId));
  }, [db, formData.profesorId]);
  const { data: professorGroups } = useCollection(professorGroupsQuery);

  const [isSaving, setIsSaving] = useState(false);

  const handleProfessorChange = (val: string) => {
    setFormData(prev => ({ ...prev, profesorId: val, grupoId: '', alumnosIds: [] }));
  };

  const handleGroupChange = (val: string) => {
    const selectedGroup = professorGroups?.find(g => g.id === val);
    if (selectedGroup) {
      setFormData(prev => ({ 
        ...prev, 
        grupoId: val, 
        alumnosIds: selectedGroup.alumnosIds,
        asignatura: selectedGroup.titulo 
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (!formData.profesorId || (!formData.asignatura && !formData.esGuardia)) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Debe seleccionar un profesor y asignar una materia o marcar como guardia."
      });
      return;
    }

    setIsSaving(true);
    
    const horariosRef = collection(db, 'horarios');
    addDocumentNonBlocking(horariosRef, {
      ...formData,
      createdAt: new Date().toISOString()
    });

    toast({
      title: "Horario creado",
      description: `Se ha asignado la clase de ${formData.dia} a las ${formData.horaInicio}.`,
    });
    
    setFormData(prev => ({
      ...prev,
      asignatura: '',
      esGuardia: false,
      grupoId: '',
      alumnosIds: []
    }));
    setIsSaving(false);
  };

  const daysOptions = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl mx-auto w-full">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#9c4d96] p-4 text-white flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h2 className="font-bold text-lg uppercase tracking-tight">Nuevo Registro de Horario</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">1. Profesor Asignado</Label>
                <Select onValueChange={handleProfessorChange} value={formData.profesorId}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Seleccione un profesor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {professors.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombrePersona || p.usuario}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">2. Día de la semana</Label>
                <Select onValueChange={(val) => setFormData({...formData, dia: val})} value={formData.dia}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOptions.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500">3. Hora Inicio</Label>
                  <Input 
                    type="time" 
                    className="border-gray-300"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({...formData, horaInicio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500">4. Hora Fin</Label>
                  <Input 
                    type="time" 
                    className="border-gray-300"
                    value={formData.horaFin}
                    onChange={(e) => setFormData({...formData, horaFin: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">
                <Checkbox 
                  id="esGuardia" 
                  checked={formData.esGuardia}
                  onCheckedChange={(checked) => setFormData({...formData, esGuardia: !!checked, asignatura: checked ? 'GUARDIA' : '', grupoId: '', alumnosIds: []})}
                />
                <Label htmlFor="esGuardia" className="text-sm font-bold text-gray-700 cursor-pointer uppercase">Es una sesión de GUARDIA</Label>
              </div>

              {!formData.esGuardia && (
                <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-gray-500">5. Seleccione Grupo del Profesor</Label>
                    <Select onValueChange={handleGroupChange} value={formData.grupoId} disabled={!formData.profesorId}>
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder={!formData.profesorId ? "Elija primero profesor" : "Seleccione grupo de alumnos..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {professorGroups?.length === 0 ? (
                          <div className="p-2 text-xs text-gray-400 italic">Este profesor no tiene grupos creados</div>
                        ) : (
                          professorGroups?.map(g => (
                            <SelectItem key={g.id} value={g.id} className="font-bold">{g.titulo}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-gray-500">6. Nombre de Asignatura</Label>
                    <Input 
                      placeholder="Ej: Matemáticas II" 
                      className="border-gray-300 font-bold"
                      value={formData.asignatura}
                      onChange={(e) => setFormData({...formData, asignatura: e.target.value})}
                    />
                  </div>

                  {formData.alumnosIds.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="text-[10px] font-bold text-blue-800 uppercase">Grupo con {formData.alumnosIds.length} alumnos</span>
                       </div>
                       <Badge className="bg-blue-600 text-white font-bold text-[9px]">VINCULADO</Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t flex items-center justify-end">
             <Button type="submit" disabled={isSaving} className="bg-[#9c4d96] hover:bg-[#833d7d] text-white gap-2 px-8 text-[11px] font-bold uppercase tracking-widest h-12 shadow-lg">
               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
               Registrar Horario en Rayuela
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
