import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserFeedbacks = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/services/feedbacks', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then((response) => setFeedbacks(response.data.feedbacks || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load user feedbacks.'));
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-6 sm:p-10">
      <section className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-md sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-4 border-b pb-4">
          <h1 className="text-xl font-bold text-gray-800">User Feedbacks / የተጠቃሚዎች አስተያየት</h1>
          <button type="button" onClick={() => navigate('/admin-dashboard')} className="rounded-lg bg-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
            ← Back to Dashboard
          </button>
        </div>
        {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-sm font-semibold text-red-700">{error}</p>}
        <div className="space-y-4">
          {feedbacks.length ? feedbacks.map((feedback) => (
            <article key={feedback._id} className="rounded-lg border bg-slate-50 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <strong>{feedback.name} <span className="font-normal">({feedback.email || feedback.contact || 'No contact'})</span></strong>
                <small className="text-gray-500">{feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : 'No date'}</small>
              </div>
              {feedback.subject && <p className="mt-2 font-semibold">{feedback.subject}</p>}
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{feedback.message}</p>
            </article>
          )) : !error && <p className="text-sm text-gray-600">No user feedbacks available.</p>}
        </div>
      </section>
    </main>
  );
};

export default UserFeedbacks;
