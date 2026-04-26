
"use client";

import React, { useState } from 'react';
import { 
  Loader2, 
  Award, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  FileText,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function SecodexAdminView() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const solicitudesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'secodexSolicitudes'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: solicitudes, isLoading } = useCollection(solicitudesQuery);

  const filtered = solicitudes?.filter(s => 
    (s.nombre + " " + s.apellidos).toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.dni?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedSolicitud = solicitudes?.find(s => s.id === selectedId);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'secodexSolicitudes', id), { estado: newStatus });
    toast({ title: "Estado Actualizado", description: `La solicitud ha sido marcada como ${newStatus}.` });
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#fb8500]" /></div>;

  return (
    <div className="animate-in fade-in duration-500 flex flex-col gap-6 h-full font-verdana">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[600px]">
        <div className="bg-[#fb8500] p-4 text-white flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Award className="h-5 w-5" />
              <h2 className="text-sm font-bold uppercase tracking-tight">Gestión SECODEX: Solicitudes Recibidas</h2>
           </div>
           <Badge className="bg-white text-[#fb8500] font-bold border-none">{filtered.length} PENDIENTES</Badge>
        </div>

        <div className="p-4 border-b bg-gray-50 flex items-center gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <Input 
                placeholder="Buscar por nombre o DNI del solicitante..." 
                className="pl-8 h-9 text-[11px] border-gray-300 bg-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
           {/* LISTADO IZQUIERDA */}
           <div className="w-1/3 border-r bg-gray-50/30 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-gray-400 italic text-xs">No hay solicitudes que coincidan.</div>
              ) : (
                filtered.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      "p-4 border-b cursor-pointer transition-all hover:bg-white group",
                      selectedId === s.id ? "bg-white border-l-4 border-l-[#fb8500] shadow-inner" : ""
                    )}
                  >
                     <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          {format(new Date(s.createdAt), 'dd/MM/yy HH:mm')}
                        </span>
                        <Badge className={cn(
                          "text-[8px] font-bold uppercase border-none",
                          s.estado === 'Pendiente' ? "bg-blue-100 text-blue-700" :
                          s.estado === 'Aceptada' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {s.estado}
                        </Badge>
                     </div>
                     <h4 className="text-xs font-bold text-gray-700 uppercase truncate">{s.nombre} {s.apellidos}</h4>
                     <p className="text-[9px] text-gray-400 font-bold uppercase">{s.dni}</p>
                  </div>
                ))
              )}
           </div>

           {/* DETALLE DERECHA */}
           <div className="flex-1 bg-white p-8 overflow-y-auto">
              {selectedSolicitud ? (
                <div className="animate-in slide-in-from-right-2 duration-300 space-y-8">
                   <div className="flex items-center justify-between border-b pb-4">
                      <div className="space-y-1">
                         <h3 className="text-xl font-bold text-gray-800 uppercase tracking-tight">Expediente de Solicitante</h3>
                         <p className="text-[10px] text-gray-400 font-bold uppercase">ID Trámite: {selectedSolicitud.id}</p>
                      </div>
                      <div className="flex gap-2">
                         <Button 
                          onClick={() => handleUpdateStatus(selectedSolicitud.id, 'Aceptada')}
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase h-8"
                         >
                           <CheckCircle2 className="h-3 w-3 mr-1" /> Aceptar
                         </Button>
                         <Button 
                          onClick={() => handleUpdateStatus(selectedSolicitud.id, 'Rechazada')}
                          size="sm" 
                          variant="destructive"
                          className="text-[10px] font-bold uppercase h-8"
                         >
                           <XCircle className="h-3 w-3 mr-1" /> Rechazar
                         </Button>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1">
                         <Label className="text-[10px] font-bold text-gray-400 uppercase">Nombre Completo</Label>
                         <p className="text-sm font-bold text-gray-700 uppercase flex items-center gap-2">
                           <User className="h-4 w-4 text-[#fb8500]" /> {selectedSolicitud.nombre} {selectedSolicitud.apellidos}
                         </p>
                      </div>
                      <div className="space-y-1">
                         <Label className="text-[10px] font-bold text-gray-400 uppercase">Documento Identidad (IC)</Label>
                         <p className="text-sm font-mono font-bold text-gray-700">{selectedSolicitud.dni}</p>
                      </div>
                      <div className="space-y-1">
                         <Label className="text-[10px] font-bold text-gray-400 uppercase">Teléfono de contacto</Label>
                         <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                           <Phone className="h-4 w-4 text-[#fb8500]" /> {selectedSolicitud.telefono || "No aportado"}
                         </p>
                      </div>
                      <div className="space-y-1">
                         <Label className="text-[10px] font-bold text-gray-400 uppercase">Fecha de Entrada</Label>
                         <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                           <Clock className="h-4 w-4 text-[#fb8500]" /> {format(new Date(selectedSolicitud.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                         </p>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase">Cuerpo de la Solicitud / Méritos aportados</Label>
                      <div className="bg-gray-50 border p-6 rounded-xl text-sm italic text-gray-600 leading-relaxed border-dashed">
                        "{selectedSolicitud.motivo}"
                      </div>
                   </div>

                   <div className="pt-6 border-t flex items-center gap-4">
                      <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center gap-3 flex-1">
                         <ShieldCheck className="h-5 w-5 text-blue-600" />
                         <p className="text-[9px] text-blue-800 font-bold uppercase">Esta solicitud se vincula al expediente digital del usuario {selectedSolicitud.usuarioId}.</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
                   <Award className="h-20 w-20" />
                   <p className="text-sm font-bold uppercase tracking-widest">Seleccione una solicitud para revisar los Datos IC</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
