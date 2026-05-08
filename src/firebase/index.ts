
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

// Instancia única de los SDKs para evitar errores de re-inicialización (Singleton ca9)
let sdks: any = null;

/**
 * Inicializa Firebase con una configuración optimizada para entornos de proxy.
 * Utiliza experimentalForceLongPolling para eliminar errores de aserción interna (ID: ca9).
 */
export function initializeFirebase() {
  if (sdks) return sdks;

  const firebaseApp = !getApps().length 
    ? initializeApp(firebaseConfig) 
    : getApp();

  // Configuración de Firestore con Long Polling forzado para eliminar errores ca9
  // Es crítico que initializeFirestore solo se llame una vez.
  let firestore;
  try {
    firestore = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch (e) {
    // Si ya estaba inicializado, obtenemos la instancia existente
    const { getFirestore } = require('firebase/firestore');
    firestore = getFirestore(firebaseApp);
  }

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
