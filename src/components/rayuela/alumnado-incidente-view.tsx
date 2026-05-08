
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
  MapPin,
  Trash2,
  Pencil,
  ChevronDown,
  Calendar
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
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CONDUCTAS_CONTRARIAS = [
  "Actuaciones incorrectas hacia algún miembro de la comunidad educativa (Contraria)",
  "Daños en instalaciones o docum. del Centro o en pertenencias de un miembro (Contraria)",
  "Falta de colaboración sistemática en la realización de las actividades (Contraria)",
  "Faltas injustificadas de asistencia a clase (Contraria)",
  "Faltas injustificadas de puntualidad (Contraria)",
  "Impedir o dificultar el estudio a sus compañeros (Contraria)",
  "Perturbación del normal desarrollo de las actividades de clase (Contraria)"
];

const CONDUCTAS_GRAVES = [
  "Acoso escolar y/o ciberacoso (Gravemente perjudicial)",
  "Actuaciones perjudiciales para la salud y la integridad, o incitación a ellas (Gravemente perjudicial)",
  "Agresión física a un miembro de la comunidad educativa (Gravemente perjudicial)",
  "Amenazas o coacciones a un miembro de la comunidad educativa (Gravemente perjudicial)",
  "Deterioro grave de instalac. o docum. del Centro, o pertenencias de un miembro (Gravemente perjudicial)",
  "Impedir el normal desarrollo de las actividades del centro (Gravemente perjudicial)",
  "Incumplimiento de las correcciones impuestas (Gravemente perjudicial)",
  "Injurias y ofensas contra un miembro de la comunidad educativa (Gravemente perjudicial)",
  "Reiteración en un mismo curso de conductas contrarias a normas de convivencia (Gravemente perjudicial)",
  "Suplantación de la personalidad, y falsificación o sustracción de documentos (Gravemente perjudicial)",
  "Uso indebido de medios electrónicos durante las horas lectivas (Gravemente perjudicial)",
  "Vejaciones o humillaciones contra un miembro de la comunidad educativa (Gravemente perjudicial)"
];

const CORRECCIONES_TUTOR = [
  "Amonestación Oral (Contraria)",
  "Apercibimiento por escrito (Contraria)",
  "Suprimir el derecho de asistir a las actividades extraescolares y complementarias (Contraria)",
  "Suspender el derecho de asistencia entre 1 y 3 días (Contraria)"
];

const CORRECCIONES_PROFESOR = [
  "Amonestación Oral (Contraria)",
  "Apercibimiento por escrito (Contraria)"
];

const CORRECCIONES_DIRECCION_ADICIONAL = [
  "Suspender el derecho de asistencia entre 4 y 30 días (Gravemente Perjudicial)",
  "Expulsión Permanente (Gravemente Perjudicial)"
];

interface AlumnadoIncidenteViewProps {
  profesorId: string;
  userData: any;
  targetStudentId?: string;
  onActionComplete?: () => void;
}

export function AlumnadoIncidenteView({ profesorId, userData, targetStudentId, onActionComplete }: AlumnadoIncidenteViewProps) {
  const db = useFirestore();
  const { toast } = useToast();
  
  // FILTROS SUPERIORES
  const [academicYear, setAcademicYear] = useState("2023-2024");
  const [selectedCourse, setSelectedCourse] = useState<string>("1º E.S.O.");
  const [selectedGroup, setSelectedGroup] = useState("Cualquiera");
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'with' | 'without'>('all');
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
    medidasCorrectoras: [] as string[],
    observaciones: '',
    comunicadoFamilia: false,
    otrasConductasChecked: false,
    otrasConductasDesc: '',
    estadoCorreccion: 'Se aplica corrección',
    motivosNoCorreccion: '',
    efectividadCorreccion: 'Indiferente'
  });

  const [selectedConductType, setSelectedConductType] = useState<string>("Contraria");
  const [currentSelectedConduct, setCurrentSelectedConduct] = useState<string>("");
  const [selectedCorrectionType, setSelectedCorrectionType] = useState<string>("");
  const [currentSelectedCorrection, setCurrentSelectedCorrection] = useState<string>("");

  useEffect(() => {
    if (targetStudentId) {
      setFormData(prev => ({ ...prev, alumnoId: targetStudentId }));
      setIsDialogOpen(true);
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
    return unique.sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (!students || !allIncidents) return [];
    
    let base = students;
    
    if (selectedCourse !== "Cualquiera") {
      base = base.filter(s => s.cursoAlumno === selectedCourse);
    }

    if (visibilityFilter === 'with') {
      base = base.filter(s => allIncidents.some(i => i.alumnoId === s.id));
    } else if (visibilityFilter === 'without') {
      base = base.filter(s => !allIncidents.some(i => i.alumnoId === s.id));
    }

    return base;
  }, [students, selectedCourse, visibilityFilter, allIncidents]);

  // Lógica de correcciones permitidas por rol
  const isDirectivo = userData?.rolesUsuario?.includes('EsDireccion');
  const isTutorOfStudent = useMemo(() => {
    const student = students.find(s => s.id === formData.alumnoId);
    return userData?.esTutor && student?.cursoAlumno === userData.esTutor;
  }, [userData, students, formData.alumnoId]);

  const tipoCorreccionOpciones = useMemo(() => {
    if (isDirectivo) return ["Contraria", "Gravemente Perjudiciales"];
    if (isTutorOfStudent) return ["Contrarias"];
    return ["Contraria"];
  }, [isDirectivo, isTutorOfStudent]);

  useEffect(() => {
    if (!selectedCorrectionType && tipoCorreccionOpciones.length > 0) {
      setSelectedCorrectionType(tipoCorreccionOpciones[0]);
    }
  }, [tipoCorreccionOpciones, selectedCorrectionType]);

  const availableCorrections = useMemo(() => {
    if (selectedCorrectionType === "Gravemente Perjudiciales" && isDirectivo) {
       return CORRECCIONES_DIRECCION_ADICIONAL;
    }
    
    if (isDirectivo || isTutorOfStudent) return CORRECCIONES_TUTOR;
    return CORRECCIONES_PROFESOR;
  }, [selectedCorrectionType, isDirectivo, isTutorOfStudent]);

  const handleAddConduct = () => {
    if (!currentSelectedConduct) return;
    if (formData.conductas.includes(currentSelectedConduct)) return;
    setFormData({
      ...formData,
      conductas: [...formData.conductas, currentSelectedConduct]
    });
  };

  const handleAddCorrection = () => {
    if (!currentSelectedCorrection) return;
    if (formData.medidasCorrectoras.includes(currentSelectedCorrection)) return;
    setFormData({
      ...formData,
      medidasCorrectoras: [...formData.medidasCorrectoras, currentSelectedCorrection]
    });
  };

  const handleSaveIncident = async () => {
    if (!db || !formData.alumnoId || !formData.descripcion || !formData.tituloIncidente) {
      toast({ variant: "destructive", title: "Error", description: "Complete los campos obligatorios (*)." });
      return;
    }

    const student = students?.find(s => s.id === formData.alumnoId);
    const studentCourse = student?.cursoAlumno;
    
    const profSnap = await getDoc(doc(db, 'usuarios', formData.profesorComunicadorId));
    const profName = profSnap.exists() ? (profSnap.data().nombrePersona || profSnap.data().usuario) : formData.profesorComunicadorId;

    await addDocumentNonBlocking(collection(db, 'incidencias'), {
      ...formData,
      profesorId: profesorId,
      curso: studentCourse || "SIN CURSO",
      createdAt: new Date().toISOString()
    });

    // Notificaciones
    addDocumentNonBlocking(collection(db, 'mensajes'), {
      remitenteId: 'SISTEMA',
      destinatarioId: formData.alumnoId,
      asunto: 'Aviso de Conducta: Rayuela',
      cuerpo: `Se ha registrado una nueva conducta hacia tu persona en el lugar: ${formData.lugar}. Para verla entre en Comportamiento -> Amonestaciones\n\nAmonestación puesta por ${profName}`,
      leido: false,
      eliminado: false,
      createdAt: new Date().toISOString()
    });

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
      medidasCorrectoras: [] as string[],
      observaciones: '',
      comunicadoFamilia: false,
      otrasConductasChecked: false,
      otrasConductasDesc: '',
      estadoCorreccion: 'Se aplica corrección',
      motivosNoCorreccion: '',
      efectividadCorreccion: 'Indiferente'
    });
    setSelectedConductType("Contraria");
    setCurrentSelectedConduct("");
    setCurrentSelectedCorrection("");
  };

  const getStudentStats = (studentId: string) => {
    const studentIncidents = allIncidents?.filter(i => i.alumnoId === studentId) || [];
    return {
      total: studentIncidents.length,
      pendingEffectivity: studentIncidents.some(i => i.efectividadCorreccion === 'Indiferente') ? 'Sí' : 'No',
      graves: studentIncidents.filter(i => i.tipoIncidencia === 'Grave').length,
      contrarias: studentIncidents.filter(i => i.tipoIncidencia === 'Contraria').length,
      correcciones: studentIncidents.reduce((acc, i) => acc + (i.medidasCorrectoras?.length || 0), 0),
      noCorreccion: studentIncidents.filter(i => i.estadoCorreccion === 'No se aplica corrección').length
    };
  };

  if (loadingUsers) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#9c4d96]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-10 max-w-7xl mx-auto w-full font-verdana text-gray-800">
      
      {/* PANEL DE FILTROS SUPERIOR (REPLICANDO IMAGEN) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-md p-6 max-w-2xl mx-auto space-y-4">
         <div className="flex items-center gap-4">
            <Label className="text-[13px] font-medium min-w-[120px]">Año académico:</Label>
            <div className="flex items-center gap-1">
               <select 
                className="bg-white border border-gray-300 rounded px-2 h-7 text-[13px] font-medium focus:outline-none"
                value={academicYear}
                onChange={e => setAcademicYear(e.target.value)}
               >
                  <option>2023-2024</option>
                  <option>2024-2025</option>
                  <option>2025-2026</option>
               </select>
               <span className="text-purple-600 font-bold">*</span>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <Label className="text-[13px] font-medium min-w-[120px]">Curso:</Label>
            <div className="flex-1 flex items-center gap-1">
               <select 
                className="w-full bg-white border border-gray-300 rounded px-2 h-7 text-[13px] font-medium focus:outline-none"
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
               >
                  <option value="Cualquiera">Cualquiera</option>
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
               <span className="text-purple-600 font-bold">*</span>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <Label className="text-[13px] font-medium min-w-[120px]">Grupo:</Label>
            <div className="flex items-center gap-1">
               <select 
                className="bg-white border border-gray-300 rounded px-2 h-7 text-[13px] font-medium focus:outline-none min-w-[150px]"
                value={selectedGroup}
                onChange={e => setSelectedGroup(e.target.value)}
               >
                  <option>Cualquiera</option>
               </select>
               <span className="text-purple-600 font-bold">*</span>
            </div>
         </div>

         <div className="flex items-center gap-4 pt-1">
            <Label className="text-[13px] font-medium min-w-[120px]">Mostrar:</Label>
            <div className="flex gap-4 text-[13px]">
               <button onClick={() => setVisibilityFilter('all')} className={cn("hover:underline", visibilityFilter === 'all' ? "font-bold text-gray-800" : "text-purple-700")}>todo el alumnado</button>
               <span className="text-gray-300">|</span>
               <button onClick={() => setVisibilityFilter('with')} className={cn("hover:underline", visibilityFilter === 'with' ? "font-bold text-gray-800" : "text-purple-700")}>sólo alumnado con incidente</button>
               <span className="text-gray-300">|</span>
               <button onClick={() => setVisibilityFilter('without')} className={cn("hover:underline", visibilityFilter === 'without' ? "font-bold text-gray-800" : "text-purple-700")}>sólo alumnado sin incidente</button>
            </div>
         </div>

         <div className="flex flex-wrap items-center gap-x-12 gap-y-4 pt-2">
            <div className="flex items-center gap-3">
               <Label className="text-[13px] font-medium">Fecha desde:</Label>
               <div className="flex items-center gap-1">
                  <Input type="text" className="h-7 w-28 border-gray-300 bg-white" placeholder="" />
                  <div className="bg-gray-100 p-1 border border-gray-300 rounded cursor-pointer"><Calendar className="h-3.5 w-3.5 text-green-700" /></div>
               </div>
            </div>
            <div className="flex items-center gap-3">
               <Label className="text-[13px] font-medium">Fecha hasta:</Label>
               <div className="flex items-center gap-1">
                  <Input type="text" className="h-7 w-28 border-gray-300 bg-white" placeholder="" />
                  <div className="bg-gray-100 p-1 border border-gray-300 rounded cursor-pointer"><Calendar className="h-3.5 w-3.5 text-green-700" /></div>
               </div>
            </div>
         </div>
      </div>

      {/* TABLA ESTADÍSTICA (REPLICANDO IMAGEN) */}
      <div className="space-y-2">
         <p className="text-[13px] font-medium">Número total de registros: {filteredStudents.length}</p>
         
         <div className="bg-white border border-gray-300 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-[13px]">
               <thead>
                  <tr className="bg-[#9c84a5] text-white font-bold">
                     <th className="p-2 border-r border-white/20 w-[25%]">Alumnado</th>
                     <th className="p-2 border-r border-white/20 text-center leading-tight">Número de<br/>incidentes</th>
                     <th className="p-2 border-r border-white/20 text-center leading-tight">Pendiente de<br/>registro de<br/>efectividad</th>
                     <th className="p-0 border-r border-white/20">
                        <div className="text-center p-2 border-b border-white/20">Conductas</div>
                        <div className="flex">
                           <div className="flex-1 text-center p-1 border-r border-white/20">Graves</div>
                           <div className="flex-1 text-center p-1">Contrarias</div>
                        </div>
                     </th>
                     <th className="p-2 border-r border-white/20 text-center leading-tight">Correcciones/<br/>medidas<br/>disciplinarias</th>
                     <th className="p-2 text-center leading-tight">Decisión de<br/>no corrección</th>
                  </tr>
               </thead>
               <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr><td colSpan={6} className="p-20 text-center italic text-gray-400">No se han encontrado registros para los filtros seleccionados.</td></tr>
                  ) : (
                    filteredStudents.map(student => {
                      const stats = getStudentStats(student.id);
                      return (
                        <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50/80 transition-colors odd:bg-white even:bg-gray-50/30">
                           <td className="p-2 font-bold">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-[#9c4d96] hover:underline text-left outline-none uppercase tracking-tight">
                                    {student.nombrePersona || student.usuario}
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-80 p-0 border-[#9c4d96] shadow-xl font-verdana">
                                   <DropdownMenuItem 
                                    onClick={() => { resetForm(); setFormData({...formData, alumnoId: student.id}); setIsDialogOpen(true); }}
                                    className="p-3 text-[12px] font-bold text-gray-800 hover:bg-gray-100 cursor-pointer border-b"
                                   >
                                     Nueva conducta contraria/grave del alumnado
                                   </DropdownMenuItem>
                                   <DropdownMenuItem 
                                    onClick={() => setViewExpedienteId(student.id)}
                                    className="p-3 text-[12px] font-bold text-gray-800 hover:bg-gray-100 cursor-pointer border-b"
                                   >
                                     Conductas contrarias/graves del alumnado
                                   </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                           </td>
                           <td className="p-2 text-center font-medium">{stats.total}</td>
                           <td className="p-2 text-center font-medium">{stats.total > 0 ? stats.pendingEffectivity : ""}</td>
                           <td className="p-0 border-l border-gray-100">
                              <div className="flex">
                                 <div className="flex-1 text-center p-2 border-r border-gray-100">{stats.total > 0 ? stats.graves : 0}</div>
                                 <div className="flex-1 text-center p-2">{stats.total > 0 ? stats.contrarias : 0}</div>
                              </div>
                           </td>
                           <td className="p-2 text-center font-medium">{stats.total > 0 ? stats.correcciones : 0}</td>
                           <td className="p-2 text-center font-medium">{stats.total > 0 ? stats.noCorreccion : 0}</td>
                        </tr>
                      );
                    })
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* DIALOGO DE EXPEDIENTE (EXISTENTE) */}
      {viewExpedienteId && (
        <ExpedienteDisciplinarioDialog 
          alumnoId={viewExpedienteId} 
          onClose={() => setViewExpedienteId(null)} 
          incidencias={allIncidents?.filter(i => i.alumnoId === viewExpedienteId) || []}
        />
      )}

      {/* DIALOGO DE NUEVA AMONESTACIÓN (EL FORMULARIO DETALLADO) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl font-verdana p-0 border-none overflow-hidden h-[95vh] flex flex-col shadow-2xl rounded-xl">
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
             <div className="px-6 bg-[#f2f2f2] border-b shrink-0">
                <TabsList className="bg-transparent h-auto p-0 gap-1">
                   <TabsTrigger value="incidente" className="rounded-t-lg rounded-b-none border-x border-t border-gray-300 data-[state=active]:bg-white data-[state=active]:text-lila font-bold text-[11px] px-6 py-2 uppercase">Incidente</TabsTrigger>
                   <TabsTrigger value="conductas" className="rounded-t-lg rounded-b-none border-x border-t border-gray-300 data-[state=active]:bg-white data-[state=active]:text-lila font-bold text-[11px] px-6 py-2 uppercase">Conductas desarrolladas en este incidente</TabsTrigger>
                   <TabsTrigger value="correcciones" className="rounded-t-lg rounded-b-none border-x border-t border-gray-300 data-[state=active]:bg-white data-[state=active]:text-lila font-bold text-[11px] px-6 py-2 uppercase">Correcciones aplicadas en este incidente</TabsTrigger>
                </TabsList>
             </div>

             <ScrollArea className="flex-1 bg-white">
                {/* PESTAÑA 1: INCIDENTE */}
                <TabsContent value="incidente" className="p-8 m-0 space-y-8 pb-10">
                   <div className="border border-purple-200 rounded-lg p-8 space-y-6 relative bg-white">
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

                {/* PESTAÑA 2: CONDUCTAS */}
                <TabsContent value="conductas" className="p-8 m-0 space-y-8 animate-in fade-in duration-300 pb-10">
                   <div className="border border-purple-200 rounded-lg p-8 space-y-8 bg-white relative">
                      <div className="flex items-center gap-4">
                         <Label className="w-64 text-[13px] font-medium text-gray-700">Tipo de conducta:</Label>
                         <div className="flex-1 max-w-xl">
                            <Select 
                              value={selectedConductType} 
                              onValueChange={(val) => {
                                setSelectedConductType(val);
                                setCurrentSelectedConduct("");
                              }}
                            >
                               <SelectTrigger className="h-8 border-gray-300 shadow-sm text-[13px]">
                                  <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="Contraria" className="text-[13px]">Contraria</SelectItem>
                                  <SelectItem value="Grave" className="text-[13px]">Grave</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                      </div>

                      <div className="flex items-start gap-4">
                         <Label className="w-64 text-[13px] font-medium text-gray-700 pt-2">Conductas contrarias/gravemente perjudiciales:</Label>
                         <div className="flex-1 flex items-center gap-4">
                            <Select value={currentSelectedConduct} onValueChange={setCurrentSelectedConduct}>
                               <SelectTrigger className="h-8 border-gray-300 shadow-sm text-[13px] flex-1">
                                  <SelectValue placeholder="Seleccione una conducta..." />
                               </SelectTrigger>
                               <SelectContent>
                                  {(selectedConductType === 'Contraria' ? CONDUCTAS_CONTRARIAS : CONDUCTAS_GRAVES).map(c => (
                                    <SelectItem key={c} value={c} className="text-[11px]">{c}</SelectItem>
                                  ))}
                               </SelectContent>
                            </Select>
                            <Button 
                              onClick={handleAddConduct}
                              className="bg-[#9c4d96] hover:bg-[#833d7d] text-white text-[11px] font-bold uppercase h-8 px-6 rounded-md shadow-sm"
                            >
                              Añadir
                            </Button>
                         </div>
                      </div>

                      <div className="flex items-start gap-4">
                         <Label className="w-64 text-[13px] font-medium text-gray-700 pt-2">Conductas desarrolladas:</Label>
                         <div className="flex-1 flex items-start gap-4">
                            <div className="flex-1 min-h-[140px] border border-gray-400 bg-white rounded shadow-inner p-2 space-y-1">
                               {formData.conductas.length === 0 ? (
                                 <p className="text-[11px] text-gray-300 italic p-2">No se han añadido conductas todavía.</p>
                               ) : (
                                 formData.conductas.map(c => (
                                   <div 
                                    key={c} 
                                    onClick={() => setCurrentSelectedConduct(c)}
                                    className={cn(
                                      "text-[11px] p-1.5 rounded cursor-pointer transition-colors leading-tight",
                                      currentSelectedConduct === c ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-50"
                                    )}
                                   >
                                      {c}
                                   </div>
                                 ))
                               )}
                            </div>
                            <Button 
                              variant="outline"
                              onClick={() => setFormData({...formData, conductas: formData.conductas.filter(c => c !== currentSelectedConduct)})}
                              disabled={!currentSelectedConduct || !formData.conductas.includes(currentSelectedConduct)}
                              className="border-[#9c4d96] text-[#9c4d96] hover:bg-purple-50 text-[11px] font-bold uppercase h-8 px-6 rounded-md shadow-sm"
                            >
                              Quitar
                            </Button>
                         </div>
                      </div>

                      <div className="space-y-4 pt-4">
                         <div className="flex items-center gap-3">
                            <Checkbox 
                              id="otras-conductas" 
                              checked={formData.otrasConductasChecked} 
                              onCheckedChange={(val) => setFormData({...formData, otrasConductasChecked: !!val})}
                            />
                            <Label htmlFor="otras-conductas" className="text-[12px] font-medium text-gray-700 cursor-pointer">
                               Otras conductas contrarias/gravemente perjudiciales no incluidas en los artículos 37 o 40. Describirlas:
                            </Label>
                         </div>
                         <Textarea 
                            disabled={!formData.otrasConductasChecked}
                            value={formData.otrasConductasDesc}
                            onChange={(e) => setFormData({...formData, otrasConductasDesc: e.target.value})}
                            className="min-h-[100px] border-gray-300 shadow-inner text-[13px] resize-none"
                            placeholder="Especifique otras conductas observadas..."
                         />
                      </div>
                   </div>
                </TabsContent>

                {/* PESTAÑA 3: CORRECCIONES */}
                <TabsContent value="correcciones" className="p-8 m-0 space-y-8 animate-in fade-in duration-300 pb-10">
                   <div className="border border-purple-200 rounded-lg p-8 space-y-8 bg-white relative">
                      <div className="flex items-center gap-4">
                         <Label className="w-64 text-[13px] font-medium text-gray-700">Estado de la corrección:</Label>
                         <div className="flex-1 max-w-xl">
                            <Select 
                              value={formData.estadoCorreccion} 
                              onValueChange={(val) => setFormData({...formData, estadoCorreccion: val})}
                            >
                               <SelectTrigger className="h-8 border-gray-300 shadow-sm text-[13px]">
                                  <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="Se aplica corrección" className="text-[13px]">Se aplica corrección</SelectItem>
                                  <SelectItem value="No se aplica corrección" className="text-[13px]">No se aplica corrección</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <div className="flex items-center gap-2">
                            <Label className="text-[13px] font-medium text-gray-700">Motivos por los que excepcionalmente, no se aplican correcciones:</Label>
                            <Eraser className="h-5 w-5 text-gray-300 cursor-pointer hover:text-red-500" onClick={() => setFormData({...formData, motivosNoCorreccion: ''})} />
                         </div>
                         <Textarea 
                            disabled={formData.estadoCorreccion === 'Se aplica corrección'}
                            value={formData.motivosNoCorreccion}
                            onChange={(e) => setFormData({...formData, motivosNoCorreccion: e.target.value})}
                            className="min-h-[80px] border-gray-400 shadow-inner text-[13px] resize-none leading-relaxed"
                         />
                         {formData.estadoCorreccion === 'No se aplica corrección' && <span className="text-red-500 font-bold text-[10px]">* Campo obligatorio</span>}
                      </div>

                      <div className="flex items-center gap-4">
                         <Label className="w-64 text-[13px] font-medium text-gray-700">Tipo de correcciones:</Label>
                         <div className="flex-1 max-w-xl">
                            <Select 
                              disabled={formData.estadoCorreccion === 'No se aplica corrección'}
                              value={selectedCorrectionType} 
                              onValueChange={(val) => {
                                setSelectedCorrectionType(val);
                                setCurrentSelectedCorrection("");
                              }}
                            >
                               <SelectTrigger className="h-8 border-gray-300 shadow-sm text-[13px]">
                                  <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                  {tipoCorreccionOpciones.map(t => (
                                    <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>
                                  ))}
                               </SelectContent>
                            </Select>
                         </div>
                      </div>

                      <div className="flex items-start gap-4">
                         <Label className="w-64 text-[13px] font-medium text-gray-700 pt-2">Correcciones:</Label>
                         <div className="flex-1 flex items-center gap-4">
                            <Select 
                              disabled={formData.estadoCorreccion === 'No se aplica corrección'}
                              value={currentSelectedCorrection} 
                              onValueChange={setCurrentSelectedCorrection}
                            >
                               <SelectTrigger className="h-8 border-gray-300 shadow-sm text-[13px] flex-1">
                                  <SelectValue placeholder="Seleccione una corrección..." />
                               </SelectTrigger>
                               <SelectContent>
                                  {availableCorrections.map(c => (
                                    <SelectItem key={c} value={c} className="text-[11px]">{c}</SelectItem>
                                  ))}
                               </SelectContent>
                            </Select>
                            <Button 
                              disabled={formData.estadoCorreccion === 'No se aplica corrección'}
                              onClick={handleAddCorrection}
                              className="bg-[#9c4d96] hover:bg-[#833d7d] text-white text-[11px] font-bold uppercase h-8 px-6 rounded-md shadow-sm"
                            >
                              Añadir
                            </Button>
                         </div>
                      </div>

                      <div className="flex items-start gap-4">
                         <Label className="w-64 text-[13px] font-medium text-gray-700 pt-2">Correcciones aplicadas:</Label>
                         <div className="flex-1 flex items-start gap-4">
                            <div className="flex-1 min-h-[100px] border border-gray-400 bg-white rounded shadow-inner p-2 space-y-1">
                               {formData.medidasCorrectoras.length === 0 ? (
                                 <p className="text-[11px] text-gray-300 italic p-2">No se han añadido medidas todavía.</p>
                               ) : (
                                 formData.medidasCorrectoras.map(m => (
                                   <div 
                                    key={m} 
                                    onClick={() => setCurrentSelectedCorrection(m)}
                                    className={cn(
                                      "text-[11px] p-1.5 rounded cursor-pointer transition-colors leading-tight",
                                      currentSelectedCorrection === m ? "bg-blue-100 text-blue-900 font-bold" : "hover:bg-gray-50"
                                    )}
                                   >
                                      {m}
                                   </div>
                                 ))
                               )}
                            </div>
                            <Button 
                              disabled={formData.estadoCorreccion === 'No se aplica corrección' || !currentSelectedCorrection || !formData.medidasCorrectoras.includes(currentSelectedCorrection)}
                              variant="outline"
                              onClick={() => setFormData({...formData, medidasCorrectoras: formData.medidasCorrectoras.filter(m => m !== currentSelectedCorrection)})}
                              className="border-[#9c4d96] text-[#9c4d96] hover:bg-purple-50 text-[11px] font-bold uppercase h-8 px-6 rounded-md shadow-sm"
                            >
                              Quitar
                            </Button>
                         </div>
                      </div>

                      <div className="flex items-center gap-4">
                         <Label className="w-64 text-[13px] font-medium text-gray-700">¿Han sido efectivas las correcciones?:</Label>
                         <div className="flex-1 max-w-xl">
                            <Select 
                              value={formData.efectividadCorreccion} 
                              onValueChange={(val) => setFormData({...formData, efectividadCorreccion: val})}
                            >
                               <SelectTrigger className="h-8 border-gray-300 shadow-sm text-[13px]">
                                  <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                  <SelectItem value="Indiferente" className="text-[13px]">Indiferente</SelectItem>
                                  <SelectItem value="Si" className="text-[13px]">Si</SelectItem>
                                  <SelectItem value="No" className="text-[13px]">No</SelectItem>
                                  <SelectItem value="Parcialmente" className="text-[13px]">Parcialmente</SelectItem>
                               </SelectContent>
                            </Select>
                         </div>
                      </div>
                   </div>
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

                   {selectedIncident.medidasCorrectoras?.length > 0 && (
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-gray-400">Medidas Correctoras Aplicadas</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedIncident.medidasCorrectoras.map((m: string) => (
                            <Badge key={m} className="bg-lila text-white text-[9px] font-bold uppercase border-none">{m}</Badge>
                          ))}
                        </div>
                     </div>
                   )}

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

