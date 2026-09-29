import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './MarriageCertificate.css';
import './MarriageCertificatePrint.css';

const documentPhotoUrl = (photo) => {
  if (!photo) return '';
  const normalizedPath = photo.replaceAll('\\', '/');
  const fileName = normalizedPath.split('/').pop();
  const folder = normalizedPath.includes('/marriage_docs/') ? 'marriage_docs/' : '';
  return `/uploads/${folder}${fileName}`;
};

function MarriageCertificate() {
  const { applicationId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState('');
  const printRef = useRef();

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await axios.get(`/api/services/application/${applicationId}`);
        setCertificate(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load certificate details.');
      }
    };
    fetchCertificate();
  }, [applicationId]);

  const handlePrint = () => {
    window.print();
  };

  if (error) {
    return (
      <div style={{ maxWidth: 760, margin: '40px auto', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Marriage Certificate Preview</h1>
        <p style={{ color: '#b91c1c' }}>{error}</p>
        <Link to="/track" style={{ color: '#1d4ed8' }}>← Back to Track</Link>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div style={{ maxWidth: 760, margin: '40px auto', padding: '24px', fontFamily: 'Arial, sans-serif' }}>
        <p>Loading certificate preview...</p>
      </div>
    );
  }

  return (
    <div className="certificate-page">
      <div className="certificate-paper" ref={printRef}>
        <div className="certificate-header">
          <img src="/ethiopia-flag.svg" alt="Flag of Ethiopia" className="ethiopia-flag" />
          <div><p>Federal Democratic Republic of Ethiopia</p><p>Vital Events Registration Agency</p><h1>MARRIAGE CERTIFICATE</h1><h2>የጋብቻ ማረጋገጫ</h2></div>
          <div className="agency-mark">VERA<span>OFFICIAL</span></div>
        </div>

        <div className="certificate-ribbon">MARRIAGE REGISTRATION CERTIFICATE / የጋብቻ ምዝገባ ማረጋገጫ</div>
        <div className="certificate-parties">
          <div className="party-card">
            <h2>Husband / ባል</h2>
            {certificate.husbandPhoto ? (
              <img src={documentPhotoUrl(certificate.husbandPhoto)} alt="Husband Photo" className="party-photo" />
            ) : (
              <div className="party-photo photo-empty">Husband Photo</div>
            )}
            <p><strong>Name:</strong> {certificate.husbandName || 'N/A'}</p>
            <p><strong>ID No:</strong> {certificate.husbandId || 'N/A'}</p>
            <p><strong>Phone:</strong> {certificate.husbandPhone || 'N/A'}</p>
          </div>
          <div className="party-card">
            <h2>Wife / ሚስት</h2>
            {certificate.wifePhoto ? (
              <img src={documentPhotoUrl(certificate.wifePhoto)} alt="Wife Photo" className="party-photo" />
            ) : (
              <div className="party-photo photo-empty">Wife Photo</div>
            )}
            <p><strong>Name:</strong> {certificate.wifeName || 'N/A'}</p>
            <p><strong>ID No:</strong> {certificate.wifeId || 'N/A'}</p>
            <p><strong>Phone:</strong> {certificate.wifePhone || 'N/A'}</p>
          </div>
        </div>

        <div className="certificate-details">
          <h2>Marriage Details / የጋብቻ ዝርዝር</h2>
          <p><strong>Marriage Type / የጋብቻ አይነት:</strong> {certificate.marriageType || 'N/A'}</p>
          <p><strong>Event Date / የተፈጸመበት ቀን:</strong> {certificate.marriageDate || 'N/A'}</p>
          <p><strong>Place of Event / የክስተት ቦታ:</strong> {certificate.placeOfMarriage || 'N/A'}</p>
          <p><strong>Application ID:</strong> {certificate.applicationId}</p>
          <p className="status-section"><strong>Status:</strong> {certificate.status}</p>
        </div>
        <div className="certificate-witnesses witnesses-section">
          <h2>Witnesses / ምስክሮች</h2>
          <p><strong>Husband's Witness:</strong> {certificate.witness1Name || certificate.husbandWitness || 'N/A'}{certificate.witness1Id ? ` (ID: ${certificate.witness1Id})` : ''}</p>
          <p><strong>Wife's Witness:</strong> {certificate.witness2Name || certificate.wifeWitness || 'N/A'}{certificate.witness2Id ? ` (ID: ${certificate.witness2Id})` : ''}</p>
          <p><strong>Third Witness:</strong> {certificate.witness3Name || certificate.thirdWitness || 'N/A'}{certificate.witness3Id ? ` (ID: ${certificate.witness3Id})` : ''}</p>
        </div>
        <div className="certificate-footer"><div><span className="signature-line">Authorized Signature</span><small>Registrar / መዝጋቢ</small></div><div className="official-stamp">✓<span>OFFICIAL<br />VERIFIED</span></div><div><span className="signature-line">Official Seal</span><small>Agency Officer</small></div></div>
      </div>

      <div className="certificate-actions">
        <button onClick={handlePrint}>Print / Save as PDF</button>
        <Link to="/track">Back to Track / ወደ መከታተያ</Link>
      </div>
    </div>
  );
}

export default MarriageCertificate;
