import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import { jsPDF } from 'jspdf';
import {
  getReceiptsInDateRange,
  getRevenueChartSeries,
  getVerifiedPaymentDate,
  localDateKey,
  sumReceiptAmounts,
} from './utils/financeMetrics';
import { exportExcelReport, exportPdfReport } from './utils/reportExport';
import {
  getReceiptApplicantName,
  getReceiptPaymentMethod,
  getRealPaymentReceipts,
  isSimulatedPayment,
} from './utils/paymentReceipt';
import './FinanceDashboard.css';
import './FinanceDashboardModern.css';
import './FinanceImage.css';

const label = (type) => (type || 'Application')
  .replaceAll('_', ' ')
  .toLowerCase()
  .replace(/(^| )\w/g, (letter) => letter.toUpperCase());

const nameOf = (item) => item.fullName || item.childFullName || item.childName
  || item.husbandName || item.wifeName || item.parentName || item.deceasedName
  || item.applicantName || 'Unknown applicant';

const phoneOf = (item) => item.phoneNumber || item.phone || item.husbandPhone
  || item.wifePhone || 'Not provided';
function FinanceDashboard() {
  const [applications, setApplications] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState('');
  const [chartInterval, setChartInterval] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => localDateKey(new Date()));
  const [dateTo, setDateTo] = useState(() => localDateKey(new Date()));
  const loadingRequest = useRef(false);
  const previousApplicationIds = useRef(null);
  const navigate = useNavigate();
  const { lang, toggleLanguage } = useLanguage();
  const isAmharic = lang === 'am';
  const text = (english, amharic) => isAmharic ? amharic : english;

  const loadApplications = async () => {
    if (loadingRequest.current) return;
    loadingRequest.current = true;
    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('/api/services/all', {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}` },
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load payment records');
      const nextApplications = Array.isArray(data) ? data : [];
      const previousIds = previousApplicationIds.current;
      const nextIds = new Set(nextApplications.map((item) => item._id).filter(Boolean));
      if (previousIds) {
        const newApplications = nextApplications.filter((item) => item._id && !previousIds.has(item._id));
        if (newApplications.length) {
          setNotifications((current) => [
            ...newApplications.map((item) => ({
              id: item._id,
              applicationId: item.applicationId,
              name: nameOf(item),
              createdAt: item.createdAt,
            })),
            ...current,
          ].slice(0, 10));
        }
      }
      previousApplicationIds.current = nextIds;
      setApplications(nextApplications);
      setError('');
    } catch (requestError) {
      setError(requestError.name === 'AbortError'
        ? 'The payment service took too long to respond.'
        : requestError.message);
    } finally {
      window.clearTimeout(timeout);
      loadingRequest.current = false;
      setLoading(false);
    }
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
      .filter((item) => item.applicationId && [
        'Pending', 'PENDING_OFFICER', 'Approved', 'Approved - Pending Payment',
        'APPROVED_BY_OFFICER', 'PAID_PENDING_FINANCE', 'Payment Verified',
        'APPROVED_BY_FINANCE', 'COMPLETED',
      ].includes(item.status))
      .forEach((item) => unique.set(item.applicationId, item));
    return Array.from(unique.values());
  }, [applications]);

  const paymentPending = useMemo(
    () => paymentApplications.filter((item) => [
      'PAID_PENDING_FINANCE', 'Approved - Pending Payment', 'Payment Pending',
    ].includes(item.status) && item.paymentStatus !== 'Verified'),
    [paymentApplications],
  );

  const receipts = useMemo(
    () => paymentApplications.filter((item) => item.paymentStatus === 'Verified'
      || ['Payment Verified', 'APPROVED_BY_FINANCE', 'COMPLETED'].includes(item.status)),
    [paymentApplications],
  );
  const realPaymentReceipts = useMemo(
    () => getRealPaymentReceipts(receipts),
    [receipts],
  );

  const today = new Date();
  const todayKey = localDateKey(today);
  const filteredRevenueReceipts = getReceiptsInDateRange(realPaymentReceipts, dateFrom, dateTo);
  const revenueChart = useMemo(
    () => getRevenueChartSeries(realPaymentReceipts, chartInterval, new Date(`${todayKey}T00:00:00`)),
    [realPaymentReceipts, chartInterval, todayKey],
  );
  const maxRevenue = Math.max(...revenueChart.map((bucket) => bucket.amount), 0);

  const verifyPayment = async (id) => {
    setVerifyingPaymentId(id);
    try {
      const response = await fetch(`/api/services/update-status/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: 'Payment Verified' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Payment verification failed');
      setApplications((items) => items.map((item) => (item._id === id ? data : item)));
      setSelectedPayment(null);
    } catch (requestError) {
      window.alert(requestError.message);
    } finally {
      setVerifyingPaymentId('');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const downloadReceipt = (item) => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const receiptDate = getVerifiedPaymentDate(item);
    const amount = sumReceiptAmounts([item]);
    const reference = item.paymentRef || 'Not recorded';
    const paymentMethod = getReceiptPaymentMethod(item.paymentMethod, item.paymentRef);
    const simulatedPayment = isSimulatedPayment(item.paymentMethod, item.paymentRef);
    const rows = [
      ['Receipt / Application ID', item.applicationId || item._id],
      ['Applicant', getReceiptApplicantName(nameOf(item))],
      ['Phone', phoneOf(item)],
      ['Service', label(item.serviceType)],
      ['Payment method', paymentMethod],
      ['Transaction reference', reference],
      ['Payment status', simulatedPayment ? 'Finance Verified (Demo)' : 'Verified'],
      ['Date paid', receiptDate ? receiptDate.toLocaleString() : 'Not recorded'],
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
      const wrappedValue = pdf.splitTextToSize(String(value || 'Not provided'), pageWidth - 84);
      pdf.text(wrappedValue, 78, y);
      y += Math.max(12, wrappedValue.length * 5 + 4);
      pdf.setDrawColor(220, 228, 238);
      pdf.line(18, y - 4, pageWidth - 18, y - 4);
    });

    y += 6;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    const amountLabel = simulatedPayment ? 'DEMO AMOUNT (NOT A REAL PAYMENT)' : 'TOTAL PAID';
    pdf.text(`${amountLabel}: ${amount.toLocaleString()} ETB`, 18, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      simulatedPayment
        ? 'This simulated transaction was recorded for testing and was not processed by a payment gateway.'
        : 'Generated by E-Kebele Finance System',
      18,
      Math.min(y + 20, 280),
      { maxWidth: pageWidth - 36 }
    );
    const safeId = String(item.applicationId || item._id || 'payment').replace(/[^a-z0-9_-]/gi, '-');
    pdf.save(`E-Kebele-Receipt-${safeId}.pdf`);
  };

  const filteredPending = paymentPending.filter((item) => {
    const query = searchTerm.trim().toLowerCase();
    const haystack = `${item.applicationId || ''} ${nameOf(item)} ${phoneOf(item)} ${label(item.serviceType)}`.toLowerCase();
    return !query || haystack.includes(query);
  });

  const filteredReceipts = receipts.filter((item) => {
    const query = searchTerm.trim().toLowerCase();
    const haystack = `${item.applicationId || ''} ${nameOf(item)} ${phoneOf(item)} ${label(item.serviceType)}`.toLowerCase();
    return !query || haystack.includes(query);
  });
  const reportReceipts = getReceiptsInDateRange(
    getRealPaymentReceipts(filteredReceipts),
    dateFrom,
    dateTo,
  );

  const exportRevenueReport = (format) => {
    const headers = ['Application ID', 'Applicant', 'Phone', 'Service', 'Payment Reference', 'Payment Date', 'Amount (ETB)'];
    const rows = reportReceipts.map((item) => [
      item.applicationId || item._id || '',
      nameOf(item),
      phoneOf(item),
      label(item.serviceType),
      item.paymentRef || 'Not recorded',
      getVerifiedPaymentDate(item)?.toLocaleDateString() || 'Not recorded',
      sumReceiptAmounts([item]).toFixed(2),
    ]);
    const fileName = `ekebele-revenue-${dateFrom || 'all'}-to-${dateTo || 'all'}`;
    const title = `E-Kebele Revenue Report (${dateFrom || 'All dates'} - ${dateTo || 'All dates'})`;

    if (format === 'pdf') {
      exportPdfReport({ title, fileName, headers, rows });
    } else {
      exportExcelReport({ fileName, sheetName: 'Revenue', headers, rows });
    }
  };

  const summaryCards = [
    { label: text('Total Applications', 'Нийт хүсэлт'), value: applications.length, tone: 'total', icon: '▤' },
    { label: text('Verified Payments', 'Баталгаажсан төлбөр'), value: receipts.length, tone: 'verified', icon: '✓' },
    { label: text('Pending Payments', 'Хүлээгдэж буй төлбөр'), value: paymentPending.length, tone: 'pending', icon: '◷' },
    {
      label: text("Today's Revenue", 'Өнөөдрийн орлого'),
      value: `${sumReceiptAmounts(realPaymentReceipts.filter((item) => localDateKey(getVerifiedPaymentDate(item)) === todayKey)).toLocaleString()} ETB`,
      tone: 'revenue',
      icon: '₣',
    },
  ];

  const quickActions = [
    { label: text('Pending Payments', 'Хүлээгдэж буй төлбөр'), icon: '⏳', target: 'pending-payments' },
    { label: text('Verified Receipts', 'Баталгаажсан баримт'), icon: '✓', target: 'verified-receipts' },
    { label: text('Revenue Overview', 'Орлогын тойм'), icon: '₣', target: 'revenue-overview' },
  ];

  const scrollTo = (target) => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
  const openReceipt = (item) => setSelectedReceipt(item);
  const selectedReceiptIsSimulated = selectedReceipt
    ? isSimulatedPayment(selectedReceipt.paymentMethod, selectedReceipt.paymentRef)
    : false;

  return (
    <div className="finance-dashboard">
      <header className="finance-header">
        <div className="finance-brand">
          <span className="finance-mark">₣</span>
          <span>{text('E-Kebele', 'ኢ-ቀበሌ')}<small>{text('FINANCE MODULE', 'የፋይናንስ ክፍል')}</small></span>
        </div>
        <div className="finance-user">
          <div className="finance-notification-wrap">
            <button
              type="button"
              className="finance-notification-button"
              aria-label={`${text('New applications', 'Шинэ хүсэлт')}: ${notifications.length}`}
              aria-expanded={notificationsOpen}
              aria-controls="finance-notification-panel"
              onClick={() => setNotificationsOpen((open) => !open)}
            >
              <span aria-hidden="true">♢</span>
              {notifications.length > 0 && <span className="finance-notification-badge">{notifications.length > 9 ? '9+' : notifications.length}</span>}
            </button>
            {notificationsOpen && <section id="finance-notification-panel" className="finance-notification-panel" aria-label={text('New applications', 'Шинэ хүсэлт')}>
              <header><strong>{text('New applications', 'Шинэ хүсэлт')}</strong><button type="button" onClick={() => setNotifications([])} disabled={!notifications.length}>{text('Clear', 'Арилгах')}</button></header>
              {notifications.length ? <ul>{notifications.map((item) => <li key={item.id}><strong>{item.name}</strong><span>{item.applicationId || item.id}</span><time>{item.createdAt ? new Date(item.createdAt).toLocaleString(isAmharic ? 'am-ET' : 'en-US') : text('Just now', 'Дөнгөж сая')}</time></li>)}</ul> : <p className="finance-notification-empty">{text('No new applications since this page was opened.', 'Энэ хуудсыг нээснээс хойш шинэ хүсэлт ирээгүй байна.')}</p>}
            </section>}
          </div>
          <button type="button" className="finance-language-toggle" onClick={() => toggleLanguage(isAmharic ? 'en' : 'am')} aria-label={isAmharic ? 'Switch to English' : 'ወደ አማርኛ ቀይር'}>
            <span aria-hidden="true">🌐</span> {isAmharic ? 'English' : 'አማርኛ'}
          </button>
          <span>{text('Welcome,', 'እንኳን ደህና መጡ,')} <strong>{text('Finance Officer', 'የፋይናንስ ኦፊሰር')}</strong></span>
          <button type="button" onClick={logout}>↪ {text('Logout', 'ውጣ')}</button>
        </div>
      </header>

      <main className="finance-main">
        <div className="finance-title">
          <h1 className="finance-hero-heading">{text('FINANCE & PAYMENT OFFICER DASHBOARD', 'የፋይናንስ እና ክፍያ ኦፊሰር ዳሽቦርድ')}</h1>
          <button type="button" className="finance-refresh" onClick={loadApplications} disabled={loading}>
            ↻ {text('Refresh', 'አድስ')}
          </button>
        </div>

        <div className="finance-quick-actions" aria-label={text('Quick actions', 'ፈጣን እርምጃዎች')}>
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="finance-quick-action"
              onClick={() => scrollTo(action.target)}
            >
              <span className="finance-chip-icon">{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {loading && <div className="finance-message">{text('Loading payment records...', 'የክፍያ መዝገቦችን በመጫን ላይ...')}</div>}
        {error && <div className="finance-message finance-error">{error}</div>}

        {!loading && !error && (
          <>
            <section className="finance-range-panel" id="revenue-overview">
              <div>
                <h2>Revenue by date range</h2>
                <p>{filteredRevenueReceipts.length} verified payment(s) in the selected period</p>
              </div>
              <label>From<input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></label>
              <label>To<input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></label>
              <strong>{sumReceiptAmounts(filteredRevenueReceipts).toLocaleString()} ETB</strong>
            </section>

            <section className="finance-summary-grid">
              {summaryCards.map((card) => (
                <div key={card.label} className={`finance-summary-card ${card.tone}`}>
                  <div className="finance-summary-card-heading"><span>{card.label}</span><span className="finance-summary-icon" aria-hidden="true">{card.icon}</span></div>
                  <strong>{card.value}</strong>
                </div>
              ))}
            </section>

            <section className="finance-panel finance-revenue-chart" aria-labelledby="revenue-chart-title">
              <div className="finance-panel-title">
                <div>
                  <h2 id="revenue-chart-title">Revenue Analytics</h2>
                  <p>Verified payment revenue over the {chartInterval === 'daily' ? 'last 14 days' : 'last 12 months'}.</p>
                </div>
                <div className="finance-chart-period" role="group" aria-label="Revenue chart period">
                  <button type="button" className={chartInterval === 'daily' ? 'active' : ''} aria-pressed={chartInterval === 'daily'} onClick={() => setChartInterval('daily')}>Daily</button>
                  <button type="button" className={chartInterval === 'monthly' ? 'active' : ''} aria-pressed={chartInterval === 'monthly'} onClick={() => setChartInterval('monthly')}>Monthly</button>
                </div>
              </div>
              {maxRevenue > 0 ? (
                <div className="finance-chart-scroll">
                  <div className="finance-chart-plot" role="img" aria-label={`${chartInterval === 'daily' ? 'Daily' : 'Monthly'} verified payment revenue bar chart in ETB`}>
                    {revenueChart.map((bucket) => (
                      <div className="finance-chart-column" key={bucket.key} title={`${bucket.label}: ${bucket.amount.toLocaleString()} ETB`}>
                        <span className="finance-chart-value">{bucket.amount ? bucket.amount.toLocaleString() : ''}</span>
                        <div className="finance-chart-bar-track">
                          <span className="finance-chart-bar" style={{ height: `${bucket.amount ? Math.max(4, (bucket.amount / maxRevenue) * 100) : 0}%` }} />
                        </div>
                        <span className="finance-chart-label">{bucket.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="finance-chart-empty">No verified payment revenue in this period yet.</p>
              )}
            </section>

            <label className="finance-search">
              <span>{text('Search by name, phone, or application ID', 'Нэр, утас эсвэл хүсэлтийн дугаараар хайх')}</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={text('Applicant, phone, or application ID', 'Өргөдөл гаргагч, утас эсвэл хүсэлтийн дугаар')}
              />
              {searchTerm && <button type="button" onClick={() => setSearchTerm('')}>{text('Clear', 'Цэвэрлэх')}</button>}
            </label>

            <section className="finance-panel" id="pending-payments">
              <div className="finance-panel-title">
                <div>
                  <h2>Payment Verification</h2>
                  <p>Approve payment records after receiving the applicant's payment.</p>
                </div>
                <span>{filteredPending.length} pending</span>
              </div>
              <div className="finance-table">
                <table>
                  <thead>
                    <tr><th>App ID</th><th>Applicant Name</th><th>Phone</th><th>Service Type</th><th>Transaction Reference</th><th>Payment Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filteredPending.length ? filteredPending.map((item) => (
                      <tr key={item._id}>
                        <td className="finance-id">{item.applicationId || item._id?.slice(-8)}</td>
                        <td><strong>{nameOf(item)}</strong></td>
                        <td>{phoneOf(item)}</td>
                        <td>{label(item.serviceType)}</td>
                        <td className="finance-reference">{item.paymentRef || 'Not provided'}</td>
                        <td><span className="finance-status unpaid">Awaiting verification</span></td>
                        <td><button type="button" className="verify-button" onClick={() => setSelectedPayment(item)}>Review proof</button></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="7" className="finance-empty">No pending payment records.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="finance-panel" id="verified-receipts">
              <div className="finance-panel-title">
                <div>
                  <h2>Receipts</h2>
                  <p>Completed payment transactions ready for receipt printing.</p>
                </div>
                <span>{filteredReceipts.length} verified</span>
                <div className="finance-report-actions">
                  <button type="button" className="receipt-download-button" onClick={() => exportRevenueReport('pdf')} disabled={!reportReceipts.length}>{text('Export PDF', 'PDF татах')}</button>
                  <button type="button" className="receipt-download-button" onClick={() => exportRevenueReport('excel')} disabled={!reportReceipts.length}>{text('Export Excel', 'Excel татах')}</button>
                </div>
              </div>
              <div className="finance-table">
                <table>
                  <thead>
                    <tr><th>App ID</th><th>Applicant Name</th><th>Service Type</th><th>Transaction Reference</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.length ? filteredReceipts.map((item) => (
                      <tr key={item._id}>
                        <td className="finance-id">{item.applicationId || item._id?.slice(-8)}</td>
                        <td>{nameOf(item)}</td>
                        <td>{label(item.serviceType)}</td>
                        <td className="finance-reference">{item.paymentRef || 'Not provided'}</td>
                        <td><span className="finance-status verified">Payment Verified</span></td>
                        <td className="receipt-actions"><button type="button" className="receipt-button" onClick={() => openReceipt(item)}>Print</button><button type="button" className="receipt-download-button" onClick={() => downloadReceipt(item)}>PDF</button></td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="finance-empty">No verified receipts available.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {selectedReceipt && (
          <div className="receipt-modal" onClick={() => setSelectedReceipt(null)}>
            <div className="receipt-dialog" onClick={(event) => event.stopPropagation()}>
              <div id="printable-receipt" className="printable-receipt">
                <div className="receipt-heading">
                  <h2>E-KEBELE SERVICE PORTAL</h2>
                  <p>{selectedReceiptIsSimulated ? 'Demo Payment Record / የሙከራ ክፍያ መዝገብ' : 'Official Payment Receipt / የክፍያ ደረሰኝ'}</p>
                </div>
                <div className="receipt-details">
                  <div><span>Receipt No / ID:</span><strong>{selectedReceipt.applicationId || selectedReceipt._id}</strong></div>
                  <div><span>Applicant Name:</span><strong>{getReceiptApplicantName(nameOf(selectedReceipt))}</strong></div>
                  <div><span>Service Type:</span><strong>{label(selectedReceipt.serviceType)}</strong></div>
                  <div><span>Payment Method:</span><strong>{getReceiptPaymentMethod(selectedReceipt.paymentMethod, selectedReceipt.paymentRef)}</strong></div>
                  <div><span>Transaction Reference:</span><strong>{selectedReceipt.paymentRef || 'Not recorded'}</strong></div>
                  <div><span>Payment Status:</span><strong className="receipt-paid">{selectedReceiptIsSimulated ? 'Finance Verified (Demo)' : 'Payment Verified'}</strong></div>
                  <div><span>Date Paid:</span><strong>{getVerifiedPaymentDate(selectedReceipt)?.toLocaleDateString() || 'Not recorded'}</strong></div>
                  <div className="receipt-total"><span>{selectedReceiptIsSimulated ? 'Demo Amount (Not a real payment):' : 'Total Amount Paid:'}</span><strong>{sumReceiptAmounts([selectedReceipt]).toFixed(2)} ETB</strong></div>
                </div>
                <div className="receipt-footer">
                  <p>{selectedReceiptIsSimulated
                    ? 'This simulated transaction was recorded for testing and was not processed by a payment gateway.'
                    : 'Generated by E-Kebele Finance System'}</p>
                  <p>Thank you for using digital Kebele services!</p>
                </div>
              </div>
              <div className="receipt-controls">
                <button type="button" onClick={() => setSelectedReceipt(null)}>Close</button>
                <button type="button" className="print-now" onClick={() => window.print()}>Print Now</button>
                <button type="button" className="print-now" onClick={() => downloadReceipt(selectedReceipt)}>Download PDF</button>
              </div>
            </div>
          </div>
        )}
        {selectedPayment && (
          <div className="payment-proof-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !verifyingPaymentId) setSelectedPayment(null); }}>
            <section className="payment-proof-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-proof-title">
              <header className="payment-proof-header">
                <div><p>PAYMENT VERIFICATION</p><h2 id="payment-proof-title">Review transaction proof</h2></div>
                <button type="button" className="payment-proof-close" aria-label="Close payment proof" disabled={Boolean(verifyingPaymentId)} onClick={() => setSelectedPayment(null)}>×</button>
              </header>
              <div className="payment-proof-details">
                <div><span>Applicant</span><strong>{nameOf(selectedPayment)}</strong></div>
                <div><span>Application ID</span><strong>{selectedPayment.applicationId || 'Not provided'}</strong></div>
                <div><span>Payment method</span><strong>{selectedPayment.paymentMethod || 'Not recorded'}</strong></div>
                <div><span>Payment phone</span><strong>{selectedPayment.paymentPhone || phoneOf(selectedPayment)}</strong></div>
                <div><span>Amount claimed</span><strong>{Number(selectedPayment.amountPaid ?? selectedPayment.paymentAmount ?? 0).toLocaleString()} ETB</strong></div>
                <div><span>Transaction reference</span><strong className="finance-proof-reference">{selectedPayment.paymentRef || 'No transaction reference submitted'}</strong></div>
                <div><span>Payment status</span><strong>{selectedPayment.paymentStatus || selectedPayment.status}</strong></div>
              </div>
              {!selectedPayment.paymentRef && <p className="payment-proof-warning">A transaction reference is required before this payment can be verified.</p>}
              <footer className="payment-proof-actions">
                <button type="button" className="payment-proof-cancel" disabled={Boolean(verifyingPaymentId)} onClick={() => setSelectedPayment(null)}>Close</button>
                <button type="button" className="verify-button" disabled={!selectedPayment.paymentRef || Boolean(verifyingPaymentId)} onClick={() => verifyPayment(selectedPayment._id)}>
                  {verifyingPaymentId === selectedPayment._id ? 'Verifying...' : 'Verify Payment'}
                </button>
              </footer>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default FinanceDashboard;