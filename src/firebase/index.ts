
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, Firestore } from 'firebase/firestore';

// Variables de instancia para el patrón Singleton
let app: FirebaseApp;
let db: Firestore;
let authentication: Auth;

/**
 * Inicializa Firebase y sus servicios de forma única.
 * Garantiza que initializeFirestore solo se llame una vez para evitar errores de aserción.
 */
export function initializeFirebase() {
  // 1. Inicializar App
  if (getApps().length > 0) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
  }

  // 2. Inicializar Firestore con configuración defensiva (una sola vez)
  if (!db) {
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
  }

  // 3. Inicializar Auth (una sola vez)
  if (!authentication) {
    authentication = getAuth(app);
  }

  return {
    firebaseApp: app,
    firestore: db,
    auth: authentication
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
