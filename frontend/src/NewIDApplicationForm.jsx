import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './NewIDApplicationForm.css';

const initialForm = {
  firstName: '', middleName: '', lastName: '', gender: '', dateOfBirth: '', age: '', ageCategory: '', placeOfBirth: '', placeOfBirthRegion: '', placeOfBirthZone: '', placeOfBirthWoreda: '', placeOfBirthKebele: '', nationality: 'Ethiopian', occupation: '', previousResidenceRegion: '', previousResidenceZone: '', previousResidenceWoreda: '', previousResidenceKebele: '', previousResidenceAddress: '', phoneNumber: '', email: '',
  emergencyContactName: '', emergencyPhone: '', region: '', zone: '', woreda: '', kebele: '', residenceAddress: '', dateOfIssuance: new Date().toISOString().slice(0, 10), idExpiryDate: '', issuedBy: '', details: ''
};
const initialFiles = { passportPhoto: null, birthCertificate: null, emergencyBirthCertificate: null, residenceProof: null };
const getAge = (value) => { if (!value) return null; const birth = new Date(`${value}T00:00:00`); const today = new Date(); let age = today.getFullYear() - birth.getFullYear(); if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1; return age >= 0 && age <= 120 ? age : null; };

function NewIDApplicationForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState(initialFiles);
  const [webcamPhoto, setWebcamPhoto] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const serviceType = new URLSearchParams(location.search).get('type') === 'ID_RENEWAL' || location.pathname === '/renew-id' ? 'ID_RENEWAL' : 'NEW_ID_CARD';

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraOpen]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  };

  const change = (event) => { const { name, value } = event.target; const age = name === 'dateOfBirth' ? getAge(value) : null; setForm((current) => ({ ...current, [name]: value, ...(name === 'dateOfBirth' ? { age: age === null ? '' : age, ageCategory: age === null ? '' : age >= 18 ? 'Adult (≥18)' : 'Minor (<18)' } : {}) })); };
  const fileChange = (event) => { const file = event.target.files?.[0]; if (file && file.size > 20 * 1024 * 1024) { setMessage('Each file must be smaller than 20MB.'); return; } setFiles((current) => ({ ...current, [event.target.name]: file })); };
  const openCamera = async () => {
    setMessage('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera unavailable');
      }

      if (streamRef.current) {
        stopCamera();
      }

      const cameraOptions = [
        { video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: true, audio: false }
      ];

      let stream = null;
      for (const mediaOptions of cameraOptions) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(mediaOptions);
          break;
        } catch (error) {
          console.warn('Camera option failed:', mediaOptions, error);
        }
      }

      if (!stream) {
        throw new Error('No camera stream could be created');
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;
      }
      setWebcamPhoto(null);
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (error) {
      console.error('Camera access failed:', error);
      setMessage('Camera access was not allowed. Please allow camera permission or upload a passport photo instead.');
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
      setMessage('Please wait for the camera preview to load.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      setMessage('Camera capture is not supported in this browser. Please upload a photo instead.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let brightPixels = 0;

    for (let index = 0; index < imageData.length; index += 16) {
      const red = imageData[index];
      const green = imageData[index + 1];
      const blue = imageData[index + 2];
      const brightness = (red * 0.299) + (green * 0.587) + (blue * 0.114);
      if (brightness > 12) {
        brightPixels += 1;
      }
    }

    const sampleCount = Math.max(1, Math.floor(imageData.length / 64));
    const hasImage = brightPixels > sampleCount * 0.05;

    if (!hasImage) {
      setMessage('The camera preview is blank. Check camera permission and lighting, or upload a passport photo instead.');
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        setMessage('The camera image could not be captured. Please try again or upload a photo.');
        return;
      }

      setWebcamPhoto(blob);
      stopCamera();
    }, 'image/png', 0.95);
  };
  const clear = () => { setForm({ ...initialForm, dateOfIssuance: new Date().toISOString().slice(0, 10) }); setFiles(initialFiles); setWebcamPhoto(null); setMessage(''); };
  const submit = async (event) => { event.preventDefault(); const age = getAge(form.dateOfBirth); if (age === null) { setMessage('Enter a valid date of birth between today and 120 years ago.'); return; } setSubmitting(true); setMessage(''); try { const payload = new FormData(); const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(' '); Object.entries({ ...form, fullName, serviceType }).forEach(([key, value]) => payload.append(key, value)); Object.entries(files).forEach(([key, value]) => value && payload.append(key, value)); if (webcamPhoto) payload.append('webcamPhoto', webcamPhoto, 'webcam-photo.png'); const response = await axios.post('/api/services/submit-application', payload, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }); setMessage(`Application submitted successfully. Application ID: ${response.data.applicationId}`); navigate(`/track?query=${encodeURIComponent(response.data.applicationId)}`); } catch (error) { setMessage(`Submission failed: ${error.response?.data?.message || error.message}`); } finally { setSubmitting(false); } };
  const select = (name, label, options, required = false) => <label className="new-id-field">{label}{required && ' *'}<select name={name} value={form[name]} onChange={change} required={required}><option value="">Select / ይምረጡ</option>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>;
  const upload = (name, label, accept) => <label className="new-id-upload">{label} (Optional / አማራጭ)<input name={name} type="file" accept={accept} onChange={fileChange} /></label>;
  const field = (name, label, type = 'text', required = false, extra = {}) => <label className="new-id-field">{label}{required ? ' *' : ''}<input name={name} type={type} value={form[name]} onChange={change} required={required} {...extra} /></label>;

  return <div className="new-id-page"><nav className="new-id-nav"><Link to="/" className="new-id-brand">Online ID Card System <small>የኦንላይን መታወቂያ አገልግሎት</small></Link><div><Link to="/">Home</Link><Link to="/apply-id">Apply ID</Link><Link to="/renew-id">Renew ID</Link><Link to="/vital-events">Vital Events</Link><Link to="/track">Track</Link></div></nav><main className="new-id-card"><header className="new-id-heading"><p className="new-id-eyebrow">{serviceType === 'ID_RENEWAL' ? 'ID RENEWAL' : 'NEW NATIONAL ID'}</p><h1>{serviceType === 'ID_RENEWAL' ? 'ID Renewal Application' : 'New ID Card Application'} / የመታወቂያ ማመልከቻ</h1><p>Complete the form below and upload clear supporting documents. / እባክዎን ቅጹን በሙሉ ይሙሉ።</p></header>{message && <div className="new-id-message">{message}</div>}<form onSubmit={submit} className="new-id-form"><fieldset><legend>Personal Information / የግል መረጃ</legend><div className="new-id-grid">{field('firstName', 'First Name / ስም', 'text', true)}{field('middleName', 'Middle Name / የአባት ስም', 'text', true)}{field('lastName', 'Last Name / የአያት ስም', 'text', true)}{select('gender', 'Gender / ጾታ', [['Male', 'Male / ወንድ'], ['Female', 'Female / ሴት']], true)}{field('dateOfBirth', 'Date of Birth / የትውልድ ቀን', 'date', true)}{field('age', 'Age / ዕድሜ', 'text', false, { readOnly: true, placeholder: 'Auto calculated' })}{field('ageCategory', 'Age Category / የዕድሜ ምድብ', 'text', false, { readOnly: true })}{field('placeOfBirth', 'Place of Birth / የትውልድ ቦታ', 'text', true)}{field('placeOfBirthRegion', 'Birth Region / የትውልድ ክልል')}{field('placeOfBirthZone', 'Birth Zone / የትውልድ ዞን')}{field('placeOfBirthWoreda', 'Birth Woreda / የትውልድ ወረዳ')}{field('placeOfBirthKebele', 'Birth Kebele / የትውልድ ቀበሌ')}{field('nationality', 'Nationality / ዜግነት')}{field('occupation', 'Occupation / ሥራ / ሙያ')}{field('previousResidenceRegion', 'Previous Residence Region / የቀድሞ መኖሪያ ክልል')}{field('previousResidenceZone', 'Previous Residence Zone / የቀድሞ መኖሪያ ዞን')}{field('previousResidenceWoreda', 'Previous Residence Woreda / የቀድሞ መኖሪያ ወረዳ')}{field('previousResidenceKebele', 'Previous Residence Kebele / የቀድሞ መኖሪያ ቀበሌ')}{field('previousResidenceAddress', 'Previous Residence Address / የቀድሞ መኖሪያ አድራሻ')}{field('phoneNumber', 'Phone Number / የስልክ ቁጥር', 'tel', true, { placeholder: '09xxxxxxxx' })}{field('email', 'Email Address / ኢሜይል', 'email')}</div></fieldset><fieldset><legend>Emergency Contact / የአደጋ ጊዜ ተጠሪ</legend><div className="new-id-grid">{field('emergencyContactName', 'Contact Full Name / የተጠሪ ሙሉ ስም')}{field('emergencyPhone', 'Emergency Phone / የአደጋ ጊዜ ስልክ')}</div></fieldset><fieldset><legend>Address Information / የአድራሻ መረጃ</legend><div className="new-id-grid">{field('region', 'Region / ክልል', 'text', true)}{field('zone', 'Zone / ዞን', 'text', true)}{field('woreda', 'Woreda / ወረዳ', 'text', true)}{field('kebele', 'Kebele / ቀበሌ', 'text', true)}{field('residenceAddress', 'Residence Address / የመኖሪያ አድራሻ')}</div></fieldset><fieldset><legend>Administrative &amp; Validity Details / የአሰጣጥ መረጃ</legend><div className="new-id-grid">{field('dateOfIssuance', 'Date of Issuance / የተሰጠበት ቀን', 'date')}{field('idExpiryDate', 'ID Card Expiry Date / የማብቂያ ቀን', 'date')}{field('issuedBy', 'Issued By (Admin Name/ID) / የሰጠው አካል')}</div></fieldset><fieldset><legend>Required Documents / አስፈላጊ ሰነዶች</legend><p className="new-id-hint">JPG, PNG, or PDF files only. Maximum 20MB per file.</p><div className="new-id-grid">{upload('passportPhoto', 'Passport Photo / ፓስፖርት ፎቶ', 'image/*')}{upload('birthCertificate', 'Birth Certificate / የልደት ምስክር ወረቀት', '.jpg,.jpeg,.png,.pdf', true)}{upload('emergencyBirthCertificate', 'Emergency Contact Birth Certificate / የተጠሪ ምስክር ወረቀት', '.jpg,.jpeg,.png,.pdf')}{upload('residenceProof', 'Residence Proof / የመኖሪያ ማረጋገጫ', '.jpg,.jpeg,.png,.pdf', true)}</div><div className="new-id-camera"><h3>Webcam Capture / በካሜራ ፎቶ አንሳ</h3>{cameraOpen && <video ref={videoRef} autoPlay />}{!cameraOpen ? <button type="button" onClick={openCamera}>Open Camera / ካሜራ ክፈት</button> : <button type="button" onClick={capture}>Capture Photo / ፎቶ አንሳ</button>}{webcamPhoto && <span>Photo captured successfully.</span>}</div></fieldset><fieldset><legend>Additional Details / ተጨማሪ መረጃ</legend><textarea name="details" value={form.details} onChange={change} rows="4" placeholder="Additional information / ተጨማሪ መረጃ" /></fieldset><div className="new-id-actions"><button type="button" onClick={clear} className="clear-button">Clear Form / ባዶ አድርግ</button><button type="submit" disabled={submitting} className="submit-button">{submitting ? 'Submitting...' : 'Submit Application / ማመልከቻ ላክ'}</button></div></form></main></div>;
}

export default NewIDApplicationForm;
