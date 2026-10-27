import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import { isValidApplicantName, isValidEthiopianPhoneNumber } from './utils/idApplicationValidation';

const DigitalIDCard = () => {
  const { t } = useLanguage();
  const text = t;
  const location = useLocation();
  const application = location.state?.application || {};
  const documentPhotoUrl = (photo) => {
    if (!photo) return '';
    const normalizedPath = photo.replaceAll('\\', '/');
    const fileName = normalizedPath.split('/').pop();
    const folder = normalizedPath.includes('/marriage_docs/') ? 'marriage_docs/' : '';
    return `/uploads/${folder}${fileName}`;
  };
  const idNumber = application.nationalId || application.applicationId || 'N/A';
  const fullNameValue = application.fullName || application.childFullName || application.parentName || application.husbandName || application.wifeName || '';
  const fullName = fullNameValue
    ? isValidApplicantName(fullNameValue) ? fullNameValue : 'Update required'
    : 'N/A';
  const phoneValue = application.phoneNumber || application.phone || application.husbandPhone || application.wifePhone || '';
  const phone = phoneValue
    ? isValidEthiopianPhoneNumber(phoneValue) ? phoneValue : 'Update required'
    : 'N/A';
  const emergencyContactValue = application.emergencyContactName || application.emergencyCaller || application.emergencyContact || application.emergency_caller || application.emergency_contact || '';
  const emergencyContact = emergencyContactValue
    ? isValidApplicantName(emergencyContactValue) ? emergencyContactValue : 'Update required'
    : 'N/A';
  const emergencyPhoneValue = application.emergencyPhone || application.emergencyContactPhone || application.emergency_phone || application.emergency_contact_phone || '';
  const emergencyPhone = emergencyPhoneValue
    ? isValidEthiopianPhoneNumber(emergencyPhoneValue) ? emergencyPhoneValue : 'Update required'
    : 'N/A';
  const address = [application.region, application.zone, application.woreda, application.kebele].filter(Boolean).join(', ') || 'N/A';
  const issuedDate = new Date(application.completedAt || application.paymentVerifiedAt || application.createdAt || Date.now());
  const expiryDate = new Date(issuedDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + 5);
  const verifier = String(application.verifiedByName || application.paymentVerifiedBy || '').trim();
  const issuedBy = verifier
    ? verifier.includes('@') ? 'Finance Office' : verifier
    : 'E-Kebele Service Portal';
  const isVerifiedForPayment = application.paymentStatus === 'Verified'
    && ['APPROVED_BY_FINANCE', 'COMPLETED'].includes(application.status);

  const handlePrint = () => window.print();

  return (
    <main className="digital-id-page">
      <section id="printable-id-card" className="digital-id-card" aria-label="Digital ID card">
        <header className="digital-id-header">
          <div className="digital-id-flag" aria-hidden="true"><span /><span /><span /></div>
          <div>
            <h1>E-Kebele Service Portal</h1>
            <p>Digital Service ID · Not a national government ID</p>
          </div>
          <strong aria-hidden="true">ID</strong>
        </header>

        <div className="digital-id-body">
          <div className="digital-id-photo" aria-label="Applicant photo">
            {application.webcamPhoto || application.passportPhoto ? (
              <img src={documentPhotoUrl(application.webcamPhoto || application.passportPhoto)} alt="Applicant" />
            ) : fullName.charAt(0).toUpperCase()}
          </div>
          <div className="digital-id-details">
            <div><small>Full Name / ሙሉ ስም</small><b>{fullName}</b></div>
            <div className="digital-id-grid">
              <div><small>ID Number / የመታወቂያ ቁጥር</small><b className="digital-id-blue">{idNumber}</b></div>
              <div><small>Gender / ጾታ</small><b>{application.gender || 'N/A'}</b></div>
              <div><small>Date of Birth / የትውልድ ቀን</small><b>{application.dateOfBirth || application.dob || 'N/A'}</b></div>
              <div><small>Occupation / የሥራ ዘርፍ</small><b>{application.occupation || 'N/A'}</b></div>
              <div><small>Expiry Date / የሚያበቃበት ቀን</small><b>{expiryDate.toLocaleDateString()}</b></div>
              <div><small>Phone / ስልክ ቁጥር</small><b>{phone}</b></div>
              <div><small>Nationality / ዜግነት</small><b>{application.nationality || 'Ethiopian / ኢትዮጵያዊ'}</b></div>
              <div><small>Address / አድራሻ</small><b>{address}</b></div>
              <div><small>Emergency Contact / የአደጋ ጊዜ ተጠሪ</small><b>{emergencyContact}</b></div>
              <div><small>Emergency Phone / የአደጋ ጊዜ ስልክ</small><b>{emergencyPhone}</b></div>
              <div><small>Finance Verified By / ያረጋገጠው</small><b>{issuedBy}</b></div>
            </div>
          </div>
        </div>

        <footer className="digital-id-footer">
          <span>Issued: {issuedDate.toLocaleDateString()}</span>
          <span>E-Kebele portal record</span>
          {application.applicationId && isVerifiedForPayment && (
            <div className="digital-id-qr">
              <img src={`/api/services/verify-document/${encodeURIComponent(application.applicationId)}/qr`} alt="Scan to verify this digital ID" />
              <small>Scan to verify</small>
            </div>
          )}
          <span className={`digital-id-stamp${isVerifiedForPayment ? '' : ' digital-id-stamp--pending'}`}>
            <span>E-KEBELE</span>
            <span>{isVerifiedForPayment ? 'PORTAL VERIFIED' : 'NOT VERIFIED'}</span>
          </span>
        </footer>
      </section>

      <div className="digital-id-actions print-hidden">
        <Link to="/track" className="digital-id-back">{text.backTrack || 'Back to Track'}</Link>
        <button type="button" onClick={handlePrint} className="digital-id-print-button">
          Print / Download PDF / ማተሚያ
        </button>
      </div>

      <style>{`
        .digital-id-page { min-height: 100vh; padding: 40px 16px; background: #eef2f7; color: #172033; font-family: Arial, 'Noto Sans Ethiopic', sans-serif; }
        .digital-id-actions { display: flex; justify-content: space-between; gap: 16px; max-width: 680px; margin: 24px auto 0; }
        .digital-id-back, .digital-id-print-button { border: 0; border-radius: 6px; padding: 12px 18px; font-weight: 700; text-decoration: none; cursor: pointer; }
        .digital-id-back { color: #0b4d9c; background: #fff; }
        .digital-id-print-button { color: #fff; background: #0b4d9c; }
        .digital-id-card { width: min(100%, 680px); margin: 0 auto; overflow: hidden; border: 1px solid #b9c4d2; border-radius: 14px; background: #fff; box-shadow: 0 18px 45px rgba(15, 23, 42, .14); }
        .digital-id-header { display: flex; align-items: center; gap: 14px; padding: 18px 24px 14px; color: #fff; background: #0b5ed7; border-bottom: 4px solid #f4c430; }
        .digital-id-header h1 { margin: 0; font-size: 18px; }
        .digital-id-header p { margin: 5px 0 0; font-size: 12px; }
        .digital-id-header strong { margin-left: auto; font-size: 22px; }
        .digital-id-flag { display: flex; flex-direction: column; width: 44px; height: 30px; overflow: hidden; border: 1px solid #fff; }
        .digital-id-flag span { flex: 1; }
        .digital-id-flag span:nth-child(1) { background: #078930; }
        .digital-id-flag span:nth-child(2) { background: #fcd116; }
        .digital-id-flag span:nth-child(3) { background: #da121a; }
        .digital-id-body { display: grid; grid-template-columns: 150px 1fr; gap: 24px; padding: 28px; }
        .digital-id-photo { display: grid; place-items: center; width: 140px; height: 175px; border: 2px solid #0b4d9c; border-radius: 8px; color: #0b4d9c; background: #e8eef7; font-size: 56px; font-weight: 800; }
        .digital-id-photo img { width: 100%; height: 100%; object-fit: cover; }
        .digital-id-details small { display: block; margin-bottom: 4px; color: #65748b; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .digital-id-details b { display: block; font-size: 13px; overflow-wrap: anywhere; }
        .digital-id-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 12px; margin-top: 18px; }
        .digital-id-blue { color: #0b5ed7; }
        .digital-id-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 24px; border-top: 1px solid #d7dee8; color: #526174; font-size: 10px; }
        .digital-id-qr { display: grid; justify-items: center; gap: 3px; }
        .digital-id-qr img { display: block; width: 96px; height: 96px; }
        .digital-id-qr small { color: #526174; font-size: 8px; font-weight: 700; }
        .digital-id-stamp { display: grid; gap: 2px; padding: 9px 7px; border: 2px solid #059669; border-radius: 50%; color: #059669; font-size: 7px; font-weight: 800; text-align: center; transform: rotate(-10deg); }
        .digital-id-stamp--pending { border-color: #b45309; color: #b45309; }
        @media (max-width: 560px) { .digital-id-body { grid-template-columns: 1fr; } .digital-id-photo { margin: 0 auto; } .digital-id-header h1 { font-size: 14px; } .digital-id-grid { grid-template-columns: 1fr; } }
        @media print { @page { size: A4 portrait; margin: 12mm; } *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } body * { visibility: hidden; } #printable-id-card, #printable-id-card * { visibility: visible; } .print-hidden, .sticky { display: none !important; } .digital-id-page { min-height: auto; padding: 0; background: #fff !important; } #printable-id-card { position: absolute; left: 0; top: 0; width: 100%; max-width: 680px; box-shadow: none; } .digital-id-header { color: #fff !important; background: #0b5ed7 !important; border-bottom-color: #f4c430 !important; } .digital-id-flag { border-color: #fff !important; } .digital-id-flag span:nth-child(1) { background: #078930 !important; } .digital-id-flag span:nth-child(2) { background: #fcd116 !important; } .digital-id-flag span:nth-child(3) { background: #da121a !important; } .digital-id-photo { background: #e8eef7 !important; } .digital-id-stamp { color: #059669 !important; border-color: #059669 !important; } }
      `}</style>
    </main>
  );
};

export default DigitalIDCard;
