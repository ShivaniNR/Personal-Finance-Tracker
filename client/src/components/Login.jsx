import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export function Login({ onSwitchToSignup }) {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email address first, then click Forgot Password.');
      return;
    }
    setError(null);
    setResetLoading(true);
    const { error } = await resetPassword(email.trim());
    setResetLoading(false);

    if (error) {
      setError(error.message);
    } else {
      toast.success('Password reset email sent! Check your inbox.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">💰</span>
            <h1>Finance Tracker</h1>
          </div>
          <p className="auth-subtitle">Welcome back! Sign in to your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              type="button"
              className="auth-forgot-link"
              onClick={handleForgotPassword}
              disabled={resetLoading}
            >
              {resetLoading ? 'Sending...' : 'Forgot Password?'}
            </button>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <span className="auth-btn-loading">Signing in...</span>
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don&apos;t have an account?{' '}
            <button className="auth-link" onClick={onSwitchToSignup}>
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
