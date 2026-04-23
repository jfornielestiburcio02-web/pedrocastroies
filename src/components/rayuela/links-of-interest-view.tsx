
"use client";

import React, { useState } from 'react';
import { 
  Loader2, 
  Plus, 
  ExternalLink, 
  Trash2, 
  Save, 
  Link as LinkIcon,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function LinksOfInterestView({ profesorId }: { profesorId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ titulo: '', url: '' });

  const linksQuery = useMemoFirebase(() => {
    if (!db || !profesorId) return null;
    return query(
      collection(db, 'enlacesInteres'),
      where('profesorId', '==', profesorId),
      orderBy('createdAt', 'desc')
    );
  }, [db, profesorId]);

  const { data: links, isLoading } = useCollection(linksQuery);

  const handleAddLink = () => {
    if (!db || !formData.titulo || !formData.url) {
      toast({ variant: "destructive", title: "Campos vacíos", description: "Indique un título y una URL." });
      return;
    }

    // Validar URL básica
    try {
      new URL(formData.url.startsWith('http') ? formData.url : `https://${formData.url}`);
    } catch (e) {
      toast({ variant: "destructive", title: "URL Inválida", description: "Indique una dirección web válida." });
      return;
    }

    const finalUrl = formData.url.startsWith('http') ? formData.url : `https://${formData.url}`;

    addDocumentNonBlocking(collection(db, 'enlacesInteres'), {
      profesorId,
      titulo: formData.titulo,
      url: finalUrl,
      createdAt: new Date().toISOString()
    });

    toast({ title: "Enlace Guardado", description: "Se ha añadido a su listado personal." });
    setFormData({ titulo: '', url: '' });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'enlacesInteres', id));
    toast({ title: "Enlace eliminado" });
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 max-w-4xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        <div className="bg-[#f8f9fa] border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LinkIcon className="h-5 w-5 text-[#89a54e]" />
            <span className="text-sm font-bold text-gray-700 uppercase">Mis Enlaces de Interés</span>
            <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[10px] font-bold border-none uppercase">
              {links?.length || 0} RECURSOS
            </Badge>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)} size="sm" className="bg-[#89a54e] hover:bg-[#728a41] text-white text-[10px] font-bold uppercase h-8 px-4 gap-2">
            {isAdding ? "Cancelar" : <><Plus className="h-3 w-3" /> Añadir enlace</>}
          </Button>
        </div>

        {isAdding && (
          <div className="p-6 bg-gray-50 border-b space-y-4 animate-in slide-in-from-top-2 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold text-gray-400 uppercase">Título del recurso</Label>
                   <Input 
                    placeholder="Ej: Diccionario RAE, Portal Educativo..." 
                    value={formData.titulo}
                    onChange={(e) => setFormData({...formData, titulo: e.target.value})}
                    className="h-9 border-gray-300 font-bold text-xs"
                   />
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold text-gray-400 uppercase">Dirección URL</Label>
                   <Input 
                    placeholder="www.ejemplo.com" 
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="h-9 border-gray-300 text-xs italic"
                   />
                </div>
             </div>
             <div className="flex justify-end">
                <Button onClick={handleAddLink} className="bg-[#89a54e] text-white text-[10px] font-bold uppercase h-9 px-8 gap-2 shadow-md">
                   <Save className="h-3.5 w-3.5" /> Guardar en Rayuela
                </Button>
             </div>
          </div>
        )}

        <ScrollArea className="flex-1">
           <div className="p-4 space-y-3">
              {links?.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 opacity-30">
                   <Globe className="h-12 w-12 text-gray-300" />
                   <p className="text-sm italic">No tiene enlaces de interés guardados en su perfil.</p>
                </div>
              ) : (
                links?.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:border-[#89a54e]/50 hover:shadow-sm transition-all group">
                     <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="bg-gray-50 p-2.5 rounded-lg border group-hover:bg-[#89a54e]/10 group-hover:border-[#89a54e]/20 transition-colors">
                           <Globe className="h-5 w-5 text-gray-400 group-hover:text-[#89a54e]" />
                        </div>
                        <div className="flex flex-col min-w-0">
                           <h4 className="text-sm font-bold text-gray-700 uppercase truncate">{link.titulo}</h4>
                           <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[10px] text-[#89a54e] font-medium hover:underline truncate flex items-center gap-1"
                           >
                              {link.url} <ExternalLink className="h-2 w-2" />
                           </a>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => window.open(link.url, '_blank')}
                          className="h-8 w-8 text-gray-400 hover:text-[#89a54e] hover:bg-[#89a54e]/10"
                        >
                           <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(link.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                           <Trash2 className="h-4 w-4" />
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
