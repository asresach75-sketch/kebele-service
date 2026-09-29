import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';
import './AdminDashboardRedesign.css';
import './AdminImage.css';

const completeStatuses = ['Approved', 'Approved - Pending Payment', 'Payment Verified', 'APPROVED_BY_OFFICER', 'PAID_PENDING_FINANCE', 'APPROVED_BY_FINANCE', 'COMPLETED'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staff, setStaff] = useState({ fullName: '', email: '', phone: '', password: '', role: 'officer' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const loadUsers = async () => setUsers((await axios.get('/api/users')).data);

  useEffect(() => {
    axios.defaults.headers.common.Authorization = `Bearer ${localStorage.getItem('token')}`;
    Promise.all([axios.get('/api/services'), loadUsers()])
      .then(([response]) => setRequests(response.data))
      .catch(() => setError('Unable to load admin data.'));
  }, []);

  useEffect(() => {
    if (activeTab !== 'feedbacks') return;
    axios.get('/api/services/feedbacks')
      .then((response) => setFeedbacks(response.data.feedbacks || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load user feedbacks.'));
  }, [activeTab]);

  const addStaff = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      await axios.post('/api/users/staff', staff);
      setMessage('Staff account created successfully.');
      setStaff({ fullName: '', email: '', phone: '', password: '', role: 'officer' });
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to create staff account.');
    }
  };

  const handleToggleBlock = async (user) => {
    const nextBlockedState = !user.isBlocked;
    const action = nextBlockedState ? 'block' : 'unblock';
    if (!window.confirm(`Are you sure you want to ${action} ${user.fullName}?`)) return;

    try {
      const response = await axios.patch(`/api/users/${user._id}/block`, { isBlocked: nextBlockedState });
      setUsers((currentUsers) => currentUsers.map((item) => item._id === user._id ? response.data.user : item));
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Unable to ${action} user.`);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${user.fullName || user.email}?`)) return;

    try {
      await axios.delete(`/api/users/${user._id}`);
      setUsers((currentUsers) => currentUsers.filter((item) => item._id !== user._id));
      setMessage('User account deleted successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete user account.');
    }
  };

  const completeApplication = async (request) => {
    try {
      const response = await axios.put(`/api/services/update-status/${request._id}`, { status: 'COMPLETED' });
      setRequests((currentRequests) => currentRequests.map((item) => item._id === request._id ? response.data : item));
      setMessage(`Application ${request.applicationId} marked as completed.`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to complete application.');
    }
  };

  const handleReviewUser = (user) => setSelectedUser(user);

  const logout = () => { localStorage.clear(); navigate('/login'); };
  const pendingNew = requests.filter((item) => ['NEW_ID_CARD', 'New ID Card'].includes(item.serviceType) && !completeStatuses.includes(item.status)).length;
  const pendingVital = requests.filter((item) => item.serviceType?.includes('REGISTRATION') && !completeStatuses.includes(item.status)).length;

  return (
    <div className="admin-dashboard">
      <main className="admin-main">
        <div className="admin-welcome">
          <div>
            <p className="admin-eyebrow">ADMINISTRATION / SERVICE CONTROL</p>
            <h1>E-Kebele Admin Dashboard</h1>
            <p>Monitor applications, staff activity, payments, and vital event records.</p>
          </div>
          <button type="button" className="admin-logout-button" onClick={logout}>Logout / ውጣ</button>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-tabs" role="tablist" aria-label="Admin dashboard sections">
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => { setActiveTab('users'); setShowStaffForm(false); }}>👥 User & Staff Accounts</button>
          <button className={activeTab === 'add-staff' ? 'active' : ''} onClick={() => navigate('/add-staff')}>♟ Add Staff</button>
          <button onClick={() => navigate('/manage-fees')}>▣ Service Fees</button>
          <button className={activeTab === 'feedbacks' ? 'active' : ''} onClick={() => navigate('/user-feedbacks')}>💬 User Feedbacks</button>
        </div>

        {activeTab === 'add-staff' && showStaffForm && (
          <form className="staff-form" onSubmit={addStaff}>
            <h2>New Staff Account</h2>
            {message && <p>{message}</p>}
            <input placeholder="Full name" value={staff.fullName} onChange={(event) => setStaff({ ...staff, fullName: event.target.value })} required />
            <input type="email" placeholder="Email (optional)" value={staff.email} onChange={(event) => setStaff({ ...staff, email: event.target.value })} />
            <input placeholder="Phone (optional)" value={staff.phone} onChange={(event) => setStaff({ ...staff, phone: event.target.value })} />
            <input type="password" placeholder="Temporary password (min 8)" value={staff.password} onChange={(event) => setStaff({ ...staff, password: event.target.value })} required minLength={8} />
            <select value={staff.role} onChange={(event) => setStaff({ ...staff, role: event.target.value })}>
              <option value="officer">Officer / Verifier</option>
              <option value="finance">Finance Officer</option>
              <option value="admin">Administrator</option>
            </select>
            <button type="submit">Create Staff Account</button>
          </form>
        )}

        {activeTab !== 'feedbacks' && <>
          <section className="admin-stats">
            <div className="stat-users"><span>Total Users</span><strong>{users.length}</strong></div>
            <div className="stat-approved"><span>Approved Documents</span><strong>{requests.filter((item) => completeStatuses.includes(item.status)).length}</strong></div>
            <div className="stat-pending"><span>Pending New IDs</span><strong>{pendingNew}</strong></div>
            <div className="stat-vital"><span>Pending Vital Events</span><strong>{pendingVital}</strong></div>
          </section>
          <section className="admin-queue admin-delivery-queue">
            <div className="queue-heading"><div><h2>Document Delivery</h2><p>Release finance-approved documents for printing and collection.</p></div><span>{requests.filter((item) => item.status === 'APPROVED_BY_FINANCE').length} ready</span></div>
            <div className="admin-table"><table><thead><tr><th>Application ID</th><th>Applicant</th><th>Service</th><th>Status</th><th>Action</th></tr></thead><tbody>{requests.filter((item) => ['APPROVED_BY_FINANCE', 'COMPLETED'].includes(item.status)).map((request) => <tr key={request._id}><td>{request.applicationId}</td><td>{request.fullName || request.husbandName || request.wifeName || 'Applicant'}</td><td>{request.serviceType}</td><td><span className={`admin-status ${request.status === 'COMPLETED' ? 'active' : ''}`}>{request.status}</span></td><td>{request.status === 'APPROVED_BY_FINANCE' ? <button type="button" className="user-review-button" onClick={() => completeApplication(request)}>Mark Completed</button> : 'Ready for collection'}</td></tr>)}{!requests.some((item) => ['APPROVED_BY_FINANCE', 'COMPLETED'].includes(item.status)) && <tr><td colSpan="5" className="admin-empty">No finance-approved documents ready.</td></tr>}</tbody></table></div>
          </section>
          <section className="admin-queue">
            <div className="queue-heading"><h2>User and Staff Accounts</h2><span>{users.length} total</span></div>
            <div className="admin-table"><table><thead><tr><th>#</th><th>Full Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{users.length ? users.map((user, index) => <tr key={user._id}><td>#{index + 1}</td><td><strong>{user.fullName || user.name}</strong></td><td>{user.email}</td><td>{user.phone || 'Not provided'}</td><td><span className="admin-status">{user.role}</span></td><td><span className={`admin-status ${user.isBlocked ? 'blocked' : 'active'}`}>{user.isBlocked ? 'Blocked' : 'Active'}</span></td><td className="admin-actions"><button type="button" className="user-review-button" onClick={() => handleReviewUser(user)}>Review</button><button type="button" className={`user-block-button ${user.isBlocked ? 'unblock' : 'block'}`} onClick={() => handleToggleBlock(user)}>{user.isBlocked ? 'Unblock' : 'Block'}</button><button type="button" className="user-delete-button" onClick={() => handleDeleteUser(user)}>Delete</button></td></tr>) : <tr><td colSpan="7" className="admin-empty">No users available.</td></tr>}</tbody></table></div>
          </section>
        </>}

        {activeTab === 'feedbacks' && <section className="admin-queue">
          <div className="queue-heading"><div><h2>User Feedbacks & Messages / የተጠቃሚዎች አስተያየት</h2><button type="button" className="back-dashboard-button" onClick={() => setActiveTab('users')}>← Back to Dashboard / ወደ ዳሽቦርድ ተመለስ</button></div><span>{feedbacks.length} total</span></div>
          <div className="admin-table"><table><thead><tr><th>#</th><th>Full Name</th><th>Email</th><th>Subject</th><th>Message / Feedback</th><th>Date</th></tr></thead><tbody>{feedbacks.length ? feedbacks.map((item, index) => <tr key={item._id || index}><td>#{index + 1}</td><td><strong>{item.name}</strong></td><td>{item.email || item.contact || 'Not provided'}</td><td>{item.subject || 'No subject'}</td><td>{item.message}</td><td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Not provided'}</td></tr>) : <tr><td colSpan="6" className="admin-empty">No user feedbacks available.</td></tr>}</tbody></table></div>
        </section>}

        {selectedUser && <div className="admin-review-backdrop" role="presentation" onClick={() => setSelectedUser(null)}>
          <section className="admin-review-modal" role="dialog" aria-modal="true" aria-labelledby="account-review-title" onClick={(event) => event.stopPropagation()}>
            <div className="admin-review-heading"><h2 id="account-review-title">Account Review Details</h2><button type="button" onClick={() => setSelectedUser(null)} aria-label="Close review">X</button></div>
            <dl className="admin-review-details">
              <div><dt>Account ID</dt><dd>{selectedUser._id}</dd></div>
              <div><dt>Full Name</dt><dd>{selectedUser.fullName || selectedUser.name || 'Not provided'}</dd></div>
              <div><dt>Email</dt><dd>{selectedUser.email || 'Not provided'}</dd></div>
              <div><dt>Phone</dt><dd>{selectedUser.phone || 'Not provided'}</dd></div>
              <div><dt>Role</dt><dd>{selectedUser.role || 'user'}</dd></div>
              <div><dt>Status</dt><dd>{selectedUser.isBlocked ? 'Blocked' : 'Active'}</dd></div>
              <div><dt>Created</dt><dd>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'Not provided'}</dd></div>
            </dl>
            <button type="button" className="admin-review-close" onClick={() => setSelectedUser(null)}>Close</button>
          </section>
        </div>}
      </main>
    </div>
  );
}
