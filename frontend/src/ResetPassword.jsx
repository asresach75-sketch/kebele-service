import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import { isStrongPassword } from './utils/passwordValidation';

const ResetPassword = () => {
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError(lang === 'am' ? 'Сэргээх холбоос буруу байна. Шинэ холбоос хүснэ үү.' : 'This reset link is invalid. Request a new one.');
      return;
    }
    if (!isStrongPassword(password)) {
      setError(lang === 'am'
        ? 'Нууц үг дор хаяж 8 тэмдэгттэй, том/жижиг латин үсэг, тоо, тусгай тэмдэг (@ # $ % ! & *) агуулсан байх ёстой.'
        : 'Password must be at least 8 characters and include uppercase and lowercase letters, a number, and a special character (@ # $ % ! & *).');
      return;
    }
    if (password !== confirmPassword) {
      setError(lang === 'am' ? 'Нууц үгс таарахгүй байна.' : 'Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/users/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || (lang === 'am'
          ? 'Нууц үг шинэчилж чадсангүй. Шинэ холбоос хүснэ үү.'
          : 'Could not reset the password. Request a new link.'));
      }
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message || (lang === 'am'
        ? 'Сервертэй холбогдож чадсангүй. Дараа дахин оролдоно уу.'
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
            {lang === 'am' ? 'Шинэ нууц үг тохируулах' : 'Set a new password'}
          </h2>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
            {error}
          </div>
        )}

        {submitted ? (
          <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-700">
            <p>{lang === 'am' ? 'Нууц үг амжилттай шинэчлэгдлээ.' : 'Your password has been reset successfully.'}</p>
            <Link to="/login" className="mt-2 inline-block font-bold underline">
              {lang === 'am' ? 'Нэвтрэх' : 'Sign in'}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1 block text-xs font-semibold text-slate-700">
                {lang === 'am' ? 'Шинэ нууц үг' : 'New password'}
              </label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-xs font-semibold text-slate-700">
                {lang === 'am' ? 'Нууц үг давтах' : 'Confirm password'}
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <p className="text-xs text-slate-500">
              {lang === 'am'
                ? '8+ тэмдэгт, том/жижиг латин үсэг, тоо болон тусгай тэмдэг (@ # $ % ! & *) ашиглана уу.'
                : 'Use 8+ characters with uppercase and lowercase letters, a number, and a special character (@ # $ % ! & *).'}
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting
                ? (lang === 'am' ? 'Хадгалж байна...' : 'Saving...')
                : (lang === 'am' ? 'Нууц үг шинэчлэх' : 'Reset password')}
            </button>
          </form>
        )}

        <div className="mt-5 text-center text-xs text-slate-500">
          <Link to="/forgot-password" className="font-semibold text-blue-600 hover:underline">
            {lang === 'am' ? 'Шинэ сэргээх холбоос хүсэх' : 'Request a new reset link'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
