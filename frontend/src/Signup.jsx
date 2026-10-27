import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import { isStrongPassword } from './utils/passwordValidation';
import { isValidApplicantName } from './utils/idApplicationValidation';

function Signup() {
  const { lang, t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setErrorMessage('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    if (!formData.fullName.trim()) {
      setErrorMessage(lang === 'am' ? 'እባክዎ ሙሉ ስም ያስገቡ።' : 'Please enter your full name.');
      return;
    }
    if (!isValidApplicantName(formData.fullName.trim())) {
      setErrorMessage(lang === 'am'
        ? 'እያንዳንዱ የስም ክፍል ቢያንስ 3 ፊደላት መያዝ አለበት።'
        : 'Each part of your name must contain at least 3 letters.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage(lang === 'am' ? 'ትክክለኛ ኢሜይል ያስገቡ።' : 'Please enter a valid email address.');
      return;
    }
    if (!/^(09|07)\d{8}$/.test(phone)) {
      setErrorMessage(lang === 'am'
        ? '09 ወይም 07 በሚጀምር ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ።'
        : 'Enter a valid Ethiopian phone number starting with 09 or 07.');
      return;
    }
    if (!isStrongPassword(formData.password)) {
      setErrorMessage(lang === 'am'
        ? 'የይለፍ ቃሉ ቢያንስ 8 ቁምፊዎች፣ አንድ ትልቅ ፊደል፣ አንድ ትንሽ ፊደል፣ ቁጥር እና ልዩ ምልክት (@ # $ % ! & *) መያዝ አለበት።'
        : 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character (@ # $ % ! & *).');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        fullName: formData.fullName.trim(),
        email,
        phone
      };

      const response = await fetch('/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userInfo', JSON.stringify(data.user));
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role', data.user.role || 'user');
        navigate('/home');
      } else {
        console.error('Signup failed:', data);
        setErrorMessage(data.message || 'ምዝገባው አልተሳካም!');
      }
    } catch (err) {
      console.error('Error:', err);
      setErrorMessage('ከሰርቨሩ ጋር መገናኘት አልተቻለም!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '350px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center' }}>{lang === 'am' ? 'መለያ ይፍጠሩ' : 'Create an Account (Signup)'}</h2>
      {errorMessage && (
        <div role="alert" aria-live="assertive" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', padding: '12px 14px', border: '1px solid #fecaca', borderLeft: '4px solid #dc2626', borderRadius: '8px', background: '#fef2f2', color: '#b91c1c', fontSize: '14px', lineHeight: 1.5 }}>
          <span>{errorMessage}</span>
          <button type="button" aria-label="Dismiss error" onClick={() => setErrorMessage('')} style={{ flexShrink: 0, border: 0, padding: 0, background: 'transparent', color: 'inherit', fontWeight: 700 }}>×</button>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t.fullName}</label>
          <input 
            type="text" 
            name="fullName" 
            placeholder="ሙሉ ስም ያስገቡ" 
            value={formData.fullName}
            onChange={handleChange} 
            required 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="signup-email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            {lang === 'am' ? 'ኢሜይል' : 'Email'} <span aria-hidden="true" style={{ color: '#dc2626' }}>*</span>
          </label>
          <input 
            id="signup-email"
            type="email" 
            name="email" 
            autoComplete="email"
            placeholder="example@gmail.com"
            value={formData.email}
            onChange={handleChange} 
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t.phone}</label>
          <input 
            type="tel" 
            name="phone" 
            placeholder="0912345678" 
            value={formData.phone}
            onChange={handleChange} 
            required 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>{t.password}</label>
          <input 
            type="password" 
            name="password" 
            placeholder="የይለፍ ቃል ያስገቡ" 
            value={formData.password}
            onChange={handleChange} 
            required 
            minLength={8}
            aria-describedby="signup-password-requirements"
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }} 
          />
          <small id="signup-password-requirements" style={{ display: 'block', marginTop: '5px', color: '#475569', lineHeight: 1.5 }}>
            {lang === 'am'
              ? '8+ ቁምፊዎች፣ ትልቅ/ትንሽ ፊደል፣ ቁጥር እና ልዩ ምልክት (@ # $ % ! & *)'
              : '8+ characters, uppercase and lowercase letters, a number, and a special character (@ # $ % ! & *)'}
          </small>
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: loading ? '#86c994' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'wait' : 'pointer', fontWeight: 'bold' }}>
          {loading ? (lang === 'am' ? 'በመመዝገብ ላይ...' : 'Registering...') : (lang === 'am' ? 'ይመዝገቡ' : 'Sign up')}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        {t.accountPrompt} <Link to="/login" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>{t.login}</Link>
      </p>
    </div>
  );
}

export default Signup;