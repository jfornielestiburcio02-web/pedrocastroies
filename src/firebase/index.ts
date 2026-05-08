'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  Firestore,
  getFirestore
} from 'firebase/firestore';

// Singleton instances
let firebaseApp: FirebaseApp;
let firestore: Firestore;
let auth: Auth;

/**
 * Inicializa Firebase con una configuración optimizada para entornos de proxy.
 * Utiliza experimentalForceLongPolling para eliminar errores de aserción interna (ID: ca9).
 */
export function initializeFirebase() {
  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  // Aseguramos que Firestore se inicialice solo una vez con Long Polling para evitar errores ca9
  if (!firestore) {
    try {
      firestore = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (e) {
      firestore = getFirestore(firebaseApp);
    }
  }

  if (!auth) {
    auth = getAuth(firebaseApp);
  }

  return {
    firebaseApp,
    auth,
    firestore,
  };
}

// Re-exportar hooks y provider
export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
