
"use client";

import React, { useState } from 'react';
import { 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Users,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export function ProfileSyncView() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const handleSyncAll = async () => {
    if (!db || !users) return;
    setIsSyncing(true);
    setProgress(0);

    try {
      // Usamos batches para eficiencia (máx 500 ops por batch)
      const querySnapshot = await getDocs(collection(db, 'usuarios'));
      const total = querySnapshot.size;
      let processed = 0;
      
      const batch = writeBatch(db);
      
      querySnapshot.forEach((userDoc) => {
        const data = userDoc.data();
        const currentRoles = data.rolesUsuario || [];
        
        if (!currentRoles.includes('EsCiudadano')) {
          batch.update(userDoc.ref, {
            rolesUsuario: [...currentRoles, 'EsCiudadano'],
            updatedAt: new Date().toISOString()
          });
        }
        
        processed++;
        setProgress(Math.round((processed / total) * 100));
      });

      await batch.commit();

      toast({
        title: "Sincronización Completada",
        description: `Se ha añadido el perfil Ciudadano a ${total} usuarios.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error en la sincronización",
        description: "No se pudieron actualizar todos los perfiles.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#9c4d96]" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 max-w-4xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-[#9c4d96] p-8 text-white flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="bg-white/20 p-4 rounded-2xl"><RefreshCw className={isSyncing ? "h-10 w-10 animate-spin" : "h-10 w-10"} /></div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-tight">Sincronización Global de Perfiles</h2>
              <p className="text-white/80 text-sm font-medium">Actualización masiva de roles de usuario en Rayuela</p>
            </div>
          </div>
          <Badge className="bg-white text-[#9c4d96] font-bold uppercase px-4 py-1.5 border-none">SISTEMA</Badge>
        </div>

        <div className="p-10 space-y-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="bg-purple-50 p-6 rounded-full">
              <Users className="h-16 w-16 text-[#9c4d96]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-800 uppercase">Añadir Perfil "Ciudadano" a todo el Censo</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                Esta acción otorgará automáticamente el rol de Ciudadano a **todos los usuarios registrados** en la plataforma ({users?.length || 0} usuarios).
              </p>
            </div>

            {isSyncing && (
              <div className="w-full max-w-md space-y-2 animate-in zoom-in-95 duration-300">
                <div className="flex justify-between text-[10px] font-bold text-purple-600 uppercase">
                  <span>Procesando censo...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-purple-100" />
              </div>
            )}

            <Button 
              onClick={handleSyncAll} 
              disabled={isSyncing}
              className="bg-[#9c4d96] hover:bg-[#833d7d] text-white px-12 h-14 text-xs font-bold uppercase tracking-[0.2em] gap-3 shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              {isSyncing ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
              Iniciar Sincronización Masiva
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                   <h4 className="text-xs font-bold text-orange-800 uppercase">Acción Irreversible</h4>
                   <p className="text-[10px] text-orange-700 leading-relaxed font-medium uppercase">
                     Una vez iniciada, la asignación se realizará en tiempo real sobre la base de datos de producción.
                   </p>
                </div>
             </div>
             <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl flex items-start gap-4">
                <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                   <h4 className="text-xs font-bold text-blue-800 uppercase">Perfil sin Sidebar</h4>
                   <p className="text-[10px] text-blue-700 leading-relaxed font-medium uppercase">
                     El nuevo perfil "Ciudadano" no dispone de menú lateral para maximizar el área de trámites.
                   </p>
                </div>
             </div>
          </div>
        </div>

        <div className="bg-gray-50 border-t p-4 flex items-center justify-center gap-4">
           <CheckCircle2 className="h-4 w-4 text-green-500" />
           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sincronizador Automático Rayuela v2.0</span>
        </div>
      </div>
    </div>
  );
}
