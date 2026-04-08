import React, { createContext, useContext, useEffect } from 'react';
import { getMyProfile, getSavedToken, login, logout, register } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.payload?.token || null,
            user: action.payload?.user || null,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.payload.token,
            user: action.payload.user,
          };
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
            user: action.payload || null,
          };
        default:
          return prevState;
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
      user: null,
    }
  );

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await getSavedToken();
        if (!token) {
          dispatch({ type: 'RESTORE_TOKEN', payload: null });
          return;
        }

        const user = await getMyProfile();
        dispatch({
          type: 'RESTORE_TOKEN',
          payload: { token, user },
        });
      } catch (e) {
        console.error('Failed to restore token:', e);
        await logout();
        dispatch({ type: 'RESTORE_TOKEN', payload: null });
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    signIn: async (email, password) => {
      try {
        const data = await login(email, password);
        const token = data?.access_token || await getSavedToken();
        const user = await getMyProfile();

        dispatch({
          type: 'SIGN_IN',
          payload: { token, user },
        });

        return { success: true, user };
      } catch (error) {
        return { success: false, message: error.message };
      }
    },

    signUp: async (email, password, fullname, sdt) => {
      try {
        const registerData = await register(fullname, email, password, sdt);
        let token = registerData?.access_token || await getSavedToken();

        if (!token) {
          const loginData = await login(email, password);
          token = loginData?.access_token || await getSavedToken();
        }

        if (!token) {
          throw new Error('Đăng ký thành công nhưng chưa đăng nhập được');
        }

        const user = await getMyProfile();

        dispatch({
          type: 'SIGN_UP',
          payload: { token, user },
        });

        return { success: true, user };
      } catch (error) {
        return { success: false, message: error.message };
      }
    },

    refreshProfile: async () => {
      try {
        const user = await getMyProfile();
        dispatch({ type: 'UPDATE_USER', payload: user });
        return { success: true, user };
      } catch (error) {
        return { success: false, message: error.message };
      }
    },

    signOut: async () => {
      dispatch({ type: 'SIGN_OUT' });
      try {
        await logout();
        return { success: true };
      } catch (error) {
        return { success: false, message: error.message };
      }
    },
  };

  return (
    <AuthContext.Provider value={{ state, ...authContext }}>
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
