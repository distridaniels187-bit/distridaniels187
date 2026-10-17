import React from 'react';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RecuperarContrasena from '../RecuperarContrasena';
import RestablecerContrasena from '../RestablecerContrasena';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      updateUser: jest.fn()
    }
  }
}));

const renderAtRoute = (path, element) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path={path} element={element} />
      <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
    </Routes>
  </MemoryRouter>
);

describe('Password recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'recovery-session' } },
      error: null
    });
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    });
    supabase.auth.updateUser.mockResolvedValue({ error: null });
  });

  test('solicita un enlace y no revela si existe el correo', async () => {
    renderAtRoute('/recuperar-contrasena', <RecuperarContrasena />);
    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'equipo@example.com' }
    });
    fireEvent.click(screen.getByRole('button', { name: /enviar enlace/i }));

    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'equipo@example.com',
        { redirectTo: `${window.location.origin}/restablecer-contrasena` }
      );
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Si existe una cuenta con ese correo'
    );
  });

  test('actualiza la contraseña con una sesión válida', async () => {
    renderAtRoute('/restablecer-contrasena', <RestablecerContrasena />);

    await screen.findByLabelText(/nueva contraseña/i);
    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), {
      target: { value: 'nueva-clave-segura' }
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: 'nueva-clave-segura' }
    });
    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'nueva-clave-segura'
      });
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Tu contraseña se actualizó correctamente'
    );
  });

  test('bloquea contraseñas que no coinciden', async () => {
    renderAtRoute('/restablecer-contrasena', <RestablecerContrasena />);

    await screen.findByLabelText(/nueva contraseña/i);
    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), {
      target: { value: 'nueva-clave-segura' }
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: 'otra-clave-segura' }
    });
    fireEvent.click(screen.getByRole('button', { name: /cambiar contraseña/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Las contraseñas no coinciden.');
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  test('ofrece solicitar un enlace nuevo si la sesión de recuperación expiró', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });
    renderAtRoute('/restablecer-contrasena', <RestablecerContrasena />);

    expect(await screen.findByText(/el enlace venció o ya fue utilizado/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /solicitar otro enlace/i })).toHaveAttribute(
      'href',
      '/recuperar-contrasena'
    );
  });
});
