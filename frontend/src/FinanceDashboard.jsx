import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FinanceDashboard.css';
import './FinanceImage.css';

const vitalTypes = ['BIRTH_REGISTRATION', 'MARRIAGE_REGISTRATION', 'DIVORCE_REGISTRATION', 'DEATH_REGISTRATION'];
const label = (type) => (type || 'Application').replaceAll('_', ' ').toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase());
const nameOf = (item) => item.fullName || item.childFullName || item.childName || item.husbandName || item.wifeName || item.parentName || item.deceasedName || item.applicantName || 'Unknown applicant';
const phoneOf = (item) => item.phoneNumber || item.phone || item.husbandPhone || item.wifePhone || 'Not provided';

function FinanceDashboard() {
  const [applications, setApplications] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadingRequest = useRef(false);
  const navigate = useNavigate();

  const loadApplications = async () => {
    if (loadingRequest.current) return;
    loadingRequest.current = true;
    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch('/api/services/all', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load payment records');
      setApplications(Array.isArray(data) ? data : []);
      setError('');
    } catch (requestError) { setError(requestError.name === 'AbortError' ? 'The payment service took too long to respond.' : requestError.message); } finally { window.clearTimeout(timeout); loadingRequest.current = false; setLoading(false); }
  };

  useEffect(() => {
    loadApplications();
    const refresh = () => loadApplications();
    window.addEventListener('focus', refresh);
    const interval = window.setInterval(refresh, 15000);
    return () => {
      window.removeEventListener('focus', refresh);
      window.clearInterval(interval);
    };
  }, []);

  const paymentApplications = useMemo(() => {
    const unique = new Map();
    applications
      .filter((item) => item.applicationId && ['Pending', 'PENDING_OFFICER', 'Approved', 'Approved - Pending Payment', 'APPROVED_BY_OFFICER', 'PAID_PENDING_FINANCE', 'Payment Verified', 'APPROVED_BY_FINANCE', 'COMPLETED'].includes(item.status))
      .forEach((item) => unique.set(item.applicationId, item));
    return Array.from(unique.values());
  }, [applications]);
  const paymentPending = useMemo(() => paymentApplications.filter((item) => ['PAID_PENDING_FINANCE', 'Approved - Pending Payment', 'Payment Pending'].includes(item.status) && item.paymentStatus !== 'Verified'), [paymentApplications]);
  const receipts = useMemo(() => paymentApplications.filter((item) => item.paymentStatus === 'Verified' || ['Payment Verified', 'APPROVED_BY_FINANCE', 'COMPLETED'].includes(item.status)), [paymentApplications]);
  const today = new Date();
  const sameDay = (date) => { const value = new Date(date); return value.toDateString() === today.toDateString(); };
  const sameMonth = (date) => { const value = new Date(date); return value.getFullYear() === today.getFullYear() && value.getMonth() === today.getMonth(); };
  const revenue = (items) => items.reduce((total, item) => total + Number(item.paymentAmount || 0), 0);

  const verifyPayment = async (id) => {
    try {
      const response = await fetch(`/api/services/update-status/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify({ status: 'Payment Verified' }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Payment verification failed');
      setApplications((items) => items.map((item) => item._id === id ? data : item));
    } catch (requestError) { window.alert(requestError.message); }
  };

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('userInfo'); localStorage.removeItem('role'); navigate('/login'); };
  const printReceipt = (item) => setSelectedReceipt(item);
  const handlePrint = () => window.print();
  const row = (item, showVerify) => <tr key={item._id}><td className="finance-id">{item.applicationId || item._id?.slice(-8)}</td><td><strong>{nameOf(item)}</strong></td><td>{phoneOf(item)}</td><td>{label(item.serviceType)}</td><td><span className={`finance-status ${item.paymentStatus === 'Verified' || item.status === 'Payment Verified' ? 'verified' : 'unpaid'}`}>{item.paymentStatus === 'Verified' || item.status === 'Payment Verified' ? 'Payment Verified' : 'Unpaid'}</span></td><td>{showVerify ? <button className="verify-button" onClick={() => verifyPayment(item._id)}>Verify Payment</button> : <button className="receipt-button" onClick={() => printReceipt(item)}>Print Receipt</button>}</td></tr>;

  return <div className="finance-dashboard"><header className="finance-header"><div className="finance-brand"><span className="finance-mark">₣</span><span>E-Kebele<small>FINANCE MODULE</small></span></div><div className="finance-user"><span>Welcome, <strong>Finance Officer</strong></span><button onClick={logout}>↪ Logout</button></div></header><main className="finance-main"><div className="finance-title"><div><p className="finance-eyebrow">REVENUE CONTROL / PAYMENT VERIFICATION</p><h1>Finance &amp; Payment Officer Dashboard</h1><p>Review pending payment records and confirm successful transactions.</p></div><button className="finance-refresh" onClick={loadApplications}>↻ Refresh</button></div>{loading && <div className="finance-message">Loading payment records...</div>}{error && <div className="finance-message finance-error">{error}</div>}{!loading && !error && <><section className="finance-panel"><div className="finance-panel-title"><div><h2>Payment Verification</h2><p>Approve payment records after receiving the applicant's payment.</p></div><span>{paymentPending.length} pending</span></div><div className="finance-table"><table><thead><tr><th>App ID</th><th>Applicant Name</th><th>Phone</th><th>Service Type</th><th>Payment Status</th><th>Action</th></tr></thead><tbody>{paymentPending.length ? paymentPending.map((item) => row(item, true)) : <tr><td colSpan="6" className="finance-empty">No pending payment records.</td></tr>}</tbody></table></div></section><section className="finance-panel"><div className="finance-panel-title"><div><h2>Receipts</h2><p>Completed payment transactions ready for receipt printing.</p></div><span>{receipts.length} verified</span></div><div className="finance-table"><table><thead><tr><th>App ID</th><th>Applicant Name</th><th>Service Type</th><th>Status</th><th>Action</th></tr></thead><tbody>{receipts.length ? receipts.map((item) => <tr key={item._id}><td className="finance-id">{item.applicationId || item._id?.slice(-8)}</td><td>{nameOf(item)}</td><td>{label(item.serviceType)}</td><td><span className="finance-status verified">Payment Verified</span></td><td><button className="receipt-button" onClick={() => printReceipt(item)}>Print Receipt</button></td></tr>) : <tr><td colSpan="5" className="finance-empty">No verified receipts yet.</td></tr>}</tbody></table></div></section><section className="revenue-grid"><div className="revenue-card"><span>Today's Revenue</span><strong>{revenue(receipts.filter((item) => sameDay(item.paymentVerifiedAt || item.updatedAt))).toFixed(2)} ETB</strong></div><div className="revenue-card monthly"><span>Monthly Revenue</span><strong>{revenue(receipts.filter((item) => sameMonth(item.paymentVerifiedAt || item.updatedAt))).toFixed(2)} ETB</strong></div><div className="revenue-card report"><span>Revenue Reports</span><strong>Daily and monthly totals</strong><p>Track completed ID and payment transactions.</p></div></section></>}</main>{selectedReceipt && <div className="receipt-modal"><div className="receipt-dialog"><div id="printable-receipt" className="printable-receipt"><div className="receipt-heading"><h2>E-KEBELE SERVICE PORTAL</h2><p>Official Payment Receipt / የክፍያ ደረሰኝ</p></div><div className="receipt-details"><div><span>Receipt No / ID:</span><strong>{selectedReceipt.applicationId || selectedReceipt._id}</strong></div><div><span>Applicant Name:</span><strong>{nameOf(selectedReceipt)}</strong></div><div><span>Service Type:</span><strong>{label(selectedReceipt.serviceType)}</strong></div><div><span>Payment Status:</span><strong className="receipt-paid">Payment Verified</strong></div><div><span>Date Paid:</span><strong>{new Date(selectedReceipt.paymentVerifiedAt || selectedReceipt.updatedAt || selectedReceipt.createdAt).toLocaleDateString()}</strong></div><div className="receipt-total"><span>Total Amount Paid:</span><strong>{Number(selectedReceipt.paymentAmount || 0).toFixed(2)} ETB</strong></div></div><div className="receipt-footer"><p>Generated by E-Kebele Finance System</p><p>Thank you for using digital Kebele services!</p></div></div><div className="receipt-controls"><button onClick={() => setSelectedReceipt(null)}>Close</button><button className="print-now" onClick={handlePrint}>🖨 Print Now</button></div></div></div>}</div>;
}

export default FinanceDashboard;
