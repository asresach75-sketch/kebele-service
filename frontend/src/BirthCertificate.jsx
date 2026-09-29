import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const photoUrl = (photo) => {
  if (!photo) return '';
  const fileName = photo.replaceAll('\\', '/').split('/').pop();
  return `/uploads/${fileName}`;
};

const BirthCertificate = () => {
  const { applicationId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`/api/services/application/${applicationId}`)
      .then((response) => setCertificate(response.data))
      .catch((err) => setError(err.response?.data?.message || 'Unable to load birth certificate details.'));
  }, [applicationId]);

  if (error) {
    return <main className="birth-certificate-message"><h1>Birth Certificate / የልደት ማረጋገጫ</h1><p>{error}</p><Link to="/track">Back to Track / ወደ መከታተያ</Link></main>;
  }

  if (!certificate) return <main className="birth-certificate-message">Loading certificate...</main>;

  const childName = certificate.childFullName || certificate.childName || certificate.fullName || 'N/A';
  const registrationDate = certificate.registrationDate || certificate.createdAt;

  return (
    <main className="birth-certificate-page">
      <div className="birth-certificate-actions print-hidden">
        <Link to="/track">Back to Track / ወደ መከታተያ</Link>
        <button type="button" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      <section id="birth-certificate-print" className="birth-certificate-paper">
        <header className="birth-certificate-header">
          <img src="/ethiopia-flag.svg" alt="Flag of Ethiopia" />
          <div>
            <p>Federal Democratic Republic of Ethiopia</p>
            <p>Vital Events Registration Agency</p>
            <h1>BIRTH CERTIFICATE / የልደት ማረጋገጫ</h1>
          </div>
          <strong aria-hidden="true">BIRTH</strong>
        </header>

        <div className="birth-certificate-ribbon">Birth Registration Certificate / የልደት ምዝገባ ምስክር ወረቀት</div>

        <div className="birth-certificate-child">
          {certificate.webcamPhoto ? <img src={photoUrl(certificate.webcamPhoto)} alt="Child" /> : <div className="birth-photo-empty">Child Photo</div>}
          <div>
            <small>Child Name / የሕፃኑ ስም</small>
            <h2>{childName}</h2>
            <p><b>Event Type / የአገልግሎት ዓይነት:</b> Birth / ልደት</p>
            <p><b>Gender / ጾታ:</b> {certificate.gender || certificate.childGender || 'N/A'}</p>
          </div>
        </div>

        <section className="birth-certificate-details">
          <h2>Birth Details / የልደት ዝርዝር</h2>
          <div className="birth-details-grid">
            <p><b>Father's Name / የአባት ስም:</b><span>{certificate.fatherFullName || certificate.fatherName || 'N/A'}</span></p>
            <p><b>Father's Nationality / የአባት ዜግነት:</b><span>{certificate.fatherNationality || 'N/A'}</span></p>
            <p><b>Mother's Name / የእናት ስም:</b><span>{certificate.motherFullName || certificate.motherName || 'N/A'}</span></p>
            <p><b>Mother's Nationality / የእናት ዜግነት:</b><span>{certificate.motherNationality || 'N/A'}</span></p>
            <p><b>Date of Birth / የተወለደበት ቀን:</b><span>{certificate.dob || certificate.dateOfBirth || 'N/A'}</span></p>
            <p><b>Place of Birth / የተወለደበት ቦታ:</b><span>{certificate.pob || certificate.placeOfBirth || 'N/A'}</span></p>
            <p><b>Address / አድራሻ:</b><span>{[certificate.region, certificate.zone, certificate.wereda || certificate.woreda, certificate.country].filter(Boolean).join(', ') || 'N/A'}</span></p>
            <p><b>Phone Number / ስልክ ቁጥር:</b><span>{certificate.phone || certificate.phoneNumber || 'N/A'}</span></p>
            <p><b>Date of Registration / የተመዘገበበት ቀን:</b><span>{registrationDate ? new Date(registrationDate).toLocaleDateString() : 'N/A'}</span></p>
            <p><b>Application / Reg No:</b><span className="birth-certificate-id">{certificate.applicationId || 'N/A'}</span></p>
          </div>
        </section>

        <footer className="birth-certificate-footer">
          <div><p><b>Registrar Name / መዝጋቢው ስም:</b> {certificate.registrarName || 'Kebele Officer'}</p><small>Official Document Generated Electronically.</small></div>
          <div className="birth-signature"><span>________________________</span><b>Authorized Officer Signature</b></div>
          <div className="birth-stamp">OFFICIAL<br />STAMP</div>
        </footer>
      </section>

      <style>{`
        .birth-certificate-page { min-height: 100vh; padding: 36px 16px; background: #eef2f7; color: #182236; font-family: Arial, 'Noto Sans Ethiopic', sans-serif; }
        .birth-certificate-actions { display: flex; justify-content: space-between; max-width: 780px; margin: 0 auto 22px; gap: 12px; }
        .birth-certificate-actions a, .birth-certificate-actions button { padding: 12px 18px; border: 0; border-radius: 6px; color: #fff; background: #0b4d9c; font-weight: 700; text-decoration: none; cursor: pointer; }
        .birth-certificate-paper { max-width: 780px; margin: auto; padding: 30px 40px; border: 8px double #0f766e; background: #fff; box-shadow: 0 18px 40px rgba(15, 23, 42, .14); }
        .birth-certificate-header { display: grid; grid-template-columns: 78px 1fr 78px; align-items: center; gap: 16px; padding-bottom: 18px; border-bottom: 2px solid #d5a928; text-align: center; }
        .birth-certificate-header img { width: 70px; height: 48px; object-fit: cover; }
        .birth-certificate-header p { margin: 3px; font-weight: 700; font-size: 13px; }
        .birth-certificate-header h1 { margin: 12px 0 0; color: #104b9b; font-size: 21px; }
        .birth-certificate-header strong { color: #104b9b; font-size: 13px; }
        .birth-certificate-ribbon { width: fit-content; margin: 20px auto; padding: 9px 16px; color: #fff; background: #104b9b; font-size: 12px; font-weight: 700; }
        .birth-certificate-child { display: grid; grid-template-columns: 140px 1fr; align-items: center; gap: 24px; padding: 18px; border: 1px solid #d5dee9; background: #fbfcfe; }
        .birth-certificate-child img, .birth-photo-empty { display: grid; place-items: center; width: 130px; height: 155px; border: 3px solid #d5a928; object-fit: cover; color: #718096; background: #e8eef7; }
        .birth-certificate-child small { color: #64748b; font-size: 11px; font-weight: 700; }
        .birth-certificate-child h2 { margin: 8px 0 14px; color: #104b9b; font-size: 19px; }
        .birth-certificate-child p { margin: 8px 0; font-size: 13px; }
        .birth-certificate-details { margin-top: 20px; padding: 18px; border: 1px solid #d5dee9; background: #fbfcfe; }
        .birth-certificate-details h2 { margin: 0 0 14px; color: #104b9b; font-size: 17px; }
        .birth-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; border-top: 1px solid #d5dee9; padding-top: 14px; }
        .birth-details-grid p { margin: 0; font-size: 12px; line-height: 1.45; }
        .birth-details-grid b { display: block; color: #526174; font-size: 10px; }
        .birth-details-grid span { display: block; margin-top: 3px; font-weight: 600; overflow-wrap: anywhere; }
        .birth-certificate-id { color: #104b9b; font-family: monospace; }
        .birth-certificate-footer { display: grid; grid-template-columns: 1fr 1fr auto; align-items: end; gap: 18px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #cbd5e1; font-size: 11px; }
        .birth-certificate-footer p { margin: 0 0 8px; }
        .birth-certificate-footer small { color: #64748b; }
        .birth-signature { display: grid; gap: 4px; text-align: center; }
        .birth-stamp { display: grid; place-items: center; width: 64px; height: 64px; border: 2px solid #047857; border-radius: 50%; color: #047857; font-size: 9px; font-weight: 800; text-align: center; transform: rotate(-10deg); }
        .birth-certificate-message { max-width: 780px; margin: 40px auto; padding: 24px; font-family: Arial, sans-serif; }
        @media (max-width: 600px) { .birth-certificate-paper { padding: 20px; } .birth-certificate-header { grid-template-columns: 1fr; } .birth-certificate-header img, .birth-certificate-header strong { margin: auto; } .birth-certificate-child, .birth-details-grid, .birth-certificate-footer { grid-template-columns: 1fr; } .birth-certificate-child img, .birth-photo-empty { margin: auto; } }
        @media print { @page { size: A4 portrait; margin: 8mm; } *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } body * { visibility: hidden; } #birth-certificate-print, #birth-certificate-print * { visibility: visible; } .print-hidden, .sticky { display: none !important; } .birth-certificate-page { min-height: auto; padding: 0; background: #fff !important; } #birth-certificate-print { position: absolute; top: 0; left: 0; width: 100%; max-width: none; padding: 22px 28px; box-shadow: none; } .birth-certificate-child, .birth-certificate-details, .birth-certificate-footer { break-inside: avoid; } }
      `}</style>
    </main>
  );
};

export default BirthCertificate;
