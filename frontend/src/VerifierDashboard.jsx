import React, { useEffect, useState } from 'react';

function VerifierDashboard() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/services/all', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load requests');
      setRequests(data);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/services/update-status/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (response.ok) loadRequests();
  };

  return <main className="container" style={{ padding: 24 }}><h2>Verifier Dashboard</h2>{error && <p>{error}</p>}<table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th>Application ID</th><th>Full Name</th><th>Service Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>{requests.map((request) => <tr key={request._id}><td>{request.applicationId}</td><td>{request.fullName || request.childFullName || request.childName || request.husbandName || request.wifeName || request.deceasedName || request.applicantName || 'Unknown applicant'}</td><td>{request.serviceType}</td><td>{request.status || 'Pending'}</td><td><button onClick={() => updateStatus(request._id, 'Approved')}>Approve</button>{request.status !== 'Approved' && <button onClick={() => updateStatus(request._id, 'Rejected')}>Reject</button>}</td></tr>)}</tbody></table></main>;
}

export default VerifierDashboard;
