
"use client";

import React from 'react';
import { Inbox, Trash2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MessagingView({ mode }: { mode: 'inbox' | 'trash' }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6 w-full">
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <div className="bg-[#f8f9fa] border-b p-4 flex items-center gap-3">
          {mode === 'inbox' ? <Inbox className="h-5 w-5 text-[#fb8500]" /> : <Trash2 className="h-5 w-5 text-gray-400" />}
          <span className="text-sm font-bold text-gray-700 uppercase">
            {mode === 'inbox' ? 'Bandeja de Entrada' : 'Papelera de Reciclaje'}
          </span>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
           <Mail className="h-16 w-16 text-gray-100" />
           <div className="space-y-1">
             <h3 className="text-lg font-bold text-gray-400 uppercase tracking-tight">No hay mensajes</h3>
             <p className="text-xs text-gray-400 italic">Su carpeta de {mode === 'inbox' ? 'entrada' : 'papelera'} está actualmente vacía.</p>
           </div>
           <Button size="sm" className="bg-[#fb8500] hover:bg-[#e07600] text-white text-[10px] font-bold uppercase h-8 px-6">
             Redactar Nuevo
           </Button>
        </div>
      </div>
    </div>
  );
}
