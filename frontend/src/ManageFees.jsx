import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ManageFees() {
  const [fees, setFees] = useState([]);
  const [values, setValues] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.defaults.headers.common.Authorization = `Bearer ${localStorage.getItem('token')}`;
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
    <main style={{ minHeight: '100vh', background: '#f3f6fa', padding: '28px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <h1 style={{ margin: 0, color: '#172033', fontSize: 'clamp(1.4rem, 4vw, 2rem)' }}>Service Fee Adjustment</h1>
          <button type="button" onClick={() => navigate('/admin-dashboard')} style={{ border: 0, borderRadius: 6, padding: '10px 14px', background: '#475569', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Back to Dashboard</button>
        </header>
        <section style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: '0 4px 14px #17203318' }}>
          {message && <p style={{ marginTop: 0, padding: 12, borderRadius: 6, background: '#dcfce7', color: '#166534', fontWeight: 700 }}>{message}</p>}
          {error && <p style={{ marginTop: 0, padding: 12, borderRadius: 6, background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>{error}</p>}
          {fees.map((fee) => <form key={fee._id} onSubmit={(event) => updateFee(event, fee)} style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', alignItems: 'end', gap: 12, padding: '18px 0', borderBottom: '1px solid #e2e8f0' }}><label style={{ color: '#172033', fontWeight: 700 }}>{fee.serviceType}<small style={{ display: 'block', color: '#64748b', fontWeight: 400 }}>Current: {Number(fee.feeAmount).toFixed(2)} ETB</small></label><input type="number" min="0.01" step="0.01" required value={values[fee._id] ?? ''} onChange={(event) => setValues({ ...values, [fee._id]: event.target.value })} style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: '1px solid #cbd5e1', borderRadius: 6, fontWeight: 700 }} /><button type="submit" disabled={saving === fee._id} style={{ border: 0, borderRadius: 6, padding: '10px 14px', background: '#d99a00', color: '#172033', cursor: 'pointer', fontWeight: 800 }}>{saving === fee._id ? 'Saving...' : 'Update'}</button></form>)}
          {!fees.length && !error && <p style={{ color: '#64748b' }}>Loading service fees...</p>}
        </section>
      </div>
    </main>
  );
}

export default ManageFees;