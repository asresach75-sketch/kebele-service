import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { isSupportedUpload } from './utils/uploadValidation';
import { getReceiptApplicantName, getReceiptPaymentMethod, isSimulatedPayment } from './utils/paymentReceipt';
import { useLanguage } from './context/LanguageContext';
import './TrackStatus.css';

const API_BASE_URL = (
  process.env.REACT_APP_API_URL
  || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '')
).replace(/\/+$/, '');

const serviceLabels = {
  NEW_ID_CARD: 'New ID Card / አዲስ መታወቂያ ካርድ',
  ID_RENEWAL: 'ID Renewal / መታወቂያ ካርድ እድገት',
  BIRTH_REGISTRATION: 'Birth Registration / የልደት ምዝገባ',
  MARRIAGE_REGISTRATION: 'Marriage Registration / የጋብቻ ምዝገባ',
  DIVORCE_REGISTRATION: 'Divorce Registration / የፍቺ ምዝገባ',
  DEATH_REGISTRATION: 'Death Registration / የሞት ምዝገባ'
};

const statusLabels = {
  SUBMITTED: 'Application submitted / ማመልከቻ ተልኳል',
  PENDING_OFFICER: 'Pending Officer Review / የሰራተኛ ምርመራ ይጠበቃል',
  PENDING: 'Pending Officer Review / የሰራተኛ ምርመራ ይጠበቃል',
  NEEDS_CORRECTION: 'Needs Correction / ማስተካከያ ያስፈልጋል',
  APPROVED_BY_OFFICER: 'Approved by Officer / በሰራተኛ ጸድቋል',
  PAID_PENDING_FINANCE: 'Payment Submitted - Finance Review Pending / ክፍያ ተልኳል፣ የፋይናንስ ማረጋገጫ ይጠበቃል',
  APPROVED_BY_FINANCE: 'Approved by Finance / በፋይናንስ ጸድቋል',
  COMPLETED: 'Completed / ተጠናቋል',
  PAYMENT_PENDING: 'Payment Pending / ክፍያ ይጠበቃል',
  Approved: 'Approved / ተፈቀዷል',
  'Approved - Pending Payment': 'Approved - Pending Payment / ክፍያ ይጠበቃል',
  'Payment Verified': 'Payment Verified / ክፍያ ተረጋግጧል',
  Pending: 'Pending / በታጋዥ ላይ',
  Rejected: 'Rejected / ተቋርጧል',
  REJECTED: 'Rejected / ተቋርጧል'
};

const correctionDocumentFields = [
  ['previousIdDocument', 'Previous ID Card Copy / የቀድሞ መታወቂያ ቅጂ'],
  ['releaseLetter', 'Release Letter / የለቀቃ ደብዳቤ'],
  ['housingProof', 'Housing Proof / የመኖሪያ ቤት ማስረጃ'],
  ['localLeaderVerification', 'Local Leader Verification / የአካባቢ መሪ ማረጋገጫ'],
  ['passportPhoto', 'Passport Photo / ፓስፖርት ፎቶ'],
  ['policeClearance', 'Police / Security Clearance / የፖሊስ ማረጋገጫ'],
  ['employmentLetter', 'Employment Letter / የሥራ ቦታ ማረጋገጫ'],
  ['birthCertificate', 'Birth Certificate / የልደት ምስክር ወረቀት'],
  ['residenceProof', 'Residence Proof / የመኖሪያ ማረጋገጫ'],
  ['emergencyBirthCertificate', 'Emergency Birth Certificate / የተጠሪ ምስክር ወረቀት']
];

const getTimelineEvents = (application) => {
  const history = Array.isArray(application.statusHistory) ? [...application.statusHistory] : [];
  const events = history.length ? history : [{
    status: 'SUBMITTED',
    changedAt: application.createdAt,
    actorRole: 'citizen'
  }];
  const hasStatus = (status) => events.some((event) => event.status === status);
  const latestStatus = events[events.length - 1]?.status;

  if (application.status && application.status !== latestStatus && application.status !== 'PENDING_OFFICER') {
    const status = application.status;
    const actorRole = status === 'APPROVED_BY_FINANCE' || status === 'Payment Verified'
      ? 'finance'
      : status === 'COMPLETED' ? 'admin' : 'officer';
    const changedAt = actorRole === 'finance'
      ? application.paymentVerifiedAt || application.updatedAt
      : status === 'COMPLETED' ? application.completedAt || application.updatedAt : application.updatedAt;
    events.push({ status, changedAt, actorRole, reason: application.correctionReason });
  }
  if (application.paymentVerifiedAt && !hasStatus('APPROVED_BY_FINANCE')) {
    events.push({ status: 'APPROVED_BY_FINANCE', changedAt: application.paymentVerifiedAt, actorRole: 'finance' });
  }
  if (application.completedAt && !hasStatus('COMPLETED')) {
    events.push({ status: 'COMPLETED', changedAt: application.completedAt, actorRole: 'admin' });
  }

  const sortedEvents = events.sort((left, right) => new Date(left.changedAt || 0) - new Date(right.changedAt || 0));
  if (['APPROVED_BY_OFFICER', 'Approved - Pending Payment'].includes(application.status)
    && application.paymentStatus !== 'Verified') {
    sortedEvents.push({ status: 'PAYMENT_PENDING', actorRole: 'current' });
  }
  return sortedEvents;
};

function TrackStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const isAmharic = lang === 'am';
  const text = (english, amharic) => (isAmharic ? amharic : english);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const [telebirrPhone, setTelebirrPhone] = useState('');
  const [telebirrPhoneError, setTelebirrPhoneError] = useState('');
  const [digitalIdDownloading, setDigitalIdDownloading] = useState(false);
  const [birthCertificateDownloading, setBirthCertificateDownloading] = useState(false);
  const [correctionFiles, setCorrectionFiles] = useState({});
  const [correctionSubmitting, setCorrectionSubmitting] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState('');

  const handleSearchWithValue = async (value) => {
    const normalizedQuery = value.trim();
    if (!normalizedQuery) {
      setResult(null);
      setError(text('Enter a phone number or application ID to search.', 'ለመፈለግ የስልክ ቁጥር ወይም የማመልከቻ መለያ ያስገቡ።'));
      return;
    }

    setError('');
    setResult(null);
    setSearching(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/services/track`, {
        params: { query: normalizedQuery },
        timeout: 15000
      });
      const application = response.data?.data || response.data;
      if (!application || typeof application !== 'object' || Array.isArray(application)) {
        setError(text(
          'The server returned an invalid application status response. Please try again.',
          'ሰርቨሩ የማመልከቻ ሁኔታ ላይ ትክክል ያልሆነ ምላሽ ሰጥቷል። እባክዎ ደግመው ይሞክሩ።'
        ));
        return;
      }
      setResult(application);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(text('No application found for that number or ID.', 'በዚህ ቁጥር ወይም ID ማመልከቻ አልተገኘም።'));
      } else if (err.code === 'ECONNABORTED') {
        setError(text('The request timed out. Please try again.', 'የማግኘት ጥያቄው ጊዜው አልቋል። እባክዎ ደግመው ይሞክሩ።'));
      } else if (!err.response) {
        setError(text(
          'Unable to connect to the E-Kebele server. Check your connection and make sure the backend is running, then try again.',
          'ከኢ-ቀበሌ ሰርቨር ጋር መገናኘት አልተቻለም። የኢንተርኔት ግንኙነትዎንና backend ሰርቨሩ መስራቱን ያረጋግጡ፣ ከዚያም ደግመው ይሞክሩ።'
        ));
      } else {
        const serverMessage = err.response.data?.message || text(
          `The server could not retrieve the application status (HTTP ${err.response.status}).`,
          `ሰርቨሩ የማመልከቻውን ሁኔታ ማምጣት አልቻለም (HTTP ${err.response.status})።`
        );
        setError(text(`Unable to fetch status: ${serverMessage}`, `የማመልከቻውን ሁኔታ ማምጣት አልተቻለም: ${serverMessage}`));
      }
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const startQuery = params.get('query');
    if (startQuery) {
      setQuery(startQuery);
      handleSearchWithValue(startQuery);
    }
  }, [location.search]);

  useEffect(() => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!result?.applicationId || !token) {
      setNotifications([]);
      setNotificationError('');
      return;
    }
    axios.get(`${API_BASE_URL}/api/services/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ data }) => {
      setNotifications(Array.isArray(data) ? data.filter((item) => item.applicationId === result.applicationId) : []);
      setNotificationError('');
    }).catch((notificationRequestError) => {
      setNotificationError(notificationRequestError.response?.data?.message || 'Unable to load notifications.');
    });
  }, [result?.applicationId, result?.status]);

  const handleSearch = async (e) => {
    e.preventDefault();
    await handleSearchWithValue(query.trim());
  };

  const handleCorrectionUpload = async (event) => {
    event.preventDefault();
    const files = Object.entries(correctionFiles).filter(([, file]) => file);
    if (!files.length) {
      setError('Choose at least one replacement document.');
      return;
    }
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      setError('Sign in to upload corrected documents.');
      return;
    }

    const form = event.currentTarget;
    const payload = new FormData();
    files.forEach(([field, file]) => payload.append(field, file));
    setCorrectionSubmitting(true);
    setError('');
    try {
      const response = await axios.put(`${API_BASE_URL}/api/services/correction/${encodeURIComponent(result.applicationId)}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(response.data.data || response.data);
      setCorrectionFiles({});
      form.reset();
    } catch (uploadError) {
      setError(uploadError.response?.data?.message || 'Unable to upload corrected documents.');
    } finally {
      setCorrectionSubmitting(false);
    }
  };

  const localizeLabel = (label) => {
    const parts = String(label || '').split(' / ');
    if (parts.length === 1) return label || 'N/A';
    return isAmharic
      ? parts.filter((part) => /[\u1200-\u137F]/.test(part)).join(' / ') || parts[parts.length - 1]
      : parts.filter((part) => !/[\u1200-\u137F]/.test(part)).join(' / ') || parts[0];
  };
  const getServiceLabel = (type) => localizeLabel(serviceLabels[type] || type);
  const getFee = () => {
    const fee = Number(result?.paymentAmount);
    return Number.isFinite(fee) && fee > 0 ? fee : null;
  };
  const getStatusLabel = (status) => localizeLabel(statusLabels[status] || status);
  
  const documentId = result?.applicationId || result?._id || result?.id;
  const paymentVerified = result?.paymentStatus === 'Verified'
    || ['APPROVED_BY_FINANCE', 'COMPLETED', 'Payment Verified'].includes(result?.status);
  const paymentPendingVerification = result?.status === 'PAID_PENDING_FINANCE'
    || (result?.paymentStatus === 'Initiated' && result?.status !== 'APPROVED_BY_OFFICER');
  const paymentAwaitingGateway = result?.status === 'APPROVED_BY_OFFICER'
    && result?.paymentStatus === 'Initiated';
  const simulatedPayment = isSimulatedPayment(result?.paymentMethod, result?.paymentRef);
  const paymentState = paymentVerified
    ? simulatedPayment
      ? { label: text('Demo record verified', 'የሙከራ መዝገብ ተረጋግጧል'), tone: 'pending' }
      : { label: text('Paid', 'ተከፍሏል'), tone: 'paid' }
    : paymentPendingVerification
      ? { label: text('Verification pending', 'ማረጋገጫ ይጠበቃል'), tone: 'pending' }
      : paymentAwaitingGateway
        ? { label: text('Payment initiated', 'ክፍያ ተጀምሯል'), tone: 'pending' }
        : { label: text('Unpaid', 'አልተከፈለም'), tone: 'unpaid' };
  const isBirthRegistration = result?.serviceType === 'BIRTH_REGISTRATION';
  const birthStatus = String(result?.status || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  const birthWorkflowSteps = [
    text('Application received', 'ማመልከቻው ደርሷል'),
    text('Kebele officer review', 'የቀበሌ ኦፊሰር ግምገማ'),
    text('Payment', 'ክፍያ'),
    text('Finance verification', 'የፋይናንስ ማረጋገጫ'),
    text('Birth certificate ready', 'የልደት ሰርቲፊኬት ዝግጁ'),
  ];
  const birthStepIndex = ['APPROVED', 'APPROVED_BY_OFFICER', 'APPROVED_PENDING_PAYMENT'].includes(birthStatus)
    ? 2
    : birthStatus === 'PAID_PENDING_FINANCE'
      ? 3
      : ['APPROVED_BY_FINANCE', 'PAYMENT_VERIFIED', 'COMPLETED'].includes(birthStatus)
        ? 4
        : 1;
  const birthCertificateReady = isBirthRegistration
    && paymentVerified
    && ['APPROVED_BY_FINANCE', 'PAYMENT_VERIFIED', 'COMPLETED'].includes(birthStatus);
  const visibleNotifications = notifications.filter((item) => {
    const paymentAlreadySubmitted = paymentPendingVerification || paymentVerified;
    return !paymentAlreadySubmitted || !/please pay through chapa or telebirr/i.test(item.message || '');
  });

  const handleDownload = () => {
    if (!documentId) {
      alert(text('Application ID is missing.', 'የማመልከቻ መለያ ቁጥር አልተገኘም።'));
      return;
    }

    const serviceType = String(result.serviceType || '').toUpperCase();
    if (serviceType === 'MARRIAGE_REGISTRATION') {
      navigate(`/marriage-certificate/${encodeURIComponent(documentId)}`);
    } else if (serviceType === 'BIRTH_REGISTRATION') {
      navigate(`/birth-certificate/${encodeURIComponent(documentId)}`);
    } else {
      navigate('/digital-id-card', { state: { application: result } });
    }
  };

  const handleReceiptDownload = () => {
    if (!paymentVerified) {
      setError('A receipt is available after Finance verifies the payment.');
      return;
    }

    try {
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const simulatedPayment = isSimulatedPayment(result.paymentMethod, result.paymentRef);
      const rows = [
        ['Application Number', result.applicationId || 'Not recorded'],
        ['Applicant', getReceiptApplicantName(result.fullName || result.parentName || result.husbandName || result.childName)],
        ['Service', getServiceLabel(result.serviceType)],
        ['Payment Method', getReceiptPaymentMethod(result.paymentMethod, result.paymentRef)],
        ['Transaction Reference', result.paymentRef || 'Not recorded'],
        ['Payment Status', simulatedPayment ? 'Finance Verified (Demo)' : 'Verified'],
        ['Verified At', result.paymentVerifiedAt ? new Date(result.paymentVerifiedAt).toLocaleString() : 'Not recorded'],
      ];

      pdf.setFillColor(...(simulatedPayment ? [124, 45, 18] : [11, 77, 156]));
      pdf.rect(0, 0, pageWidth, 36, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(17);
      pdf.text('E-KEBELE SERVICE PORTAL', 18, 17);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(simulatedPayment ? 'DEMO PAYMENT RECORD' : 'OFFICIAL PAYMENT RECEIPT', 18, 26);
      pdf.setTextColor(35, 48, 66);

      let y = 52;
      rows.forEach(([field, value]) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text(field, 18, y);
        pdf.setFont('helvetica', 'normal');
        const wrappedValue = pdf.splitTextToSize(String(value || 'Not recorded'), pageWidth - 84);
        pdf.text(wrappedValue, 78, y);
        y += Math.max(12, wrappedValue.length * 5 + 4);
        pdf.setDrawColor(220, 228, 238);
        pdf.line(18, y - 4, pageWidth - 18, y - 4);
      });

      y += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      const amountLabel = simulatedPayment ? 'DEMO AMOUNT (NOT A REAL PAYMENT)' : 'TOTAL PAID';
      pdf.text(`${amountLabel}: ${Number(result.amountPaid || result.paymentAmount || 0).toLocaleString()} ${result.currency || 'ETB'}`, 18, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        simulatedPayment
          ? 'This simulated transaction was recorded for testing and was not processed by a payment gateway.'
          : 'Generated by E-Kebele Service Portal',
        18,
        Math.min(y + 20, 280),
        { maxWidth: pageWidth - 36 }
      );
      const safeId = String(result.applicationId || documentId || 'payment').replace(/[^a-z0-9_-]/gi, '-');
      pdf.save(`E-Kebele-Receipt-${safeId}.pdf`);
      setError('');
    } catch (receiptError) {
      setError(`Unable to generate payment receipt: ${receiptError.message}`);
    }
  };

  const handleDigitalIdDownload = async () => {
    if (!isDigitalIdReady) {
      setError('The digital ID is available after Finance verifies payment.');
      return;
    }

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      setError('Sign in to download your digital ID.');
      return;
    }

    setDigitalIdDownloading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/services/digital-id/${encodeURIComponent(result.applicationId)}.pdf`,
        { responseType: 'blob', headers: { Authorization: `Bearer ${token}` } },
      );
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `E-Kebele-Digital-ID-${result.applicationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      const responseData = downloadError.response?.data;
      let message = 'Unable to download the digital ID PDF.';
      if (responseData instanceof Blob) {
        const contentType = downloadError.response?.headers?.['content-type'] || responseData.type;
        const responseText = await responseData.text();
        if (contentType?.includes('application/json')) {
          try {
            const body = JSON.parse(responseText);
            message = body.message || message;
          } catch {
            message = `The server returned an invalid error response (HTTP ${downloadError.response?.status || 'unknown'}).`;
          }
        } else if (downloadError.response?.status) {
          message = `Digital ID download failed (HTTP ${downloadError.response.status}). The backend may need to be restarted or the application is not available.`;
        }
      } else if (responseData?.message) {
        message = responseData.message;
      }
      setError(message);
    } finally {
      setDigitalIdDownloading(false);
    }
  };

  const handleBirthCertificateDownload = async () => {
    if (result?.serviceType !== 'BIRTH_REGISTRATION'
      || !birthCertificateReady) {
      setError(text(
        'The birth certificate is available after Finance verifies payment.',
        'የልደት ሰርቲፊኬቱ የሚገኘው ፋይናንስ ክፍያውን ካረጋገጠ በኋላ ነው።'
      ));
      return;
    }

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) {
      setError(text('Sign in to download your birth certificate.', 'የልደት ሰርቲፊኬቱን ለማውረድ ይግቡ።'));
      return;
    }

    setBirthCertificateDownloading(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/birth-certificate/download/${encodeURIComponent(result.applicationId)}`,
        { responseType: 'blob', headers: { Authorization: 'Bearer ' + token } },
      );
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `E-Kebele-Birth-Certificate-${result.applicationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      let message = 'Unable to download the birth certificate PDF.';
      const responseData = downloadError.response?.data;
      if (responseData instanceof Blob) {
        const responseText = await responseData.text();
        try {
          const body = JSON.parse(responseText);
          message = body.message || message;
        } catch {
          message = `Birth certificate download failed (HTTP ${downloadError.response?.status || 'unknown'}).`;
        }
      } else if (responseData?.message) {
        message = responseData.message;
      } else if (!downloadError.response) {
        message = 'Unable to connect to the E-Kebele server.';
      }
      setError(text(message, message));
    } finally {
      setBirthCertificateDownloading(false);
    }
  };

  const handlePayment = async () => {
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const authConfig = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
    try {
      const response = await axios.post(`${API_BASE_URL}/api/services/payment/initiate`, { applicationId: result.applicationId }, authConfig);
      window.location.href = response.data.data.checkoutUrl;
    } catch (paymentError) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/services/payment/simulate`, { applicationId: result.applicationId }, authConfig);
        setResult(response.data.data);
        setError('');
        window.alert('Demo payment completed. Your application is now waiting for Finance verification.');
      } catch (simulationError) {
        setError(simulationError.response?.data?.message || paymentError.response?.data?.message || 'Unable to start payment.');
      }
    }
  };

  const handleTelebirrPayment = async () => {
    const normalizedPhone = telebirrPhone.trim();
    if (!/^(09|07)\d{8}$/.test(normalizedPhone)) {
      setTelebirrPhoneError('Enter a valid Ethiopian Telebirr number starting with 09 or 07.');
      return;
    }

    setTelebirrPhoneError('');
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/api/workflow/pay/${encodeURIComponent(result.applicationId)}`, {
        paymentMethod: 'Telebirr',
        paymentPhone: normalizedPhone,
        paymentTxRef: `TELEBIRR-SIM-${Date.now()}`,
        amount: result.paymentAmount
      }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      setResult(response.data.data || response.data);
      setError('');
      window.alert('Telebirr demo payment completed and sent to Finance.');
    } catch (paymentError) {
      setError(paymentError.response?.data?.message || 'Unable to process Telebirr payment.');
    }
  };

  const timelineEvents = result ? getTimelineEvents(result) : [];
  const isDigitalIdReady = result?.serviceType === 'NEW_ID_CARD'
    && ['APPROVED_BY_FINANCE', 'COMPLETED'].includes(result.status)
    && result.paymentStatus === 'Verified';

  return (
    <main className="track-page">
      <section className="track-card">
        <header className="track-header">
          <div className="track-header-copy">
            <span className="track-eyebrow">{text('E-KEBELE SERVICES', 'የኢ-ቀበሌ አገልግሎቶች')}</span>
            <h1>{text('Track your application', 'ማመልከቻዎን ይከታተሉ')}</h1>
            <p>{text('Check the latest status using your phone number or application ID.', 'የስልክ ቁጥርዎን ወይም የማመልከቻ መለያ ቁጥርዎን በመጠቀም የቅርብ ጊዜውን ሁኔታ ይመልከቱ።')}</p>
          </div>
        </header>

        <form onSubmit={handleSearch} className="track-search-form">
          <label htmlFor="track-query">
            {text('Application number, phone number, or ID', 'የማመልከቻ ቁጥር፣ ስልክ ወይም መለያ ቁጥር')}
          </label>
          <input
            id="track-query"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={text('e.g. EKB-2026-123456 or 0912345678', 'ለምሳሌ EKB-2026-123456 ወይም 0912345678')}
            autoComplete="off"
            aria-describedby={error ? 'track-error' : undefined}
          />
          <button type="submit" disabled={searching} className="track-search-button">
            {searching && <span className="track-spinner" aria-hidden="true" />}
            {searching ? text('Searching...', 'በመፈለግ ላይ...') : text('Search status', 'ሁኔታ ፈልግ')}
          </button>
        </form>

        <nav className="track-links">
          <Link to="/">{text('← Back to Home', '← ወደ መነሻ ገጽ')}</Link>
          <a href="mailto:support@example.com">{text('Contact Support', 'ድጋፍ ይጠይቁ')}</a>
        </nav>

        <div className="track-help-tip">
          <p>{text('Helpful tip', 'ጠቃሚ ምክር')}</p>
          <p>{text(
            'Double-check that you entered the phone number or application ID associated with your request.',
            'ካስገቡት የስልክ ወይም የማመልከቻ ቁጥር ትክክል መሆኑን ደግመው ያረጋግጡ።'
          )}</p>
        </div>

        {error && <div id="track-error" className="track-error" role="alert">{error}</div>}

        {result && (
          <div className="track-result">
            <p><strong>{text('Service', 'አገልግሎት')}:</strong> {getServiceLabel(result.serviceType)}</p>
            <p><strong>{text('Status', 'ሁኔታ')}:</strong> {getStatusLabel(result.status)}</p>
            <p><strong>{text('Name', 'ስም')}:</strong> {result.fullName || result.parentName || result.husbandName || result.childName || 'N/A'}</p>
            <p><strong>{text('Submitted', 'የቀረበበት ቀን')}:</strong> {new Date(result.createdAt).toLocaleString(isAmharic ? 'am-ET' : 'en-US')}</p>
            {visibleNotifications.length > 0 && <section aria-label={text('Application notifications', 'የማመልከቻ ማሳወቂያዎች')} style={{ margin: '18px 0', padding: '14px 16px', borderRadius: '12px', border: '1px solid #bfdbfe', background: '#eff6ff' }}>
              <h3 style={{ margin: '0 0 10px', color: '#1e3a8a' }}>{text('Notifications', 'ማሳወቂያዎች')}</h3>
              {visibleNotifications.map((item) => <article key={item._id} style={{ padding: '10px 0', borderTop: '1px solid #dbeafe' }}>
                <p style={{ margin: 0, color: '#1e3a8a' }}>{item.message}</p>
                <small style={{ color: '#475569' }}>{item.channel} {item.deliveryStatus === 'simulated' ? text('simulation recorded', 'የሙከራ መልእክት ተመዝግቧል') : text('not sent: phone number unavailable', 'ስልክ ቁጥር ስለሌለ አልተላከም')} · {new Date(item.createdAt).toLocaleString(isAmharic ? 'am-ET' : 'en-US')}</small>
              </article>)}
            </section>}
            {notificationError && <p role="status" style={{ color: '#b45309' }}>{notificationError}</p>}
            {isBirthRegistration && (
              <section className="tracker-workflow" aria-label={text('Birth registration progress', 'የልደት ምዝገባ ሂደት')}>
                <div className="tracker-workflow-heading">
                  <h3>{text('Birth registration progress', 'የልደት ምዝገባ ሂደት')}</h3>
                  <button
                    type="button"
                    className="tracker-refresh-button"
                    onClick={() => handleSearchWithValue(result.applicationId)}
                    disabled={searching}
                  >
                    {searching ? text('Refreshing...', 'በማደስ ላይ...') : text('Refresh status', 'ሁኔታውን አድስ')}
                  </button>
                </div>
                <ol className="tracker-workflow-steps">
                  {birthWorkflowSteps.map((step, index) => {
                    const isComplete = birthCertificateReady || birthStatus === 'COMPLETED' || index < birthStepIndex;
                    const isCurrent = !isComplete && index === birthStepIndex;
                    return (
                      <li
                        key={step}
                        className={`tracker-workflow-step${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}`}
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        <span className="tracker-workflow-marker" aria-hidden="true">{isComplete ? '✓' : index + 1}</span>
                        <span>{step}</span>
                      </li>
                    );
                  })}
                </ol>
                {birthStatus === 'NEEDS_CORRECTION' && (
                  <p className="tracker-workflow-note tracker-workflow-note--warning">
                    {text('Please submit the requested corrections before review can continue.', 'ምርመራው እንዲቀጥል እባክዎ የተጠየቁትን ማስተካከያዎች ያቅርቡ።')}
                  </p>
                )}
                {birthStatus === 'REJECTED' && (
                  <p className="tracker-workflow-note tracker-workflow-note--error">
                    {text('This application was rejected. Review the note below or contact your Kebele office.', 'ይህ ማመልከቻ ውድቅ ተደርጓል። ከታች ያለውን ምክንያት ይመልከቱ ወይም የቀበሌ ቢሮን ያነጋግሩ።')}
                  </p>
                )}
              </section>
            )}
            <section className="application-history" aria-label={text('Application history', 'የማመልከቻ ታሪክ')}>
              <h3>{text('Application History', 'የማመልከቻ ታሪክ')}</h3>
              <ol>
                {timelineEvents.map((event, index) => (
                  <li className={`history-event history-event--${event.status.toLowerCase()}`} key={`${event.status}-${event.changedAt || index}`}>
                    <span className={`history-marker${index === timelineEvents.length - 1 ? ' history-marker--current' : ''}`} aria-hidden="true" />
                    <div className="history-event-content">
                      <strong>{getStatusLabel(event.status)}</strong>
                      {event.changedAt && <time>{new Date(event.changedAt).toLocaleString(isAmharic ? 'am-ET' : 'en-US')}</time>}
                      {event.actorRole && event.actorRole !== 'current' && <span className="history-actor">{text(`By ${event.actorRole.replaceAll('-', ' ')}`, `በ${event.actorRole === 'officer' ? 'ኦፊሰር' : event.actorRole === 'finance' ? 'ፋይናንስ' : event.actorRole === 'admin' ? 'አስተዳዳሪ' : 'ተጠቃሚ'}`)}</span>}
                      {event.reason && <p>{event.reason}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
            {getFee() !== null && (
              <section className="tracker-payment-summary" aria-label={text('Payment summary', 'የክፍያ ማጠቃለያ')}>
                <div>
                  <span className="tracker-payment-label">
                    {paymentVerified && simulatedPayment
                      ? text('Demo amount (not a real payment)', 'የሙከራ መጠን (እውነተኛ ክፍያ አይደለም)')
                      : paymentVerified
                        ? text('Amount Paid', 'የተከፈለው ብር')
                      : paymentPendingVerification
                        ? text('Amount Submitted', 'የተላከው ክፍያ')
                        : text('Amount Due', 'የሚከፈለው ብር')}
                  </span>
                  <strong className="tracker-payment-amount">
                    {Number(paymentVerified || paymentPendingVerification ? result.amountPaid || getFee() : getFee()).toLocaleString()} {result.currency || 'ETB'}
                  </strong>
                </div>
                <span className={`payment-status-badge payment-status-badge--${paymentState.tone}`} role="status">
                  {paymentState.label}
                </span>
              </section>
            )}

            {paymentVerified && (
              <section id="payment-receipt" className="payment-receipt" aria-label={text('Payment receipt', 'የክፍያ ደረሰኝ')}>
                <div className="receipt-brand">E-Kebele Digital Services</div>
                <h2>{simulatedPayment ? text('Demo Payment Record', 'የሙከራ ክፍያ መዝገብ') : text('Payment Receipt', 'የክፍያ ደረሰኝ')}</h2>
                <p className="receipt-confirmed">{simulatedPayment
                  ? text('Finance verified the demo record; no real payment was processed.', 'ፋይናንስ የሙከራ መዝገቡን አረጋግጧል፤ እውነተኛ ክፍያ አልተፈጸመም።')
                  : text('Payment verified', 'ክፍያ ተረጋግጧል')}</p>
                <dl>
                  <div><dt>{text('Application Number', 'የማመልከቻ ቁጥር')}</dt><dd>{result.applicationId || 'N/A'}</dd></div>
                  <div><dt>{text('Applicant', 'አመልካች')}</dt><dd>{getReceiptApplicantName(result.fullName || result.parentName || result.husbandName || result.childName)}</dd></div>
                  <div><dt>{text('Service', 'አገልግሎት')}</dt><dd>{getServiceLabel(result.serviceType)}</dd></div>
                  <div><dt>{simulatedPayment ? text('Demo amount (not a real payment)', 'የሙከራ መጠን (እውነተኛ ክፍያ አይደለም)') : text('Amount Paid', 'የተከፈለው ብር')}</dt><dd>{Number(result.amountPaid || result.paymentAmount || 0).toLocaleString()} {result.currency || 'ETB'}</dd></div>
                  <div><dt>{text('Payment Method', 'የክፍያ ዘዴ')}</dt><dd>{getReceiptPaymentMethod(result.paymentMethod, result.paymentRef)}</dd></div>
                  <div><dt>{text('Transaction Reference', 'የግብይት ማጣቀሻ')}</dt><dd>{result.paymentRef || 'N/A'}</dd></div>
                  <div><dt>{text('Verified At', 'የተረጋገጠበት ጊዜ')}</dt><dd>{result.paymentVerifiedAt ? new Date(result.paymentVerifiedAt).toLocaleString(isAmharic ? 'am-ET' : 'en-US') : 'N/A'}</dd></div>
                </dl>
                <button type="button" className="receipt-print-button" onClick={handleReceiptDownload}>
                  {text('Download Receipt (PDF)', 'ደረሰኙን ያውርዱ (PDF)')}
                </button>
              </section>
            )}

            {result.status === 'COMPLETED' ? (
              <>
                <p style={{ marginTop: '16px', fontWeight: 700, color: '#064e3b' }}>
                  {text('Your document is ready. Download it below.', 'ሰነድዎ ዝግጁ ነው። ከታች ያውርዱ።')}
                </p>
                {isDigitalIdReady ? (
                  <button
                    type="button"
                    onClick={handleDigitalIdDownload}
                    disabled={digitalIdDownloading}
                    style={{ display: 'inline-block', padding: '12px 18px', backgroundColor: '#047857', color: 'white', borderRadius: '10px', border: 'none', cursor: digitalIdDownloading ? 'wait' : 'pointer', fontWeight: 700, marginTop: '12px', opacity: digitalIdDownloading ? 0.7 : 1 }}
                  >
                    {digitalIdDownloading ? text('Preparing PDF...', 'PDF በማዘጋጀት ላይ...') : text('Download Digital ID (PDF)', 'ዲጂታል መታወቂያ ያውርዱ (PDF)')}
                  </button>
                ) : (
                  <button
                    onClick={handleDownload}
                    style={{ display: 'inline-block', padding: '12px 18px', backgroundColor: '#047857', color: 'white', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, marginTop: '12px' }}
                  >
                    {text('Print / Save as PDF', 'አትም / እንደ PDF አስቀምጥ')}
                  </button>
                )}
                {result.serviceType === 'MARRIAGE_REGISTRATION' && result.applicationId && (
                  <div style={{ marginTop: '14px' }}>
                    <a href={`/marriage-certificate/${encodeURIComponent(result.applicationId)}`} style={{ display: 'inline-block', padding: '12px 18px', backgroundColor: '#0f172a', color: 'white', borderRadius: '10px', textDecoration: 'none' }}>
                      {text('View Marriage Certificate Preview', 'የጋብቻ ምስክር ወረቀት ቅድመ እይታ')}
                    </a>
                  </div>
                )}
                {result.serviceType === 'BIRTH_REGISTRATION' && result.applicationId && (
                  <div style={{ marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={handleBirthCertificateDownload}
                      disabled={birthCertificateDownloading}
                      style={{ display: 'inline-block', marginRight: '10px', padding: '12px 18px', backgroundColor: '#047857', color: 'white', border: 'none', borderRadius: '10px', cursor: birthCertificateDownloading ? 'wait' : 'pointer', fontWeight: 700, opacity: birthCertificateDownloading ? 0.7 : 1 }}
                    >
                      {birthCertificateDownloading
                        ? text('Preparing certificate PDF...', 'ሰርቲፊኬቱን PDF በማዘጋጀት ላይ...')
                        : text('Download Birth Certificate (PDF)', 'የልደት ሰርቲፊኬት አውርድ (PDF)')}
                    </button>
                    <a href={`/birth-certificate/${encodeURIComponent(result.applicationId)}`} style={{ display: 'inline-block', padding: '12px 18px', backgroundColor: '#0f172a', color: 'white', borderRadius: '10px', textDecoration: 'none' }}>
                      {text('View Birth Certificate', 'የልደት ምስክር ወረቀት ይመልከቱ')}
                    </a>
                  </div>
                )}
              </>
            ) : ['APPROVED_BY_OFFICER', 'Approved - Pending Payment'].includes(result.status) ? (
              <section className="tracker-payment-panel" aria-label="Payment options">
                <h3>{text('Complete payment', 'ክፍያ ይፈጽሙ')}</h3>
                <p role="status">{text('Your application is approved. Complete payment to continue.', 'ማመልከቻዎ ጸድቋል። ሂደቱን ለመቀጠል ክፍያ ይፈጽሙ።')}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                  <button onClick={handlePayment} style={{ padding: '12px 18px', backgroundColor: '#0f766e', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>{text('Pay with Chapa', 'በChapa ይክፈሉ')}</button>
                </div>
                <div style={{ marginTop: '14px', padding: '14px', border: '1px solid #bfdbfe', borderRadius: '10px', backgroundColor: '#eff6ff' }}>
                  <label htmlFor="telebirr-phone" style={{ display: 'block', marginBottom: '6px', color: '#1e3a8a', fontSize: '14px', fontWeight: 700 }}>
                    {text('Telebirr phone number', 'የቴሌብር ስልክ ቁጥር')}
                  </label>
                  <input
                    id="telebirr-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="09xxxxxxxx"
                    value={telebirrPhone}
                    onChange={(event) => {
                      setTelebirrPhone(event.target.value.replace(/\D/g, '').slice(0, 10));
                      setTelebirrPhoneError('');
                    }}
                    style={{ width: '100%', maxWidth: '320px', padding: '11px', border: `1px solid ${telebirrPhoneError ? '#dc2626' : '#93c5fd'}`, borderRadius: '8px', backgroundColor: telebirrPhoneError ? '#fef2f2' : 'white' }}
                  />
                  <small className="telebirr-hint">{text('Enter an Ethiopian mobile number beginning with 09 or 07.', '09 ወይም 07 የሚጀምር የኢትዮጵያ ሞባይል ቁጥር ያስገቡ።')}</small>
                  {telebirrPhoneError && <div style={{ marginTop: '5px', color: '#b91c1c', fontSize: '12px' }}>{telebirrPhoneError}</div>}
                  <button onClick={handleTelebirrPayment} style={{ display: 'block', marginTop: '10px', padding: '11px 18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>{text('Pay with Telebirr', 'በቴሌብር ይክፈሉ')}</button>
                </div>
              </section>
            ) : ['APPROVED_BY_FINANCE', 'Payment Verified'].includes(result.status) ? (
              <>
                <p role="status" style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '10px', background: '#eff6ff', color: '#1e40af', fontWeight: 700 }}>
                  {birthCertificateReady
                    ? text('Finance verified your payment. Your birth certificate is ready to download.', 'ፋይናንስ ክፍያዎን አረጋግጧል። የልደት ሰርቲፊኬትዎ ለማውረድ ዝግጁ ነው።')
                    : text('Payment verified. Your document is being prepared by the Kebele office.', 'ክፍያዎ ተረጋግጧል፤ ሰነድዎ በቀበሌ ቢሮ እየተዘጋጀ ነው።')}
                </p>
                {birthCertificateReady && (
                  <button
                    type="button"
                    onClick={handleBirthCertificateDownload}
                    disabled={birthCertificateDownloading}
                    style={{ display: 'inline-block', padding: '12px 18px', backgroundColor: '#047857', color: 'white', border: 'none', borderRadius: '10px', cursor: birthCertificateDownloading ? 'wait' : 'pointer', fontWeight: 700, marginTop: '12px', opacity: birthCertificateDownloading ? 0.7 : 1 }}
                  >
                    {birthCertificateDownloading
                      ? text('Preparing certificate PDF...', 'ሰርቲፊኬቱን PDF በማዘጋጀት ላይ...')
                      : text('Download Birth Certificate (PDF)', 'የልደት ሰርቲፊኬት አውርድ (PDF)')}
                  </button>
                )}
                {isDigitalIdReady && (
                  <button
                    type="button"
                    onClick={handleDigitalIdDownload}
                    disabled={digitalIdDownloading}
                    style={{ display: 'inline-block', padding: '12px 18px', backgroundColor: '#047857', color: 'white', borderRadius: '10px', border: 'none', cursor: digitalIdDownloading ? 'wait' : 'pointer', fontWeight: 700, marginTop: '12px', opacity: digitalIdDownloading ? 0.7 : 1 }}
                  >
                    {digitalIdDownloading ? text('Preparing PDF...', 'PDF በማዘጋጀት ላይ...') : text('Download Digital ID (PDF)', 'ዲጂታል መታወቂያ ያውርዱ (PDF)')}
                  </button>
                )}
              </>
            ) : result.status === 'REJECTED' ? (
              <p role="status" style={{ marginTop: '16px', padding: '14px 16px', borderRadius: '10px', background: '#fff7ed', color: '#9a3412', fontWeight: 700 }}>
                {text('Notification', 'ማሳወቂያ')}: {result.correctionReason || text('Please contact your Kebele office for details.', 'ለዝርዝር መረጃ እባክዎ የቀበሌ ቢሮዎን ያነጋግሩ።')}
              </p>
            ) : result.status === 'PAID_PENDING_FINANCE' ? (
              <p style={{ marginTop: '16px', fontWeight: 700, color: '#92400e' }}>{text('Payment received. Finance verification is pending.', 'ክፍያው ተቀብሏል፣ የፋይናንስ ማረጋገጫ ይጠበቃል።')}</p>
            ) : result.status === 'NEEDS_CORRECTION' ? (
              <div style={{ marginTop: '16px', padding: '16px', border: '1px solid #f0c879', borderRadius: '8px', backgroundColor: '#fff8e8' }}>
                <p role="status" style={{ marginTop: 0, fontWeight: 700, color: '#854d0e' }}>{text('Correction requested', 'ማስተካከያ ተጠይቋል')}</p>
                <p>{result.correctionReason || text('Please replace the unreadable or missing document.', 'የማይነበበውን ወይም የጎደለውን ሰነድ ይተኩ።')}</p>
                <form onSubmit={handleCorrectionUpload}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    {correctionDocumentFields
                      .filter(([field]) => {
                        if (field === 'previousIdDocument') return ['ID_RENEWAL', 'ID_REPLACEMENT'].includes(result.serviceType);
                        return !['releaseLetter', 'policeClearance'].includes(field) || (result.serviceType === 'NEW_ID_CARD' && result.isTransfer);
                      })
                      .map(([field, label]) => <label key={field} style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 600 }}>{localizeLabel(label)}<input type="file" name={field} accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => { const file = event.target.files?.[0]; if (file && !isSupportedUpload(file)) { event.target.value = ''; setError(text('Upload a JPG, PNG, or PDF file no larger than 5 MB.', 'እስከ 5 MB የሚደርስ JPG፣ PNG ወይም PDF ፋይል ይስቀሉ።')); return; } setCorrectionFiles((current) => ({ ...current, [field]: file || null })); }} /></label>)}
                  </div>
                  <button type="submit" disabled={correctionSubmitting} style={{ marginTop: '14px', padding: '11px 16px', border: 0, borderRadius: '6px', background: '#0f766e', color: 'white', fontWeight: 700, cursor: 'pointer' }}>{correctionSubmitting ? text('Uploading...', 'በመስቀል ላይ...') : text('Submit corrected documents', 'የተስተካከሉ ሰነዶችን ላክ')}</button>
                </form>
              </div>
            ) : result.status === 'PENDING_OFFICER' ? (
              <p style={{ marginTop: '16px', fontWeight: 700, color: '#92400e' }}>
                {text('Your application is waiting for officer review.', 'ማመልከቻዎ የሰራተኛ ምርመራ ይጠብቃል።')}
              </p>
            ) : result.status === 'Pending' ? (
              <p style={{ marginTop: '16px', fontWeight: 700, color: '#92400e' }}>
                {text('Your application is still pending. You will receive a notification once it is reviewed.', 'የማመልከቻዎ ሁኔታ እየተጠበቀ ነው። ከተገመገመ በኋላ ማሳወቂያ ይደርስዎታል።')}
              </p>
            ) : (
              <p style={{ marginTop: '16px', fontWeight: 700, color: '#991b1b' }}>
                {result.correctionReason && <><strong>{text('Review reason', 'የግምገማ ምክንያት')}:</strong> {result.correctionReason}<br /></>}
                {text('This application was rejected or requires correction. Please contact support.', 'ይህ ማመልከቻ ውድቅ ተደርጓል ወይም ማስተካከያ ይፈልጋል። እባክዎን ድጋፍን ያነጋግሩ።')}
              </p>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default TrackStatus;