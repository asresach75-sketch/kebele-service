import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import './AdminDashboard.css';
import './AdminDashboardRedesign.css';
import './AdminPageLayout.css';

const translations = {
  'Admin dashboard navigation': 'የአስተዳደር ዳሽቦርድ ማውጫ',
  'E-KEBELE ADMIN': 'ኢ-ቀበሌ አስተዳዳሪ',
  'Management Portal': 'የአስተዳደር ፖርታል',
  WORKSPACE: 'የስራ ቦታ',
  Dashboard: 'ዳሽቦርድ',
  'User & Staff Accounts': 'የተጠቃሚና የሰራተኛ መለያዎች',
  'Application Management': 'የማመልከቻ አስተዳደር',
  'Add Staff': 'ሰራተኛ ጨምር',
  'Service Fees': 'የአገልግሎት ክፍያዎች',
  'System Audit Logs': 'የስርዓት ኦዲት መዝገቦች',
  'User Feedbacks': 'የተጠቃሚዎች አስተያየት',
  'OPERATIONS OVERVIEW': 'የስራዎች አጠቃላይ እይታ',
  'Manage staff accounts and access.': 'የሰራተኞችን መለያና መዳረሻ ያስተዳድሩ።',
  'Manage service fees.': 'የአገልግሎት ክፍያዎችን ያስተዳድሩ።',
  'Review and reply to user feedback.': 'የተጠቃሚዎችን አስተያየት ይመልከቱና ይመልሱ።',
  'Staff sign-ins, application decisions, and service fee changes.': 'የሰራተኞች መግቢያ፣ የማመልከቻ ውሳኔዎች እና የአገልግሎት ክፍያ ለውጦች።',
  'Add New Staff / አዲስ ሰራተኛ': 'አዲስ ሰራተኛ ጨምር',
  'Service Fee Adjustment / የአገልግሎት ክፍያ ማስተካከያ': 'የአገልግሎት ክፍያ ማስተካከያ',
  'User Feedbacks / የተጠቃሚዎች አስተያየት': 'የተጠቃሚዎች አስተያየት',
  'Switch to English': 'Switch to English',
  'Switch to Amharic': 'ወደ አማርኛ ቀይር',
  'Logout / ውጣ': 'ውጣ',
};

const navigation = [
  { path: '/admin-dashboard', key: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { path: '/admin-users', key: 'users', label: 'User & Staff Accounts', icon: '👥' },
  { path: '/admin-applications', key: 'applications', label: 'Application Management', icon: '📝' },
  { path: '/add-staff', key: 'add-staff', label: 'Add Staff', icon: '♟' },
  { path: '/manage-fees', key: 'fees', label: 'Service Fees', icon: '▣' },
  { path: '/admin-logs', key: 'logs', label: 'System Audit Logs', icon: '◷' },
  { path: '/user-feedbacks', key: 'feedbacks', label: 'User Feedbacks', icon: '💬' },
];

export default function AdminPageLayout({ activePage, title, description, children }) {
  const { lang, toggleLanguage } = useLanguage();
  const isAmharic = lang === 'am';
  const text = (value) => (isAmharic ? translations[value] || value : value);
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const clockInterval = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(clockInterval);
  }, []);

  const logout = () => {
    ['user', 'userInfo', 'token', 'role'].forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem('token');
    navigate('/login');
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
            {navigation.map((item) => (
              <Link
                key={item.key}
                to={item.path}
                className={`admin-sidebar-link${activePage === item.key ? ' active' : ''}`}
                aria-current={activePage === item.key ? 'page' : undefined}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">{item.icon}</span>
                <span>{text(item.label)}</span>
              </Link>
            ))}
          </nav>

          <div className="admin-content">
            <header className="admin-welcome">
              <div className="admin-welcome-copy">
                <p className="admin-eyebrow">{text('OPERATIONS OVERVIEW')}</p>
                <h1>{text(title)}</h1>
                <p>{text(description)}</p>
              </div>
              <div className="admin-header-actions admin-page-header-actions">
                <time className="admin-live-clock" dateTime={currentTime.toISOString()}>
                  {currentTime.toLocaleString(isAmharic ? 'am-ET' : 'en-US')}
                </time>
                <button
                  type="button"
                  className="admin-language-toggle"
                  onClick={() => toggleLanguage(isAmharic ? 'en' : 'am')}
                  aria-label={isAmharic ? text('Switch to English') : text('Switch to Amharic')}
                >
                  {isAmharic ? 'English' : 'አማርኛ'}
                </button>
                <button type="button" className="admin-logout-button" onClick={logout}>
                  {text('Logout / ውጣ')}
                </button>
              </div>
            </header>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
