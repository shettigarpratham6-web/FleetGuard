import {
    signInWithPopup,
    signOut,
    GoogleAuthProvider,
    UserCredential,
} from "firebase/auth";
import { auth, googleProvider } from "@/firebase/firebase";


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


export const getIdToken = async (): Promise<string | null> => {
    const user = auth.currentUser;

    if (!user) {
        return null;
    }

    return await user.getIdToken();
};

/**
 * Get currently logged-in user
 */
export const getCurrentUser = () => {
    return auth.currentUser;
};