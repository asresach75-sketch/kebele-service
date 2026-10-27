import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import './HomeHero.css';

const heroImages = [
  {
    src: '/images/ethiopian-kebele-office-hero.png',
    altEn: 'People receiving digital services inside an Ethiopian Kebele office',
    altAm: 'በኢትዮጵያ ቀበሌ ቢሮ ውስጥ ዲጂታል አገልግሎት የሚያገኙ ዜጎች',
  },
  {
    src: '/images/hero_ethiopian_digital.jpg',
    altEn: 'Ethiopian public-service staff and citizens using computers in an office',
    altAm: 'በቢሮ ውስጥ ኮምፒውተር የሚጠቀሙ የኢትዮጵያ የሕዝብ አገልግሎት ሰራተኞችና ዜጎች',
  },
  {
    src: '/images/ethiopian-office-worker.jpg',
    altEn: 'An Ethiopian office worker at a desktop computer',
    altAm: 'በኮምፒውተር ላይ የሚሰሩ የኢትዮጵያ ቢሮ ሰራተኛ',
  },
  {
    src: '/images/ethiopian-digital-operations.png',
    altEn: 'Ethiopian digital operations staff working at computer screens',
    altAm: 'በኮምፒውተር ስክሪኖች ላይ የሚሰሩ የኢትዮጵያ ዲጂታል ኦፕሬሽን ሰራተኞች',
  },
];

const Home = () => {
  const { lang, t } = useLanguage();
  const isAmharic = lang === 'am';
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [showMaintenanceNotice, setShowMaintenanceNotice] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const timer = window.setInterval(() => {
      setCurrentHeroImage((current) => (current + 1) % heroImages.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  const serviceCards = [
    { name: t.newId, path: '/apply-id', icon: '🆔' },
    { name: t.idRenewal, path: '/renew-id', icon: '🔄' },
    { name: t.birth, path: '/birth-registration', icon: '👶' },
    { name: t.marriage, path: '/marriage-registration', icon: '💍' },
    { name: t.divorce, path: '/divorce-registration', icon: '⚖️' },
    { name: t.death, path: '/death-registration', icon: '📄' }
  ];

  const homeCopy = isAmharic
    ? {
        serviceDescription: 'የቀበሌ ዲጂታል አገልግሎት',
        getStarted: 'ይጀምሩ',
        closeNotice: 'የማሳወቂያ ሳጥኑን ዝጋ',
        photoCredits: 'የፎቶ ምንጮች',
      }
    : {
        serviceDescription: 'Digital public service',
        getStarted: 'Get started',
        closeNotice: 'Dismiss maintenance notice',
        photoCredits: 'Photo credits',
      };

  const faqs = isAmharic
    ? [
        ['ማመልከቻ ለማስገባት ምን ሰነዶች ያስፈልጋሉ?', 'ሰነዶቹ እንደ አገልግሎቱ ይለያያሉ። ማመልከቻውን ሲሞሉ በቅጹ ላይ የቀረበውን የሰነድ ዝርዝር ይከተሉ።'],
        ['የማመልከቻዬን ሁኔታ እንዴት እከታተላለሁ?', 'ወደ መከታተያ ገጽ በመግባት የማመልከቻ ቁጥርዎን ይጠቀሙ።'],
        ['ክፍያ እንዴት እፈጽማለሁ?', 'ክፍያ ሲጠየቅ በክፍያ ገጹ ላይ ከቀረቡት አማራጮች ይምረጡ።']
      ]
    : [
        ['Which documents do I need to apply?', 'Requirements vary by service. Follow the document checklist shown in the application form.'],
        ['How can I track my application?', 'Open the Tracker page and enter your application number.'],
        ['How do I make a payment?', 'If a payment is required, choose from the options displayed on the payment page.']
      ];

  return (
    <div className="min-h-screen bg-[#edf1f6] text-slate-800">
      {showMaintenanceNotice && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-amber-900">
          <div className="mx-auto flex max-w-7xl items-start gap-3 text-xs sm:items-center sm:text-sm">
            <span aria-hidden="true" className="mt-0.5 text-amber-700 sm:mt-0">!</span>
            <p role="status" className="flex-1 leading-relaxed">{t.maintenanceNotice}</p>
            <button
              type="button"
              onClick={() => setShowMaintenanceNotice(false)}
              className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md text-amber-800 transition hover:bg-amber-100 hover:text-amber-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-700"
              aria-label={homeCopy.closeNotice}
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section
          className="relative mb-8 flex h-[380px] items-center justify-center overflow-hidden rounded-2xl shadow-2xl"
          aria-roledescription="carousel"
          aria-label={isAmharic ? 'የቀበሌ አገልግሎት ፎቶዎች' : 'Kebele service photo slideshow'}
        >
          <div
            className="home-hero-slides"
            style={{ transform: `translateX(-${currentHeroImage * 100}%)` }}
          >
            {heroImages.map((image, index) => (
              <div className="home-hero-slide" key={image.src}>
                <img
                  src={image.src}
                  alt={isAmharic ? image.altAm : image.altEn}
                  className="h-full w-full object-cover object-center"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-slate-950/50 via-transparent to-slate-950/20 p-4">
            <div className="home-hero-welcome">
              WELCOME TO KEBELE SERVICE PORTAL
            </div>
          </div>
        </section>
        <details className="home-hero-attribution">
          <summary>{homeCopy.photoCredits}</summary>
          <p>
            <a href="https://commons.wikimedia.org/wiki/File:Ethio_11.jpg" target="_blank" rel="noreferrer">
              Genet Girma (resized), CC BY-SA 4.0
            </a>
            {' · '}
            <a href="https://commons.wikimedia.org/wiki/File:Information_Network_Security_Agency_Workers.png" target="_blank" rel="noreferrer">
              INSA, Public Domain
            </a>
          </p>
        </details>

        <section className="mt-10 grid auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {serviceCards.map((service) => (
            <Link
              key={service.path}
              to={service.path}
              className="group flex min-h-[230px] flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-700 shadow-inner ring-1 ring-blue-100">
                {service.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{service.name}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {homeCopy.serviceDescription}
              </p>
              <div className="mt-auto flex items-center gap-2 pt-5 text-sm font-semibold text-blue-700">
                {homeCopy.getStarted}
                <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </section>

        <section aria-labelledby="home-faq-title" className="mx-auto mt-16 w-full max-w-4xl space-y-6">
          <h2 id="home-faq-title" className="text-center text-2xl font-bold text-slate-900">
            {isAmharic ? 'ብዙ ጊዜ የሚጠየቁ ጥያቄዎች' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-3">
            {faqs.map(([question, answer], index) => (
              <div key={question} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  id={`home-faq-question-${index}`}
                  aria-expanded={openFaq === index}
                  aria-controls={`home-faq-answer-${index}`}
                  onClick={() => setOpenFaq((current) => current === index ? null : index)}
                  className="flex min-h-14 w-full items-center justify-between gap-4 bg-slate-50 px-5 py-4 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                >
                  <span>{question}</span>
                  <span aria-hidden="true" className="flex-shrink-0 text-lg text-blue-700">{openFaq === index ? '−' : '+'}</span>
                </button>
                {openFaq === index && (
                  <p id={`home-faq-answer-${index}`} aria-labelledby={`home-faq-question-${index}`} className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
                    {answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
