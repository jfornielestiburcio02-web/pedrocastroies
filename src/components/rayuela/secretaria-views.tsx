
"use client";

import React, { useState, useMemo } from 'react';
import { 
  Loader2, 
  Search, 
  Key, 
  UserCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Briefcase,
  Coins,
  FileText,
  Award,
  Book,
  Library
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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
 * Vista de Entrega de Credenciales (Secretaría).
 * Permite buscar a cualquier persona por nombre/apellido y generarle una clave.
 */
export function CredentialDeliveryView() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [generatedPass, setGeneratedPass] = useState<{name: string, pass: string} | null>(null);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);

  const { data: allUsers, isLoading } = useCollection(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!allUsers) return [];
    if (!searchTerm || searchTerm.length < 2) return [];
    return allUsers.filter(u => 
      (u.nombrePersona || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.usuario || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allUsers, searchTerm]);

  const handleGenerateKey = (userId: string, name: string) => {
    const newPass = Math.random().toString(36).substring(2, 10).toUpperCase();
    updateDocumentNonBlocking(doc(db!, 'usuarios', userId), { contrasena: newPass });
    setGeneratedPass({ name, pass: newPass });
  };

  const copyToClipboard = () => {
    if (generatedPass) {
      navigator.clipboard.writeText(generatedPass.pass);
      toast({ title: "Copiado", description: "Clave copiada al portapapeles." });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#fb8500]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-5xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-xl shadow-lg overflow-hidden flex flex-col min-h-[500px]">
        <div className="bg-[#fb8500] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-lg"><Key className="h-6 w-6" /></div>
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight">Entrega de Credenciales</h2>
              <p className="text-white/80 text-[10px] font-bold uppercase">Gestión Administrativa de Claves de Acceso</p>
            </div>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-white/50" />
            <Input 
              placeholder="Escriba nombre o apellidos para buscar..." 
              className="pl-10 h-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 font-bold text-xs" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {!searchTerm || searchTerm.length < 2 ? (
              <div className="py-20 text-center space-y-4 opacity-40">
                 <Search className="h-16 w-16 mx-auto text-gray-300" />
                 <p className="text-sm italic text-gray-500">Utilice el buscador superior para localizar al interesado por su nombre oficial.</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                 <p className="text-sm font-bold text-red-600 uppercase">No se han encontrado resultados</p>
                 <p className="text-xs text-gray-400 italic">Verifique que el nombre esté escrito correctamente conforme al expediente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-[#fb8500]/30 transition-all group shadow-sm">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                        <AvatarImage src={user.imagenPerfil} />
                        <AvatarFallback className="bg-gray-200 text-gray-400 font-bold">
                          {user.usuario?.substring(0,2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800 uppercase tracking-tight">{user.nombrePersona || user.usuario}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[8px] font-bold border-gray-200 text-gray-400 uppercase">
                            ID: {user.usuario}
                          </Badge>
                          <span className="text-[10px] text-gray-400 font-bold uppercase italic">
                            {user.rolesUsuario?.[0]?.replace('Es', '')} {user.cursoAlumno ? `(${user.cursoAlumno})` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleGenerateKey(user.id, user.nombrePersona || user.usuario)}
                      className="bg-[#fb8500] hover:bg-[#e07600] text-white text-[10px] font-bold uppercase h-9 px-6 gap-2 shadow-md"
                    >
                      <Key className="h-3.5 w-3.5" /> Generar Clave
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="bg-gray-50 border-t p-4 flex items-center justify-between px-8">
           <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
             <ShieldCheck className="h-4 w-4 text-green-500" />
             Acceso restringido a personal de Secretaría
           </div>
           <p className="text-[9px] text-gray-400 italic">Plataforma Educativa Rayuela - I.E.S Pedro Castro</p>
        </div>
      </div>

      {/* Modal de Resultado */}
      <Dialog open={!!generatedPass} onOpenChange={() => setGeneratedPass(null)}>
        <DialogContent className="max-w-md font-verdana p-0 border-none overflow-hidden shadow-2xl">
          <DialogHeader className="bg-[#fb8500] p-6 text-white text-center shrink-0">
             <div className="flex justify-center mb-2"><Key className="h-10 w-10" /></div>
             <DialogTitle className="text-lg font-bold uppercase tracking-widest">Entrega de Credenciales</DialogTitle>
             <DialogDescription className="text-white/80 text-xs font-medium uppercase">COMPROBANTE OFICIAL DE ACCESO</DialogDescription>
          </DialogHeader>
          
          <div className="p-8 bg-white space-y-8 text-center">
             <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Titular del Acceso</span>
                <p className="text-xl font-bold text-gray-800 uppercase leading-tight">{generatedPass?.name}</p>
             </div>

             <div className="bg-gray-50 border-2 border-dashed border-[#fb8500]/30 p-8 rounded-2xl relative group">
                <span className="text-[10px] font-bold text-gray-400 uppercase absolute top-3 left-1/2 -translate-x-1/2">Nueva Contraseña Provisional</span>
                <p className="text-4xl font-mono font-bold tracking-[0.2em] text-[#fb8500] mt-4">
                  {generatedPass?.pass}
                </p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 text-gray-300 hover:text-[#fb8500]"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
             </div>

             <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-[10px] text-blue-800 font-bold leading-relaxed uppercase">
                  RECUERDE: El usuario deberá cambiar esta clave en su primer acceso desde el menú de Configuración.
                </p>
             </div>
          </div>

          <DialogFooter className="bg-gray-50 p-6 border-t shrink-0">
             <Button onClick={() => setGeneratedPass(null)} className="w-full bg-gray-800 hover:bg-black text-white text-[11px] font-bold uppercase h-12 shadow-md">
               He entregado la clave / Cerrar
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Vista genérica para secciones de Secretaría en preparación.
 */
export function SecretaryPlaceholderView({ title }: { title: string }) {
  const getIcon = () => {
    if (title.includes('Económica')) return <Coins className="h-12 w-12" />;
    if (title.includes('Título') || title === 'seCODEX') return <Award className="h-12 w-12" />;
    return <FileText className="h-12 w-12" />;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 py-20 flex flex-col items-center justify-center space-y-6 text-center">
      <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-[#fb8500] border border-orange-100">
        {getIcon()}
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">{title}</h2>
        <p className="text-gray-400 italic max-w-md mx-auto leading-relaxed">
          Esta sección de {title.toLowerCase()} está siendo sincronizada con el servidor central de Rayuela (Comunidad de Madrid).
        </p>
      </div>
      <Badge className="bg-[#fb8500] text-white px-6 py-1.5 font-bold uppercase tracking-widest text-[10px]">Servicio en Sincronización</Badge>
    </div>
  );
}
