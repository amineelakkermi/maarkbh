"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { authService } from "@/lib/api-services";
import { ApiError, decodeJWT } from "@/lib/api-client";
import * as Types from "@/lib/api-types";

// ─── JWT Token Claims Model ───────────────────────────────────────────

/**
 * Standard JWT claims plus custom Maarkbh-specific claims
 * Based on the actual id_token payload from the backend
 */
export interface AuthUser {
  // Standard JWT claims
  iss: string;           // Issuer: "http://139.59.140.232/"
  sub: string;           // Subject: User ID (e.g., "1")
  iat: number;           // Issued At: Unix timestamp
  exp: number;           // Expiration: Unix timestamp
  
  // Standard OpenID Connect claims
  name: string;          // Username (e.g., "admin@maarkbh.com")
  email: string;         // Email address
  
  // Custom Maarkbh claims
  full_name: string;     // Full display name (e.g., "System Administrator")
  oi_au_id: string;      // OpenIddict Authorization ID
  at_hash: string;       // Access Token hash
  oi_tkn_id: string;     // OpenIddict Token ID
}

interface AuthContextValue {
  isLoggedIn: boolean;
  isLoading: boolean;
  authError: string | null;
  token: string | null;
  refreshToken: string | null;
  decodedToken: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshAccessToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isLoggedIn: false,
  isLoading: false,
  authError: null,
  token: null,
  refreshToken: null,
  decodedToken: null,
  login: async () => {},
  logout: () => {},
  clearError: () => {},
  refreshAccessToken: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<AuthUser | null>(null);

  // Load session from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const logged = sessionStorage.getItem("mk_logged") === "true";
      const savedToken = sessionStorage.getItem("mk_token");
      const savedRefreshToken = sessionStorage.getItem("mk_refresh_token");
      
      if (logged && savedToken) {
        setIsLoggedIn(true);
        setToken(savedToken);
        setRefreshToken(savedRefreshToken);
        // Try to decode the token if available
        const idToken = sessionStorage.getItem("mk_id_token");
        if (idToken) {
          const decoded = decodeJWT(idToken);
          setDecodedToken(decoded);
        }
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const tokenResponse = await authService.login({
        grant_type: 'password',
        username,
        password,
      });

      console.log('🔑 Raw Token Response:', tokenResponse);
      console.log('🔑 Access Token:', tokenResponse.access_token);
      console.log('🔑 ID Token:', tokenResponse.id_token);
      
      // Decode id_token to get user information
      const decoded = tokenResponse.id_token ? decodeJWT(tokenResponse.id_token) : null;
      console.log('🔑 Decoded JWT Token:', decoded);

      // Store the session ONLY on success
      setIsLoggedIn(true);
      setToken(tokenResponse.access_token);
      setRefreshToken(tokenResponse.refresh_token || null);
      setDecodedToken(decoded);
      
      sessionStorage.setItem("mk_logged", "true");
      sessionStorage.setItem("mk_username", username);
      sessionStorage.setItem("mk_token", tokenResponse.access_token);
      if (tokenResponse.refresh_token) {
        sessionStorage.setItem("mk_refresh_token", tokenResponse.refresh_token);
      }
      if (tokenResponse.id_token) {
        sessionStorage.setItem("mk_id_token", tokenResponse.id_token);
      }
    } catch (error) {
      console.error("Login error:", error);
      // Ensure user is NOT logged in on error
      setIsLoggedIn(false);
      setToken(null);
      setRefreshToken(null);
      setDecodedToken(null);
      
      // Clear any existing session
      sessionStorage.removeItem("mk_logged");
      sessionStorage.removeItem("mk_username");
      sessionStorage.removeItem("mk_token");
      sessionStorage.removeItem("mk_refresh_token");
      sessionStorage.removeItem("mk_id_token");
      
      // Translate technical errors to user-friendly Arabic messages
      let userFriendlyMessage = "حدث خطأ غير متوقع";
     
      
      setAuthError(userFriendlyMessage);
      // Re-throw the error so the caller can handle it
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setToken(null);
    setRefreshToken(null);
    setDecodedToken(null);
    setAuthError(null);
    
    sessionStorage.removeItem("mk_logged");
    sessionStorage.removeItem("mk_username");
    sessionStorage.removeItem("mk_token");
    sessionStorage.removeItem("mk_refresh_token");
    sessionStorage.removeItem("mk_id_token");
    
    authService.logout();
  };

  const refreshAccessToken = async () => {
    const currentRefreshToken = refreshToken || sessionStorage.getItem("mk_refresh_token");
    
    if (!currentRefreshToken) {
      throw new Error("No refresh token available");
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const tokenResponse = await authService.refreshToken({
        grant_type: 'refresh_token',
        refresh_token: currentRefreshToken,
      });

      // Update tokens
      setToken(tokenResponse.access_token);
      setRefreshToken(tokenResponse.refresh_token || currentRefreshToken);
      
      const decoded = tokenResponse.id_token ? decodeJWT(tokenResponse.id_token) : null;
      setDecodedToken(decoded);

      // Update sessionStorage
      sessionStorage.setItem("mk_token", tokenResponse.access_token);
      if (tokenResponse.refresh_token) {
        sessionStorage.setItem("mk_refresh_token", tokenResponse.refresh_token);
      }
      if (tokenResponse.id_token) {
        sessionStorage.setItem("mk_id_token", tokenResponse.id_token);
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      // If refresh fails, logout the user
      logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        authError,
        token,
        refreshToken,
        decodedToken,
        login,
        logout,
        clearError,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
