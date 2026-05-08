
"use client";

import React, { useState } from 'react';
import { 
  Loader2, 
  Users, 
  FileText, 
  UserCircle,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { AttendanceJustificationView } from './attendance-justification-view';

/**
 * Vista de Función Tutorial de Rayuela.
 * Muestra a los alumnos del grupo que el profesor tutela.
 */
export function TutorialFunctionView({ profesorId, grupoTutorizado }: { profesorId: string, grupoTutorizado: string }) {
  const db = useFirestore();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Query para obtener los alumnos del grupo tutorizado
  const studentsQuery = useMemoFirebase(() => {
    if (!db || !grupoTutorizado) return null;
    return query(
      collection(db, 'usuarios'),
      where('cursoAlumno', '==', grupoTutorizado),
      where('rolesUsuario', 'array-contains', 'EsAlumno')
    );
  }, [db, grupoTutorizado]);

  const { data: students, isLoading } = useCollection(studentsQuery);

  if (isLoading) {
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
           {students.map(student => (
             <div key={student.id} className="itemAlumnoEnClase relative group flex flex-col items-center pt-3 h-[190px] hover:border-[#89a54e] hover:shadow-md transition-all bg-white shadow-sm">
                <Avatar 
                  className="imagenAlumnoEnClase h-[73px] w-[73px] cursor-pointer"
                  onClick={() => setSelectedStudent(student)}
                >
                  <AvatarImage src={student.imagenPerfil} />
                  <AvatarFallback>{student.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="nombreAlumno px-2 mt-2 font-bold text-center text-gray-700" onClick={() => setSelectedStudent(student)}>
                  {student.nombrePersona || student.usuario}
                </div>

                <div className="w-full px-2 mt-auto pb-3">
                   <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedStudent(student)}
                    className="w-full h-8 text-[10px] font-bold uppercase border-gray-200 hover:bg-[#89a54e]/10 text-gray-600 gap-1"
                   >
                     <FileText className="h-3 w-3" /> Ficha Tutoría
                   </Button>
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <UserCircle className="h-4 w-4 text-[#89a54e]" />
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
