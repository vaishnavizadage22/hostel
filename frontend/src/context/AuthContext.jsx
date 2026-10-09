import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContextInstance';
import { apiFetch } from '../utils/api';

export const AuthProvider = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return !!localStorage.getItem('admin_token');
  });
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [adminExists, setAdminExists] = useState(null);

  // Check if an admin account already exists in MySQL database
  const checkAdminStatus = useCallback(async () => {
    try {
      const res = await apiFetch('/auth/admin-status');
      if (res.ok) {
        const data = await res.json();
        setAdminExists(data.exists);
        return data.exists;
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
    return false;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem('admin_token');

    // Asynchronously check admin status
    apiFetch('/auth/admin-status')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data) {
          setAdminExists(data.exists);
        }
      })
      .catch((err) => console.error('Status check error:', err));

    if (token) {
      apiFetch('/auth/admin-me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!isMounted) return null;
          if (res.ok) return res.json();
          throw new Error('Unauthorized');
        })
        .then((data) => {
          if (isMounted && data) {
            setCurrentAdmin(data);
            setIsAdminAuthenticated(true);
          }
        })
        .catch(() => {
          if (isMounted) {
            localStorage.removeItem('admin_token');
            setIsAdminAuthenticated(false);
            setCurrentAdmin(null);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (token, adminData) => {
    localStorage.setItem('admin_token', token);
    setIsAdminAuthenticated(true);
    setCurrentAdmin(adminData);
    setAdminExists(true);
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem('admin_token');
    setIsAdminAuthenticated(false);
    setCurrentAdmin(null);
    checkAdminStatus();
  };

  return (
    <AuthContext.Provider
      value={{
        isAdminAuthenticated,
        currentAdmin,
        adminExists,
        login,
        logout,
        checkAdminStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
