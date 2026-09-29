import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function SupportDashboard() {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/services/feedbacks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(res.data.feedbacks || []);
    } catch (err) {
      console.error('Error fetching feedbacks', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      
      {/* Top Header / Navigation */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center font-bold text-slate-900 shadow">💬</div>
            <div>
              <h1 className="text-lg font-extrabold tracking-wide block leading-tight">
                E-Kebele | Support Module
              </h1>
              <span className="text-xs text-blue-200 font-medium">Support & Feedback Panel</span>
            </div>
          </div>
          <Link to="/logout" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow">
            Logout
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        
        {/* Title & Description Banner */}
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
          <h2 className="text-lg font-bold text-blue-900 mb-1">Support Dashboard</h2>
          <p className="text-slate-600 text-sm">Review user feedbacks, messages, and inquiries submitted through the portal.</p>
        </div>

        {/* Feedback Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
            User Feedbacks & Messages
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <th className="pb-3 px-4">User Name</th>
                    <th className="pb-3 px-4">Email / Phone</th>
                    <th className="pb-3 px-4">Message / Feedback</th>
                    <th className="pb-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {feedbacks.length > 0 ? (
                    feedbacks.map((fb) => (
                      <tr key={fb._id} className="hover:bg-slate-50 transition">
                        <td className="py-4 px-4 font-semibold text-slate-900">{fb.name}</td>
                        <td className="py-4 px-4 text-slate-600">{fb.contact || fb.email || fb.phoneNumber}</td>
                        <td className="py-4 px-4 text-slate-700">{fb.message}</td>
                        <td className="py-4 px-4 text-slate-500 text-xs">{new Date(fb.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500 text-sm">
                        No feedback or messages found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}