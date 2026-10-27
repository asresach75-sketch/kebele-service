import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import './Login.css';

const Login = () => {
  const { lang, toggleLanguage, t } = useLanguage();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [identifierActive, setIdentifierActive] = useState(false);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef(null);
  const languageButtonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!languageMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!languageMenuRef.current?.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLanguageMenuOpen(false);
        languageButtonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [languageMenuOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: formData.identifier.trim(),
          password: formData.password,
          rememberMe,
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = null;
      }

      if (!response.ok) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error(lang === 'am'
            ? `ሰርቨሩ ትክክለኛ የ JSON ምላሽ አልላከም (HTTP ${response.status})። የ backend ሰርቨሩን ያረጋግጡ።`
            : `The server returned a non-JSON response (HTTP ${response.status}). Check that the backend is running.`);
        }
        const message = response.status === 403
          ? lang === 'am' ? 'ይህ መለያ ታግዷል። እባክዎ አስተዳዳሪውን ያነጋግሩ።' : 'This account is blocked. Please contact an administrator.'
          : response.status === 400
            ? lang === 'am' ? data.message || 'ኢሜይል/ስልክ ወይም የይለፍ ቃል ትክክል አይደለም።' : 'Email/phone or password is incorrect.'
            : data.message || `${lang === 'am' ? 'መግባት አልተሳካም' : 'Login failed'} (${response.status})`;
        throw new Error(message);
      }

      if (!data || typeof data !== 'object' || Array.isArray(data) || !data.token || !data.user) {
        throw new Error(lang === 'am'
          ? 'ከሰርቨሩ የተቀበለው የመግቢያ ምላሽ ትክክል አይደለም። የ backend ሰርቨሩን ያረጋግጡ።'
          : 'The server returned an invalid login response. Check the backend server.');
      }

      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      (rememberMe ? localStorage : sessionStorage).setItem('token', data.token);
      localStorage.setItem('userInfo', JSON.stringify(data.user));
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('role', data.user.role || 'user');

      switch ((data.user.role || 'user').toLowerCase()) {
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'officer':
          navigate('/officer-dashboard');
          break;
        case 'finance':
          navigate('/finance-dashboard');
          break;
        case 'verifier':
          navigate('/verifier-dashboard');
          break;
        case 'vital':
          navigate('/vital-dashboard');
          break;
        case 'support':
          navigate('/support-dashboard');
          break;
        default:
          navigate('/');
          break;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
        <header className="login-site-header">
          <Link to="/" className="login-back-link">
            <span className="back-arrow" aria-hidden="true">←</span>
            <span>{lang === 'am' ? 'ወደ መነሻ ገጽ' : 'Back to Home'}</span>
          </Link>

          <div className="login-header-brand">
            <div className="login-brand-emblem" aria-hidden="true">E</div>
            <div className="login-header-copy">
              <h1>
                {lang === 'am'
                  ? 'እንኳን ወደ ኢ-ቀበሌ ዲጂታል አገልግሎት ፖርታል በደህና መጡ'
                  : 'Welcome to E-Kebele Digital Service Portal'}
              </h1>
              <p>{lang === 'am' ? 'የቀበሌ አገልግሎት በይነመረብ ፖርታል' : 'Official Public Service Gateway'}</p>
            </div>
          </div>

          <div className="login-site-actions">
            <div className="language-switch" ref={languageMenuRef}>
              <button
                ref={languageButtonRef}
                type="button"
                className="language-btn active"
                onClick={() => setLanguageMenuOpen((open) => !open)}
                aria-label={lang === 'am' ? 'ቋንቋ' : 'Language'}
                aria-haspopup="menu"
                aria-expanded={languageMenuOpen}
              >
                <span aria-hidden="true">🌐</span>
                {lang === 'am' ? 'ቋንቋ' : 'Language'}
                <span className="language-menu-chevron" aria-hidden="true">{languageMenuOpen ? '▲' : '▼'}</span>
              </button>
              {languageMenuOpen && (
                <div className="language-menu" role="menu" aria-label={lang === 'am' ? 'Хэл сонгох' : 'Choose language'}>
                  <button
                    type="button"
                    role="menuitem"
                    className="language-menu-option"
                    onClick={() => {
                      toggleLanguage('am');
                      setLanguageMenuOpen(false);
                    }}
                    aria-current={lang === 'am' ? 'true' : undefined}
                  >
                    አማርኛ{lang === 'am' && <span aria-hidden="true">✓</span>}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="language-menu-option"
                    onClick={() => {
                      toggleLanguage('en');
                      setLanguageMenuOpen(false);
                    }}
                    aria-current={lang === 'en' ? 'true' : undefined}
                  >
                    English{lang === 'en' && <span aria-hidden="true">✓</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="login-card-wrap">
          <div className="login-card">
            <div className="login-card-intro">
              <h2 className="login-card-title">{lang === 'am' ? 'መለያዎ ይግቡ' : 'Sign In'}</h2>
              <p>{lang === 'am' ? 'አገልግሎት ለማግኘት ኢሜይልና የይለፍ ቃል ያስገቡ' : 'Enter your credentials to access services'}</p>
            </div>

            {error && (
              <div role="alert" aria-live="assertive" className="login-error">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="login-error-link"
                >
                  {lang === 'am' ? '👉 የይለፍ ቃልዎን ለማደስ እዚህ ይጫኑ' : '👉 Reset your password here'}
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
              <div className="form-group">
                <label htmlFor="login-identifier">{t.emailOrPhone}</label>
                <input
                  id="login-identifier"
                  type="text"
                  name="identifier"
                  autoComplete="off"
                  readOnly={!identifierActive}
                  onFocus={() => setIdentifierActive(true)}
                  value={formData.identifier}
                  onChange={handleChange}
                  required
                  placeholder={lang === 'am' ? 'ለምሳሌ example@gmail.com ወይም 0911123456' : 'e.g. example@gmail.com or 0911123456'}
                />
              </div>

              <div className="form-group password-group">
                <div className="form-label-row">
                  <label htmlFor="login-password">{t.password}</label>
                    <Link to="/forgot-password" className="form-footnote-link">
                    {lang === 'am' ? 'የይለፍ ቃል ረስተዋል?' : 'Forgot password?'}
                  </Link>
                </div>
                <div className="password-input-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={lang === 'am' ? '••••••••' : '••••••••'}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? (lang === 'am' ? 'የይለፍ ቃሉን ደብቅ' : 'Hide password') : (lang === 'am' ? 'የይለፍ ቃሉን አሳይ' : 'Show password')}
                    title={showPassword ? (lang === 'am' ? 'የይለፍ ቃሉን ደብቅ' : 'Hide password') : (lang === 'am' ? 'የይለፍ ቃሉን አሳይ' : 'Show password')}
                  >
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {showPassword ? <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></> : <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a15.8 15.8 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.7 10.7 0 0 0 4-.8" /></>}
                    </svg>
                  </button>
                </div>
              </div>

              <label className="remember-me-row">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>{lang === 'am' ? 'አስታውሰኝ' : 'Remember me'}</span>
              </label>

              <button type="submit" disabled={loading} className="login-submit">
                {loading ? (lang === 'am' ? 'በመግባት ላይ...' : 'Logging in...') : (lang === 'am' ? 'ግባ' : 'Log in')}
              </button>
            </form>

            <p className="signup-text">
              {lang === 'am' ? 'መለያ የለዎትም?' : "Don't have an account? "}
              <Link to="/signup">{lang === 'am' ? 'ይመዝገቡ' : 'Sign up'}</Link>
            </p>
          </div>
        </div>

        <footer className="login-footer">
          <div className="login-footer-content">
            <div className="login-footer-brand">
              <strong>E-Kebele Portal</strong>
              <span>{lang === 'am' ? 'የቀበሌ ዲጂታል አገልግሎት' : 'Kebele Digital Services'}</span>
            </div>
            <nav aria-label={lang === 'am' ? 'የግርጌ አገናኞች' : 'Footer navigation'}>
              <Link to="/about">{lang === 'am' ? 'ስለ እኛ' : 'About us'}</Link>
              <Link to="/contact">{lang === 'am' ? 'ያግኙን' : 'Contact & support'}</Link>
              <Link to="/track">{lang === 'am' ? 'ማመልከቻ ይከታተሉ' : 'Track application'}</Link>
            </nav>
          </div>
        </footer>
    </div>
  );
}

export default Login;