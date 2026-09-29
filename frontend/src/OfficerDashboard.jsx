import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OfficerDashboard.css';
import './OfficerAnalytics.css';

const ID_SERVICES = ['NEW_ID_CARD', 'New ID Card'];
const RENEWAL_SERVICES = ['ID_RENEWAL', 'ID_REPLACEMENT', 'ID Renewal', 'ID Replacement'];
const VITAL_SERVICES = ['BIRTH_REGISTRATION', 'MARRIAGE_REGISTRATION', 'DIVORCE_REGISTRATION', 'DEATH_REGISTRATION'];
const PENDING_STATUSES = ['PENDING_OFFICER', 'Pending', 'pending'];

const getName = (application) => application.fullName || [application.firstName, application.middleName, application.lastName].filter(Boolean).join(' ') || application.husbandName || application.wifeName || 'Unknown applicant';
const getPhone = (application) => application.phoneNumber || application.phone || application.husbandPhone || application.wifePhone || 'Not provided';
const getAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPassed = today.getMonth() > birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!birthdayPassed) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
};
const groupFor = (serviceType) => {
  if (ID_SERVICES.includes(serviceType)) return 'new';
  if (RENEWAL_SERVICES.includes(serviceType)) return 'renewal';
  if (VITAL_SERVICES.includes(serviceType)) return 'vital';
  return 'new';
};
const formatService = (serviceType) => (serviceType || 'Application').replaceAll('_', ' ').toLowerCase().replace(/(^| )\w/g, (letter) => letter.toUpperCase());
const photoUrl = (photo) => photo ? `/${photo.replaceAll('\\', '/').replace(/^.*uploads\//, 'uploads/')}` : '';

function OfficerDashboard() {
  const [applications, setApplications] = useState([]);
  const [query, setQuery] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/services/all', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load applications');
      setApplications(Array.isArray(data) ? data : []);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
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

  const filteredApplications = useMemo(() => applications.filter((application) => {
    const searchable = `${getName(application)} ${getPhone(application)} ${application.applicationId || ''} ${application.nationalId || ''}`.toLowerCase();
    const age = getAge(application.dateOfBirth);
    const matchesAge = ageFilter === 'all' || (ageFilter === 'adult' && age !== null && age >= 18) || (ageFilter === 'underage' && age !== null && age < 18);
    return searchable.includes(query.toLowerCase()) && matchesAge;
  }), [applications, query, ageFilter]);

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/services/update-status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Status update failed');
      setApplications((current) => current.map((application) => application._id === id ? data : application));
    } catch (requestError) {
      window.alert(requestError.message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const renderRow = (application) => {
    const age = getAge(application.dateOfBirth);
    const photo = application.passportPhoto || application.webcamPhoto || application.husbandPhoto || application.wifePhoto;
    const status = application.status || 'Pending';
    return <tr key={application._id}>
      <td className="officer-id">#{application.applicationId || application._id?.slice(-6)}</td>
      <td>{photo ? <img className="officer-photo" src={photoUrl(photo)} alt="Applicant" /> : <span className="photo-placeholder">ID</span>}</td>
      <td><strong>{getName(application)}</strong><small>{application.email || 'No email'}</small></td>
      <td>{age === null ? 'Not provided' : <span className={age >= 18 ? 'age-valid' : 'age-warning'}>{age >= 18 ? '✓ ' : ''}{age} years</span>}</td>
      <td className="phone-cell">✓ {getPhone(application)}</td>
      <td><span className="status-file">{formatService(application.serviceType)}</span></td>
      <td><span className={`status status-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span></td>
      <td className="actions"><button className="details-button" onClick={() => window.alert(JSON.stringify(application, null, 2))}>View Details</button>{PENDING_STATUSES.includes(status) && <button className="approve-button" onClick={() => updateStatus(application._id, 'Approved')}>Approve</button>}</td>
    </tr>;
  };

  const section = (key, title, applicationsForSection, icon) => <section className={`officer-section ${key}`}>
    <div className="section-bar"><h2>{icon} {title}</h2><span>{applicationsForSection.length} total</span></div>
    <div className="table-scroll"><table><thead><tr><th>Account</th><th>Photo</th><th>Full name</th><th>Age (≥18)</th><th>Phone number</th><th>File status</th><th>Condition</th><th>Activities</th></tr></thead><tbody>{applicationsForSection.length ? applicationsForSection.map(renderRow) : <tr><td className="empty-row" colSpan="8">No applications found.</td></tr>}</tbody></table></div>
  </section>;

  const groups = { new: filteredApplications.filter((application) => groupFor(application.serviceType) === 'new'), renewal: filteredApplications.filter((application) => groupFor(application.serviceType) === 'renewal'), vital: filteredApplications.filter((application) => groupFor(application.serviceType) === 'vital') };

  return <div className="officer-dashboard">
    <header className="officer-header"><div className="officer-brand"><span className="brand-icon">▣</span><span>E-Kebele Portal<small>OFFICER WORKSPACE</small></span></div><div className="officer-user"><span>◉ Hello, <strong>Kebele Officer</strong></span><button onClick={logout}>↪ Logout</button></div></header>
    <main className="officer-main"><section className="officer-visual"><div className="officer-visual-copy"><p className="eyebrow">FIELD OPERATIONS / APPLICATION REVIEW</p><h1>Kebele Officer Main Dashboard</h1><p>Review citizen requests, verify documents, and approve service applications from one workspace.</p><div className="officer-visual-stats"><span><strong>{applications.length}</strong> Total applications</span><span><strong>{groups.new.length + groups.renewal.length}</strong> ID services</span><span><strong>{groups.vital.length}</strong> Vital events</span></div></div><div className="officer-visual-image"><img src="/images/officer_dashboard_banner.jpg" alt="Ethiopian Kebele officer at work" /></div></section><div className="officer-heading"><div><p className="eyebrow">APPLICATION QUEUE</p><h2>Review and approve requests</h2><p>Filter applicants by age, phone number, or photo.</p></div><div className="officer-count"><strong>{applications.length}</strong><span>Total applications</span></div></div>
      <div className="officer-filters"><label>Search applications<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, phone, ID number..." /></label><label>Age filter<select value={ageFilter} onChange={(event) => setAgeFilter(event.target.value)}><option value="all">All ages</option><option value="adult">18 years and above</option><option value="underage">Under 18</option></select></label><button className="refresh-button" onClick={loadApplications}>↻ Refresh</button></div>
      {loading && <div className="officer-message">Loading applications...</div>}{error && <div className="officer-message error-message">{error}</div>}{!loading && !error && <>{section('new', 'New ID Applications', groups.new, '▣')}{section('renewal', 'ID Renewal and Replacement', groups.renewal, '↻')}{section('vital', 'Vital Events', groups.vital, '✦')}</>}
    </main>
  </div>;
}

export default OfficerDashboard;
