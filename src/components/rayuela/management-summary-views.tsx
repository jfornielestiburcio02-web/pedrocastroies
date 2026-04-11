
"use client";

import React, { useMemo } from 'react';
import { 
  Loader2, 
  BarChart3, 
  TrendingUp, 
  ShieldAlert, 
  Info,
  Calendar
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  ChartConfig, 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Pie,
  PieChart,
  Cell
} from 'recharts';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

/**
 * Vista de Resumen de Evaluaciones (Gráficas) para Dirección.
 */
export function EvaluationsSummaryView() {
  const db = useFirestore();

  const gradesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'calificacionesFinales');
  }, [db]);

  const { data: grades, isLoading } = useCollection(gradesQuery);

  const chartData = useMemo(() => {
    if (!grades) return [];

    // Agrupar por rangos de notas (0-4, 5, 6, 7, 8, 9, 10)
    // O por etiquetas cualitativas
    const distribution: Record<string, number> = {
      "IN (0-4)": 0,
      "SU (5)": 0,
      "BI (6)": 0,
      "NT (7-8)": 0,
      "SB (9-10)": 0
    };

    grades.forEach(g => {
      const nota = g.nota;
      if (typeof nota === 'string') {
        if (nota === 'IN' || parseFloat(nota) < 5) distribution["IN (0-4)"]++;
        else if (nota === 'SU' || parseFloat(nota) >= 5 && parseFloat(nota) < 6) distribution["SU (5)"]++;
        else if (nota === 'BI' || parseFloat(nota) >= 6 && parseFloat(nota) < 7) distribution["BI (6)"]++;
        else if (nota === 'NT' || parseFloat(nota) >= 7 && parseFloat(nota) < 9) distribution["NT (7-8)"]++;
        else if (nota === 'SB' || parseFloat(nota) >= 9) distribution["SB (9-10)"]++;
      }
    });

    return Object.entries(distribution).map(([name, total]) => ({
      name,
      total,
      fill: name.startsWith("IN") ? "hsl(var(--destructive))" : "hsl(var(--primary))"
    }));
  }, [grades]);

  const chartConfig = {
    total: {
      label: "Alumnos",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#9c4d96]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 max-w-5xl mx-auto w-full font-verdana">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-white shadow-sm border-gray-200">
            <CardHeader className="pb-2">
               <CardDescription className="text-[10px] font-bold uppercase text-gray-400">Total Notas Registradas</CardDescription>
               <CardTitle className="text-3xl font-bold text-[#9c4d96]">{grades?.length || 0}</CardTitle>
            </CardHeader>
            <CardFooter className="pt-0">
               <div className="flex items-center gap-1 text-[9px] font-bold text-green-600 uppercase">
                  <TrendingUp className="h-3 w-3" /> Datos actualizados
               </div>
            </CardFooter>
         </Card>
         
         <Card className="bg-white shadow-sm border-gray-200">
            <CardHeader className="pb-2">
               <CardDescription className="text-[10px] font-bold uppercase text-gray-400">Tasa de Aprobado</CardDescription>
               <CardTitle className="text-3xl font-bold text-gray-800">
                 {grades && grades.length > 0 
                   ? Math.round((grades.filter(g => g.nota !== 'IN' && parseFloat(g.nota) >= 5).length / grades.length) * 100) 
                   : 0}%
               </CardTitle>
            </CardHeader>
            <CardFooter className="pt-0">
               <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase">
                  <Info className="h-3 w-3" /> Notas ≥ 5.0
               </div>
            </CardFooter>
         </Card>

         <Card className="bg-white shadow-sm border-gray-200">
            <CardHeader className="pb-2">
               <CardDescription className="text-[10px] font-bold uppercase text-gray-400">Sobresalientes</CardDescription>
               <CardTitle className="text-3xl font-bold text-[#fb8500]">
                 {grades?.filter(g => g.nota === 'SB' || parseFloat(g.nota) >= 9).length || 0}
               </CardTitle>
            </CardHeader>
            <CardFooter className="pt-0">
               <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase">
                  <TrendingUp className="h-3 w-3" /> Máximo rendimiento
               </div>
            </CardFooter>
         </Card>
      </div>

      <Card className="bg-white shadow-sm border-gray-200">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#9c4d96]" />
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-tight">Distribución Global de Calificaciones</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase">Consolidado del Centro Educativo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-10">
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="total" 
                radius={[4, 4, 0, 0]} 
                barSize={60}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t p-4">
           <p className="text-[10px] text-gray-500 font-medium italic leading-relaxed">
             Este gráfico muestra el balance de resultados académicos en base a las calificaciones finales introducidas por el profesorado en el periodo de evaluación vigente.
           </p>
        </CardFooter>
      </Card>
    </div>
  );
}

/**
 * Vista de Resumen de Conductas para Dirección.
 */
export function IncidentsSummaryView() {
  const db = useFirestore();

  const incidentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'incidencias');
  }, [db]);

  const { data: incidents, isLoading } = useCollection(incidentsQuery);

  const pieData = useMemo(() => {
    if (!incidents) return [];
    
    const contraria = incidents.filter(i => i.tipoIncidencia === 'Contraria').length;
    const grave = incidents.filter(i => i.tipoIncidencia === 'Grave').length;

    return [
      { name: 'Contraria', value: contraria, fill: '#fb8500' },
      { name: 'Grave', value: grave, fill: '#ef4444' }
    ];
  }, [incidents]);

  const COLORS = ['#fb8500', '#ef4444'];

  if (isLoading) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#9c4d96]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 max-w-5xl mx-auto w-full font-verdana">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <Card className="bg-white shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
               <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-sm font-bold uppercase tracking-tight">Estadística por Tipo</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[350px] p-6">
               <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
               </ResponsiveContainer>
               <div className="flex gap-8 mt-4">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#fb8500]"></div>
                     <span className="text-[10px] font-bold text-gray-500 uppercase">Contraria ({pieData[0]?.value})</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                     <span className="text-[10px] font-bold text-gray-500 uppercase">Grave ({pieData[1]?.value})</span>
                  </div>
               </div>
            </CardContent>
         </Card>

         <Card className="bg-white shadow-sm border-gray-200">
            <CardHeader className="bg-gray-50 border-b">
               <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#9c4d96]" />
                  <CardTitle className="text-sm font-bold uppercase tracking-tight">Incidencias Mensuales</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="pt-10">
               <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl">
                  <div className="text-center space-y-2">
                     <Calendar className="h-10 w-10 mx-auto text-gray-200" />
                     <p className="text-[11px] text-gray-400 font-bold uppercase">Análisis Temporal en Preparación</p>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>

      <div className="bg-red-50 border border-red-100 p-6 rounded-xl flex items-start gap-4 shadow-sm">
         <div className="bg-red-600 p-2 rounded-lg text-white shadow-md">
            <ShieldAlert className="h-6 w-6" />
         </div>
         <div className="space-y-1">
            <h4 className="text-sm font-bold text-red-800 uppercase tracking-tight">Aviso de Disciplina</h4>
            <p className="text-[11px] text-red-700 leading-relaxed font-medium">
              El censo actual muestra un total de <strong>{incidents?.length || 0} amonestaciones</strong> en el expediente digital. Dirección recomienda la revisión de las medidas correctoras aplicadas en las juntas de evaluación para aquellos alumnos con más de 3 conductas graves.
            </p>
         </div>
      </div>
    </div>
  );
}
