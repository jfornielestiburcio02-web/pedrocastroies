
"use client";

import React, { useState, useMemo } from 'react';
import { 
  Loader2, 
  Lock, 
  Unlock, 
  Save, 
  CheckCircle2, 
  MessageSquare,
  AlertTriangle,
  Users,
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { collection, query, where, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function TeacherGradingView({ profesorId }: { profesorId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // 1. Obtener periodos de evaluación abiertos para profesores
  const periodosQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'evaluacionesPeriodos'),
      where('abiertaProfesores', '==', true)
    );
  }, [db]);

  const { data: periodos, isLoading: loadingPeriodos } = useCollection(periodosQuery);
  const activePeriodo = periodos?.[0]; // Tomamos el primero abierto

  // 2. Obtener GRUPOS del profesor
  const groupsQuery = useMemoFirebase(() => {
    if (!db || !profesorId) return null;
    return query(
      collection(db, 'gruposAlumnos'),
      where('profesorId', '==', profesorId)
    );
  }, [db, profesorId]);

  const { data: myGroups, isLoading: loadingGroups } = useCollection(groupsQuery);
  
  const currentGroup = useMemo(() => myGroups?.find(g => g.id === selectedGroupId), [myGroups, selectedGroupId]);

  // 3. Obtener alumnos del grupo y sus notas existentes
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);
  const { data: allUsers } = useCollection(usersQuery);

  const students = useMemo(() => {
    if (!currentGroup || !allUsers) return [];
    return allUsers.filter(u => currentGroup.alumnosIds?.includes(u.id));
  }, [currentGroup, allUsers]);

  const gradesQuery = useMemoFirebase(() => {
    if (!db || !selectedGroupId || !activePeriodo) return null;
    return query(
      collection(db, 'calificacionesFinales'),
      where('claseId', '==', selectedGroupId),
      where('periodoId', '==', activePeriodo.id)
    );
  }, [db, selectedGroupId, activePeriodo]);

  const { data: existingGrades } = useCollection(gradesQuery);

  const handleUpdateGrade = (alumnoId: string, field: 'nota' | 'observaciones', value: string) => {
    if (!db || !activePeriodo || !selectedGroupId) return;

    const gradeId = `${alumnoId}_${selectedGroupId}_${activePeriodo.id}`;
    const gradeRef = doc(db, 'calificacionesFinales', gradeId);
    
    const currentGrade = existingGrades?.find(g => g.id === gradeId);

    const updateData = {
      alumnoId,
      profesorId,
      claseId: selectedGroupId, // Usamos el ID del grupo como referencia de clase
      periodoId: activePeriodo.id,
      nota: currentGrade?.nota || "",
      observaciones: currentGrade?.observaciones || "",
      createdAt: currentGrade?.createdAt || new Date().toISOString(),
      [field]: value
    };

    setDocumentNonBlocking(gradeRef, updateData, { merge: true });
  };

  if (loadingPeriodos || loadingGroups) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" />
      </div>
    );
  }

  if (!activePeriodo) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 border border-red-100">
          <Lock className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Evaluación Cerrada</h2>
          <p className="text-gray-400 italic max-w-sm mx-auto leading-relaxed">
            No existe ningún periodo de evaluación abierto por Dirección para la entrada de notas finales.
          </p>
        </div>
      </div>
    );
  }

  const cualitativeOptions = ["IN", "SU", "BI", "NT", "SB"];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-7xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#89a54e] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg"><Unlock className="h-6 w-6" /></div>
            <div>
              <h2 className="text-lg font-bold uppercase tracking-tight">Calificar Notas Finales: {activePeriodo.periodo}ª EVAL</h2>
              <p className="text-white/80 text-[10px] font-bold uppercase">Sistema: {activePeriodo.tipoCalificacion} | {activePeriodo.cursoEscolar}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <Label className="text-[10px] font-bold text-white/70 uppercase shrink-0">Seleccione Grupo:</Label>
             <Select onValueChange={setSelectedGroupId} value={selectedGroupId || ""}>
               <SelectTrigger className="h-10 bg-white/10 border-white/20 text-white font-bold text-xs min-w-[220px]">
                 <SelectValue placeholder="Elija un grupo de alumnos..." />
               </SelectTrigger>
               <SelectContent>
                 {myGroups?.map(g => (
                   <SelectItem key={g.id} value={g.id} className="text-xs font-bold">{g.titulo}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>
        </div>

        {!selectedGroupId ? (
          <div className="p-20 text-center space-y-4 opacity-40">
             <div className="bg-gray-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto text-gray-300">
               <Users className="h-8 w-8" />
             </div>
             <p className="text-sm italic text-gray-500">Seleccione un grupo de alumnos para cargar la sábana de notas finales.</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="p-0">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase w-1/4">Alumno</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center w-32">Nota Final</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Observaciones Pedagógicas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const gradeId = `${student.id}_${selectedGroupId}_${activePeriodo.id}`;
                      const currentGrade = existingGrades?.find(g => g.id === gradeId);
                      
                      return (
                        <tr key={student.id} className="border-b hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border shadow-sm">
                                <AvatarImage src={student.imagenPerfil} />
                                <AvatarFallback className="text-[10px]">{student.usuario?.substring(0,2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-gray-700">{student.nombrePersona || student.usuario}</span>
                                <span className="text-[10px] text-gray-400 font-medium">Exp: {student.id.substring(0,6)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                             <div className="flex justify-center">
                               {activePeriodo.tipoCalificacion === 'Numerica' ? (
                                 <Input 
                                   type="text"
                                   className="w-20 h-9 text-center text-xs font-bold border-gray-300 bg-white"
                                   placeholder="0.0"
                                   value={currentGrade?.nota || ""}
                                   onChange={(e) => handleUpdateGrade(student.id, 'nota', e.target.value)}
                                 />
                               ) : (
                                 <Select value={currentGrade?.nota || ""} onValueChange={(val) => handleUpdateGrade(student.id, 'nota', val)}>
                                   <SelectTrigger className="w-24 h-9 text-xs font-bold border-gray-300 bg-white">
                                     <SelectValue placeholder="-" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     {cualitativeOptions.map(opt => (
                                       <SelectItem key={opt} value={opt} className="text-xs font-bold">{opt}</SelectItem>
                                     ))}
                                   </SelectContent>
                                 </Select>
                               )}
                             </div>
                          </td>
                          <td className="p-4">
                            <div className="relative group">
                               <Textarea 
                                 className="min-h-[40px] h-9 text-[11px] py-2 resize-none border-gray-200 focus:min-h-[80px] transition-all bg-white"
                                 placeholder="Introduzca comentarios para el boletín..."
                                 value={currentGrade?.observaciones || ""}
                                 onChange={(e) => handleUpdateGrade(student.id, 'observaciones', e.target.value)}
                               />
                               <MessageSquare className="absolute right-2 top-2 h-3.5 w-3.5 text-gray-200 group-focus-within:text-[#89a54e]" />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
               </table>
            </div>
          </ScrollArea>
        )}
        
        <div className="bg-gray-50 border-t p-4 flex items-center justify-between px-8">
           <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
             <CheckCircle2 className="h-4 w-4 text-green-500" />
             Guardado automático activo - Rayuela CM
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-bold uppercase">
                <AlertTriangle className="h-3.5 w-3.5" />
                Los cambios se verán reflejados en la Secretaría Virtual del Alumno
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
