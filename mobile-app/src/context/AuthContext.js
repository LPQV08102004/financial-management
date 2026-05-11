import React, { createContext, useContext, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { getMyProfile, getSavedToken, getSavedUserProfile, login, logout, register } from '../api/authApi';

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

  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await getSavedToken();
        if (!token) {
          dispatch({ type: 'RESTORE_TOKEN', payload: null });
          return;
        }

        const cachedUser = await getSavedUserProfile();
        dispatch({
          type: 'RESTORE_TOKEN',
          payload: { token, user: cachedUser },
        });

        getMyProfile()
          .then((user) => {
            dispatch({ type: 'UPDATE_USER', payload: user });
          })
          .catch(async () => {

            await logout().catch(() => {});
            dispatch({ type: 'SIGN_OUT' });
          });
      } catch (e) {
        console.error('Failed to restore token:', e);
        await logout();
        dispatch({ type: 'RESTORE_TOKEN', payload: null });
      }
    };

    bootstrapAsync();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        getSavedToken().then((token) => {
          if (token) {
            getMyProfile()
              .then((user) => dispatch({ type: 'UPDATE_USER', payload: user }))
              .catch(() => {});
          }
        });
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      getSavedToken().then((token) => {
        if (token) {
          getMyProfile()
            .then((user) => dispatch({ type: 'UPDATE_USER', payload: user }))
            .catch(() => {});
        }
      });
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const authContext = {
    updateUser: (user) => {
      dispatch({ type: 'UPDATE_USER', payload: user });
    },

    signIn: async (email, password) => {
      try {
        const data = await login(email, password);
        const token = data?.access_token || await getSavedToken();
        const user = data?.user || null;

        dispatch({
          type: 'SIGN_IN',
          payload: { token, user },
        });

        if (!user) {
          getMyProfile()
            .then((freshUser) => dispatch({ type: 'UPDATE_USER', payload: freshUser }))
            .catch(() => {});
        }

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

        const user = registerData?.user || null;

        dispatch({
          type: 'SIGN_UP',
          payload: { token, user },
        });

        if (!user) {
          getMyProfile()
            .then((freshUser) => dispatch({ type: 'UPDATE_USER', payload: freshUser }))
            .catch(() => {});
        }

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
