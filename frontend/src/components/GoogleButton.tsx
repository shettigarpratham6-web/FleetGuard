"use client";

import { useState } from "react";
import { UserCredential } from "firebase/auth";
import { useRouter } from "next/navigation";
import { loginWithGoogle } from "@/services/authService";

export interface GoogleButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onSuccess?: (result: UserCredential) => void;
    onError?: (error: unknown) => void;
    redirectTo?: string; // Target page after login (default: /dashboard)
    className?: string;
    children?: React.ReactNode;
}

export default function GoogleButton({
    onSuccess,
    onError,
    redirectTo = "/dashboard",
    className = "",
    children,
    onClick,
    disabled,
    type = "button",
    ...props
}: GoogleButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (onClick) {
            onClick(e);
        }
        if (e.defaultPrevented) return;

        try {
            setLoading(true);
            const result = await loginWithGoogle();

            // Store Firebase token locally
            try {
                const token = await result.user.getIdToken();
                if (typeof window !== "undefined" && token) {
                    localStorage.setItem("fleetguard_token", token);
                }
            } catch (tokenError) {
                console.warn("Could not retrieve Firebase ID token:", tokenError);
            }

            console.log("Google Login successful:", result.user);

            // Notify parent component if callback provided
            if (onSuccess) {
                onSuccess(result);
            }

            // --- REDIRECT TO NEXT PAGE ---
            router.push(redirectTo);
            router.refresh();
        } catch (error) {
            console.error("Google Login error:", error);
            if (onError) {
                onError(error);
            }
        } finally {
            setLoading(false);
        }
    };

    const defaultClassName =
        "w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface font-medium text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <button
            type={type}
            onClick={handleLogin}
            disabled={loading || disabled}
            className={className || defaultClassName}
            {...props}
        >
            {loading ? (
                <>
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                </>
            ) : (
                <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                    </svg>
                    <span>{children || "Continue with Google"}</span>
                </>
            )}
        </button>
    );
}