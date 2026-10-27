import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const VerifyDocument = () => {
  const { applicationId } = useParams();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const verify = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(
          `/api/services/verify-document/${encodeURIComponent(applicationId)}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Unable to verify document.');
        setVerification(data);
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    verify();
    return () => controller.abort();
  }, [applicationId]);

  return (
    <main style={{ maxWidth: 680, margin: '8vh auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <section style={{ padding: 28, border: '1px solid #dbe3ee', borderRadius: 16, background: '#fff', boxShadow: '0 12px 32px rgba(15, 23, 42, .08)' }}>
        <p style={{ margin: 0, color: '#2563eb', fontSize: 12, fontWeight: 800, letterSpacing: '.12em' }}>E-KEBELE DOCUMENT VERIFICATION</p>
        <h1 style={{ margin: '12px 0 20px', color: '#0f172a', fontSize: 26 }}>Verify an official document</h1>
        {loading && <p role="status">Checking the document against the E-Kebele registry...</p>}
        {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
        {!loading && !error && verification?.verified && (
          <div role="status">
            <p style={{ color: '#15803d', fontWeight: 800 }}>✓ Document verified</p>
            <dl style={{ display: 'grid', gridTemplateColumns: 'minmax(130px, .5fr) 1fr', gap: 12 }}>
              <dt>Application ID</dt><dd>{verification.applicationId}</dd>
              {verification.fullName && <><dt>Name</dt><dd>{verification.fullName}</dd></>}
              {verification.nationalId && <><dt>ID Number</dt><dd>{verification.nationalId}</dd></>}
              <dt>Service</dt><dd>{String(verification.serviceType || '').replaceAll('_', ' ')}</dd>
              <dt>Status</dt><dd>{verification.status}</dd>
              <dt>Issued</dt><dd>{verification.issuedAt ? new Date(verification.issuedAt).toLocaleString() : 'Not recorded'}</dd>
              {verification.expiresAt && <><dt>Expires</dt><dd>{new Date(verification.expiresAt).toLocaleDateString()}</dd></>}
            </dl>
          </div>
        )}
        {!loading && !error && verification && !verification.verified && (
          <p role="alert" style={{ color: '#b91c1c' }}>{verification.message}</p>
        )}
        <p style={{ marginTop: 24 }}><Link to="/">Return to E-Kebele Portal</Link></p>
      </section>
    </main>
  );
};

export default VerifyDocument;
