
"use client";

import React, { useState, useMemo } from 'react';
import { 
  Loader2, 
  Plus, 
  Save, 
  Trash2, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  ChevronRight, 
  Euro,
  Info,
  CheckCircle2,
  AlertTriangle,
  Search,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function ExtraescolaresActivitiesView() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Obtener actividades
  const activitiesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'actividadesExtraescolares'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: activities, isLoading: loadingActivities } = useCollection(activitiesQuery);

  // Obtener profesores para el selector de coordinación
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);
  const { data: allUsers } = useCollection(usersQuery);
  const professors = useMemo(() => allUsers?.filter(u => u.rolesUsuario?.includes('EsProfesor')) || [], [allUsers]);

  const [formData, setFormData] = useState({
    añoAcademico: '2025-2026',
    tipoActividad: 'Otras',
    estado: 'Borrador',
    departamento: 'Geografía e Historia',
    coordinadorId: '',
    titulo: '',
    descripcion: '',
    bilingue: false,
    alumnadoConvocado: 0,
    alumnadoParticipante: 0,
    numDocentes: 1,
    numGruposParticipantes: 1,
    numCursosParticipantes: 1,
    incluidaPGA: false,
    fechaAprobacion: '',
    requiereCopago: false,
    costePorDocente: 0,
    costePorAlumno: 0,
    otrosCostes: 0,
    objetivoDepartamento: '',
    objetivoEspecifico: '',
    fechaDesde: new Date().toISOString().split('T')[0],
    fechaHasta: new Date().toISOString().split('T')[0],
    horaInicio: '08:30',
    horaFin: '14:30',
    pais: 'España',
    provincia: 'Badajoz',
    municipio: 'Fregenal de la Sierra',
    localidad: 'Fregenal de la Sierra',
    lugarDesarrollo: '',
    medioTransporte: 'Autobús'
  });

  const handleSave = async () => {
    if (!db || !formData.titulo || !formData.coordinadorId) {
      toast({ variant: "destructive", title: "Error", description: "El título y el coordinador son obligatorios." });
      return;
    }

    const totalBudget = (formData.costePorAlumno * formData.alumnadoParticipante) + (formData.costePorDocente * formData.numDocentes) + formData.otrosCostes;
    const percentage = formData.alumnadoConvocado > 0 ? (formData.alumnadoParticipante / formData.alumnadoConvocado) * 100 : 0;

    // 1. Guardar actividad
    await addDocumentNonBlocking(collection(db, 'actividadesExtraescolares'), {
      ...formData,
      totalPresupuesto: totalBudget,
      porcentajeParticipacion: percentage,
      createdAt: new Date().toISOString()
    });

    // 2. ASIGNACIÓN AUTOMÁTICA DE PERFIL AL COORDINADOR
    const coordinatorRef = doc(db, 'usuarios', formData.coordinadorId);
    await updateDoc(coordinatorRef, {
      perfilesAdicionales: arrayUnion('act extraesc.(coord)')
    });

    toast({ 
      title: "Actividad Registrada", 
      description: "Se ha guardado la actividad y asignado el perfil de coordinación al docente seleccionado." 
    });
    
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      añoAcademico: '2025-2026',
      tipoActividad: 'Otras',
      estado: 'Borrador',
      departamento: 'Geografía e Historia',
      coordinadorId: '',
      titulo: '',
      descripcion: '',
      bilingue: false,
      alumnadoConvocado: 0,
      alumnadoParticipante: 0,
      numDocentes: 1,
      numGruposParticipantes: 1,
      numCursosParticipantes: 1,
      incluidaPGA: false,
      fechaAprobacion: '',
      requiereCopago: false,
      costePorDocente: 0,
      costePorAlumno: 0,
      otrosCostes: 0,
      objetivoDepartamento: '',
      objetivoEspecifico: '',
      fechaDesde: new Date().toISOString().split('T')[0],
      fechaHasta: new Date().toISOString().split('T')[0],
      horaInicio: '08:30',
      horaFin: '14:30',
      pais: 'España',
      provincia: 'Badajoz',
      municipio: 'Fregenal de la Sierra',
      localidad: 'Fregenal de la Sierra',
      lugarDesarrollo: '',
      medioTransporte: 'Autobús'
    });
  };

  const filteredActivities = activities?.filter(a => 
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.departamento.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loadingActivities) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#9c4d96]" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="bg-gray-50 border-b p-4 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-[#9c4d96]" />
              <h2 className="text-sm font-bold text-gray-700 uppercase">Actividades Complementarias y Extraescolares</h2>
           </div>
           <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} size="icon" className="bg-[#9c4d96] hover:bg-[#833d7d] text-white rounded-full h-8 w-8 shadow-md">
             <Plus className="h-4 w-4" />
           </Button>
        </div>

        <div className="p-4 border-b bg-white">
           <div className="relative max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <Input 
                placeholder="Buscar actividad..." 
                className="pl-8 h-8 text-[11px] border-gray-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <ScrollArea className="h-[400px]">
           <div className="p-0">
              <table className="w-full text-left border-collapse">
                 <thead className="bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase">
                    <tr>
                       <th className="p-4">Título y Departamento</th>
                       <th className="p-4">Fechas</th>
                       <th className="p-4">Estado</th>
                       <th className="p-4 text-right">Acciones</th>
                    </tr>
                 </thead>
                 <tbody>
                    {filteredActivities.length === 0 ? (
                      <tr><td colSpan={4} className="p-10 text-center italic text-gray-400">No hay actividades registradas.</td></tr>
                    ) : (
                      filteredActivities.map(act => (
                        <tr key={act.id} className="border-b hover:bg-gray-50 transition-colors">
                           <td className="p-4">
                              <div className="flex flex-col">
                                 <span className="text-xs font-bold text-gray-700 uppercase">{act.titulo}</span>
                                 <span className="text-[10px] text-gray-400">{act.departamento}</span>
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500">
                                 <Calendar className="h-3 w-3" />
                                 {format(new Date(act.fechaDesde), 'dd/MM/yy')} - {format(new Date(act.fechaHasta), 'dd/MM/yy')}
                              </div>
                           </td>
                           <td className="p-4">
                              <Badge className={cn(
                                "text-[8px] font-bold uppercase border-none",
                                act.estado === 'Visada' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                              )}>
                                {act.estado}
                              </Badge>
                           </td>
                           <td className="p-4 text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-300 hover:text-red-600" onClick={() => deleteDocumentNonBlocking(doc(db!, 'actividadesExtraescolares', act.id))}>
                                 <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                           </td>
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </ScrollArea>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl font-verdana p-0 border-none overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="bg-gray-100 p-4 border-b shrink-0">
             <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-[11px] font-medium text-gray-600">
                <div className="flex items-center gap-2">
                   <span>Año académico:</span>
                   <span className="font-bold text-[#9c4d96]">{formData.añoAcademico}</span>
                </div>
                <div className="flex items-center gap-2">
                   <span>Tipo de actividad:</span>
                   <select 
                    className="bg-white border border-gray-300 rounded px-2 h-7 font-bold"
                    value={formData.tipoActividad}
                    onChange={(e) => setFormData({...formData, tipoActividad: e.target.value})}
                   >
                      <option>Complementaria</option>
                      <option>Extraescolar</option>
                      <option>Otras</option>
                   </select>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                   <span>Estado:</span>
                   <span className="font-bold text-[#e63946]">{formData.estado}</span>
                </div>
             </div>
          </DialogHeader>

          {/* ÁREA DESPLAZABLE MEJORADA */}
          <div className="flex-1 overflow-y-auto p-8 bg-[#fcfcfc] min-h-0">
             <div className="space-y-8 pb-4">
                {/* Cabecera Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase">Departamento:</Label>
                      <Select value={formData.departamento} onValueChange={(val) => setFormData({...formData, departamento: val})}>
                        <SelectTrigger className="h-8 text-xs font-bold border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Geografía e Historia">Geografía e Historia</SelectItem>
                          <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                          <SelectItem value="Lengua Castellana">Lengua Castellana</SelectItem>
                          <SelectItem value="Inglés">Inglés</SelectItem>
                          <SelectItem value="Educación Física">Educación Física</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase">Coordinación:</Label>
                      <Select value={formData.coordinadorId} onValueChange={(val) => setFormData({...formData, coordinadorId: val})}>
                        <SelectTrigger className="h-8 text-xs font-bold border-gray-300">
                          <SelectValue placeholder="Seleccione profesor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {professors.map(p => <SelectItem key={p.id} value={p.id}>{p.nombrePersona || p.usuario}</SelectItem>)}
                        </SelectContent>
                      </Select>
                   </div>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-bold text-gray-400 uppercase">Título:</Label>
                   <Input 
                    value={formData.titulo} 
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})} 
                    className="h-9 font-bold uppercase border-gray-300"
                   />
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">Descripción: <Pencil className="h-3 w-3 text-[#e63946]" /></Label>
                   <Textarea 
                    value={formData.descripcion} 
                    onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    className="min-h-[80px] text-xs border-gray-300"
                   />
                </div>

                {/* Datos de participación */}
                <div className="space-y-4 pt-4 border-t">
                   <h3 className="text-[#9c4d96] text-[11px] font-bold uppercase tracking-tight">Datos de participación</h3>
                   <div className="flex items-center gap-2 mb-4">
                      <Checkbox id="diag-bilingue" checked={formData.bilingue} onCheckedChange={(val) => setFormData({...formData, bilingue: !!val})} />
                      <Label htmlFor="diag-bilingue" className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer">Actividad sólo para alumnado bilingüe</Label>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] font-bold uppercase text-gray-500">
                      <div className="flex items-center gap-2">
                        <span>Alumnado convocado:</span>
                        <Input type="number" className="w-16 h-7 text-center font-bold text-[#e63946]" value={formData.alumnadoConvocado} onChange={(e) => setFormData({...formData, alumnadoConvocado: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Alumnado participante:</span>
                        <Input type="number" className="w-16 h-7 text-center font-bold text-[#e63946]" value={formData.alumnadoParticipante} onChange={(e) => setFormData({...formData, alumnadoParticipante: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Porcentaje de participación:</span>
                        <span className="text-[#9c4d96]">{formData.alumnadoConvocado > 0 ? ((formData.alumnadoParticipante/formData.alumnadoConvocado)*100).toFixed(0) : 0}%</span>
                      </div>
                   </div>
                </div>

                {/* Aprobación PGA */}
                <div className="space-y-4 pt-4 border-t">
                   <h3 className="text-[#9c4d96] text-[11px] font-bold uppercase tracking-tight">Aprobación de la PGA</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Incluida en la PGA:</span>
                        <RadioGroup className="flex gap-4" value={formData.incluidaPGA ? 'si' : 'no'} onValueChange={(val) => setFormData({...formData, incluidaPGA: val === 'si'})}>
                          <div className="flex items-center space-x-1">
                             <RadioGroupItem value="si" id="pga-si" /> <Label htmlFor="pga-si" className="text-[10px] font-bold uppercase">Sí</Label>
                          </div>
                          <div className="flex items-center space-x-1">
                             <RadioGroupItem value="no" id="pga-no" /> <Label htmlFor="pga-no" className="text-[10px] font-bold uppercase">No</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Fecha aprobación:</span>
                        <Input type="date" value={formData.fechaAprobacion} onChange={(e) => setFormData({...formData, fechaAprobacion: e.target.value})} className="h-7 w-32 text-[10px] font-bold" />
                      </div>
                      <div className="flex items-center gap-2">
                         <Checkbox id="diag-copago" checked={formData.requiereCopago} onCheckedChange={(val) => setFormData({...formData, requiereCopago: !!val})} />
                         <Label htmlFor="diag-copago" className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer">Requiere copago</Label>
                      </div>
                   </div>
                </div>

                {/* Presupuesto */}
                <div className="space-y-4 pt-4 border-t">
                   <h3 className="text-[#9c4d96] text-[11px] font-bold uppercase tracking-tight">Presupuesto de la actividad</h3>
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center text-[10px] font-bold uppercase text-gray-500">
                      <div className="space-y-1">
                         <span>Coste por docente:</span>
                         <Input type="number" step="0.01" className="h-7 border-gray-300" value={formData.costePorDocente} onChange={(e) => setFormData({...formData, costePorDocente: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-1">
                         <span>Coste por alumno:</span>
                         <Input type="number" step="0.01" className="h-7 border-gray-300" value={formData.costePorAlumno} onChange={(e) => setFormData({...formData, costePorAlumno: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-1">
                         <span>Otros costes:</span>
                         <Input type="number" step="0.01" className="h-7 border-gray-300" value={formData.otrosCostes} onChange={(e) => setFormData({...formData, otrosCostes: parseFloat(e.target.value) || 0})} />
                      </div>
                      <div className="pt-5 flex items-center justify-end gap-2">
                         <span>Total:</span>
                         <span className="bg-gray-100 border px-4 py-1 rounded text-gray-800">
                           {((formData.costePorAlumno * formData.alumnadoParticipante) + (formData.costePorDocente * formData.numDocentes) + formData.otrosCostes).toFixed(2)} €
                         </span>
                      </div>
                   </div>
                </div>

                {/* Horario */}
                <div className="space-y-4 pt-4 border-t">
                   <h3 className="text-[#9c4d96] text-[11px] font-bold uppercase tracking-tight">Horario de la actividad</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-[10px] font-bold uppercase text-gray-500">
                      <div className="space-y-4">
                         <div className="flex items-center gap-4">
                            <span className="w-24">Fecha desde:</span>
                            <Input type="date" value={formData.fechaDesde} onChange={(e) => setFormData({...formData, fechaDesde: e.target.value})} className="h-7 border-gray-300" />
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="w-24">Fecha hasta:</span>
                            <Input type="date" value={formData.fechaHasta} onChange={(e) => setFormData({...formData, fechaHasta: e.target.value})} className="h-7 border-gray-300" />
                         </div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-center gap-4">
                            <span className="w-24">Hora de inicio:</span>
                            <Input type="time" value={formData.horaInicio} onChange={(e) => setFormData({...formData, horaInicio: e.target.value})} className="h-7 border-gray-300" />
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="w-24">Hora de fin:</span>
                            <Input type="time" value={formData.horaFin} onChange={(e) => setFormData({...formData, horaFin: e.target.value})} className="h-7 border-gray-300" />
                         </div>
                      </div>
                   </div>
                </div>

                {/* Lugar */}
                <div className="space-y-4 pt-4 border-t">
                   <h3 className="text-[#9c4d96] text-[11px] font-bold uppercase tracking-tight">Lugar de realización</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] font-bold uppercase text-gray-500">
                      <div className="space-y-1">
                         <span>País:</span>
                         <Select value={formData.pais} onValueChange={(val) => setFormData({...formData, pais: val})}>
                            <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="España">España</SelectItem><SelectItem value="Portugal">Portugal</SelectItem><SelectItem value="Francia">Francia</SelectItem></SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-1">
                         <span>Provincia:</span>
                         <Select value={formData.provincia} onValueChange={(val) => setFormData({...formData, provincia: val})}>
                            <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="Badajoz">Badajoz</SelectItem><SelectItem value="Cáceres">Cáceres</SelectItem></SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-1">
                         <span>Municipio:</span>
                         <Select value={formData.municipio} onValueChange={(val) => setFormData({...formData, municipio: val})}>
                            <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="Fregenal de la Sierra">Fregenal de la Sierra</SelectItem><SelectItem value="Mérida">Mérida</SelectItem></SelectContent>
                         </Select>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase">Lugar desarrollo de la actividad:</Label>
                      <Input value={formData.lugarDesarrollo} onChange={(e) => setFormData({...formData, lugarDesarrollo: e.target.value})} className="h-8 border-gray-300" />
                   </div>
                </div>
             </div>
          </div>

          <DialogFooter className="bg-gray-50 p-4 border-t shrink-0">
             <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(false)} className="text-[10px] font-bold uppercase">Cerrar</Button>
             <Button onClick={handleSave} size="sm" className="bg-[#9c4d96] text-white text-[10px] font-bold uppercase gap-2 px-8 shadow-md">
                <Save className="h-3.5 w-3.5" /> Registrar Actividad
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Pencil({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
