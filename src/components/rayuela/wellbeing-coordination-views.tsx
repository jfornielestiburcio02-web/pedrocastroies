
"use client";

import React, { useState } from 'react';
import { 
  Loader2, 
  Plus, 
  Save, 
  Trash2, 
  FileText, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  HeartPulse,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

/**
 * VISTA: RECURSOS (Mobiliario, camillas, etc.)
 */
export function WellbeingResourcesView({ usuarioId }: { usuarioId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    item: '',
    descripcion: '',
    prioridad: 'Media'
  });

  const requestsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'solicitudesBienestar'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: requests, isLoading } = useCollection(requestsQuery);

  const handleSave = async () => {
    if (!db || !formData.item || !formData.descripcion) {
      toast({ variant: "destructive", title: "Error", description: "Complete el nombre del recurso y la descripción." });
      return;
    }

    await addDocumentNonBlocking(collection(db, 'solicitudesBienestar'), {
      ...formData,
      solicitanteId: usuarioId,
      estado: 'Pendiente',
      createdAt: new Date().toISOString()
    });

    toast({ title: "Solicitud Registrada", description: "Se ha enviado la petición de mobiliario a Secretaría." });
    setFormData({ item: '', descripcion: '', prioridad: 'Media' });
    setIsAdding(false);
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#9c4d96]" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="bg-[#9c4d96] p-4 text-white flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Truck className="h-5 w-5" />
              <h2 className="text-sm font-bold uppercase tracking-tight">Solicitud de Muebles, Camillas y Recursos</h2>
           </div>
           <Button onClick={() => setIsAdding(!isAdding)} size="sm" className="bg-white text-[#9c4d96] hover:bg-white/90 text-[10px] font-bold uppercase gap-2">
             {isAdding ? "Cancelar" : <><Plus className="h-3 w-3" /> Nueva Petición</>}
           </Button>
        </div>

        {isAdding && (
          <div className="p-8 bg-gray-50 border-b space-y-6 animate-in slide-in-from-top-2 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase">Recurso solicitado (Mueble, Camilla...)</Label>
                      <Input 
                        placeholder="Ej: Camilla plegable para enfermería" 
                        value={formData.item}
                        onChange={e => setFormData({...formData, item: e.target.value})}
                        className="h-10 border-gray-300 font-bold"
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase">Urgencia</Label>
                      <Select value={formData.prioridad} onValueChange={val => setFormData({...formData, prioridad: val})}>
                        <SelectTrigger className="h-10 border-gray-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baja">Baja</SelectItem>
                          <SelectItem value="Media">Media</SelectItem>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-bold text-gray-400 uppercase">Descripción y Motivo de la ayuda</Label>
                   <Textarea 
                    placeholder="Indique por qué es necesario este material para el bienestar del alumnado..."
                    value={formData.descripcion}
                    onChange={e => setFormData({...formData, descripcion: e.target.value})}
                    className="min-h-[105px] border-gray-300 resize-none text-xs leading-relaxed"
                   />
                </div>
             </div>
             <div className="flex justify-end pt-2">
                <Button onClick={handleSave} className="bg-[#9c4d96] text-white text-[11px] font-bold uppercase h-10 px-10 gap-2 shadow-md">
                   <Save className="h-4 w-4" /> Registrar Solicitud
                </Button>
             </div>
          </div>
        )}

        <div className="p-0">
           <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b text-[10px] font-bold text-gray-400 uppercase">
                 <tr>
                    <th className="p-4">Recurso</th>
                    <th className="p-4">Prioridad</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                 </tr>
              </thead>
              <tbody>
                 {requests?.length === 0 ? (
                   <tr><td colSpan={4} className="p-20 text-center italic text-gray-400 text-sm">No constan solicitudes de recursos de bienestar.</td></tr>
                 ) : (
                   requests?.map(req => (
                     <tr key={req.id} className="border-b hover:bg-gray-50 transition-colors group">
                        <td className="p-4">
                           <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-700 uppercase">{req.item}</span>
                              <span className="text-[9px] text-gray-400 font-bold uppercase">{format(new Date(req.createdAt), 'dd/MM/yyyy')}</span>
                           </div>
                        </td>
                        <td className="p-4">
                           <Badge variant="outline" className={cn(
                             "text-[8px] font-bold uppercase border-none",
                             req.prioridad === 'Urgente' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                           )}>
                             {req.prioridad}
                           </Badge>
                        </td>
                        <td className="p-4">
                           <Badge className={cn(
                             "text-[8px] font-bold uppercase border-none",
                             req.estado === 'Entregado' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                           )}>
                             {req.estado}
                           </Badge>
                        </td>
                        <td className="p-4 text-right">
                           <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db!, 'solicitudesBienestar', req.id))} className="h-8 w-8 text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-3.5 w-3.5" />
                           </Button>
                        </td>
                     </tr>
                   ))
                 )}
              </tbody>
           </table>
        </div>
      </div>

      <div className="p-6 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4">
         <Info className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
         <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-800 uppercase tracking-tight">Procedimiento de Bienestar</h4>
            <p className="text-[10px] text-blue-700 leading-relaxed font-medium uppercase">
              Las solicitudes de material pesado o mobiliario deben estar justificadas con el informe de necesidad del alumno correspondiente. Secretaría procesará la adquisición según disponibilidad presupuestaria.
            </p>
         </div>
      </div>
    </div>
  );
}

/**
 * VISTA: GUÍAS (Archivos PDF)
 */
export function WellbeingGuidesView() {
  const guides = [
    { title: "Protocolo de prevención del acoso escolar", size: "1.2 MB" },
    { title: "Guía de actuación ante emergencias sanitarias", size: "2.5 MB" },
    { title: "Manual de bienestar emocional en el aula", size: "850 KB" },
    { title: "Recursos externos de salud mental (CAM)", size: "3.1 MB" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto w-full font-verdana">
       <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-[#9c4d96] p-4 text-white flex items-center gap-2">
             <ClipboardList className="h-5 w-5" />
             <h2 className="text-sm font-bold uppercase tracking-tight">Guías de Apoyo y Protocolos</h2>
          </div>
          
          <div className="p-6 space-y-4">
             {guides.map((guide, i) => (
               <div key={i} className="flex items-center justify-between p-4 border rounded-xl bg-gray-50 hover:border-[#9c4d96] transition-all group cursor-pointer">
                  <div className="flex items-center gap-4">
                     <div className="bg-red-100 p-2.5 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <FileText className="h-6 w-6" />
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-gray-700 uppercase">{guide.title}</h4>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Formato: PDF | Tamaño: {guide.size}</span>
                     </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[9px] font-bold text-[#9c4d96] uppercase border-transparent hover:bg-[#9c4d96]/10">
                     Ver documento
                  </Button>
               </div>
             ))}
          </div>

          <div className="bg-gray-50 border-t p-8 text-center space-y-4">
             <AlertCircle className="h-10 w-10 mx-auto text-gray-300" />
             <p className="text-sm italic text-gray-400">Los archivos PDF están siendo cargados por el departamento de bienestar. Estarán disponibles para descarga en la próxima sincronización.</p>
          </div>
       </div>
    </div>
  );
}
