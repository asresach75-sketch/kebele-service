import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';

const ForgotPassword = () => {
  const { lang } = useLanguage();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitted(false);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError(lang === 'am' ? 'እባክዎ በመለያዎ የተመዘገበውን ኢሜይል ያስገቡ።' : 'Enter your registered email address.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/users/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(lang === 'am'
          ? 'የማደሻ ኢሜይሉን መላክ አልተቻለም። እባክዎ ቆይተው እንደገና ይሞክሩ።'
          : data.message || 'Could not send the email. Please try again later.');
      }
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message || (lang === 'am'
        ? 'ከሰርቨሩ ጋር መገናኘት አልተቻለም። እባክዎ ቆይተው እንደገና ይሞክሩ።'
        : 'Could not connect to the server. Please try again later.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            {lang === 'am' ? 'የይለፍ ቃል መመለሻ' : 'Reset your password'}
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            {lang === 'am'
              ? 'በመለያዎ የተመዘገበውን ኢሜይል ያስገቡ። የማደሻ ሊንክ በኢሜይል ይላካል።'
              : 'Enter the email registered to your account. We will email you a password reset link.'}
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
            {error}
          </div>
        )}

        {submitted && (
          <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-700">
            {lang === 'am'
              ? 'የይለፍ ቃል ማደስ ጥያቄዎ ተልኳል። ኢሜይሉ በመለያ ላይ ከተመዘገበ የማደሻ ሊንክ በኢሜይል ይላካል። ኢሜይልዎን እና የSpam አቃፊዎን ይመልከቱ። SMS አገልግሎት አሁን አይደገፍም።'
              : 'If an account exists for this email, a reset link has been sent. Check your inbox and spam folder. SMS recovery is not available yet.'}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="mb-1 block text-xs font-semibold text-slate-700">
              {lang === 'am' ? 'ኢሜይል አድራሻ' : 'Email address'}
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setSubmitted(false);
              }}
              placeholder="example@gmail.com"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting
              ? (lang === 'am' ? 'በመላክ ላይ...' : 'Sending...')
              : (lang === 'am' ? 'የማደሻ ሊንክ ይላኩ' : 'Send reset link')}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          <Link to="/login" className="font-semibold text-blue-600 hover:underline">
            {lang === 'am' ? '← ወደ መግቢያ ገጽ ተመለስ' : '← Back to login'}
          </Link>
        </div>
        <div className="mt-4 flex justify-start">
          <Link to="/" className="flex items-center space-x-1 text-sm font-medium text-blue-600 hover:underline">
            <span aria-hidden="true">←</span>
            <span>{lang === 'am' ? 'ወደ መነሻ ገጽ' : 'Back to Home'}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
