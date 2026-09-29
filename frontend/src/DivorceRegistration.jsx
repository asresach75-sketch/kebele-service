import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function DivorceRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    applicantName: '',
    spouseName: '',
    divorceDate: '',
    placeOfDivorce: '',
    phoneNumber: '',
    spouseIdNumber: '', region: '', zone: '', woreda: '', kebele: '',
    divorceDocument: null, marriageCertificate: null,
    witness1Name: '',
    witness1Phone: '',
    witness2Name: '',
    witness2Phone: ''
  });
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const nextErrors = {};
    const nameRegex = /^[a-zA-Z\u1200-\u137F\s]+$/;
    ['applicantName', 'spouseName'].forEach((field) => { const value = formData[field].trim(); if (value.split(/\s+/).length < 2 || !nameRegex.test(value)) nextErrors[field] = 'Enter a valid name with at least two words.'; });
    if (!/^(09|07)\d{8}$/.test(formData.phoneNumber.trim())) nextErrors.phoneNumber = 'Use a valid Ethiopian number starting with 09 or 07.';
    if (!formData.divorceDate || new Date(formData.divorceDate) > new Date()) nextErrors.divorceDate = 'Divorce date is required and cannot be in the future.';
    ['placeOfDivorce', 'region', 'zone', 'woreda', 'kebele', 'spouseIdNumber'].forEach((field) => { if (!formData[field].trim()) nextErrors[field] = 'This field is required.'; });
    ['divorceDocument', 'marriageCertificate'].forEach((field) => { const file = formData[field]; if (!file) nextErrors[field] = 'This document is required.'; else if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) || file.size > 5 * 1024 * 1024) nextErrors[field] = 'Use a JPG, PNG, or PDF smaller than 5 MB.'; });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { setMessage('Please correct the validation errors before submitting.'); return; }
    setSubmitting(true);
    setMessage('');
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        const val = formData[key];
        if (val === null || val === undefined) return;
        if (val instanceof File) {
          data.append(key, val);
        } else {
          data.append(key, val);
        }
      });
      data.append('serviceType', 'DIVORCE_REGISTRATION');

      const token = localStorage.getItem('token');
      const res = await axios.post('/api/services/submit-application', data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setMessage('Divorce registration request submitted successfully! Redirecting to track...');
      const lookupValue = res.data.applicationId || formData.phoneNumber || '';
      if (lookupValue) navigate(`/track?query=${encodeURIComponent(lookupValue)}`);
    } catch (err) {
      console.error('Divorce submit error:', err.response || err.message || err);
      setMessage('Unable to submit request: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: '24px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', borderRadius: '16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Divorce Registration / የፍቺ ምዝገባ</h1>
        <p>Complete the form below to submit your divorce registration request.</p>
        <Link to="/vital-events" style={{ color: '#1d4ed8', textDecoration: 'none' }}>← Back to Vital Events</Link>
      </div>
      {message && <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', backgroundColor: '#d1fae5', color: '#065f46' }}>{message}</div>}
      <form onSubmit={handleSubmit}>
        <label>Applicant Name / የወንድ ስም</label>
        <input name="applicantName" value={formData.applicantName} onChange={handleChange} required style={inputStyle} />
        <label>Spouse Name / የሚስት ስም</label>
        <input name="spouseName" value={formData.spouseName} onChange={handleChange} required style={inputStyle} />
        <label>Divorce Date / የፍቺ ቀን</label>
        <input type="date" name="divorceDate" value={formData.divorceDate} onChange={handleChange} max={new Date().toISOString().split('T')[0]} required style={inputStyle} />
        <label>Place of Divorce / የፍቺ ቦታ</label>
        <input name="placeOfDivorce" value={formData.placeOfDivorce} onChange={handleChange} required style={inputStyle} />
        <label>Phone Number / ስልክ ቁጥር</label>
        <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="0911223344" required style={inputStyle} />
        <label>Spouse ID Number / የሚስት መታወቂያ ቁጥር</label>
        <input name="spouseIdNumber" value={formData.spouseIdNumber} onChange={handleChange} required style={inputStyle} />
        <label>Divorce Document (PDF / Image)</label>
        <input type="file" name="divorceDocument" accept="image/png,image/jpeg,.pdf" onChange={handleFileChange} required style={fileStyle} />
        <label>Marriage Certificate / የጋብቻ ምስክር ወረቀት</label>
        <input type="file" name="marriageCertificate" accept="image/png,image/jpeg,.pdf" onChange={handleFileChange} required style={fileStyle} />
        <label>Region / ክልል</label><input name="region" value={formData.region} onChange={handleChange} required style={inputStyle} />
        <label>Zone / ዞን</label><input name="zone" value={formData.zone} onChange={handleChange} required style={inputStyle} />
        <label>Woreda / ወረዳ</label><input name="woreda" value={formData.woreda} onChange={handleChange} required style={inputStyle} />
        <label>Kebele / ቀበሌ</label><input name="kebele" value={formData.kebele} onChange={handleChange} required style={inputStyle} />
        <label>Witness 1 Name / የምስክር 1 ስም</label>
        <input name="witness1Name" value={formData.witness1Name} onChange={handleChange} style={inputStyle} />
        <label>Witness 1 Phone / የምስክር 1 ስልክ</label>
        <input name="witness1Phone" value={formData.witness1Phone} onChange={handleChange} style={inputStyle} />
        <label>Witness 2 Name / የምስክር 2 ስም</label>
        <input name="witness2Name" value={formData.witness2Name} onChange={handleChange} style={inputStyle} />
        <label>Witness 2 Phone / የምስክር 2 ስልክ</label>
        <input name="witness2Phone" value={formData.witness2Phone} onChange={handleChange} style={inputStyle} />
        <button type="submit" disabled={submitting} style={{ ...submitButton, opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Submitting...' : 'Submit Divorce Request'}</button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px',
  margin: '8px 0 16px',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  boxSizing: 'border-box'
};

const fileStyle = {
  width: '100%',
  margin: '8px 0 16px'
};

const submitButton = {
  padding: '12px 22px',
  backgroundColor: '#1d4ed8',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 700
};

export default DivorceRegistration;
