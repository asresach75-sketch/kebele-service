import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function DeathRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ reporterName: '', deceasedName: '', dateOfDeath: '', placeOfDeath: '', phone: '', phoneNumber: '', region: '', zone: '', woreda: '', kebele: '', applicantPhoto: null, deathCertificate: null });
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
    if (formData.reporterName.trim().split(/\s+/).length < 2 || !nameRegex.test(formData.reporterName.trim())) nextErrors.reporterName = 'Enter a valid name with at least two words.';
    if (formData.deceasedName.trim().split(/\s+/).length < 2 || !nameRegex.test(formData.deceasedName.trim())) nextErrors.deceasedName = 'Enter a valid name with at least two words.';
    if (!/^(09|07)\d{8}$/.test(formData.phone.trim())) nextErrors.phone = 'Use a valid Ethiopian number starting with 09 or 07.';
    if (!formData.dateOfDeath || new Date(formData.dateOfDeath) > new Date()) nextErrors.dateOfDeath = 'Date of death is required and cannot be in the future.';
    ['placeOfDeath', 'region', 'zone', 'woreda', 'kebele'].forEach((field) => { if (!formData[field].trim()) nextErrors[field] = 'This field is required.'; });
    if (formData.deathCertificate && (!['application/pdf', 'image/jpeg', 'image/png'].includes(formData.deathCertificate.type) || formData.deathCertificate.size > 5 * 1024 * 1024)) nextErrors.deathCertificate = 'Certificate must be PDF/JPG/PNG and no larger than 5 MB.';
    if (formData.applicantPhoto && (!['image/jpeg', 'image/png'].includes(formData.applicantPhoto.type) || formData.applicantPhoto.size > 5 * 1024 * 1024)) nextErrors.applicantPhoto = 'Photo must be JPG/PNG and no larger than 5 MB.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries({ ...formData, serviceType: 'DEATH_REGISTRATION' }).forEach(([key, value]) => { if (value !== null && key !== 'phoneNumber' && key !== 'deathCertificate' && key !== 'applicantPhoto') payload.append(key, value); });
      payload.set('phone', formData.phone);
      if (formData.applicantPhoto) payload.append('applicantPhoto', formData.applicantPhoto);
      if (formData.deathCertificate) payload.append('deathCertificate', formData.deathCertificate);
      const res = await axios.post('/api/services/submit-application', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setMessage('Death registration request submitted successfully! Redirecting to track...');
      const lookupValue = res.data.applicationId;
      navigate(`/track?query=${encodeURIComponent(lookupValue)}`);
    } catch (err) {
      setMessage('Unable to submit request: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: '24px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', borderRadius: '16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Death Registration / የሞት ምዝገባ</h1>
        <p>Complete the form below to submit your death registration request.</p>
        <Link to="/vital-events" style={{ color: '#1d4ed8', textDecoration: 'none' }}>← Back to Vital Events</Link>
      </div>
      {message && <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', backgroundColor: '#d1fae5', color: '#065f46' }}>{message}</div>}
      <form onSubmit={handleSubmit}>
        <label>Reporter Name / የመግለጫ ስም</label>
        <input name="reporterName" value={formData.reporterName} onChange={handleChange} required style={inputStyle} />{errors.reporterName && <small style={errorStyle}>{errors.reporterName}</small>}
        <label>Deceased Person Name / የሞተዉ ስም</label>
        <input name="deceasedName" value={formData.deceasedName} onChange={handleChange} required style={inputStyle} />{errors.deceasedName && <small style={errorStyle}>{errors.deceasedName}</small>}
        <label>Date of Death / የሞት ቀን</label>
        <input type="date" name="dateOfDeath" value={formData.dateOfDeath} onChange={handleChange} max={new Date().toISOString().split('T')[0]} required style={inputStyle} />{errors.dateOfDeath && <small style={errorStyle}>{errors.dateOfDeath}</small>}
        <label>Place of Death / የሞት ቦታ</label>
        <input name="placeOfDeath" value={formData.placeOfDeath} onChange={handleChange} required style={inputStyle} />{errors.placeOfDeath && <small style={errorStyle}>{errors.placeOfDeath}</small>}
        <label>Phone Number / ስልክ ቁጥር</label>
        <input name="phone" value={formData.phone} onChange={handleChange} required style={inputStyle} placeholder="0911223344" />{errors.phone && <small style={errorStyle}>{errors.phone}</small>}
        <label>Region / ክልል</label><input name="region" value={formData.region} onChange={handleChange} required style={inputStyle} />
        <label>Zone / ዞን</label><input name="zone" value={formData.zone} onChange={handleChange} required style={inputStyle} />
        <label>Woreda / ወረዳ</label><input name="woreda" value={formData.woreda} onChange={handleChange} required style={inputStyle} />
        <label>Kebele / ቀበሌ</label><input name="kebele" value={formData.kebele} onChange={handleChange} required style={inputStyle} />
        <label>Applicant/Deceased Photo / የአመልካች ወይም የሟች ፎቶ (Optional / አማራጭ)</label>
        <input type="file" name="applicantPhoto" accept="image/png,image/jpeg" onChange={handleFileChange} style={fileStyle} />{errors.applicantPhoto && <small style={errorStyle}>{errors.applicantPhoto}</small>}
        <label>Medical / Hospital Death Certificate / የሕክምና ወይም የሆስፒታል ሰነድ (Optional / አማራጭ)</label>
        <input type="file" name="deathCertificate" accept="image/png,image/jpeg,.pdf" onChange={handleFileChange} style={fileStyle} />{errors.deathCertificate && <small style={errorStyle}>{errors.deathCertificate}</small>}
        <button type="submit" disabled={submitting} style={{ ...submitButton, opacity: submitting ? 0.6 : 1 }}>{submitting ? 'Submitting...' : 'Submit Death Request'}</button>
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

const errorStyle = { display: 'block', color: '#b91c1c', fontSize: '12px', marginTop: '-10px', marginBottom: '10px' };

export default DeathRegistration;
