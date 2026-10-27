import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import './About.css';

const About = () => {
  const { lang, t } = useLanguage();
  const isAmharic = lang === 'am';
  const [statistics, setStatistics] = useState(null);
  const [isStatisticsLoading, setIsStatisticsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const loadStatistics = async () => {
      try {
        const response = await fetch('/api/services/public-statistics', { signal: controller.signal });
        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(`Statistics API returned a non-JSON response (HTTP ${response.status}).`);
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
          throw new Error(`Statistics API returned an invalid JSON response (HTTP ${response.status}).`);
        }
        if (!response.ok) throw new Error(data.message || 'Unable to load portal statistics.');
        setStatistics(data);
      } catch (error) {
        if (error.name !== 'AbortError') console.error('Unable to load portal statistics:', error);
      } finally {
        if (!controller.signal.aborted) setIsStatisticsLoading(false);
      }
    };

    loadStatistics();
    return () => controller.abort();
  }, []);

  const copy = isAmharic
    ? {
        label: 'ስለ እኛ',
        title: 'የኢ-ቀበሌ የዲጂታል አገልግሎት ፖርታል',
        intro: 'ዘመናዊ፣ ፈጣን እና ግልጽ የሆነ የቀበሌ አገልግሎቶችን በዲጂታል ስርዓት ለሁሉም ዜጎች ማቅረብ።',
        whyTitle: 'ለምን የቀበሌ አገልግሎቶችን በዲጂታል ማስተናገድ አስፈላጊ ነው?',
        whyText: 'የኢ-ቀበሌ ፖርታል ዜጎች ረጅም ሰልፍ ሳይሰለፉ ከቀበሌ ቢሮ ውስጥ አገልግሎቶችን በቀላሉ እንዲያገኙ ያስችላል።',
        detail: 'የመታወቂያ ማውጣትና እድሳት፣ የልደት፣ ጋብቻ፣ ፍቺ እና ሞት ምዝገባ በኦንላይን ማመልከት እና ሂደቱን መከታተል ይችላሉ።',
        online: 'ኦንላይን አገልግሎት',
        secure: 'ፈጣን እና ደህንነቱ የተጠበቀ',
        visionTitle: 'ራዕያችን',
        vision: 'በቴክኖሎጂ የታገዘ፣ ከወረቀት ነፃ እና ለሁሉም ነዋሪዎች እኩል ተደራሽ የሆነ የቀበሌ አስተዳደር መፍጠር።',
        missionTitle: 'ተልዕኮአችን',
        mission: 'የቀበሌ አገልግሎት አሰጣጥን በማዘመን የህዝብን እንግልት መቀነስ፣ ግልጽነትን ማሳደግ እና ቀልጣፋ አሰራርን መዘርጋት።',
        statsTitle: 'የፖርታሉ ቁጥሮች',
        citizens: 'የተመዘገቡ ዜጎች',
        completed: 'የተጠናቀቁ ማመልከቻዎች',
        idsIssued: 'የተጠናቀቁ የመታወቂያ አገልግሎቶች',
        howTitle: 'አገልግሎቱን እንዴት ያገኛሉ?',
        steps: [
          ['1', 'ይመዝገቡ ወይም ይግቡ', 'የግል መለያ ይፍጠሩ ወይም ወደ ነባር መለያዎ ይግቡ።'],
          ['2', 'አገልግሎት ይምረጡ', 'የሚፈልጉትን አገልግሎት ይምረጡ፣ ቅጹን ይሙሉ እና የሚፈለጉ ሰነዶችን ያያይዙ።'],
          ['3', 'ሂደቱን ይከታተሉ', 'የማመልከቻ ቁጥርዎን በመጠቀም ሁኔታውን ይከታተሉ፤ ሰነዱ ዝግጁ ሲሆን ከቀበሌ ይረከቡ።']
        ],
        faqTitle: 'ብዙ ጊዜ የሚጠየቁ ጥያቄዎች',
        faqItems: [
          ['ለማመልከቻ ምን ሰነዶች ያስፈልጋሉ?', 'የሚፈለጉ ሰነዶች እንደ አገልግሎቱ ይለያያሉ። ማመልከቻውን ሲጀምሩ የሚታየውን የሰነድ ዝርዝር ይከተሉ።'],
          ['የማመልከቻዬን ሁኔታ እንዴት አያለሁ?', 'ወደ Tracker ይግቡና በማመልከቻ ቁጥርዎ ወይም በመለያዎ የሂደቱን ሁኔታ ይከታተሉ።'],
          ['ክፍያ በምን መንገድ ማጠናቀቅ ይቻላል?', 'ክፍያ ሲጠየቅ በክፍያ ገጹ ላይ የቀረቡትን Chapa ወይም Telebirr አማራጮች ይጠቀሙ።']
        ]
      }
    : {
        label: 'About Us',
        title: 'E-Kebele Digital Service Portal',
        intro: 'Modern, efficient, and transparent Kebele services delivered digitally for every citizen.',
        whyTitle: 'Why move Kebele services online?',
        whyText: 'The E-Kebele portal helps citizens access Kebele services from anywhere without long queues, saving time and effort.',
        detail: 'Apply online for resident ID issuance and renewal, birth, marriage, divorce, and death registration, then track each request through its lifecycle.',
        online: 'Online service',
        secure: 'Fast and secure',
        visionTitle: 'Our Vision',
        vision: 'To create a technology-enabled, paperless Kebele administration with equal access for every resident.',
        missionTitle: 'Our Mission',
        mission: 'To modernize Kebele service delivery, reduce citizen effort, improve transparency, and establish efficient processes.',
        statsTitle: 'Portal at a glance',
        citizens: 'Registered citizens',
        completed: 'Completed applications',
        idsIssued: 'Completed ID services',
        howTitle: 'How it works',
        steps: [
          ['1', 'Register or log in', 'Create your citizen account or sign in to your existing account.'],
          ['2', 'Choose a service', 'Select a service, complete the application, and attach the required documents.'],
          ['3', 'Track and collect', 'Track progress using your application number and collect your document when it is ready.']
        ],
        faqTitle: 'Frequently asked questions',
        faqItems: [
          ['Which documents do I need to apply?', 'Required documents depend on the service. Review the document checklist shown when you start that application.'],
          ['How can I check my application status?', 'Open Tracker and use your application number or sign in to follow the request status.'],
          ['How can I pay?', 'When payment is due, use the Chapa or Telebirr options presented on the payment page.']
        ]
      };

  const services = [[t.newId, t.newIdText], [t.idRenewal, t.renewalText], [t.vitalEvents, t.vitalText], [t.navTrack, t.trackingText]];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-50 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <figure className="overflow-hidden rounded-[28px] border border-slate-200 shadow-xl">
          <img
            src="/images/home_hero.jpg"
            alt={isAmharic ? 'በኢትዮጵያ ቀበሌ ቢሮ ውስጥ ዜጋን የምታገለግል ሴት' : 'A woman assisting a citizen in an Ethiopian Kebele office'}
            className="h-56 w-full object-cover object-center transition-transform duration-500 ease-in-out hover:scale-[1.02] sm:h-72 lg:h-[380px]"
          />
          <figcaption className="sr-only">
            {isAmharic ? 'በቀበሌ ቢሮ የሚሰጥ የህዝብ አገልግሎት' : 'Public service in a Kebele office'}
          </figcaption>
        </figure>

        <header className="mx-auto max-w-4xl space-y-4 text-center">
          <span className="inline-flex rounded-full bg-blue-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-800 shadow-sm">
            {copy.label}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">{copy.title}</h1>
          <p className="mx-auto max-w-3xl text-base text-slate-600 md:text-lg">{copy.intro}</p>
        </header>

        <section aria-labelledby="portal-statistics-title" className="space-y-4">
          <h2 id="portal-statistics-title" className="text-center text-xl font-bold text-slate-900">{copy.statsTitle}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              [copy.citizens, statistics?.registeredCitizens],
              [copy.completed, statistics?.completedApplications],
              [copy.idsIssued, statistics?.idsIssued],
            ].map(([label, value]) => (
              <article key={label} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl">
                <p className="text-3xl font-extrabold text-blue-800" aria-live="polite">
                  {isStatisticsLoading
                    ? <span className="inline-block h-8 w-20 animate-pulse rounded bg-slate-200" aria-label={isAmharic ? 'በመጫን ላይ...' : 'Loading...'} />
                    : Number.isFinite(value) ? value.toLocaleString(isAmharic ? 'am-ET' : 'en-US') : '—'}
                </p>
                <h3 className="mt-2 text-sm font-semibold text-slate-600">{label}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-10">
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-800 md:text-3xl">{copy.whyTitle}</h2>
            <p className="text-sm leading-relaxed text-slate-600 md:text-base">{copy.whyText}</p>
            <p className="text-sm leading-relaxed text-slate-600 md:text-base">{copy.detail}</p>
            <div className="grid grid-cols-2 gap-4 pt-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
                <h3 className="text-2xl font-black text-blue-900">24/7</h3>
                <p className="text-xs font-medium text-blue-700">{copy.online}</p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
                <h3 className="text-2xl font-black text-emerald-900">100%</h3>
                <p className="text-xs font-medium text-emerald-700">{copy.secure}</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="how-it-works-title" className="space-y-6">
          <h2 id="how-it-works-title" className="text-center text-2xl font-bold text-slate-900">{copy.howTitle}</h2>
          <div className="about-step-grid grid grid-cols-1 gap-5 md:grid-cols-3">
            {copy.steps.map(([number, title, description]) => (
              <article key={number} className="about-step-card relative rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800">{number}</span>
                <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
                {number === '1' && <Link className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900" to="/login">{isAmharic ? 'ይግቡ' : 'Log in'}</Link>}
                {number === '2' && <Link className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900" to="/vital-events">{isAmharic ? 'አገልግሎቶችን ይመልከቱ' : 'Explore services'}</Link>}
                {number === '3' && <Link className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-900" to="/track">{isAmharic ? 'መከታተያ ይክፈቱ' : 'Open Tracker'}</Link>}
              </article>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-3 rounded-[28px] bg-blue-900 p-8 text-white shadow-[0_15px_45px_rgba(30,64,175,0.28)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700/50 text-2xl">🎯</div>
            <h3 className="text-xl font-bold">{copy.visionTitle}</h3>
            <p className="text-sm leading-relaxed text-blue-100">{copy.vision}</p>
          </div>
          <div className="space-y-3 rounded-[28px] bg-slate-900 p-8 text-white shadow-[0_15px_45px_rgba(15,23,42,0.25)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700/50 text-2xl">🚀</div>
            <h3 className="text-xl font-bold">{copy.missionTitle}</h3>
            <p className="text-sm leading-relaxed text-slate-300">{copy.mission}</p>
          </div>
          <div className="space-y-4 rounded-[28px] border border-emerald-100 bg-emerald-50 p-7 text-slate-800 shadow-lg md:col-span-2 xl:col-span-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-2xl text-emerald-800">☎</div>
            <h3 className="text-xl font-bold">{isAmharic ? 'የቢሮ ሰዓት እና ድጋፍ' : 'Office hours & support'}</h3>
            <div className="space-y-3 text-sm leading-relaxed text-slate-600">
              <div>
                <h4 className="font-semibold text-slate-800">{t.hoursTitle}</h4>
                <p>{t.hoursWeekday}</p>
                <p>{t.hoursSaturday}</p>
                <p>{t.hoursSunday}</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">{t.phoneTitle}</h4>
                <a className="font-semibold text-emerald-800 underline-offset-2 hover:underline" href="tel:+251911234567">{t.phoneSupport}</a>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-center text-2xl font-bold text-slate-900">{t.keyServices}</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.map(([title, description]) => (
              <article key={title} className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <h3 className="mb-2 font-bold text-blue-700">{title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="faq-title" className="mx-auto w-full max-w-4xl space-y-5">
          <h2 id="faq-title" className="text-center text-2xl font-bold text-slate-900">{copy.faqTitle}</h2>
          <div className="space-y-3">
            {copy.faqItems.map(([question, answer]) => (
              <details key={question} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow open:shadow-md">
                <summary className="cursor-pointer font-semibold text-slate-800 marker:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">{question}</summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
