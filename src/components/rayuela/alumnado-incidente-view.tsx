
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Loader2, 
  Plus, 
  ShieldAlert, 
  Save, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  X,
  Calendar as CalendarIcon,
  Eraser,
  User,
  MapPin
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
  where, 
  doc, 
  getDoc,
  getDocs 
} from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AlumnadoIncidenteViewProps {
  profesorId: string;
  targetStudentId?: string;
  onActionComplete?: () => void;
}

export function AlumnadoIncidenteView({ profesorId, targetStudentId, onActionComplete }: AlumnadoIncidenteViewProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedCourse, setSelectedCourse] = useState<string>("TODOS");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewExpedienteId, setViewExpedienteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    alumnoId: '',
    profesorComunicadorId: profesorId,
    fecha: new Date().toISOString().split('T')[0],
    lugar: 'Aula',
    tituloIncidente: '',
    descripcion: '',
    tipoIncidencia: 'Contraria',
    gravedad: 1,
    conductas: [] as string[],
    medidasCorrectoras: '',
    observaciones: '',
    comunicadoFamilia: false
  });

  // Efecto para abrir automáticamente el expediente si viene de una redirección
  useEffect(() => {
    if (targetStudentId) {
      setViewExpedienteId(targetStudentId);
      if (onActionComplete) onActionComplete();
    }
  }, [targetStudentId, onActionComplete]);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);

  const { data: allUsers, isLoading: loadingUsers } = useCollection(usersQuery);

  const students = useMemo(() => allUsers?.filter(u => u.rolesUsuario?.includes('EsAlumno')) || [], [allUsers]);
  const teachers = useMemo(() => allUsers?.filter(u => u.rolesUsuario?.includes('EsProfesor')) || [], [allUsers]);

  const incidentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'incidencias');
  }, [db]);

  const { data: allIncidents } = useCollection(incidentsQuery);

  const courses = useMemo(() => {
    if (!students) return [];
    const unique = Array.from(new Set(students.map(s => s.cursoAlumno || "SIN CURSO")));
    return ["TODOS", ...unique];
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (selectedCourse === "TODOS") return students;
    return students.filter(s => (s.cursoAlumno || "SIN CURSO") === selectedCourse);
  }, [students, selectedCourse]);

  const handleSaveIncident = async () => {
    if (!db || !formData.alumnoId || !formData.descripcion || !formData.tituloIncidente) {
      toast({ variant: "destructive", title: "Error", description: "Complete los campos obligatorios (*)." });
      return;
    }

    const student = students?.find(s => s.id === formData.alumnoId);
    const studentCourse = student?.cursoAlumno;
    
    // Obtener nombre del profesor comunicador
    const profSnap = await getDoc(doc(db, 'usuarios', formData.profesorComunicadorId));
    const profName = profSnap.exists() ? (profSnap.data().nombrePersona || profSnap.data().usuario) : formData.profesorComunicadorId;

    // Guardar incidencia
    const incidentRef = await addDocumentNonBlocking(collection(db, 'incidencias'), {
      ...formData,
      profesorId: profesorId, // El que lo registra
      curso: studentCourse || "SIN CURSO",
      createdAt: new Date().toISOString()
    });

    if (!incidentRef) return;

    // 1. Enviar mensaje al ALUMNO
    addDocumentNonBlocking(collection(db, 'mensajes'), {
      remitenteId: 'SISTEMA',
      destinatarioId: formData.alumnoId,
      asunto: 'Aviso de Conducta: Rayuela',
      cuerpo: `Se ha registrado una nueva conducta hacia tu persona en el lugar: ${formData.lugar}. Para verla entre en Comportamiento -> Amonestaciones\n\nAmonestación puesta por ${profName}`,
      leido: false,
      eliminado: false,
      createdAt: new Date().toISOString()
    });

    // 2. Enviar notificación al tutor
    if (studentCourse) {
      const tutorsQuery = query(collection(db, 'usuarios'), where('esTutor', '==', studentCourse));
      const tutorsSnap = await getDocs(tutorsQuery);
      tutorsSnap.forEach(tutorDoc => {
        addDocumentNonBlocking(collection(db, 'mensajes'), {
          remitenteId: 'SISTEMA',
          destinatarioId: tutorDoc.id,
          asunto: 'Plataforma Rayuela: Nueva Incidencia de Alumno',
          cuerpo: `${profName} ha registrado una nueva incidencia [${formData.tituloIncidente}] para el alumno ${student?.nombrePersona || student?.usuario}, ocurrida en ${formData.lugar}. Para verla -pulse aqui- [REF:${student?.id}]`,
          leido: false,
          eliminado: false,
          createdAt: new Date().toISOString()
        });
      });
    }

    toast({ title: "Incidencia Registrada", description: "El expediente disciplinario ha sido actualizado." });
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      alumnoId: '',
      profesorComunicadorId: profesorId,
      fecha: new Date().toISOString().split('T')[0],
      lugar: 'Aula',
      tituloIncidente: '',
      descripcion: '',
      tipoIncidencia: 'Contraria',
      gravedad: 1,
      conductas: [] as string[],
      medidasCorrectoras: '',
      observaciones: '',
      comunicadoFamilia: false
    });
  };

  const getIncidentCount = (studentId: string) => {
    return allIncidents?.filter(i => i.alumnoId === studentId).length || 0;
  };

  if (loadingUsers) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-6xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#f8f9fa] border-b p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <span className="text-sm font-bold text-gray-700 uppercase">Gestión de Alumnado Incidente</span>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="flex items-center gap-2">
               <Label className="text-[10px] font-bold text-gray-400 uppercase">Filtrar Curso:</Label>
               <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                 <SelectTrigger className="h-8 w-[160px] text-[10px] font-bold border-gray-300">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {courses.map(c => (
                     <SelectItem key={c} value={c} className="text-[10px] font-bold">{c}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <Button onClick={() => setIsDialogOpen(true)} size="sm" className="bg-[#89a54e] hover:bg-[#728a41] text-white text-[10px] font-bold uppercase h-8 px-4 gap-2 shadow-sm">
               <Plus className="h-3 w-3" /> Nueva Incidencia
             </Button>
          </div>
        </div>

        <div className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase text-gray-500">Alumno</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-500">Curso</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-500">Nº Incidencias</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-gray-500 text-center">Estado</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase text-gray-500">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const count = getIncidentCount(student.id);
                  return (
                    <TableRow key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.imagenPerfil} />
                            <AvatarFallback>{student.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-gray-700">{student.nombrePersona || student.usuario}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 font-bold">{student.cursoAlumno || "SIN CURSO"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-bold border-none",
                          count > 0 ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-500"
                        )}>
                          {count} {count === 1 ? 'INCIDENCIA' : 'INCIDENCIAS'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <CheckCircle2 className={cn("h-4 w-4", count > 0 ? "text-yellow-500" : "text-green-500")} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setViewExpedienteId(student.id)} className="h-8 px-2 text-[9px] font-bold text-[#89a54e] uppercase gap-1 hover:bg-[#89a54e]/10">
                          <FileText className="h-3 w-3" /> Ver Expediente
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic text-sm">
                    No se han encontrado alumnos.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {viewExpedienteId && (
        <ExpedienteDisciplinarioDialog 
          alumnoId={viewExpedienteId} 
          onClose={() => setViewExpedienteId(null)} 
          incidencias={allIncidents?.filter(i => i.alumnoId === viewExpedienteId) || []}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl font-verdana p-0 border-none overflow-hidden max-h-[95vh] flex flex-col shadow-2xl rounded-xl">
          <DialogHeader className="bg-[#f2f2f2] p-4 text-center shrink-0 border-b flex flex-row items-center justify-between">
             <div className="flex items-center gap-2 text-gray-800">
                <AlertTriangle className="h-5 w-5 text-red-700" />
                <DialogTitle className="text-sm font-bold uppercase tracking-tight">Registro de Amonestación / Incidencia</DialogTitle>
             </div>
             <Button variant="ghost" size="icon" onClick={() => setIsDialogOpen(false)} className="h-8 w-8">
               <X className="h-4 w-4" />
             </Button>
          </DialogHeader>

          <Tabs defaultValue="incidente" className="flex-1 flex flex-col overflow-hidden">
             <div className="px-6 bg-[#f2f2f2] border-b">
                <TabsList className="bg-transparent h-auto p-0 gap-1">
                   <TabsTrigger value="incidente" className="rounded-t-lg rounded-b-none border-x border-t border-gray-300 data-[state=active]:bg-white data-[state=active]:text-lila font-bold text-[11px] px-6 py-2 uppercase">Incidente</TabsTrigger>
                   <TabsTrigger value="conductas" className="rounded-t-lg rounded-b-none border-x border-t border-gray-300 data-[state=active]:bg-white font-bold text-[11px] px-6 py-2 uppercase opacity-60">Conductas desarrolladas en este incidente</TabsTrigger>
                   <TabsTrigger value="correcciones" className="rounded-t-lg rounded-b-none border-x border-t border-gray-300 data-[state=active]:bg-white font-bold text-[11px] px-6 py-2 uppercase opacity-60">Correcciones aplicadas en este incidente</TabsTrigger>
                </TabsList>
             </div>

             <ScrollArea className="flex-1 bg-white">
                <TabsContent value="incidente" className="p-8 m-0 space-y-8">
                   <div className="border border-purple-200 rounded-lg p-8 space-y-6 relative bg-white">
                      {/* FILA 1: FECHA */}
                      <div className="flex items-center gap-4">
                         <Label className="w-48 text-[13px] font-medium text-gray-700">Fecha:</Label>
                         <div className="flex items-center gap-2">
                            <Input 
                              type="date" 
                              value={formData.fecha} 
                              onChange={e => setFormData({...formData, fecha: e.target.value})}
                              className="w-44 h-8 border-gray-400 font-bold text-[13px] rounded-md shadow-sm"
                            />
                            <span className="text-red-500 font-bold">*</span>
                            <div className="bg-gray-100 p-1.5 border border-gray-300 rounded shadow-sm">
                               <CalendarIcon className="h-4 w-4 text-green-700" />
                            </div>
                         </div>
                      </div>

                      {/* FILA 2: PROFESIONAL */}
                      <div className="flex items-center gap-4">
                         <Label className="w-48 text-[13px] font-medium text-gray-700">Profesional que ha comunicado el incidente:</Label>
                         <div className="flex-1 flex items-center gap-2 max-w-2xl">
                            <Select 
                              value={formData.profesorComunicadorId} 
                              onValueChange={val => setFormData({...formData, profesorComunicadorId: val})}
                            >
                               <SelectTrigger className="h-8 border-gray-300 shadow-sm text-[13px]">
                                  <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                  {teachers.map(t => (
                                    <SelectItem key={t.id} value={t.id} className="text-[13px]">
                                      {t.nombrePersona || t.usuario}
                                    </SelectItem>
                                  ))}
                               </SelectContent>
                            </Select>
                            <span className="text-lila font-bold">*</span>
                         </div>
                      </div>

                      {/* FILA 3: LUGAR */}
                      <div className="flex items-center gap-4">
                         <Label className="w-48 text-[13px] font-medium text-gray-700">Lugar del incidente:</Label>
                         <div className="flex-1 max-w-xl">
                            <Select 
                              value={formData.lugar} 
                              onValueChange={val => setFormData({...formData, lugar: val})}
                            >
                               <SelectTrigger className="h-8 border-gray-300 shadow-sm text-[13px]">
                                  <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="Aula" className="text-[13px]">Aula</SelectItem>
                                  <SelectItem value="Patio" className="text-[13px]">Patio</SelectItem>
                                  <SelectItem value="Pasillos" className="text-[13px]">Pasillos</SelectItem>
                                  <SelectItem value="Biblioteca" className="text-[13px]">Biblioteca</SelectItem>
                                  <SelectItem value="Comedor" className="text-[13px]">Comedor</SelectItem>
                                  <SelectItem value="Gimnasio" className="text-[13px]">Gimnasio</SelectItem>
                                  <SelectItem value="Entorno Centro" className="text-[13px]">Entorno Centro</SelectItem>
                                  <SelectItem value="Otros" className="text-[13px]">Otros</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                      </div>

                      {/* FILA 4: INCIDENTE */}
                      <div className="flex items-center gap-4">
                         <Label className="w-48 text-[13px] font-medium text-gray-700">Incidente:</Label>
                         <div className="flex-1 flex items-center gap-2">
                            <Input 
                              value={formData.tituloIncidente}
                              onChange={e => setFormData({...formData, tituloIncidente: e.target.value})}
                              className="h-8 border-gray-300 shadow-sm text-[13px]"
                              placeholder="Título breve del suceso..."
                            />
                            <span className="text-lila font-bold">*</span>
                         </div>
                      </div>

                      {/* FILA 5: DESCRIPCIÓN */}
                      <div className="space-y-2">
                         <div className="flex items-center gap-2">
                            <Label className="text-[13px] font-medium text-gray-700">Descripción detallada:</Label>
                            <Eraser className="h-5 w-5 text-gray-300 cursor-pointer hover:text-red-500 transition-colors" onClick={() => setFormData({...formData, descripcion: ''})} />
                         </div>
                         <Textarea 
                            value={formData.descripcion}
                            onChange={e => setFormData({...formData, descripcion: e.target.value})}
                            className="min-h-[120px] border-gray-400 shadow-inner text-[13px] resize-none leading-relaxed focus-visible:ring-lila"
                            placeholder="Relate detalladamente los hechos ocurridos..."
                         />
                      </div>
                   </div>

                   {/* SELECTOR DE ALUMNO (Fuera del recuadro lila para claridad) */}
                   <div className="flex items-center gap-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                      <div className="flex items-center gap-3">
                         <User className="h-5 w-5 text-blue-600" />
                         <Label className="text-[13px] font-bold text-blue-800 uppercase">Alumno implicado:</Label>
                      </div>
                      <div className="flex-1 max-w-md">
                         <Select value={formData.alumnoId} onValueChange={val => setFormData({...formData, alumnoId: val})}>
                            <SelectTrigger className="h-10 border-blue-200 bg-white shadow-sm font-bold">
                               <SelectValue placeholder="Seleccione alumno del centro..." />
                            </SelectTrigger>
                            <SelectContent>
                               {students.map(s => (
                                 <SelectItem key={s.id} value={s.id} className="font-medium text-[13px]">
                                   {s.nombrePersona || s.usuario} ({s.cursoAlumno || "S/C"})
                                 </SelectItem>
                               ))}
                            </SelectContent>
                         </Select>
                      </div>
                   </div>
                </TabsContent>

                <TabsContent value="conductas" className="p-20 text-center space-y-4 opacity-40">
                   <ShieldAlert className="h-16 w-16 mx-auto text-gray-300" />
                   <p className="italic">Esperando definición de conductas específicas...</p>
                </TabsContent>

                <TabsContent value="correcciones" className="p-20 text-center space-y-4 opacity-40">
                   <AlertTriangle className="h-16 w-16 mx-auto text-gray-300" />
                   <p className="italic">Esperando definición de medidas correctoras...</p>
                </TabsContent>
             </ScrollArea>
          </Tabs>

          <DialogFooter className="bg-gray-100 p-6 border-t gap-4 shrink-0">
             <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-[11px] font-bold uppercase h-10 px-8 border-gray-300 hover:bg-white">Cancelar</Button>
             <Button onClick={handleSaveIncident} className="bg-[#89a54e] hover:bg-[#728a41] text-white text-[11px] font-bold uppercase h-10 px-10 gap-2 shadow-lg transition-all active:scale-95">
               <Save className="h-4 w-4" /> Registrar en Rayuela
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .text-lila {
          color: #9c4d96 !important;
        }
        .bg-lila {
          background-color: #9c4d96 !important;
        }
        .border-lila {
          border-color: #9c4d96 !important;
        }
        .focus-visible\:ring-lila:focus-visible {
          --tw-ring-color: #9c4d96 !important;
        }
      `}</style>
    </div>
  );
}

function ExpedienteDisciplinarioDialog({ alumnoId, onClose, incidencias }: { alumnoId: string, onClose: () => void, incidencias: any[] }) {
  const db = useFirestore();
  const [alumno, setAlumno] = useState<any>(null);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  useEffect(() => {
    if (db && alumnoId) {
      getDoc(doc(db, 'usuarios', alumnoId)).then(s => s.exists() && setAlumno(s.data()));
    }
  }, [db, alumnoId]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl font-verdana p-0 border-none overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="bg-[#f2f2f2] p-6 border-b shrink-0">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                   <AvatarImage src={alumno?.imagenPerfil} />
                   <AvatarFallback>{alumno?.usuario?.substring(0,2).toUpperCase()}</AvatarFallback>
                 </Avatar>
                 <div className="text-left">
                    <DialogTitle className="text-sm font-bold uppercase tracking-tight">Expediente Disciplinario Digital</DialogTitle>
                    <p className="text-[11px] font-bold text-[#89a54e] uppercase">{alumno?.nombrePersona || alumno?.usuario} ({alumno?.cursoAlumno})</p>
                 </div>
              </div>
              <Badge className="bg-red-700 text-white font-bold uppercase px-3 py-1">{incidencias.length} INCIDENCIAS</Badge>
           </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
           <div className="w-1/3 border-r bg-gray-50/50 flex flex-col overflow-y-auto">
              <div className="p-4 border-b bg-gray-100 text-[10px] font-bold text-gray-500 uppercase">Listado de Incidencias</div>
              {incidencias.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 italic">No hay registros previos.</div>
              ) : (
                incidencias.map((inc) => (
                  <div 
                    key={inc.id} 
                    onClick={() => setSelectedIncident(inc)}
                    className={cn(
                      "p-4 border-b cursor-pointer transition-colors hover:bg-white group",
                      selectedIncident?.id === inc.id ? "bg-white border-l-4 border-l-red-700" : ""
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{format(new Date(inc.fecha), 'dd/MM/yyyy')}</span>
                      <Badge variant="outline" className={cn("text-[8px] font-bold uppercase border-none", inc.tipoIncidencia === 'Grave' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700")}>
                        {inc.tipoIncidencia}
                      </Badge>
                    </div>
                    <p className="text-[11px] font-bold text-gray-700 group-hover:text-red-700 truncate">{inc.tituloIncidente || inc.descripcion}</p>
                  </div>
                ))
              )}
           </div>

           <div className="flex-1 bg-white p-8 overflow-y-auto">
              {selectedIncident ? (
                <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight flex items-center gap-2">
                        {selectedIncident.tituloIncidente || "Detalle de la Incidencia"}
                        <Badge className="bg-red-700">{selectedIncident.gravedad}/5</Badge>
                      </h3>
                      <span className="text-xs text-gray-400 italic">ID: {selectedIncident.id}</span>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-gray-400">Lugar del suceso</Label>
                        <p className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2"><MapPin className="h-3 w-3 text-red-600" /> {selectedIncident.lugar || "No especificado"}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-gray-400">Fecha del Registro</Label>
                        <p className="text-sm font-bold text-gray-700">{format(new Date(selectedIncident.fecha), "eeee d 'de' MMMM 'a las' HH:mm", { locale: es })}</p>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-gray-400">Relato de los Hechos</Label>
                      <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200 text-sm italic leading-relaxed text-gray-600">
                        "{selectedIncident.descripcion}"
                      </div>
                   </div>

                   <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-gray-400">Conductas Específicas</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedIncident.conductas?.map((c: string) => (
                          <Badge key={c} variant="outline" className="bg-white text-[9px] font-bold text-gray-500 uppercase border-gray-200">{c}</Badge>
                        ))}
                      </div>
                   </div>

                   <div className="pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-blue-800 uppercase bg-blue-50 px-3 py-1 rounded">
                        {selectedIncident.comunicadoFamilia ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        {selectedIncident.comunicadoFamilia ? 'Familia Informada' : 'Pendiente comunicación familia'}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Profesor: {selectedIncident.profesorId}</span>
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                   <Eye className="h-16 w-16" />
                   <p className="text-sm italic">Seleccione una incidencia del listado para ver los detalles completos.</p>
                </div>
              )}
           </div>
        </div>

        <DialogFooter className="bg-gray-50 p-6 border-t shrink-0">
           <Button onClick={onClose} className="bg-gray-700 hover:bg-gray-800 text-white text-[11px] font-bold uppercase h-10 px-8">Cerrar Expediente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
