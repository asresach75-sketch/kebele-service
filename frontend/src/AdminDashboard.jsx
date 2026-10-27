import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { exportExcelReport, exportPdfReport } from './utils/reportExport';
import { useLanguage } from './context/LanguageContext';
import './AdminDashboard.css';
import './AdminDashboardRedesign.css';
import './AdminImage.css';

const completeStatuses = ['Approved', 'Approved - Pending Payment', 'Payment Verified', 'APPROVED_BY_OFFICER', 'PAID_PENDING_FINANCE', 'APPROVED_BY_FINANCE', 'COMPLETED'];
const adminAmharic = {
  'Unable to load admin data.': 'የአስተዳደር መረጃን መጫን አልተቻለም።',
  'Unable to load user feedbacks.': 'የተጠቃሚዎችን አስተያየት መጫን አልተቻለም።',
  'Unable to load system audit logs.': 'የስርዓት ኦዲት መዝገቦችን መጫን አልተቻለም።',
  'Staff account created successfully.': 'የሰራተኛ መለያ በተሳካ ሁኔታ ተፈጥሯል።',
  'Unable to create staff account.': 'የሰራተኛ መለያ መፍጠር አልተቻለም።',
  'User account deleted successfully.': 'የተጠቃሚ መለያው በተሳካ ሁኔታ ተሰርዟል።',
  'Unable to delete user.': 'ተጠቃሚውን መሰረዝ አልተቻለም።',
  'Unable to block user.': 'ተጠቃሚውን ማገድ አልተቻለም።',
  'Unable to unblock user.': 'የተጠቃሚውን እገዳ ማንሳት አልተቻለም።',
  'Application {id} marked as completed.': 'ማመልከቻ {id} እንደተጠናቀቀ ተመዝግቧል።',
  'Unable to complete application.': 'ማመልከቻውን ማጠናቀቅ አልተቻለም።',
  'Marking completed...': 'በማጠናቀቅ ላይ...',
  'E-Kebele Document Delivery Report': 'የኢ-ቀበሌ ሰነድ ርክክብ ሪፖርት',
  'Document Delivery': 'የሰነድ ርክክብ',
  'Application ID': 'የማመልከቻ መለያ',
  Applicant: 'አመልካች',
  Service: 'አገልግሎት',
  Status: 'ሁኔታ',
  'New application submitted': 'አዲስ ማመልከቻ ቀርቧል',
  'New account registered': 'አዲስ መለያ ተመዝግቧል',
  'New user': 'አዲስ ተጠቃሚ',
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
  'Manage accounts, applications, and service delivery.': 'መለያዎችን፣ ማመልከቻዎችን እና የአገልግሎት አሰጣጥን ያስተዳድሩ።',
  Database: 'ዳታቤዝ',
  'Checking…': 'በመፈተሽ ላይ…',
  Connected: 'ተገናኝቷል',
  Disconnected: 'አልተገናኘም',
  Notifications: 'ማሳወቂያዎች',
  unread: 'ያልተነበቡ',
  'Recent activity': 'የቅርብ ጊዜ እንቅስቃሴ',
  'Recent Activity': 'የቅርብ ጊዜ እንቅስቃሴ',
  'New accounts and applications': 'አዲስ መለያዎችና ማመልከቻዎች',
  'Mark read': 'እንደተነበበ ምልክት አድርግ',
  'No recent activity.': 'በቅርቡ ምንም እንቅስቃሴ የለም።',
  'Logout / ውጣ': 'ውጣ',
  'New Staff Account': 'አዲስ የሰራተኛ መለያ',
  'Full name': 'ሙሉ ስም',
  'Email (optional)': 'ኢሜይል (አማራጭ)',
  'Phone (optional)': 'ስልክ (አማራጭ)',
  'Temporary password (min 8)': 'ጊዜያዊ የይለፍ ቃል (ቢያንስ 8 ቁምፊ)',
  'Officer / Verifier': 'ኦፊሰር / አረጋጋጭ',
  'Finance Officer': 'የፋይናንስ ኦፊሰር',
  Administrator: 'አስተዳዳሪ',
  'Create Staff Account': 'የሰራተኛ መለያ ፍጠር',
  'Total Users': 'ጠቅላላ ተጠቃሚዎች',
  'Approved Documents': 'የጸደቁ ሰነዶች',
  'Pending New IDs': 'በመጠባበቅ ላይ ያሉ አዳዲስ መታወቂያዎች',
  'Pending Vital Events': 'በመጠባበቅ ላይ ያሉ የሲቪል ክስተቶች',
  'Release finance-approved documents for printing and collection.': 'በፋይናንስ የጸደቁ ሰነዶችን ለማተምና ለማስረከብ ያዘጋጁ።',
  ready: 'ዝግጁ',
  'Export PDF': 'PDF ላክ',
  'Export Excel': 'Excel ላክ',
  'Search delivery': 'ርክክብ ፈልግ',
  'Applicant or application ID': 'አመልካች ወይም የማመልከቻ መለያ',
  'Delivery status': 'የርክክብ ሁኔታ',
  'Ready and completed': 'ዝግጁ እና የተጠናቀቁ',
  'Ready for collection': 'ለመረከብ ዝግጁ',
  Completed: 'ተጠናቋል',
  Action: 'እርምጃ',
  'Mark Completed': 'እንደተጠናቀቀ ምልክት አድርግ',
  'No delivery records match these filters.': 'ከእነዚህ ማጣሪያዎች ጋር የሚዛመድ የርክክብ መዝገብ የለም።',
  'User and Staff Accounts': 'የተጠቃሚና የሰራተኛ መለያዎች',
  total: 'ጠቅላላ',
  'Search accounts': 'መለያዎችን ፈልግ',
  'Name, email, phone, or role': 'ስም፣ ኢሜይል፣ ስልክ ወይም ሚና',
  Role: 'ሚና',
  'All roles': 'ሁሉም ሚናዎች',
  User: 'ተጠቃሚ',
  user: 'ተጠቃሚ',
  Officer: 'ኦፊሰር',
  Finance: 'ፋይናንስ',
  Verifier: 'አረጋጋጭ',
  Vital: 'ሲቪል ክስተት',
  officer: 'ኦፊሰር',
  finance: 'ፋይናንስ',
  verifier: 'አረጋጋጭ',
  vital: 'ሲቪል ክስተት',
  support: 'ድጋፍ',
  admin: 'አስተዳዳሪ',
  Support: 'ድጋፍ',
  Admin: 'አስተዳዳሪ',
  'Account status': 'የመለያ ሁኔታ',
  'All statuses': 'ሁሉም ሁኔታዎች',
  Active: 'ንቁ',
  Blocked: 'ታግዷል',
  '#': '#',
  'Full Name': 'ሙሉ ስም',
  Email: 'ኢሜይል',
  Phone: 'ስልክ',
  'Not provided': 'አልቀረበም',
  Review: 'ዝርዝር እይ',
  Unblock: 'እገዳ አንሳ',
  Block: 'አግድ',
  Delete: 'ሰርዝ',
  'No accounts match these filters.': 'ከእነዚህ ማጣሪያዎች ጋር የሚዛመድ መለያ የለም።',
  'Staff sign-ins, application decisions, and service fee changes.': 'የሰራተኞች መግቢያ፣ የማመልከቻ ውሳኔዎች እና የአገልግሎት ክፍያ ለውጦች።',
  events: 'ክስተቶች',
  Time: 'ሰዓት',
  'Staff member': 'ሰራተኛ',
  'Application / Record': 'ማመልከቻ / መዝገብ',
  Details: 'ዝርዝር',
  'Not recorded': 'አልተመዘገበም',
  System: 'ስርዓት',
  'No audit events recorded yet.': 'እስካሁን ምንም የኦዲት ክስተት አልተመዘገበም።',
  'User Feedbacks & Messages / የተጠቃሚዎች አስተያየት': 'የተጠቃሚዎች አስተያየትና መልዕክቶች',
  '← Back to Dashboard / ወደ ዳሽቦርድ ተመለስ': '← ወደ ዳሽቦርድ ተመለስ',
  Subject: 'ርዕስ',
  'Message / Feedback': 'መልዕክት / አስተያየት',
  Date: 'ቀን',
  'No subject': 'ርዕስ የለም',
  'No user feedbacks available.': 'ምንም የተጠቃሚ አስተያየት የለም።',
  'Account Review Details': 'የመለያ ግምገማ ዝርዝር',
  'Close review': 'ግምገማውን ዝጋ',
  'Account ID': 'የመለያ ቁጥር',
  Created: 'የተፈጠረበት',
  Close: 'ዝጋ',
  'Delete account': 'መለያውን ሰርዝ',
  'Block account': 'መለያውን አግድ',
  'Unblock account': 'የመለያውን እገዳ አንሳ',
  'this account': 'ይህ መለያ',
  'This permanently removes the account. This action cannot be undone.': 'ይህ መለያውን በቋሚነት ይሰርዛል። ይህን እርምጃ መመለስ አይቻልም።',
  'This account will no longer be able to sign in until it is unblocked.': 'የዚህ መለያ እገዳ እስኪነሳ ድረስ መግባት አይችልም።',
  'This account will be able to sign in again.': 'ይህ መለያ እንደገና መግባት ይችላል።',
  'Approved - Pending Payment': 'ጸድቋል - ክፍያ በመጠባበቅ ላይ',
  Approved: 'ጸድቋል',
  'Payment Verified': 'ክፍያው ተረጋግጧል',
  Pending: 'በመጠባበቅ ላይ',
  Rejected: 'ውድቅ ተደርጓል',
  APPROVED_BY_OFFICER: 'በኦፊሰር ጸድቋል',
  PAID_PENDING_FINANCE: 'ተከፍሏል - የፋይናንስ ማረጋገጫ በመጠባበቅ ላይ',
  APPROVED_BY_FINANCE: 'በፋይናንስ ጸድቋል',
  COMPLETED: 'ተጠናቋል',
  'New ID Card': 'አዲስ መታወቂያ',
  NEW_ID_CARD: 'አዲስ መታወቂያ',
  ID_RENEWAL: 'የመታወቂያ እድሳት',
  BIRTH_REGISTRATION: 'የልደት ምዝገባ',
  MARRIAGE_REGISTRATION: 'የጋብቻ ምዝገባ',
  DIVORCE_REGISTRATION: 'የፍቺ ምዝገባ',
  DEATH_REGISTRATION: 'የሞት ምዝገባ',
  LOGIN_SUCCESS: 'በተሳካ ሁኔታ ገብቷል',
  USER_BLOCKED: 'ተጠቃሚ ታግዷል',
  USER_UNBLOCKED: 'የተጠቃሚ እገዳ ተነስቷል',
  USER_DELETED: 'ተጠቃሚ ተሰርዟል',
  APPLICATION_STATUS_UPDATED: 'የማመልከቻ ሁኔታ ተዘምኗል',
  Cancel: 'ይቅር',
  'Please wait...': 'እባክዎ ይጠብቁ...',
};

export default function AdminDashboard() {
  const { lang, toggleLanguage } = useLanguage();
  const isAmharic = lang === 'am';
  const text = (english) => (isAmharic ? adminAmharic[english] || english : english);
  const location = useLocation();
  const routeTab = location.pathname === '/admin-applications' ? 'applications' : 'users';
  const statusText = (status) => {
    if (!status) return '—';
    const normalizedStatus = String(status).replaceAll('_', ' ');
    return text(status) !== status ? text(status) : text(normalizedStatus);
  };
  const [activeTab, setActiveTab] = useState(routeTab);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [deliveryQuery, setDeliveryQuery] = useState('');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all');
  const [accountQuery, setAccountQuery] = useState('');
  const [accountRoleFilter, setAccountRoleFilter] = useState('all');
  const [accountStatusFilter, setAccountStatusFilter] = useState('all');
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pendingAccountAction, setPendingAccountAction] = useState(null);
  const [accountActionLoading, setAccountActionLoading] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staff, setStaff] = useState({ fullName: '', email: '', phone: '', password: '', role: 'officer' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [completingRequestIds, setCompletingRequestIds] = useState(() => new Set());
  const completingRequestIdsRef = useRef(new Set());
  const [databaseConnected, setDatabaseConnected] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsReadThrough, setNotificationsReadThrough] = useState(() => {
    const savedTimestamp = Number(localStorage.getItem('admin-notifications-read-through'));
    return Number.isFinite(savedTimestamp) && savedTimestamp > 0 ? savedTimestamp : Date.now();
  });
  const navigate = useNavigate();

  useEffect(() => {
    setActiveTab(routeTab);
    setMessage('');
    setError('');
    if (routeTab === 'users') setShowStaffForm(false);
  }, [routeTab]);

  const loadUsers = async () => setUsers((await axios.get('/api/users')).data);

  const loadAdminData = async () => {
    try {
      const [serviceResponse, usersResponse] = await Promise.all([
        axios.get('/api/services'),
        axios.get('/api/users'),
      ]);
      setRequests(Array.isArray(serviceResponse.data) ? serviceResponse.data : []);
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
    } catch {
      setError(text('Unable to load admin data.'));
    }
  };

  useEffect(() => {
    axios.defaults.headers.common.Authorization = `Bearer ${sessionStorage.getItem('token') || localStorage.getItem('token')}`;
    loadAdminData();
    const loadSystemHealth = async () => {
      try {
        const response = await axios.get('/api/health');
        setDatabaseConnected(response.data?.database?.connected === true);
      } catch {
        setDatabaseConnected(false);
      }
    };
    loadSystemHealth();
    const refreshInterval = window.setInterval(loadAdminData, 30000);
    const healthInterval = window.setInterval(loadSystemHealth, 30000);
    const clockInterval = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      window.clearInterval(refreshInterval);
      window.clearInterval(healthInterval);
      window.clearInterval(clockInterval);
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'feedbacks') return;
    axios.get('/api/services/feedbacks')
      .then((response) => setFeedbacks(response.data.feedbacks || []))
      .catch((requestError) => setError(requestError.response?.data?.message || text('Unable to load user feedbacks.')));
  }, [activeTab]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setNotificationsOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [notificationsOpen]);

  const addStaff = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.post('/api/users/staff', staff);
      setMessage(text('Staff account created successfully.'));
      setStaff({ fullName: '', email: '', phone: '', password: '', role: 'officer' });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || text('Unable to create staff account.'));
    }
  };

  const handleToggleBlock = (user) => {
    setPendingAccountAction({ type: 'block', user, nextBlockedState: !user.isBlocked });
  };

  const handleDeleteUser = (user) => {
    setPendingAccountAction({ type: 'delete', user });
  };

  const confirmAccountAction = async () => {
    if (!pendingAccountAction || accountActionLoading) return;
    const { type, user, nextBlockedState } = pendingAccountAction;
    setAccountActionLoading(true);
    setError('');
    try {
      if (type === 'block') {
        const response = await axios.patch(`/api/users/${user._id}/block`, { isBlocked: nextBlockedState });
        setUsers((currentUsers) => currentUsers.map((item) => item._id === user._id ? response.data.user : item));
      } else {
        await axios.delete(`/api/users/${user._id}`);
        setUsers((currentUsers) => currentUsers.filter((item) => item._id !== user._id));
        setMessage(text('User account deleted successfully.'));
      }
      setPendingAccountAction(null);
    } catch (requestError) {
      const fallbackMessage = type === 'delete'
        ? text('Unable to delete user.')
        : nextBlockedState
          ? text('Unable to block user.')
          : text('Unable to unblock user.');
      setError(requestError.response?.data?.message || fallbackMessage);
    } finally {
      setAccountActionLoading(false);
    }
  };

  const completeApplication = async (request) => {
    if (request.status !== 'APPROVED_BY_FINANCE' || completingRequestIdsRef.current.has(request._id)) return;
    completingRequestIdsRef.current.add(request._id);
    setCompletingRequestIds(new Set(completingRequestIdsRef.current));
    setError('');
    try {
      const response = await axios.put(`/api/services/update-status/${request._id}`, { status: 'COMPLETED' });
      setRequests((currentRequests) => currentRequests.map((item) => item._id === request._id ? response.data : item));
      setMessage(text('Application {id} marked as completed.').replace('{id}', request.applicationId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || text('Unable to complete application.'));
    } finally {
      completingRequestIdsRef.current.delete(request._id);
      setCompletingRequestIds(new Set(completingRequestIdsRef.current));
    }
  };

  const exportDeliveryReport = (format) => {
    const headers = ['Application ID', 'Applicant', 'Service', 'Status'].map(text);
    const rows = deliveryItems.map((request) => [
      request.applicationId || '',
      request.fullName || request.husbandName || request.wifeName || text('Applicant'),
      request.serviceType || '',
      request.status || '',
    ]);
    const fileName = 'ekebele-document-delivery-report';

    if (format === 'pdf') {
      exportPdfReport({ title: text('E-Kebele Document Delivery Report'), fileName, headers, rows });
    } else {
      exportExcelReport({ fileName, sheetName: text('Document Delivery'), headers, rows });
    }
  };

  const handleReviewUser = (user) => setSelectedUser(user);

  const logout = () => { localStorage.clear(); navigate('/login'); };
  const pendingNew = requests.filter((item) => ['NEW_ID_CARD', 'New ID Card'].includes(item.serviceType) && !completeStatuses.includes(item.status)).length;
  const pendingVital = requests.filter((item) => item.serviceType?.includes('REGISTRATION') && !completeStatuses.includes(item.status)).length;
  const deliveryItems = requests.filter((item) => ['APPROVED_BY_FINANCE', 'COMPLETED'].includes(item.status))
    .filter((item) => deliveryStatusFilter === 'all'
      || (deliveryStatusFilter === 'ready' && item.status === 'APPROVED_BY_FINANCE')
      || (deliveryStatusFilter === 'completed' && item.status === 'COMPLETED'))
    .filter((item) => `${item.applicationId || ''} ${item.fullName || ''} ${item.husbandName || ''} ${item.wifeName || ''} ${item.serviceType || ''}`.toLowerCase().includes(deliveryQuery.trim().toLowerCase()));
  const filteredUsers = users.filter((user) => {
    const searchable = `${user.fullName || user.name || ''} ${user.email || ''} ${user.phone || ''} ${user.role || ''}`.toLowerCase();
    const matchesRole = accountRoleFilter === 'all' || user.role === accountRoleFilter;
    const matchesStatus = accountStatusFilter === 'all'
      || (accountStatusFilter === 'active' && !user.isBlocked)
      || (accountStatusFilter === 'blocked' && user.isBlocked);
    return matchesRole && matchesStatus && searchable.includes(accountQuery.trim().toLowerCase());
  });
  const adminActivities = [
    ...requests.map((request) => ({
      id: `application-${request._id}`,
      type: 'application',
      timestamp: new Date(request.createdAt).getTime(),
      title: 'New application submitted',
      detail: `${request.fullName || request.husbandName || request.wifeName || 'Applicant'} · ${request.applicationId || request.serviceType}`,
    })),
    ...users.map((user) => ({
      id: `user-${user._id}`,
      type: 'user',
      timestamp: new Date(user.createdAt).getTime(),
      title: 'New account registered',
      detail: `${user.fullName || user.name || user.email || 'New user'} · ${user.role || 'user'}`,
    })),
  ].filter((activity) => Number.isFinite(activity.timestamp))
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 8);
  const unreadNotificationCount = adminActivities.filter((activity) => activity.timestamp > notificationsReadThrough).length;

  const markNotificationsRead = () => {
    const latestActivityTime = Math.max(Date.now(), ...adminActivities.map((activity) => activity.timestamp));
    setNotificationsReadThrough(latestActivityTime);
    localStorage.setItem('admin-notifications-read-through', String(latestActivityTime));
  };

  const toggleNotificationCenter = () => {
    if (!notificationsOpen) markNotificationsRead();
    setNotificationsOpen((open) => !open);
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
            <Link to="/admin-dashboard" className={`admin-sidebar-link${activeTab === 'users' ? ' active' : ''}`} aria-current={activeTab === 'users' ? 'page' : undefined}><span className="admin-sidebar-icon" aria-hidden="true">👥</span><span>{text('User & Staff Accounts')}</span></Link>
            <Link to="/admin-applications" className={`admin-sidebar-link${activeTab === 'applications' ? ' active' : ''}`} aria-current={activeTab === 'applications' ? 'page' : undefined}><span className="admin-sidebar-icon" aria-hidden="true">📝</span><span>{text('Application Management')}</span></Link>
            <Link to="/add-staff" className="admin-sidebar-link"><span className="admin-sidebar-icon" aria-hidden="true">♟</span><span>{text('Add Staff')}</span></Link>
            <Link to="/manage-fees" className="admin-sidebar-link"><span className="admin-sidebar-icon" aria-hidden="true">▣</span><span>{text('Service Fees')}</span></Link>
            <Link to="/admin-logs" className="admin-sidebar-link"><span className="admin-sidebar-icon" aria-hidden="true">◷</span><span>{text('System Audit Logs')}</span></Link>
            <Link to="/user-feedbacks" className="admin-sidebar-link"><span className="admin-sidebar-icon" aria-hidden="true">💬</span><span>{text('User Feedbacks')}</span></Link>
          </nav>

          <div className="admin-content">
        <div className="admin-welcome">
          <div className="admin-welcome-copy">
            <p className="admin-eyebrow">{text('OPERATIONS OVERVIEW')}</p>
            <h1>🏛️ {text('E-KEBELE ADMIN DASHBOARD')}</h1>
            <p>{text('Manage accounts, applications, and service delivery.')}</p>
          </div>
          <div className="admin-header-actions">
            <div className={`admin-database-status ${databaseConnected === null ? 'checking' : databaseConnected ? 'connected' : 'disconnected'}`} role="status" aria-live="polite">
              <span className="admin-status-indicator" aria-hidden="true" />
              {text('Database')}: {databaseConnected === null ? text('Checking…') : databaseConnected ? text('Connected') : text('Disconnected')}
            </div>
            <time className="admin-live-clock" dateTime={currentTime.toISOString()}>
              {currentTime.toLocaleString(isAmharic ? 'am-ET' : 'en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
              })}
            </time>
            <button
              type="button"
              className="admin-language-toggle"
              onClick={() => toggleLanguage(isAmharic ? 'en' : 'am')}
              aria-label={isAmharic ? 'Switch to English' : 'ወደ አማርኛ ቀይር'}
            >
              {isAmharic ? 'English' : 'አማርኛ'}
            </button>
            <div className="admin-notification-control">
              <button
                type="button"
                className="admin-notification-button"
                aria-label={`${text('Notifications')}${unreadNotificationCount ? `, ${unreadNotificationCount} ${text('unread')}` : ''}`}
                aria-expanded={notificationsOpen}
                aria-controls="admin-notification-panel"
                title={text('Recent activity')}
                onClick={toggleNotificationCenter}
              >
                <span aria-hidden="true">🔔</span>
                {unreadNotificationCount > 0 && <span className="admin-notification-count">{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</span>}
              </button>
              {notificationsOpen && (
                <section id="admin-notification-panel" className="admin-notification-panel" aria-label={text('Recent activity')}>
                  <header>
                    <div><h2>{text('Recent Activity')}</h2><p>{text('New accounts and applications')}</p></div>
                    <button type="button" onClick={markNotificationsRead} disabled={!unreadNotificationCount}>{text('Mark read')}</button>
                  </header>
                  {adminActivities.length ? (
                    <ul>
                      {adminActivities.map((activity) => (
                        <li key={activity.id}>
                          <span className={`admin-activity-marker ${activity.type}`} aria-hidden="true">{activity.type === 'application' ? '▣' : '●'}</span>
                          <div><strong>{text(activity.title)}</strong><p>{activity.detail.replace('Applicant', text('Applicant')).replace('New user', text('New user')).replace(/ · (user|officer|finance|verifier|vital|support|admin)$/i, (_match, role) => ` · ${text(role.toLowerCase())}`)}</p><time dateTime={new Date(activity.timestamp).toISOString()}>{new Date(activity.timestamp).toLocaleString(isAmharic ? 'am-ET' : 'en-US')}</time></div>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="admin-notifications-empty">{text('No recent activity.')}</p>}
                </section>
              )}
            </div>
            <button type="button" className="admin-logout-button" onClick={logout}>{text('Logout / ውጣ')}</button>
          </div>
        </div>
        {error && <div className="admin-error">{error}</div>}

        {activeTab === 'add-staff' && showStaffForm && (
          <form className="staff-form" onSubmit={addStaff}>
            <h2>{text('New Staff Account')}</h2>
            {message && <p>{message}</p>}
            <input placeholder={text('Full name')} value={staff.fullName} onChange={(event) => setStaff({ ...staff, fullName: event.target.value })} required />
            <input type="email" placeholder={text('Email (optional)')} value={staff.email} onChange={(event) => setStaff({ ...staff, email: event.target.value })} />
            <input placeholder={text('Phone (optional)')} value={staff.phone} onChange={(event) => setStaff({ ...staff, phone: event.target.value })} />
            <input type="password" placeholder={text('Temporary password (min 8)')} value={staff.password} onChange={(event) => setStaff({ ...staff, password: event.target.value })} required minLength={8} />
            <select value={staff.role} onChange={(event) => setStaff({ ...staff, role: event.target.value })}>
              <option value="officer">{text('Officer / Verifier')}</option>
              <option value="finance">{text('Finance Officer')}</option>
              <option value="admin">{text('Administrator')}</option>
            </select>
            <button type="submit">{text('Create Staff Account')}</button>
          </form>
        )}

        {['users', 'add-staff', 'applications'].includes(activeTab) && <>
          <section className="admin-stats">
            <div className="stat-users"><span>{text('Total Users')}</span><strong>{users.length}</strong></div>
            <div className="stat-approved"><span>{text('Approved Documents')}</span><strong>{requests.filter((item) => completeStatuses.includes(item.status)).length}</strong></div>
            <div className="stat-pending"><span>{text('Pending New IDs')}</span><strong>{pendingNew}</strong></div>
            <div className="stat-vital"><span>{text('Pending Vital Events')}</span><strong>{pendingVital}</strong></div>
          </section>
          <section id="application-management" className="admin-queue admin-delivery-queue">
            <div className="queue-heading"><div><h2>{text('Document Delivery')}</h2><p>{text('Release finance-approved documents for printing and collection.')}</p></div><span>{requests.filter((item) => item.status === 'APPROVED_BY_FINANCE').length} {text('ready')}</span></div>
            <div className="admin-report-actions"><button type="button" className="user-review-button" onClick={() => exportDeliveryReport('pdf')} disabled={!deliveryItems.length}>{text('Export PDF')}</button><button type="button" className="user-review-button" onClick={() => exportDeliveryReport('excel')} disabled={!deliveryItems.length}>{text('Export Excel')}</button></div>
            <div className="admin-list-filters">
              <label>{text('Search delivery')}<input type="search" value={deliveryQuery} onChange={(event) => setDeliveryQuery(event.target.value)} placeholder={text('Applicant or application ID')} /></label>
              <label>{text('Delivery status')}<select value={deliveryStatusFilter} onChange={(event) => setDeliveryStatusFilter(event.target.value)}><option value="all">{text('Ready and completed')}</option><option value="ready">{text('Ready for collection')}</option><option value="completed">{text('Completed')}</option></select></label>
            </div>
            <div className="admin-table"><table><thead><tr><th>{text('Application ID')}</th><th>{text('Applicant')}</th><th>{text('Service')}</th><th>{text('Status')}</th><th>{text('Action')}</th></tr></thead><tbody>{deliveryItems.length ? deliveryItems.map((request) => <tr key={request._id}><td>{request.applicationId}</td><td>{request.fullName || request.husbandName || request.wifeName || text('Applicant')}</td><td>{text(request.serviceType)}</td><td><span className={`admin-status ${request.status === 'COMPLETED' ? 'active' : ''}`}>{statusText(request.status)}</span></td><td>{request.status === 'APPROVED_BY_FINANCE' ? <button type="button" className="user-review-button" onClick={() => completeApplication(request)} disabled={completingRequestIds.has(request._id)}>{text(completingRequestIds.has(request._id) ? 'Marking completed...' : 'Mark Completed')}</button> : text('Ready for collection')}</td></tr>) : <tr><td colSpan="5" className="admin-empty">{text('No delivery records match these filters.')}</td></tr>}</tbody></table></div>
          </section>
          {['users', 'add-staff'].includes(activeTab) && <section className="admin-queue">
            <div className="queue-heading"><h2>{text('User and Staff Accounts')}</h2><span>{users.length} {text('total')}</span></div>
            <div className="admin-list-filters account-filters">
              <label>{text('Search accounts')}<input type="search" value={accountQuery} onChange={(event) => setAccountQuery(event.target.value)} placeholder={text('Name, email, phone, or role')} /></label>
              <label>{text('Role')}<select value={accountRoleFilter} onChange={(event) => setAccountRoleFilter(event.target.value)}><option value="all">{text('All roles')}</option><option value="user">{text('User')}</option><option value="officer">{text('Officer')}</option><option value="finance">{text('Finance')}</option><option value="verifier">{text('Verifier')}</option><option value="vital">{text('Vital')}</option><option value="support">{text('Support')}</option><option value="admin">{text('Admin')}</option></select></label>
              <label>{text('Account status')}<select value={accountStatusFilter} onChange={(event) => setAccountStatusFilter(event.target.value)}><option value="all">{text('All statuses')}</option><option value="active">{text('Active')}</option><option value="blocked">{text('Blocked')}</option></select></label>
            </div>
            <div className="admin-table"><table><thead><tr><th>{text('#')}</th><th>{text('Full Name')}</th><th>{text('Email')}</th><th>{text('Phone')}</th><th>{text('Role')}</th><th>{text('Status')}</th><th>{text('Action')}</th></tr></thead><tbody>{filteredUsers.length ? filteredUsers.map((user, index) => <tr key={user._id}><td>#{index + 1}</td><td><strong>{user.fullName || user.name}</strong></td><td>{user.email}</td><td>{user.phone || text('Not provided')}</td><td><span className="admin-status">{text(user.role || 'user')}</span></td><td><span className={`admin-status ${user.isBlocked ? 'blocked' : 'active'}`}>{text(user.isBlocked ? 'Blocked' : 'Active')}</span></td><td className="admin-actions"><button type="button" className="user-review-button" onClick={() => handleReviewUser(user)}>{text('Review')}</button><button type="button" className={`user-block-button ${user.isBlocked ? 'unblock' : 'block'}`} onClick={() => handleToggleBlock(user)}>{text(user.isBlocked ? 'Unblock' : 'Block')}</button><button type="button" className="user-delete-button" onClick={() => handleDeleteUser(user)}>{text('Delete')}</button></td></tr>) : <tr><td colSpan="7" className="admin-empty">{text('No accounts match these filters.')}</td></tr>}</tbody></table></div>
          </section>}
        </>}

        {activeTab === 'feedbacks' && <section className="admin-queue">
          <div className="queue-heading"><div><h2>{text('User Feedbacks & Messages / የተጠቃሚዎች አስተያየት')}</h2><button type="button" className="back-dashboard-button" onClick={() => setActiveTab('users')}>{text('← Back to Dashboard / ወደ ዳሽቦርድ ተመለስ')}</button></div><span>{feedbacks.length} {text('total')}</span></div>
          <div className="admin-table"><table><thead><tr><th>{text('#')}</th><th>{text('Full Name')}</th><th>{text('Email')}</th><th>{text('Subject')}</th><th>{text('Message / Feedback')}</th><th>{text('Date')}</th></tr></thead><tbody>{feedbacks.length ? feedbacks.map((item, index) => <tr key={item._id || index}><td>#{index + 1}</td><td><strong>{item.name}</strong></td><td>{item.email || item.contact || text('Not provided')}</td><td>{item.subject || text('No subject')}</td><td>{item.message}</td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString(isAmharic ? 'am-ET' : 'en-US') : text('Not provided')}</td></tr>) : <tr><td colSpan="6" className="admin-empty">{text('No user feedbacks available.')}</td></tr>}</tbody></table></div>
        </section>}
          </div>
        </div>

        {selectedUser && <div className="admin-review-backdrop" role="presentation" onClick={() => setSelectedUser(null)}>
          <section className="admin-review-modal" role="dialog" aria-modal="true" aria-labelledby="account-review-title" onClick={(event) => event.stopPropagation()}>
            <div className="admin-review-heading"><h2 id="account-review-title">{text('Account Review Details')}</h2><button type="button" onClick={() => setSelectedUser(null)} aria-label={text('Close review')}>X</button></div>
            <dl className="admin-review-details">
              <div><dt>{text('Account ID')}</dt><dd>{selectedUser._id}</dd></div>
              <div><dt>{text('Full Name')}</dt><dd>{selectedUser.fullName || selectedUser.name || text('Not provided')}</dd></div>
              <div><dt>{text('Email')}</dt><dd>{selectedUser.email || text('Not provided')}</dd></div>
              <div><dt>{text('Phone')}</dt><dd>{selectedUser.phone || text('Not provided')}</dd></div>
              <div><dt>{text('Role')}</dt><dd>{text(selectedUser.role || 'user')}</dd></div>
              <div><dt>{text('Status')}</dt><dd>{text(selectedUser.isBlocked ? 'Blocked' : 'Active')}</dd></div>
              <div><dt>{text('Created')}</dt><dd>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString(isAmharic ? 'am-ET' : 'en-US') : text('Not provided')}</dd></div>
            </dl>
            <button type="button" className="admin-review-close" onClick={() => setSelectedUser(null)}>{text('Close')}</button>
          </section>
        </div>}

        {pendingAccountAction && (() => {
          const { type, user, nextBlockedState } = pendingAccountAction;
          const isDelete = type === 'delete';
          const actionLabel = text(isDelete ? 'Delete account' : nextBlockedState ? 'Block account' : 'Unblock account');
          const accountName = user.fullName || user.name || user.email || text('this account');

          return (
            <div className="admin-confirm-backdrop" role="presentation" onMouseDown={(event) => {
              if (!accountActionLoading && event.target === event.currentTarget) setPendingAccountAction(null);
            }}>
              <section className="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="account-confirm-title">
                <div className="admin-confirm-icon" aria-hidden="true">{isDelete ? '!' : nextBlockedState ? '⛔' : '✓'}</div>
                <h2 id="account-confirm-title">{actionLabel}?</h2>
                <p>
                  {isDelete
                    ? text('This permanently removes the account. This action cannot be undone.')
                    : nextBlockedState
                      ? text('This account will no longer be able to sign in until it is unblocked.')
                      : text('This account will be able to sign in again.')}
                </p>
                <div className="admin-confirm-account">
                  <strong>{accountName}</strong>
                  {user.email && <span>{user.email}</span>}
                </div>
                <div className="admin-confirm-actions">
                  <button type="button" disabled={accountActionLoading} onClick={() => setPendingAccountAction(null)}>{text('Cancel')}</button>
                  <button type="button" className={isDelete || nextBlockedState ? 'confirm-danger' : 'confirm-primary'} disabled={accountActionLoading} onClick={confirmAccountAction}>
                    {accountActionLoading ? text('Please wait...') : actionLabel}
                  </button>
                </div>
              </section>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
