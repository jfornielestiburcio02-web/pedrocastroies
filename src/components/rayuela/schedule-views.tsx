
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
  Users
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
  orderBy, 
  doc,
  where
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  addDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';

export function ScheduleListView() {
  const db = useFirestore();
  const { toast } = useToast();

  const horariosQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'horarios'), orderBy('dia'), orderBy('horaInicio'));
  }, [db]);

  const { data: schedules, isLoading: loadingSchedules } = useCollection(horariosQuery);

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
    const docRef = doc(db, 'horarios', id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Horario eliminado",
      description: "El registro ha sido borrado correctamente de Rayuela.",
    });
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
          <span className="text-[10px] font-bold uppercase bg-white/20 px-3 py-1 rounded">
            {schedules?.length || 0} Registros activos
          </span>
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
                <TableHead className="text-right font-bold text-[#9c4d96] uppercase text-[10px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules && schedules.length > 0 ? (
                schedules.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
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
                          <span className="text-xs font-semibold text-gray-800">{item.asignatura}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100 font-bold">
                        {item.alumnosIds?.length || 0} PERS.
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic text-sm">
                    No hay horarios registrados en la plataforma.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export function MyScheduleView({ profesorId }: { profesorId: string }) {
  const db = useFirestore();
  
  const schedulesQuery = useMemoFirebase(() => {
    if (!db || !profesorId) return null;
    return query(
      collection(db, 'horarios'),
      where('profesorId', '==', profesorId),
      orderBy('dia'),
      orderBy('horaInicio')
    );
  }, [db, profesorId]);

  const { data: schedules, isLoading } = useCollection(schedulesQuery);

  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-6xl mx-auto w-full space-y-6">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#89a54e] p-4 text-white flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <h2 className="font-bold text-lg uppercase tracking-tight">Mi Horario Semanal</h2>
        </div>

        <div className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                {days.map(day => (
                  <TableHead key={day} className="text-center font-bold text-[#89a54e] uppercase text-[10px] min-w-[150px] border-r last:border-r-0">
                    {day}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                {days.map(day => (
                  <TableCell key={day} className="p-2 align-top border-r last:border-r-0 bg-gray-50/30">
                    <div className="space-y-2">
                      {schedules?.filter(s => s.dia === day).length === 0 ? (
                        <div className="py-8 text-center text-[10px] text-gray-300 italic">Sin sesiones</div>
                      ) : (
                        schedules?.filter(s => s.dia === day).map(session => (
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
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
          <strong>Aviso de Coordinación:</strong> Este horario refleja sus sesiones lectivas y guardias oficiales registradas en Rayuela. Si detecta alguna discrepancia, por favor póngase en contacto con Jefatura de Estudios.
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
  const students = useMemo(() => allUsers?.filter(u => u.rolesUsuario?.includes('EsAlumno')) || [], [allUsers]);

  const [formData, setFormData] = useState({
    profesorId: '',
    dia: 'Lunes',
    horaInicio: '08:30',
    horaFin: '09:30',
    asignatura: '',
    esGuardia: false,
    alumnosIds: [] as string[]
  });

  const [isSaving, setIsSaving] = useState(false);

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
      alumnosIds: []
    }));
    setIsSaving(false);
  };

  const toggleStudent = (id: string) => {
    setFormData(prev => ({
      ...prev,
      alumnosIds: prev.alumnosIds.includes(id) 
        ? prev.alumnosIds.filter(sid => sid !== id)
        : [...prev.alumnosIds, id]
    }));
  };

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
                <Label className="text-xs font-bold uppercase text-gray-500">Profesor Asignado</Label>
                <Select onValueChange={(val) => setFormData({...formData, profesorId: val})} value={formData.profesorId}>
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
                <Label className="text-xs font-bold uppercase text-gray-500">Día de la semana</Label>
                <Select onValueChange={(val) => setFormData({...formData, dia: val})} value={formData.dia}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"].map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500">Hora Inicio</Label>
                  <Input 
                    type="time" 
                    className="border-gray-300"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({...formData, horaInicio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-gray-500">Hora Fin</Label>
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
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500">Nombre de Asignatura / Actividad</Label>
                <Input 
                  placeholder="Ej: Matemáticas II" 
                  className="border-gray-300"
                  value={formData.asignatura}
                  disabled={formData.esGuardia}
                  onChange={(e) => setFormData({...formData, asignatura: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                <Checkbox 
                  id="esGuardia" 
                  checked={formData.esGuardia}
                  onCheckedChange={(checked) => setFormData({...formData, esGuardia: !!checked, asignatura: checked ? 'GUARDIA' : ''})}
                />
                <Label htmlFor="esGuardia" className="text-sm font-bold text-gray-700 cursor-pointer">Es una sesión de GUARDIA</Label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500 flex justify-between">
                  <span>Alumnos Asignados</span>
                  <span className="text-primary">{formData.alumnosIds.length} seleccionados</span>
                </Label>
                <div className="border rounded-lg h-[200px] overflow-y-auto p-2 bg-gray-50/50 space-y-1">
                  {students.length === 0 ? (
                    <p className="text-center text-[11px] text-gray-400 mt-10 italic">No hay alumnos registrados</p>
                  ) : (
                    students.map(s => (
                      <div 
                        key={s.id} 
                        onClick={() => toggleStudent(s.id)}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all border",
                          formData.alumnosIds.includes(s.id) 
                            ? "bg-white border-[#9c4d96] shadow-sm" 
                            : "bg-transparent border-transparent hover:bg-white hover:border-gray-200"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded-sm border flex items-center justify-center transition-colors",
                          formData.alumnosIds.includes(s.id) ? "bg-[#9c4d96] border-[#9c4d96]" : "bg-white border-gray-300"
                        )}>
                          {formData.alumnosIds.includes(s.id) && <Plus className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-[12px]">{s.nombrePersona || s.usuario}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t flex items-center justify-end">
             <Button type="submit" disabled={isSaving} className="bg-[#9c4d96] hover:bg-[#833d7d] text-white gap-2 px-8 text-[11px] font-bold uppercase tracking-widest h-12">
               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
               Guardar en Rayuela
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
