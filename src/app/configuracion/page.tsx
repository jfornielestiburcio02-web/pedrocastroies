"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  ArrowLeft, 
  Save, 
  UserCircle, 
  Key, 
  Image as ImageIcon, 
  Upload, 
  CheckCircle2,
  X,
  Github
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { uploadImageToGithub } from '@/app/actions/github-actions';

export default function ConfiguracionPage() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();

  const [passwordForm, setPasswordForm] = useState({
    actual: '',
    nueva: '',
    confirmar: ''
  });

  const [imageForm, setImageForm] = useState({
    url: '',
    fileBase64: ''
  });

  useEffect(() => {
    const savedSession = localStorage.getItem('user_session');
    if (!savedSession) {
      router.push('/login');
    } else {
      setSession(JSON.parse(savedSession));
      setIsLoading(false);
    }
  }, [router]);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !session?.usuario) return null;
    return doc(db, 'usuarios', session.usuario);
  }, [db, session?.usuario]);

  const { data: userData, isLoading: loadingUserData } = useDoc(userDocRef);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !userDocRef) return;

    if (passwordForm.actual !== userData.contrasena) {
      toast({ variant: "destructive", title: "Error", description: "La contraseña actual no es correcta." });
      return;
    }

    if (passwordForm.nueva !== passwordForm.confirmar) {
      toast({ variant: "destructive", title: "Error", description: "Las nuevas contraseñas no coinciden." });
      return;
    }

    if (passwordForm.nueva.length < 4) {
      toast({ variant: "destructive", title: "Error", description: "La contraseña debe tener al menos 4 caracteres." });
      return;
    }

    setIsSaving(true);
    updateDocumentNonBlocking(userDocRef, { contrasena: passwordForm.nueva });
    
    toast({ title: "Contraseña actualizada", description: "Se ha cambiado su clave de acceso correctamente." });
    setPasswordForm({ actual: '', nueva: '', confirmar: '' });
    setIsSaving(false);
  };

  const handleImageUpdate = async (type: 'url' | 'file') => {
    if (!userDocRef || !session?.usuario) return;
    
    const imageSource = type === 'url' ? imageForm.url : imageForm.fileBase64;
    
    if (!imageSource) {
      toast({ variant: "destructive", title: "Error", description: "Debe proporcionar una imagen válida." });
      return;
    }

    setIsSaving(true);
    
    try {
      let finalImageUrl = imageSource;

      if (type === 'file') {
        const fileName = `${session.usuario}.jpg`;
        toast({ title: "Sincronizando...", description: "Enviando imagen al repositorio del centro." });
        finalImageUrl = await uploadImageToGithub(imageSource, fileName);
      }

      updateDocumentNonBlocking(userDocRef, { imagenPerfil: finalImageUrl });
      
      toast({ 
        title: "Imagen actualizada", 
        description: "Su perfil se ha sincronizado correctamente con el sistema del centro."
      });
      
      setImageForm({ url: '', fileBase64: '' });
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Error de sincronización", 
        description: error.message || "No se pudo conectar con el servidor de imágenes." 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Archivo demasiado grande", description: "El tamaño máximo permitido es de 2MB." });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageForm({ ...imageForm, fileBase64: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading || loadingUserData || !userData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-[#fb8500]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 font-verdana">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b pb-6">
          <div className="flex items-center gap-4">
             <div className="bg-[#fb8500] p-3 rounded-xl text-white shadow-sm">
                <UserCircle className="h-8 w-8" />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Configuración de Usuario</h1>
                <p className="text-sm text-gray-500 font-medium">Gestione sus credenciales y apariencia en Rayuela</p>
             </div>
          </div>
          <Button variant="ghost" onClick={() => router.push('/seleccionemoduloacceso')} className="gap-2 text-gray-500 hover:text-black uppercase text-[10px] font-bold tracking-widest">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                    <AvatarImage src={userData.imagenPerfil} />
                    <AvatarFallback className="text-2xl bg-gray-100 text-gray-400">
                      {userData.usuario?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-lg font-bold text-gray-800 uppercase">{userData.nombrePersona || userData.usuario}</CardTitle>
                <CardDescription className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  {userData.rolesUsuario?.join(' / ').replace(/Es/g, '')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-center">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Usuario</span>
                  <span className="text-sm font-medium text-gray-700">{userData.usuario}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Email</span>
                  <span className="text-sm font-medium text-gray-700">{userData.email}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-8 space-y-8">
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                   <Key className="h-4 w-4 text-[#fb8500]" />
                   <CardTitle className="text-sm font-bold uppercase tracking-tight">Cambiar Contraseña</CardTitle>
                </div>
              </CardHeader>
              <form onSubmit={handlePasswordChange}>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-gray-400">Contraseña Actual</Label>
                      <Input 
                        type="password" 
                        value={passwordForm.actual}
                        onChange={(e) => setPasswordForm({...passwordForm, actual: e.target.value})}
                        className="text-sm border-gray-300" 
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-gray-400">Nueva Contraseña</Label>
                        <Input 
                          type="password" 
                          value={passwordForm.nueva}
                          onChange={(e) => setPasswordForm({...passwordForm, nueva: e.target.value})}
                          className="text-sm border-gray-300" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-gray-400">Confirmar Nueva Contraseña</Label>
                        <Input 
                          type="password" 
                          value={passwordForm.confirmar}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmar: e.target.value})}
                          className="text-sm border-gray-300" 
                          required 
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 p-4 border-t flex justify-end">
                  <Button type="submit" disabled={isSaving} className="bg-[#fb8500] hover:bg-[#e07600] text-white text-[11px] font-bold uppercase px-8 h-10 gap-2">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Actualizar Contraseña
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center gap-2">
                   <ImageIcon className="h-4 w-4 text-[#fb8500]" />
                   <CardTitle className="text-sm font-bold uppercase tracking-tight">Imagen de Perfil</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase text-gray-400">Actualizar por URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://ejemplo.com/imagen.jpg" 
                      value={imageForm.url}
                      onChange={(e) => setImageForm({...imageForm, url: e.target.value})}
                      className="text-sm border-gray-300 flex-1" 
                    />
                    <Button onClick={() => handleImageUpdate('url')} variant="outline" disabled={isSaving} className="text-[11px] font-bold uppercase border-gray-300 hover:bg-gray-100 h-10 px-6">
                      Aplicar URL
                    </Button>
                  </div>
                </div>

                <div className="relative flex items-center justify-center py-2">
                   <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
                   <span className="relative bg-white px-4 text-[10px] font-bold text-gray-400 uppercase">o bien</span>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-bold uppercase text-gray-400">Subir Archivo al Repositorio</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-[#fb8500] transition-colors group cursor-pointer relative">
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png" 
                        onChange={handleFileChange}
                        disabled={isSaving}
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-gray-300 group-hover:text-[#fb8500] transition-colors" />
                        <span className="text-[11px] font-bold text-gray-400 uppercase">Seleccionar foto</span>
                      </div>
                    </div>

                    {imageForm.fileBase64 && (
                      <div className="bg-gray-50 p-4 rounded-xl border flex items-center gap-4 animate-in zoom-in-95 duration-300">
                        <div className="relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 border-white shadow-sm">
                           <img src={imageForm.fileBase64} alt="Preview" className="h-full w-full object-cover" />
                           <button onClick={() => setImageForm({...imageForm, fileBase64: ''})} className="absolute top-0 right-0 bg-red-600 text-white p-0.5 hover:bg-red-700">
                             <X className="h-3 w-3" />
                           </button>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Vista previa</p>
                          <Button onClick={() => handleImageUpdate('file')} size="sm" disabled={isSaving} className="bg-[#fb8500] text-white text-[9px] font-bold uppercase h-7 w-full gap-1">
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Github className="h-3 w-3" />}
                            {isSaving ? "Sincronizando..." : "Sincronizar"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-blue-50/50 p-4 border-t flex items-center gap-2">
                 <div className="bg-blue-600 w-1.5 h-1.5 rounded-full" />
                 <span className="text-[9px] font-bold text-blue-800 uppercase leading-relaxed">
                   Las imágenes se guardarán en la ruta oficial del centro para su uso en toda la plataforma.
                 </span>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
