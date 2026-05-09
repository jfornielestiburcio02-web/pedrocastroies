"use client";

import React, { useState, useMemo } from 'react';
import { 
  Loader2, 
  Users, 
  FileText, 
  UserCircle,
  Search,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { AttendanceJustificationView } from './attendance-justification-view';

/**
 * Vista de Función Tutorial de Rayuela.
 * Muestra a los alumnos del grupo que el profesor tutela con contadores de faltas.
 */
export function TutorialFunctionView({ profesorId, grupoTutorizado }: { profesorId: string, grupoTutorizado: string }) {
  const db = useFirestore();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // 1. Query para obtener los alumnos del grupo tutorizado
  const studentsQuery = useMemoFirebase(() => {
    if (!db || !grupoTutorizado) return null;
    return query(
      collection(db, 'usuarios'),
      where('cursoAlumno', '==', grupoTutorizado),
      where('rolesUsuario', 'array-contains', 'EsAlumno')
    );
  }, [db, grupoTutorizado]);

  const { data: students, isLoading: loadingStudents } = useCollection(studentsQuery);

  // 2. Query para obtener todas las asistencias del grupo para calcular los contadores
  const attendancesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'asistenciasInasistencias'),
      where('tipo', '==', 'I')
    );
  }, [db]);

  const { data: allAbsences, isLoading: loadingAbsences } = useCollection(attendancesQuery);

  if (loadingStudents || loadingAbsences) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" />
      </div>
    );
  }

  if (selectedStudent) {
    return (
      <AttendanceJustificationView 
        alumno={selectedStudent} 
        profesorId={profesorId}
        onClose={() => setSelectedStudent(null)} 
      />
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-6xl mx-auto w-full font-verdana">
      <div className="bg-[#89a54e] p-6 text-white rounded-xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg"><Users className="h-6 w-6" /></div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-tight">Gestión de Tutoría: {grupoTutorizado}</h2>
            <p className="text-white/80 text-sm">Pulse sobre la imagen del alumno para gestionar su asistencia y justificaciones.</p>
          </div>
        </div>
        <Badge className="bg-white text-[#89a54e] font-bold uppercase px-4 py-1.5 border-none">Grupo Activo</Badge>
      </div>

      {!students || students.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
           <div className="bg-gray-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto text-gray-400">
             <Search className="h-8 w-8" />
           </div>
           <p className="text-gray-500 italic text-sm">No se han encontrado alumnos registrados en el grupo {grupoTutorizado}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 justify-items-center">
           {students.map(student => {
             // Calcular faltas específicas para este alumno
             const studentAbsences = allAbsences?.filter(a => a.alumnoId === student.id) || [];
             const classAbsencesCount = studentAbsences.filter(a => !a.isFullDay).length;
             const fullDayAbsencesCount = studentAbsences.filter(a => a.isFullDay).length;

             return (
               <div key={student.id} className="itemAlumnoEnClase relative group flex flex-col items-center hover:border-[#89a54e] hover:shadow-md transition-all bg-white shadow-sm pb-4">
                  <Avatar 
                    className="imagenAlumnoEnClase h-[73px] w-[73px] cursor-pointer"
                    onClick={() => setSelectedStudent(student)}
                  >
                    <AvatarImage src={student.imagenPerfil} />
                    <AvatarFallback>{student.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="nombreAlumno px-2 mt-2 font-bold text-center text-gray-700 h-auto min-h-0 mb-4" onClick={() => setSelectedStudent(student)}>
                    {student.nombrePersona || student.usuario}
                  </div>

                  <div className="w-full px-2 space-y-2 mt-auto">
                     {/* Contador Amarillo: Faltas por clase */}
                     <div className="flex items-center justify-between bg-[#FFCD2D] rounded px-2 py-1.5 shadow-sm border border-yellow-400">
                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-tighter">Injustif. Clases</span>
                        <span className="text-[12px] font-black text-gray-800">{classAbsencesCount}</span>
                     </div>

                     {/* Contador Naranja: Faltas Día Completo */}
                     <div className="flex items-center justify-between bg-[#EB8A5F] rounded px-2 py-1.5 shadow-sm border border-orange-400">
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter">Inj. Día Completo</span>
                        <span className="text-[12px] font-black text-white">{fullDayAbsencesCount}</span>
                     </div>
                  </div>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <UserCircle className="h-4 w-4 text-[#89a54e]" />
                  </div>
               </div>
             );
           })}
        </div>
      )}
    </div>
  );
}
