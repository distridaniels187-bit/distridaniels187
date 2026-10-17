import React, { useState } from 'react';
import { EMPRESA } from '../config/empresa';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import './Login.css';

const RecuperarContrasena = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setIsSubmitting(true);

    try {
      const redirectTo = `${window.location.origin}/restablecer-contrasena`;
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );

      if (requestError) throw requestError;

      setMessage(
        'Si existe una cuenta con ese correo, recibirás un enlace para cambiar la contraseña.'
      );
    } catch (requestError) {
      console.error('No se pudo solicitar la recuperación de contraseña:', requestError);
      setError('No se pudo enviar el correo. Revisa la dirección e inténtalo de nuevo.');
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
          <p>Recuperación de acceso</p>
        </div>
        <section className="login-form-section auth-form-section">
          <h3>Recuperar contraseña</h3>
          <p>Te enviaremos un enlace al correo de tu cuenta para crear una nueva contraseña.</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="recovery-email">Correo electrónico:</label>
              <input
                id="recovery-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="Ingresa tu correo"
              />
            </div>
            {message && <div className="success-message" role="status">{message}</div>}
            {error && <div className="error-message" role="alert">{error}</div>}
            <button type="submit" className="login-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
            </button>
          </form>
          <Link className="auth-back-link" to="/login">Volver al inicio de sesión</Link>
        </section>
      </div>
    </div>
  );
};

export default RecuperarContrasena;
