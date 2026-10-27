import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
const { getFrameBrightnessRatio } = require('./utils/cameraCapture');
import { isSupportedUpload as isAllowedUpload } from './utils/uploadValidation';
import { useLanguage } from './context/LanguageContext';
import {
  countApplicantNameLetters,
  isValidApplicantName,
  isValidEthiopianPhoneNumber,
  normalizeEthiopianPhoneInput,
  sanitizeApplicantName
} from './utils/idApplicationValidation';
import { getRenewalExpiryIssue } from './utils/renewalEligibility';
import './NewIDApplicationForm.css';

const initialForm = {
  firstName: '', middleName: '', lastName: '', nationalId: '', renewalReason: '', idExpiryDate: '', gender: '', dateOfBirth: '', age: '', ageCategory: '', placeOfBirth: '', placeOfBirthRegion: '', placeOfBirthZone: '', placeOfBirthWoreda: '', placeOfBirthKebele: '', nationality: 'Ethiopian', occupation: '', phoneNumber: '', email: '',
  emergencyContactName: '', emergencyPhone: '', region: '', zone: '', woreda: '', kebele: '', residenceAddress: '', details: ''
};
const REGION_OPTIONS = [
  ['Addis Ababa', 'Addis Ababa / አዲስ አበባ'],
  ['Afar', 'Afar / አፋር'],
  ['Amhara', 'Amhara / አማራ'],
  ['Benishangul-Gumuz', 'Benishangul-Gumuz / ቤንሻንጉል-ጉሙዝ'],
  ['Central Ethiopia', 'Central Ethiopia / ማዕከላዊ ኢትዮጵያ'],
  ['Dire Dawa', 'Dire Dawa / ድሬዳዋ'],
  ['Gambela', 'Gambela / ጋምቤላ'],
  ['Harari', 'Harari / ሐረሪ'],
  ['Oromia', 'Oromia / ኦሮሚያ'],
  ['Sidama', 'Sidama / ሲዳማ'],
  ['Somali', 'Somali / ሶማሌ'],
  ['South Ethiopia', 'South Ethiopia / ደቡብ ኢትዮጵያ'],
  ['South West Ethiopia', 'South West Ethiopia / ደቡብ ምዕራብ ኢትዮጵያ'],
  ['Tigray', 'Tigray / ትግራይ']
];
const ZONES_BY_REGION = {
  'Addis Ababa': ['Addis Ketema', 'Akaki Kaliti', 'Arada', 'Bole', 'Gullele', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk-Lafto', 'Yeka'],
  Afar: ['Awsi Rasu (Zone 1)', 'Kilbet Rasu (Zone 2)', 'Gabi Rasu (Zone 3)', 'Fantena Rasu (Zone 4)', 'Hari Rasu (Zone 5)', 'Kilbati Rasu (Zone 6)'],
  Amhara: ['Awi', 'East Gojjam', 'North Gondar', 'North Shewa', 'North Wollo', 'Oromia', 'South Gondar', 'South Wollo', 'Wag Hemra', 'West Gojjam', 'West Gondar'],
  'Benishangul-Gumuz': ['Asosa', 'Kamashi', 'Metekel'],
  'Central Ethiopia': ['Gurage', 'Hadiya', 'Halaba', 'Kembata Tembaro', 'Silte', 'Yem'],
  'Dire Dawa': ['Dire Dawa Administration'],
  Gambela: ['Anywaa', 'Itang Special Woreda', 'Majang', 'Nuer'],
  Harari: ['Harari Region'],
  Oromia: ['Arsi', 'Bale', 'Borena', 'East Hararghe', 'East Shewa', 'East Welega', 'Guji', 'Horo Guduru Welega', 'Illubabor', 'Jimma', 'Kellem Welega', 'North Shewa', 'Southwest Shewa', 'West Arsi', 'West Guji', 'West Hararghe', 'West Shewa', 'West Welega'],
  Sidama: ['Sidama'],
  Somali: ['Afder', 'Doolo', 'Erer', 'Fafan', 'Jarar', 'Korahe', 'Liben', 'Nogob', 'Shabelle', 'Siti'],
  'South Ethiopia': ['Amaro', 'Basketo', 'Burji', 'Gamo', 'Gedeo', 'Gofa', 'Konso', 'South Omo', 'Wolayita'],
  'South West Ethiopia': ['Bench Sheko', 'Dawuro', 'Kaffa', 'Sheka', 'West Omo'],
  Tigray: ['Central Tigray', 'Eastern Tigray', 'North Western Tigray', 'Southern Tigray', 'South Eastern Tigray', 'Western Tigray']
};
const OCCUPATION_OPTIONS = [
  ['Civil Servant / Government Employee', 'የመንግሥት ሠራተኛ / Civil Servant / Government Employee'],
  ['Private Sector Employee', 'የግል ድርጅት ሠራተኛ / Private Sector Employee'],
  ['Self-Employed / Business Owner', 'የግል ሥራ / ነጋዴ / Self-Employed / Business Owner'],
  ['Farmer / Pastoralist', 'አርሶ አደር / አርብቶ አደር / Farmer / Pastoralist'],
  ['Student', 'ተማሪ / Student'],
  ['Daily Laborer', 'የቀን ሠራተኛ / Daily Laborer'],
  ['NGO / International Organization Employee', 'የመንግሥታዊ ያልሆነ ድርጅት ሠራተኛ / NGO / International Organization Employee'],
  ['Job Seeker', 'ሥራ ፈላጊ / Job Seeker'],
  ['Homemaker', 'የቤት እመቤት / Homemaker'],
  ['Retired', 'ጡረተኛ / Retired'],
  ['Other', 'ሌላ / Other']
];
const EXTRA_ID_DOCUMENTS = [
  ['localLeaderVerification', 'Local Leader Verification / የአካባቢ መሪ ማረጋገጫ'],
  ['employmentLetter', 'Employment Letter / የሥራ ቦታ ማረጋገጫ']
];
const TRANSFER_ID_DOCUMENTS = [
  ['releaseLetter', 'Release Letter / የለቀቃ ደብዳቤ'],
  ['policeClearance', 'Police / Security Clearance (if required) / የፖሊስ ማረጋገጫ']
];
const RENEWAL_REASONS = [
  ['EXPIRED', 'Expired / ጊዜው ያለፈ'],
  ['LOST', 'Lost / የጠፋ'],
  ['DAMAGED', 'Damaged / የተበላሸ']
];
const initialFiles = { passportPhoto: null, previousIdDocument: null, policeReport: null, damagedIdDocument: null, birthCertificate: null, residenceProof: null, releaseLetter: null, housingProof: null, localLeaderVerification: null, policeClearance: null, employmentLetter: null };
const getAge = (value) => { if (!value) return null; const birth = new Date(`${value}T00:00:00`); const today = new Date(); let age = today.getFullYear() - birth.getFullYear(); if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1; return age >= 0 && age <= 120 ? age : null; };
const isUploadFile = (value) => typeof File !== 'undefined' && value instanceof File;
const isSupportedIdUpload = (file) => isUploadFile(file) && isAllowedUpload(file);
const NAME_PATTERN = '[A-Za-z\\u1200-\\u135A ]+';

function NewIDApplicationForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRefs = useRef({});
  const { lang, toggleLanguage } = useLanguage();
  const isAmharic = lang === 'am';
  const text = (english, amharic) => (isAmharic ? amharic : english);
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState(initialFiles);
  const [documentPreviewUrls, setDocumentPreviewUrls] = useState({});
  const [webcamPhoto, setWebcamPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraPreviewReady, setCameraPreviewReady] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [sameAsBirthPlace, setSameAsBirthPlace] = useState(false);
  const serviceType = new URLSearchParams(location.search).get('type') === 'ID_RENEWAL' || location.pathname === '/renew-id' ? 'ID_RENEWAL' : 'NEW_ID_CARD';
  const isTransfer = form.isTransfer === true;

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);
  useEffect(() => {
    const photo = webcamPhoto || files.passportPhoto;
    if (!photo) {
      setPhotoPreviewUrl('');
      return undefined;
    }

    const previewUrl = URL.createObjectURL(photo);
    setPhotoPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [webcamPhoto, files.passportPhoto]);
  useEffect(() => {
    const previewUrls = {};
    Object.entries(files).forEach(([name, file]) => {
      if (name !== 'passportPhoto' && isUploadFile(file)) {
        previewUrls[name] = URL.createObjectURL(file);
      }
    });
    setDocumentPreviewUrls(previewUrls);
    return () => Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url));
  }, [files]);
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      const video = videoRef.current;
      const markPreviewReady = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setCameraPreviewReady(true);
          setMessage('');
        }
      };
      const handleTrackEnded = () => {
        setCameraPreviewReady(false);
        setMessage('The camera stopped unexpectedly. Reopen the camera or upload a photo instead.');
      };
      const handleVideoError = () => {
        setCameraPreviewReady(false);
        setMessage('The camera stream could not be displayed. Reopen the camera or upload a photo instead.');
      };
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach((track) => track.addEventListener('ended', handleTrackEnded));
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('autoplay', '');
      video.srcObject = streamRef.current;
      video.addEventListener('canplay', markPreviewReady);
      video.addEventListener('loadedmetadata', markPreviewReady);
      video.addEventListener('playing', markPreviewReady);
      video.addEventListener('error', handleVideoError);
      const previewTimeout = window.setTimeout(() => {
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          setMessage('Camera preview is still blank. Check that camera access is allowed and no other app is using the camera, or upload a photo instead.');
        }
      }, 8000);
      if (video.readyState >= 2) markPreviewReady();
      video.play().catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Camera preview could not start:', error);
          setMessage('Camera preview could not start. Check browser camera permission, or upload a photo instead.');
        }
      });
      return () => {
        video.removeEventListener('canplay', markPreviewReady);
        video.removeEventListener('loadedmetadata', markPreviewReady);
        video.removeEventListener('playing', markPreviewReady);
        video.removeEventListener('error', handleVideoError);
        window.clearTimeout(previewTimeout);
        videoTracks.forEach((track) => track.removeEventListener('ended', handleTrackEnded));
      };
    }
    return undefined;
  }, [cameraOpen]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
    setCameraPreviewReady(false);
  };

  const change = (event) => {
    const { name, value } = event.target;
    if (name === 'renewalReason') {
      setForm((current) => ({ ...current, renewalReason: value, idExpiryDate: '' }));
      setFiles((current) => ({
        ...current,
        previousIdDocument: null,
        policeReport: null,
        damagedIdDocument: null
      }));
      ['previousIdDocument', 'policeReport', 'damagedIdDocument'].forEach((fileName) => {
        if (fileInputRefs.current[fileName]) fileInputRefs.current[fileName].value = '';
      });
      setFieldErrors((current) => ({ ...current, idExpiryDate: '' }));
      setMessage('');
      return;
    }
    if (name === 'idExpiryDate') {
      const expiryIssue = getRenewalExpiryIssue(value);
      const expiryError = expiryIssue === 'too_early'
        ? text(
          'Renewal is not available while more than six months remain on the ID.',
          'ከ6 ወር በላይ ሲቀረው መታወቂያውን ማደስ አይቻልም።'
        )
        : expiryIssue === 'too_late'
          ? text(
            'Your ID expired more than one year ago. You cannot renew it; please apply for a new ID.',
            'መታወቂያዎ ካለፈ ከ1 ዓመት በላይ ሆኖታል። ማደስ አይችሉም፤ እባክዎ ለአዲስ መታወቂያ ያመልክቱ።'
          )
        : '';
      setForm((current) => ({ ...current, idExpiryDate: value }));
      setFieldErrors((current) => ({ ...current, idExpiryDate: expiryError }));
      return;
    }
    if (name === 'phoneNumber') {
      const phoneNumber = normalizeEthiopianPhoneInput(value);
      const phoneError = phoneNumber.length > 0 && phoneNumber.length < 10
        ? text('Enter all 10 digits.', '10 አሃዞችን ሙሉ ያስገቡ።')
        : phoneNumber.length === 10 && !isValidEthiopianPhoneNumber(phoneNumber)
          ? text('Use a valid Ethiopian number starting with 09 or 07.', 'በ09 ወይም 07 የሚጀምር ትክክለኛ ስልክ ቁጥር ያስገቡ።')
          : '';
      setForm((current) => ({ ...current, phoneNumber }));
      setFieldErrors((current) => ({ ...current, phoneNumber: phoneError }));
      return;
    }
    if (name === 'emergencyPhone') {
      const emergencyPhone = normalizeEthiopianPhoneInput(value);
      const emergencyPhoneError = emergencyPhone.length > 0 && emergencyPhone.length < 10
        ? text('Enter all 10 digits.', '10 አሃዞችን ሙሉ ያስገቡ።')
        : emergencyPhone.length === 10 && !isValidEthiopianPhoneNumber(emergencyPhone)
          ? text('Use a valid Ethiopian number starting with 09 or 07.', 'በ09 ወይም 07 የሚጀምር ትክክለኛ ስልክ ቁጥር ያስገቡ።')
          : '';
      setForm((current) => ({ ...current, emergencyPhone }));
      setFieldErrors((current) => ({ ...current, emergencyPhone: emergencyPhoneError }));
      return;
    }
    if (name === 'emergencyContactName') {
      const cleanName = sanitizeApplicantName(value);
      const nameError = cleanName.trim() && !isValidApplicantName(cleanName)
        ? text('Each name part must contain at least 3 letters.', 'እያንዳንዱ የስም ክፍል ቢያንስ 3 ፊደላት መያዝ አለበት።')
        : '';
      setForm((current) => ({ ...current, emergencyContactName: cleanName }));
      setFieldErrors((current) => ({ ...current, emergencyContactName: nameError }));
      return;
    }
    if (['firstName', 'middleName', 'lastName'].includes(name)) {
      const cleanName = sanitizeApplicantName(value);
      const letterCount = countApplicantNameLetters(cleanName);
      const nameError = cleanName.trim() && letterCount < 3
        ? text('Enter at least 3 letters.', 'ቢያንስ 3 ፊደላት ያስገቡ።')
        : '';
      setForm((current) => ({ ...current, [name]: cleanName }));
      setFieldErrors((current) => ({ ...current, [name]: nameError }));
      return;
    }
    const age = name === 'dateOfBirth' ? getAge(value) : null;
    const sameAddressField = {
      placeOfBirthRegion: 'region',
      placeOfBirthZone: 'zone',
      placeOfBirthWoreda: 'woreda',
      placeOfBirthKebele: 'kebele'
    }[name];
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(sameAsBirthPlace && sameAddressField ? { [sameAddressField]: value } : {}),
      ...(name === 'dateOfBirth'
        ? { age: age === null ? '' : age, ageCategory: age === null ? '' : age >= 18 ? 'Adult (≥18)' : 'Minor (<18)' }
        : {})
    }));
  };
  const changeRegion = (event, zoneField) => {
    const { name, value } = event.target;
    const sameAddressRegionField = name === 'placeOfBirthRegion' ? 'region' : null;
    const sameAddressZoneField = name === 'placeOfBirthZone' ? 'zone' : null;
    setForm((current) => ({
      ...current,
      [name]: value,
      [zoneField]: '',
      ...(sameAsBirthPlace && sameAddressRegionField ? { [sameAddressRegionField]: value, zone: '' } : {}),
      ...(sameAsBirthPlace && sameAddressZoneField ? { [sameAddressZoneField]: value } : {})
    }));
  };
  const toggleSameAsBirthPlace = (event) => {
    const checked = event.target.checked;
    setSameAsBirthPlace(checked);
    if (checked) {
      setForm((current) => ({
        ...current,
        region: current.placeOfBirthRegion,
        zone: current.placeOfBirthZone,
        woreda: current.placeOfBirthWoreda,
        kebele: current.placeOfBirthKebele
      }));
    }
  };
  const fileChange = (event) => {
    const { name, files: selectedFiles } = event.target;
    const file = selectedFiles?.[0] || null;
    if (!file) {
      setFiles((current) => ({ ...current, [name]: null }));
      return;
    }
    if (!isSupportedIdUpload(file)) {
      setFiles((current) => ({ ...current, [name]: null }));
      event.target.value = '';
      setMessage(text(
        'Choose a non-empty JPG, PNG, or PDF file no larger than 5 MB.',
        'ባዶ ያልሆነ JPG፣ PNG ወይም PDF ፋይል ይምረጡ። የፋይሉ መጠን ከ5MB መብለጥ የለበትም።'
      ));
      return;
    }
    setFiles((current) => ({ ...current, [name]: file }));
    if (name === 'passportPhoto') setWebcamPhoto(null);
    setMessage('');
  };
  const removeFile = (name) => {
    setFiles((current) => ({ ...current, [name]: null }));
    if (fileInputRefs.current[name]) fileInputRefs.current[name].value = '';
    if (name === 'passportPhoto') setWebcamPhoto(null);
    setMessage('');
  };
  const openCamera = async () => {
    setMessage('');
    if (!window.isSecureContext) {
      setMessage('Camera access requires HTTPS or localhost. Open the portal using a secure HTTPS address or localhost.');
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera unavailable');
      }

      if (streamRef.current) {
        stopCamera();
      }

      setCameraPreviewReady(false);
      const cameraOptions = [
        { video: { facingMode: { ideal: 'user' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: true, audio: false }
      ];

      let stream = null;
      let cameraError = null;
      for (const mediaOptions of cameraOptions) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(mediaOptions);
          break;
        } catch (error) {
          cameraError = error;
          console.warn('Camera option failed:', mediaOptions, error);
          if (['NotAllowedError', 'NotFoundError', 'NotReadableError', 'SecurityError'].includes(error.name)) {
            break;
          }
        }
      }

      if (!stream) {
        throw cameraError || new Error('No camera stream could be created');
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
      setMessage('Starting camera preview. Please wait...');
    } catch (error) {
      console.error('Camera access failed:', error);
      setCameraOpen(false);
      setCameraPreviewReady(false);
      const cameraMessage = error.name === 'NotReadableError'
        ? 'The camera is busy or unavailable. Close other apps or browser tabs using it, or upload a photo instead.'
        : error.name === 'NotAllowedError' || error.name === 'SecurityError'
          ? 'Camera permission is blocked. Allow camera access in your browser settings, or upload a photo instead.'
          : error.name === 'NotFoundError'
            ? 'No camera was found. Upload a photo instead.'
            : 'Camera access failed. Upload a photo instead or try again.';
      setMessage(cameraMessage);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!cameraPreviewReady || !video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
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
    const brightnessRatio = getFrameBrightnessRatio(imageData, 16, 12);

    if (brightnessRatio === 0) {
      setMessage('The camera image is too dark to use. Check the lens and lighting, or upload a photo instead.');
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        setMessage('The camera image could not be captured. Please try again or upload a photo.');
        return;
      }

      setWebcamPhoto(blob);
      setFiles((current) => ({ ...current, passportPhoto: null }));
      if (fileInputRefs.current.passportPhoto) fileInputRefs.current.passportPhoto.value = '';
      stopCamera();
    }, 'image/png', 0.95);
  };
  const clear = () => {
    setForm(initialForm);
    setFiles(initialFiles);
    setWebcamPhoto(null);
    setSameAsBirthPlace(false);
    setMessage('');
    setFieldErrors({});
    Object.values(fileInputRefs.current).forEach((input) => {
      if (input) input.value = '';
    });
  };
  const changeTransferStatus = (event) => {
    const transfer = event.target.value === 'true';
    setForm((current) => ({ ...current, isTransfer: transfer }));
    if (!transfer) {
      setFiles((current) => ({ ...current, releaseLetter: null, policeClearance: null }));
    }
  };
  const submit = async (event) => {
    event.preventDefault();
    const nameFields = ['firstName', 'middleName', 'lastName'];
    const invalidName = nameFields.find((name) => (
      !isValidApplicantName(form[name])
    ));
    if (invalidName) {
      const nextErrors = Object.fromEntries(nameFields.map((name) => [
        name,
        !isValidApplicantName(form[name])
          ? text('Enter at least 3 letters.', 'ቢያንስ 3 ፊደላት ያስገቡ።')
          : ''
      ]));
      setFieldErrors((current) => ({ ...current, ...nextErrors }));
      setMessage(text('Each name field must contain at least 3 letters.', 'እያንዳንዱ የስም መስክ ቢያንስ 3 ፊደላት መያዝ አለበት።'));
      return;
    }
    const age = getAge(form.dateOfBirth);
    if (age === null) {
      setMessage(text('Enter a valid date of birth between today and 120 years ago.', 'ዛሬን እና ከ120 ዓመት በፊትን የሚያካትት ትክክለኛ የትውልድ ቀን ያስገቡ።'));
      return;
    }
    const phoneNumber = form.phoneNumber.trim();
    if (!isValidEthiopianPhoneNumber(phoneNumber)) {
      const phoneError = text('Enter a valid 10-digit Ethiopian phone number starting with 09 or 07.', '10 አሃዝ ያለው፣ በ09 ወይም 07 የሚጀምር ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ።');
      setFieldErrors((current) => ({ ...current, phoneNumber: phoneError }));
      setMessage(phoneError);
      return;
    }
    const emergencyContactName = form.emergencyContactName.trim();
    const emergencyPhone = form.emergencyPhone.trim();
    if (emergencyContactName && !isValidApplicantName(emergencyContactName)) {
      const nameError = text(
        'Each emergency contact name part must contain at least 3 letters.',
        'እያንዳንዱ የአደጋ ጊዜ ተጠሪ ስም ክፍል ቢያንስ 3 ፊደላት መያዝ አለበት።'
      );
      setFieldErrors((current) => ({ ...current, emergencyContactName: nameError }));
      setMessage(nameError);
      return;
    }
    if (emergencyPhone && !isValidEthiopianPhoneNumber(emergencyPhone)) {
      const phoneError = text(
        'Enter a valid 10-digit emergency phone number starting with 09 or 07.',
        'በ09 ወይም 07 የሚጀምር 10 አሃዝ ያለው የአደጋ ጊዜ ስልክ ቁጥር ያስገቡ።'
      );
      setFieldErrors((current) => ({ ...current, emergencyPhone: phoneError }));
      setMessage(phoneError);
      return;
    }
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage(text('Enter a valid email address.', 'ትክክለኛ የኢሜይል አድራሻ ያስገቡ።'));
      return;
    }
    if (serviceType === 'ID_RENEWAL' && !form.nationalId.trim()) {
      setMessage(text('Enter your previous national ID number.', 'የቀድሞ ብሔራዊ መታወቂያ ቁጥርዎን ያስገቡ።'));
      return;
    }
    if (serviceType === 'ID_RENEWAL') {
      if (!['EXPIRED', 'LOST', 'DAMAGED'].includes(form.renewalReason)) {
        setMessage(text('Select a renewal reason.', 'የእድሳት ምክንያት ይምረጡ።'));
        return;
      }
      if (form.renewalReason === 'EXPIRED') {
        const expiryIssue = getRenewalExpiryIssue(form.idExpiryDate);
        if (expiryIssue) {
          const expiryError = expiryIssue === 'too_early'
            ? text(
              'Renewal is not available while more than six months remain on the ID.',
              'ከ6 ወር በላይ ሲቀረው መታወቂያውን ማደስ አይቻልም።'
            )
            : expiryIssue === 'too_late'
              ? text(
                'Your ID expired more than one year ago. You cannot renew it; please apply for a new ID.',
                'መታወቂያዎ ካለፈ ከ1 ዓመት በላይ ሆኖታል። ማደስ አይችሉም፤ እባክዎ ለአዲስ መታወቂያ ያመልክቱ።'
              )
              : text('Enter a valid expiry date from your previous ID.', 'ከቀድሞ መታወቂያዎ ላይ ትክክለኛ የማብቂያ ቀን ያስገቡ።');
          setFieldErrors((current) => ({ ...current, idExpiryDate: expiryError }));
          setMessage(expiryError);
          return;
        }
        if (!files.previousIdDocument) {
          setMessage(text('Upload a copy of your previous ID card.', 'የቀድሞ መታወቂያዎን ቅጂ ያያይዙ።'));
          return;
        }
      }
      if (form.renewalReason === 'LOST' && !files.policeReport) {
        setMessage(text('Upload a police report for the lost ID.', 'መታወቂያው መጥፋቱን የሚያሳይ የፖሊስ ማስረጃ ያያይዙ።'));
        return;
      }
      if (form.renewalReason === 'DAMAGED' && !files.damagedIdDocument) {
        setMessage(text('Upload a clear photo of the damaged ID.', 'የተበላሸውን መታወቂያ ግልጽ ፎቶ ያያይዙ።'));
        return;
      }
    }
    if (!webcamPhoto && !files.passportPhoto) {
      setMessage(text('Upload a passport photo or capture a photo for the ID card.', 'የፓስፖርት ፎቶ ያያይዙ ወይም ለመታወቂያው ፎቶ ያንሱ።'));
      return;
    }
    if (serviceType === 'NEW_ID_CARD' && !files.birthCertificate) {
      setMessage(text('A birth certificate is required for a new ID card application.', 'ለአዲስ መታወቂያ ማመልከቻ የልደት ምስክር ወረቀት ያስፈልጋል።'));
      return;
    }
    if (serviceType === 'NEW_ID_CARD' && !files.residenceProof && !files.housingProof) {
      setMessage(text('Upload residence proof or housing proof for a new ID card application.', 'ለአዲስ መታወቂያ የመኖሪያ ወይም የቤት ማስረጃ ያያይዙ።'));
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const payload = new FormData();
      const normalizedForm = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
      );
      normalizedForm.phoneNumber = phoneNumber;
      normalizedForm.email = email;
      const fullName = [normalizedForm.firstName, normalizedForm.middleName, normalizedForm.lastName].filter(Boolean).join(' ');
      Object.entries({ ...normalizedForm, fullName, serviceType }).forEach(([key, value]) => payload.append(key, value));
      const renewalEvidenceFields = {
        EXPIRED: ['previousIdDocument'],
        LOST: ['previousIdDocument', 'policeReport'],
        DAMAGED: ['previousIdDocument', 'damagedIdDocument']
      };
      const uploadFieldNames = serviceType === 'ID_RENEWAL'
        ? ['passportPhoto', ...(renewalEvidenceFields[form.renewalReason] || [])]
        : [
          'passportPhoto', 'birthCertificate', 'residenceProof', 'housingProof',
          'localLeaderVerification', 'employmentLetter',
          ...(isTransfer ? ['releaseLetter', 'policeClearance'] : [])
        ];
      uploadFieldNames.forEach((key) => {
        const file = files[key];
        if (isUploadFile(file)) payload.append(key, file, file.name);
      });
      if (typeof Blob !== 'undefined' && webcamPhoto instanceof Blob) {
        payload.append('webcamPhoto', webcamPhoto, isUploadFile(webcamPhoto) ? webcamPhoto.name : 'webcam-photo.png');
      }
      const response = await axios.post('/api/services/submit-application', payload, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` },
      });
      setMessageType('success');
      setMessage(`Application submitted successfully. Application ID: ${response.data.applicationId}`);
      navigate(`/track?query=${encodeURIComponent(response.data.applicationId)}`);
    } catch (error) {
      const responseMessage = error.response?.data?.message || error.message;
      const submissionMessage = responseMessage === 'Unexpected field'
        ? text(
          'The backend upload configuration appears outdated. Restart the backend from this project and try again. If it persists, check the backend terminal for the unexpected file field name.',
          'የBackend የፋይል መቀበያ ቅንብር ያረጀ ይመስላል። Backend-ን ከዚህ ፕሮጀክት ዳግም ያስነሱና ይሞክሩ። ከቀጠለ በBackend terminal የሚታየውን ያልተጠበቀ የፋይል መስክ ስም ይመልከቱ።'
        )
        : responseMessage;
      setMessageType('error');
      setMessage(`Submission failed: ${submissionMessage}`);
    } finally {
      setSubmitting(false);
    }
  };
  const optionLabel = (value) => {
    const parts = value.split(' / ');
    if (parts.length === 1) return value;
    return isAmharic
      ? parts.filter((part) => /[\u1200-\u137F]/.test(part)).join(' / ') || parts[parts.length - 1]
      : parts.filter((part) => /[A-Za-z]/.test(part) && !/[\u1200-\u137F]/.test(part)).join(' / ') || parts[0];
  };
  const select = (name, label, options, required = false, disabled = false, onChange = change) => <label className="new-id-field">{label}{required && ' *'}<select name={name} value={form[name]} onChange={onChange} required={required} disabled={disabled}><option value="">{text('Select', 'ይምረጡ')}</option>{options.map(([value, optionText]) => <option key={value} value={value}>{optionLabel(optionText)}</option>)}</select></label>;
  const upload = (name, label, accept) => {
    if (name === 'emergencyBirthCertificate') return null;

    const requirement = name === 'passportPhoto'
      ? text('Required if no captured photo is provided', 'በካሜራ ካልተነሳ ግዴታ')
      : serviceType === 'ID_RENEWAL' && name === 'previousIdDocument'
        ? form.renewalReason === 'EXPIRED'
          ? text('Required', 'ግዴታ')
          : text('Optional', 'አማራጭ')
        : serviceType === 'ID_RENEWAL' && ['policeReport', 'damagedIdDocument'].includes(name)
          ? text('Required', 'ግዴታ')
      : serviceType === 'NEW_ID_CARD' && name === 'birthCertificate'
        ? text('Required', 'ግዴታ')
        : serviceType === 'NEW_ID_CARD' && ['residenceProof', 'housingProof'].includes(name)
          ? text('One is required', 'ከሁለቱ አንዱ ግዴታ')
          : text('Optional', 'አማራጭ');

    return (
      <div key={name} className="new-id-upload-wrap">
        <label className="new-id-upload">
          {label} <span className="new-id-upload-requirement">({requirement})</span>
          <input
            ref={(element) => { fileInputRefs.current[name] = element; }}
            name={name}
            type="file"
            accept={accept}
            onChange={fileChange}
            required={(serviceType === 'NEW_ID_CARD' && name === 'birthCertificate')
              || (serviceType === 'ID_RENEWAL' && form.renewalReason === 'EXPIRED' && name === 'previousIdDocument')
              || (serviceType === 'ID_RENEWAL' && form.renewalReason === 'LOST' && name === 'policeReport')
              || (serviceType === 'ID_RENEWAL' && form.renewalReason === 'DAMAGED' && name === 'damagedIdDocument')}
          />
        </label>
        {files[name] && (
          <div className="new-id-file-preview">
            <div className="new-id-selected-file">
              <span className="new-id-file-type" aria-hidden="true">{files[name].type === 'application/pdf' ? 'PDF' : 'IMG'}</span>
              <span className="new-id-file-name" title={files[name].name}>{files[name].name}</span>
              <button type="button" className="new-id-remove-file" onClick={() => removeFile(name)} aria-label={text(`Remove ${label}`, `${label} አስወግድ`)}>
                {text('Remove', 'አስወግድ')}
              </button>
            </div>
            {name !== 'passportPhoto' && files[name].type.startsWith('image/') && documentPreviewUrls[name] && (
              <img className="new-id-photo-preview" src={documentPreviewUrls[name]} alt={text(`${label} preview`, `${label} ቅድመ እይታ`)} />
            )}
            {name !== 'passportPhoto' && files[name].type === 'application/pdf' && documentPreviewUrls[name] && (
              <a className="new-id-document-preview" href={documentPreviewUrls[name]} target="_blank" rel="noreferrer">
                {text('Preview PDF', 'የPDF ቅድመ እይታ')}
              </a>
            )}
          </div>
        )}
        {name === 'passportPhoto' && photoPreviewUrl && <img className="new-id-photo-preview" src={photoPreviewUrl} alt="Selected ID photo preview" />}
        {name === 'passportPhoto' && (
          <div className="new-id-camera">
            {cameraOpen && <video ref={videoRef} autoPlay />}
            <div className="new-id-camera-actions">
              {!cameraOpen
                ? <button type="button" onClick={openCamera}>{text('Use Camera', 'ካሜራ ይጠቀሙ')}</button>
                : <button type="button" onClick={capture}>{text('Capture Photo', 'ፎቶ አንሳ')}</button>}
              {webcamPhoto && (
                <span className="new-id-camera-status">
                  {text('Photo captured successfully.', 'ፎቶው በተሳካ ሁኔታ ተነስቷል።')}
                  <button type="button" className="new-id-remove-file" onClick={() => setWebcamPhoto(null)}>{text('Remove', 'አስወግድ')}</button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  const field = (name, label, type = 'text', required = false, extra = {}) => {
    if (name.startsWith('previousResidence')) return null;
    const errorId = `new-id-error-${name}`;
    const phoneProps = ['phoneNumber', 'emergencyPhone'].includes(name)
      ? {
          inputMode: 'numeric',
          maxLength: 10,
          pattern: '0[79][0-9]{8}',
          title: text('Enter 10 digits starting with 09 or 07.', '09 ወይም 07 የሚጀምር 10 አሃዝ ያለው ቁጥር ያስገቡ።')
        }
      : {};
    return (
      <div className="new-id-field-wrap">
        <label className="new-id-field">
          {label}{required ? ' *' : ''}
          <input
            name={name}
            type={type}
            value={form[name]}
            onChange={change}
            required={required}
            aria-invalid={Boolean(fieldErrors[name])}
            aria-describedby={fieldErrors[name] ? errorId : undefined}
            {...phoneProps}
            {...extra}
          />
        </label>
        {fieldErrors[name] && <small id={errorId} className="new-id-field-error" role="alert">{fieldErrors[name]}</small>}
      </div>
    );
  };

  return (
    <div className="new-id-page">
      <main className={`new-id-card${serviceType === 'ID_RENEWAL' ? ' new-id-renewal-card' : ''}`}>
        <header className="new-id-heading">
          <div className="new-id-heading-top">
            <div>
              <p className="new-id-eyebrow">{serviceType === 'ID_RENEWAL' ? text('ID RENEWAL', 'መታወቂያ እድሳት') : text('NEW NATIONAL ID', 'አዲስ ብሔራዊ መታወቂያ')}</p>
              <h1>{serviceType === 'ID_RENEWAL' ? text('ID Renewal Application', 'የመታወቂያ እድሳት ማመልከቻ') : text('New ID Card Application', 'አዲስ መታወቂያ ማመልከቻ')}</h1>
            </div>
            <button type="button" className="new-id-language-toggle" onClick={() => toggleLanguage(isAmharic ? 'en' : 'am')} aria-label={text('Switch to Amharic', 'ወደ እንግሊዝኛ ቀይር')}>
              <span aria-hidden="true">🌐</span> {text('አማርኛ', 'English')}
            </button>
          </div>
          <p>{serviceType === 'ID_RENEWAL'
            ? text('Provide your personal details and the documents required to renew your ID.', 'የግል መረጃዎንና ለመታወቂያ እድሳት የሚያስፈልጉ ሰነዶችን ያቅርቡ።')
            : text('Complete the form below and upload clear supporting documents.', 'ከታች ያለውን ቅጽ ይሙሉና ግልጽ የድጋፍ ሰነዶችን ያያይዙ።')}</p>
        </header>
        {message && <div className={`new-id-message is-${messageType}`} role={messageType === 'error' ? 'alert' : 'status'}>{message}</div>}
        <form onSubmit={submit} className="new-id-form">
          <fieldset>
            <legend>{text('Personal Information', 'የግል መረጃ')}</legend>
            <div className="new-id-grid">
              {field('firstName', text('First Name', 'ስም'), 'text', true, { pattern: NAME_PATTERN, minLength: 3, title: text('Use English/Amharic letters and spaces only.', 'የእንግሊዝኛ/አማርኛ ፊደልና ክፍተት ብቻ ይጠቀሙ።') })}
              {field('middleName', text('Middle Name', 'የአባት ስም'), 'text', true, { pattern: NAME_PATTERN, minLength: 3, title: text('Use English/Amharic letters and spaces only.', 'የእንግሊዝኛ/አማርኛ ፊደልና ክፍተት ብቻ ይጠቀሙ።') })}
              {field('lastName', text('Last Name', 'የአያት ስም'), 'text', true, { pattern: NAME_PATTERN, minLength: 3, title: text('Use English/Amharic letters and spaces only.', 'የእንግሊዝኛ/አማርኛ ፊደልና ክፍተት ብቻ ይጠቀሙ።') })}
              {serviceType === 'ID_RENEWAL' && (
                <div className="new-id-renewal-id-number">
                  {field('nationalId', text('Previous National ID Number', 'የቀድሞ መታወቂያ ቁጥር'), 'text', true, { maxLength: 64, autoComplete: 'off' })}
                  <p>{text('Enter the number exactly as shown on your previous ID card.', 'በቀድሞ መታወቂያዎ ላይ እንደተጻፈው ቁጥር በትክክል ያስገቡ።')}</p>
                </div>
              )}
              {serviceType === 'ID_RENEWAL' && (
                <>
                  {select('renewalReason', text('Reason for Renewal', 'የእድሳት ምክንያት'), RENEWAL_REASONS, true)}
                  {form.renewalReason === 'EXPIRED' && field(
                    'idExpiryDate',
                    text('Previous ID Expiry Date', 'የቀድሞ መታወቂያ ማብቂያ ቀን'),
                    'date',
                    true
                  )}
                  {form.renewalReason === 'EXPIRED' && (
                    <p className="new-id-hint">
                      {text(
                        'Renewal is available when the ID expires within six months or has been expired for no more than one year.',
                        'መታወቂያው ከ6 ወር በታች ሲቀረው ወይም ካለፈ ከ1 ዓመት ባልበለጠ ጊዜ ውስጥ ማደስ ይቻላል።'
                      )}
                    </p>
                  )}
                </>
              )}
              {select('gender', text('Gender', 'ጾታ'), [['Male', 'Male / ወንድ'], ['Female', 'Female / ሴት']], true)}
              {field('dateOfBirth', text('Date of Birth', 'የትውልድ ቀን'), 'date', true)}
              {field('age', text('Age', 'ዕድሜ'), 'text', false, { readOnly: true, placeholder: text('Auto calculated', 'በራስ-ሰር ይሰላል') })}
              {field('ageCategory', text('Age Category', 'የዕድሜ ምድብ'), 'text', false, { readOnly: true })}
              {field('phoneNumber', text('Phone Number', 'የስልክ ቁጥር'), 'tel', true, { placeholder: '0912345678', pattern: '0[79][0-9]{8}', title: text('Use a valid 10-digit Ethiopian phone number starting with 09 or 07.', 'በ09 ወይም 07 የሚጀምር 10 አሃዝ ያለው ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ያስገቡ።') })}
              {field('email', text('Email Address', 'ኢሜይል'), 'email', true, { placeholder: 'name@example.com', autoComplete: 'email' })}
              {serviceType === 'NEW_ID_CARD' && (
                <>
                  {field('placeOfBirth', text('Place of Birth', 'የትውልድ ቦታ'), 'text', true)}
                  {select('placeOfBirthRegion', text('Birth Region', 'የትውልድ ክልል'), REGION_OPTIONS, false, false, (event) => changeRegion(event, 'placeOfBirthZone'))}
                  {select('placeOfBirthZone', text('Birth Zone', 'የትውልድ ዞን'), (ZONES_BY_REGION[form.placeOfBirthRegion] || []).map((zone) => [zone, zone]), false, !form.placeOfBirthRegion)}
                  {field('placeOfBirthWoreda', text('Birth Woreda', 'የትውልድ ወረዳ'))}
                  {field('placeOfBirthKebele', text('Birth Kebele', 'የትውልድ ቀበሌ'))}
                  {field('nationality', text('Nationality', 'ዜግነት'))}
                  {select('occupation', text('Occupation', 'ሥራ / ሙያ'), OCCUPATION_OPTIONS, true)}
                </>
              )}
              {form.age !== '' && Number(form.age) < 18 && (
                <p className="new-id-age-warning" role="status">
                  {text('Applicants under 18 may need a guardian or additional documents. Please confirm the applicable Kebele requirements.', 'ከ18 ዓመት በታች የሆኑ አመልካቾች አሳዳጊ ወይም ተጨማሪ ሰነድ ሊያስፈልጋቸው ይችላል።')}
                </p>
              )}
            </div>
          </fieldset>
          {serviceType === 'NEW_ID_CARD' && <fieldset>
            <legend>{text('Emergency Contact', 'የአደጋ ጊዜ ተጠሪ')}</legend>
            <div className="new-id-grid">
              {field('emergencyContactName', text('Contact Full Name', 'የተጠሪ ሙሉ ስም'))}
              {field('emergencyPhone', text('Emergency Phone', 'የአደጋ ጊዜ ስልክ'), 'tel', false, { placeholder: '0912345678', inputMode: 'numeric', maxLength: 10, pattern: '0[79][0-9]{8}' })}
            </div>
          </fieldset>}
          {serviceType === 'NEW_ID_CARD' && <fieldset>
            <legend>{text('Address Information', 'የአድራሻ መረጃ')}</legend>
            <label className="new-id-same-address">
              <input type="checkbox" checked={sameAsBirthPlace} onChange={toggleSameAsBirthPlace} />
              <span>{text('My current address is the same as my birth place', 'የአሁኑ መኖሪያ አድራሻዬ ከትውልድ ቦታዬ ጋር ተመሳሳይ ነው')}</span>
            </label>
            <div className="new-id-grid">
              {select('region', text('Region', 'ክልል'), REGION_OPTIONS, true, sameAsBirthPlace, (event) => changeRegion(event, 'zone'))}
              {select('zone', text('Zone', 'ዞን'), (ZONES_BY_REGION[form.region] || []).map((zone) => [zone, zone]), true, sameAsBirthPlace || !form.region)}
              {field('woreda', text('Woreda', 'ወረዳ'), 'text', true, { readOnly: sameAsBirthPlace })}
              {field('kebele', text('Kebele', 'ቀበሌ'), 'text', true, { readOnly: sameAsBirthPlace })}
              {field('residenceAddress', text('Residence Address', 'የመኖሪያ አድራሻ'))}
            </div>
          </fieldset>}
          {serviceType === 'NEW_ID_CARD' && <fieldset>
            <legend>{text('Administrative & Validity Details', 'የሰነድ አሰጣጥ መረጃ')}</legend>
            <div className="new-id-grid">
              {field('dateOfIssuance', text('Date of Issuance', 'የተሰጠበት ቀን'), 'date')}
              {field('idExpiryDate', text('ID Card Expiry Date', 'የመታወቂያ ማብቂያ ቀን'), 'date')}
              {field('issuedBy', text('Issued By (Admin Name/ID)', 'የሰጠው አካል (ስም/መታወቂያ)'))}
            </div>
          </fieldset>}
          <fieldset>
            <legend>{text('Required Documents', 'አስፈላጊ ሰነዶች')}</legend>
            <p className="new-id-hint">{text('JPG, PNG, or PDF files only. Maximum 5MB per file.', 'JPG፣ PNG ወይም PDF ብቻ። የእያንዳንዱ ፋይል መጠን እስከ 5MB ነው።')}</p>
            {serviceType === 'NEW_ID_CARD' && (
              <label className="new-id-field new-id-transfer-choice">
                {text('Did you move here from another Kebele?', 'ከሌላ ቀበሌ ወደዚህ ተዛውረዋል?')}
                <select name="isTransfer" value={String(isTransfer)} onChange={changeTransferStatus}>
                  <option value="false">{text('No', 'አይ')}</option>
                  <option value="true">{text('Yes, this is a transfer', 'አዎ፣ ዝውውር ነው')}</option>
                </select>
              </label>
            )}
            <div className="new-id-grid">
              {upload('passportPhoto', text('Passport Photo', 'ፓስፖርት ፎቶ'), 'image/*')}
              {serviceType === 'ID_RENEWAL' && ['EXPIRED', 'LOST', 'DAMAGED'].includes(form.renewalReason) && (
                upload(
                  'previousIdDocument',
                  form.renewalReason === 'LOST'
                    ? text('Previous ID Card Copy (optional)', 'የቀድሞ መታወቂያ ቅጂ (አማራጭ)')
                    : form.renewalReason === 'DAMAGED'
                      ? text('Damaged ID Copy (optional)', 'የተበላሸው መታወቂያ ቅጂ (አማራጭ)')
                      : text('Previous ID Card Copy (or enter the ID number)', 'የቀድሞ መታወቂያ ቅጂ (ወይም ቁጥሩን ያስገቡ)'),
                  '.jpg,.jpeg,.png,.pdf'
                )
              )}
              {serviceType === 'ID_RENEWAL' && form.renewalReason === 'LOST' && (
                upload('policeReport', text('Police Report for Lost ID', 'ለጠፋ መታወቂያ የፖሊስ ማስረጃ'), '.jpg,.jpeg,.png,.pdf')
              )}
              {serviceType === 'ID_RENEWAL' && form.renewalReason === 'DAMAGED' && (
                upload('damagedIdDocument', text('Photo of Damaged ID', 'የተበላሸው መታወቂያ ፎቶ'), '.jpg,.jpeg,.png')
              )}
              {serviceType === 'NEW_ID_CARD' && (
                <>
                  {upload('birthCertificate', text('Birth Certificate', 'የልደት ምስክር ወረቀት'), '.jpg,.jpeg,.png,.pdf')}
                  {upload('residenceProof', text('Residence Proof', 'የመኖሪያ ማረጋገጫ'), '.jpg,.jpeg,.png,.pdf')}
                  {upload('housingProof', text('Housing Proof', 'የቤት ማስረጃ'), '.jpg,.jpeg,.png,.pdf')}
                </>
              )}
            </div>
            {serviceType === 'NEW_ID_CARD' && <p className="new-id-hint">{text('For a new ID, upload both the birth certificate and either residence proof or housing proof.', 'ለአዲስ መታወቂያ የልደት ምስክር ወረቀትና ከመኖሪያ/ቤት ማስረጃ አንዱን ያስገቡ።')}</p>}
          </fieldset>
          {serviceType === 'NEW_ID_CARD' && isTransfer && (
            <fieldset>
              <legend>{text('Transfer Documents', 'የዝውውር ሰነዶች')}</legend>
              <p className="new-id-hint">{text('Attach these only if they apply to your transfer.', 'ለዝውውርዎ አስፈላጊ ከሆኑ ብቻ ያያይዙ።')}</p>
              <div className="new-id-grid">
                {TRANSFER_ID_DOCUMENTS.map(([fieldName, fieldLabel]) => upload(fieldName, optionLabel(fieldLabel), '.jpg,.jpeg,.png,.pdf'))}
              </div>
            </fieldset>
          )}
          {serviceType === 'NEW_ID_CARD' && <details className="new-id-optional-documents">
            <summary>{text('Optional Documents', 'አማራጭ ሰነዶች')}</summary>
            <p className="new-id-hint">{text('Add these only if they apply to your situation.', 'እነዚህን ሰነዶች ለሁኔታዎ አስፈላጊ ከሆኑ ብቻ ያያይዙ።')}</p>
            <div className="new-id-grid">
              {EXTRA_ID_DOCUMENTS.map(([fieldName, fieldLabel]) => upload(fieldName, optionLabel(fieldLabel), '.jpg,.jpeg,.png,.pdf'))}
            </div>
          </details>}
          {serviceType === 'NEW_ID_CARD' && <fieldset>
            <legend>{text('Additional Details', 'ተጨማሪ መረጃ')}</legend>
            <textarea name="details" value={form.details} onChange={change} rows="4" placeholder={text('Additional information', 'ተጨማሪ መረጃ')} />
          </fieldset>}
          <div className="new-id-actions">
            <button type="button" onClick={clear} className="clear-button">{text('Clear Form', 'ቅጹን አጽዳ')}</button>
            <button type="submit" disabled={submitting} className="submit-button">
              {submitting && <span className="new-id-submit-spinner" aria-hidden="true" />}
              {submitting ? text('Submitting...', 'በመላክ ላይ...') : text('Submit Application', 'ማመልከቻ ላክ')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default NewIDApplicationForm;
