import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AuthContext } from './auth-context';

const ALLOWED_ROLES = new Set([
  'superadmin',
  'admin',
  'contabilidad',
  'inventario',
  'vendedor',
  'cliente'
]);

const mapAuthUser = (authUser) => {
  if (!authUser) return null;

  const role = authUser.app_metadata?.role;
  if (typeof role !== 'string' || !ALLOWED_ROLES.has(role.toLowerCase())) {
    return null;
  }

  return {
    id: authUser.id,
    email: authUser.email,
    username: authUser.user_metadata?.username
      || authUser.user_metadata?.full_name
      || authUser.email
      || '',
    role: role.toLowerCase()
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUser(mapAuthUser(session?.user));
        setIsLoading(false);
        setAuthError('');
      }
    });

    const restoreSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const restoredUser = mapAuthUser(data.session?.user);
        if (data.session && !restoredUser) {
          const { error: signOutError } = await supabase.auth.signOut();
          if (signOutError) throw signOutError;
        }

        if (isMounted) {
          setUser(restoredUser);
          setIsLoading(false);
          setAuthError('');
        }
      } catch (error) {
        console.error('No se pudo validar la sesión de Supabase:', error);
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
          setAuthError('No se pudo validar la sesión. Actualiza la página e inténtalo de nuevo.');
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (error) {
      throw new Error('Correo o contraseña incorrectos.');
    }

    const signedInUser = mapAuthUser(data.user);
    if (!signedInUser) {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('No se pudo cerrar la sesión sin rol autorizado:', signOutError);
      }
      throw new Error('La cuenta no tiene un rol autorizado. Contacta al administrador.');
    }

    setAuthError('');
    setUser(signedInUser);
    return signedInUser;
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error('No se pudo cerrar la sesión correctamente. Inténtalo de nuevo.');
    }
    setUser(null);
    setAuthError('');
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      authError,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};