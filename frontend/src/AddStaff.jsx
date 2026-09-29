import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      navigate('/admin-dashboard');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 sm:p-10">
      <section className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-md sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4 border-b pb-4">
          <h1 className="text-xl font-bold text-gray-800">Add New Staff / አዲስ ሰራተኛ</h1>
          <button type="button" onClick={() => navigate('/admin-dashboard')} className="rounded-lg bg-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
            ← Back to Dashboard
          </button>
        </div>
        {message && <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm font-semibold text-red-700">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-bold">Full Name / ሙሉ ስም<input className={`mt-1 w-full rounded-lg border p-3 font-normal ${errors.fullName ? 'border-red-500' : ''}`} name="fullName" value={formData.fullName} onChange={handleChange} required />{errors.fullName && <small className="text-red-600">{errors.fullName}</small>}</label>
          <label className="block text-sm font-bold">Email / ኢሜይል (Optional)<input className={`mt-1 w-full rounded-lg border p-3 font-normal ${errors.email ? 'border-red-500' : ''}`} type="email" name="email" value={formData.email} onChange={handleChange} />{errors.email && <small className="text-red-600">{errors.email}</small>}</label>
          <label className="block text-sm font-bold">Phone / ስልክ<input className={`mt-1 w-full rounded-lg border p-3 font-normal ${errors.phone ? 'border-red-500' : ''}`} type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="0911223344" required />{errors.phone && <small className="text-red-600">{errors.phone}</small>}</label>
          <label className="block text-sm font-bold">Role / የስራ ድርሻ<select className="mt-1 w-full rounded-lg border p-3 font-normal" name="role" value={formData.role} onChange={handleChange}><option value="officer">Officer</option><option value="finance">Finance Officer</option><option value="admin">Administrator</option></select></label>
          <label className="block text-sm font-bold">Temporary Password / ጊዜያዊ የይለፍ ቃል<input className={`mt-1 w-full rounded-lg border p-3 font-normal ${errors.password ? 'border-red-500' : ''}`} type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} />{errors.password && <small className="text-red-600">{errors.password}</small>}</label>
          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-700 py-3 font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Saving...' : 'Save Staff Account'}</button>
        </form>
      </section>
    </main>
  );
};

export default AddStaff;
