
"use client";

import React, { useState } from 'react';
import { 
  Loader2, 
  Key, 
  UserCircle, 
  Users,
  Search,
  CheckCircle2,
  Lock,
  Copy,
  ShieldCheck,
  X
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

/**
 * Vista de alumnos del grupo de tutoría del profesor.
 * Permite listar alumnos y generar nuevas contraseñas de forma segura.
 */
export function MyTutoringStudentsView({ grupoTutorizado }: { grupoTutorizado: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [generatedPassData, setGeneratedPassData] = useState<{name: string, pass: string} | null>(null);

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
    
    // Generar contraseña aleatoria de 8 caracteres (mayúsculas y números)
    const newPassword = Math.random().toString(36).substring(2, 10).toUpperCase();
    const docRef = doc(db, 'usuarios', studentId);
    
    // Actualización no bloqueante en Firestore
    updateDocumentNonBlocking(docRef, { contrasena: newPassword });
    
    // Guardar para mostrar en el modal
    setGeneratedPassData({ name: studentName, pass: newPassword });
  };

  const copyToClipboard = () => {
    if (generatedPassData) {
      navigator.clipboard.writeText(generatedPassData.pass);
      toast({
        title: "Copiado",
        description: "Contraseña copiada al portapapeles.",
      });
    }
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
            <span className="text-sm font-bold text-gray-700 uppercase">Gestión de Claves: {grupoTutorizado}</span>
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
              <p className="text-center py-20 text-gray-400 italic text-sm">No se han encontrado alumnos en este grupo.</p>
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
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 uppercase font-medium">Usuario: {student.usuario}</span>
                        <Badge variant="outline" className="h-4 text-[8px] font-bold border-gray-200 text-gray-400 uppercase gap-1">
                          <Lock className="h-2 w-2" /> Clave Protegida
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
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

      {/* Modal de Contraseña Generada */}
      <Dialog open={!!generatedPassData} onOpenChange={() => setGeneratedPassData(null)}>
        <DialogContent className="max-w-md font-verdana p-0 border-none overflow-hidden shadow-2xl">
          <DialogHeader className="bg-[#89a54e] p-6 text-white shrink-0">
             <div className="flex items-center justify-center gap-3 mb-2">
                <ShieldCheck className="h-6 w-6" />
                <DialogTitle className="text-lg font-bold uppercase tracking-tight">Nueva Clave Generada</DialogTitle>
             </div>
             <DialogDescription className="text-white/90 text-center text-xs font-medium">
               Entregue esta información personalmente al alumno.
             </DialogDescription>
          </DialogHeader>

          <div className="p-8 bg-white space-y-6 text-center">
            <div className="space-y-1">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alumno</span>
               <p className="text-lg font-bold text-gray-800 uppercase">{generatedPassData?.name}</p>
            </div>

            <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-xl relative group">
               <span className="text-[10px] font-bold text-gray-400 uppercase absolute top-2 left-1/2 -translate-x-1/2">Nueva Contraseña</span>
               <p className="text-3xl font-mono font-bold tracking-[0.2em] text-[#89a54e] mt-2">
                 {generatedPassData?.pass}
               </p>
               <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8 text-gray-300 hover:text-[#89a54e]"
                onClick={copyToClipboard}
               >
                 <Copy className="h-4 w-4" />
               </Button>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
               <p className="text-[10px] text-yellow-800 font-bold leading-relaxed uppercase">
                 AVISO: Esta clave solo se mostrará una vez. <br /> Asegúrese de anotarla correctamente.
               </p>
            </div>
          </div>

          <DialogFooter className="bg-gray-50 p-6 border-t shrink-0">
             <Button onClick={() => setGeneratedPassData(null)} className="w-full bg-gray-800 hover:bg-black text-white text-[11px] font-bold uppercase h-12 shadow-md">
               He anotado la clave / Cerrar
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Vista de todos los alumnos del centro (Listado general).
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
            <span className="text-sm font-bold text-gray-700 uppercase">Listado General de Alumnado</span>
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
                    <td colSpan={4} className="p-8 text-center text-gray-400 italic text-sm">No se han encontrado registros en el centro.</td>
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
