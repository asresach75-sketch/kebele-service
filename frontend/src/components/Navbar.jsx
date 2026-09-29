import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const Navbar = ({ darkMode, toggleDarkMode }) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const isAuthenticated = Boolean(localStorage.getItem('token'));

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchTerm.trim()) navigate(`/track?query=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    delete axios.defaults.headers.common.Authorization;
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0b4d9c] text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 py-3">
          <Link to="/home" className="flex shrink-0 items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold">
              ኢ
            </div>
            <span className="whitespace-nowrap text-base font-bold tracking-wide md:text-xl">
              {lang === 'am' ? 'የኢ-ቀበሌ አገልግሎት ፖርታል' : 'E-Kebele Service Portal'}
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-3">
            <div className="relative hidden lg:block">
              <input
                type="text"
                placeholder={lang === 'am' ? 'ፈልግ...' : 'Find out...'}
                className="w-32 rounded-full border border-blue-700/50 bg-blue-950/70 py-2 pl-3 pr-8 text-xs text-white placeholder-blue-300/60 transition-all focus:w-40 focus:outline-none"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <button type="submit" className="absolute right-2.5 top-2 text-xs text-blue-300" onClick={handleSearch}>🔍</button>
            </div>

            <div className="flex items-center rounded-lg border border-blue-700/50 bg-blue-950 p-1 text-xs font-semibold">
              <button type="button" onClick={() => toggleLanguage('am')} className={`rounded px-2 py-0.5 ${lang === 'am' ? 'bg-blue-600 text-white' : 'text-blue-300'}`}>
                አማርኛ
              </button>
              <span className="mx-1 text-blue-600">|</span>
              <button type="button" onClick={() => toggleLanguage('en')} className={`rounded px-2 py-0.5 ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-blue-300'}`}>
                English
              </button>
            </div>

            {isAuthenticated ? (
              <button type="button" onClick={handleLogout} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-500">
                {t.logout}
              </button>
            ) : (
              <Link to="/login" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-500">
                {lang === 'am' ? 'ግባ' : t.login}
              </Link>
            )}
          </div>

          <nav aria-label="Main navigation" className="order-3 flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-blue-400/30 pt-3 text-sm font-medium">
            <Link to="/home" className="whitespace-nowrap transition hover:text-blue-300">{t.navHome}</Link>
            <Link to="/apply-id" className="whitespace-nowrap transition hover:text-blue-300">{t.applyId}</Link>
            <Link to="/renew-id" className="whitespace-nowrap transition hover:text-blue-300">{t.renewId}</Link>
            <Link to="/vital-events" className="whitespace-nowrap transition hover:text-blue-300">{t.vitalEvents}</Link>
            <Link to="/track" className="whitespace-nowrap transition hover:text-blue-300">{t.navTrack}</Link>
            <Link to="/about" className="whitespace-nowrap transition hover:text-blue-300">{t.navAbout}</Link>
            <Link to="/contact" className="whitespace-nowrap transition hover:text-blue-300">{t.navContact}</Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
