import { createContext, useContext, useState } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('millibox_user') || localStorage.getItem('millibox_user');
    const token = sessionStorage.getItem('millibox_token') || localStorage.getItem('millibox_token');
    if (!token || token === 'frontend-demo-token') {
      sessionStorage.removeItem('millibox_user');
      sessionStorage.removeItem('millibox_token');
      localStorage.removeItem('millibox_user');
      localStorage.removeItem('millibox_token');
      return null;
    }
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (_) {
        return null;
      }
    }
    return null;
  });

  const login = async (email, password, remember = false) => {
  try {
    const response = await authAPI.login(email, password);

    const data = response.data;

    const userData = data.officer || {
      email: email,
    };

    setUser(userData);

    sessionStorage.setItem(
      'millibox_user',
      JSON.stringify(userData)
    );

    sessionStorage.setItem(
      'millibox_token',
      data.access_token || 'frontend-demo-token'
    );

    if (remember) {
      localStorage.setItem(
        'millibox_user',
        JSON.stringify(userData)
      );
      localStorage.setItem(
        'millibox_token',
        data.access_token || 'frontend-demo-token'
      );
    }

    return { ok: true };

  } catch (error) {
    console.error('Login error:', error);
    return {
      ok: false,
      message: error.response?.data?.detail || (
        error.request
          ? 'Cannot connect to the authentication server. Please redeploy the backend with CORS enabled.'
          : error.message
      ) || 'Unable to reach the authentication server.',
    };
  }
};

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('millibox_user');
    sessionStorage.removeItem('millibox_token');
    localStorage.removeItem('millibox_user');
    localStorage.removeItem('millibox_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
