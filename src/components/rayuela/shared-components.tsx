
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function SidebarItem({ 
  label, 
  isSubItem = false, 
  onClick, 
  active = false, 
  color = "#89a54e" 
}: { 
  label: string; 
  isSubItem?: boolean; 
  onClick?: () => void; 
  active?: boolean; 
  color?: string 
}) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer group/item transition-colors",
        isSubItem ? "pl-4" : "",
        active ? "bg-gray-50" : ""
      )}
    >
      <div className={cn(
        "w-3.5 h-3.5 border border-gray-400 rounded-sm bg-white flex items-center justify-center transition-colors",
        isSubItem ? "w-3 h-3 border-gray-300" : "",
        active ? "border-[var(--sidebar-item-color)]" : "group-hover/item:border-[var(--sidebar-item-color)]"
      )} style={{ "--sidebar-item-color": color } as any}>
        <div className={cn(
          "w-1.5 h-1.5 transition-transform rounded-full",
          active ? "scale-100" : "scale-0 group-hover/item:scale-100"
        )} style={{ backgroundColor: color }} />
      </div>
      <span className={cn(
        "text-[12px] text-gray-700 whitespace-nowrap",
        isSubItem ? "text-gray-500 text-[11px]" : "font-medium",
        active ? "font-bold" : ""
      )} style={{ color: active ? color : undefined }}>{label}</span>
    </div>
  );
}

export function SidebarHeading({ 
  label, 
  expanded, 
  onClick 
}: { 
  label: string; 
  expanded: boolean; 
  onClick: () => void 
}) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 cursor-pointer group/item transition-colors"
    >
      <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm bg-white flex items-center justify-center">
        {expanded ? <ChevronDown className="h-2.5 w-2.5 text-gray-700" /> : <ChevronRight className="h-2.5 w-2.5 text-gray-400" />}
      </div>
      <span className="text-[12px] font-bold text-gray-700 whitespace-nowrap">{label}</span>
    </div>
  );
}

export function ModuleBox({ label, onClick }: { label: string; onClick: () => void }) {
  const isCau = label === "CAU";
  
  return (
    <button 
      onClick={onClick}
      className="w-40 h-40 md:w-56 md:h-56 border-4 border-white/30 bg-transparent flex flex-col items-center justify-center p-4 md:p-8 text-white font-bold hover:bg-white/10 hover:border-white/50 transition-all text-center leading-tight shadow-lg active:scale-95 group"
    >
      {isCau ? (
        <div className="flex flex-col items-center gap-2">
           <span className="text-2xl md:text-3xl">CAU</span>
           <span className="text-[10px] md:text-sm font-normal opacity-90 leading-tight">
             (Centro Atención de Usuarios)
           </span>
        </div>
      ) : (
        <span className="text-xl md:text-2xl group-hover:scale-110 transition-transform">{label}</span>
      )}
    </button>
  );
}
