"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();

  const handleAccept = () => {
    // Si hay sesión la cierra en sessionStorage y redirige a login
    sessionStorage.removeItem('user_session');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0] font-verdana p-4">
      <div className="bg-white border p-10 max-w-xl w-full shadow-lg rounded-none text-left space-y-8">
        <div className="space-y-4">
          <p className="text-gray-800 text-lg font-medium leading-relaxed">
            Se produció el siguiente error al procesar con su solicitud:
          </p>
          <div className="bg-gray-50 border border-gray-200 p-4 min-h-[100px] flex items-center justify-center">
            <p className="text-gray-900 font-bold text-center">
              Se produció un error al procesar con su solicitud
            </p>
          </div>
        </div>
        
        <div className="flex justify-start">
          <Button 
            onClick={handleAccept}
            className="bg-[#7d7d7d] hover:bg-black text-white px-10 h-10 font-bold uppercase text-[11px] tracking-widest rounded-none shadow-none"
          >
            Aceptar
          </Button>
        </div>
      </div>
    </div>
  );
}