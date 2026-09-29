import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('requests');
  const navigate = useNavigate();

  // ሎጋውት ለማድረግ
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // የናሙና የሰርቪስ ጥያቄዎች (Requests) - ከባክኤንድ በሚመጣ ዳታ መቀየር ይቻላል
  const [requests, setRequests] = useState([
    { id: 1, fullName: 'asresach adugna', serviceType: 'Resident ID (Renewal/New)', phone: '0912345678', status: 'Pending' },
    { id: 2, fullName: 'Abebe Kebede', serviceType: 'Birth Certificate', phone: '0911223344', status: 'Pending' },
    { id: 3, fullName: 'Tigist Mamo', serviceType: 'Resident ID (Renewal/New)', phone: '0922334455', status: 'Approved' },
  ]);

  // ስተሰን (Status) ወደ Approved ወይም Rejected ለመቀየር
  const handleStatusChange = (id, newStatus) => {
    const updatedRequests = requests.map(req => {
      if (req.id === id) {
        return { ...req, status: newStatus };
      }
      return req;
    });
    setRequests(updatedRequests);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f6f9' }}>
      
      {/* ሳይድባር (Sidebar) */}
      <div style={{ width: '250px', backgroundColor: '#1e293b', color: 'white', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #334155', textAlign: 'center' }}>
          የአድሚን ገጽ (Admin)
        </div>
        <div style={{ padding: '20px', flex: 1 }}>
          <button 
            onClick={() => setActiveTab('requests')}
            style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: activeTab === 'requests' ? '#3b82f6' : 'transparent', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', textAlign: 'left' }}>
            የخدمት ጥያቄዎች (Requests)
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            style={{ width: '100%', padding: '10px', backgroundColor: activeTab === 'users' ? '#3b82f6' : 'transparent', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', textAlign: 'left' }}>
            ተጠቃሚዎች (Users)
          </button>
        </div>
        <div style={{ padding: '20px', borderTop: '1px solid #334155' }}>
          <button 
            onClick={handleLogout}
            style={{ width: '100%', padding: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            ውጣ (Logout)
          </button>
        </div>
      </div>

      {/* ዋናው የክፍል ይዘት (Main Content) */}
      <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>የአስተዳዳሪ ዳሽቦርድ (Admin Dashboard)</h2>
          <span style={{ backgroundColor: '#e2e8f0', padding: '8px 15px', borderRadius: '20px', fontSize: '14px' }}>አስተዳዳሪ (Administrator)</span>
        </div>

        {activeTab === 'requests' && (
          <div>
            <h3>የተጠቃሚዎች የخدمት ጥያቄዎች ማስተዳደሪያ</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px', backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <thead>
                <tr style={{ backgroundColor: '#3b82f6', color: 'white', textAlign: 'left' }}>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>ሙሉ ስም (Full Name)</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>የአገልግሎት ዓይነት (Service Type)</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>ስልክ (Phone)</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>ሁኔታ (Status)</th>
                  <th style={{ padding: '12px', border: '1px solid #ddd' }}>እርምጃ (Actions)</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{req.fullName}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{req.serviceType}</td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>{req.phone}</td>
                    <td style={{ 
                      padding: '12px', 
                      border: '1px solid #ddd', 
                      fontWeight: 'bold',
                      color: req.status === 'Approved' ? 'green' : req.status === 'Pending' ? 'orange' : 'red'
                    }}>
                      {req.status}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      <button 
                        onClick={() => handleStatusChange(req.id, 'Approved')}
                        style={{ backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '5px 10px', marginRight: '5px', borderRadius: '3px', cursor: 'pointer' }}>
                        ፈቅድ (Approve)
                      </button>
                      <button 
                        onClick={() => handleStatusChange(req.id, 'Rejected')}
                        style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>
                        ከልክል (Reject)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h3>የተመዝጋቢዎች ዝርዝር (Users List)</h3>
            <p style={{ marginTop: '10px', color: '#64748b' }}>እዚህ ጋር የተመዝጋቢዎች ዝርዝር ይታያል...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;