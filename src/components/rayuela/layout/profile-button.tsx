"use client";

import React from 'react';
import { 
  ShieldCheck, 
  LifeBuoy, 
  Monitor, 
  UserCircle, 
  Briefcase, 
  ShieldPlus, 
  HeartHandshake, 
  UserCog,
  Gavel,
  Globe,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileButtonProps {
  profile: any;
  activeRole: string | null;
  onSetActiveRole: (role: string) => void;
  onSetActiveSubContent: (content: string | null) => void;
}

export function ProfileButton({ profile, activeRole, onSetActiveRole, onSetActiveSubContent }: ProfileButtonProps) {
  const isActive = activeRole === profile.label;
  const labelParts = profile.label.split(' ');

  return (
    <button 
      onClick={() => { onSetActiveRole(profile.label); onSetActiveSubContent(null); }}
      className={cn(
        "flex flex-col items-center group transition-all p-1 rounded-sm border min-w-[55px] h-auto min-h-[58px] justify-start",
        isActive 
          ? "bg-[#fb8500] border-[#fb8500] text-white" 
          : "bg-white border-gray-300 text-gray-400 hover:border-[#fb8500]/50"
      )}
    >
      <div className={cn(
        "p-1 rounded-sm mb-0.5",
        isActive ? "bg-white/20" : "bg-gray-100"
      )}>
        {profile.id === 'EsDireccion' && <ShieldCheck className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-50")} />}
        {profile.id === 'EsCau' && <LifeBuoy className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
        {profile.id === 'EsProfesor' && <Monitor className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
        {profile.id === 'EsAlumno' && <UserCircle className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
        {profile.id === 'EsSecretaria' && <Briefcase className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
        {profile.id === 'EsCiudadano' && <Globe className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
        {profile.label === 'PROA+' && <ShieldPlus className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
        {profile.label === 'Profesor Gestión' && <Gavel className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
        {profile.label === 'Coordinacion FP Dual' && <Building2 className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
        {profile.type === 'SUBPROFILE' && profile.label !== 'PROA+' && profile.label !== 'Profesor Gestión' && profile.label !== 'Coordinacion FP Dual' && <UserCog className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />}
      </div>
      <div className={cn(
        "text-[8px] font-bold uppercase tracking-tighter w-full text-center leading-[1.1]",
        isActive ? "text-white" : "text-gray-500"
      )}>
        {labelParts.map((part: string, i: number) => (
          <div key={i} className="truncate">{part}</div>
        ))}
      </div>
    </button>
  );
}
