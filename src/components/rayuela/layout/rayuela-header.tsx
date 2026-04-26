"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  BookOpen, 
  Home, 
  MessageSquare, 
  RefreshCw, 
  X 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProfileButton } from './profile-button';

interface RayuelaHeaderProps {
  userData: any;
  activeRole: string | null;
  unreadCount: number;
  allAvailableProfiles: any[];
  onSetModule: (module: string | null) => void;
  onSetActiveSubContent: (content: string | null) => void;
  onSetSidebarMode: (mode: 'ACADEMIC' | 'MESSAGING') => void;
  onOpenProfileDialog: () => void;
  onSetActiveRole: (role: string) => void;
  onLogout: () => void;
}

export function RayuelaHeader({
  userData,
  activeRole,
  unreadCount,
  allAvailableProfiles,
  onSetModule,
  onSetActiveSubContent,
  onSetSidebarMode,
  onOpenProfileDialog,
  onSetActiveRole,
  onLogout
}: RayuelaHeaderProps) {
  const router = useRouter();

  return (
    <div className="w-full bg-[#e9e9e9] border-b border-gray-300 p-2 flex flex-col md:flex-row items-center justify-between shadow-sm animate-in fade-in slide-in-from-top duration-500 z-50">
      <div className="flex items-center gap-4 w-full md:w-auto px-2">
        <div className="relative">
          <Avatar className="h-16 w-16 border-2 border-white shadow-sm bg-gray-200">
            <AvatarImage src={userData?.imagenPerfil} />
            <AvatarFallback>{userData?.usuario?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
              {unreadCount}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-[13px] text-black">
              {userData?.nombrePersona || userData?.usuario} ({activeRole})
            </span>
          </div>
          <span className="text-[11px] text-gray-600">
            I.E.S Pedro Castro (Com. Madrid)
          </span>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-gray-500 font-medium">
            <span className="hover:underline cursor-pointer">Documentos solicitados</span>
            <span className="hover:underline cursor-pointer" onClick={() => router.push('/configuracion')}>Configuración</span>
            <span className="hover:underline cursor-pointer">Manuales</span>
            <span className="hover:underline cursor-pointer" onClick={() => { onSetModule('SEGUIMIENTO'); onSetSidebarMode('MESSAGING'); onSetActiveSubContent('Mis Mensajes'); }}>Nuevo mensaje</span>
            <span className="hover:underline cursor-pointer" onClick={() => { onSetModule('SEGUIMIENTO'); onSetSidebarMode('MESSAGING'); onSetActiveSubContent('Mis Mensajes'); }}>Mis mensajes</span>
          </div>
          <div className="flex gap-4 mt-2">
            <Clock className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
            <BookOpen className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => { onSetModule(null); onSetActiveSubContent(null); }} />
            <Home className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={() => { onSetModule(null); onSetActiveSubContent(null); }} />
            <MessageSquare className={cn("h-4 w-4 cursor-pointer", unreadCount > 0 ? "text-red-600" : "text-[#fb8500]")} onClick={() => { onSetModule('SEGUIMIENTO'); onSetSidebarMode('MESSAGING'); onSetActiveSubContent('Mis Mensajes'); }} />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-center text-center max-w-[300px]">
        <p className="text-[9px] text-gray-500 uppercase leading-tight">Proyecto cofinanciado por</p>
        <p className="text-[10px] font-bold text-gray-600 leading-tight">Fondo Europeo de Desarrollo Regional.</p>
        <p className="text-[10px] text-gray-500 leading-tight italic">Una manera de hacer Europa</p>
      </div>

      <div className="flex items-center gap-4 mt-4 md:mt-0 px-2">
        <div className="flex gap-1 items-center">
          {allAvailableProfiles.length > 5 ? (
            <>
              {allAvailableProfiles.slice(0, 4).map(profile => (
                <ProfileButton 
                  key={profile.id} 
                  profile={profile} 
                  activeRole={activeRole} 
                  onSetActiveRole={onSetActiveRole} 
                  onSetActiveSubContent={onSetActiveSubContent} 
                />
              ))}
              <button 
                onClick={onOpenProfileDialog}
                className="flex flex-col items-center justify-center group transition-all p-1 rounded-sm border min-w-[55px] h-auto min-h-[58px] bg-white border-gray-300 text-gray-400 hover:border-[#fb8500]/50"
              >
                <div className="p-1 rounded-sm bg-gray-100 mb-0.5">
                  <RefreshCw className="h-5 w-5 text-gray-500" />
                </div>
                <span className="text-[8px] font-bold uppercase mt-0.5 tracking-tighter text-gray-500 leading-tight">
                  Cambio<br/>Perfil
                </span>
              </button>
            </>
          ) : (
            allAvailableProfiles.map(profile => (
              <ProfileButton 
                key={profile.id} 
                profile={profile} 
                activeRole={activeRole} 
                onSetActiveRole={onSetActiveRole} 
                onSetActiveSubContent={onSetActiveSubContent} 
              />
            ))
          )}
        </div>

        <div className="flex flex-col gap-1 border-l pl-4 border-gray-300">
           <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-none bg-gray-500 text-white hover:bg-gray-600" onClick={() => { onSetModule(null); onSetActiveSubContent(null); }}>
                <Home className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onLogout} className="h-6 w-6 rounded-none bg-gray-700 text-white hover:bg-black">
                <X className="h-3 w-3" />
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
