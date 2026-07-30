import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBZs9ef3vNho6r8v9iSz4FUxMoK7UecWWI",
  authDomain: "fleetguard-8e87b.firebaseapp.com",
  projectId: "fleetguard-8e87b",
  storageBucket: "fleetguard-8e87b.appspot.com",
  messagingSenderId: "",
  appId: ""
};

// Initialize Firebase app safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export default app;
