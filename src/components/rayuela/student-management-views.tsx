
"use client";

import React, { useState } from 'react';
import { 
  Loader2, 
  Key, 
  UserCircle, 
  Users,
  Search,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * Vista de alumnos del grupo de tutoría del profesor.
 * Permite listar alumnos y generar nuevas contraseñas.
 */
export function MyTutoringStudentsView({ grupoTutorizado }: { grupoTutorizado: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const studentsQuery = useMemoFirebase(() => {
    if (!db || !grupoTutorizado) return null;
    return query(
      collection(db, 'usuarios'),
      where('cursoAlumno', '==', grupoTutorizado),
      where('rolesUsuario', 'array-contains', 'EsAlumno')
    );
  }, [db, grupoTutorizado]);

  const { data: students, isLoading } = useCollection(studentsQuery);

  const handleGeneratePassword = (studentId: string, studentName: string) => {
    if (!db) return;
    
    // Generar contraseña aleatoria de 8 caracteres
    const newPassword = Math.random().toString(36).substring(2, 10).toUpperCase();
    const docRef = doc(db, 'usuarios', studentId);
    
    updateDocumentNonBlocking(docRef, { contrasena: newPassword });
    
    toast({
      title: "Contraseña Actualizada",
      description: `Nueva clave para ${studentName}: ${newPassword}`,
      duration: 10000,
    });
  };

  const filteredStudents = students?.filter(s => 
    (s.nombrePersona || s.usuario).toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-5xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="bg-[#f8f9fa] border-b p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserCircle className="h-5 w-5 text-[#89a54e]" />
            <span className="text-sm font-bold text-gray-700 uppercase">Alumnado de mi Tutoría: {grupoTutorizado}</span>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <Input 
              placeholder="Buscar por nombre..." 
              className="pl-8 h-8 text-[11px] border-gray-300" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredStudents.length === 0 ? (
              <p className="text-center py-20 text-gray-400 italic text-sm">No se han encontrado alumnos.</p>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarImage src={student.imagenPerfil} />
                      <AvatarFallback>{student.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-700">{student.nombrePersona || student.usuario}</span>
                      <span className="text-[10px] text-gray-400 uppercase font-medium">Usuario: {student.usuario}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end mr-4">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Clave Actual:</span>
                      <span className="text-xs font-mono font-bold text-primary">{student.contrasena || 'No definida'}</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleGeneratePassword(student.id, student.nombrePersona || student.usuario)}
                      className="bg-[#89a54e] hover:bg-[#728a41] text-white text-[10px] font-bold uppercase h-8 px-4 gap-2"
                    >
                      <Key className="h-3 w-3" /> Sacar nueva contraseña
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

/**
 * Vista de todos los alumnos del centro.
 */
export function CenterStudentsView() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  const centerQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'usuarios'),
      where('rolesUsuario', 'array-contains', 'EsAlumno')
    );
  }, [db]);

  const { data: students, isLoading } = useCollection(centerQuery);

  const filteredStudents = students?.filter(s => 
    (s.nombrePersona || s.usuario).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.cursoAlumno || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-5xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="bg-[#f8f9fa] border-b p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[#89a54e]" />
            <span className="text-sm font-bold text-gray-700 uppercase">Alumnado del Centro</span>
            <Badge variant="secondary" className="text-[9px] font-bold bg-gray-200 text-gray-500">{students?.length || 0} TOTAL</Badge>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <Input 
              placeholder="Buscar por nombre o curso..." 
              className="pl-8 h-8 text-[11px] border-gray-300" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-0">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Alumno</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Curso</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Usuario</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400 italic text-sm">No se han encontrado registros.</td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.imagenPerfil} />
                            <AvatarFallback>{student.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-bold text-gray-700">{student.nombrePersona || student.usuario}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-[10px] font-bold border-gray-300 text-gray-500">{student.cursoAlumno || 'S/C'}</Badge>
                      </td>
                      <td className="p-4 text-xs font-medium text-gray-500">{student.usuario}</td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Activo
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
