
"use client";

import React, { useState, useMemo } from 'react';
import { 
  Loader2, 
  Plus, 
  Save, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  BookOpen, 
  GraduationCap, 
  Users, 
  FileSpreadsheet,
  AlertTriangle,
  Search,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * VISTA: APERTURA DE LA EVALUACIÓN (Para Calificador Diagnóstico)
 */
export function DiagnosticOpeningView() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    titulo: 'Prueba Diagnóstico 2024',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    activo: true
  });

  const aperturasQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'aperturasDiagnostico'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: aperturas, isLoading } = useCollection(aperturasQuery);

  const handleCreate = () => {
    if (!db || !formData.titulo) return;
    addDocumentNonBlocking(collection(db, 'aperturasDiagnostico'), {
      ...formData,
      createdAt: new Date().toISOString()
    });
    toast({ title: "Apertura creada", description: "El periodo de diagnóstico ha sido registrado." });
    setIsCreating(false);
  };

  const handleToggle = (id: string, val: boolean) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'aperturasDiagnostico', id), { activo: val });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'aperturasDiagnostico', id));
    toast({ title: "Registro eliminado" });
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#9c4d96]" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#9c4d96] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Unlock className="h-5 w-5" />
            <h2 className="font-bold text-sm uppercase tracking-tight">Gestión de Apertura Diagnóstico</h2>
          </div>
          <Button onClick={() => setIsCreating(true)} size="sm" className="bg-white text-[#9c4d96] hover:bg-white/90 text-[10px] font-bold uppercase gap-2">
            <Plus className="h-3 w-3" /> Apertura Nueva
          </Button>
        </div>

        {isCreating && (
          <div className="p-8 bg-gray-50 border-b space-y-6 animate-in slide-in-from-top-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">Título de la prueba</Label>
                <Input value={formData.titulo} onChange={(e) => setFormData({...formData, titulo: e.target.value})} className="h-10 text-xs font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">Empieza en:</Label>
                <Input type="date" value={formData.fechaInicio} onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})} className="h-10 text-xs font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">Acaba en:</Label>
                <Input type="date" value={formData.fechaFin} onChange={(e) => setFormData({...formData, fechaFin: e.target.value})} className="h-10 text-xs font-bold" />
              </div>
              <div className="flex flex-col justify-end pb-2">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.activo} onCheckedChange={(val) => setFormData({...formData, activo: val})} />
                  <Label className="text-[10px] font-bold text-gray-700 uppercase">Activar ahora</Label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setIsCreating(false)} className="text-[10px] font-bold uppercase">Cancelar</Button>
              <Button onClick={handleCreate} className="bg-[#9c4d96] text-white text-[10px] font-bold uppercase px-8">Guardar Apertura</Button>
            </div>
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Configuración</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Vigencia</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Estado</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {aperturas?.map((a) => (
              <tr key={a.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <span className="text-sm font-bold text-gray-700 uppercase">{a.titulo}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(a.fechaInicio), 'dd/MM/yyyy')} - {format(parseISO(a.fechaFin), 'dd/MM/yyyy')}
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex justify-center items-center gap-2">
                    {a.activo ? <Unlock className="h-3 w-3 text-green-600" /> : <Lock className="h-3 w-3 text-gray-300" />}
                    <Switch checked={a.activo} onCheckedChange={(val) => handleToggle(a.id, val)} />
                  </div>
                </td>
                <td className="p-4 text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} className="h-8 w-8 text-gray-300 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * VISTA: CALIFICACIÓN (Para Profesor)
 */
export function DiagnosticGradingView({ profesorId }: { profesorId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedAperturaId, setSelectedAperturaId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // 1. Obtener aperturas activas
  const aperturasQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'aperturasDiagnostico'), where('activo', '==', true));
  }, [db]);
  const { data: aperturas } = useCollection(aperturasQuery);

  const activeAperturas = useMemo(() => {
    const now = new Date();
    return aperturas?.filter(a => isWithinInterval(now, { start: parseISO(a.fechaInicio), end: parseISO(a.fechaFin) })) || [];
  }, [aperturas]);

  // 2. Obtener horarios del profesor para sacar todos sus alumnos únicos
  const schedulesQuery = useMemoFirebase(() => {
    if (!db || !profesorId) return null;
    return query(collection(db, 'horarios'), where('profesorId', '==', profesorId), where('esGuardia', '==', false));
  }, [db, profesorId]);
  const { data: allSchedules } = useCollection(schedulesQuery);

  // 3. Obtener alumnos
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);
  const { data: allUsers } = useCollection(usersQuery);

  const students = useMemo(() => {
    if (!allSchedules || !allUsers) return [];
    
    // Obtener IDs únicos de alumnos que este profesor tiene en sus clases
    const studentIds = new Set<string>();
    allSchedules.forEach(s => {
      s.alumnosIds?.forEach((id: string) => studentIds.add(id));
    });

    return allUsers.filter(u => studentIds.has(u.id));
  }, [allSchedules, allUsers]);

  // 4. Obtener calificaciones existentes
  const gradesQuery = useMemoFirebase(() => {
    if (!db || !selectedAperturaId || !selectedSubject) return null;
    return query(
      collection(db, 'calificacionesDiagnostico'),
      where('aperturaId', '==', selectedAperturaId),
      where('materia', '==', selectedSubject),
      where('profesorId', '==', profesorId)
    );
  }, [db, selectedAperturaId, selectedSubject, profesorId]);
  const { data: existingGrades } = useCollection(gradesQuery);

  const handleUpdateGrade = (alumnoId: string, value: string) => {
    if (!db || !selectedAperturaId || !selectedSubject) return;
    
    // ID Determinista: alumno_prueba_materia (el profesor es quien la pone)
    const gradeId = `${alumnoId}_${selectedAperturaId}_${selectedSubject}`;
    
    setDocumentNonBlocking(doc(db, 'calificacionesDiagnostico', gradeId), {
      alumnoId,
      aperturaId: selectedAperturaId,
      materia: selectedSubject,
      profesorId,
      nota: value,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-[#f2f2f2] border p-5 rounded-xl shadow-sm flex flex-col md:flex-row gap-6 items-end">
        <div className="space-y-2 flex-1">
          <Label className="text-[10px] font-bold text-gray-400 uppercase">1. Seleccione Prueba</Label>
          <Select onValueChange={setSelectedAperturaId} value={selectedAperturaId || ""}>
            <SelectTrigger className="bg-white border-gray-300 h-10 text-xs font-bold">
              <SelectValue placeholder="Seleccione convocatoria..." />
            </SelectTrigger>
            <SelectContent>
              {activeAperturas.map(a => <SelectItem key={a.id} value={a.id} className="text-xs font-bold">{a.titulo}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex-1">
          <Label className="text-[10px] font-bold text-gray-400 uppercase">2. Materia</Label>
          <Select onValueChange={setSelectedSubject} value={selectedSubject || ""}>
            <SelectTrigger className="bg-white border-gray-300 h-10 text-xs font-bold">
              <SelectValue placeholder="Seleccione materia..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Matemáticas" className="text-xs font-bold">Matemáticas</SelectItem>
              <SelectItem value="Lengua" className="text-xs font-bold">Lengua</SelectItem>
              <SelectItem value="Inglés" className="text-xs font-bold">Inglés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!selectedSubject ? (
        <div className="py-20 text-center opacity-30 flex flex-col items-center">
          <BookOpen className="h-16 w-16 mb-4" />
          <p className="italic text-sm">Seleccione la prueba y la materia para comenzar la calificación.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#89a54e] p-4 text-white flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="bg-white/20 p-2 rounded-lg"><GraduationCap className="h-5 w-5" /></div>
               <span className="text-sm font-bold uppercase tracking-tight">Calificación Diagnóstico: {selectedSubject}</span>
             </div>
             <Badge className="bg-white text-[#89a54e] font-bold">{students.length} ALUMNOS TOTALES</Badge>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Alumno</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Curso Actual</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center w-32">Nota (0-10)</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic text-sm">No tiene alumnos asignados en su horario oficial.</td></tr>
              ) : (
                students.map(s => {
                  const grade = existingGrades?.find(g => g.alumnoId === s.id);
                  return (
                    <tr key={s.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={s.imagenPerfil} />
                            <AvatarFallback>{s.usuario?.substring(0,2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-gray-700 uppercase">{s.nombrePersona || s.usuario}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-[9px] font-bold border-gray-200">{s.cursoAlumno || 'S/C'}</Badge>
                      </td>
                      <td className="p-4">
                        <Input 
                          type="number" step="0.1" min="0" max="10"
                          className="h-9 text-center font-bold"
                          value={grade?.nota || ""}
                          onChange={(e) => handleUpdateGrade(s.id, e.target.value)}
                        />
                      </td>
                      <td className="p-4 text-right">
                         {grade ? <Badge className="bg-green-100 text-green-700 border-none font-bold text-[9px] uppercase">GUARDADO</Badge> : <Badge variant="outline" className="text-[9px] font-bold text-gray-300">PENDIENTE</Badge>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="bg-gray-50 p-4 border-t flex items-center gap-2 px-8">
             <CheckCircle2 className="h-4 w-4 text-green-500" />
             <span className="text-[10px] font-bold text-gray-400 uppercase">Sincronización automática Rayuela activa</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * VISTA: RESULTADOS (Tutor, Directivo, Calificador)
 */
export function DiagnosticResultsView({ mode, grupoTutorizado }: { mode: 'tutor' | 'center' | 'course' | 'student', grupoTutorizado?: string }) {
  const db = useFirestore();
  const [selectedAperturaId, setSelectedAperturaId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const aperturasQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'aperturasDiagnostico'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: aperturas } = useCollection(aperturasQuery);

  const gradesQuery = useMemoFirebase(() => {
    if (!db || !selectedAperturaId) return null;
    return query(collection(db, 'calificacionesDiagnostico'), where('aperturaId', '==', selectedAperturaId));
  }, [db, selectedAperturaId]);
  const { data: allGrades, isLoading: loadingGrades } = useCollection(gradesQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);
  const { data: allUsers } = useCollection(usersQuery);

  const filteredResults = useMemo(() => {
    if (!allGrades || !allUsers) return [];

    let base = allGrades.map(g => {
      const user = allUsers.find(u => u.id === g.alumnoId);
      return { ...g, nombre: user?.nombrePersona || user?.usuario || g.alumnoId, curso: user?.cursoAlumno || 'S/C' };
    });

    if (mode === 'tutor' && grupoTutorizado) {
      base = base.filter(r => r.curso === grupoTutorizado);
    }

    if (searchTerm) {
      base = base.filter(r => r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || r.curso.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return base;
  }, [allGrades, allUsers, mode, grupoTutorizado, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#f8f9fa] border p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="flex-1 space-y-1 w-full">
            <Label className="text-[10px] font-bold text-gray-400 uppercase">Periodo de Diagnóstico</Label>
            <Select onValueChange={setSelectedAperturaId} value={selectedAperturaId || ""}>
              <SelectTrigger className="bg-white border-gray-300 h-10 text-xs font-bold">
                <SelectValue placeholder="Seleccione periodo para ver resultados..." />
              </SelectTrigger>
              <SelectContent>
                {aperturas?.map(a => <SelectItem key={a.id} value={a.id} className="text-xs font-bold">{a.titulo}</SelectItem>)}
              </SelectContent>
            </Select>
         </div>
         <div className="flex-1 space-y-1 w-full">
            <Label className="text-[10px] font-bold text-gray-400 uppercase">Búsqueda rápida</Label>
            <div className="relative">
               <Search className="absolute left-3 top-3 h-4 w-4 text-gray-300" />
               <Input placeholder="Filtrar por nombre o curso..." className="pl-10 h-10 text-xs border-gray-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
         </div>
      </div>

      {!selectedAperturaId ? (
        <div className="py-20 text-center opacity-40">
           <FileSpreadsheet className="h-16 w-16 mx-auto mb-4 text-gray-300" />
           <p className="italic text-sm">Seleccione un periodo de diagnóstico para visualizar la sábana de notas.</p>
        </div>
      ) : loadingGrades ? (
        <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#9c4d96]" /></div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
           <div className="bg-gray-50 border-b p-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Registros encontrados: {filteredResults.length}</span>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div><span className="text-[9px] font-bold uppercase text-gray-500">Aprobado</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[9px] font-bold uppercase text-gray-500">Suspenso</span></div>
              </div>
           </div>
           
           <ScrollArea className="h-[500px]">
             <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 z-10 border-b shadow-sm">
                   <tr>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Alumno</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Curso</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Materia</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Nota</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Actualización</th>
                   </tr>
                </thead>
                <tbody>
                   {filteredResults.length === 0 ? (
                     <tr><td colSpan={5} className="p-20 text-center italic text-gray-400 text-sm">No constan calificaciones para los filtros aplicados.</td></tr>
                   ) : (
                     filteredResults.map((r) => (
                       <tr key={r.id} className="border-b hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                             <span className="text-xs font-bold text-gray-700 uppercase">{r.nombre}</span>
                          </td>
                          <td className="p-4">
                             <Badge variant="outline" className="text-[9px] font-bold border-gray-200 uppercase">{r.curso}</Badge>
                          </td>
                          <td className="p-4">
                             <span className="text-xs font-medium text-gray-600 uppercase">{r.materia}</span>
                          </td>
                          <td className="p-4">
                             <div className="flex justify-center">
                                <Badge className={cn(
                                  "text-[11px] font-bold px-3 py-0.5 border-none",
                                  parseFloat(r.nota) < 5 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                                )}>
                                  {r.nota}
                                </Badge>
                             </div>
                          </td>
                          <td className="p-4 text-right">
                             <span className="text-[9px] text-gray-400 font-bold uppercase">{format(parseISO(r.updatedAt), 'dd/MM/yyyy HH:mm')}</span>
                          </td>
                       </tr>
                     ))
                   )}
                </tbody>
             </table>
           </ScrollArea>
        </div>
      )}
    </div>
  );
}
