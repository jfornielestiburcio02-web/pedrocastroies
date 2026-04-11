
"use client";

import React, { useMemo } from 'react';
import { 
  Loader2, 
  GraduationCap, 
  Search, 
  BookOpen, 
  MessageSquare,
  FileText
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function TutoringGradesView({ grupoTutorizado }: { grupoTutorizado: string }) {
  const db = useFirestore();

  // 1. Obtener periodo activo (el que está abierto para profesores para que el tutor vea las notas en tiempo real)
  const periodosQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'evaluacionesPeriodos'),
      where('abiertaProfesores', '==', true),
      orderBy('createdAt', 'desc')
    );
  }, [db]);

  const { data: periodos, isLoading: loadingPeriodos } = useCollection(periodosQuery);
  const activePeriodo = periodos?.[0];

  // 2. Obtener alumnos de la tutoría
  const studentsQuery = useMemoFirebase(() => {
    if (!db || !grupoTutorizado) return null;
    return query(
      collection(db, 'usuarios'),
      where('cursoAlumno', '==', grupoTutorizado),
      where('rolesUsuario', 'array-contains', 'EsAlumno')
    );
  }, [db, grupoTutorizado]);

  const { data: students, isLoading: loadingStudents } = useCollection(studentsQuery);

  // 3. Obtener todas las calificaciones finales del periodo activo
  const gradesQuery = useMemoFirebase(() => {
    if (!db || !activePeriodo) return null;
    return query(
      collection(db, 'calificacionesFinales'),
      where('periodoId', '==', activePeriodo.id)
    );
  }, [db, activePeriodo]);

  const { data: allGrades } = useCollection(gradesQuery);

  // 4. Obtener asignaturas para mapear nombres
  const schedulesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'horarios');
  }, [db]);
  const { data: allSchedules } = useCollection(schedulesQuery);

  const getAsignaturaName = (claseId: string) => {
    const schedule = allSchedules?.find(s => s.id === claseId);
    return schedule?.asignatura || "Materia desconocida";
  };

  if (loadingPeriodos || loadingStudents) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" />
      </div>
    );
  }

  if (!activePeriodo) {
    return (
      <div className="py-20 text-center opacity-50">
        <GraduationCap className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <p className="text-sm font-bold uppercase text-gray-400">No hay periodos de evaluación abiertos</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-7xl mx-auto w-full font-verdana">
      <div className="bg-[#89a54e] p-6 text-white rounded-xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg"><GraduationCap className="h-6 w-6" /></div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-tight">Seguimiento de Notas: Tutoría {grupoTutorizado}</h2>
            <p className="text-white/80 text-sm">Resumen de calificaciones finales del grupo para el periodo activo.</p>
          </div>
        </div>
        <Badge className="bg-white text-[#89a54e] font-bold uppercase px-4 py-1.5 border-none">
          {activePeriodo.periodo}ª EVALUACIÓN
        </Badge>
      </div>

      <ScrollArea className="h-[650px] pr-4">
        <div className="space-y-8">
          {students?.map((student) => {
            const studentGrades = allGrades?.filter(g => g.alumnoId === student.id) || [];
            
            return (
              <div key={student.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 border-b p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarImage src={student.imagenPerfil} />
                      <AvatarFallback>{student.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-700 uppercase">{student.nombrePersona || student.usuario}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Expediente: {student.id.substring(0, 8)}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold border-gray-200 text-gray-500 uppercase">
                    {studentGrades.length} Materias calificadas
                  </Badge>
                </div>

                <div className="p-0">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-100/50 border-b">
                      <tr>
                        <th className="p-3 text-[10px] font-bold text-gray-400 uppercase w-1/3">Asignatura</th>
                        <th className="p-3 text-[10px] font-bold text-gray-400 uppercase text-center w-24">Calificación</th>
                        <th className="p-3 text-[10px] font-bold text-gray-400 uppercase">Observaciones del Profesor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentGrades.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-[11px] text-gray-400 italic uppercase">
                            No constan calificaciones finales registradas para este alumno.
                          </td>
                        </tr>
                      ) : (
                        studentGrades.map((grade) => (
                          <tr key={grade.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-3.5 w-3.5 text-[#89a54e]" />
                                <span className="text-xs font-bold text-gray-600 uppercase">{getAsignaturaName(grade.claseId)}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex justify-center">
                                <Badge className={cn(
                                  "text-[11px] font-bold px-3 py-0.5 border-none",
                                  grade.nota === 'IN' || parseFloat(grade.nota) < 5 
                                    ? "bg-red-100 text-red-700" 
                                    : "bg-green-100 text-green-700"
                                )}>
                                  {grade.nota}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-3">
                              {grade.observaciones ? (
                                <div className="flex items-start gap-2 text-[10px] text-gray-500 italic leading-tight">
                                  <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                                  <span>{grade.observaciones}</span>
                                </div>
                              ) : (
                                <span className="text-[9px] text-gray-300 italic">Sin observaciones</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
        <FileText className="h-5 w-5 text-blue-600" />
        <p className="text-[10px] text-blue-800 font-bold uppercase leading-relaxed">
          Como tutor, usted tiene acceso a las calificaciones de todas las materias de sus alumnos tutorizados. <br />
          Esta información es confidencial y solo debe ser tratada en el ámbito de la sesión de evaluación.
        </p>
      </div>
    </div>
  );
}
