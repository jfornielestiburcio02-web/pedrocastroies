
"use client";

import React from 'react';
import { Mail, User, Calendar, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RayuelaDesktopViewProps {
  unreadCount: number;
  onNavigateToMessages: () => void;
}

export function RayuelaDesktopView({ unreadCount, onNavigateToMessages }: RayuelaDesktopViewProps) {
  // Datos del calendario (Simulando Mayo 2026 como en la imagen)
  const daysOfWeek = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];
  const calendarDays = [
    { d: "", type: "empty" }, { d: "", type: "empty" }, { d: "", type: "empty" }, { d: "", type: "empty" }, 
    { d: "1", type: "green" }, { d: "2", type: "green" }, { d: "3", type: "green" },
    { d: "4", type: "event" }, { d: "5", type: "event" }, { d: "6", type: "event" }, { d: "7", type: "event" }, { d: "8", type: "event" }, { d: "9", type: "today" }, { d: "10", type: "green" },
    { d: "11", type: "green" }, { d: "12", type: "green" }, { d: "13", type: "event" }, { d: "14", type: "green" }, { d: "15", type: "green" }, { d: "16", type: "green" }, { d: "17", type: "green" },
    { d: "18", type: "green" }, { d: "19", type: "green" }, { d: "20", type: "event" }, { d: "21", type: "green" }, { d: "22", type: "green" }, { d: "23", type: "green" }, { d: "24", type: "green" },
    { d: "25", type: "green" }, { d: "26", type: "green" }, { d: "27", type: "green" }, { d: "28", type: "green" }, { d: "29", type: "event" }, { d: "30", type: "green" }, { d: "31", type: "green" }
  ];

  return (
    <div className="flex-1 bg-white p-4 md:p-10 font-verdana animate-in fade-in duration-700 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* FILA SUPERIOR: ESCRITORIO Y NOTICIAS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* PANEL ESCRITORIO */}
          <div className="bg-white border rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.1)] overflow-hidden">
            <div className="bg-[#f4b48c] px-4 py-2 text-white font-bold text-[13px] uppercase tracking-wider">
              ESCRITORIO
            </div>
            <div className="flex flex-col">
              <div 
                onClick={onNavigateToMessages}
                className="flex items-center gap-4 p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="bg-[#9c4d96] p-1.5 rounded-sm">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <span className="text-[12px] text-gray-700 font-medium">
                  {unreadCount === 0 ? 'No tiene mensajes pendientes' : `Tiene ${unreadCount} mensajes pendientes`}
                </span>
              </div>

              <div className="flex items-center gap-4 p-3 border-b border-gray-100">
                <div className="bg-[#89a54e] p-1.5 rounded-sm">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-[12px] text-gray-700 font-medium">
                  Hay 208 usuarios conectados a Seguimiento, 3 de este centro
                </span>
              </div>

              <div className="flex items-center gap-4 p-3 border-b border-gray-100">
                <div className="bg-[#f4b48c] p-1.5 rounded-sm">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <span className="text-[12px] text-gray-700 font-medium">
                  No tiene ninguna cita hoy
                </span>
              </div>

              <div className="flex items-center gap-4 p-3 bg-white">
                <div className="bg-[#2a9d8f] p-1.5 rounded-sm">
                  <RefreshCw className="h-4 w-4 text-white" />
                </div>
                <span className="text-[12px] text-gray-700 font-medium">
                  Última conexión: {format(new Date(), 'dd-MM-yyyy', { locale: es })}, a las {format(new Date(), 'HH:mm')}
                </span>
              </div>
            </div>
          </div>

          {/* PANEL NOTICIAS */}
          <div className="bg-white border rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.1)] overflow-hidden">
            <div className="bg-[#c2b4d0] px-4 py-2 text-white font-bold text-[13px] uppercase tracking-wider">
              NOTICIAS
            </div>
            <div className="h-[150px] p-6 text-center italic text-gray-300 text-xs">
              No hay noticias destacadas en este momento
            </div>
          </div>

        </div>

        {/* FILA INFERIOR: AGENDA Y DIBUJO RAYUELA */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-end">
          
          {/* PANEL AGENDA / CALENDARIO */}
          <div className="bg-white border rounded-sm shadow-[0_5px_15px_rgba(0,0,0,0.1)] overflow-hidden max-w-[400px]">
            <div className="bg-[#a8c69f] px-4 py-2 text-white font-bold text-[13px] uppercase tracking-wider">
              AGENDA
            </div>
            <div className="p-4 bg-white">
              <div className="text-center text-[#89a54e] font-bold text-sm mb-2">Mayo</div>
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {daysOfWeek.map(day => (
                  <div key={day} className="bg-white p-2 text-center text-[10px] font-bold text-[#89a54e]">{day}</div>
                ))}
                {calendarDays.map((day, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "bg-white h-8 flex items-center justify-center text-[11px] font-bold",
                      day.type === "green" ? "text-[#89a54e]" : "",
                      day.type === "event" ? "bg-[#9c4d96] text-white" : "",
                      day.type === "today" ? "border-2 border-[#fb8500] text-[#fb8500]" : ""
                    )}
                  >
                    {day.d}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* DIBUJO RAYUELA */}
          <div className="flex justify-end p-4">
             <div className="relative w-full max-w-[400px] h-[100px] opacity-60">
                <svg viewBox="0 0 500 120" className="w-full h-full">
                   {/* Simulación simplificada del dibujo de la rayuela */}
                   <rect x="10" y="40" width="40" height="40" fill="none" stroke="#f4b48c" strokeWidth="2" />
                   <text x="25" y="65" fontSize="14" fill="#f4b48c" textAnchor="middle">1</text>
                   
                   <rect x="55" y="40" width="40" height="40" fill="none" stroke="#fb8500" strokeWidth="2" />
                   <text x="70" y="65" fontSize="14" fill="#fb8500" textAnchor="middle">2</text>
                   
                   <rect x="100" y="40" width="40" height="40" fill="none" stroke="#e63946" strokeWidth="2" />
                   <text x="115" y="65" fontSize="14" fill="#e63946" textAnchor="middle">3</text>
                   
                   <rect x="145" y="20" width="40" height="40" fill="none" stroke="#2a9d8f" strokeWidth="2" />
                   <text x="160" y="45" fontSize="14" fill="#2a9d8f" textAnchor="middle">4</text>
                   <rect x="145" y="60" width="40" height="40" fill="none" stroke="#8ecae6" strokeWidth="2" />
                   <text x="160" y="85" fontSize="14" fill="#8ecae6" textAnchor="middle">5</text>
                   
                   <rect x="190" y="40" width="40" height="40" fill="none" stroke="#9c4d96" strokeWidth="2" />
                   <text x="205" y="65" fontSize="14" fill="#9c4d96" textAnchor="middle">6</text>
                   
                   <circle cx="260" cy="60" r="30" fill="none" stroke="#7d7d7d" strokeWidth="2" />
                   <text x="260" y="65" fontSize="12" fill="#7d7d7d" textAnchor="middle">9 10</text>
                </svg>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
