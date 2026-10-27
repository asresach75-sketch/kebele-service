import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddStaff.css';

const initialForm = { fullName: '', email: '', phone: '', role: 'officer', password: '' };

const AddStaff = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
    setErrors((current) => ({ ...current, [event.target.name]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (formData.fullName.trim().split(/\s+/).length < 2) nextErrors.fullName = 'Enter at least first and last name.';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!/^(09|07)\d{8}$/.test(formData.phone.trim())) nextErrors.phone = 'Use a valid Ethiopian number starting with 09 or 07.';
    if (formData.password.length < 8) nextErrors.password = 'Password must be at least 8 characters.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setMessage('');
    try {
      await axios.post('/api/users/staff', formData, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` }
      });
      navigate('/admin-dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-staff-page">
      <header className="add-staff-header">
        <div className="add-staff-header-inner">
          <div className="add-staff-brand">
            <span className="add-staff-brand-mark" aria-hidden="true">ኢ</span>
            <div><strong>ኢ-ቀበሌ / E-Kebele</strong><span>Admin Portal</span></div>
          </div>
          <button type="button" onClick={() => navigate('/admin-dashboard')} className="add-staff-dashboard-link">
            Dashboard
          </button>
        </div>
      </header>
      <main className="add-staff-main">
        <section className="add-staff-card">
          <div className="add-staff-card-heading">
            <div>
              <span className="add-staff-eyebrow">STAFF MANAGEMENT</span>
              <h1>Add New Staff / አዲስ ሰራተኛ</h1>
            </div>
            <button type="button" onClick={() => navigate('/admin-dashboard')} className="add-staff-back-link">
              ← Back
            </button>
          </div>
          {message && <p className="add-staff-error" role="alert">{message}</p>}
          <form onSubmit={handleSubmit} className="add-staff-form">
            <label>Full Name / ሙሉ ስም<input className={errors.fullName ? 'has-error' : ''} name="fullName" value={formData.fullName} onChange={handleChange} required />{errors.fullName && <small>{errors.fullName}</small>}</label>
            <label>Email / ኢሜይል (Optional)<input className={errors.email ? 'has-error' : ''} type="email" name="email" value={formData.email} onChange={handleChange} />{errors.email && <small>{errors.email}</small>}</label>
            <label>Phone / ስልክ<input className={errors.phone ? 'has-error' : ''} type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="0911223344" required />{errors.phone && <small>{errors.phone}</small>}</label>
            <label>Role / የስራ ድርሻ<select name="role" value={formData.role} onChange={handleChange}><option value="officer">Officer</option><option value="finance">Finance Officer</option><option value="admin">Administrator</option></select></label>
            <label>Temporary Password / ጊዜያዊ የይለፍ ቃል<input className={errors.password ? 'has-error' : ''} type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} />{errors.password && <small>{errors.password}</small>}</label>
            <button type="submit" disabled={submitting} className="add-staff-submit">{submitting ? 'Saving...' : 'Save Staff Account'}</button>
          </form>
        </section>
      </main>
      <footer className="add-staff-footer">
        © 2026 E-Kebele Portal · የቀበሌ ዲጂታል አገልግሎት ስርዓት
      </footer>
    </div>
  );
};

export default AddStaff;
