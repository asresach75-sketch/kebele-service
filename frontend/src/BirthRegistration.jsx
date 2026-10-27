import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BirthRegistration.css';

function BirthRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    childFullName: '', gender: '', dob: '', pob: '', fatherFullName: '', fatherDob: '',
    fatherNationality: 'Ethiopian', motherFullName: '', motherDob: '', motherNationality: 'Ethiopian',
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
    const dateOnly = (value) => {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      if (!match) return false;
      const [, year, month, day] = match;
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
        .toISOString().slice(0, 10) === value;
    };
    const today = new Date();
    const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    if (!dateOnly(formData.dob) || new Date(`${formData.dob}T00:00:00Z`) > todayDate) {
      nextErrors.dob = 'Enter a valid date of birth that is not in the future.';
    }
    ['fatherDob', 'motherDob'].forEach((field) => {
      if (!dateOnly(formData[field]) || new Date(`${formData[field]}T00:00:00Z`) > todayDate) {
        nextErrors[field] = 'Enter a valid parent date of birth that is not in the future.';
      } else if (dateOnly(formData.dob) && new Date(`${formData[field]}T00:00:00Z`) >= new Date(`${formData.dob}T00:00:00Z`)) {
        nextErrors[field] = 'Parent date of birth must be before the child date of birth.';
      }
    });
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
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` }
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

  const renderField = (name, label, type = 'text', required = true, props = {}) => (
    <div className="birth-registration-field" key={name}>
      <label htmlFor={`birth-${name}`}>{label}{required ? ' *' : ''}</label>
      <input
        id={`birth-${name}`}
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        required={required}
        style={inputStyle}
        {...props}
      />
      {errors[name] && <small style={errorStyle}>{errors[name]}</small>}
    </div>
  );

  return (
    <main className="birth-registration-page">
      <div className="birth-registration-card">
        <div className="birth-registration-header">
          <div>
        <h1>Birth Registration / የልደት ምዝገባ</h1>
        <p>Complete the form below to submit your birth registration request.</p>
          </div>
          <Link to="/vital-events" className="birth-registration-back">← Back to Vital Events</Link>
      </div>
      {message && <div className="birth-registration-message" role="status">{message}</div>}
      <form onSubmit={handleSubmit} className="birth-registration-form">
        <section className="birth-registration-section">
          <h2>Child &amp; Parent Information / የልጅ እና ወላጅ መረጃ</h2>
          <div className="birth-registration-grid">
            {renderField('childFullName', "Child's Full Name / ሙሉ ስም")}
            {renderField('parentIDNumber', 'Parent ID Number / የወላጅ መታወቂያ')}
            {renderField('fatherFullName', "Father's Full Name / የአባት ስም")}
            {renderField('fatherDob', "Father's Date of Birth / የአባት የልደት ቀን", 'date', true, { max: new Date().toISOString().split('T')[0] })}
            {renderField('motherFullName', "Mother's Full Name / የእናት ስም")}
            {renderField('motherDob', "Mother's Date of Birth / የእናት የልደት ቀን", 'date', true, { max: new Date().toISOString().split('T')[0] })}
            <div className="birth-registration-field">
              <label htmlFor="birth-gender">Gender / ጾታ *</label>
              <select id="birth-gender" name="gender" value={formData.gender} onChange={handleChange} required style={inputStyle}>
                <option value="">Select Gender / ጾታ ይምረጡ</option>
                <option value="Male">Male / ወንድ</option>
                <option value="Female">Female / ሴት</option>
              </select>
            </div>
            {renderField('dob', 'Date of Birth / የልደት ቀን', 'date', true, { max: new Date().toISOString().split('T')[0] })}
          </div>
        </section>
        <section className="birth-registration-section">
          <h2>Contact &amp; Location / አድራሻ እና ግንኙነት</h2>
          <div className="birth-registration-grid birth-registration-grid-three">
            {renderField('phone', 'Phone Number / ስልክ')}
            {renderField('email', 'Email Address / ኢሜይል', 'email', true, { placeholder: 'example@gmail.com' })}
            {renderField('pob', 'Place of Birth / የትውልድ ቦታ')}
            {renderField('country', 'Country / ሀገር')}
            {renderField('region', 'Region / ክልል')}
            {renderField('zone', 'Zone / ዞን')}
            {renderField('wereda', 'Wereda / ወረዳ')}
          </div>
        </section>
        <section className="birth-registration-section">
          <h2>Registration Details / የምዝገባ መረጃ</h2>
          <div className="birth-registration-grid">
            {renderField('registrationNumber', 'Birth Registration Number / የልደት ምዝገባ ቁጥር', 'text', false)}
            {renderField('registrationDate', 'Date of Registration / የተመዘገበበት ቀን', 'date', false, { max: new Date().toISOString().split('T')[0] })}
            {renderField('registrarName', 'Registrar Name / መዝጋቢው ስም', 'text', false)}
          </div>
        </section>
        <section className="birth-registration-section birth-registration-documents">
          <h2>Supporting Documents / አስፈላጊ ሰነዶች</h2>
          <div className="birth-registration-grid">
            <div className="birth-registration-field">
              <label htmlFor="birth-hospitalDoc">Birth Notification / Hospital Document (Optional / አማራጭ)</label>
              <input id="birth-hospitalDoc" type="file" name="hospitalDoc" accept="image/png,image/jpeg,.pdf" onChange={handleFileChange} style={fileStyle} />
              {errors.hospitalDoc && <small style={errorStyle}>{errors.hospitalDoc}</small>}
            </div>
            <div className="birth-registration-field">
              <label htmlFor="birth-childPhoto">Child Photo / የልጁ/ዋ ፎቶ *</label>
              <input id="birth-childPhoto" type="file" name="childPhoto" required accept="image/png,image/jpeg" onChange={handleFileChange} style={fileStyle} />
              {errors.childPhoto && <small style={errorStyle}>{errors.childPhoto}</small>}
            </div>
          </div>
          <p className="birth-registration-hint">JPG, PNG, or PDF files only. Maximum 5MB per document. Child photo maximum 2MB.</p>
        </section>
        <button className="birth-registration-submit" type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Birth Request'}
        </button>
      </form>
      </div>
    </main>
  );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
};

const fileStyle = {
  width: '100%',
  margin: '8px 0 0',
};

const errorStyle = { display: 'block', color: '#b91c1c', fontSize: '12px', marginBottom: '10px' };

export default BirthRegistration;
