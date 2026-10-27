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
    } catch (requestError) {
      const serverMessage = requestError.response?.data?.message;
      setStatusMsg({ type: 'error', text: serverMessage || text.error });
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
    <div className="min-h-screen bg-slate-50 px-4 py-10 font-sans text-gray-800">
      <main className="mx-auto max-w-6xl space-y-8">
        <header className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-black text-slate-800 md:text-4xl">{text.contactTitle}</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">{text.contactSubtitle}</p>
        </header>

        <section className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {infoCards.map(([icon, heading, content]) => (
              <article key={heading} className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <div className="mb-3 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-2xl" aria-hidden="true">{icon}</div>
                <div className="min-w-0">
                  <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-800">{heading}</h2>
                  <p className="whitespace-pre-line text-xs leading-relaxed text-slate-600">{content}</p>
                </div>
              </article>
            ))}
          </div>

          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <h2 className="mb-6 flex items-center gap-2 border-b border-slate-100 pb-4 text-xl font-bold text-slate-800">💬 {text.sendMessageTitle}</h2>
            {statusMsg.text && <div className={`mb-6 rounded-xl p-3 text-center text-sm font-bold ${statusMsg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{statusMsg.text}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">{text.fullNameLabel} <span className="text-rose-500">*</span></span>
                  <input className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20" type="text" name="name" required value={formData.name} onChange={handleChange} placeholder={text.fullNameLabel} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700">{text.emailLabel} <span className="text-rose-500">*</span></span>
                  <input className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20" type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="example@gmail.com" />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">{text.subjectLabel} <span className="text-rose-500">*</span></span>
                <input className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20" type="text" name="subject" required value={formData.subject} onChange={handleChange} placeholder={text.subjectLabel} />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700">{text.messageLabel} <span className="text-rose-500">*</span></span>
                <textarea className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20" name="message" rows="5" required value={formData.message} onChange={handleChange} placeholder={text.messageLabel} />
              </label>

              <div className="pt-2 text-right">
                <button type="submit" disabled={loading} className="rounded-xl bg-blue-700 px-7 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {loading ? text.btnSending : text.btnSend}
                </button>
              </div>
            </form>
          </section>
        </section>
      </main>
    </div>
  );
};

export default Contact;
