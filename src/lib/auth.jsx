import { createContext, useContext, useState, useEffect } from 'react';
import { authApi, setToken, getToken, isLoggedIn } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      authApi.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setToken(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await authApi.register(name, email, password);
    setToken(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data;
  };

  const googleSignIn = async (idToken) => {
    const data = await authApi.googleAuth(idToken);
    setToken(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    setToken(null, null);
    setUser(null);
  };

  const refreshUser = async () => {
    const u = await authApi.me();
    setUser(u);
    return u;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleSignIn, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
