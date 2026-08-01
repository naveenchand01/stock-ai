import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDcEZ3Xaw0sOQr9_Pn8A7MjrY14iZZbA08',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'stock-ai-9dba6.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'stock-ai-9dba6',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'stock-ai-9dba6.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '324222580596',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:324222580596:web:26ea211f1cfcdcc4631e21',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YP6DYXYM54',
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' && firebaseConfig.measurementId ? getAnalytics(app) : null;
