import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DeathRegistration.css';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

function DeathRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ reporterName: '', deceasedName: '', dateOfDeath: '', placeOfDeath: '', phone: '', phoneNumber: '', region: '', zone: '', woreda: '', kebele: '', applicantPhoto: null, deathCertificate: null });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((current) => ({ ...current, [e.target.name]: e.target.value }));
    setErrors((current) => ({ ...current, [e.target.name]: '' }));
  };

  const setSelectedFile = (name, file) => {
    if (!file) return;
    const acceptedTypes = name === 'applicantPhoto'
      ? ['image/jpeg', 'image/png']
      : ['application/pdf', 'image/jpeg', 'image/png'];
    if (!acceptedTypes.includes(file.type) || file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
      const error = name === 'applicantPhoto'
        ? 'Choose a non-empty JPG or PNG photo no larger than 5 MB.'
        : 'Choose a non-empty JPG, PNG, or PDF certificate no larger than 5 MB.';
      setErrors((current) => ({ ...current, [name]: error }));
      setFormData((current) => ({ ...current, [name]: null }));
      return;
    }
    setFormData((current) => ({ ...current, [name]: file }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setMessage('');
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.name, e.target.files?.[0]);
  };

  const handleDrop = (event, name) => {
    event.preventDefault();
    setSelectedFile(name, event.dataTransfer.files?.[0]);
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
    if (formData.deathCertificate && (!['application/pdf', 'image/jpeg', 'image/png'].includes(formData.deathCertificate.type) || formData.deathCertificate.size <= 0 || formData.deathCertificate.size > MAX_UPLOAD_SIZE)) nextErrors.deathCertificate = 'Certificate must be PDF/JPG/PNG and no larger than 5 MB.';
    if (formData.applicantPhoto && (!['image/jpeg', 'image/png'].includes(formData.applicantPhoto.type) || formData.applicantPhoto.size <= 0 || formData.applicantPhoto.size > MAX_UPLOAD_SIZE)) nextErrors.applicantPhoto = 'Photo must be JPG/PNG and no larger than 5 MB.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessageType('error');
      setMessage('Please correct the highlighted fields before submitting.');
      document.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const payload = new FormData();
      Object.entries({ ...formData, serviceType: 'DEATH_REGISTRATION' }).forEach(([key, value]) => { if (value !== null && key !== 'phoneNumber' && key !== 'deathCertificate' && key !== 'applicantPhoto') payload.append(key, value); });
      payload.set('phone', formData.phone);
      if (formData.applicantPhoto) payload.append('applicantPhoto', formData.applicantPhoto);
      if (formData.deathCertificate) payload.append('deathCertificate', formData.deathCertificate);
      const res = await axios.post('/api/services/submit-application', payload, { headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` } });
      setMessageType('success');
      setMessage('Death registration request submitted successfully! Redirecting to track...');
      const lookupValue = res.data.applicationId;
      navigate(`/track?query=${encodeURIComponent(lookupValue)}`);
    } catch (err) {
      setMessageType('error');
      setMessage('Unable to submit request: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="death-registration-page">
      <section className="death-registration-card">
        <header className="death-registration-header">
          <div>
            <span className="death-registration-eyebrow">VITAL EVENTS</span>
            <h1>Death Registration / የሞት ምዝገባ</h1>
            <p>Complete the form below to submit your death registration request.</p>
          </div>
          <Link to="/vital-events" className="death-registration-back">← Back to Vital Events</Link>
        </header>
        {message && (
          <div
            className={`death-registration-message is-${messageType}`}
            role={messageType === 'error' ? 'alert' : 'status'}
          >
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} noValidate className="death-registration-form">
          <section className="death-registration-section">
            <h2>Death Information / የሞት መረጃ</h2>
            <div className="death-registration-grid">
              {renderField('reporterName', 'Reporter Name / የመግለጫ ስም')}
              {renderField('deceasedName', 'Deceased Person Name / የሟች ስም')}
              {renderField('dateOfDeath', 'Date of Death / የሞት ቀን', 'date', { max: new Date().toISOString().split('T')[0] })}
              {renderField('placeOfDeath', 'Place of Death / የሞት ቦታ')}
              {renderField('phone', 'Phone Number / ስልክ ቁጥር', 'tel', { placeholder: '0911223344', inputMode: 'numeric', maxLength: 10 })}
            </div>
          </section>
          <section className="death-registration-section">
            <h2>Address Information / የአድራሻ መረጃ</h2>
            <div className="death-registration-grid">
              {renderField('region', 'Region / ክልል')}
              {renderField('zone', 'Zone / ዞን')}
              {renderField('woreda', 'Woreda / ወረዳ')}
              {renderField('kebele', 'Kebele / ቀበሌ')}
            </div>
          </section>
          <section className="death-registration-section">
            <h2>Supporting Documents / አስፈላጊ ሰነዶች</h2>
            <p className="death-registration-hint">JPG, PNG, or PDF files only. Maximum 5MB per file.</p>
            <div className="death-registration-grid">
              {renderDropzone(
                'applicantPhoto',
                'Applicant/Deceased Photo / የአመልካች ወይም የሟች ፎቶ',
                'Optional · JPG or PNG · Max 5MB',
                'image/png,image/jpeg'
              )}
              {renderDropzone(
                'deathCertificate',
                'Medical / Hospital Death Certificate / የሕክምና ወይም የሆስፒታል ሰነድ',
                'Optional · JPG, PNG, or PDF · Max 5MB',
                'image/png,image/jpeg,.pdf'
              )}
            </div>
          </section>
          <div className="death-registration-actions">
            <button type="button" className="death-registration-clear" onClick={clearForm}>Clear Form</button>
            <button type="submit" disabled={submitting} className="death-registration-submit">
              {submitting ? 'Submitting...' : 'Submit Death Request'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );

  function renderField(name, label, type = 'text', props = {}) {
    const errorId = `death-registration-error-${name}`;
    return (
      <div className="death-registration-field" key={name}>
        <label htmlFor={`death-registration-${name}`}>{label} *</label>
        <input
          id={`death-registration-${name}`}
          name={name}
          type={type}
          value={formData[name]}
          onChange={handleChange}
          required
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? errorId : undefined}
          className={errors[name] ? 'has-error' : ''}
          {...props}
        />
        {errors[name] && <small id={errorId} className="death-registration-error">{errors[name]}</small>}
      </div>
    );
  }

  function renderDropzone(name, label, hint, accept) {
    const file = formData[name];
    const errorId = `death-registration-error-${name}`;
    return (
      <div className="death-registration-field" key={name}>
        <span className="death-registration-label">{label} <span>(Optional / አማራጭ)</span></span>
        <label
          className={`death-registration-dropzone${errors[name] ? ' has-error' : ''}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event, name)}
        >
          <input
            type="file"
            name={name}
            accept={accept}
            onChange={handleFileChange}
            aria-invalid={Boolean(errors[name])}
            aria-describedby={errors[name] ? errorId : undefined}
          />
          <span className="death-registration-upload-icon" aria-hidden="true">↑</span>
          <span className="death-registration-drop-copy">
            <strong>{file ? file.name : 'Drop a file here or browse'}</strong>
            <small>{file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : hint}</small>
          </span>
        </label>
        {file && (
          <button type="button" className="death-registration-remove-file" onClick={() => removeFile(name)}>
            Remove file
          </button>
        )}
        {errors[name] && <small id={errorId} className="death-registration-error">{errors[name]}</small>}
      </div>
    );
  }

  function clearForm() {
    setFormData({
      reporterName: '', deceasedName: '', dateOfDeath: '', placeOfDeath: '',
      phone: '', phoneNumber: '', region: '', zone: '', woreda: '', kebele: '',
      applicantPhoto: null, deathCertificate: null
    });
    setErrors({});
    setMessage('');
    setMessageType('success');
    document.querySelectorAll('.death-registration-dropzone input[type="file"]').forEach((input) => {
      input.value = '';
    });
  }

  function removeFile(name) {
    setFormData((current) => ({ ...current, [name]: null }));
    setErrors((current) => ({ ...current, [name]: '' }));
    const input = document.querySelector(`[name="${name}"]`);
    if (input) input.value = '';
  }
}

export default DeathRegistration;
