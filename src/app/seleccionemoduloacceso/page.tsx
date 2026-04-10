
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export default function SeleccioneModuloAccesoPage() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (!savedSession) {
      router.push('/login');
    } else {
      setSession(JSON.parse(savedSession));
      setIsLoading(false);
    }
  }, [router]);

  const handleModuleClick = () => {
    router.push('/Contenedir');
  };

  if (isLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f0f0]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0] font-verdana flex flex-col items-center pt-12 px-4">
      {/* Main Container */}
      <div className="w-full max-w-[900px] bg-white shadow-2xl overflow-hidden border border-gray-200">
        
        {/* Header - Logo Area */}
        <div className="p-8 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex items-baseline">
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#9c4d96' }}>r</span>
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#e63946' }}>A</span>
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#ffb703' }}>Y</span>
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#8ecae6' }}>U</span>
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#fb8500' }}>E</span>
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#2a9d8f' }}>L</span>
              <span className="text-4xl font-bold tracking-tighter" style={{ color: '#0077b6' }}>A</span>
            </div>
            <div className="h-10 w-[2px] bg-gray-300 mx-2"></div>
            <div className="flex flex-col">
              <span className="text-xl font-bold uppercase tracking-widest text-black">Plataforma</span>
              <span className="text-xl font-bold uppercase tracking-widest text-black">EDUCATIVA</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] -mt-1">Extremeña</span>
            </div>
          </div>
        </div>

        {/* Modules Bar */}
        <div className="bg-[#7d7d7d] py-12 px-8 flex justify-center gap-8 md:gap-16">
          <ModuleBox label="Gestión" onClick={handleModuleClick} borderColor="border-purple-300/40" />
          <ModuleBox label="Secretaría Virtual" onClick={handleModuleClick} borderColor="border-orange-200/40" />
          <ModuleBox label="Seguimiento" onClick={handleModuleClick} borderColor="border-green-200/40" />
        </div>

        {/* Info Text */}
        <div className="p-4 bg-white text-[11px] text-black text-left border-t border-gray-200">
          En esta pantalla se muestran los diferentes servicios a los que usted tiene acceso. Pulse sobre aquel al que desee acceder
        </div>

        {/* Footer */}
        <div className="bg-white p-6 flex justify-end items-center gap-8 border-t border-gray-100">
          <div className="text-right text-[10px] text-gray-600 space-y-0.5 leading-relaxed">
            <p>Proyecto cofinanciado por</p>
            <p>Fondo Europeo de Desarrollo Regional</p>
            <p>Una manera de hacer Europa</p>
          </div>
          <div className="flex items-center gap-2 border border-gray-300 p-1 pr-3">
             <div className="bg-[#003399] p-1">
                <div className="grid grid-cols-4 gap-0.5 w-6 h-4 place-items-center">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-[1.5px] h-[1.5px] bg-yellow-400 rounded-full"></div>
                  ))}
                </div>
             </div>
             <span className="text-[10px] font-bold text-[#003399]">Unión Europea</span>
          </div>
        </div>
      </div>

      {/* Ground Decoration (Rayuela) */}
      <div className="mt-8 opacity-20 transform scale-75 md:scale-100">
        <Image 
          src="https://picsum.photos/seed/floor/800/150" 
          alt="Decoration" 
          width={800} 
          height={150}
          className="grayscale"
        />
      </div>
    </div>
  );
}

function ModuleBox({ label, onClick, borderColor }: { label: string; onClick: () => void; borderColor: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-32 h-32 md:w-40 md:h-40 border-4 ${borderColor} bg-transparent flex items-center justify-center p-4 text-white text-lg font-bold hover:bg-white/10 transition-colors text-center leading-tight group`}
    >
      <span className="group-hover:scale-105 transition-transform">{label}</span>
    </button>
  );
}
