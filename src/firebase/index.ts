'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, terminate } from 'firebase/firestore'

// Inicialización de Firebase optimizada para entornos de proxy/workstation
export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  // Inicialización de Firestore con configuraciones para evitar el error "Assertion Failed"
  const firestore = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: false, // Desactivamos autodetección para evitar cambios de estado bruscos
  });

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore
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