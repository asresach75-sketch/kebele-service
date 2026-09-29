import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from './context/LanguageContext';

const initialFormData = {
  husbandName: '', husbandId: '', husbandDob: '', husbandPhone: '',
  email: '',
  wifeName: '', wifeId: '', wifeDob: '', wifePhone: '',
  marriageType: '', marriageDate: '', placeOfMarriage: '',
  witness1Name: '', witness1Phone: '', witness1Id: '',
  witness2Name: '', witness2Phone: '', witness2Id: '',
  witness3Name: '', witness3Phone: '', witness3Id: ''
};

const fieldClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
const labelClass = 'mb-1 block text-xs font-bold text-gray-700';
const namePattern = /^[a-zA-Z\u1200-\u137F\s]+$/;
const phonePattern = /^(09|07)\d{8}$/;

const MarriageRegistration = () => {
  const { lang, t } = useLanguage();
  const copy = lang === 'am' ? {
    title: t.marriageTitle, intro: t.marriageIntro, back: t.backVitalEvents,
    husbandSection: t.husbandInfo, wifeSection: t.wifeInfo,
    husbandName: 'የባል ሙሉ ስም', husbandId: 'የባል መታወቂያ ቁጥር', husbandDob: 'የባል የልደት ቀን', husbandPhone: 'የባል ስልክ', husbandPhoto: 'የባል ፎቶ',
    wifeName: 'የሚስት ሙሉ ስም', wifeId: 'የሚስት መታወቂያ ቁጥር', wifeDob: 'የሚስት የልደት ቀን', wifePhone: 'የሚስት ስልክ', wifePhoto: 'የሚስት ፎቶ',
    email: 'ኢሜይል አድራሻ', details: 'የጋብቻ ዝርዝር እና ምስክሮች', marriageType: 'የጋብቻ ዓይነት', select: '-- ይምረጡ --', civil: 'ሲቪል', religious: 'ሃይማኖታዊ', customary: 'ባህላዊ',
    marriageDate: 'የጋብቻ ቀን', place: 'የጋብቻ ቦታ / ቀበሌ', proof: 'የጋብቻ ውል ወይም ማረጋገጫ ሰነድ',
    witnessName: (number) => `${number}ኛ ምስክር ሙሉ ስም`, witnessPhone: 'የምስክር ስልክ', witnessId: 'የምስክር መታወቂያ ቁጥር', witnessDocument: (number) => `${number}ኛ ምስክር የመታወቂያ ኮፒ`,
    fullNamePlaceholder: 'ሙሉ ስም', idPlaceholder: 'መታወቂያ ቁጥር', phonePlaceholder: '09...', placePlaceholder: 'ቀበሌ / ወረዳ',
    required: 'ይህን መስክ መሙላት ያስፈልጋል።', invalidEmail: 'ትክክለኛ ኢሜይል ያስገቡ።', invalidName: 'ቢያንስ ሁለት ቃላት ያሉት ትክክለኛ ስም ያስገቡ።', invalidPhone: 'በ09 ወይም 07 የሚጀምር ትክክለኛ ስልክ ያስገቡ።', invalidDate: 'ቀኑ ወደፊት መሆን አይችልም።', requiredFile: 'ይህ ሰነድ ያስፈልጋል።', invalidFile: 'ከ5 MB ያነሰ JPG፣ PNG ወይም PDF ፋይል ይጠቀሙ።',
    fixErrors: 'እባክዎ በቀይ የተመለከቱ መስኮችን ያስተካክሉ።', success: 'የጋብቻ ምዝገባ ጥያቄዎ ተልኳል።', backendUnavailable: 'የbackend አገልግሎት አልተገኘም።', failed: 'የጋብቻ ምዝገባ አልተሳካም።', loading: 'በመላክ ላይ...', submit: 'የጋብቻ ምዝገባ ጥያቄ ላክ'
  } : {
    title: 'Marriage Registration', intro: 'Complete the form below to submit your marriage registration request.', back: 'Back to Vital Events',
    husbandSection: "Husband's Information", wifeSection: "Wife's Information",
    husbandName: "Husband's Full Name", husbandId: "Husband's ID Number", husbandDob: "Husband's Date of Birth", husbandPhone: "Husband's Phone", husbandPhoto: "Husband's Photo",
    wifeName: "Wife's Full Name", wifeId: "Wife's ID Number", wifeDob: "Wife's Date of Birth", wifePhone: "Wife's Phone", wifePhoto: "Wife's Photo",
    email: 'Email Address', details: 'Marriage Details & Witnesses', marriageType: 'Marriage Type', select: '-- Select --', civil: 'Civil', religious: 'Religious', customary: 'Customary',
    marriageDate: 'Marriage Date', place: 'Place of Marriage / Kebele', proof: 'Marriage Agreement or Certificate Proof',
    witnessName: (number) => `${number}${number === 1 ? 'st' : number === 2 ? 'nd' : 'rd'} Witness Full Name`, witnessPhone: 'Witness Phone', witnessId: 'Witness ID Number', witnessDocument: (number) => `${number}${number === 1 ? 'st' : number === 2 ? 'nd' : 'rd'} Witness ID Copy`,
    fullNamePlaceholder: 'Full name', idPlaceholder: 'ID number', phonePlaceholder: '09...', placePlaceholder: 'Kebele / Woreda',
    required: 'This field is required.', invalidEmail: 'Enter a valid email address.', invalidName: 'Enter a valid name with at least two words.', invalidPhone: 'Use a valid Ethiopian number starting with 09 or 07.', invalidDate: 'Date cannot be in the future.', requiredFile: 'This document is required.', invalidFile: 'Use a JPG, PNG, or PDF file smaller than 5 MB.',
    fixErrors: 'Please correct the highlighted or invalid fields before submitting.', success: 'Marriage registration submitted successfully.', backendUnavailable: 'Backend server is unavailable. Please start the backend on port 5000.', failed: 'Marriage registration failed.', loading: 'Submitting marriage request...', submit: 'Submit Marriage Request'
  };
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [files, setFiles] = useState({ husbandPhoto: null, wifePhoto: null, marriageCertPhoto: null, witness1IdDocument: null, witness2IdDocument: null, witness3IdDocument: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [submissionSucceeded, setSubmissionSucceeded] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
    setErrors((current) => ({ ...current, [event.target.name]: '' }));
  };

  const handleFileChange = (event) => {
    setFiles((current) => ({ ...current, [event.target.name]: event.target.files?.[0] || null }));
    setErrors((current) => ({ ...current, [event.target.name]: '' }));
  };

  const inputClass = (field) => `${fieldClass} ${errors[field] ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-100' : ''}`;
  const renderError = (field) => errors[field] && <p className="mt-1 text-xs font-semibold text-red-600">{errors[field]}</p>;

  const validate = () => {
    const nextErrors = {};
    ['husbandName', 'husbandId', 'husbandDob', 'husbandPhone', 'email', 'wifeName', 'wifeId', 'wifeDob', 'wifePhone', 'marriageType', 'marriageDate', 'placeOfMarriage', 'witness1Name', 'witness1Phone', 'witness1Id', 'witness2Name', 'witness2Phone', 'witness2Id', 'witness3Name', 'witness3Phone', 'witness3Id'].forEach((field) => {
      if (!formData[field].trim()) nextErrors[field] = copy.required;
    });
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) nextErrors.email = copy.invalidEmail;
    ['husbandName', 'wifeName', 'witness1Name', 'witness2Name', 'witness3Name'].forEach((field) => {
      const value = formData[field].trim();
      if (value && (value.split(/\s+/).length < 2 || !namePattern.test(value))) nextErrors[field] = copy.invalidName;
    });
    ['husbandPhone', 'wifePhone', 'witness1Phone', 'witness2Phone', 'witness3Phone'].forEach((field) => {
      if (formData[field].trim() && !phonePattern.test(formData[field].trim())) nextErrors[field] = copy.invalidPhone;
    });
    ['husbandDob', 'wifeDob', 'marriageDate'].forEach((field) => {
      if (formData[field] && new Date(formData[field]) > new Date()) nextErrors[field] = copy.invalidDate;
    });
    Object.entries(files).forEach(([field, file]) => {
      if (!file) nextErrors[field] = copy.requiredFile;
      else if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) || file.size > 5 * 1024 * 1024) nextErrors[field] = copy.invalidFile;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage(copy.fixErrors);
      document.querySelector(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
    }
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading || !validate()) return;
    setLoading(true);
    setMessage('');
    setSubmissionSucceeded(false);
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    Object.entries(files).forEach(([key, file]) => { if (file) data.append(key, file); });

    try {
      const response = await axios.post('/api/vital/marriage-registration', data, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setSubmissionSucceeded(true);
      setMessage(`${copy.success} ${response.data.applicationId}`);
      setTimeout(() => navigate(`/marriage-certificate/${encodeURIComponent(response.data.applicationId)}`), 1800);
    } catch (error) {
      const serverMessage = error.response?.data?.message;
      const networkMessage = error.request && !error.response
        ? copy.backendUnavailable
        : copy.failed;
      setMessage(`Error: ${serverMessage || networkMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const renderWitness = (number) => (
    <div className="grid grid-cols-1 gap-3 border-t border-gray-200 pt-4 md:grid-cols-2 xl:grid-cols-4">
      <label><span className={labelClass}>{copy.witnessName(number)} *</span><input className={inputClass(`witness${number}Name`)} name={`witness${number}Name`} value={formData[`witness${number}Name`]} onChange={handleChange} placeholder={copy.fullNamePlaceholder} />{renderError(`witness${number}Name`)}</label>
      <label><span className={labelClass}>{copy.witnessPhone} *</span><input className={inputClass(`witness${number}Phone`)} type="tel" name={`witness${number}Phone`} value={formData[`witness${number}Phone`]} onChange={handleChange} placeholder={copy.phonePlaceholder} />{renderError(`witness${number}Phone`)}</label>
      <label><span className={labelClass}>{copy.witnessId} *</span><input className={inputClass(`witness${number}Id`)} name={`witness${number}Id`} value={formData[`witness${number}Id`]} onChange={handleChange} placeholder={copy.idPlaceholder} />{renderError(`witness${number}Id`)}</label>
      <label><span className={labelClass}>{copy.witnessDocument(number)} *</span><input className={inputClass(`witness${number}IdDocument`)} type="file" name={`witness${number}IdDocument`} accept="image/jpeg,image/png,application/pdf" onChange={handleFileChange} />{renderError(`witness${number}IdDocument`)}</label>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 font-sans text-gray-800">
      <div className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-5 shadow-md sm:p-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">{copy.title}</h1>
            <p className="mt-1 text-xs text-gray-500">{copy.intro}</p>
          </div>
          <button type="button" onClick={() => navigate('/vital-events')} className="rounded-lg bg-gray-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-gray-800">{copy.back}</button>
        </div>
        {message && <div className={`mb-6 rounded-lg p-3 text-center text-sm font-bold ${submissionSucceeded ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}
        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <h2 className="mb-4 font-bold text-blue-900">{copy.husbandSection}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label><span className={labelClass}>{copy.husbandName} *</span><input className={inputClass('husbandName')} name="husbandName" value={formData.husbandName} onChange={handleChange} />{renderError('husbandName')}</label>
              <label><span className={labelClass}>{copy.husbandId} *</span><input className={inputClass('husbandId')} name="husbandId" value={formData.husbandId} onChange={handleChange} placeholder={copy.idPlaceholder} />{renderError('husbandId')}</label>
              <label><span className={labelClass}>{copy.husbandDob} *</span><input className={inputClass('husbandDob')} type="date" name="husbandDob" max={new Date().toISOString().split('T')[0]} value={formData.husbandDob} onChange={handleChange} />{renderError('husbandDob')}</label>
              <label><span className={labelClass}>{copy.husbandPhone} *</span><input className={inputClass('husbandPhone')} type="tel" name="husbandPhone" value={formData.husbandPhone} onChange={handleChange} placeholder={copy.phonePlaceholder} />{renderError('husbandPhone')}</label>
              <label><span className={labelClass}>{copy.email} *</span><input className={inputClass('email')} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@gmail.com" />{renderError('email')}</label>
              <label className="md:col-span-2"><span className={labelClass}>{copy.husbandPhoto} *</span><input className={`w-full rounded-lg border bg-white p-2 text-xs ${errors.husbandPhoto ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} type="file" name="husbandPhoto" accept="image/jpeg,image/png" onChange={handleFileChange} />{renderError('husbandPhoto')}</label>
            </div>
          </section>
          <section className="rounded-xl border border-pink-100 bg-pink-50/40 p-4">
            <h2 className="mb-4 font-bold text-blue-900">{copy.wifeSection}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label><span className={labelClass}>{copy.wifeName} *</span><input className={inputClass('wifeName')} name="wifeName" value={formData.wifeName} onChange={handleChange} />{renderError('wifeName')}</label>
              <label><span className={labelClass}>{copy.wifeId} *</span><input className={inputClass('wifeId')} name="wifeId" value={formData.wifeId} onChange={handleChange} placeholder={copy.idPlaceholder} />{renderError('wifeId')}</label>
              <label><span className={labelClass}>{copy.wifeDob} *</span><input className={inputClass('wifeDob')} type="date" name="wifeDob" max={new Date().toISOString().split('T')[0]} value={formData.wifeDob} onChange={handleChange} />{renderError('wifeDob')}</label>
              <label><span className={labelClass}>{copy.wifePhone} *</span><input className={inputClass('wifePhone')} type="tel" name="wifePhone" value={formData.wifePhone} onChange={handleChange} placeholder={copy.phonePlaceholder} />{renderError('wifePhone')}</label>
              <label className="md:col-span-2"><span className={labelClass}>{copy.wifePhoto} *</span><input className={`w-full rounded-lg border bg-white p-2 text-xs ${errors.wifePhoto ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} type="file" name="wifePhoto" accept="image/jpeg,image/png" onChange={handleFileChange} />{renderError('wifePhoto')}</label>
            </div>
          </section>
          <section className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h2 className="font-bold text-blue-900">{copy.details}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label><span className={labelClass}>{copy.marriageType} *</span><select className={inputClass('marriageType')} name="marriageType" value={formData.marriageType} onChange={handleChange}><option value="">{copy.select}</option><option value="Civil">{copy.civil}</option><option value="Religious">{copy.religious}</option><option value="Customary">{copy.customary}</option></select>{renderError('marriageType')}</label>
              <label><span className={labelClass}>{copy.marriageDate} *</span><input className={inputClass('marriageDate')} type="date" name="marriageDate" max={new Date().toISOString().split('T')[0]} value={formData.marriageDate} onChange={handleChange} />{renderError('marriageDate')}</label>
              <label><span className={labelClass}>{copy.place} *</span><input className={inputClass('placeOfMarriage')} name="placeOfMarriage" value={formData.placeOfMarriage} onChange={handleChange} placeholder={copy.placePlaceholder} />{renderError('placeOfMarriage')}</label>
            </div>
            <label className="block"><span className={labelClass}>{copy.proof} *</span><input className={inputClass('marriageCertPhoto')} type="file" name="marriageCertPhoto" accept="image/jpeg,image/png,application/pdf" onChange={handleFileChange} />{renderError('marriageCertPhoto')}</label>
            {renderWitness(1)}{renderWitness(2)}{renderWitness(3)}
          </section>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-700 py-3 text-sm font-bold text-white shadow transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">{loading ? copy.loading : copy.submit}</button>
        </form>
      </div>
    </div>
  );
};

export default MarriageRegistration;
