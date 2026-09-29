import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ApplicationForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    phoneNumber: '',
    gender: 'Male',
    dateOfBirth: '',
    placeOfBirth: '',
    placeOfBirthRegion: '',
    placeOfBirthZone: '',
    placeOfBirthWoreda: '',
    placeOfBirthKebele: '',
    nationality: 'Ethiopian',
    occupation: '',
    previousResidenceRegion: '',
    previousResidenceZone: '',
    previousResidenceWoreda: '',
    previousResidenceKebele: '',
    previousResidenceAddress: '',
    email: '',
    region: '',
    zone: '',
    woreda: '',
    kebele: '',
    residenceAddress: '',
    details: '',
    serviceType: 'NEW_ID_CARD',
    passportPhoto: null,
    birthCertificate: null,
    residenceProof: null,
    webcamPhoto: null
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > MAX_FILE_SIZE) {
        setMessage('Selected file is too large. Please upload files smaller than 20MB.');
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.nationalId || !formData.phoneNumber) {
      setMessage('Please fill Full Name, National ID, and Phone Number before submitting.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        payload.append(key, value);
      });

      const response = await axios.post('/api/services/submit-application', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const applicationId = response.data.applicationId;
      setMessage('ማመልከቻዎ በተሳካ ሁኔታ ተልኳል! Your application ID is ' + applicationId);
      navigate(`/track?query=${encodeURIComponent(applicationId)}`);
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      setMessage('Submission failed: ' + serverMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      fullName: '',
      nationalId: '',
      phoneNumber: '',
      gender: 'Male',
      dateOfBirth: '',
      placeOfBirth: '',
      nationality: 'Ethiopian',
      occupation: '',
      email: '',
      region: '',
      zone: '',
      woreda: '',
      kebele: '',
      residenceAddress: '',
      details: '',
      serviceType: 'NEW_ID_CARD',
      passportPhoto: null,
      birthCertificate: null,
      residenceProof: null,
      webcamPhoto: null
    });
    setMessage('');
  };

  return (
    <div className="kebele-form-wrapper">
      <div className="form-header-card">
        <h2>New ID Application / አዲስ መታወቂያ ማመልከቻ</h2>
        <p>
          After submitting, use the phone number or application ID on the Track page to check status, payment amount in birr, and download details when approved.
        </p>
      </div>

      {message && <div className="form-alert">{message}</div>}

      <form onSubmit={handleSubmit} className="kebele-main-form">
        <fieldset className="form-section">
          <legend>Personal Information / የግል መረጃ</legend>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name / ሙሉ ስም *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="ሙሉ ስም ያስገቡ"
                required
              />
            </div>

            <div className="form-group">
              <label>National ID / Residence Number / ብሔራዊ መታወቂያ / መኖሪያ ቁጥር</label>
              <input
                type="text"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                placeholder="ቁጥር ያስገቡ"
              />
            </div>

            <div className="form-group">
              <label>Phone Number / ስልክ ቁጥር *</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="09xxxxxxxx"
                required
              />
            </div>

            <div className="form-group">
              <label>Gender / ጾታ</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option value="Male">Male / ወንድ</option>
                <option value="Female">Female / ሴት</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date of Birth / የትውልድ ቀን</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Place of Birth / የትውልድ ቦታ</label>
              <input
                type="text"
                name="placeOfBirth"
                value={formData.placeOfBirth}
                onChange={handleChange}
                placeholder="የተወለዱበት ቦታ"
              />
            </div>

            <div className="form-group">
              <label>Birth Region / የትውልድ ክልል</label>
              <input type="text" name="placeOfBirthRegion" value={formData.placeOfBirthRegion} onChange={handleChange} placeholder="Region" />
            </div>

            <div className="form-group">
              <label>Birth Zone / የትውልድ ዞን</label>
              <input type="text" name="placeOfBirthZone" value={formData.placeOfBirthZone} onChange={handleChange} placeholder="Zone" />
            </div>

            <div className="form-group">
              <label>Birth Woreda / የትውልድ ወረዳ</label>
              <input type="text" name="placeOfBirthWoreda" value={formData.placeOfBirthWoreda} onChange={handleChange} placeholder="Woreda" />
            </div>

            <div className="form-group">
              <label>Birth Kebele / የትውልድ ቀበሌ</label>
              <input type="text" name="placeOfBirthKebele" value={formData.placeOfBirthKebele} onChange={handleChange} placeholder="Kebele" />
            </div>

            <div className="form-group">
              <label>Nationality / ዜግነት</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                placeholder="Ethiopian / ኢትዮጵያዊ"
              />
            </div>

            <div className="form-group">
              <label>Occupation / የስራ ሁኔታ</label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleChange}
                placeholder="ሙያ / ስራ"
              />
            </div>

            <div className="form-group">
              <label>Previous Residence Region / የቀድሞ መኖሪያ ክልል</label>
              <input type="text" name="previousResidenceRegion" value={formData.previousResidenceRegion} onChange={handleChange} placeholder="Previous region" />
            </div>

            <div className="form-group">
              <label>Previous Residence Zone / የቀድሞ መኖሪያ ዞን</label>
              <input type="text" name="previousResidenceZone" value={formData.previousResidenceZone} onChange={handleChange} placeholder="Previous zone" />
            </div>

            <div className="form-group">
              <label>Previous Residence Woreda / የቀድሞ መኖሪያ ወረዳ</label>
              <input type="text" name="previousResidenceWoreda" value={formData.previousResidenceWoreda} onChange={handleChange} placeholder="Previous woreda" />
            </div>

            <div className="form-group">
              <label>Previous Residence Kebele / የቀድሞ መኖሪያ ቀበሌ</label>
              <input type="text" name="previousResidenceKebele" value={formData.previousResidenceKebele} onChange={handleChange} placeholder="Previous kebele" />
            </div>

            <div className="form-group full-width">
              <label>Previous Residence Address / የቀድሞ መኖሪያ አድራሻ</label>
              <input type="text" name="previousResidenceAddress" value={formData.previousResidenceAddress} onChange={handleChange} placeholder="House number / street / landmark" />
            </div>

            <div className="form-group full-width">
              <label>Email Address / ኢሜይል አድራሻ (Optional / አማራጭ)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@gmail.com"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Address Details / የአድራሻ መረጃ</legend>
          <div className="form-grid">
            <div className="form-group">
              <label>Region / ክልል</label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleChange}
                placeholder="ክልል"
              />
            </div>

            <div className="form-group">
              <label>Zone / ዞን</label>
              <input
                type="text"
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                placeholder="ዞን"
              />
            </div>

            <div className="form-group">
              <label>Woreda / ወረዳ</label>
              <input
                type="text"
                name="woreda"
                value={formData.woreda}
                onChange={handleChange}
                placeholder="ወረዳ"
              />
            </div>

            <div className="form-group">
              <label>Kebele / ቀበሌ</label>
              <input
                type="text"
                name="kebele"
                value={formData.kebele}
                onChange={handleChange}
                placeholder="ቀበሌ"
              />
            </div>

            <div className="form-group full-width">
              <label>Residential Address / ዝርዝር የመኖሪያ አድራሻ</label>
              <input
                type="text"
                name="residenceAddress"
                value={formData.residenceAddress}
                onChange={handleChange}
                placeholder="የቤት ቁጥር ወይም ልዩ ቦታ"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Documents & Photos / ሰነዶች እና ፎቶዎች</legend>
          <div className="form-grid">
            <div className="form-group file-box">
              <label>Passport Photo / ፓስፖርት ፎቶ</label>
              <input type="file" name="passportPhoto" accept="image/*" onChange={handleFileChange} />
            </div>

            <div className="form-group file-box">
              <label>Birth Certificate / የልደት ማረጋገጫ</label>
              <input type="file" name="birthCertificate" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>

            <div className="form-group file-box">
              <label>Residence Proof / የመኖሪያ ማረጋገጫ</label>
              <input type="file" name="residenceProof" accept="image/*,application/pdf" onChange={handleFileChange} />
            </div>

            <div className="form-group file-box">
              <label>Webcam Photo / የካሜራ ፎቶ</label>
              <input type="file" name="webcamPhoto" accept="image/*" capture="environment" onChange={handleFileChange} />
            </div>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>Additional Details / ተጨማሪ መረጃዎች</legend>
          <div className="form-group full-width">
            <textarea
              name="details"
              rows="3"
              value={formData.details}
              onChange={handleChange}
              placeholder="ተጨማሪ ማብራሪያ ካለ እዚህ ይጻፉ..."
            />
          </div>
        </fieldset>

        <div className="form-actions">
          <button type="button" className="btn-clear" onClick={handleClear}>
            Clear Form / ባዶ አድርግ
          </button>
          <button type="submit" className="btn-submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Application / ማመልከቻ ላክ'}
          </button>
        </div>
      </form>
    </div>
  );
}
