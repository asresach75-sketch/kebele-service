import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from './context/LanguageContext';
import './AdminDashboard.css';
import './AdminDashboardRedesign.css';
import './AdminImage.css';

const amharicText = {
  'Admin dashboard navigation': 'የአስተዳደር ዳሽቦርድ ማውጫ',
  'E-KEBELE ADMIN': 'ኢ-ቀበሌ አስተዳዳሪ',
  'Management Portal': 'የአስተዳደር ፖርታል',
  WORKSPACE: 'የስራ ቦታ',
  'User & Staff Accounts': 'የተጠቃሚና የሰራተኛ መለያዎች',
  'Application Management': 'የማመልከቻ አስተዳደር',
  'Add Staff': 'ሰራተኛ ጨምር',
  'Service Fees': 'የአገልግሎት ክፍያዎች',
  'System Audit Logs': 'የስርዓት ኦዲት መዝገቦች',
  'User Feedbacks': 'የተጠቃሚዎች አስተያየት',
  'OPERATIONS OVERVIEW': 'የስራዎች አጠቃላይ እይታ',
  'E-KEBELE ADMIN DASHBOARD': 'የኢ-ቀበሌ አስተዳደር ዳሽቦርድ',
  'Staff sign-ins, application decisions, and service fee changes.': 'የሰራተኞች መግቢያ፣ የማመልከቻ ውሳኔዎች እና የአገልግሎት ክፍያ ለውጦች።',
  'Time': 'ቀን እና ሰዓት',
  'Staff member': 'ሰራተኛ',
  'Role': 'ሚና',
  'Action': 'እርምጃ',
  'Application / Record': 'ማመልከቻ / መዝገብ',
  'Details': 'ዝርዝር',
  'Not recorded': 'አልተመዘገበም',
  'System': 'ስርዓት',
  'No audit events recorded yet.': 'እስካሁን ምንም የኦዲት ክስተት አልተመዘገበም።',
  'Unable to load system audit logs.': 'የስርዓት ኦዲት መዝገቦችን መጫን አልተቻለም።',
  'See the error message above.': 'ከላይ ያለውን የስህተት መልዕክት ይመልከቱ።',
  'Refresh': 'አድስ',
  'Loading audit logs...': 'የኦዲት መዝገቦችን በመጫን ላይ...',
  'events': 'ክስተቶች',
  'Logout / ውጣ': 'ውጣ',
  'APPLICATION COMPLETED': 'ማመልከቻ ተጠናቋል',
  LOGIN_SUCCESS: 'በተሳካ ሁኔታ ገብቷል',
  USER_BLOCKED: 'ተጠቃሚ ታግዷል',
  USER_UNBLOCKED: 'የተጠቃሚ እገዳ ተነስቷል',
  USER_DELETED: 'ተጠቃሚ ተሰርዟል',
  APPLICATION_STATUS_UPDATED: 'የማመልከቻ ሁኔታ ተዘምኗል',
  admin: 'አስተዳዳሪ',
  officer: 'ኦፊሰር',
  finance: 'ፋይናንስ',
  verifier: 'አረጋጋጭ',
  vital: 'ሲቪል ክስተት',
  support: 'ድጋፍ',
};

export default function AdminAuditLogs() {
  const { lang, toggleLanguage } = useLanguage();
  const isAmharic = lang === 'am';
  const text = (value) => (isAmharic ? amharicText[value] || value : value);
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await axios.get('/api/admin/audit-logs?limit=300', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!Array.isArray(response.data)) {
        throw new Error('Unable to load system audit logs.');
      }
      setAuditLogs(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load system audit logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  useEffect(() => {
    const clockInterval = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(clockInterval);
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  const actionText = (action) => {
    const normalized = String(action || '').replaceAll('_', ' ');
    return text(action) !== action ? text(action) : text(normalized);
  };

  return (
    <div className="admin-dashboard">
      <main className="admin-main">
        <div className="admin-workspace">
          <nav className="admin-sidebar" aria-label={text('Admin dashboard navigation')}>
            <div className="admin-sidebar-brand">
              <span className="admin-sidebar-brand-mark" aria-hidden="true">ኢ</span>
              <div><strong>{text('E-KEBELE ADMIN')}</strong><small>{text('Management Portal')}</small></div>
            </div>
            <p className="admin-sidebar-label">{text('WORKSPACE')}</p>
            <Link to="/admin-dashboard" className="admin-sidebar-link"><span className="admin-sidebar-icon" aria-hidden="true">👥</span><span>{text('User & Staff Accounts')}</span></Link>
            <Link to="/admin-applications" className="admin-sidebar-link"><span className="admin-sidebar-icon" aria-hidden="true">📝</span><span>{text('Application Management')}</span></Link>
            <Link to="/add-staff" className="admin-sidebar-link"><span className="admin-sidebar-icon" aria-hidden="true">♟</span><span>{text('Add Staff')}</span></Link>
            <Link to="/manage-fees" className="admin-sidebar-link"><span className="admin-sidebar-icon" aria-hidden="true">▣</span><span>{text('Service Fees')}</span></Link>
            <Link to="/admin-logs" className="admin-sidebar-link active" aria-current="page"><span className="admin-sidebar-icon" aria-hidden="true">◷</span><span>{text('System Audit Logs')}</span></Link>
            <Link to="/user-feedbacks" className="admin-sidebar-link"><span className="admin-sidebar-icon" aria-hidden="true">💬</span><span>{text('User Feedbacks')}</span></Link>
          </nav>

          <div className="admin-content">
            <header className="admin-welcome">
              <div className="admin-welcome-copy">
                <p className="admin-eyebrow">{text('OPERATIONS OVERVIEW')}</p>
                <h1>◷ {text('System Audit Logs')}</h1>
                <p>{text('Staff sign-ins, application decisions, and service fee changes.')}</p>
              </div>
              <div className="admin-header-actions">
                <time className="admin-live-clock" dateTime={currentTime.toISOString()}>
                  {currentTime.toLocaleString(isAmharic ? 'am-ET' : 'en-US')}
                </time>
                <button
                  type="button"
                  className="admin-language-toggle"
                  onClick={() => toggleLanguage(isAmharic ? 'en' : 'am')}
                  aria-label={isAmharic ? 'Switch to English' : 'ወደ አማርኛ ቀይር'}
                >
                  {isAmharic ? 'English' : 'አማርኛ'}
                </button>
                <button type="button" className="admin-logout-button" onClick={logout}>{text('Logout / ውጣ')}</button>
              </div>
            </header>

            {error && <div className="admin-error" role="alert">{text(error)}</div>}
            <section className="admin-queue admin-audit-queue">
              <div className="queue-heading">
                <div><h2>{text('System Audit Logs')}</h2><p>{text('Staff sign-ins, application decisions, and service fee changes.')}</p></div>
                <span>{auditLogs.length} {text('events')}</span>
              </div>
              <div className="admin-report-actions">
                <button type="button" className="user-review-button" onClick={loadAuditLogs} disabled={loading}>
                  {loading ? text('Loading audit logs...') : text('Refresh')}
                </button>
              </div>
              <div className="admin-table admin-audit-table">
                <table className="admin-audit-log-table">
                  <thead><tr>
                    <th>{text('Time')}</th>
                    <th>{text('Staff member')}</th>
                    <th>{text('Role')}</th>
                    <th>{text('Action')}</th>
                    <th>{text('Application / Record')}</th>
                    <th>{text('Details')}</th>
                  </tr></thead>
                  <tbody>
                    {auditLogs.length ? auditLogs.map((entry) => (
                      <tr key={entry._id}>
                        <td className="admin-audit-time">{entry.createdAt ? new Date(entry.createdAt).toLocaleString(isAmharic ? 'am-ET' : 'en-US') : text('Not recorded')}</td>
                        <td className="admin-audit-actor"><strong>{entry.actorName || entry.actorEmail || text('System')}</strong>{entry.actorEmail && entry.actorName && <small>{entry.actorEmail}</small>}</td>
                        <td><span className="admin-status">{text(entry.actorRole)}</span></td>
                        <td>{actionText(entry.action)}</td>
                        <td>{entry.entityId || '—'}</td>
                        <td>{entry.details || '—'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="admin-empty">
                        {loading ? text('Loading audit logs...') : error ? text('See the error message above.') : text('No audit events recorded yet.')}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
