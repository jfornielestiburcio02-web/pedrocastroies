
"use client";

import React, { useState, useMemo } from 'react';
import { 
  Loader2, 
  Users, 
  UserPlus, 
  CheckCircle2, 
  Save, 
  ShieldCheck, 
  ArrowRight,
  UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';

export function ProaDesignationView({ mode }: { mode: 'proa' | 'dad' }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedTeacherId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Obtener todos los profesores
  const teachersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'usuarios'), where('rolesUsuario', 'array-contains', 'EsProfesor'));
  }, [db]);

  const { data: teachers, isLoading } = useCollection(teachersQuery);

  const handleDesignateProa = async () => {
    if (!db || !selectedTeacherId) return;
    setIsSaving(true);
    
    const teacher = teachers?.find(t => t.id === selectedTeacherId);
    const currentProfiles = teacher?.perfilesAdicionales || [];
    
    if (!currentProfiles.includes('PROA+')) {
      // 1. Guardar en Colección Usuarios
      await updateDoc(doc(db, 'usuarios', selectedTeacherId), {
        perfilesAdicionales: [...currentProfiles, 'PROA+']
      });

      // 2. Guardar en Colección Designaciones (Histórico)
      await addDocumentNonBlocking(collection(db, 'designaciones'), {
        tipo: 'PROA',
        profesorId: selectedTeacherId,
        fecha: new Date().toISOString(),
        autor: 'DIRECCION'
      });

      toast({ title: "Designación PROA+ Exitosa", description: "El profesor ya dispone del perfil PROA+." });
    } else {
      toast({ title: "Información", description: "El profesor ya tiene asignado este perfil." });
    }
    
    setIsSaving(false);
    setSelectedGroupId(null);
  };

  const handleDesignateDad = async () => {
    if (!db || !selectedTeacherId || !selectedTargetId) {
      toast({ variant: "destructive", title: "Error", description: "Seleccione ambos profesores para el desdoble." });
      return;
    }
    setIsSaving(true);

    const supportTeacher = teachers?.find(t => t.id === selectedTeacherId);
    const currentProfiles = supportTeacher?.perfilesAdicionales || [];

    // 1. Guardar en Colección Usuarios (Dato Crítico para Lógica)
    await updateDoc(doc(db, 'usuarios', selectedTeacherId), {
      perfilesAdicionales: Array.from(new Set([...currentProfiles, 'PROFESORdad+'])),
      esDADDe: selectedTargetId
    });

    // 2. Guardar en Colección Designaciones (Histórico Solicitado)
    await addDocumentNonBlocking(collection(db, 'designaciones'), {
      tipo: 'DAD',
      profesorId: selectedTeacherId,
      titularId: selectedTargetId,
      fecha: new Date().toISOString(),
      autor: 'DIRECCION'
    });

    const targetName = teachers?.find(t => t.id === selectedTargetId)?.nombrePersona;
    
    toast({ 
      title: "Desdoble DAD Configurado", 
      description: `El profesor de apoyo ahora está vinculado a ${targetName}.` 
    });

    setIsSaving(false);
    setSelectedGroupId(null);
    setSelectedTargetId(null);
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#9c4d96]" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 max-w-4xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-[#9c4d96] p-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-2xl"><ShieldCheck className="h-10 w-10" /></div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight">
                {mode === 'proa' ? 'Designación e Instrucción PROA+' : 'Designación de Profesor DAD'}
              </h2>
              <p className="text-white/80 text-sm font-medium">Programa de Cooperación Territorial para la Equidad Educativa</p>
            </div>
          </div>
          <Badge className="bg-white text-[#9c4d96] font-bold uppercase px-4 py-1.5 border-none">DIRECCIÓN</Badge>
        </div>

        <div className="p-10 space-y-10">
          {mode === 'proa' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profesor a Designar PROA+</Label>
                <Select onValueChange={setSelectedGroupId} value={selectedTeacherId || ""}>
                  <SelectTrigger className="h-12 border-gray-300 font-bold text-sm bg-gray-50/30">
                    <SelectValue placeholder="Seleccione docente del claustro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers?.map(t => (
                      <SelectItem key={t.id} value={t.id} className="text-xs font-bold uppercase">
                        {t.nombrePersona || t.usuario}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl">
                 <p className="text-[10px] text-blue-800 font-bold leading-relaxed uppercase">
                   Al designar a un profesor como PROA+, este recibirá un nuevo perfil en su cabecera que le permitirá gestionar las medidas de apoyo y refuerzo educativo del centro.
                 </p>
              </div>
              <div className="flex justify-end pt-4">
                 <Button onClick={handleDesignateProa} disabled={!selectedTeacherId || isSaving} className="bg-[#9c4d96] hover:bg-[#833d7d] text-white px-12 h-12 text-[11px] font-bold uppercase tracking-widest gap-2 shadow-xl">
                   {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                   Asignar Perfil PROA+
                 </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase">1. Profesor de Apoyo (DAD)</Label>
                  <Select onValueChange={setSelectedGroupId} value={selectedTeacherId || ""}>
                    <SelectTrigger className="h-12 border-gray-300 font-bold text-sm">
                      <SelectValue placeholder="Elegir apoyo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers?.map(t => (
                        <SelectItem key={t.id} value={t.id} className="text-xs font-bold">{t.nombrePersona || t.usuario}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gray-100 p-2 rounded-full"><ArrowRight className="h-5 w-5 text-gray-400" /></div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase">2. Profesor Titular a Apoyar</Label>
                  <Select onValueChange={setSelectedTargetId} value={selectedTargetId || ""}>
                    <SelectTrigger className="h-12 border-gray-300 font-bold text-sm">
                      <SelectValue placeholder="Elegir titular..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers?.filter(t => t.id !== selectedTeacherId).map(t => (
                        <SelectItem key={t.id} value={t.id} className="text-xs font-bold">{t.nombrePersona || t.usuario}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-100 p-6 rounded-xl flex items-start gap-4">
                 <UserCircle className="h-6 w-6 text-orange-600 shrink-0 mt-1" />
                 <div className="space-y-1">
                    <h4 className="text-sm font-bold text-orange-800 uppercase tracking-tight">Sincronización de Apoyo (DAD)</h4>
                    <p className="text-[10px] text-orange-700 leading-relaxed font-medium uppercase">
                      El profesor designado como DAD tendrá acceso al **mismo horario** que el profesor titular. Podrá pasar lista y poner faltas que se sincronizarán automáticamente entre ambos perfiles en Rayuela.
                    </p>
                 </div>
              </div>

              <div className="flex justify-end pt-4">
                 <Button onClick={handleDesignateDad} disabled={!selectedTeacherId || !selectedTargetId || isSaving} className="bg-[#9c4d96] hover:bg-[#833d7d] text-white px-12 h-12 text-[11px] font-bold uppercase tracking-widest gap-2 shadow-xl">
                   {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                   Vincular Apoyo DAD
                 </Button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 border-t p-4 flex items-center justify-center gap-4">
           <CheckCircle2 className="h-4 w-4 text-green-500" />
           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Gestión de Personal Educativo Rayuela CM</span>
        </div>
      </div>
    </div>
  );
}
