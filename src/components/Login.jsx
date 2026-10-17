import React, { useState } from 'react';
import { EMPRESA } from '../config/empresa';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, authError } = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img
            src={EMPRESA.logo}
            alt={`Logo ${EMPRESA.nombreCorto}`}
            className="login-header-logo"
          />
          <p>Sistema de pedidos y catálogo digital</p>
        </div>

        <div className="login-content">
          <div className="login-form-section">
            <h3>Acceso para el equipo</h3>
            <p>Ingresa el correo y la contraseña de tu cuenta autorizada</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="login-email">Correo electrónico:</label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="Ingresa tu correo"
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Contraseña:</label>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="Ingresa tu contraseña"
                />
              </div>
              {(error || authError) && (
                <div className="error-message" role="alert">
                  {error || authError}
                </div>
              )}
              <button type="submit" className="login-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Validando…' : 'Ingresar al sistema'}
              </button>
            </form>
            <Link className="auth-back-link" to="/recuperar-contrasena">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="catalog-section">
            <div className="catalog-icon">
              <i className="fas fa-store">📦</i>
            </div>
            <h2>Explora nuestro catálogo</h2>
            <p>Descubre todos nuestros productos disponibles y realiza tus pedidos directamente por WhatsApp sin necesidad de crear una cuenta.</p>
            <Link to="/catalogo-clientes" className="catalog-btn">
              Ver Catálogo Completo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
