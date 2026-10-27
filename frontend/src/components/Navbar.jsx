import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import './Navbar.css';

const getStoredProfile = () => {
  try {
    const profile = JSON.parse(localStorage.getItem('userInfo') || localStorage.getItem('user') || '{}');
    return profile && typeof profile === 'object' ? profile : {};
  } catch {
    return {};
  }
};

const Navbar = ({ darkMode, toggleDarkMode }) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const languageMenuRef = useRef(null);
  const languageButtonRef = useRef(null);
  const navigate = useNavigate();
  const isAuthenticated = Boolean(sessionStorage.getItem('token') || localStorage.getItem('token'));
  const profile = getStoredProfile();
  const fullName = String(profile.fullName || profile.name || profile.email || '').trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const profileLabel = nameParts.length > 1 ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.` : fullName;
  const navLinks = location.pathname === '/signup'
    ? [{ name: lang === 'am' ? '← ወደ መነሻ ገጽ' : '← Back to Home', path: '/' }]
    : location.pathname === '/forgot-password'
      ? []
    : [
        { name: t.navHome, path: '/' },
        { name: t.applyId, path: '/apply-id' },
        { name: t.renewId, path: '/renew-id' },
        { name: t.vitalEvents, path: '/vital-events' },
        { name: t.navTrack, path: '/track' },
        { name: t.navAbout, path: '/about' },
        { name: t.navContact, path: '/contact' },
      ];

  useEffect(() => {
    if (!languageMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!languageMenuRef.current?.contains(event.target)) {
        setLanguageMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setLanguageMenuOpen(false);
        languageButtonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [languageMenuOpen]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchTerm.trim()) navigate(`/track?query=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('role');
    delete axios.defaults.headers.common.Authorization;
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0b4d9c] text-white shadow-lg">
      <div className="navbar-content mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="navbar-row flex flex-wrap items-center gap-3 py-2">
          <Link
            to="/home"
            className="flex shrink-0 items-center gap-2"
            aria-label={lang === 'am' ? 'ኢ-ቀበሌ' : 'E-Kebele'}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-lg font-bold">
              ኢ
            </div>
            <span className="portal-brand-title">
              {lang === 'am' ? 'ኢ-ቀበሌ' : 'E-Kebele'}
            </span>
          </Link>

          {navLinks.length > 0 && (
            <nav aria-label={lang === 'am' ? 'Үндсэн цэс' : 'Main navigation'} className="navbar-primary-nav">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path
                  || (link.path === '/' && location.pathname === '/home');

                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`navbar-primary-link${isActive ? ' is-active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="navbar-actions">
            <div className="relative hidden xl:block">
              <input
                type="text"
                placeholder={lang === 'am' ? 'ፈልግ...' : 'Find out...'}
                className="w-28 rounded-full border border-blue-700/50 bg-blue-950/70 py-1.5 pl-3 pr-8 text-xs text-white placeholder-blue-300/60 transition-all focus:w-36 focus:outline-none"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <button type="submit" className="absolute right-2.5 top-1.5 text-xs text-blue-300" onClick={handleSearch}>🔍</button>
            </div>

            <div className="navbar-language" ref={languageMenuRef}>
              <button
                ref={languageButtonRef}
                type="button"
                onClick={() => setLanguageMenuOpen((open) => !open)}
                className="navbar-language-button"
                aria-haspopup="menu"
                aria-expanded={languageMenuOpen}
              >
                <span aria-hidden="true">🌐</span>
                <span>{lang === 'am' ? 'ቋንቋ' : 'Language'}</span>
                <span className="navbar-language-chevron" aria-hidden="true">{languageMenuOpen ? '▲' : '▼'}</span>
              </button>
              {languageMenuOpen && (
                <div className="navbar-language-menu" role="menu" aria-label={lang === 'am' ? 'ቋንቋ ይምረጡ' : 'Choose language'}>
                  <button
                    type="button"
                    role="menuitem"
                    className="navbar-language-option"
                    onClick={() => {
                      toggleLanguage('am');
                      setLanguageMenuOpen(false);
                    }}
                    aria-current={lang === 'am' ? 'true' : undefined}
                  >
                    አማርኛ{lang === 'am' && <span aria-hidden="true">✓</span>}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="navbar-language-option"
                    onClick={() => {
                      toggleLanguage('en');
                      setLanguageMenuOpen(false);
                    }}
                    aria-current={lang === 'en' ? 'true' : undefined}
                  >
                    English{lang === 'en' && <span aria-hidden="true">✓</span>}
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated && (
              <div className="portal-profile" title={fullName}>
                <span className="portal-profile-avatar" aria-hidden="true">{fullName.charAt(0).toUpperCase() || 'U'}</span>
                <span className="portal-profile-name">{profileLabel || (lang === 'am' ? 'ተጠቃሚ' : 'User')}</span>
              </div>
            )}

            {isAuthenticated ? (
              <button type="button" onClick={handleLogout} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500">
                {t.logout}
              </button>
            ) : (
              <Link to="/login" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500">
                {lang === 'am' ? 'ግባ' : t.login}
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
