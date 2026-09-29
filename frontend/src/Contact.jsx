import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from './context/LanguageContext';

const emptyForm = { name: '', email: '', subject: '', message: '' };

const Contact = () => {
  const { t } = useLanguage();
  const text = t;
  const [formData, setFormData] = useState(emptyForm);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const response = await axios.post('/api/services/feedbacks', formData);
      if (response.data.success) {
        setStatusMsg({ type: 'success', text: text.success });
        setFormData(emptyForm);
      }
    } catch (error) {
      setStatusMsg({ type: 'error', text: text.error });
    } finally {
      setLoading(false);
    }
  };

  const infoCards = [
    ['📍', text.officeAddressTitle, text.officeAddressText],
    ['📞', text.phoneTitle, `${text.phoneSupport}\n${text.phoneHotline}`],
    ['✉️', text.emailTitle, `${text.emailSupport}\n${text.emailOffice}`],
    ['🕒', text.hoursTitle, `${text.hoursWeekday}\n${text.hoursSaturday}\n${text.hoursSunday}`]
  ];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 font-sans text-gray-800">
      <main className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-2xl bg-blue-900 px-6 py-10 text-center text-white shadow-lg sm:px-10">
          <h1 className="text-3xl font-extrabold">{text.contactTitle}</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-blue-100">{text.contactSubtitle}</p>
        </section>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {infoCards.map(([icon, heading, content]) => (
            <article key={heading} className="min-h-48 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-3 text-3xl" aria-hidden="true">{icon}</div>
              <h2 className="mb-3 font-bold text-blue-700">{heading}</h2>
              <p className="whitespace-pre-line text-xs leading-relaxed text-gray-600">{content}</p>
            </article>
          ))}
        </section>

        <section className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-md sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-gray-900">💬 {text.sendMessageTitle}</h2>
          {statusMsg.text && <div className={`mb-6 rounded-lg p-3 text-center text-sm font-bold ${statusMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{statusMsg.text}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <label><span className="mb-1 block text-xs font-bold text-gray-700">{text.fullNameLabel}</span><input className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" type="text" name="name" required value={formData.name} onChange={handleChange} /></label>
              <label><span className="mb-1 block text-xs font-bold text-gray-700">{text.emailLabel} *</span><input className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" type="email" name="email" required value={formData.email} onChange={handleChange} /></label>
            </div>
            <label className="block"><span className="mb-1 block text-xs font-bold text-gray-700">{text.subjectLabel}</span><input className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" type="text" name="subject" required value={formData.subject} onChange={handleChange} /></label>
            <label className="block"><span className="mb-1 block text-xs font-bold text-gray-700">{text.messageLabel}</span><textarea className="w-full rounded-lg border border-gray-300 p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500" name="message" rows="5" required value={formData.message} onChange={handleChange} /></label>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-900 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-800 disabled:opacity-60">{loading ? text.btnSending : text.btnSend}</button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default Contact;
