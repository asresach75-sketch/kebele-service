import React, { useState } from 'react';
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
  const navigate = useNavigate();

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
          password: formData.password
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = response.status === 403
          ? lang === 'am' ? 'ይህ መለያ ታግዷል። እባክዎ አስተዳዳሪውን ያነጋግሩ።' : 'This account is blocked. Please contact an administrator.'
          : response.status === 400
            ? lang === 'am' ? data.message || 'ኢሜይል/ስልክ ወይም የይለፍ ቃል ትክክል አይደለም።' : 'Email/phone or password is incorrect.'
            : data.message || `${lang === 'am' ? 'መግባት አልተሳካም' : 'Login failed'} (${response.status})`;
        throw new Error(message);
      }

      localStorage.setItem('token', data.token);
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
    <div style={{ maxWidth: '440px', margin: '50px auto', padding: '24px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#0056b3', fontWeight: 'bold' }}>← {t.backHome}</Link>
        <div aria-label="Language" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
          <button type="button" onClick={() => toggleLanguage('am')} aria-pressed={lang === 'am'} style={{ border: 0, background: lang === 'am' ? '#dbeafe' : 'transparent', color: '#1d4ed8', padding: '5px 7px', borderRadius: '4px', cursor: 'pointer' }}>አማርኛ</button>
          <span aria-hidden="true">|</span>
          <button type="button" onClick={() => toggleLanguage('en')} aria-pressed={lang === 'en'} style={{ border: 0, background: lang === 'en' ? '#dbeafe' : 'transparent', color: '#1d4ed8', padding: '5px 7px', borderRadius: '4px', cursor: 'pointer' }}>English</button>
        </div>
      </div>
      <h2>{t.login}</h2>
      {error && (
        <div role="alert" aria-live="assertive" style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontWeight: 700 }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="login-identifier">{t.emailOrPhone}:</label><br />
          <input
            id="login-identifier"
            type="text"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginTop: '5px' }}
            placeholder={lang === 'am' ? 'ኢሜይል ወይም ስልክ ያስገቡ' : 'Enter email or phone'}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="login-password">{t.password}:</label><br />
          <div style={{ position: 'relative', marginTop: '5px' }}>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px 44px 8px 8px', boxSizing: 'border-box' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? (lang === 'am' ? 'የይለፍ ቃሉን ደብቅ' : 'Hide password') : (lang === 'am' ? 'የይለፍ ቃሉን አሳይ' : 'Show password')}
              title={showPassword ? (lang === 'am' ? 'የይለፍ ቃሉን ደብቅ' : 'Hide password') : (lang === 'am' ? 'የይለፍ ቃሉን አሳይ' : 'Show password')}
              style={{ position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', border: 0, borderRadius: '4px', background: 'transparent', color: '#475569', cursor: 'pointer' }}
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {showPassword ? <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></> : <><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a15.8 15.8 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10.7 10.7 0 0 0 4-.8" /></>}
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Link to="/contact" style={{ color: '#1d4ed8', fontSize: '13px', textDecoration: 'none' }}>
              {lang === 'am' ? 'የይለፍ ቃል ረስተዋል? ድጋፍን ያነጋግሩ' : 'Forgot password? Contact support'}
            </Link>
          </div>
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: loading ? '#94a3b8' : 'blue', color: 'white', border: 'none', cursor: loading ? 'default' : 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
          {loading ? (lang === 'am' ? 'በመግባት ላይ...' : 'Logging in...') : (lang === 'am' ? 'ግባ' : 'Log in')}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
        {t.signupPrompt} <Link to="/signup" style={{ color: 'blue', textDecoration: 'none', fontWeight: 'bold' }}>{t.signup}</Link>
      </p>
    </div>
  );
}

export default Login;