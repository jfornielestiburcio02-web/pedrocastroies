
"use client";

import React, { useState } from 'react';
import { 
  Loader2, 
  Award, 
  Send, 
  User, 
  FileText, 
  Phone, 
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export function SecodexCitizenView({ usuarioId }: { usuarioId: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    telefono: '',
    motivo: ''
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !formData.nombre || !formData.dni) {
      toast({ variant: "destructive", title: "Faltan datos", description: "Por favor, complete los campos obligatorios." });
      return;
    }

    setIsSaving(true);
    
    await addDocumentNonBlocking(collection(db, 'secodexSolicitudes'), {
      ...formData,
      usuarioId,
      estado: 'Pendiente',
      createdAt: new Date().toISOString()
    });

    toast({ title: "Solicitud Enviada", description: "Su petición ha sido registrada en la Secretaría del centro." });
    setSubmitted(true);
    setIsSaving(false);
  };

  if (submitted) {
    return (
      <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center py-20 text-center space-y-6">
        <div className="bg-green-100 p-6 rounded-full text-green-600">
          <CheckCircle2 className="h-16 w-16" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">¡Solicitud Registrada!</h2>
          <p className="text-gray-500 max-w-md">Su petición para el Sello SECODEX ha sido enviada correctamente. Secretaría revisará su caso en los próximos días.</p>
        </div>
        <Button onClick={() => setSubmitted(false)} variant="outline" className="uppercase font-bold text-xs tracking-widest px-8">Enviar otra solicitud</Button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-2xl mx-auto w-full font-verdana">
      <Card className="border-none shadow-2xl overflow-hidden rounded-2xl">
        <CardHeader className="bg-[#fb8500] p-8 text-white text-center">
          <div className="flex justify-center mb-4">
             <div className="bg-white/20 p-4 rounded-full backdrop-blur-md">
                <Award className="h-10 w-10" />
             </div>
          </div>
          <CardTitle className="text-2xl font-bold uppercase tracking-widest">Sello de Buena Práctica SECODEX</CardTitle>
          <CardDescription className="text-white/80 text-sm font-medium uppercase mt-2">Formulario Oficial de Solicitante - Datos IC</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSend}>
          <CardContent className="p-8 space-y-8 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                    <User className="h-3 w-3" /> Nombre
                  </Label>
                  <Input 
                    required 
                    value={formData.nombre} 
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                    placeholder="Introduzca su nombre" 
                    className="h-11 border-gray-300 font-bold" 
                  />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                    <User className="h-3 w-3" /> Apellidos
                  </Label>
                  <Input 
                    required 
                    value={formData.apellidos} 
                    onChange={e => setFormData({...formData, apellidos: e.target.value})}
                    placeholder="Introduzca sus apellidos" 
                    className="h-11 border-gray-300 font-bold" 
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                    <CreditCard className="h-3 w-3" /> DNI / NIE (Datos IC)
                  </Label>
                  <Input 
                    required 
                    value={formData.dni} 
                    onChange={e => setFormData({...formData, dni: e.target.value})}
                    placeholder="12345678X" 
                    className="h-11 border-gray-300 font-bold uppercase" 
                  />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                    <Phone className="h-3 w-3" /> Teléfono de contacto
                  </Label>
                  <Input 
                    value={formData.telefono} 
                    onChange={e => setFormData({...formData, telefono: e.target.value})}
                    placeholder="600 000 000" 
                    className="h-11 border-gray-300 font-bold" 
                  />
               </div>
            </div>

            <div className="space-y-2">
               <Label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                 <FileText className="h-3 w-3" /> Motivo de la solicitud / Méritos
               </Label>
               <Textarea 
                 required 
                 value={formData.motivo} 
                 onChange={e => setFormData({...formData, motivo: e.target.value})}
                 placeholder="Describa brevemente por qué solicita el sello de buena práctica..." 
                 className="min-h-[120px] border-gray-300 resize-none text-sm font-medium leading-relaxed"
               />
            </div>

            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
               <p className="text-[10px] text-orange-800 font-bold leading-relaxed uppercase italic">
                 Al pulsar enviar, sus datos serán procesados por la Secretaría Virtual del centro para la validación del reconocimiento SECODEX.
               </p>
            </div>
          </CardContent>
          
          <CardFooter className="bg-gray-50 p-6 border-t">
             <Button 
              type="submit" 
              disabled={isSaving}
              className="w-full bg-[#fb8500] hover:bg-[#e07600] text-white h-14 text-sm font-bold uppercase tracking-[0.2em] gap-3 shadow-xl transition-all active:scale-95"
             >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                Enviar Solicitud a Secretaría
             </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
