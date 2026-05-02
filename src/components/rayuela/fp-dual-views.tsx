"use client";

import React from 'react';
import { 
  Building2, 
  Users2, 
  FileText, 
  ShieldCheck, 
  Briefcase, 
  ArrowRight,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DualCompaniesView() {
  const companies = [
    { name: "Indra Soluciones TIC", sector: "Informática", convenios: 4 },
    { name: "Telefónica I+D", sector: "Telecomunicaciones", convenios: 2 },
    { name: "Accenture Digital", sector: "Consultoría", convenios: 6 }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto w-full font-verdana">
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="bg-[#9c4d96] p-4 text-white flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5" />
              <h2 className="text-sm font-bold uppercase tracking-tight">Gestión de Empresas Colaboradoras</h2>
           </div>
           <Button size="sm" className="bg-white text-[#9c4d96] hover:bg-white/90 text-[10px] font-bold uppercase gap-2">
             <Plus className="h-3 w-3" /> Añadir Empresa
           </Button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {companies.map((company, i) => (
             <Card key={i} className="hover:border-[#9c4d96] transition-all cursor-pointer group">
                <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-bold uppercase text-gray-700">{company.name}</CardTitle>
                   <Badge variant="outline" className="text-[8px] font-bold uppercase">{company.sector}</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
                      <span>Convenios activos:</span>
                      <span className="text-[#9c4d96]">{company.convenios}</span>
                   </div>
                   <Button variant="ghost" className="w-full text-[9px] font-bold uppercase h-8 group-hover:bg-[#9c4d96] group-hover:text-white transition-colors">
                      Ver detalle <ArrowRight className="h-3 w-3 ml-2" />
                   </Button>
                </CardContent>
             </Card>
           ))}
        </div>
      </div>
    </div>
  );
}

export function DualStudentsView() {
  return (
    <div className="animate-in fade-in duration-500 py-20 text-center space-y-6 opacity-50 max-w-4xl mx-auto">
       <Users2 className="h-16 w-16 mx-auto text-gray-300" />
       <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase text-gray-400">Seguimiento de Alumnado Dual</h2>
          <p className="text-sm italic">Cargando censo de estudiantes en periodo de alternancia empresa-centro...</p>
       </div>
    </div>
  );
}

export function DualDocumentsView() {
  return (
    <div className="animate-in fade-in duration-500 py-20 text-center space-y-6 opacity-50 max-w-4xl mx-auto">
       <FileText className="h-16 w-16 mx-auto text-gray-300" />
       <div className="space-y-2">
          <h2 className="text-xl font-bold uppercase text-gray-400">Convenios y Anexos</h2>
          <p className="text-sm italic">Módulo de generación de documentación oficial Rayuela (Anexo I, II y III).</p>
       </div>
       <Badge className="bg-orange-100 text-orange-700 border-none uppercase font-bold text-[10px] px-4 py-1">En sincronización</Badge>
    </div>
  );
}
