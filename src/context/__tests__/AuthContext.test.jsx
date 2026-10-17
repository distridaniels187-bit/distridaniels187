import React from 'react';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '../auth-context';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn()
    }
  }
}));

describe('AuthContext', () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    });
    supabase.auth.signOut.mockResolvedValue({ error: null });
  });

  test('autentica con Supabase y obtiene el rol desde app_metadata', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'equipo@example.com',
          app_metadata: { role: 'vendedor' },
          user_metadata: { role: 'admin', username: 'Vendedor' }
        }
      },
      error: null
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.login('equipo@example.com', 'clave-segura');
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'equipo@example.com',
      password: 'clave-segura'
    });
    expect(result.current.user).toMatchObject({
      id: 'user-1',
      username: 'Vendedor',
      role: 'vendedor'
    });
  });

  test('rechaza cuentas sin un rol permitido y cierra su sesión', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: 'user-2',
          email: 'sin-rol@example.com',
          app_metadata: {},
          user_metadata: { role: 'admin' }
        }
      },
      error: null
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await expect(
        result.current.login('sin-rol@example.com', 'clave-segura')
      ).rejects.toThrow('La cuenta no tiene un rol autorizado.');
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });
});
