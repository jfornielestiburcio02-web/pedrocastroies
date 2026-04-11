
"use client";

import React, { useState, useMemo } from 'react';
import { 
  Inbox, 
  Trash2, 
  Mail, 
  Plus, 
  Send, 
  Trash, 
  Eye, 
  ArrowLeft, 
  CheckCircle2, 
  Search,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  doc 
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from '@/firebase/non-blocking-updates';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface MessagingViewProps {
  mode: 'inbox' | 'trash';
  usuarioId: string;
  onNavigateToIncident?: (studentId: string) => void;
}

export function MessagingView({ mode, usuarioId, onNavigateToIncident }: MessagingViewProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [viewingMessage, setViewingMessage] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const messagesQuery = useMemoFirebase(() => {
    if (!db || !usuarioId) return null;
    return query(
      collection(db, 'mensajes'),
      where('destinatarioId', '==', usuarioId),
      where('eliminado', '==', mode === 'trash'),
      orderBy('createdAt', 'desc')
    );
  }, [db, usuarioId, mode]);

  const { data: messages, isLoading } = useCollection(messagesQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);

  const { data: allUsers } = useCollection(usersQuery);

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    if (!searchTerm) return messages;
    return messages.filter(m => 
      m.asunto?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.remitenteId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [messages, searchTerm]);

  const getUserName = (id: string) => {
    if (id === 'SISTEMA') return 'Plataforma Rayuela';
    const user = allUsers?.find(u => u.id === id);
    return user ? (user.nombrePersona || user.usuario) : id;
  };

  const handleOpenMessage = (msg: any) => {
    setViewingMessage(msg);
    if (!msg.leido && mode === 'inbox' && db) {
      updateDocumentNonBlocking(doc(db, 'mensajes', msg.id), { leido: true });
    }
  };

  const handleMoveToTrash = (msgId: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'mensajes', msgId), { eliminado: true });
    toast({ title: "Mensaje borrado", description: "Se ha movido a la papelera." });
    if (viewingMessage?.id === msgId) setViewingMessage(null);
  };

  const handleDeletePermanent = (msgId: string) => {
    if (!db) return;
    deleteDocumentNonBlocking(doc(db, 'mensajes', msgId));
    toast({ title: "Eliminado", description: "El mensaje ha sido borrado permanentemente." });
    if (viewingMessage?.id === msgId) setViewingMessage(null);
  };

  const handleMarkAsUnread = (msgId: string) => {
    if (!db) return;
    updateDocumentNonBlocking(doc(db, 'mensajes', msgId), { leido: false });
    toast({ title: "Marcado", description: "Mensaje marcado como no leído." });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 w-full font-verdana">
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="bg-[#f8f9fa] border-b p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {mode === 'inbox' ? <Inbox className="h-5 w-5 text-[#fb8500]" /> : <Trash2 className="h-5 w-5 text-gray-400" />}
            <span className="text-sm font-bold text-gray-700 uppercase">
              {mode === 'inbox' ? 'Bandeja de Entrada' : 'Papelera de Reciclaje'}
            </span>
            <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[10px] font-bold border-none">
              {messages?.length || 0} MENSAJES
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input 
                  placeholder="Buscar mensaje..." 
                  className="pl-8 h-8 text-[11px] border-gray-300" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <Button onClick={() => setIsComposeOpen(true)} size="sm" className="bg-[#fb8500] hover:bg-[#e07600] text-white text-[10px] font-bold uppercase h-8 px-4 gap-2">
               <Plus className="h-3 w-3" /> Redactar
             </Button>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden">
           {isLoading ? (
             <div className="flex-1 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#fb8500]" /></div>
           ) : filteredMessages.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <Mail className="h-16 w-16 text-gray-100" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-400 uppercase tracking-tight">No hay mensajes</h3>
                  <p className="text-xs text-gray-400 italic">Su carpeta de {mode === 'inbox' ? 'entrada' : 'papelera'} está actualmente vacía.</p>
                </div>
             </div>
           ) : (
             <ScrollArea className="flex-1">
                <div className="flex flex-col">
                  {filteredMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      onClick={() => handleOpenMessage(msg)}
                      className={cn(
                        "group flex items-center gap-4 p-4 border-b cursor-pointer transition-colors hover:bg-gray-50",
                        !msg.leido && mode === 'inbox' ? "bg-blue-50/30 border-l-4 border-l-[#fb8500]" : "bg-white"
                      )}
                    >
                      <Avatar className="h-10 w-10 border shadow-sm shrink-0">
                         <AvatarFallback className="bg-gray-100 text-gray-400 text-xs font-bold">
                           {getUserName(msg.remitenteId).substring(0,2).toUpperCase()}
                         </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={cn("text-xs truncate", !msg.leido ? "font-bold text-black" : "text-gray-600 font-medium")}>
                            {getUserName(msg.remitenteId)}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium shrink-0">
                            {format(new Date(msg.createdAt), "d MMM, HH:mm", { locale: es })}
                          </span>
                        </div>
                        <h4 className={cn("text-[13px] truncate", !msg.leido ? "font-bold text-[#fb8500]" : "text-gray-700 font-medium")}>
                          {msg.asunto || "(Sin asunto)"}
                        </h4>
                        <p className="text-[11px] text-gray-400 truncate line-clamp-1 italic">
                          {msg.cuerpo}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         {mode === 'inbox' ? (
                           <>
                             <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-gray-400 hover:text-[#fb8500] hover:bg-orange-50"
                              onClick={(e) => { e.stopPropagation(); handleMarkAsUnread(msg.id); }}
                             >
                               <CheckCircle2 className="h-4 w-4" />
                             </Button>
                             <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => { e.stopPropagation(); handleMoveToTrash(msg.id); }}
                             >
                               <Trash className="h-4 w-4" />
                             </Button>
                           </>
                         ) : (
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => { e.stopPropagation(); handleDeletePermanent(msg.id); }}
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         )}
                      </div>
                    </div>
                  ))}
                </div>
             </ScrollArea>
           )}
        </div>
      </div>

      <ComposeDialog 
        open={isComposeOpen} 
        onClose={() => setIsComposeOpen(false)} 
        remitenteId={usuarioId} 
        users={allUsers || []} 
      />

      {viewingMessage && (
        <MessageDetailDialog 
          message={viewingMessage} 
          onClose={() => setViewingMessage(null)} 
          onDelete={mode === 'inbox' ? () => handleMoveToTrash(viewingMessage.id) : () => handleDeletePermanent(viewingMessage.id)}
          getUserName={getUserName}
          mode={mode}
          onNavigateToIncident={onNavigateToIncident}
        />
      )}
    </div>
  );
}

function ComposeDialog({ open, onClose, remitenteId, users }: { open: boolean, onClose: () => void, remitenteId: string, users: any[] }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    destinatarioId: '',
    asunto: '',
    cuerpo: ''
  });

  const handleSend = () => {
    if (!db || !formData.destinatarioId || !formData.asunto) {
      toast({ variant: "destructive", title: "Campos incompletos", description: "Elija destinatario y escriba un asunto." });
      return;
    }

    addDocumentNonBlocking(collection(db, 'mensajes'), {
      ...formData,
      remitenteId,
      leido: false,
      eliminado: false,
      createdAt: new Date().toISOString()
    });

    toast({ title: "Mensaje enviado", description: "El destinatario recibirá su mensaje en breve." });
    setFormData({ destinatarioId: '', asunto: '', cuerpo: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl font-verdana p-0 border-none overflow-hidden">
        <DialogHeader className="bg-[#fb8500] p-6 text-white shrink-0">
           <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
             <Send className="h-4 w-4" /> Nuevo Mensaje Interno
           </DialogTitle>
           <DialogDescription className="text-white/80 text-[10px] font-bold uppercase">Plataforma de comunicación Rayuela</DialogDescription>
        </DialogHeader>

        <div className="p-6 bg-white space-y-6">
           <div className="space-y-2">
             <Label className="text-[10px] font-bold uppercase text-gray-400">Destinatario</Label>
             <Select value={formData.destinatarioId} onValueChange={(val) => setFormData({...formData, destinatarioId: val})}>
               <SelectTrigger className="h-10 text-xs font-bold border-gray-300">
                 <SelectValue placeholder="Seleccione destinatario..." />
               </SelectTrigger>
               <SelectContent>
                 <ScrollArea className="h-[200px]">
                   {users.filter(u => u.id !== remitenteId).map(u => (
                     <SelectItem key={u.id} value={u.id} className="text-xs font-bold">
                       {u.nombrePersona || u.usuario} ({u.rolesUsuario?.[0]?.replace('Es', '') || "Usuario"})
                     </SelectItem>
                   ))}
                 </ScrollArea>
               </SelectContent>
             </Select>
           </div>

           <div className="space-y-2">
             <Label className="text-[10px] font-bold uppercase text-gray-400">Asunto</Label>
             <Input 
               className="h-10 text-xs font-bold border-gray-300" 
               placeholder="Motivo del mensaje..." 
               value={formData.asunto}
               onChange={(e) => setFormData({...formData, asunto: e.target.value})}
             />
           </div>

           <div className="space-y-2">
             <Label className="text-[10px] font-bold uppercase text-gray-400">Cuerpo del Mensaje</Label>
             <Textarea 
               className="min-h-[150px] text-xs font-medium leading-relaxed border-gray-300" 
               placeholder="Escriba aquí su mensaje..." 
               value={formData.cuerpo}
               onChange={(e) => setFormData({...formData, cuerpo: e.target.value})}
             />
           </div>
        </div>

        <DialogFooter className="bg-gray-50 p-6 border-t gap-4 shrink-0">
           <Button variant="outline" onClick={onClose} className="text-[11px] font-bold uppercase h-10 px-8">Cancelar</Button>
           <Button onClick={handleSend} className="bg-[#fb8500] hover:bg-[#e07600] text-white text-[11px] font-bold uppercase h-10 px-8 gap-2 shadow-md">
             <Send className="h-4 w-4" /> Enviar Mensaje
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MessageDetailDialog({ message, onClose, onDelete, getUserName, mode, onNavigateToIncident }: { message: any, onClose: () => void, onDelete: () => void, getUserName: (id: string) => string, mode: string, onNavigateToIncident?: (id: string) => void }) {
  // Lógica para detectar el enlace dinámico a la sanción
  const renderCuerpo = () => {
    const text = message.cuerpo || "";
    const match = text.match(/(.*)-pulse aqui- \[REF:(.*)\]/);
    
    if (match && onNavigateToIncident) {
      return (
        <div className="space-y-4">
          <p>{match[1]}</p>
          <Button 
            onClick={() => { onNavigateToIncident(match[2]); onClose(); }}
            className="bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold uppercase h-9 px-6 gap-2 animate-pulse"
          >
            <ExternalLink className="h-4 w-4" /> Ver sanción en Rayuela
          </Button>
        </div>
      );
    }
    
    return <p className="whitespace-pre-wrap">{text}</p>;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl font-verdana p-0 border-none overflow-hidden">
        <DialogHeader className="bg-gray-100 p-6 border-b shrink-0">
           <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                 <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-gray-400">
                   <ArrowLeft className="h-4 w-4" />
                 </Button>
                 <div className="text-left">
                    <DialogTitle className="text-sm font-bold uppercase tracking-tight text-gray-800">{message.asunto || "(Sin asunto)"}</DialogTitle>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Enviado el {format(new Date(message.createdAt), "eeee d 'de' MMMM 'a las' HH:mm", { locale: es })}</p>
                 </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                 {mode === 'inbox' ? <Trash className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
              </Button>
           </div>
        </DialogHeader>

        <div className="p-8 bg-white space-y-8">
           <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                 <AvatarFallback className="bg-white text-gray-400 text-sm font-bold">
                    {getUserName(message.remitenteId).substring(0,2).toUpperCase()}
                 </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                 <span className="text-[10px] font-bold uppercase text-gray-400">De:</span>
                 <span className="text-xs font-bold text-gray-700">{getUserName(message.remitenteId)}</span>
                 <span className="text-[9px] text-gray-400 italic">I.E.S Pedro Castro</span>
              </div>
           </div>

           <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase text-gray-300 tracking-[0.2em]">Mensaje</Label>
              <div className="text-sm text-gray-700 leading-relaxed font-medium min-h-[150px]">
                 {renderCuerpo()}
              </div>
           </div>

           <div className="pt-6 border-t flex justify-between items-center">
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                 <CheckCircle2 className="h-3.5 w-3.5" /> Entregado vía Rayuela
              </div>
              <Button variant="ghost" onClick={onClose} className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black">Cerrar lectura</Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
