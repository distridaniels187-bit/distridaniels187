import React from 'react';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';

jest.mock('../../context/auth-context', () => ({
  useAuth: jest.fn()
}));

import { useAuth } from '../../context/auth-context';

const renderLogin = () => render(
  <BrowserRouter>
    <Login />
  </BrowserRouter>
);

describe('Login', () => {
  let login;

  beforeEach(() => {
    login = jest.fn().mockResolvedValue({});
    useAuth.mockReturnValue({ login, authError: '' });
  });

  test('muestra campos de correo y contraseña sin divulgar usuarios de prueba', () => {
    renderLogin();

    expect(screen.getByLabelText(/correo electrónico/i)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/contraseña/i)).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /ingresar al sistema/i })).toBeEnabled();
    expect(screen.getByRole('link', { name: /olvidaste tu contraseña/i })).toHaveAttribute(
      'href',
      '/recuperar-contrasena'
    );
    expect(screen.queryByText(/credenciales de prueba/i)).not.toBeInTheDocument();
  });

  test('envía las credenciales al servicio de autenticación de contexto', async () => {
    renderLogin();

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'equipo@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'clave-segura' }
    });
    fireEvent.click(screen.getByRole('button', { name: /ingresar al sistema/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('equipo@example.com', 'clave-segura');
    });
  });

  test('muestra el error de autenticación y habilita el botón de nuevo', async () => {
    login.mockRejectedValue(new Error('Correo o contraseña incorrectos.'));
    renderLogin();

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), {
      target: { value: 'equipo@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/contraseña/i), {
      target: { value: 'incorrecta' }
    });
    fireEvent.click(screen.getByRole('button', { name: /ingresar al sistema/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos.');
    expect(screen.getByRole('button', { name: /ingresar al sistema/i })).toBeEnabled();
  });

  test('muestra errores al restaurar sesión y conserva el acceso al catálogo público', () => {
    useAuth.mockReturnValue({
      login,
      authError: 'No se pudo validar la sesión.'
    });

    renderLogin();

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo validar la sesión.');
    expect(screen.getByRole('link', { name: /ver catálogo completo/i })).toHaveAttribute(
      'href',
      '/catalogo-clientes'
    );
  });
});
