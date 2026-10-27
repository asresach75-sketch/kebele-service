import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ManageFees.css';

function ManageFees() {
  const [fees, setFees] = useState([]);
  const [values, setValues] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.defaults.headers.common.Authorization = `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}`;
    axios.get('/api/fees')
      .then(({ data }) => {
        setFees(data);
        setValues(Object.fromEntries(data.map((fee) => [fee._id, fee.feeAmount])));
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load service fees.'));
  }, []);

  const updateFee = async (event, fee) => {
    event.preventDefault();
    if (!Number.isFinite(Number(values[fee._id])) || Number(values[fee._id]) <= 0) {
      setError('Service fee must be greater than zero.');
      return;
    }
    setSaving(fee._id); setMessage(''); setError('');
    try {
      const { data } = await axios.put(`/api/fees/${fee._id}`, { feeAmount: values[fee._id] });
      setFees((current) => current.map((item) => item._id === fee._id ? data.fee : item));
      setMessage(`${fee.serviceType} fee updated successfully.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update service fee.');
    } finally { setSaving(null); }
  };

  return (
    <div className="manage-fees-page">
      <header className="manage-fees-header">
        <div className="manage-fees-header-inner">
          <div className="manage-fees-brand">
            <span className="manage-fees-brand-mark" aria-hidden="true">ኢ</span>
            <div><strong>ኢ-ቀበሌ / E-Kebele</strong><span>Admin Portal</span></div>
          </div>
          <button type="button" onClick={() => navigate('/admin-dashboard')} className="manage-fees-dashboard-link">
            Dashboard
          </button>
        </div>
      </header>
      <main className="manage-fees-main">
        <div className="manage-fees-title">
          <div>
            <span className="manage-fees-eyebrow">FINANCE MANAGEMENT</span>
            <h1>Service Fee Adjustment / የአገልግሎት ክፍያ ማስተካከያ</h1>
            <p>Manage and update service fees for citizens.</p>
          </div>
          <button type="button" onClick={() => navigate('/admin-dashboard')} className="manage-fees-back-link">
            ← Back to Dashboard
          </button>
        </div>
        <section className="manage-fees-card" aria-label="Service fees">
          {message && <p className="manage-fees-message" role="status">{message}</p>}
          {error && <p className="manage-fees-error" role="alert">{error}</p>}
          {fees.map((fee) => <form key={fee._id} className="manage-fee-row" onSubmit={(event) => updateFee(event, fee)}><label>{fee.serviceType}<small>Current: {Number(fee.feeAmount).toFixed(2)} ETB</small></label><input type="number" min="0.01" step="0.01" required aria-label={`${fee.serviceType} fee in ETB`} value={values[fee._id] ?? ''} onChange={(event) => setValues({ ...values, [fee._id]: event.target.value })} /><button type="submit" disabled={saving === fee._id}>{saving === fee._id ? 'Saving...' : 'Update / አስተካክል'}</button></form>)}
          {!fees.length && !error && <p className="manage-fees-loading">Loading service fees...</p>}
        </section>
      </main>
      <footer className="manage-fees-footer">
        © 2026 E-Kebele Portal · የቀበሌ ዲጂታል አገልግሎት ስርዓት
      </footer>
    </div>
  );
}

export default ManageFees;