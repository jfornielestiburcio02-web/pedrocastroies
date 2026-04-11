
"use client";

import React, { useState, useMemo } from 'react';
import { 
  Loader2, 
  UserPlus, 
  Save, 
  Trash2, 
  Key, 
  GraduationCap, 
  Search, 
  ShieldCheck, 
  CheckCircle2,
  Copy,
  Users,
  Image as ImageIcon
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, doc, getDocs } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * Vista de Creación de Usuarios para Dirección.
 */
export function UserCreationView() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    imagenPerfil: '',
    roles: [] as string[],
    curso: ''
  });

  const rolesOptions = [
    { id: 'EsProfesor', label: 'Profesor' },
    { id: 'EsAlumno', label: 'Alumno' },
    { id: 'EsDireccion', label: 'Dirección' },
    { id: 'EsCau', label: 'CAU' },
    { id: 'EsSecretaria', label: 'Secretaría' }
  ];

  const handleCreate = async () => {
    if (!db || !formData.nombre || !formData.apellidos || formData.roles.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Complete el nombre, apellidos y al menos un rol." });
      return;
    }

    setIsSaving(true);
    
    // Generar ID de usuario amigable: p.ej "juan.perez"
    const usuarioId = `${formData.nombre.toLowerCase().replace(/\s/g, '')}.${formData.apellidos.toLowerCase().split(' ')[0]}`;
    const userRef = doc(db, 'usuarios', usuarioId);

    const defaultImage = "https://rayuela.educarex.es/secvir/cec/alumnos/fotoAlumnoServlet?dniEmpleado=xImagenEmpleadox";

    const userData = {
      usuario: usuarioId,
      nombrePersona: `${formData.nombre} ${formData.apellidos}`,
      email: `${usuarioId}@rayuela.edu`,
      contrasena: 'rayuela123', // Clave inicial
      imagenPerfil: formData.imagenPerfil || defaultImage,
      rolesUsuario: formData.roles,
      cursoAlumno: formData.roles.includes('EsAlumno') ? formData.curso : '',
      createdAt: new Date().toISOString()
    };

    setDocumentNonBlocking(userRef, userData, { merge: true });

    toast({ 
      title: "Usuario Creado", 
      description: `Se ha registrado a ${userData.nombrePersona} con el ID: ${usuarioId}` 
    });

    setFormData({ nombre: '', apellidos: '', imagenPerfil: '', roles: [], curso: '' });
    setIsSaving(false);
  };

  const toggleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId) 
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId]
    }));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-4xl mx-auto w-full">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="bg-[#9c4d96] p-6 text-white flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight">Alta de Nuevo Usuario</h2>
            <p className="text-white/80 text-xs font-medium uppercase">Registro oficial en la plataforma Rayuela</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</Label>
                  <Input 
                    placeholder="Ej: Juan" 
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="border-gray-300 font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase">Apellidos</Label>
                  <Input 
                    placeholder="Ej: Pérez García" 
                    value={formData.apellidos}
                    onChange={(e) => setFormData({...formData, apellidos: e.target.value})}
                    className="border-gray-300 font-bold text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">URL Imagen de Perfil (Opcional)</Label>
                <div className="flex gap-2">
                  <div className="bg-gray-100 p-2 rounded-lg border">
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input 
                    placeholder="https://ejemplo.com/foto.jpg" 
                    value={formData.imagenPerfil}
                    onChange={(e) => setFormData({...formData, imagenPerfil: e.target.value})}
                    className="border-gray-300 text-xs italic"
                  />
                </div>
                <p className="text-[9px] text-gray-400 italic">Si se deja vacío, se asignará la imagen oficial por defecto.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">Asignación de Roles</Label>
                <div className="grid grid-cols-2 gap-3">
                  {rolesOptions.map(role => (
                    <div 
                      key={role.id} 
                      onClick={() => toggleRole(role.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        formData.roles.includes(role.id) 
                          ? "bg-purple-50 border-[#9c4d96] shadow-sm" 
                          : "bg-gray-50 border-transparent hover:bg-white hover:border-gray-200"
                      )}
                    >
                      <Checkbox checked={formData.roles.includes(role.id)} />
                      <span className="text-[11px] font-bold text-gray-700 uppercase">{role.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {formData.roles.includes('EsAlumno') && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase">Curso Asignado</Label>
                  <Input 
                    placeholder="Ej: 4º ESO A" 
                    value={formData.curso}
                    onChange={(e) => setFormData({...formData, curso: e.target.value})}
                    className="border-gray-300 font-bold text-sm bg-blue-50/30"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="pt-8 border-t flex items-center justify-between">
             <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span className="text-[10px] font-bold text-blue-800 uppercase">Proceso de Alta Protegido</span>
             </div>
             <Button 
              onClick={handleCreate} 
              disabled={isSaving}
              className="bg-[#9c4d96] hover:bg-[#833d7d] text-white px-10 h-12 text-[11px] font-bold uppercase tracking-widest gap-2 shadow-lg"
             >
               {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
               Crear Usuario
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Vista de Visualización y Gestión de Usuarios para Dirección.
 */
export function UserManagementListView() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [generatedPass, setGeneratedPass] = useState<{name: string, pass: string} | null>(null);
  const [designatingTutorId, setDesignatingTutorId] = useState<string | null>(null);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);

  const { data: allUsers, isLoading } = useCollection(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    return allUsers.filter(u => 
      (u.nombrePersona || u.usuario).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.usuario).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);

  const existingCourses = useMemo(() => {
    if (!allUsers) return [];
    const courses = allUsers
      .map(u => u.cursoAlumno)
      .filter(c => c && c !== "");
    return Array.from(new Set(courses));
  }, [allUsers]);

  const handleGenerateKey = (userId: string, name: string) => {
    const newPass = Math.random().toString(36).substring(2, 10).toUpperCase();
    updateDocumentNonBlocking(doc(db!, 'usuarios', userId), { contrasena: newPass });
    setGeneratedPass({ name, pass: newPass });
  };

  const handleAssignTutor = (userId: string, curso: string) => {
    // Radix UI Select no permite "" como valor de Item, por lo que usamos "NONE" para resetear
    const cursoToSave = curso === "NONE" ? "" : curso;
    
    updateDocumentNonBlocking(doc(db!, 'usuarios', userId), { esTutor: cursoToSave });
    
    if (curso === "NONE") {
      toast({ title: "Tutoría Revocada", description: "Se ha eliminado la asignación de grupo." });
    } else {
      toast({ title: "Tutoría Asignada", description: `Profesor designado como tutor de ${curso}` });
    }
    setDesignatingTutorId(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("¿Está seguro de eliminar este usuario? Esta acción es irreversible.")) {
      deleteDocumentNonBlocking(doc(db!, 'usuarios', userId));
      toast({ title: "Usuario Eliminar", description: "El registro ha sido borrado de la plataforma." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#9c4d96]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-6xl mx-auto w-full">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        <div className="bg-[#f8f9fa] border-b p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-[#9c4d96]" />
            <span className="text-sm font-bold text-gray-700 uppercase">Censo General de Usuarios</span>
            <Badge className="bg-gray-100 text-gray-500 border-none text-[10px] font-bold">{allUsers?.length || 0} REGISTROS</Badge>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <Input 
              placeholder="Buscar por nombre, apellidos o usuario..." 
              className="pl-8 h-9 text-[11px] border-gray-300" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-0">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Identificación</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Roles</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Grupo/Tutoría</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Acciones de Gestión</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border shadow-sm shrink-0">
                          <AvatarImage src={user.imagenPerfil} />
                          <AvatarFallback>{user.usuario?.substring(0,2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-gray-800 truncate">{user.nombrePersona || user.usuario}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">ID: {user.usuario}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {user.rolesUsuario?.map((r: string) => (
                          <Badge key={r} variant="outline" className="text-[8px] font-bold uppercase border-gray-200 bg-white">
                            {r.replace('Es', '')}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        {user.cursoAlumno && <Badge className="w-fit bg-blue-50 text-blue-700 text-[9px] font-bold border-none">ALUMNO: {user.cursoAlumno}</Badge>}
                        {user.esTutor && <Badge className="w-fit bg-orange-50 text-orange-700 text-[9px] font-bold border-none">TUTOR: {user.esTutor}</Badge>}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {user.rolesUsuario?.includes('EsProfesor') && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setDesignatingTutorId(user.id)}
                            className="h-8 px-2 text-[9px] font-bold text-[#9c4d96] uppercase hover:bg-purple-50"
                          >
                            <GraduationCap className="h-3 w-3 mr-1" /> Designar Tutor
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleGenerateKey(user.id, user.nombrePersona || user.usuario)}
                          className="h-8 px-2 text-[9px] font-bold text-[#fb8500] uppercase hover:bg-orange-50"
                        >
                          <Key className="h-3 w-3 mr-1" /> Sacar Claves
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteUser(user.id)}
                          className="h-8 w-8 p-0 text-gray-300 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </div>

      {/* Modal Claves Generadas */}
      <Dialog open={!!generatedPass} onOpenChange={() => setGeneratedPass(null)}>
        <DialogContent className="max-w-md font-verdana p-0 border-none overflow-hidden">
          <DialogHeader className="bg-[#fb8500] p-6 text-white text-center shrink-0">
             <div className="flex justify-center mb-2"><Key className="h-8 w-8" /></div>
             <DialogTitle className="text-lg font-bold uppercase tracking-widest">Credenciales de Acceso</DialogTitle>
             <DialogDescription className="text-white/80 text-xs font-medium uppercase">DOCUMENTO PARA ENTREGA PERSONAL</DialogDescription>
          </DialogHeader>
          <div className="p-8 bg-white space-y-6 text-center">
             <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Interesado</span>
                <p className="text-xl font-bold text-gray-800 uppercase">{generatedPass?.name}</p>
             </div>
             <div className="bg-gray-50 border-2 border-dashed p-6 rounded-xl relative group">
                <span className="text-[10px] font-bold text-gray-400 uppercase absolute top-2 left-1/2 -translate-x-1/2">Nueva Contraseña</span>
                <p className="text-3xl font-mono font-bold tracking-[0.2em] text-[#fb8500] mt-2">{generatedPass?.pass}</p>
                <Button 
                  variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-gray-300 hover:text-orange-600"
                  onClick={() => { navigator.clipboard.writeText(generatedPass?.pass || ''); toast({ title: "Copiado" }); }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
             </div>
             <p className="text-[9px] text-gray-400 italic">Este usuario deberá cambiar su clave tras el primer acceso en su menú de configuración.</p>
          </div>
          <DialogFooter className="bg-gray-50 p-4 border-t">
             <Button onClick={() => setGeneratedPass(null)} className="w-full bg-gray-800 hover:bg-black text-white text-[11px] font-bold uppercase h-10 shadow-md">Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Designar Tutor */}
      <Dialog open={!!designatingTutorId} onOpenChange={() => setDesignatingTutorId(null)}>
        <DialogContent className="max-w-md font-verdana p-0 border-none overflow-hidden">
          <DialogHeader className="bg-[#9c4d96] p-6 text-white shrink-0">
             <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
               <GraduationCap className="h-5 w-5" /> Designar Tutoría de Grupo
             </DialogTitle>
          </DialogHeader>
          <div className="p-8 bg-white space-y-6">
             <div className="space-y-3">
                <Label className="text-[10px] font-bold text-gray-400 uppercase">Seleccione el curso a tutorizar</Label>
                <Select onValueChange={(val) => handleAssignTutor(designatingTutorId!, val)}>
                  <SelectTrigger className="h-12 border-gray-300 font-bold text-sm">
                    <SelectValue placeholder="Elija un grupo del centro..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE" className="text-red-600 italic">-- Eliminar Tutoría --</SelectItem>
                    {existingCourses.map(c => (
                      <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
             <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-[#9c4d96] shrink-0" />
                <p className="text-[10px] text-purple-800 font-bold leading-relaxed uppercase">
                  Al designar a un profesor como tutor, éste tendrá acceso completo a las evaluaciones, faltas y expedientes de todos los alumnos de dicho grupo.
                </p>
             </div>
          </div>
          <DialogFooter className="bg-gray-50 p-4 border-t">
             <Button variant="outline" onClick={() => setDesignatingTutorId(null)} className="text-[11px] font-bold uppercase h-10">Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
