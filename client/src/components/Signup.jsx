import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export function Signup({ onSwitchToLogin }) {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }

    setLoading(true);

    const { error } = await signUp({
      email,
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <span className="auth-logo-icon">✉️</span>
              <h1>Check Your Email</h1>
            </div>
            <p className="auth-subtitle">
              We&apos;ve sent a confirmation link to <strong>{email}</strong>.
              Click the link to activate your account.
            </p>
          </div>
          <div className="auth-footer">
            <p>
              Already confirmed?{' '}
              <button className="auth-link" onClick={onSwitchToLogin}>
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">💰</span>
            <h1>Finance Tracker</h1>
          </div>
          <p className="auth-subtitle">Create your account to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field-row">
            <div className="auth-field">
              <label htmlFor="firstName">First Name</label>
              <div className="auth-input-wrapper">
                <User size={18} className="auth-input-icon" />
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                  autoComplete="given-name"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="lastName">Last Name</label>
              <div className="auth-input-wrapper">
                <User size={18} className="auth-input-icon" />
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>
            </div>
          </div>

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
                placeholder="Minimum 6 characters"
                required
                autoComplete="new-password"
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
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <span className="auth-btn-loading">Creating account...</span>
            ) : (
              <>
                <UserPlus size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button className="auth-link" onClick={onSwitchToLogin}>
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
