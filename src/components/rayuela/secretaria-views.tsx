
"use client";

import React, { useState, useMemo } from 'react';
import { 
  Loader2, 
  Search, 
  Key, 
  UserCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Briefcase,
  Coins,
  FileText,
  Award,
  Book,
  Library,
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { updateDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  Bar, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Vista de Gestión Económica.
 * Saldo base de 10.000€ + gestión de ingresos y gastos.
 */
export function EconomyManagementView() {
  const db = useFirestore();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const transactionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'transacciones'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: transactions, isLoading } = useCollection(transactionsQuery);

  const currentBalance = useMemo(() => {
    const base = 10000;
    if (!transactions) return base;
    return transactions.reduce((acc, t) => {
      return t.tipo === 'Ingreso' ? acc + t.cantidad : acc - t.cantidad;
    }, base);
  }, [transactions]);

  const handleAddTransaction = (tipo: 'Ingreso' | 'Gasto') => {
    if (!db || !amount || parseFloat(amount) <= 0) {
      toast({ variant: "destructive", title: "Cantidad inválida", description: "Indique un importe mayor a 0." });
      return;
    }

    setIsSaving(true);
    addDocumentNonBlocking(collection(db, 'transacciones'), {
      tipo,
      cantidad: parseFloat(amount),
      descripcion: description || (tipo === 'Ingreso' ? 'Entrada de fondos' : 'Pago autorizado'),
      createdAt: new Date().toISOString()
    });

    toast({ 
      title: tipo === 'Ingreso' ? "Ingreso Registrado" : "Gasto Autorizado", 
      description: `Se han ${tipo === 'Ingreso' ? 'añadido' : 'detraído'} ${amount}€ al balance del centro.` 
    });

    setAmount("");
    setDescription("");
    setIsSaving(false);
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#fb8500]" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 max-w-5xl mx-auto w-full font-verdana">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-white border-orange-100 shadow-md md:col-span-2">
            <CardHeader className="bg-orange-50/50 border-b">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="bg-[#fb8500] p-2 rounded-lg text-white shadow-sm"><Wallet className="h-5 w-5" /></div>
                     <CardTitle className="text-sm font-bold uppercase tracking-tight">Balance Presupuestario</CardTitle>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-none font-bold">ACTUALIZADO</Badge>
               </div>
            </CardHeader>
            <CardContent className="p-8 text-center">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Saldo Disponible en Caja</span>
               <p className={cn(
                 "text-5xl font-bold tracking-tighter",
                 currentBalance >= 0 ? "text-gray-800" : "text-red-600"
               )}>
                 {currentBalance.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
               </p>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t p-4 flex justify-center gap-8">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-[9px] font-bold text-gray-500 uppercase italic">Base Rayuela: 10.000,00 €</span>
               </div>
            </CardFooter>
         </Card>

         <Card className="bg-white border-orange-100 shadow-md">
            <CardHeader className="bg-gray-50 border-b">
               <CardTitle className="text-xs font-bold uppercase">Operación Rápida</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
               <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-gray-400">Importe (€)</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-10 font-bold border-orange-200"
                  />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-gray-400">Concepto</Label>
                  <Input 
                    placeholder="Descripción..." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="text-xs"
                  />
               </div>
               <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button onClick={() => handleAddTransaction('Ingreso')} className="bg-green-600 hover:bg-green-700 text-white text-[9px] font-bold uppercase h-9">
                    <TrendingUp className="h-3.5 w-3.5 mr-1" /> Ingreso
                  </Button>
                  <Button onClick={() => handleAddTransaction('Gasto')} variant="destructive" className="text-[9px] font-bold uppercase h-9">
                    <TrendingDown className="h-3.5 w-3.5 mr-1" /> Gasto
                  </Button>
               </div>
            </CardContent>
         </Card>
      </div>

      <Card className="bg-white shadow-sm overflow-hidden">
         <CardHeader className="bg-gray-100 p-4 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
               <Coins className="h-4 w-4 text-[#fb8500]" />
               <CardTitle className="text-xs font-bold uppercase">Historial de Movimientos de Caja</CardTitle>
            </div>
         </CardHeader>
         <div className="p-0">
            <ScrollArea className="h-[300px]">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 sticky top-0 z-10 border-b">
                     <tr>
                        <th className="p-4 text-[9px] font-bold text-gray-400 uppercase">Fecha</th>
                        <th className="p-4 text-[9px] font-bold text-gray-400 uppercase">Concepto</th>
                        <th className="p-4 text-[9px] font-bold text-gray-400 uppercase">Tipo</th>
                        <th className="p-4 text-[9px] font-bold text-gray-400 uppercase text-right">Importe</th>
                     </tr>
                  </thead>
                  <tbody>
                     {transactions?.length === 0 ? (
                       <tr><td colSpan={4} className="p-10 text-center text-gray-400 italic text-xs">No constan transacciones recientes.</td></tr>
                     ) : (
                       transactions?.map((t) => (
                         <tr key={t.id} className="border-b hover:bg-gray-50/50 transition-colors">
                           <td className="p-4 text-[10px] font-medium text-gray-500">{format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                           <td className="p-4 text-xs font-bold text-gray-700 uppercase">{t.descripcion}</td>
                           <td className="p-4">
                              <Badge className={cn(
                                "text-[8px] font-bold px-2 py-0.5 border-none uppercase",
                                t.tipo === 'Ingreso' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              )}>
                                {t.tipo}
                              </Badge>
                           </td>
                           <td className={cn(
                             "p-4 text-right text-xs font-bold",
                             t.tipo === 'Ingreso' ? "text-green-600" : "text-red-600"
                           )}>
                             {t.tipo === 'Ingreso' ? '+' : '-'}{t.cantidad.toFixed(2)} €
                           </td>
                         </tr>
                       ))
                     )}
                  </tbody>
               </table>
            </ScrollArea>
         </div>
      </Card>
    </div>
  );
}

/**
 * Vista de Arqueo de Caja.
 * Gráficas comparativas y control de porcentajes.
 */
export function CashClosingView() {
  const db = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'transacciones');
  }, [db]);

  const { data: transactions, isLoading } = useCollection(transactionsQuery);

  const stats = useMemo(() => {
    if (!transactions) return { ingresos: 0, gastos: 0 };
    return transactions.reduce((acc, t) => {
      if (t.tipo === 'Ingreso') acc.ingresos += t.cantidad;
      else acc.gastos += t.cantidad;
      return acc;
    }, { ingresos: 0, gastos: 0 });
  }, [transactions]);

  const barData = [
    { name: 'Ingresos', valor: stats.ingresos, fill: '#22c55e' },
    { name: 'Gastos', valor: stats.gastos, fill: '#ef4444' }
  ];

  const pieData = [
    { name: 'Presupuesto Restante', value: 10000 + stats.ingresos - stats.gastos, color: '#fb8500' },
    { name: 'Gastos Ejecutados', value: stats.gastos, color: '#ef4444' }
  ];

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#fb8500]" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 max-w-5xl mx-auto w-full">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white shadow-md border-orange-100">
             <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                   <BarChart3 className="h-5 w-5 text-orange-600" />
                   <CardTitle className="text-xs font-bold uppercase">Balance de Operaciones</CardTitle>
                </div>
             </CardHeader>
             <CardContent className="pt-8 h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                      <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={60} />
                   </BarChart>
                </ResponsiveContainer>
             </CardContent>
          </Card>

          <Card className="bg-white shadow-md border-orange-100">
             <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                   <PieChartIcon className="h-5 w-5 text-orange-600" />
                   <CardTitle className="text-xs font-bold uppercase">Ejecución del Presupuesto</CardTitle>
                </div>
             </CardHeader>
             <CardContent className="pt-8 h-[350px] flex flex-col items-center">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} formatter={(val) => <span className="text-[10px] font-bold uppercase text-gray-500">{val}</span>} />
                   </PieChart>
                </ResponsiveContainer>
             </CardContent>
          </Card>
       </div>

       <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl flex items-start gap-4">
          <ShieldAlert className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
             <h4 className="text-sm font-bold text-blue-800 uppercase tracking-tight">Control de Auditoría</h4>
             <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
               El arqueo de caja se realiza de forma automática cada 24 horas. Asegúrese de que todos los justificantes físicos coinciden con los registros digitales para evitar descuadres en la liquidación trimestral.
             </p>
          </div>
       </div>
    </div>
  );
}

/**
 * Vista de seCODEX (Sello de Buena Práctica).
 */
export function SecodexView() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const studentsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'usuarios'), orderBy('nombrePersona'));
  }, [db]);

  const { data: allUsers } = useCollection(studentsQuery);
  const students = useMemo(() => allUsers?.filter(u => u.rolesUsuario?.includes('EsAlumno')) || [], [allUsers]);

  const secodexQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'secodex');
  }, [db]);

  const { data: participants, isLoading } = useCollection(secodexQuery);

  const handleAddSeal = (student: any) => {
    if (!db) return;
    const sealId = `seal_${student.id}`;
    setDocumentNonBlocking(doc(db, 'secodex', sealId), {
      studentId: student.id,
      nombre: student.nombrePersona || student.usuario,
      curso: student.cursoAlumno || 'S/C',
      foto: student.imagenPerfil,
      createdAt: new Date().toISOString()
    }, { merge: true });

    toast({ 
      title: "Sello Concedido", 
      description: `${student.nombrePersona} ha sido añadido a la lista oficial de seCODEX.` 
    });
    setIsAdding(false);
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin text-[#fb8500]" /></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-8 max-w-5xl mx-auto w-full">
       <div className="bg-[#fb8500] p-8 text-white rounded-2xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="bg-white/20 p-4 rounded-2xl"><Award className="h-10 w-10" /></div>
             <div>
                <h2 className="text-2xl font-bold uppercase tracking-tight">seCODEX: Sello de Buena Práctica</h2>
                <p className="text-white/80 text-sm font-medium">Reconocimiento al alumnado por su excelencia en la convivencia.</p>
             </div>
          </div>
          <Button onClick={() => setIsAdding(true)} className="bg-white text-[#fb8500] hover:bg-white/90 font-bold uppercase px-8 h-12 shadow-md gap-2">
             <Plus className="h-5 w-5" /> Alumnado Participante
          </Button>
       </div>

       <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase text-gray-500 flex items-center gap-2">
             <Users className="h-4 w-4" /> Alumnado con Reconocimiento
          </h3>

          {participants?.length === 0 ? (
            <div className="py-20 text-center bg-gray-50 border-2 border-dashed rounded-2xl opacity-40">
               <p className="text-sm italic">No hay alumnos premiados con el sello seCODEX todavía.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {participants?.map((p) => (
                 <div key={p.id} className="bg-white border rounded-xl p-4 flex items-center gap-4 shadow-sm group hover:border-[#fb8500] transition-all">
                    <Avatar className="h-14 w-14 border-2 border-orange-50">
                       <AvatarImage src={p.foto} />
                       <AvatarFallback className="bg-gray-100 text-gray-400 font-bold">{p.nombre.substring(0,2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-gray-800 uppercase truncate">{p.nombre}</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase">{p.curso}</p>
                       <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-orange-600 bg-orange-50 w-fit px-2 py-0.5 rounded-full uppercase">
                          <Check className="h-2.5 w-2.5" /> Sello seCODEX
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
       </div>

       <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogContent className="max-w-2xl p-0 border-none overflow-hidden font-verdana">
             <DialogHeader className="bg-[#fb8500] p-6 text-white text-center shrink-0">
                <DialogTitle className="text-lg font-bold uppercase tracking-widest">Añadir al Sello de Buena Práctica</DialogTitle>
                <DialogDescription className="text-white/80 text-xs font-medium uppercase">Listado oficial de candidatos del centro</DialogDescription>
             </DialogHeader>
             
             <ScrollArea className="h-[400px] p-6 bg-white">
                <div className="space-y-2">
                   {students.map(s => {
                     const isRewarded = participants?.some(p => p.studentId === s.id);
                     return (
                       <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                             <Avatar className="h-10 w-10 border shadow-sm">
                                <AvatarImage src={s.imagenPerfil} />
                                <AvatarFallback>{s.usuario?.substring(0,2).toUpperCase()}</AvatarFallback>
                             </Avatar>
                             <div>
                                <p className="text-xs font-bold text-gray-700 uppercase">{s.nombrePersona || s.usuario}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">{s.cursoAlumno || 'S/C'}</p>
                             </div>
                          </div>
                          {isRewarded ? (
                            <Badge className="bg-green-100 text-green-700 border-none font-bold text-[9px] uppercase">YA PREMIADO</Badge>
                          ) : (
                            <Button onClick={() => handleAddSeal(s)} size="sm" className="bg-[#fb8500] hover:bg-[#e07600] text-white text-[9px] font-bold uppercase h-8 px-4 gap-2">
                               Ir <ArrowRight className="h-3 w-3" />
                            </Button>
                          )}
                       </div>
                     );
                   })}
                </div>
             </ScrollArea>

             <DialogFooter className="bg-gray-50 p-4 border-t">
                <Button variant="outline" onClick={() => setIsAdding(false)} className="text-[10px] font-bold uppercase h-9">Cerrar</Button>
             </DialogFooter>
          </DialogContent>
       </Dialog>
    </div>
  );
}

/**
 * Vistas de Error y Avisos de Estado.
 */
export function SecretaryErrorView({ code, title }: { code: string, title: string }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 py-20 flex flex-col items-center justify-center space-y-6 text-center">
      <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-600 border border-red-100">
        <ShieldAlert className="h-12 w-12" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">{title}</h2>
        <p className="text-red-600 font-mono font-bold text-lg">Acceso no permitido, Cod. Error: {code}</p>
      </div>
      <Badge className="bg-red-600 text-white px-6 py-1.5 font-bold uppercase tracking-widest text-[10px]">RESTRICCIÓN DE SEGURIDAD</Badge>
    </div>
  );
}

export function SecretaryPlaceholderView({ title }: { title: string }) {
  const isFP = title.includes('Profesional');
  const getIcon = () => {
    if (isFP) return <Library className="h-12 w-12" />;
    if (title.includes('Económica')) return <Coins className="h-12 w-12" />;
    if (title.includes('Título') || title === 'seCODEX') return <Award className="h-12 w-12" />;
    return <FileText className="h-12 w-12" />;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 py-20 flex flex-col items-center justify-center space-y-6 text-center">
      <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-[#fb8500] border border-orange-100">
        {getIcon()}
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">{title}</h2>
        <p className="text-gray-400 italic max-w-md mx-auto leading-relaxed">
          {isFP 
            ? "No hay ciclos de Formación Profesional en curso"
            : `Esta sección de ${title.toLowerCase()} está siendo sincronizada con el servidor central de Rayuela (Comunidad de Madrid).`}
        </p>
      </div>
      <Badge className={cn(
        "px-6 py-1.5 font-bold uppercase tracking-widest text-[10px]",
        isFP ? "bg-gray-400 text-white" : "bg-[#fb8500] text-white"
      )}>
        {isFP ? "SIN REGISTROS" : "Servicio en Sincronización"}
      </Badge>
    </div>
  );
}
