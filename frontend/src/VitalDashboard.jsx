import React, { useEffect, useState } from 'react';

const VitalDashboard = () => {
  const [vitalRequests, setVitalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVitalApplications();
  }, []);

  const fetchVitalApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/services/all', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load applications');
      const data = await res.json();

      // Filter only vital event types
      const filtered = (Array.isArray(data) ? data : data || []).filter(app =>
        ['BIRTH_REGISTRATION', 'MARRIAGE_REGISTRATION', 'DIVORCE_REGISTRATION', 'DEATH_REGISTRATION'].includes(app.serviceType)
      );
      setVitalRequests(filtered);
    } catch (err) {
      console.error('Error fetching vital records:', err);
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/services/update-status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Update failed');
      }
      alert(`መዝገቡ በትክክል ${newStatus} ሆኗል!`);
      fetchVitalApplications();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('ስህተት ተፈጥሯል');
    }
  };

  if (loading) return <div>በመጫን ላይ...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>የ Vital (የህይወት ክስተቶች) ዳሽቦርድ</h2>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Application ID</th>
            <th>አገልግሎት ዓይነት</th>
            <th>ስም / ዝርዝር</th>
            <th>ስልክ ቁጥር</th>
            <th>ስቴተስ</th>
            <th>እርምጃ</th>
          </tr>
        </thead>
        <tbody>
          {vitalRequests.map(app => (
            <tr key={app._id}>
              <td>{app.applicationId}</td>
              <td>{app.serviceType}</td>
              <td>{app.fullName || app.husbandName || app.wifeName || 'N/A'}</td>
              <td>{app.phoneNumber || '—'}</td>
              <td><b>{app.status || 'Pending'}</b></td>
              <td>
                <button onClick={() => handleStatusChange(app._id, 'Approved')} style={{ background: 'green', color: 'white', marginRight: '5px' }}>
                  Approve
                </button>
                <button onClick={() => handleStatusChange(app._id, 'Rejected')} style={{ background: 'red', color: 'white' }}>
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VitalDashboard;
