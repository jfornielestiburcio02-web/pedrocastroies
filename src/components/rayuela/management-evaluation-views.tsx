
"use client";

import React, { useState } from 'react';
import { 
  Loader2, 
  Settings, 
  Plus, 
  Save, 
  Trash2, 
  Lock, 
  Unlock, 
  BarChart3, 
  GraduationCap,
  CalendarCheck,
  CheckCircle2,
  AlertCircle
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
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * Vista de Apertura de Evaluación para Dirección.
 */
export function EvaluationOpeningView() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    periodo: '1',
    tipoCalificacion: 'Numerica',
    abiertaProfesores: false,
    abiertaAlumnos: false,
    cursoEscolar: '2023-2024'
  });

  const periodosQuery = query(
    collection(db!, 'evaluacionesPeriodos'),
    orderBy('createdAt', 'desc')
  );

  const { data: periodos, isLoading } = useCollection(periodosQuery);

  const handleCreate = () => {
    if (!db) return;
    addDocumentNonBlocking(collection(db, 'evaluacionesPeriodos'), {
      ...formData,
      createdAt: new Date().toISOString()
    });
    toast({ title: "Periodo creado", description: "Se ha registrado la apertura de la evaluación." });
    setIsCreating(false);
  };

  const handleToggleAccess = (id: string, field: 'abiertaProfesores' | 'abiertaAlumnos', value: boolean) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'evaluacionesPeriodos', id), {
      [field]: value
    });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'evaluacionesPeriodos', id));
    toast({ title: "Periodo eliminado", description: "Se ha borrado el registro del centro." });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#9c4d96]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 max-w-5xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#9c4d96] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            <h2 className="font-bold text-lg uppercase tracking-tight">Gestión de Apertura de Evaluación</h2>
          </div>
          <Button onClick={() => setIsCreating(true)} size="sm" className="bg-white text-[#9c4d96] hover:bg-white/90 text-[10px] font-bold uppercase gap-2">
            <Plus className="h-3 w-3" /> Nueva Apertura
          </Button>
        </div>

        {isCreating && (
          <div className="p-8 bg-gray-50 border-b space-y-6 animate-in slide-in-from-top-2 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase">Periodo Evaluativo</Label>
                  <Select value={formData.periodo} onValueChange={(val) => setFormData({...formData, periodo: val})}>
                    <SelectTrigger className="h-10 text-xs font-bold bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1" className="text-xs">1ª Evaluación</SelectItem>
                      <SelectItem value="2" className="text-xs">2ª Evaluación</SelectItem>
                      <SelectItem value="3" className="text-xs">3ª Evaluación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase">Sistema Calificación</Label>
                  <Select value={formData.tipoCalificacion} onValueChange={(val) => setFormData({...formData, tipoCalificacion: val})}>
                    <SelectTrigger className="h-10 text-xs font-bold bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Numerica" className="text-xs">Numérica (0.0 - 10.0)</SelectItem>
                      <SelectItem value="Cualitativa" className="text-xs">Cualitativa (NB, SB...)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase">Curso Escolar</Label>
                  <Input 
                    value={formData.cursoEscolar} 
                    onChange={(e) => setFormData({...formData, cursoEscolar: e.target.value})}
                    className="h-10 text-xs font-bold bg-white"
                  />
                </div>
             </div>

             <div className="flex justify-end gap-4 pt-4 border-t">
               <Button variant="outline" onClick={() => setIsCreating(false)} className="text-[11px] font-bold uppercase h-10 px-6">Cancelar</Button>
               <Button onClick={handleCreate} className="bg-[#9c4d96] hover:bg-[#833d7d] text-white text-[11px] font-bold uppercase h-10 px-8 gap-2 shadow-md">
                 <Save className="h-4 w-4" /> Guardar Apertura
               </Button>
             </div>
          </div>
        )}

        <div className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Periodo / Curso</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Calificación</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Acceso Profesores</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Acceso Alumnos</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {periodos?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 italic text-sm">No hay periodos de evaluación abiertos.</td>
                  </tr>
                ) : (
                  periodos?.map((p) => (
                    <tr key={p.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-700">{p.periodo}ª EVALUACIÓN</span>
                          <span className="text-[10px] text-gray-400 font-bold">{p.cursoEscolar}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-bold uppercase border-none",
                          p.tipoCalificacion === 'Numerica' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                        )}>
                          {p.tipoCalificacion}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                           {p.abiertaProfesores ? <Unlock className="h-3 w-3 text-green-600" /> : <Lock className="h-3 w-3 text-gray-300" />}
                           <Switch 
                            checked={p.abiertaProfesores} 
                            onCheckedChange={(val) => handleToggleAccess(p.id, 'abiertaProfesores', val)} 
                           />
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                           {p.abiertaAlumnos ? <Unlock className="h-3 w-3 text-blue-600" /> : <Lock className="h-3 w-3 text-gray-300" />}
                           <Switch 
                            checked={p.abiertaAlumnos} 
                            onCheckedChange={(val) => handleToggleAccess(p.id, 'abiertaAlumnos', val)} 
                           />
                        </div>
                      </td>
                      <td className="p-4 text-right">
                         <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="h-8 w-8 text-gray-300 hover:text-red-600">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4">
         <AlertCircle className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
         <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-800 uppercase tracking-tight">Información de Seguridad</h4>
            <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
              La activación del **Acceso Profesores** permite al claustro introducir calificaciones en sus respectivos cuadernos. El **Acceso Alumnos** habilita la visualización de las notas finales en la Secretaría Virtual de los estudiantes. Asegúrese de cerrar los periodos tras las juntas de evaluación.
            </p>
         </div>
      </div>
    </div>
  );
}

/**
 * Vista de Resumen (Tasas) para Dirección.
 */
export function GradingStatsView() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-5xl mx-auto w-full">
       <div className="bg-white border rounded-xl p-12 text-center space-y-6 shadow-sm">
          <div className="w-20 h-20 bg-[#9c4d96]/10 text-[#9c4d96] rounded-full flex items-center justify-center mx-auto">
             <BarChart3 className="h-10 w-10" />
          </div>
          <div className="space-y-2">
             <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Resumen de Tasas de Éxito</h2>
             <p className="text-gray-500 italic max-w-lg mx-auto leading-relaxed">
               Este módulo genera informes estadísticos sobre aprobados, suspensos y absentismo por curso y materia una vez cerradas las evaluaciones.
             </p>
          </div>
          <div className="pt-4">
             <Badge className="bg-[#9c4d96] text-white px-4 py-1 font-bold uppercase tracking-widest text-[10px]">Módulo en preparación</Badge>
          </div>
       </div>
    </div>
  );
}
