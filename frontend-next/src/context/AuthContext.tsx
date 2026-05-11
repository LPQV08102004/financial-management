"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { useRouter } from 'next/navigation';

import {
  getMyProfile,
  getSavedToken,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister
} from '../api/authApi';
import {
  UserProfile,
  RegisterPayload
} from '../types/auth';

interface AuthState {
  isLoading: boolean;
  isSignout: boolean;
  userToken: string | null;
  user: UserProfile | null;
}

type AuthAction =
  | { type: 'RESTORE_TOKEN'; payload: { token: string | null; user: UserProfile | null } | null }
  | { type: 'SIGN_IN'; payload: { token: string; user: UserProfile } }
  | { type: 'SIGN_UP'; payload: { token: string; user: UserProfile } }
  | { type: 'SIGN_OUT' }
  | { type: 'UPDATE_USER'; payload: UserProfile | null };

interface AuthContextType {
  state: AuthState;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signUp: (payload: RegisterPayload) => Promise<{ success: boolean; message?: string }>;
  refreshProfile: () => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const authReducer = (prevState: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...prevState,
        userToken: action.payload?.token || null,
        user: action.payload?.user || null,
        isLoading: false,
      };
    case 'SIGN_IN':
    case 'SIGN_UP':
      return {
        ...prevState,
        isSignout: false,
        userToken: action.payload.token,
        user: action.payload.user,
      };
    case 'SIGN_OUT':
      return {
        ...prevState,
        isSignout: true,
        userToken: null,
        user: null,
      };
    case 'UPDATE_USER':
      return {
        ...prevState,
        user: action.payload,
      };
    default:
      return prevState;
  }
};

export function AuthProvider(props: Readonly<{ children: React.ReactNode }>) {
  const { children } = props;
  const router = useRouter();
  const [state, dispatch] = useReducer(authReducer, {
    isLoading: true,
    isSignout: false,
    userToken: null,
    user: null,
  });

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = getSavedToken();
        if (!token) {
          dispatch({ type: 'RESTORE_TOKEN', payload: null });
          return;
        }

        try {
          const user = await getMyProfile();
          dispatch({ type: 'RESTORE_TOKEN', payload: { token, user } });
        } catch (profileError: any) {

          await apiLogout().catch(() => {});
          dispatch({ type: 'RESTORE_TOKEN', payload: null });
        }
      } catch (e) {
        console.error('Failed to restore token:', e);
        dispatch({ type: 'RESTORE_TOKEN', payload: null });
      }
    };

    bootstrapAsync();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const data = await apiLogin({ email, password });
      const token = data.access_token;
      const user = data.user || await getMyProfile();

      dispatch({ type: 'SIGN_IN', payload: { token, user } });
      router.push('/home');
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }, [router]);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    try {
      const registerData = await apiRegister(payload);
      let token = registerData.access_token;

      if (!token) {
        const loginData = await apiLogin({ email: payload.email, password: payload.password });
        token = loginData.access_token;
      }

      const user = registerData.user || await getMyProfile();
      dispatch({ type: 'SIGN_UP', payload: { token, user } });
      router.push('/home');
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }, [router]);

  const refreshProfile = useCallback(async () => {
    try {
      const user = await getMyProfile();
      dispatch({ type: 'UPDATE_USER', payload: user });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }, []);

  const signOut = useCallback(async () => {
    dispatch({ type: 'SIGN_OUT' });
    try {
      await apiLogout();
      router.push('/auth/login');
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }, [router]);

  const authActions = useMemo(() => ({
    signIn,
    signUp,
    refreshProfile,
    signOut,
  }), [signIn, signUp, refreshProfile, signOut]);

  const contextValue = useMemo(() => ({ state, ...authActions }), [state, authActions]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}