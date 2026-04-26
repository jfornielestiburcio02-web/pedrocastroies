
"use client";

import React from 'react';
import { Files, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// View Imports
import { AttendanceBySubjectView } from '@/components/rayuela/attendance-by-subject-view';
import { GuardDutyView } from '@/components/rayuela/guard-duty-view';
import { AlumnadoIncidenteView } from '@/components/rayuela/alumnado-incidente-view';
import { MessagingView } from '@/components/rayuela/messaging-view';
import { TutorialFunctionView } from '@/components/rayuela/tutorial-function-view';
import { ScheduleListView, ScheduleCreationView, MyScheduleView } from '@/components/rayuela/schedule-views';
import { MyTutoringStudentsView, CenterStudentsView, TeacherGroupsView } from '@/components/rayuela/student-management-views';
import { EvaluationsView } from '@/components/rayuela/evaluations-views';
import { EvaluationOpeningView } from '@/components/rayuela/management-evaluation-views';
import { TeacherGradingView } from '@/components/rayuela/teacher-grading-view';
import { TutoringGradesView } from '@/components/rayuela/tutoring-grades-view';
import { UserCreationView, UserManagementListView, UserProfilesManagementView } from '@/components/rayuela/user-management-views';
import { EvaluationsSummaryView, IncidentsSummaryView } from '@/components/rayuela/management-summary-views';
import { TeacherNotificationsView } from '@/components/rayuela/teacher-notifications-view';
import { LinksOfInterestView } from '@/components/rayuela/links-of-interest-view';
import { ExtraescolaresActivitiesView } from '@/components/rayuela/extraescolares-activities-view';
import { ProaDesignationView } from '@/components/rayuela/proa-designation-view';
import { DiagnosticOpeningView, DiagnosticGradingView, DiagnosticResultsView } from '@/components/rayuela/diagnostic-tests-views';
import { ProfileSyncView } from '@/components/rayuela/profile-sync-view';
import { 
  CredentialDeliveryView, 
  SecretaryPlaceholderView, 
  EconomyManagementView, 
  CashClosingView,
  SecodexView,
  SecretaryErrorView
} from '@/components/rayuela/secretaria-views';
import { 
  StudentAttendanceView, 
  StudentBehaviorView, 
  StudentGradesView, 
  StudentEvaluationsListView, 
  StudentScheduleView 
} from '@/components/rayuela/student-views';

interface RayuelaContentManagerProps {
  activeSubContent: string | null;
  selectedModule: string | null;
  activeRole: string | null;
  effectiveTeacherId: string;
  usuarioId: string;
  userData: any;
  onSetSelectedModule: (module: string | null) => void;
  onSetActiveSubContent: (content: string | null) => void;
  onNavigateToIncident: (studentId: string) => void;
  targetIncidentStudentId?: string;
  onActionComplete: () => void;
}

export function RayuelaContentManager({
  activeSubContent,
  selectedModule,
  activeRole,
  effectiveTeacherId,
  usuarioId,
  userData,
  onSetSelectedModule,
  onSetActiveSubContent,
  onNavigateToIncident,
  targetIncidentStudentId,
  onActionComplete
}: RayuelaContentManagerProps) {
  
  const renderView = () => {
    switch (activeSubContent) {
      case 'Modificar / crear Horarios': return <ScheduleCreationView />;
      case 'Ver Horarios': return <ScheduleListView />;
      case 'Mi Horario Personal': return <MyScheduleView profesorId={effectiveTeacherId} />;
      case 'Por materia': return <AttendanceBySubjectView profesorId={effectiveTeacherId} />;
      case 'Funcion tutorial': return <TutorialFunctionView profesorId={effectiveTeacherId} grupoTutorizado={userData?.esTutor} />;
      case 'Guardias': return <GuardDutyView profesorId={effectiveTeacherId} />;
      case 'Alumnado Incidente': 
        return (
          <AlumnadoIncidenteView 
            profesorId={effectiveTeacherId} 
            targetStudentId={targetIncidentStudentId} 
            onActionComplete={onActionComplete}
          />
        );
      case 'Gestión de Grupos': return <TeacherGroupsView profesorId={effectiveTeacherId} />;
      case 'Mis Mensajes': 
        return (
          <MessagingView 
            mode="inbox" 
            usuarioId={usuarioId} 
            onNavigateToIncident={onNavigateToIncident}
          />
        );
      case 'Papelera Mensajería': return <MessagingView mode="trash" usuarioId={usuarioId} />;
      case 'Alumnado de mi tutoria': return <MyTutoringStudentsView grupoTutorizado={userData?.esTutor} />;
      case 'Alumnado del centro': return <CenterStudentsView />;
      case 'Exámenes': return <EvaluationsView profesorId={effectiveTeacherId} type="exam" />;
      case 'Tareas': return <EvaluationsView profesorId={effectiveTeacherId} type="task" />;
      case 'Calificar': return <TeacherGradingView profesorId={effectiveTeacherId} />;
      case 'Evaluación como tutor': return <TutoringGradesView grupoTutorizado={userData?.esTutor} />;
      case 'Creación de Usuarios': return <UserCreationView />;
      case 'Visualización de Usuarios': return <UserManagementListView />;
      case 'Apertura de la evaluación': return <EvaluationOpeningView />;
      case 'Evaluaciones (Gráficas)': return <EvaluationsSummaryView />;
      case 'Resumen Conductas': return <IncidentsSummaryView />;
      case 'Agregar y quitar Perfiles': return <UserProfilesManagementView />;
      case 'De Mis Alumnos': return <TeacherNotificationsView profesorId={effectiveTeacherId} mode="my-students" />;
      case 'De mi tutoría': return <TeacherNotificationsView profesorId={effectiveTeacherId} mode="tutoring" grupoTutorizado={userData?.esTutor} />;
      case 'Mis enlaces': return <LinksOfInterestView profesorId={usuarioId} />;
      case 'Mis faltas': return <StudentAttendanceView studentId={usuarioId} />;
      case 'Justificar': return <StudentAttendanceView studentId={usuarioId} onlyUnjustified />;
      case 'Negativos / Positivos': return <StudentBehaviorView studentId={usuarioId} />;
      case 'Amonestaciones Alumno': return <StudentBehaviorView studentId={usuarioId} onlyIncidents />;
      case 'Calificaciones y nota final': return <StudentGradesView studentId={usuarioId} />;
      case 'Mis Tareas': return <StudentEvaluationsListView studentId={usuarioId} type="task" />;
      case 'Mis Exámenes': return <StudentEvaluationsListView studentId={usuarioId} type="exam" />;
      case 'Mi Horario Alumno': return <StudentScheduleView studentId={usuarioId} />;
      case 'Entrega de credenciales': return <CredentialDeliveryView />;
      case 'Gestión Económica':
      case 'Gastos y ganancias': return <EconomyManagementView />;
      case 'Arqueo de caja (Control)': return <CashClosingView />;
      case 'seCODEX': return <SecodexView />;
      case 'Título de bachillerato': return <SecretaryErrorView code="19832" title={activeSubContent} />;
      case 'Formación Profesional': return <SecretaryPlaceholderView title={activeSubContent} />;
      case 'Por Alumno':
      case 'Por centro': return <CenterStudentsView />;
      case 'Tasas por descuento': return <SecretaryPlaceholderView title={activeSubContent} />;
      case 'Apertura de la evaluación (Diag)': return <DiagnosticOpeningView />;
      case 'Como Profesor': return <DiagnosticGradingView profesorId={effectiveTeacherId} />;
      case 'Como tutor': return <DiagnosticResultsView mode="tutor" grupoTutorizado={userData?.esTutor} />;
      case 'Como cargo directivo del centro': return <DiagnosticResultsView mode="center" />;
      case 'Por curso (Diag)': return <DiagnosticResultsView mode="course" />;
      case 'Por alumno (Diag)': return <DiagnosticResultsView mode="student" />;
      case 'Actividades Extraescolares': return <ExtraescolaresActivitiesView />;
      case 'Designar PROA+': return <ProaDesignationView mode="proa" />;
      case 'Designar Profesor DAD': return <ProaDesignationView mode="dad" />;
      case 'Sincronizacion Perfiles': return <ProfileSyncView />;
      default:
        if (activeSubContent) {
          return (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="bg-white border rounded-lg p-10 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center",
                    activeRole === 'Secretaría' ? "bg-[#fb8500]/10 text-[#fb8500]" :
                    (activeRole === 'Profesor' || activeRole === 'Alumno') ? "bg-[#89a54e]/10 text-[#89a54e]" : "bg-[#9c4d96]/10 text-[#9c4d96]"
                  )}>
                     <Files className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">{activeRole}: {activeSubContent}</h2>
                  <p className="text-gray-500 italic max-w-md">
                    Contenido del módulo de {selectedModule?.toLowerCase()} para la sección de {activeSubContent.toLowerCase()} gestionado como {activeRole}.
                  </p>
               </div>
            </div>
          );
        }
        return (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="p-12 border-2 border-gray-100 bg-gray-50/30 rounded-3xl w-full text-center space-y-6 shadow-inner">
                <p className="text-xl text-gray-600">Acceso activo como <span className="font-bold text-primary">{activeRole}</span></p>
                <div className="bg-white p-8 rounded-xl border border-200 text-base text-gray-700 italic leading-relaxed shadow-sm max-w-3xl mx-auto">
                  {activeRole === 'Profesor' 
                    ? "Seleccione una option del menú lateral para comenzar el seguimiento de sus alumnos." 
                    : activeRole === 'PROA+'
                    ? `Usted está actuando como profesor de refuerzo (PROA+). ${userData?.esDADDe ? 'Visualiza y gestiona el horario de ' + userData.esDADDe + '.' : 'Seleccione una opción para gestionar las medidas de apoyo.'}`
                    : activeRole === 'Profesor Gestión'
                    ? "Perfil de profesorado con acceso a herramientas de gestión administrativa y coordinación horaria. Utilice el menú lateral morado."
                    : activeRole === 'Alumno'
                    ? "Entorno de seguimiento académico activo para consulta de notas y asistencia personal."
                    : activeRole === 'Dirección'
                    ? "Entorno de gestión del equipo directivo para la administración del centro."
                    : activeRole === 'Secretaría'
                    ? "Entorno de secretaría virtual para trámites administrativos y expedientes."
                    : activeRole === 'CAU'
                    ? "Entorno de soporte técnico y atención de usuarios activo."
                    : activeRole === 'Ciudadano'
                    ? "Entorno de trámites públicos y servicios al ciudadano. Este perfil no requiere menú lateral para facilitar la navegación directa."
                    : activeRole === 'Calificador Diagnóstico (coord)'
                    ? "Entorno de coordinación para las pruebas de diagnóstico. Utilice el menú lateral morado para gestionar la apertura y resultados."
                    : activeRole === 'act extraesc.(coord)'
                    ? "Entorno de gestión de actividades complementarias y extraescolares. Utilice el menú lateral morado para planificar las salidas del centro."
                    : `Usted está operando con el perfil especial de ${activeRole}. Seleccione una opción del menú para gestionar sus responsabilidades.`}
                </div>
                <div className="flex justify-center pt-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Sesión OK
                  </div>
                </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 animate-in fade-in duration-300 relative bg-white flex flex-col w-full p-4 md:p-8">
       <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <h1 className="text-lg md:text-xl font-bold text-gray-800 uppercase tracking-tight flex items-center gap-2">
            {activeSubContent ? activeSubContent : (selectedModule === 'CAU' ? 'CENTRO ATENCIÓN DE USUARIOS' : selectedModule)}
          </h1>
          <Button variant="ghost" onClick={() => { onSetSelectedModule(null); onSetActiveSubContent(null); }} className="gap-2 text-gray-500 hover:text-primary transition-colors text-[10px] font-bold uppercase tracking-widest">
            <ArrowLeft className="h-3 w-3" /> Volver al menú
          </Button>
        </div>

        <div className="flex-1">
          {renderView()}
        </div>
       </div>
    </div>
  );
}
