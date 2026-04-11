'use client';

import { firebaseConfig } from '@/firebase/config';
import {
  initializeApp,
  getApps,
  getApp,
  FirebaseApp
} from 'firebase/app';

import { getAuth } from 'firebase/auth';

import {
  initializeFirestore,
  Firestore
} from 'firebase/firestore';

export function initializeFirebase() {
  let firebaseApp: FirebaseApp;

  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp): {
  firebaseApp: FirebaseApp;
  auth: ReturnType<typeof getAuth>;
  firestore: Firestore;
} {
  console.log("🔥 PROJECT ID:", firebaseApp.options.projectId);

  const auth = getAuth(firebaseApp);

  // ✅ CONFIG CORRECTA (SIN conflictos)
  const firestore = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
  });

  return {
    firebaseApp,
    auth,
    firestore,
  };
}

// exports
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';