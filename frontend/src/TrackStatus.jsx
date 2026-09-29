import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const serviceLabels = {
  NEW_ID_CARD: 'New ID Card / አዲስ መታወቂያ ካርድ',
  ID_RENEWAL: 'ID Renewal / መታወቂያ ካርድ እድገት',
  BIRTH_REGISTRATION: 'Birth Registration / የልደት ምዝገባ',
  MARRIAGE_REGISTRATION: 'Marriage Registration / የጋብቻ ምዝገባ',
  DIVORCE_REGISTRATION: 'Divorce Registration / የፍቺ ምዝገባ',
  DEATH_REGISTRATION: 'Death Registration / የሞት ምዝገባ'
};

const feeMap = {
  NEW_ID_CARD: 200,
  ID_RENEWAL: 150,
  BIRTH_REGISTRATION: 80,
  MARRIAGE_REGISTRATION: 120,
  DIVORCE_REGISTRATION: 120,
  DEATH_REGISTRATION: 70
};

const statusLabels = {
  PENDING_OFFICER: 'Pending Officer Review / የሰራተኛ ምርመራ ይጠበቃል',
  APPROVED_BY_OFFICER: 'Approved by Officer / በሰራተኛ ጸድቋል',
  PAID_PENDING_FINANCE: 'Paid - Finance Review Pending / ክፍያ ተፈጽሟል፣ ፋይናንስ ይጠበቃል',
  APPROVED_BY_FINANCE: 'Approved by Finance / በፋይናንስ ጸድቋል',
  COMPLETED: 'Completed / ተጠናቋል',
  Approved: 'Approved / ተፈቀዷል',
  'Approved - Pending Payment': 'Approved - Pending Payment / ክፍያ ይጠበቃል',
  'Payment Verified': 'Payment Verified / ክፍያ ተረጋግጧል',
  Pending: 'Pending / በታጋዥ ላይ',
  Rejected: 'Rejected / ተቋርጧል'
};

function TrackStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [telebirrPhone, setTelebirrPhone] = useState('');
  const [telebirrPhoneError, setTelebirrPhoneError] = useState('');

  const handleSearchWithValue = async (value) => {
    setError('');

    const applicantName = (application) => application?.fullName || application?.applicantName || application?.parentName || application?.husbandName || application?.childName || 'N/A';
    const applicantPhone = (application) => application?.phoneNumber || application?.phone || application?.husbandPhone || application?.wifePhone || 'N/A';
    setResult(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/services/track`, {
        params: { query: value }
      });
      setResult(response.data.data || response.data);
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 404) {
        setError('No application found for that number or ID.');
      } else {
        setError('Unable to fetch status: ' + serverMessage);
      }
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

  const handleSearch = async (e) => {
    e.preventDefault();
    await handleSearchWithValue(query.trim());
  };

  const getServiceLabel = (type) => serviceLabels[type] || type;
  const getFee = (type) => feeMap[type] || null;
  const getStatusLabel = (status) => statusLabels[status] || status;
  
  const documentId = result?.applicationId || result?._id || result?.id;

  const handleDownload = () => {
    if (!documentId) {
      alert('Application ID is missing / የማመልከቻ መለያ ቁጥር አልተገኘም');
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

  const handlePayment = async () => {
    const token = localStorage.getItem('token');
    const authConfig = { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } };
    try {
      const response = await axios.post(`${API_BASE_URL}/api/services/payment/initiate`, { applicationId: result.applicationId, email: result.email, amount: getFee(result.serviceType) }, authConfig);
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
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/api/workflow/pay/${encodeURIComponent(result.applicationId)}`, {
        paymentMethod: 'Telebirr',
        paymentPhone: normalizedPhone,
        paymentTxRef: `TELEBIRR-SIM-${Date.now()}`,
        amount: getFee(result.serviceType) || result.paymentAmount || 200
      }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      setResult(response.data.data || response.data);
      setError('');
      window.alert('Telebirr demo payment completed and sent to Finance.');
    } catch (paymentError) {
      setError(paymentError.response?.data?.message || 'Unable to process Telebirr payment.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Arial, sans-serif', padding: '40px 16px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', backgroundColor: 'white', padding: '28px', borderRadius: '18px', boxShadow: '0 20px 40px rgba(15,23,42,0.08)' }}>
        <h1>Track Application Status / የማመልከቻ ሁኔታ መከታተል</h1>
        <p style={{ marginBottom: '18px', color: '#334155' }}>
          Enter your phone number or application ID to view your status. / የስልክ ቁጥርዎን ወይም የማመልከቻ ቁጥርዎን በመጻፍ ሁኔታዎን ይመልከቱ።
        </p>
        <form onSubmit={handleSearch} style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
            Application Number, Phone Number or ID / የማመልከቻ ቁጥር፣ ስልክ ወይም መለያ ቁጥር
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Application Number, Phone Number or ID / የማመልከቻ ቁጥር፣ ስልክ ወይም መለያ ቁጥር"
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '16px' }}
          />
          <button type="submit" style={{ padding: '12px 22px', backgroundColor: '#1d4ed8', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
            Search / ፈልግ
          </button>
        </form>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
          <Link to="/" style={{ color: '#1d4ed8', textDecoration: 'none' }}>← Back to Home</Link>
          <a href="mailto:support@example.com" style={{ color: '#1d4ed8', textDecoration: 'none' }}>
            Contact Support / ድጋፍ ይጠይቁ
          </a>
        </div>

        <div style={{ marginBottom: '22px', padding: '16px', borderRadius: '14px', backgroundColor: '#eef2ff', border: '1px solid #dbeafe' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Helpful Tip / ጠቃሚ ምክር:</p>
          <p style={{ margin: '8px 0 0', color: '#334155' }}>
            Please double-check the number you entered and make sure it matches your phone number or application ID. / እባክዎን ያስገቡትን ቁጥር ደግሞ ይፈትሹ፣ ስልክ ቁጥርዎ ወይም የማመልከቻ መታወቂያ እንዲሆን።
          </p>
        </div>

        {error && (
          <div style={{ marginTop: '20px', color: '#b91c1c', fontWeight: 600 }}>
            {error === 'No application found for that number or ID.'
              ? 'No Application Found / ምንም አይነት ማመልከቻ አልተገኘም'
              : error}
          </div>
        )}

        {result && (
          <div style={{ marginTop: '20px', padding: '22px', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1px solid #d1d5db' }}>
            <p><strong>Service:</strong> {getServiceLabel(result.serviceType)}</p>
            <p><strong>Status:</strong> {getStatusLabel(result.status)}</p>
            <p><strong>Name:</strong> {result.fullName || result.parentName || result.husbandName || result.childName || 'N/A'}</p>
            <p><strong>Submitted:</strong> {new Date(result.createdAt).toLocaleString()}</p>
            {getFee(result.serviceType) !== null && (
              <p><strong>Amount Due / የሚከፈለው ብር:</strong> {getFee(result.serviceType).toLocaleString()} birr</p>
            )}

            {['COMPLETED', 'Approved', 'Payment Verified', 'APPROVED_BY_FINANCE'].includes(result.status) ? (
              <>
                <p style={{ marginTop: '16px', fontWeight: 700, color: '#064e3b' }}>
                  Notification / ማሳወቂያ: Your document is ready. Download it below.
                </p>
                <button
                  onClick={handleDownload}
                  style={{ display: 'inline-block', padding: '12px 18px', backgroundColor: '#047857', color: 'white', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, marginTop: '12px' }}
                >
                  Print / Save as PDF / ሰነዱን ያውርዱ
                </button>
                {result.serviceType === 'MARRIAGE_REGISTRATION' && result.applicationId && (
                  <div style={{ marginTop: '14px' }}>
                    <a href={`/marriage-certificate/${encodeURIComponent(result.applicationId)}`} style={{ display: 'inline-block', padding: '12px 18px', backgroundColor: '#0f172a', color: 'white', borderRadius: '10px', textDecoration: 'none' }}>
                      View Marriage Certificate Preview
                    </a>
                  </div>
                )}
                {result.serviceType === 'BIRTH_REGISTRATION' && result.applicationId && (
                  <div style={{ marginTop: '14px' }}>
                    <a href={`/birth-certificate/${encodeURIComponent(result.applicationId)}`} style={{ display: 'inline-block', padding: '12px 18px', backgroundColor: '#0f172a', color: 'white', borderRadius: '10px', textDecoration: 'none' }}>
                      View Birth Certificate / የልደት ማረጋገጫ
                    </a>
                  </div>
                )}
              </>
            ) : ['APPROVED_BY_OFFICER', 'Approved - Pending Payment'].includes(result.status) ? (
              <p style={{ marginTop: '16px', fontWeight: 700, color: '#92400e' }}>
                Your application is approved. Please complete payment to continue. / ማመልከቻዎ ጸድቋል። ሂደቱን ለመቀጠል ክፍያ ይፈጽሙ።
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                  <button onClick={handlePayment} style={{ padding: '12px 18px', backgroundColor: '#0f766e', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>Pay with Chapa / በChapa ይክፈሉ</button>
                </div>
                <div style={{ marginTop: '14px', padding: '14px', border: '1px solid #bfdbfe', borderRadius: '10px', backgroundColor: '#eff6ff' }}>
                  <label htmlFor="telebirr-phone" style={{ display: 'block', marginBottom: '6px', color: '#1e3a8a', fontSize: '14px', fontWeight: 700 }}>
                    Telebirr phone number / የቴሌብር ስልክ ቁጥር
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
                  {telebirrPhoneError && <div style={{ marginTop: '5px', color: '#b91c1c', fontSize: '12px' }}>{telebirrPhoneError}</div>}
                  <button onClick={handleTelebirrPayment} style={{ display: 'block', marginTop: '10px', padding: '11px 18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}>Pay with Telebirr / በቴሌብር ይክፈሉ</button>
                </div>
              </p>
            ) : result.status === 'PAID_PENDING_FINANCE' ? (
              <p style={{ marginTop: '16px', fontWeight: 700, color: '#92400e' }}>Payment received. Finance verification is pending. / ክፍያው ተቀብሏል፣ የፋይናንስ ማረጋገጫ ይጠበቃል።</p>
            ) : result.status === 'APPROVED_BY_FINANCE' ? (
              <p style={{ marginTop: '16px', fontWeight: 700, color: '#92400e' }}>
                Finance approved your payment. The Admin is completing your document before printing. / ፋይናንስ ክፍያዎን አጽድቋል፣ አስተዳደሩ ሰነዱን ከማተም በፊት እያጠናቀቀ ነው።
              </p>
            ) : result.status === 'PENDING_OFFICER' ? (
              <p style={{ marginTop: '16px', fontWeight: 700, color: '#92400e' }}>
                Your application is waiting for officer review. / ማመልከቻዎ የሰራተኛ ምርመራ ይጠብቃል።
              </p>
            ) : result.status === 'Pending' ? (
              <p style={{ marginTop: '16px', fontWeight: 700, color: '#92400e' }}>
                Your application is still pending. You will receive a notification once it is reviewed. / የማመልከቻዎ ሁኔታ እድሳት ላይ ነው። እባክዎን እንደገና ይፈትሹ።
              </p>
            ) : (
              <p style={{ marginTop: '16px', fontWeight: 700, color: '#991b1b' }}>
                This application was rejected or requires correction. Please contact support. / ይህ ማመልከቻ ተቋርጧል ወይም ማስተካከያ ይፈልጋል። እባክዎን ድጋፍን ይጠይቁ።
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackStatus;