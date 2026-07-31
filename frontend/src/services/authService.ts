import {
    signInWithPopup,
    signOut,
    GoogleAuthProvider,
    UserCredential,
    User,
    onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider } from "@/firebase/firebase";

/**
 * Login with Google Pop-up
 */
export const loginWithGoogle = async (): Promise<UserCredential> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);

        // Optional: Get Google OAuth credential
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken;

        console.log("Google Access Token:", accessToken);
        console.log("Logged in user:", result.user);

        return result;
    } catch (error) {
        console.error("Google Sign-In Error:", error);
        throw error;
    }
};

/**
 * Logout
 */
export const logout = async (): Promise<void> => {
    try {
        await signOut(auth);
        console.log("User logged out");
    } catch (error) {
        console.error("Logout Error:", error);
        throw error;
    }
};

/**
 * Safely get the ID Token, ensuring the auth state has initialized
 */
export const getIdToken = async (forceRefresh = false): Promise<string | null> => {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        return await user.getIdToken(forceRefresh);
    } catch (error) {
        console.error("Get ID Token Error:", error);
        return null;
    }
};

/**
 * Get currently logged-in user safely by waiting for initialization.
 * Resolves immediately if auth is already determined.
 */
export const getCurrentUser = (): Promise<User | null> => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
            auth,
            (user) => {
                unsubscribe();
                resolve(user);
            },
            reject
        );
    });
};