import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DivorceRegistration.css';

function DivorceRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    applicantName: '',
    spouseName: '',
    divorceDate: '',
    placeOfDivorce: '',
    phoneNumber: '',
    spouseIdNumber: '', marriageRegistrationNumber: '', region: '', zone: '', woreda: '', kebele: '',
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
    const divorceDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(formData.divorceDate);
    const divorceDate = divorceDateMatch
      ? new Date(Date.UTC(Number(divorceDateMatch[1]), Number(divorceDateMatch[2]) - 1, Number(divorceDateMatch[3])))
      : null;
    const today = new Date();
    const todayDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    if (!divorceDate || divorceDate.toISOString().slice(0, 10) !== formData.divorceDate || divorceDate > todayDate) {
      nextErrors.divorceDate = 'Enter a valid divorce date that is not in the future.';
    }
    ['placeOfDivorce', 'region', 'zone', 'woreda', 'kebele', 'spouseIdNumber'].forEach((field) => { if (!formData[field].trim()) nextErrors[field] = 'This field is required.'; });
    const divorceDocument = formData.divorceDocument;
    if (!divorceDocument) nextErrors.divorceDocument = 'A court divorce decision document is required.';
    else if (!['application/pdf', 'image/jpeg', 'image/png'].includes(divorceDocument.type) || divorceDocument.size > 5 * 1024 * 1024) {
      nextErrors.divorceDocument = 'Use a JPG, PNG, or PDF smaller than 5 MB.';
    }
    const marriageCertificate = formData.marriageCertificate;
    if (marriageCertificate && (!['application/pdf', 'image/jpeg', 'image/png'].includes(marriageCertificate.type) || marriageCertificate.size > 5 * 1024 * 1024)) {
      nextErrors.marriageCertificate = 'Use a JPG, PNG, or PDF smaller than 5 MB.';
    }
    if (!marriageCertificate && !formData.marriageRegistrationNumber.trim()) {
      nextErrors.marriageCertificate = 'Upload the certificate or enter the marriage registration number.';
      nextErrors.marriageRegistrationNumber = 'Provide a certificate or registration number.';
    }
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

      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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

  const renderField = (name, label, type = 'text', required = true, props = {}) => (
    <label className="divorce-field" key={name}>
      {label}{required ? ' *' : ''}
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        required={required}
        max={type === 'date' ? new Date().toISOString().split('T')[0] : undefined}
        {...props}
      />
      {errors[name] && <small className="divorce-field-error">{errors[name]}</small>}
    </label>
  );

  return (
    <main className="divorce-page">
      <section className="divorce-card">
        <header className="divorce-header">
          <div>
            <span className="divorce-eyebrow">DIVORCE REGISTRATION</span>
            <h1>Divorce Registration / የፍቺ ምዝገባ</h1>
            <p>Complete the form below to submit your divorce registration request.</p>
          </div>
          <Link to="/vital-events" className="divorce-back-link">← Back to Vital Events</Link>
        </header>
        {message && <div className="divorce-message" role="status">{message}</div>}
        <form onSubmit={handleSubmit} className="divorce-form">
          <section className="divorce-section">
            <h2>Divorce Information / የፍቺ መረጃ</h2>
            <div className="divorce-grid">
              {renderField('applicantName', 'Applicant Name / የአመልካች ስም')}
              {renderField('spouseName', 'Spouse Name / የትዳር ጓደኛ ስም')}
              {renderField('divorceDate', 'Divorce Date / የፍቺ ቀን', 'date')}
              {renderField('placeOfDivorce', 'Place of Divorce / የፍቺ ቦታ')}
              {renderField('phoneNumber', 'Phone Number / ስልክ ቁጥር', 'tel', true, { placeholder: '0911223344' })}
              {renderField('spouseIdNumber', 'Spouse ID Number / የትዳር ጓደኛ መታወቂያ ቁጥር')}
              {renderField('marriageRegistrationNumber', 'Marriage Registration Number (if available) / የጋብቻ ምዝገባ ቁጥር (ካለ)', 'text', false)}
            </div>
          </section>
          <section className="divorce-section">
            <h2>Address Information / አድራሻ</h2>
            <div className="divorce-grid">
              {renderField('region', 'Region / ክልል')}
              {renderField('zone', 'Zone / ዞን')}
              {renderField('woreda', 'Woreda / ወረዳ')}
              {renderField('kebele', 'Kebele / ቀበሌ')}
            </div>
          </section>
          <section className="divorce-section">
            <h2>Witnesses Information / የምስክሮች መረጃ</h2>
            <div className="divorce-grid">
              {renderField('witness1Name', 'Witness 1 Name / የምስክር 1 ስም', 'text', false)}
              {renderField('witness1Phone', 'Witness 1 Phone / የምስክር 1 ስልክ', 'tel', false)}
              {renderField('witness2Name', 'Witness 2 Name / የምስክር 2 ስም', 'text', false)}
              {renderField('witness2Phone', 'Witness 2 Phone / የምስክር 2 ስልክ', 'tel', false)}
            </div>
          </section>
          <section className="divorce-section divorce-documents">
            <h2>Supporting Documents / አስፈላጊ ሰነዶች</h2>
            <p>JPG, PNG, or PDF files only. Maximum 5MB per file. An officer must review the submitted court decision.</p>
            <div className="divorce-grid">
              <label className="divorce-field">
                Divorce Document / የፍቺ ሰነድ *
                <input type="file" name="divorceDocument" accept="image/png,image/jpeg,.pdf" onChange={handleFileChange} required />
                {errors.divorceDocument && <small className="divorce-field-error">{errors.divorceDocument}</small>}
              </label>
              <label className="divorce-field">
                Marriage Certificate / የጋብቻ ምስክር ወረቀት *
                <input type="file" name="marriageCertificate" accept="image/png,image/jpeg,.pdf" onChange={handleFileChange} />
                {errors.marriageCertificate && <small className="divorce-field-error">{errors.marriageCertificate}</small>}
              </label>
            </div>
          </section>
          <button type="submit" disabled={submitting} className="divorce-submit">
            {submitting ? 'Submitting...' : 'Submit Divorce Request / የፍቺ ማመልከቻ ላክ'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default DivorceRegistration;
