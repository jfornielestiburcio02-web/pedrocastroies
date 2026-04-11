'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

// Instancia única de los SDKs para evitar errores de re-inicialización b815/ca9
let sdks: any = null;

/**
 * Inicializa Firebase con una configuración optimizada para entornos de proxy (Cloud Workstations).
 * Utiliza experimentalForceLongPolling para evitar fallos de WebSockets.
 */
export function initializeFirebase() {
  if (sdks) return sdks;

  const firebaseApp = !getApps().length 
    ? initializeApp(firebaseConfig) 
    : getApp();

  // Configuración de Firestore con Long Polling forzado y caché persistente
  const firestore = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });

  const auth = getAuth(firebaseApp);

  sdks = {
    firebaseApp,
    auth,
    firestore,
  };

  return sdks;
}

// Re-exportar todos los hooks y el provider desde sus respectivos archivos
export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
