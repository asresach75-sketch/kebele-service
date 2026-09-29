import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function BirthRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    childFullName: '', gender: '', dob: '', pob: '', fatherFullName: '',
    fatherNationality: 'Ethiopian', motherFullName: '', motherNationality: 'Ethiopian',
    parentIDNumber: '', phone: '', email: '', country: 'Ethiopia', region: '', zone: '', wereda: '',
    registrationNumber: '', registrarName: '', registrationDate: new Date().toISOString().split('T')[0], hospitalDoc: null, childPhoto: null
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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
    ['childFullName', 'fatherFullName', 'motherFullName'].forEach((field) => {
      const value = formData[field].trim();
      if (value.split(/\s+/).length < 2 || !nameRegex.test(value)) nextErrors[field] = 'Enter a valid name with at least two words.';
    });
    if (!/^(09|07)\d{8}$/.test(formData.phone.trim())) nextErrors.phone = 'Use a valid Ethiopian number starting with 09 or 07.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!formData.dob || new Date(formData.dob) > new Date()) nextErrors.dob = 'Date of birth is required and cannot be in the future.';
    ['pob', 'region', 'zone', 'wereda'].forEach((field) => { if (!formData[field].trim()) nextErrors[field] = 'This field is required.'; });
    if (formData.hospitalDoc && (!['application/pdf', 'image/jpeg', 'image/png'].includes(formData.hospitalDoc.type) || formData.hospitalDoc.size > 5 * 1024 * 1024)) nextErrors.hospitalDoc = 'Document must be PDF/JPG/PNG and no larger than 5 MB.';
    if (!formData.childPhoto) nextErrors.childPhoto = 'Child photo is required.';
    if (formData.childPhoto && (!['image/jpeg', 'image/png'].includes(formData.childPhoto.type) || formData.childPhoto.size > 2 * 1024 * 1024)) nextErrors.childPhoto = 'Photo must be JPG/PNG and no larger than 2 MB.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { setMessage('Please correct the highlighted validation errors.'); return; }
    setSubmitting(true);
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && !(value instanceof File)) payload.append(key, value);
      });
      payload.append('childName', formData.childFullName);
      payload.append('dateOfBirth', formData.dob);
      payload.append('placeOfBirth', formData.pob);
      payload.append('phoneNumber', formData.phone);
      payload.append('childGender', formData.gender);
      payload.append('parentIdNumber', formData.parentIDNumber);
      if (formData.hospitalDoc) payload.append('birthCertificate', formData.hospitalDoc);
      if (formData.childPhoto) payload.append('webcamPhoto', formData.childPhoto);
      payload.append('serviceType', 'BIRTH_REGISTRATION');

      const res = await axios.post('/api/services/submit-application', payload, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setMessage('Birth registration request submitted successfully! Redirecting to track...');
      const lookupValue = res.data.applicationId;
      navigate(`/track?query=${encodeURIComponent(lookupValue)}`);
    } catch (err) {
      console.error('Birth submit error:', err.response || err.message || err);
      const serverMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setMessage('Unable to submit request: ' + serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 760, margin: '40px auto', padding: '24px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', borderRadius: '16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1>Birth Registration / የልደት ምዝገባ</h1>
        <p>Complete the form below to submit your birth registration request.</p>
        <Link to="/vital-events" style={{ color: '#1d4ed8', textDecoration: 'none' }}>← Back to Vital Events</Link>
      </div>
      {message && <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', backgroundColor: '#d1fae5', color: '#065f46' }}>{message}</div>}
      <form onSubmit={handleSubmit}>
        {[
          ['childFullName', "Child's Full Name / ሙሉ ስም"], ['fatherFullName', "Father's Full Name / የአባት ስም"],
          ['motherFullName', "Mother's Full Name / የእናት ስም"], ['parentIDNumber', 'Parent ID Number / የወላጅ መታወቂያ'],
          ['phone', 'Phone Number / ስልክ'], ['pob', 'Place of Birth / የትውልድ ቦታ'],
          ['country', 'Country / ሀገር'], ['region', 'Region / ክልል'], ['zone', 'Zone / ዞን'], ['wereda', 'Wereda / ወረዳ']
        ].map(([name, label]) => <React.Fragment key={name}><label>{label}</label><input name={name} value={formData[name]} onChange={handleChange} required style={inputStyle} /></React.Fragment>)}
        <label>Email Address / ኢሜይል</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="example@gmail.com" style={inputStyle} />
        <label>Gender / ጾታ</label>
        <select name="gender" value={formData.gender} onChange={handleChange} required style={inputStyle}>
          <option value="">Select Gender / ጾታ ይምረጡ</option>
          <option value="Male">Male / ወንድ</option>
          <option value="Female">Female / ሴት</option>
        </select>
        <label>Date of Birth / የልደት ቀን</label>
        <input type="date" name="dob" max={new Date().toISOString().split('T')[0]} value={formData.dob} onChange={handleChange} required style={inputStyle} />
        <label>Birth Notification / Hospital Document (Optional / አማራጭ)</label>
        <input type="file" name="hospitalDoc" accept="image/png,image/jpeg,.pdf" onChange={handleFileChange} style={fileStyle} />{errors.hospitalDoc && <small style={errorStyle}>{errors.hospitalDoc}</small>}
        <label>Child Photo / የልጁ/ዋ ፎቶ *</label>
        <input type="file" name="childPhoto" required accept="image/png,image/jpeg" onChange={handleFileChange} style={fileStyle} />{errors.childPhoto && <small style={errorStyle}>{errors.childPhoto}</small>}
        <label>Birth Registration Number / የልደት ምዝገባ ቁጥር (Optional / አማራጭ)</label><input name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} style={inputStyle} />
        <label>Date of Registration / የተመዘገበበት ቀን</label><input type="date" name="registrationDate" value={formData.registrationDate} onChange={handleChange} max={new Date().toISOString().split('T')[0]} style={inputStyle} />
        <label>Registrar Name / መዝጋቢው ስም</label><input name="registrarName" value={formData.registrarName} onChange={handleChange} style={inputStyle} />
        <button type="submit" disabled={submitting} style={{ ...submitButton, opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}>{submitting ? 'Submitting...' : 'Submit Birth Request'}</button>
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

const errorStyle = { display: 'block', color: '#b91c1c', fontSize: '12px', marginBottom: '10px' };

export default BirthRegistration;
