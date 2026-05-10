
"use client";

import React, { useState, useMemo } from 'react';
import { 
  Loader2, 
  Key, 
  UserCircle, 
  Users,
  Search,
  CheckCircle2,
  Lock,
  Copy,
  ShieldCheck,
  X,
  Plus,
  Save,
  Trash2,
  Layout,
  Pencil,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, getDocs } from 'firebase/firestore';
import { updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

/**
 * Vista de gestión de grupos personalizados para el profesor.
 * AHORA VINCULADOS POR CURSO PARA AUTOMATIZACIÓN Y POBLACIÓN DE ARRAY.
 */
export function TeacherGroupsView({ profesorId }: { profesorId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ titulo: '', cursoVinculado: '' });
  const [isSaving, setIsSaving] = useState(false);

  // 1. Obtener todos los alumnos del centro para extraer los cursos disponibles
  const allStudentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'usuarios'), where('rolesUsuario', 'array-contains', 'EsAlumno'));
  }, [db]);
  const { data: allStudents, isLoading: loadingStudents } = useCollection(allStudentsQuery);

  const availableCourses = useMemo(() => {
    if (!allStudents) return [];
    const courses = allStudents.map(s => s.cursoAlumno).filter(Boolean);
    return Array.from(new Set(courses)).sort();
  }, [allStudents]);

  // 2. Obtener los grupos propios de este profesor
  const myGroupsQuery = useMemoFirebase(() => {
    if (!db || !profesorId) return null;
    return query(collection(db, 'gruposAlumnos'), where('profesorId', '==', profesorId));
  }, [db, profesorId]);
  const { data: myGroups, isLoading: loadingGroups } = useCollection(myGroupsQuery);

  const openCreate = () => {
    setEditingGroupId(null);
    setFormData({ titulo: '', cursoVinculado: '' });
    setIsDialogOpen(true);
  };

  const openEdit = (group: any) => {
    setEditingGroupId(group.id);
    setFormData({ titulo: group.titulo, cursoVinculado: group.cursoVinculado || '' });
    setIsDialogOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!db || !formData.titulo || !formData.cursoVinculado) {
      toast({ variant: "destructive", title: "Incompleto", description: "Asigne un título y seleccione un curso." });
      return;
    }

    setIsSaving(true);

    // NUEVO: Obtener los alumnos del curso en tiempo real para meterlos en el array
    const q = query(
      collection(db, 'usuarios'), 
      where('cursoAlumno', '==', formData.cursoVinculado), 
      where('rolesUsuario', 'array-contains', 'EsAlumno')
    );
    const snap = await getDocs(q);
    const studentsIds = snap.docs.map(d => d.id);

    const dataToSave = {
      ...formData,
      profesorId,
      alumnosIds: studentsIds, // ¡Los metemos en el array!
      updatedAt: new Date().toISOString()
    };

    if (editingGroupId) {
      updateDocumentNonBlocking(doc(db, 'gruposAlumnos', editingGroupId), dataToSave);
      toast({ title: "Grupo Actualizado", description: `Se han sincronizado ${studentsIds.length} alumnos en el array.` });
    } else {
      addDocumentNonBlocking(collection(db, 'gruposAlumnos'), {
        ...dataToSave,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Grupo Creado", description: `El grupo "${formData.titulo}" tiene ${studentsIds.length} alumnos vinculados.` });
    }

    setIsSaving(false);
    setIsDialogOpen(false);
  };

  const handleDeleteGroup = (id: string) => {
    if (!db) return;
    if (confirm("¿Está seguro de eliminar este grupo?")) {
      deleteDocumentNonBlocking(doc(db, 'gruposAlumnos', id));
      toast({ title: "Grupo eliminado" });
    }
  };

  if (loadingStudents || loadingGroups) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-6xl mx-auto w-full font-verdana">
      <div className="flex items-center justify-between bg-white border p-4 rounded-xl shadow-sm">
         <div className="flex items-center gap-3">
            <Layout className="h-5 w-5 text-[#89a54e]" />
            <h2 className="text-sm font-bold text-gray-700 uppercase">Mis Grupos de Alumnado (Por Curso)</h2>
         </div>
         <Button onClick={openCreate} className="bg-[#89a54e] hover:bg-[#728a41] text-white text-[10px] font-bold uppercase h-8 px-4 gap-2">
           <Plus className="h-3 w-3" /> Configurar Grupo
         </Button>
      </div>

      {myGroups?.length === 0 ? (
        <div className="py-20 text-center bg-gray-50 border-2 border-dashed rounded-2xl opacity-40">
           <p className="text-sm italic">Cree su primer grupo vinculándolo a un curso oficial del centro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {myGroups?.map(group => (
             <div key={group.id} className="bg-white border rounded-xl overflow-hidden shadow-sm flex flex-col group hover:border-[#89a54e] transition-all">
                <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
                   <h3 className="text-xs font-bold text-gray-700 uppercase truncate pr-4">{group.titulo}</h3>
                   <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(group)} className="h-7 w-7 text-blue-400 hover:text-blue-600 hover:bg-blue-50">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteGroup(group.id)} className="h-7 w-7 text-gray-300 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                   </div>
                </div>
                <div className="p-8 text-center space-y-3">
                   <div className="bg-blue-50 text-blue-700 p-4 rounded-xl border border-blue-100 inline-block">
                      <GraduationCap className="h-8 w-8 mx-auto mb-1" />
                      <span className="text-lg font-black tracking-tight">{group.cursoVinculado}</span>
                   </div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase">Sincronización: {group.alumnosIds?.length || 0} Alumnos</p>
                </div>
                <div className="bg-gray-50 p-3 text-[9px] font-bold text-gray-400 uppercase text-center border-t flex items-center justify-center gap-2">
                   <CheckCircle2 className="h-3 w-3 text-green-500" /> Array 'alumnosIds' actualizado
                </div>
             </div>
           ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md font-verdana p-0 border-none overflow-hidden shadow-2xl">
          <DialogHeader className="bg-[#89a54e] p-6 text-white shrink-0">
             <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
               <Layout className="h-4 w-4" /> Vinculación de Grupo a Curso
             </DialogTitle>
             <DialogDescription className="text-white/80 text-[10px] font-bold uppercase">
               El alumnado se meterá automáticamente en el array del grupo
             </DialogDescription>
          </DialogHeader>

          <div className="p-8 bg-white space-y-6">
             <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">Nombre de la Asignatura / Grupo</Label>
                <Input 
                  placeholder="Ej: Matemáticas..." 
                  value={formData.titulo}
                  onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                  className="h-10 border-gray-300 font-bold text-sm uppercase"
                />
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">Seleccione Curso Oficial</Label>
                <Select value={formData.cursoVinculado} onValueChange={(val) => setFormData({...formData, cursoVinculado: val})}>
                   <SelectTrigger className="h-12 border-gray-300 font-bold text-sm">
                      <SelectValue placeholder="Elija curso..." />
                   </SelectTrigger>
                   <SelectContent>
                      {availableCourses.map(c => (
                        <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>

             <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-[10px] text-blue-800 font-bold leading-relaxed uppercase">
                  Al pulsar guardar, el sistema buscará a todos los alumnos de "{formData.cursoVinculado || '...'}" y los insertará en la lista de alumnos del grupo.
                </p>
             </div>
          </div>

          <DialogFooter className="bg-gray-50 p-6 border-t gap-4 shrink-0">
             <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-[11px] font-bold uppercase h-10 px-8">Cancelar</Button>
             <Button onClick={handleSaveGroup} disabled={isSaving} className="bg-[#89a54e] hover:bg-[#728a41] text-white text-[11px] font-bold uppercase h-10 px-8 gap-2 shadow-md">
               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
               Guardar y Sincronizar
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Vista de alumnos del grupo de tutoría del profesor.
 */
export function MyTutoringStudentsView({ grupoTutorizado }: { grupoTutorizado: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [generatedPassData, setGeneratedPassData] = useState<{name: string, pass: string} | null>(null);

  const studentsQuery = useMemoFirebase(() => {
    if (!db || !grupoTutorizado) return null;
    return query(
      collection(db, 'usuarios'),
      where('cursoAlumno', '==', grupoTutorizado),
      where('rolesUsuario', 'array-contains', 'EsAlumno')
    );
  }, [db, grupoTutorizado]);

  const { data: students, isLoading } = useCollection(studentsQuery);

  const handleGeneratePassword = (studentId: string, studentName: string) => {
    if (!db) return;
    const newPassword = Math.random().toString(36).substring(2, 10).toUpperCase();
    const docRef = doc(db, 'usuarios', studentId);
    updateDocumentNonBlocking(docRef, { contrasena: newPassword });
    setGeneratedPassData({ name: studentName, pass: newPassword });
  };

  const copyToClipboard = () => {
    if (generatedPassData) {
      navigator.clipboard.writeText(generatedPassData.pass);
      toast({ title: "Copiado", description: "Contraseña copiada al portapapeles." });
    }
  };

  const filteredStudents = students?.filter(s => 
    (s.nombrePersona || s.usuario).toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-5xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="bg-[#f8f9fa] border-b p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserCircle className="h-5 w-5 text-[#89a54e]" />
            <span className="text-sm font-bold text-gray-700 uppercase">Gestión de Claves: {grupoTutorizado}</span>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <Input 
              placeholder="Buscar por nombre..." 
              className="pl-8 h-8 text-[11px] border-gray-300" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredStudents.length === 0 ? (
              <p className="text-center py-20 text-gray-400 italic text-sm">No se han encontrado alumnos en este grupo.</p>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarImage src={student.imagenPerfil} />
                      <AvatarFallback>{student.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-700">{student.nombrePersona || student.usuario}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 uppercase font-medium">Usuario: {student.usuario}</span>
                        <Badge variant="outline" className="h-4 text-[8px] font-bold border-gray-200 text-gray-400 uppercase gap-1">
                          <Lock className="h-2 w-2" /> Clave Protegida
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button 
                      size="sm" 
                      onClick={() => handleGeneratePassword(student.id, student.nombrePersona || student.usuario)}
                      className="bg-[#89a54e] hover:bg-[#728a41] text-white text-[10px] font-bold uppercase h-8 px-4 gap-2"
                    >
                      <Key className="h-3 w-3" /> Sacar nueva contraseña
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={!!generatedPassData} onOpenChange={() => setGeneratedPassData(null)}>
        <DialogContent className="max-w-md font-verdana p-0 border-none overflow-hidden shadow-2xl">
          <DialogHeader className="bg-[#89a54e] p-6 text-white shrink-0">
             <div className="flex items-center justify-center gap-3 mb-2">
                <ShieldCheck className="h-6 w-6" />
                <DialogTitle className="text-lg font-bold uppercase tracking-tight">Nueva Clave Generada</DialogTitle>
             </div>
             <DialogDescription className="text-white/90 text-center text-xs font-medium">Entregue esta información personalmente al alumno.</DialogDescription>
          </DialogHeader>
          <div className="p-8 bg-white space-y-6 text-center">
            <div className="space-y-1">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alumno</span>
               <p className="text-lg font-bold text-gray-800 uppercase">{generatedPassData?.name}</p>
            </div>
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-xl relative group">
               <span className="text-[10px] font-bold text-gray-400 uppercase absolute top-2 left-1/2 -translate-x-1/2">Nueva Contraseña</span>
               <p className="text-3xl font-mono font-bold tracking-[0.2em] text-[#89a54e] mt-2">{generatedPassData?.pass}</p>
               <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-gray-300 hover:text-[#89a54e]" onClick={copyToClipboard}><Copy className="h-4 w-4" /></Button>
            </div>
          </div>
          <DialogFooter className="bg-gray-50 p-6 border-t shrink-0">
             <Button onClick={() => setGeneratedPassData(null)} className="w-full bg-gray-800 hover:bg-black text-white text-[11px] font-bold uppercase h-12 shadow-md">Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Vista de todos los alumnos del centro (Listado general).
 */
export function CenterStudentsView() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  const centerQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'usuarios'), where('rolesUsuario', 'array-contains', 'EsAlumno'));
  }, [db]);

  const { data: students, isLoading } = useCollection(centerQuery);

  const filteredStudents = students?.filter(s => 
    (s.nombrePersona || s.usuario).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.cursoAlumno || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-5xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="bg-[#f8f9fa] border-b p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[#89a54e]" />
            <span className="text-sm font-bold text-gray-700 uppercase">Listado General de Alumnado</span>
            <Badge variant="secondary" className="text-[9px] font-bold bg-gray-200 text-gray-500">{students?.length || 0} TOTAL</Badge>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <Input placeholder="Buscar por nombre o curso..." className="pl-8 h-8 text-[11px] border-gray-300" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-0">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Alumno</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Curso</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8"><AvatarImage src={student.imagenPerfil} /><AvatarFallback>{student.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                        <span className="text-xs font-bold text-gray-700">{student.nombrePersona || student.usuario}</span>
                      </div>
                    </td>
                    <td className="p-4"><Badge variant="outline" className="text-[10px] font-bold border-gray-300 text-gray-500">{student.cursoAlumno || 'S/C'}</Badge></td>
                    <td className="p-4 text-right"><div className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase"><CheckCircle2 className="h-3 w-3" /> Activo</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
