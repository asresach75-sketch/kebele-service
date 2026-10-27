import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import './OfficerDashboard.css';
import './OfficerAnalytics.css';
import { getOfficerApplicationStatusGroup, PENDING_STATUSES } from './utils/officerApplicationStatus';

const ID_SERVICES = ['NEW_ID_CARD', 'New ID Card'];
const RENEWAL_SERVICES = ['ID_RENEWAL', 'ID_REPLACEMENT', 'ID Renewal', 'ID Replacement'];
const VITAL_SERVICES = ['BIRTH_REGISTRATION', 'MARRIAGE_REGISTRATION', 'DIVORCE_REGISTRATION', 'DEATH_REGISTRATION'];
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/+$/, '');
const ALL_REVIEW_DOCUMENTS = [
  ['Previous ID Card Copy', 'previousIdDocument'],
  ['Police Report for Lost ID', 'policeReport'],
  ['Photo of Damaged ID', 'damagedIdDocument'],
  ['Release Letter', 'releaseLetter'],
  ['Housing Proof', 'housingProof'],
  ['Local Leader / Block Verification', 'localLeaderVerification'],
  ['Passport-size Photo', 'passportPhoto'],
  ['Captured Photo', 'webcamPhoto'],
  ['Police / Security Clearance', 'policeClearance'],
  ['Employment Letter', 'employmentLetter'],
  ['Birth Certificate', 'birthCertificate'],
  ['Residence Proof', 'residenceProof'],
  ['Emergency Birth Certificate', 'emergencyBirthCertificate'],
  ['Marriage Certificate', 'marriageCertificate'],
  ['Divorce Document', 'divorceDocument'],
  ['Death Certificate', 'deathCertificate']
];

const getReviewDocuments = (application) => {
  const serviceType = String(application.serviceType || '').toUpperCase();
  const isNewId = ['NEW_ID_CARD', 'NEW ID CARD'].includes(serviceType);
  const isIdRenewal = ['ID_RENEWAL', 'ID_REPLACEMENT', 'ID RENEWAL', 'ID REPLACEMENT'].includes(serviceType);
  const hasFile = (field) => Boolean(application[field]);
  const uploaded = (documents) => documents.filter(([, field]) => hasFile(field));

  if (isNewId || isIdRenewal) {
    const photoField = hasFile('passportPhoto') ? 'passportPhoto' : 'webcamPhoto';
    const documents = [['ID Photo (passport or captured photo) · Required', photoField]];
    if (isNewId) {
      const proofField = hasFile('residenceProof') ? 'residenceProof' : 'housingProof';
      documents.push(['Birth Certificate · Required', 'birthCertificate']);
      documents.push(['Residence or Housing Proof · Required', proofField]);
    } else {
      const renewalReason = String(application.renewalReason || '').toUpperCase();
      if (renewalReason === 'LOST') {
        documents.push(['Police Report for Lost ID · Required', 'policeReport']);
        if (hasFile('previousIdDocument')) documents.push(['Previous ID Card Copy · Optional', 'previousIdDocument']);
      } else if (renewalReason === 'DAMAGED') {
        documents.push(['Photo of Damaged ID · Required', 'damagedIdDocument']);
        if (hasFile('previousIdDocument')) documents.push(['Previous ID Card Copy', 'previousIdDocument']);
      } else {
        documents.push(['Previous ID Card Copy · Required', 'previousIdDocument']);
      }
      documents.push(...uploaded([['Birth Certificate', 'birthCertificate'], ['Residence Proof', 'residenceProof']]));
    }
    documents.push(...uploaded([
      ['Emergency Birth Certificate', 'emergencyBirthCertificate'],
      ['Release Letter', 'releaseLetter'],
      ['Housing Proof', 'housingProof'],
      ['Local Leader / Block Verification', 'localLeaderVerification'],
      ['Police / Security Clearance', 'policeClearance'],
      ['Employment Letter', 'employmentLetter'],
    ]));
    return documents;
  }

  if (serviceType === 'BIRTH_REGISTRATION') {
    return [
      ['Child Photo · Required', 'webcamPhoto'],
      ...uploaded([['Birth Certificate', 'birthCertificate'], ['Residence Proof', 'residenceProof']]),
    ];
  }

  if (serviceType === 'DIVORCE_REGISTRATION') {
    return [['Divorce Document · Required', 'divorceDocument'], ['Marriage Certificate · Required', 'marriageCertificate']];
  }

  if (serviceType === 'MARRIAGE_REGISTRATION') {
    return uploaded([
      ['Marriage Certificate', 'marriageCertificate'],
      ['Marriage Certificate Photo', 'marriageCertPhoto'],
      ['Husband Photo', 'husbandPhoto'],
      ['Wife Photo', 'wifePhoto'],
      ['Witness 1 ID Document', 'witness1IdDocument'],
      ['Witness 2 ID Document', 'witness2IdDocument'],
      ['Witness 3 ID Document', 'witness3IdDocument'],
    ]);
  }

  if (serviceType === 'DEATH_REGISTRATION') {
    return uploaded([['Death Certificate', 'deathCertificate']]);
  }

  return uploaded(ALL_REVIEW_DOCUMENTS);
};

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
const documentUrl = (filePath) => {
  if (!filePath) return '';
  const normalized = String(filePath).replaceAll('\\', '/');
  const uploadsIndex = normalized.lastIndexOf('/uploads/');
  const relativePath = uploadsIndex >= 0 ? normalized.slice(uploadsIndex + 9) : normalized.replace(/^\/?uploads\//, '');
  return `${API_BASE_URL}/uploads/${relativePath.split('/').map(encodeURIComponent).join('/')}`;
};
const photoUrl = documentUrl;

function OfficerDashboard() {
  const [applications, setApplications] = useState([]);
  const [query, setQuery] = useState('');
  const [ageFilter, setAgeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [reviewReason, setReviewReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewDocument, setPreviewDocument] = useState(null);
  const navigate = useNavigate();
  const { lang, toggleLanguage } = useLanguage();
  const isAmharic = lang === 'am';
  const text = (english, amharic) => isAmharic ? amharic : english;
  const localizeStatus = (status) => isAmharic ? ({
    Pending: 'በመጠባበቅ ላይ',
    PENDING_OFFICER: 'የኦፊሰር ማረጋገጫ በመጠባበቅ ላይ',
    Approved: 'ጸድቋል',
    APPROVED_BY_OFFICER: 'በኦፊሰር ጸድቋል',
    APPROVED_BY_FINANCE: 'በፋይናንስ ጸድቋል',
    Rejected: 'ውድቅ ተደርጓል',
    REJECTED: 'ውድቅ ተደርጓል',
    NEEDS_CORRECTION: 'ማስተካከያ ያስፈልጋል',
    PAID_PENDING_FINANCE: 'ክፍያ ተልኳል፣ ማረጋገጫ ይጠበቃል',
    COMPLETED: 'ተጠናቋል',
  }[status] || status) : status;
  const localizeService = (serviceType) => {
    const service = formatService(serviceType);
    if (!isAmharic) return service;
    return ({
      'NEW ID CARD': 'አዲስ መታወቂያ',
      'ID RENEWAL': 'የመታወቂያ እድሳት',
      'ID REPLACEMENT': 'የመታወቂያ ምትክ',
      'BIRTH REGISTRATION': 'የልደት ምዝገባ',
      'MARRIAGE REGISTRATION': 'የጋብቻ ምዝገባ',
      'DIVORCE REGISTRATION': 'የፍቺ ምዝገባ',
      'DEATH REGISTRATION': 'የሞት ምዝገባ',
    })[service.toUpperCase()] || service;
  };
  const localizeDocumentLabel = (label) => isAmharic ? ({
    'Previous ID Card Copy': 'የቀድሞ መታወቂያ ቅጂ',
    'Previous ID Card Copy · Required': 'የቀድሞ መታወቂያ ቅጂ · ግዴታ',
    'Previous ID Card Copy · Optional': 'የቀድሞ መታወቂያ ቅጂ · አማራጭ',
    'Police Report for Lost ID · Required': 'ለጠፋ መታወቂያ የፖሊስ ማስረጃ · ግዴታ',
    'Photo of Damaged ID · Required': 'የተበላሸው መታወቂያ ፎቶ · ግዴታ',
    'Police Report for Lost ID': 'ለጠፋ መታወቂያ የፖሊስ ማስረጃ',
    'Photo of Damaged ID': 'የተበላሸው መታወቂያ ፎቶ',
    'Release Letter': 'የመልቀቂያ ደብዳቤ',
    'Housing Proof': 'የመኖሪያ ማረጋገጫ',
    'Local Leader / Block Verification': 'የአካባቢ አመራር ማረጋገጫ',
    'Passport-size Photo': 'የፓስፖርት መጠን ፎቶ',
    'Captured Photo': 'የተነሳ ፎቶ',
    'Police / Security Clearance': 'የፖሊስ / ደህንነት ማረጋገጫ',
    'Employment Letter': 'የሥራ ማረጋገጫ ደብዳቤ',
    'Birth Certificate': 'የልደት ማስረጃ',
    'Residence Proof': 'የመኖሪያ ማረጋገጫ',
    'Emergency Birth Certificate': 'የአስቸኳይ ልደት ማስረጃ',
    'Marriage Certificate': 'የጋብቻ ማስረጃ',
    'Divorce Document': 'የፍቺ ሰነድ',
    'Death Certificate': 'የሞት ማስረጃ',
    'ID Photo (passport or captured photo) · Required': 'የመታወቂያ ፎቶ · አስፈላጊ',
    'Child Photo · Required': 'የልጅ ፎቶ · አስፈላጊ',
    'Divorce Document · Required': 'የፍቺ ሰነድ · አስፈላጊ',
    'Marriage Certificate · Required': 'የጋብቻ ማስረጃ · አስፈላጊ',
    'Marriage Certificate Photo': 'የጋብቻ ማስረጃ ፎቶ',
    'Husband Photo': 'የባል ፎቶ',
    'Wife Photo': 'የሚስት ፎቶ',
    'Witness 1 ID Document': 'የምስክር 1 መታወቂያ ሰነድ',
    'Witness 2 ID Document': 'የምስክር 2 መታወቂያ ሰነድ',
    'Witness 3 ID Document': 'የምስክር 3 መታወቂያ ሰነድ',
  }[label] || label) : label;

  const loadApplications = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
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

  useEffect(() => {
    const handleDocumentPreview = (event) => {
      const link = event.target?.closest?.('a.review-document-link');
      if (!link) return;
      event.preventDefault();
      const title = link.closest('.review-document')?.querySelector('h4')?.textContent || 'Application document';
      setPreviewDocument({ title, url: link.href });
    };
    document.addEventListener('click', handleDocumentPreview, true);
    return () => document.removeEventListener('click', handleDocumentPreview, true);
  }, []);

  const searchedApplications = useMemo(() => applications.filter((application) => {
    const searchable = `${getName(application)} ${getPhone(application)} ${application.applicationId || ''} ${application.nationalId || ''}`.toLowerCase();
    const age = getAge(application.dateOfBirth);
    const matchesAge = ageFilter === 'all' || (ageFilter === 'adult' && age !== null && age >= 18) || (ageFilter === 'underage' && age !== null && age < 18);
    return searchable.includes(query.toLowerCase()) && matchesAge;
  }), [applications, query, ageFilter]);

  const filteredApplications = useMemo(() => searchedApplications.filter((application) => (
    statusFilter === 'all' || getOfficerApplicationStatusGroup(application.status) === statusFilter
  )), [searchedApplications, statusFilter]);
  const visiblePending = filteredApplications.filter((application) => PENDING_STATUSES.includes(application.status || 'Pending'));
  const selectedPending = visiblePending.filter((application) => selectedIds.includes(application._id));
  const allVisibleSelected = visiblePending.length > 0 && visiblePending.every((application) => selectedIds.includes(application._id));

  const updateStatus = async (id, status, reason = '') => {
    setUpdatingStatus(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await fetch(`/api/services/update-status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, reason })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Status update failed');
      setApplications((current) => current.map((application) => application._id === id ? data : application));
      setSelectedIds((current) => current.filter((selectedId) => selectedId !== id));
      setSelectedApplication(null);
      setReviewReason('');
    } catch (requestError) {
      window.alert(requestError.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const confirmDecision = (status, application) => {
    const action = status === 'Approved'
      ? text('approve', 'ማጽደቅ')
      : status === 'Rejected'
        ? text('reject', 'ውድቅ ማድረግ')
        : text('request a correction for', 'ማስተካከያ መጠየቅ');
    const name = getName(application);
    if (!window.confirm(text(
      `Are you sure you want to ${action} ${name}'s application?`,
      `የ${name} ማመልከቻን ${action} እርግጠኛ ነዎት?`
    ))) return;
    updateStatus(application._id, status, status === 'Approved' ? '' : reviewReason.trim());
  };

  const approveSelected = async () => {
    if (!selectedPending.length || updatingStatus) return;
    if (!window.confirm(text(
      `Are you sure you want to approve ${selectedPending.length} selected application(s)?`,
      `${selectedPending.length} የተመረጡ ማመልከቻዎችን ለማጽደቅ እርግጠኛ ነዎት?`
    ))) return;

    setUpdatingStatus(true);
    const updatedApplications = [];
    const failedIds = [];
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    for (const application of selectedPending) {
      try {
        const response = await fetch(`/api/services/update-status/${application._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: 'Approved' }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Status update failed');
        updatedApplications.push(data);
      } catch (requestError) {
        failedIds.push(`${application.applicationId || application._id}: ${requestError.message}`);
      }
    }
    setApplications((current) => current.map((application) => updatedApplications.find((updated) => updated._id === application._id) || application));
    const approvedIds = updatedApplications.map((application) => application._id);
    setSelectedIds((current) => current.filter((id) => !approvedIds.includes(id)));
    setUpdatingStatus(false);
    if (failedIds.length) {
      window.alert(text(
        `${approvedIds.length} approved; ${failedIds.length} failed: ${failedIds.join(', ')}`,
        `${approvedIds.length} ማመልከቻዎች ጸድቀዋል፤ ${failedIds.length} አልተሳኩም: ${failedIds.join(', ')}`
      ));
    }
  };

  const toggleApplication = (id, checked) => {
    setSelectedIds((current) => checked
      ? Array.from(new Set([...current, id]))
      : current.filter((selectedId) => selectedId !== id));
  };

  const toggleVisiblePending = (checked) => {
    const visibleIds = visiblePending.map((application) => application._id);
    setSelectedIds((current) => checked
      ? Array.from(new Set([...current, ...visibleIds]))
      : current.filter((id) => !visibleIds.includes(id)));
  };

  const submitReviewDecision = (status) => {
    if (!selectedApplication) return;
    if (status !== 'Approved' && !reviewReason.trim()) {
      window.alert(text(
        'Enter a reason for requesting corrections or rejecting this application.',
        'ማስተካከያ ለመጠየቅ ወይም ማመልከቻውን ውድቅ ለማድረግ ምክንያቱን ያስገቡ።'
      ));
      return;
    }
    confirmDecision(status, selectedApplication);
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const renderRow = (application) => {
    const age = getAge(application.dateOfBirth);
    const photo = application.passportPhoto || application.webcamPhoto || application.husbandPhoto || application.wifePhoto;
    const status = application.status || 'Pending';
    return <tr key={application._id}>
      <td><input type="checkbox" aria-label={`${text('Select', 'ይምረጡ')} ${getName(application)}`} checked={PENDING_STATUSES.includes(status) && selectedIds.includes(application._id)} disabled={!PENDING_STATUSES.includes(status) || updatingStatus} onChange={(event) => toggleApplication(application._id, event.target.checked)} /></td>
      <td className="officer-id">#{application.applicationId || application._id?.slice(-6)}</td>
      <td>{photo ? <img className="officer-photo" src={photoUrl(photo)} alt={text('Applicant', 'አመልካች')} /> : <span className="photo-placeholder">ID</span>}</td>
      <td><strong>{getName(application)}</strong><small>{application.email || text('No email', 'ኢሜይል የለም')}</small></td>
      <td>{age === null ? text('Not provided', 'አልቀረበም') : <span className={age >= 18 ? 'age-valid' : 'age-warning'}>{age >= 18 ? '✓ ' : ''}{age} {text('years', 'ዓመት')}</span>}</td>
      <td className="phone-cell">✓ {getPhone(application)}</td>
      <td><span className="status-file">{localizeService(application.serviceType)}</span></td>
      <td><span className={`status status-${getOfficerApplicationStatusGroup(status)}`}>{localizeStatus(status)}</span></td>
      <td className="actions"><button type="button" className="details-button" onClick={() => { setSelectedApplication(application); setReviewReason(''); }}>{text('View Details', 'ዝርዝር ይመልከቱ')}</button>{PENDING_STATUSES.includes(status) && <button type="button" className="approve-button" disabled={updatingStatus} onClick={() => confirmDecision('Approved', application)}>{text('Approve', 'አጽድቅ')}</button>}</td>
    </tr>;
  };

  const section = (key, title, applicationsForSection, icon) => <section className={`officer-section ${key}`}>
    <div className="section-bar"><h2>{icon} {title}</h2><span>{applicationsForSection.length} {text('total', 'ጠቅላላ')}</span></div>
    <div className="table-scroll"><table><thead><tr><th>{text('Select', 'ምረጥ')}</th><th>{text('Account', 'መለያ')}</th><th>{text('Photo', 'ፎቶ')}</th><th>{text('Full name', 'ሙሉ ስም')}</th><th>{text('Age (≥18)', 'ዕድሜ (≥18)')}</th><th>{text('Phone number', 'ስልክ ቁጥር')}</th><th>{text('File status', 'አገልግሎት')}</th><th>{text('Condition', 'ሁኔታ')}</th><th>{text('Actions', 'ድርጊቶች')}</th></tr></thead><tbody>{applicationsForSection.length ? applicationsForSection.map(renderRow) : <tr><td className="empty-row" colSpan="9">{text('No applications found.', 'ምንም ማመልከቻ አልተገኘም።')}</td></tr>}</tbody></table></div>
  </section>;

  const groups = { new: filteredApplications.filter((application) => groupFor(application.serviceType) === 'new'), renewal: filteredApplications.filter((application) => groupFor(application.serviceType) === 'renewal'), vital: filteredApplications.filter((application) => groupFor(application.serviceType) === 'vital') };
  const statusTabs = [
    { id: 'pending', label: text('⏳ Pending review', '⏳ በግምገማ ላይ'), count: searchedApplications.filter((application) => getOfficerApplicationStatusGroup(application.status) === 'pending').length },
    { id: 'approved', label: text('✓ Approved', '✓ ጸድቋል'), count: searchedApplications.filter((application) => getOfficerApplicationStatusGroup(application.status) === 'approved').length },
    { id: 'correction', label: text('↻ Needs correction', '↻ ማስተካከያ ያስፈልጋል'), count: searchedApplications.filter((application) => getOfficerApplicationStatusGroup(application.status) === 'correction').length },
    { id: 'rejected', label: text('✕ Rejected', '✕ ውድቅ ተደርጓል'), count: searchedApplications.filter((application) => getOfficerApplicationStatusGroup(application.status) === 'rejected').length },
    { id: 'all', label: text('All applications', 'ሁሉም ማመልከቻዎች'), count: searchedApplications.length },
  ];
  const REVIEW_DOCUMENTS = selectedApplication ? getReviewDocuments(selectedApplication) : [];

  return <div className="officer-dashboard">
    <header className="officer-header">
      <div className="officer-brand"><span className="brand-icon">▣</span><span>{isAmharic ? 'ኢ-ቀበሌ ፖርታል' : 'E-Kebele Portal'}<small>{isAmharic ? 'የኦፊሰር የስራ ቦታ' : 'OFFICER WORKSPACE'}</small></span></div>
      <div className="officer-user">
        <button type="button" className="officer-language-toggle" onClick={() => toggleLanguage(isAmharic ? 'en' : 'am')} aria-label={isAmharic ? 'Switch to English' : 'ወደ አማርኛ ቀይር'}>
          <span aria-hidden="true">🌐</span> {isAmharic ? 'English' : 'አማርኛ'}
        </button>
        <span>◉ {isAmharic ? 'ሰላም፣' : 'Hello,'} <strong>{isAmharic ? 'የቀበሌ ኦፊሰር' : 'Kebele Officer'}</strong></span>
        <button type="button" onClick={logout}>↪ {isAmharic ? 'ውጣ' : 'Logout'}</button>
      </div>
    </header>
    <main className="officer-main">
      <section className="officer-visual" aria-label={isAmharic ? 'የቀበሌ ኦፊሰር ዳሽቦርድ' : 'Kebele Officer Dashboard'}>
        <div className="officer-visual-image">
          <img src="/images/ethiopian-kebele-office-hero.png" alt={isAmharic ? 'በዘመናዊ የቀበሌ አገልግሎት ቢሮ ውስጥ ዜጎችና ኦፊሰሮች' : 'Citizens and officers in a modern Ethiopian Kebele service office'} />
        </div>
        <div className="officer-visual-overlay" aria-hidden="true" />
        <h1 className="officer-visual-title">{isAmharic ? 'የቀበሌ ኦፊሰር ዋና ዳሽቦርድ' : 'KEBELE OFFICER MAIN DASHBOARD'}</h1>
      </section>
      <div className="officer-heading"><div><p className="eyebrow">{text('APPLICATION QUEUE', 'የማመልከቻ ወረፋ')}</p><h2>{text('Review and approve requests', 'ማመልከቻዎችን ይገምግሙ እና ያጽድቁ')}</h2><p>{text('Filter applicants by age, phone number, or photo.', 'አመልካቾችን በዕድሜ፣ በስልክ ቁጥር ወይም በፎቶ ይፈልጉ።')}</p></div><div className="officer-count"><strong>{applications.length}</strong><span>{text('Total applications', 'ጠቅላላ ማመልከቻዎች')}</span></div></div>
      <div className="officer-filters">
        <label>{text('Search applications', 'ማመልከቻዎችን ይፈልጉ')}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text('Name, phone, ID number...', 'ስም፣ ስልክ ወይም የመታወቂያ ቁጥር...')} /></label>
        <label>{text('Age filter', 'የዕድሜ ማጣሪያ')}<select value={ageFilter} onChange={(event) => setAgeFilter(event.target.value)}><option value="all">{text('All ages', 'ሁሉም ዕድሜዎች')}</option><option value="adult">{text('18 years and above', '18 ዓመት እና ከዚያ በላይ')}</option><option value="underage">{text('Under 18', 'ከ18 ዓመት በታች')}</option></select></label>
        <button type="button" className="refresh-button" onClick={() => { setQuery(''); setAgeFilter('all'); loadApplications(); }}>↻ {text('Reset filters & refresh', 'ማጣሪያዎችን አጥፍተው ያድሱ')}</button>
      </div>
      <nav className="officer-status-tabs" aria-label={text('Filter applications by status', 'ማመልከቻዎችን በሁኔታ ያጣሩ')}>
        {statusTabs.map((tab) => <button key={tab.id} type="button" className={statusFilter === tab.id ? 'active' : ''} aria-pressed={statusFilter === tab.id} onClick={() => { setStatusFilter(tab.id); setSelectedIds([]); }}>
          <span>{tab.label}</span><strong>{tab.count}</strong>
        </button>)}
      </nav>
      {!loading && !error && <div className="officer-bulk-actions"><label><input type="checkbox" checked={allVisibleSelected} disabled={!visiblePending.length || updatingStatus} onChange={(event) => toggleVisiblePending(event.target.checked)} /> {text('Select all visible pending', 'የሚታዩትን በመጠባበቅ ላይ ያሉ ሁሉንም ይምረጡ')} ({visiblePending.length})</label><span>{selectedPending.length} {text('selected', 'ተመርጠዋል')}</span><button type="button" className="approve-button" disabled={!selectedPending.length || updatingStatus} onClick={approveSelected}>{updatingStatus ? text('Approving...', 'በማጽደቅ ላይ...') : `${text('Approve selected', 'የተመረጡትን አጽድቅ')} (${selectedPending.length})`}</button></div>}
      {loading && <div className="officer-message">{text('Loading applications...', 'ማመልከቻዎች በመጫን ላይ...')}</div>}{error && <div className="officer-message error-message">{error}</div>}{!loading && !error && <>{section('new', text('New ID Applications', 'አዲስ የመታወቂያ ማመልከቻዎች'), groups.new, '▣')}{section('renewal', text('ID Renewal and Replacement', 'የመታወቂያ እድሳት እና ምትክ'), groups.renewal, '↻')}{section('vital', text('Vital Events', 'የወሳኝ ኩነቶች ምዝገባ'), groups.vital, '✦')}</>}
    </main>
    {selectedApplication && <div className="review-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedApplication(null); }}>
      <section className="review-dialog" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <header className="review-dialog-header">
          <div><p className="eyebrow">{text('APPLICATION REVIEW', 'የማመልከቻ ግምገማ')}</p><h2 id="review-title">{getName(selectedApplication)}</h2><p>#{selectedApplication.applicationId || selectedApplication._id}</p></div>
          <button type="button" className="review-close" aria-label={text('Close details', 'ዝርዝሩን ዝጋ')} onClick={() => setSelectedApplication(null)}>×</button>
        </header>
        <div className="review-details-grid">
          <div><span>{text('Phone', 'ስልክ')}</span><strong>{getPhone(selectedApplication)}</strong></div>
          <div><span>{text('Email', 'ኢሜይል')}</span><strong>{selectedApplication.email || text('Not provided', 'አልቀረበም')}</strong></div>
          <div><span>{text('Date of birth', 'የትውልድ ቀን')}</span><strong>{selectedApplication.dateOfBirth || text('Not provided', 'አልቀረበም')}</strong></div>
          <div><span>{text('Calculated age', 'የተሰላ ዕድሜ')}</span><strong>{getAge(selectedApplication.dateOfBirth) ?? text('Not provided', 'አልቀረበም')}</strong></div>
          <div><span>{text('Gender', 'ጾታ')}</span><strong>{selectedApplication.gender || text('Not provided', 'አልቀረበም')}</strong></div>
          <div><span>{text('Current address', 'የአሁኑ አድራሻ')}</span><strong>{[selectedApplication.region, selectedApplication.zone, selectedApplication.woreda, selectedApplication.kebele, selectedApplication.residenceAddress].filter(Boolean).join(', ') || text('Not provided', 'አልቀረበም')}</strong></div>
          <div><span>{text('Previous residence', 'የቀድሞ አድራሻ')}</span><strong>{[selectedApplication.previousResidenceRegion, selectedApplication.previousResidenceZone, selectedApplication.previousResidenceWoreda, selectedApplication.previousResidenceKebele, selectedApplication.previousResidenceAddress].filter(Boolean).join(', ') || text('Not provided', 'አልቀረበም')}</strong></div>
          <div><span>{text('Service', 'አገልግሎት')}</span><strong>{localizeService(selectedApplication.serviceType)}</strong></div>
          <div><span>{text('Status', 'ሁኔታ')}</span><strong>{localizeStatus(selectedApplication.status || 'Pending')}</strong></div>
          {RENEWAL_SERVICES.includes(selectedApplication.serviceType) && <div><span>{text('Previous ID verification', 'የቀድሞ መታወቂያ ማረጋገጫ')}</span><strong>{selectedApplication.identityVerificationStatus === 'VERIFIED' ? text('Matched to an issued ID record', 'ከተሰጠ መታወቂያ መዝገብ ጋር ተዛምዷል') : text('Not found in the issued-ID records — manual verification required', 'በተሰጡ መታወቂያዎች መዝገብ ውስጥ አልተገኘም — በእጅ ማረጋገጥ ያስፈልጋል')}</strong></div>}
          {RENEWAL_SERVICES.includes(selectedApplication.serviceType) && <div><span>{text('Renewal reason', 'የእድሳት ምክንያት')}</span><strong>{({
            EXPIRED: text('Expired', 'ጊዜው ያለፈ'),
            LOST: text('Lost', 'የጠፋ'),
            DAMAGED: text('Damaged', 'የተበላሸ'),
          })[selectedApplication.renewalReason] || text('Not provided', 'አልቀረበም')}</strong></div>}
        </div>
        <h3 className="review-documents-title">{text('Submitted documents', 'የቀረቡ ሰነዶች')}</h3>
        <div className="review-documents">{REVIEW_DOCUMENTS.map(([label, field]) => {
          const filePath = selectedApplication[field];
          const url = documentUrl(filePath);
          const isImage = /\.(jpe?g|png)$/i.test(String(filePath || ''));
          const isPdf = /\.pdf$/i.test(String(filePath || ''));
          const displayLabel = localizeDocumentLabel(label);
          return <article className="review-document" key={field}>
            <h4>{displayLabel}</h4>
            {url ? <>{isImage && <a className="review-document-link" href={url} target="_blank" rel="noreferrer"><img src={url} alt={`${displayLabel} ${text('document', 'ሰነድ')}`} /></a>}{isPdf && <><iframe src={url} title={displayLabel} /><button type="button" className="review-document-link" onClick={() => setPreviewDocument({ title: displayLabel, url })}>{text('Open PDF viewer', 'PDF ይመልከቱ')}</button></>}{!isImage && !isPdf && <><p>{text('File attached', 'ፋይል ተያይዟል')}</p><a className="review-document-link" href={url} target="_blank" rel="noreferrer">{text('Open original', 'ዋናውን ፋይል ይክፈቱ')}</a></>}</> : <p className="review-missing">{text('Not submitted', 'አልቀረበም')}</p>}
          </article>;
        })}</div>
        {selectedApplication.correctionReason && <p className="review-prior-reason"><strong>{text('Previous review note:', 'የቀድሞ የግምገማ ማስታወሻ:')}</strong> {selectedApplication.correctionReason}</p>}
        {PENDING_STATUSES.includes(selectedApplication.status || 'Pending') && <div className="review-decision">
          <label htmlFor="review-reason">{text('Review note', 'የግምገማ ማስታወሻ')} <span>{text('(required for correction or rejection)', '(ማስተካከያ ለመጠየቅ ወይም ለመቃወም ያስፈልጋል)')}</span>
            <textarea id="review-reason" value={reviewReason} onChange={(event) => setReviewReason(event.target.value)} rows="3" placeholder={text('Describe the missing or unreadable document...', 'የጎደለውን ወይም ማንበብ የማይቻለውን ሰነድ ይግለጹ...')} />
          </label>
          <div className="review-actions">
            <button type="button" className="review-reject" disabled={updatingStatus} onClick={() => submitReviewDecision('Rejected')}>{text('Reject', 'ውድቅ አድርግ')}</button>
            <button type="button" className="review-correction" disabled={updatingStatus} onClick={() => submitReviewDecision('NEEDS_CORRECTION')}>{text('Request correction', 'ማስተካከያ ጠይቅ')}</button>
            <button type="button" className="approve-button" disabled={updatingStatus} onClick={() => confirmDecision('Approved', selectedApplication)}>{text('Approve', 'አጽድቅ')}</button>
          </div>
        </div>}
      </section>
    </div>}
    {previewDocument && <div className="document-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewDocument(null); }}><section className="document-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="document-preview-title"><header className="document-preview-header"><h2 id="document-preview-title">{previewDocument.title}</h2><button type="button" className="review-close" aria-label="Close preview" onClick={() => setPreviewDocument(null)}>×</button></header><div className="document-preview-content">{/\.(png|jpe?g|gif|webp|bmp|svg)(?:$|[?#])/i.test(previewDocument.url) ? <img src={previewDocument.url} alt={previewDocument.title} /> : <iframe src={previewDocument.url} title={previewDocument.title} />}</div></section></div>}
  </div>;
}

export default OfficerDashboard;
