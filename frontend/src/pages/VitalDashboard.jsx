import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VitalDashboard = () => {
  const [vitalRequests, setVitalRequests] = useState([]);

  useEffect(() => {
    fetchVitalRequests();
  }, []);

  const fetchVitalRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/services/vital-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVitalRequests(res.data.requests || []);
    } catch (err) {
      console.error('Error fetching vital requests', err);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/services/vital-status/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchVitalRequests();
    } catch (err) {
      console.error('Error updating status', err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Vital Events Dashboard (Birth, Marriage, Death, etc.)</h1>
      <div className="bg-white shadow rounded-lg p-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-2">Name</th>
              <th className="p-2">Event Type</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vitalRequests.map((req) => (
              <tr key={req._id} className="border-b">
                <td className="p-2">{req.fullName || req.husbandName || req.wifeName || 'N/A'}</td>
                <td className="p-2">{req.serviceType}</td>
                <td className="p-2 font-semibold">{req.status || 'Pending'}</td>
                <td className="p-2 space-x-2">
                  <button
                    onClick={() => handleStatusUpdate(req._id, 'Approved')}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(req._id, 'Rejected')}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VitalDashboard;
