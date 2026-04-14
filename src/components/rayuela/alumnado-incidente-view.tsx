
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
  
  // Efecto para abrir automáticamente el expediente si viene de una redirección
  useEffect(() => {
    if (targetStudentId) {
      setViewExpedienteId(targetStudentId);
      if (onActionComplete) onActionComplete();
    }
  }, [targetStudentId, onActionComplete]);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'usuarios'), where('rolesUsuario', 'array-contains', 'EsAlumno'));
  }, [db]);

  const { data: allStudents, isLoading: loadingStudents } = useCollection(usersQuery);

  const incidentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'incidencias');
  }, [db]);

  const { data: allIncidents } = useCollection(incidentsQuery);

  const courses = useMemo(() => {
    if (!allStudents) return [];
    const unique = Array.from(new Set(allStudents.map(s => s.cursoAlumno || "SIN CURSO")));
    return ["TODOS", ...unique];
  }, [allStudents]);

  const filteredStudents = useMemo(() => {
    if (!allStudents) return [];
    if (selectedCourse === "TODOS") return allStudents;
    return allStudents.filter(s => (s.cursoAlumno || "SIN CURSO") === selectedCourse);
  }, [allStudents, selectedCourse]);

  const [formData, setFormData] = useState({
    alumnoId: '',
    tipoIncidencia: 'Contraria',
    gravedad: 1,
    descripcion: '',
    conductas: [] as string[],
    medidasCorrectoras: '',
    observaciones: '',
    comunicadoFamilia: false
  });

  const conductList = [
    "Perturbación del normal desarrollo de las clases",
    "Falta de colaboración sistemática",
    "Uso de teléfonos móviles o dispositivos electrónicos",
    "Incumplimiento de normas de vestimenta",
    "Faltas injustificadas de puntualidad",
    "Deterioro leve de instalaciones o materiales",
    "Desobediencia a las instrucciones del profesorado"
  ];

  const handleSaveIncident = async () => {
    if (!db || !formData.alumnoId || !formData.descripcion) {
      toast({ variant: "destructive", title: "Error", description: "Complete el alumno y la descripción." });
      return;
    }

    const student = allStudents?.find(s => s.id === formData.alumnoId);
    const studentCourse = student?.cursoAlumno;
    
    // Obtener nombre del profesor para el mensaje
    const profSnap = await getDoc(doc(db, 'usuarios', profesorId));
    const profName = profSnap.exists() ? (profSnap.data().nombrePersona || profSnap.data().usuario) : profesorId;

    // Guardar incidencia y obtener referencia para el enlace
    const incidentRef = await addDocumentNonBlocking(collection(db, 'incidencias'), {
      ...formData,
      profesorId,
      curso: studentCourse || "SIN CURSO",
      fecha: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });

    if (!incidentRef) return;

    // 1. Enviar mensaje al ALUMNO (Aviso solicitado)
    addDocumentNonBlocking(collection(db, 'mensajes'), {
      remitenteId: 'SISTEMA',
      destinatarioId: formData.alumnoId,
      asunto: 'Aviso de Conducta: Rayuela',
      cuerpo: `Se ha registrado una nueva conducta hacia tu persona, para verla entre en Comportamiento -> Amonestaciones\n\nAmonestación puesta por ${profName}`,
      leido: false,
      eliminado: false,
      createdAt: new Date().toISOString()
    });

    // 2. Enviar notificación al tutor si existe
    if (studentCourse && studentCourse !== "SIN CURSO") {
      const tutorsQuery = query(collection(db, 'usuarios'), where('esTutor', '==', studentCourse));
      const tutorsSnap = await getDocs(tutorsQuery);
      
      tutorsSnap.forEach(tutorDoc => {
        addDocumentNonBlocking(collection(db, 'mensajes'), {
          remitenteId: 'SISTEMA',
          destinatarioId: tutorDoc.id,
          asunto: 'Plataforma Rayuela: Nueva Incidencia de Alumno',
          cuerpo: `${profName} ha registrado una nueva conducta ${formData.tipoIncidencia} para el alumno ${student?.nombrePersona || student?.usuario}, para verla -pulse aqui- [REF:${student?.id}]`,
          leido: false,
          eliminado: false,
          createdAt: new Date().toISOString()
        });
      });
    }

    toast({ title: "Incidencia Registrada", description: "Se ha añadido al expediente disciplinario y se ha notificado al interesado." });
    setIsDialogOpen(false);
    setFormData({
      alumnoId: '',
      tipoIncidencia: 'Contraria',
      gravedad: 1,
      descripcion: '',
      conductas: [] as string[],
      medidasCorrectoras: '',
      observaciones: '',
      comunicadoFamilia: false
    });
  };

  const getIncidentCount = (studentId: string) => {
    return allIncidents?.filter(i => i.alumnoId === studentId).length || 0;
  };

  if (loadingStudents) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-6xl mx-auto w-full">
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
                    No se han encontrado alumnos para el curso seleccionado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {(viewExpedienteId || targetStudentId) && (
        <ExpedienteDisciplinarioDialog 
          alumnoId={(viewExpedienteId || targetStudentId)!} 
          onClose={() => { setViewExpedienteId(null); if (onActionComplete) onActionComplete(); }} 
          incidencias={allIncidents?.filter(i => i.alumnoId === (viewExpedienteId || targetStudentId)) || []}
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl font-verdana p-0 border-none overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="bg-[#f2f2f2] p-6 text-center shrink-0 border-b">
             <div className="flex items-center justify-center gap-2 text-red-700 mb-1">
                <AlertTriangle className="h-5 w-5" />
                <DialogTitle className="text-sm font-bold uppercase tracking-tight">Registro de Amonestación / Incidencia</DialogTitle>
             </div>
             <DialogDescription className="text-[11px] font-bold text-gray-500 uppercase">EXPEDIENTE DISCIPLINARIO DIGITAL - I.E.S PEDRO CASTRO</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-gray-400">Alumno Implicado</Label>
                    <Select value={formData.alumnoId} onValueChange={(val) => setFormData({...formData, alumnoId: val})}>
                      <SelectTrigger className="text-xs font-bold border-gray-300">
                        <SelectValue placeholder="Seleccione alumno..." />
                      </SelectTrigger>
                      <SelectContent>
                        {allStudents?.map(s => (
                          <SelectItem key={s.id} value={s.id} className="text-xs font-bold">{s.nombrePersona || s.usuario} ({s.cursoAlumno || "S/C"})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-gray-400">Tipo Incidencia</Label>
                      <Select value={formData.tipoIncidencia} onValueChange={(val) => setFormData({...formData, tipoIncidencia: val})}>
                        <SelectTrigger className="text-xs font-bold border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Contraria" className="text-xs">Contraria</SelectItem>
                          <SelectItem value="Grave" className="text-xs">Grave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-gray-400">Nivel Gravedad (1-5)</Label>
                      <Select value={formData.gravedad.toString()} onValueChange={(val) => setFormData({...formData, gravedad: parseInt(val)})}>
                        <SelectTrigger className="text-xs font-bold border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5].map(v => <SelectItem key={v} value={v.toString()} className="text-xs">{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-gray-400">Descripción del Suceso</Label>
                    <Textarea 
                      className="min-h-[100px] text-xs font-medium leading-relaxed" 
                      placeholder="Relate detalladamente los hechos ocurridos..."
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    />
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-gray-400">Conductas Observadas</Label>
                    <div className="bg-gray-50 border rounded-lg p-3 space-y-2 h-[150px] overflow-y-auto">
                       {conductList.map(item => (
                         <div key={item} className="flex items-center gap-2 group cursor-pointer" onClick={() => {
                           const current = formData.conductas;
                           setFormData({...formData, conductas: current.includes(item) ? current.filter(c => c !== item) : [...current, item]});
                         }}>
                            <Checkbox checked={formData.conductas.includes(item)} onCheckedChange={() => {}} />
                            <span className="text-[9px] font-medium leading-tight group-hover:text-primary transition-colors">{item}</span>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-gray-400">Medidas Correctoras Aplicadas</Label>
                    <Input 
                      className="text-xs h-8" 
                      placeholder="Ej: Amonestación escrita, Expulsión de aula..."
                      value={formData.medidasCorrectoras}
                      onChange={(e) => setFormData({...formData, medidasCorrectoras: e.target.value})}
                    />
                  </div>

                  <div className="flex items-center space-x-2 bg-blue-50/50 p-3 rounded-md border border-blue-100">
                    <Checkbox id="comunicado" checked={formData.comunicadoFamilia} onCheckedChange={(val) => setFormData({...formData, comunicadoFamilia: !!val})} />
                    <Label htmlFor="comunicado" className="text-[10px] font-bold text-blue-800 uppercase cursor-pointer">Se ha comunicado a la familia</Label>
                  </div>
               </div>
            </div>
          </ScrollArea>

          <DialogFooter className="bg-gray-50 p-6 border-t gap-4 shrink-0">
             <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="text-[11px] font-bold uppercase h-10 px-8">Cancelar</Button>
             <Button onClick={handleSaveIncident} className="bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold uppercase h-10 px-8 gap-2 shadow-md">
               <Save className="h-4 w-4" /> Registrar en Rayuela
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                    <p className="text-[11px] font-bold text-gray-700 group-hover:text-red-700 truncate">{inc.descripcion}</p>
                  </div>
                ))
              )}
           </div>

           <div className="flex-1 bg-white p-8 overflow-y-auto">
              {selectedIncident ? (
                <div className="animate-in fade-in slide-in-from-right-2 duration-300 space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight flex items-center gap-2">
                        Detalle de la Incidencia
                        <Badge className="bg-red-700">{selectedIncident.gravedad}/5</Badge>
                      </h3>
                      <span className="text-xs text-gray-400 italic">ID: {selectedIncident.id}</span>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase text-gray-400">Tipo de conducta</Label>
                        <p className="text-sm font-bold text-gray-700">{selectedIncident.tipoIncidencia}</p>
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

                   <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-gray-400">Medidas Correctoras</Label>
                      <p className="text-sm font-bold text-gray-800">{selectedIncident.medidasCorrectoras || "Ninguna registrada."}</p>
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
