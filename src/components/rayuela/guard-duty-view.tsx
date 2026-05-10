"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, 
  ArrowLeft, 
  Clock, 
  AlertTriangle, 
  Monitor, 
  ExternalLink, 
  UserCircle, 
  Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { AttendanceBySubjectView } from './attendance-by-subject-view';

export function GuardDutyView({ profesorId }: { profesorId: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const db = useFirestore();

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentDay = useMemo(() => {
    if (!now) return "";
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[now.getDay()];
  }, [now]);

  const currentTimeStr = useMemo(() => {
    if (!now) return "";
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }, [now]);

  const myScheduleQuery = useMemoFirebase(() => {
    if (!db || !profesorId || !currentDay) return null;
    return query(
      collection(db, 'horarios'),
      where('profesorId', '==', profesorId),
      where('dia', '==', currentDay),
      where('esGuardia', '==', true)
    );
  }, [db, profesorId, currentDay]);

  const { data: myDutySlots, isLoading: loadingMyDuty } = useCollection(myScheduleQuery);

  const activeDuty = useMemo(() => {
    if (!myDutySlots || !currentTimeStr) return null;
    return myDutySlots.find(slot => currentTimeStr >= slot.horaInicio && currentTimeStr <= slot.horaFin);
  }, [myDutySlots, currentTimeStr]);

  const allSchedulesQuery = useMemoFirebase(() => {
    if (!db || !currentDay) return null;
    return query(
      collection(db, 'horarios'),
      where('dia', '==', currentDay),
      where('esGuardia', '==', false)
    );
  }, [db, currentDay]);

  const { data: allSchedules } = useCollection(allSchedulesQuery);

  const activeClasses = useMemo(() => {
    if (!allSchedules || !currentTimeStr) return [];
    return allSchedules.filter(slot => currentTimeStr >= slot.horaInicio && currentTimeStr <= slot.horaFin);
  }, [allSchedules, currentTimeStr]);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'usuarios');
  }, [db]);
  const { data: allUsers } = useCollection(usersQuery);

  const groupsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'gruposAlumnos');
  }, [db]);
  const { data: allGroups } = useCollection(groupsQuery);

  const getProfesorName = (id: string) => {
    const user = allUsers?.find(u => u.id === id);
    return user ? (user.nombrePersona || user.usuario) : id;
  };

  const getDynamicAlumnosCount = (cls: any) => {
    if (!allUsers || !allGroups) return 0;
    const group = allGroups.find(g => g.id === cls.grupoId);
    if (group?.cursoVinculado) {
      return allUsers.filter(u => u.cursoAlumno === group.cursoVinculado && u.rolesUsuario?.includes('EsAlumno')).length;
    }
    return cls.alumnosIds?.length || 0;
  };

  if (loadingMyDuty || !now) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#89a54e]" />
      </div>
    );
  }

  if (selectedClassId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <Button variant="ghost" onClick={() => setSelectedClassId(null)} className="text-[10px] font-bold uppercase gap-2">
            <ArrowLeft className="h-3 w-3" /> Volver al listado de guardia
          </Button>
          <div className="text-[11px] font-bold text-[#89a54e] bg-[#89a54e]/10 px-3 py-1 rounded">MODO GUARDIA ACTIVO</div>
        </div>
        <AttendanceBySubjectView profesorId={profesorId} manualScheduleId={selectedClassId} />
      </div>
    );
  }

  if (!activeDuty) {
    return (
      <div className="animate-in fade-in duration-500 py-20 flex flex-col items-center justify-center space-y-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
          <Clock className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-gray-800">En este momento no está de guardia</h2>
          <p className="text-gray-400 italic max-w-sm">No consta ninguna sesión de guardia asignada a su perfil para el tramo horario de las {currentTimeStr}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 max-w-6xl mx-auto w-full">
      <div className="bg-[#89a54e] p-6 text-white rounded-xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg"><AlertTriangle className="h-6 w-6" /></div>
          <div>
            <h2 className="text-lg font-bold uppercase tracking-tight">Sesión de Guardia Activa</h2>
            <p className="text-white/80 text-sm">Tramo: {activeDuty.horaInicio} - {activeDuty.horaFin} | {currentDay}, {currentTimeStr}</p>
          </div>
        </div>
        <Badge className="bg-white text-[#89a54e] font-bold uppercase px-4 py-1.5 border-none">Asignada</Badge>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase text-gray-500 flex items-center gap-2">
          <Monitor className="h-4 w-4" /> Clases activas en el centro en este momento
        </h3>

        {activeClasses.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 p-20 rounded-xl text-center text-gray-400 italic">
            No constan clases lectivas activas para este tramo horario.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeClasses.map(cls => (
              <div key={cls.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-[#89a54e] hover:shadow-md transition-all group flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-[9px] font-bold border-gray-300 text-gray-500 uppercase">{cls.horaInicio} - {cls.horaFin}</Badge>
                    <span className="text-[10px] font-bold text-[#89a54e] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      ACCEDER <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 leading-tight">{cls.asignatura}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <UserCircle className="h-3.5 w-3.5" />
                    <span className="font-medium truncate">{getProfesorName(cls.profesorId)}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                    <Users className="h-3.5 w-3.5" />
                    {getDynamicAlumnosCount(cls)} ALUMNOS
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedClassId(cls.id)}
                    className="bg-[#89a54e] hover:bg-[#728a41] text-white text-[10px] font-bold uppercase px-4 h-8"
                  >
                    Pasar Lista
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
