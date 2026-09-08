import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radio, Lock, User, Eye, EyeOff, ShieldCheck, Sun, Moon, SunMoon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [remember, setRemember]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const { login }    = useAuth();
  const navigate     = useNavigate();
  const { theme, isDark, cycle } = useTheme();

  const ThemeIcon = theme === 'dark' ? SunMoon : theme === 'hybrid' ? Sun : Moon;
  const themeLabel = theme === 'dark' ? 'Switch to Hybrid mode' : theme === 'hybrid' ? 'Switch to Light mode' : 'Switch to Dark mode';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = await login(email, password, remember);
    if (result.ok) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative"
      style={{ backgroundColor: 'var(--bg)', transition: 'background-color 0.25s ease' }}
    >
      {/* Theme toggle — top right corner */}
      <button
        onClick={cycle}
        className="absolute top-4 right-4 p-2 rounded-md transition-colors"
        style={{
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border)',
        }}
        aria-label={themeLabel}
        title={themeLabel}
      >
        <ThemeIcon size={15} />
      </button>

      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(var(--bg-border) 1px, transparent 1px), linear-gradient(90deg, var(--bg-border) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: isDark ? 0.08 : 0.4,
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Top accent bar */}
        <div className="h-0.5 rounded-t" style={{ backgroundColor: 'var(--accent-blue)' }} />

        {/* Panel */}
        <div className="card px-8 py-8 rounded-t-none space-y-6" style={{ borderTop: 'none' }}>
          {/* Logo */}
          <div className="text-center space-y-3">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-lg"
              style={{
                backgroundColor: 'var(--accent-blue-muted)',
                border: '1px solid var(--accent-blue-dim)',
              }}
            >
              <Radio size={22} style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <div className="text-xl font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>MilliBox</div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Secure Officer Access</div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="input-label">Officer Email</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  id="email"
                  type="email"
                  className="input pl-8"
                  placeholder="officer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="input-label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="input pl-8 pr-9"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-3.5 h-3.5"
                style={{ accentColor: 'var(--accent-blue)' }}
              />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Remember this device</span>
            </label>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2 text-xs rounded px-3 py-2"
                style={{
                  color: 'var(--status-critical)',
                  backgroundColor: 'var(--status-critical-bg)',
                  border: '1px solid var(--status-critical-dim)',
                }}
              >
                <ShieldCheck size={12} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              id="authenticate-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center flex items-center gap-2 py-2.5 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Authenticating…
                </>
              ) : 'Authenticate'}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <div className="mt-4 text-center text-2xs space-y-1" style={{ color: 'var(--text-muted)' }}>
          <div className="flex items-center justify-center gap-1.5">
            <Lock size={10} />
            Authorized personnel only
          </div>
          <div>All access attempts are logged and monitored.</div>
        </div>
      </div>
    </div>
  );
}
