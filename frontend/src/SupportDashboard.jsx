import React, { useEffect, useState } from 'react';

const SupportDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      // Placeholder: replace with actual support tickets endpoint when available
      const res = await fetch('/api/support/tickets', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load tickets');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const replyToTicket = async (ticketId) => {
    const response = prompt('Type your reply message:');
    if (!response) return;
    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: response })
      });
      if (!res.ok) throw new Error('Reply failed');
      alert('Reply sent');
      fetchTickets();
    } catch (err) {
      alert(err.message || 'Could not send reply');
    }
  };

  if (loading) return <div>Loading support tickets...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Support Dashboard</h2>
      {tickets.length === 0 ? (
        <div>No tickets found.</div>
      ) : (
        <ul>
          {tickets.map(t => (
            <li key={t._id} style={{ marginBottom: 12 }}>
              <b>{t.subject}</b>
              <div>{t.message}</div>
              <div><small>From: {t.email || t.userEmail}</small></div>
              <button onClick={() => replyToTicket(t._id)} style={{ marginTop: 6 }}>Reply</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SupportDashboard;
