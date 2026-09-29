import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', {
        identifier: email,
        password: password
      });

      if (response.data.user) {
        const loggedUser = response.data.user;
        localStorage.setItem('user', JSON.stringify(loggedUser));
        if (loggedUser.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          setError('This login page is for admin users only.');
        }
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <div style={{ maxWidth: '420px', margin: '50px auto', padding: '22px', border: '1px solid #d1d5db', borderRadius: '12px', boxShadow: '0 12px 30px rgba(15,23,42,0.08)', fontFamily: 'Arial, sans-serif', backgroundColor: '#ffffff' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '18px' }}>Admin Portal Login</h2>
      <p style={{ textAlign: 'center', marginBottom: '18px', color: '#374151' }}>System administration only. Use your admin email and password.</p>
      {error && <p style={{ color: '#b91c1c', fontWeight: 700, marginBottom: '14px' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@gmail.com"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="admin@1121"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '12px 16px', backgroundColor: '#1d4ed8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}>Login to Dashboard</button>
      </form>
      <p style={{ marginTop: '22px', textAlign: 'center', color: '#475569' }}>
        Back to <Link to="/" style={{ color: '#1d4ed8', textDecoration: 'none' }}>Home</Link>
      </p>
    </div>
  );
}

export default AdminLogin;
