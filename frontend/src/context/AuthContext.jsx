import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { syncUserWithBackend } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [dbUser, setDbUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fg_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const syncData = await syncUserWithBackend(idToken);
          if (syncData && syncData.user) {
            setDbUser(syncData.user);
          }
        } catch (err) {
          console.error('Error syncing auth state with backend:', err);
        }
      } else {
        setDbUser(null);
        localStorage.removeItem('fg_token');
        localStorage.removeItem('fg_user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password, rememberMe = false) => {
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistence);
    if (rememberMe) {
      localStorage.setItem('fg_remember_email', email);
    } else {
      localStorage.removeItem('fg_remember_email');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    const syncRes = await syncUserWithBackend(idToken);
    if (syncRes?.user) setDbUser(syncRes.user);
    return userCredential;
  };

  const signUp = async (fullName, email, password) => {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: fullName });
    const idToken = await userCredential.user.getIdToken(true);
    const syncRes = await syncUserWithBackend(idToken, { full_name: fullName });
    if (syncRes?.user) setDbUser(syncRes.user);
    return userCredential;
  };

  const signInWithGoogle = async () => {
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    const syncRes = await syncUserWithBackend(idToken, {
      full_name: result.user.displayName || '',
      profile_picture: result.user.photoURL || null,
    });
    if (syncRes?.user) setDbUser(syncRes.user);
    return result;
  };

  const resetPassword = async (email) => {
    return sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem('fg_token');
    localStorage.removeItem('fg_user');
    setCurrentUser(null);
    setDbUser(null);
  };

  const value = {
    currentUser,
    dbUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    resetPassword,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
