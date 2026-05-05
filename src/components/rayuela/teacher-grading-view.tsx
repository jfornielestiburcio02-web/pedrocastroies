"use client";

import React, { useState, useMemo } from 'react';
import { 
  Loader2, 
  Lock, 
  Unlock, 
  Save, 
  CheckCircle2, 
  MessageSquare,
  Users
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
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function TeacherGradingView({ profesorId }: { profesorId: string }) {
  const db = useFirestore();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Periodos abiertos
  const periodosQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'evaluacionesPeriodos'), where('abiertaProfesores', '==', true));
  }, [db]);

  const { data: periodos, isLoading: loadingPeriodos } = useCollection(periodosQuery);
  const activePeriodo = periodos?.[0];

  // Grupos del profesor
  const groupsQuery = useMemoFirebase(() => {
    if (!db || !profesorId) return null;
    return query(collection(db, 'gruposAlumnos'), where('profesorId', '==', profesorId));
  }, [db, profesorId]);

  const { data: myGroups, isLoading: loadingGroups } = useCollection(groupsQuery);
  const currentGroup = useMemo(() => myGroups?.find(g => g.id === selectedGroupId), [myGroups, selectedGroupId]);

  // Resolución dinámica de alumnos si el grupo está vinculado a un curso
  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);
  const { data: allUsers } = useCollection(usersQuery);

  const students = useMemo(() => {
    if (!currentGroup || !allUsers) return [];
    
    // Si el grupo es dinámico por curso
    if (currentGroup.cursoVinculado) {
       return allUsers.filter(u => u.cursoAlumno === currentGroup.cursoVinculado && u.rolesUsuario?.includes('EsAlumno'));
    }
    
    // Fallback estático
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
    const docRef = doc(db, 'calificacionesFinales', gradeId);
    const current = existingGrades?.find(g => g.id === gradeId);

    setDocumentNonBlocking(docRef, {
      alumnoId,
      profesorId,
      claseId: selectedGroupId,
      periodoId: activePeriodo.id,
      nota: field === 'nota' ? value : (current?.nota || ""),
      observaciones: field === 'observaciones' ? value : (current?.observaciones || ""),
      createdAt: current?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  if (loadingPeriodos || loadingGroups) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" /></div>;

  if (!activePeriodo) {
    return (
      <div className="py-20 text-center opacity-40">
        <Lock className="h-12 w-12 mx-auto mb-4" />
        <p className="font-bold uppercase">Evaluación Cerrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#89a54e] p-6 text-white flex items-center justify-between rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
           <Unlock className="h-6 w-6" />
           <div>
              <h2 className="text-lg font-bold uppercase">Notas Finales: {activePeriodo.periodo}ª EVAL</h2>
              <p className="text-white/80 text-[10px] font-bold uppercase">{currentGroup?.cursoVinculado ? `Sincronización Censo: ${currentGroup.cursoVinculado}` : 'Carga Manual'}</p>
           </div>
        </div>
        <Select onValueChange={setSelectedGroupId} value={selectedGroupId || ""}>
           <SelectTrigger className="w-[250px] bg-white/10 text-white border-white/20 font-bold">
              <SelectValue placeholder="Seleccione grupo..." />
           </SelectTrigger>
           <SelectContent>
              {myGroups?.map(g => <SelectItem key={g.id} value={g.id} className="font-bold">{g.titulo}</SelectItem>)}
           </SelectContent>
        </Select>
      </div>

      {!selectedGroupId ? (
        <div className="py-20 text-center text-gray-400 italic">Seleccione un grupo de alumnos para calificar.</div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
           <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                 <tr>
                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Alumno</th>
                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center w-32">Nota</th>
                    <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Observaciones</th>
                 </tr>
              </thead>
              <tbody>
                 {students.map(s => {
                    const g = existingGrades?.find(gr => gr.alumnoId === s.id);
                    return (
                       <tr key={s.id} className="border-b hover:bg-gray-50/50">
                          <td className="p-4">
                             <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8"><AvatarImage src={s.imagenPerfil}/><AvatarFallback>{s.usuario?.substring(0,2).toUpperCase()}</AvatarFallback></Avatar>
                                <span className="text-xs font-bold text-gray-700 uppercase">{s.nombrePersona || s.usuario}</span>
                             </div>
                          </td>
                          <td className="p-4">
                             <Input 
                                className="text-center font-bold" 
                                value={g?.nota || ""} 
                                onChange={e => handleUpdateGrade(s.id, 'nota', e.target.value)}
                             />
                          </td>
                          <td className="p-4">
                             <Input 
                                className="text-xs italic" 
                                placeholder="Escriba aquí..."
                                value={g?.observaciones || ""} 
                                onChange={e => handleUpdateGrade(s.id, 'observaciones', e.target.value)}
                             />
                          </td>
                       </tr>
                    );
                 })}
              </tbody>
           </table>
           <div className="p-4 bg-gray-50 border-t flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-[10px] font-bold text-gray-400 uppercase">Sincronización automática de censo activa</span>
           </div>
        </div>
      )}
    </div>
  );
}
