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

const galleryImages = [
  {
    src: '/images/ethiopian-kebele-office-hero.png',
    altEn: 'Citizens and staff at a digital Kebele service desk',
    altAm: 'ዜጎችና ሰራተኞች በዲጂታል ቀበሌ አገልግሎት ዴስክ ላይ',
    titleEn: 'Digital service desk',
    titleAm: 'ዲጂታል የአገልግሎት ዴስክ',
  },
  {
    src: '/images/home_hero.jpg',
    altEn: 'An office worker using a computer at her desk',
    altAm: 'የቢሮ ሰራተኛ በዴስክዋ ላይ ኮምፒውተር ስትጠቀም',
    titleEn: 'Computer-assisted service',
    titleAm: 'በኮምፒውተር የታገዘ አገልግሎት',
  },
  {
    src: '/images/hero_ethiopian_digital.jpg',
    altEn: 'A woman using a laptop outdoors',
    altAm: 'አንዲት ሴት ከቤት ውጭ ላፕቶፕ ስትጠቀም',
    titleEn: 'Access from anywhere',
    titleAm: 'ከየትኛውም ቦታ አገልግሎት ማግኘት',
  },
  {
    src: '/images/ethiopian-digital-operations.png',
    altEn: 'Digital operations staff monitoring computer screens',
    altAm: 'የዲጂታል ኦፕሬሽን ሰራተኞች የኮምፒውተር ስክሪኖችን ሲከታተሉ',
    titleEn: 'Digital operations',
    titleAm: 'ዲጂታል ኦፕሬሽን',
  },
  {
    src: '/images/ethiopian-government-meeting.webp',
    altEn: 'Ethiopian officials gathered for a government meeting',
    altAm: 'የኢትዮጵያ ባለስልጣናት በመንግስት ስብሰባ ላይ',
    titleEn: 'Public administration',
    titleAm: 'የህዝብ አስተዳደር',
  },
  {
    src: '/images/officer_dashboard_banner.jpg',
    altEn: 'Two colleagues reviewing information together at a laptop',
    altAm: 'ሁለት ባልደረቦች በላፕቶፕ ላይ መረጃን አብረው ሲመለከቱ',
    titleEn: 'Staff collaboration',
    titleAm: 'የሰራተኞች ትብብር',
  },
  {
    src: '/images/finance_dashboard_banner.jpg',
    altEn: 'A team meeting in a public-service office',
    altAm: 'በህዝብ አገልግሎት ቢሮ የቡድን ስብሰባ',
    titleEn: 'Service team coordination',
    titleAm: 'የአገልግሎት ቡድን ቅንጅት',
  },
  {
    src: '/kebele-hero-real.jpg',
    altEn: 'People discussing information around a tablet in an office',
    altAm: 'ሰዎች በቢሮ ውስጥ በታብሌት ዙሪያ መረጃን ሲወያዩ',
    titleEn: 'Digital tools at work',
    titleAm: 'በስራ ላይ ዲጂታል መሳሪያዎች',
  },
];

const Home = () => {
  const { lang, t } = useLanguage();
  const isAmharic = lang === 'am';
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [failedHeroImages, setFailedHeroImages] = useState([]);
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
        galleryTitle: 'የኢ-ቀበሌ አገልግሎት ማዕከል',
        gallerySubtitle: 'በዲጂታል ቴክኖሎጂ የታገዙ የህዝብ አገልግሎቶችና የቢሮ ስራዎች',
      }
    : {
        serviceDescription: 'Digital public service',
        getStarted: 'Get started',
        closeNotice: 'Dismiss maintenance notice',
        photoCredits: 'Photo credits',
        galleryTitle: 'E-Kebele Service Gallery',
        gallerySubtitle: 'Public services and office work supported by digital technology',
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

      <main className="w-full">
        <section
          className="relative mx-auto flex h-[300px] w-full items-center justify-center overflow-hidden shadow-2xl sm:my-6 sm:w-[calc(100%-3rem)] sm:rounded-2xl md:h-[480px] lg:h-[550px]"
          aria-roledescription="carousel"
          aria-label={isAmharic ? 'የቀበሌ አገልግሎት ፎቶዎች' : 'Kebele service photo slideshow'}
        >
          <div
            className="home-hero-slides"
            style={{ transform: `translateX(-${currentHeroImage * 100}%)` }}
          >
            {heroImages.map((image, index) => (
              <div
                className="home-hero-slide bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950"
                key={image.src}
              >
                {!failedHeroImages.includes(image.src) && (
                  <img
                    src={image.src}
                    alt={isAmharic ? image.altAm : image.altEn}
                    className="h-full w-full object-cover object-center"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    onError={() => setFailedHeroImages((failed) => (
                      failed.includes(image.src) ? failed : [...failed, image.src]
                    ))}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-slate-950/60" aria-hidden="true" />
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8">
            <div className="home-hero-content">
              <span className="home-hero-kicker">
                {isAmharic ? 'የኢ-ቀበሌ ዲጂታል አገልግሎት ፖርታል' : 'E-KEBELE DIGITAL SERVICE PORTAL'}
              </span>
              <h1 className="home-hero-welcome">{t.heroWelcome}</h1>
              <p className="home-hero-description">
                {isAmharic
                  ? 'የቀበሌ አገልግሎቶችን በዘመናዊ መልኩ በፍጥነት እና በቀላሉ ያግኙ።'
                  : 'Access your local services online, quickly and easily.'}
              </p>
            </div>
          </div>
        </section>
        <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-8">
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
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <section className="grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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

          <section aria-labelledby="home-gallery-title" className="my-12 space-y-6">
            <header className="mx-auto max-w-3xl space-y-2 text-center">
              <h2 id="home-gallery-title" className="text-2xl font-bold text-slate-900 sm:text-3xl">
                {homeCopy.galleryTitle}
              </h2>
              <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                {homeCopy.gallerySubtitle}
              </p>
            </header>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {galleryImages.map((image) => (
                <article key={image.src} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl">
                  <div className="h-48 w-full overflow-hidden">
                    <img
                      src={image.src}
                      alt={isAmharic ? image.altAm : image.altEn}
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-slate-800">
                      {isAmharic ? image.titleAm : image.titleEn}
                    </h3>
                  </div>
                </article>
              ))}
            </div>
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
        </div>
      </main>
    </div>
  );
};

export default Home;
