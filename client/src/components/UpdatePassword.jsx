import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

export function UpdatePassword() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      toast.success('Password updated successfully!');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="auth-logo-icon">🔑</span>
            <h1>Set New Password</h1>
          </div>
          <p className="auth-subtitle">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="auth-field">
            <label htmlFor="new-password">New Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
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
            <label htmlFor="confirm-password">Confirm Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? (
              <span className="auth-btn-loading">Updating...</span>
            ) : (
              <>
                <KeyRound size={18} />
                Update Password
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
