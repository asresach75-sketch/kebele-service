import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';

const Home = () => {
  const { lang, t } = useLanguage();
  const isAmharic = lang === 'am';

  const serviceCards = [
    { name: t.newId, path: '/apply-id', icon: '🆔' },
    { name: t.idRenewal, path: '/renew-id', icon: '🔄' },
    { name: t.birth, path: '/birth-registration', icon: '👶' },
    { name: t.marriage, path: '/marriage-registration', icon: '💍' },
    { name: t.divorce, path: '/divorce-registration', icon: '⚖️' },
    { name: t.death, path: '/death-registration', icon: '📄' }
  ];

  const heroCopy = isAmharic
    ? {
        pill: 'ዲጂታል ኢትዮጵያ',
        title: 'ኢ-ቀበሌ አገልግሎቶች',
        subtitle: 'የኢትዮጵያ ቀበሌ አገልግሎቶችን በኢንተርኔት ሆነው በቀላሉ ያግኙ።',
        ctaPrimary: 'አስተያየት ያስገቡ',
        ctaSecondary: 'ማስመልከት ይከታተሉ',
        nav: ['አስፈላጊ', 'አገልግሎቶች', 'ተከታታይ', 'አስተዳደር']
      }
    : {
        pill: 'DIGITAL ETHIOPIA',
        title: 'E-Kebele Services',
        subtitle: 'Access Ethiopian Kebele services online quickly, securely, and without long queues.',
        ctaPrimary: 'Apply Now',
        ctaSecondary: 'Track Status',
        nav: ['Home', 'Services', 'Track', 'Support']
      };

  return (
    <div className="min-h-screen bg-[#edf1f6] text-slate-800">
      <div className="bg-[#0d2d8d] text-white shadow-[0_10px_25px_rgba(13,45,141,0.25)]">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-lg font-bold shadow-inner ring-1 ring-white/10">
                E
              </div>
              <div>
                <p className="text-lg font-black tracking-tight">{isAmharic ? 'ኢ-ቀበሌ' : 'E-Kebele'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 ring-1 ring-white/15 backdrop-blur-sm">
                {isAmharic ? 'AM' : 'EN'}
              </button>
              <button className="rounded-lg bg-[#ff5a3d] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-[#ff714d]">
                {isAmharic ? 'ግባ' : 'Login'}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#0a256f]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-5 px-4 py-3 text-sm font-medium text-white/90 md:justify-between">
            {heroCopy.nav.map((item) => (
              <span key={item} className="opacity-90 transition hover:opacity-100">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900 sm:text-sm">
        {t.maintenanceNotice}
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[30px] bg-gradient-to-r from-[#0d2d8d] via-[#1d2e86] to-[#120f49] p-3 shadow-[0_30px_80px_rgba(17,24,39,0.25)]">
          <div className="grid items-center gap-6 rounded-[28px] bg-gradient-to-r from-[#243ca7]/90 via-[#1b2b8b]/90 to-[#171d5a]/90 px-6 py-8 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:px-10 lg:py-10">
            <div className="space-y-5 text-white">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100 backdrop-blur-sm">
                {heroCopy.pill}
              </span>

              <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight text-white md:text-5xl lg:text-[4rem]">
                {heroCopy.title}
              </h1>

              <p className="max-w-lg text-base leading-relaxed text-slate-200 md:text-lg">
                {heroCopy.subtitle}
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  to="/apply-id"
                  className="rounded-xl bg-[#ff6a3d] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:scale-[1.02] hover:bg-[#ff7a4c]"
                >
                  {heroCopy.ctaPrimary}
                </Link>
                <Link
                  to="/track"
                  className="rounded-xl border border-white/30 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/15"
                >
                  {heroCopy.ctaSecondary}
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-[26px] border border-white/15 bg-white/5 shadow-[0_24px_60px_rgba(15,23,42,0.35)]">
              <img
                src="/images/officer_dashboard_banner.jpg"
                alt={isAmharic ? 'የኢትዮጵያ ቀበሌ አገልግሎት ቢሮ' : 'Ethiopian Kebele service office'}
                className="h-[320px] w-full object-cover object-center md:h-[400px] lg:h-[460px]"
              />
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {serviceCards.map((service, index) => (
            <Link
              key={service.path}
              to={service.path}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-700 shadow-inner ring-1 ring-blue-100">
                {service.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{service.name}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {isAmharic ? 'የኢ-ቀበሌ አገልግሎት' : 'Digital public service'}
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-700">
                {isAmharic ? 'ይጀምሩ' : 'Get started'}
                <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Home;
