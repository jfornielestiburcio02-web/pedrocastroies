'use client';

import { firebaseConfig } from '@/firebase/config';
import {
  initializeApp,
  getApps,
  getApp,
  FirebaseApp
} from 'firebase/app';

import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export function initializeFirebase() {
  const firebaseApp = !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp();

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  console.log("🔥 PROJECT ID:", firebaseApp.options.projectId);

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
  };
}