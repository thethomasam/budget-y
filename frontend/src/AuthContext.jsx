import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as api from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [username, setUsername] = useState(api.getToken() ? api.getUsername() : null);

  const signIn = useCallback((result) => {
    api.setSession(result.token, result.username);
    setUsername(result.username);
  }, []);

  const clearSession = useCallback(() => {
    api.setSession(null);
    setUsername(null);
  }, []);

  useEffect(() => {
    api.setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  const login = async (name, password) => signIn(await api.login(name, password));
  const register = async (name, password) => signIn(await api.register(name, password));
  const logout = async () => {
    try { await api.logout(); } catch { /* the token may already be gone */ }
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ username, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
