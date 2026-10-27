import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './SiteFooter.css';

export default function SiteFooter() {
  const { lang } = useLanguage();
  const isAmharic = lang === 'am';

  return (
    <footer className="site-footer">
      <div className="site-footer-content">
        <section className="site-footer-brand" aria-label={isAmharic ? 'ስለ ፖርታሉ' : 'About the portal'}>
          <Link to="/" className="site-footer-title">E-Kebele Portal</Link>
          <p>{isAmharic
            ? 'የቀበሌ አገልግሎቶችን በቀላሉ በዲጂታል መንገድ ያግኙ።'
            : 'Access Kebele services simply through one digital portal.'}</p>
        </section>

        <nav className="site-footer-links" aria-label={isAmharic ? 'የግርጌ አገናኞች' : 'Footer navigation'}>
          <Link to="/about">{isAmharic ? 'ስለ እኛ' : 'About us'}</Link>
          <Link to="/contact">{isAmharic ? 'ያግኙን' : 'Contact & support'}</Link>
          <Link to="/track">{isAmharic ? 'ማመልከቻ ይከታተሉ' : 'Track application'}</Link>
        </nav>
      </div>
      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} E-Kebele Portal</span>
        <span>{isAmharic ? 'የቀበሌ ዲጂታል አገልግሎት' : 'Kebele Digital Services'}</span>
      </div>
    </footer>
  );
}
