import React, { useEffect, useState } from 'react';
import { EMPRESA } from '../config/empresa';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Login.css';

const RestablecerContrasena = () => {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted && session) {
        setHasRecoverySession(true);
        setIsCheckingSession(false);
      }
    });

    const checkSession = async () => {
      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (isMounted) {
          setHasRecoverySession(Boolean(data.session));
          setIsCheckingSession(false);
        }
      } catch (sessionError) {
        console.error('No se pudo validar el enlace de recuperación:', sessionError);
        if (isMounted) {
          setError('No se pudo validar el enlace. Solicita uno nuevo e inténtalo otra vez.');
          setIsCheckingSession(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setMessage('Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión con la nueva contraseña.');
      setPassword('');
      setConfirmPassword('');
    } catch (updateError) {
      console.error('No se pudo actualizar la contraseña:', updateError);
      setError('No se pudo cambiar la contraseña. Solicita un enlace nuevo e inténtalo otra vez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card auth-card">
        <div className="login-header">
          <img
            src={EMPRESA.logo}
            alt={`Logo ${EMPRESA.nombreCorto}`}
            className="login-header-logo"
          />
          <p>Actualización de contraseña</p>
        </div>
        <section className="login-form-section auth-form-section">
          <h3>Crear una nueva contraseña</h3>
          {isCheckingSession ? (
            <p role="status">Validando el enlace…</p>
          ) : hasRecoverySession ? (
            <>
              <p>Elige una contraseña nueva de al menos 8 caracteres.</p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="new-password">Nueva contraseña:</label>
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm-password">Confirmar contraseña:</label>
                  <input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    placeholder="Escribe de nuevo la contraseña"
                  />
                </div>
                {message && <div className="success-message" role="status">{message}</div>}
                {error && <div className="error-message" role="alert">{error}</div>}
                <button type="submit" className="login-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Guardando…' : 'Cambiar contraseña'}
                </button>
              </form>
            </>
          ) : (
            <>
              <p>El enlace venció o ya fue utilizado. Solicita uno nuevo para cambiar tu contraseña.</p>
              {error && <div className="error-message" role="alert">{error}</div>}
              <Link className="login-btn auth-button-link" to="/recuperar-contrasena">
                Solicitar otro enlace
              </Link>
            </>
          )}
          <Link className="auth-back-link" to="/login">Volver al inicio de sesión</Link>
        </section>
      </div>
    </div>
  );
};

export default RestablecerContrasena;
