import React from 'react';
import { useLanguage } from './context/LanguageContext';

const About = () => {
  const { lang, t } = useLanguage();
  const isAmharic = lang === 'am';
  const copy = isAmharic
    ? {
        label: 'ስለ እኛ', title: 'የኢ-ቀበሌ የዲጂታል አገልግሎት ፖርታል',
        intro: 'ዘመናዊ፣ የተቀላጠፈ እና ግልጽ የሆነ የቀበሌ አገልግሎት ለሁሉም ዜጎች በዲጂታል አማራጭ ማቅረብ።',
        whyTitle: 'አገልግሎታችንን ወደ ዲጂታል መቀየር ለምን አስፈለገ?', whyText: 'የኢ-ቀበሌ ፖርታል ዜጎች ረጅም ሰልፍ ሳይሰለፉ የቀበሌ አገልግሎቶችን ከያሉበት ቦታ በቀላሉ እንዲያገኙ የሚያስችል ዘመናዊ ሲስተም ነው።',
        detail: 'የነዋሪነት መታወቂያ ማውጣት፣ ማደስ፣ የልደት፣ ጋብቻ፣ ፍቺ እና ሞት ምዝገባን በኦንላይን ማመልከትና ሂደቱን መከታተል ያስችላል።', online: 'የኦንላይን አገልግሎት', secure: 'ፈጣን እና ደህንነቱ የተጠበቀ',
        visionTitle: 'ራዕያችን', vision: 'በቴክኖሎጂ የታገዘ፣ ከወረቀት ነፃ እና ለሁሉም ነዋሪዎች እኩል ተደራሽ የሆነ የቀበሌ አስተዳደር መፍጠር።', missionTitle: 'ተልዕኮአችን', mission: 'የቀበሌ አገልግሎት አሰጣጥን በማዘመን የህዝብን እንግልት መቀነስ፣ ግልጽነትን ማሳደግ እና ቀልጣፋ አሰራርን መዘርጋት።'
      }
    : {
        label: 'About Us', title: 'E-Kebele Digital Service Portal', intro: 'Modern, efficient, and transparent Kebele services delivered digitally for every citizen.', whyTitle: 'Why move Kebele services online?', whyText: 'The E-Kebele portal helps citizens access Kebele services from anywhere without long queues, saving time and effort.', detail: 'Apply online for resident ID issuance and renewal, birth, marriage, divorce, and death registration, then track each request through its lifecycle.', online: 'Online service', secure: 'Fast and secure', visionTitle: 'Our Vision', vision: 'To create a technology-enabled, paperless Kebele administration with equal access for every resident.', missionTitle: 'Our Mission', mission: 'To modernize Kebele service delivery, reduce citizen effort, improve transparency, and establish efficient processes.'
      };

  const services = [[t.newId, t.newIdText], [t.idRenewal, t.renewalText], [t.vitalEvents, t.vitalText], [t.navTrack, t.trackingText]];

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        <header className="mx-auto max-w-3xl space-y-3 text-center">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-800">{copy.label} | About Us</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">{copy.title}</h1>
          <p className="text-base text-slate-600 md:text-lg">{copy.intro}</p>
        </header>

        <section className="flex flex-col items-center gap-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg md:p-10 lg:flex-row">
          <div className="w-full flex-1">
            <figure className="overflow-hidden rounded-2xl border border-slate-200 shadow-md">
              <img src="/images/officer_dashboard_banner.jpg" alt={isAmharic ? 'የኢትዮጵያ ቀበሌ ቢሮ አገልግሎት ሰራተኞች በስራ ላይ' : 'Ethiopian Kebele office staff working in a public service environment'} className="h-80 w-full object-cover object-center transition-transform duration-500 hover:scale-105 md:h-[400px]" />
            </figure>
            <figcaption className="mt-2 text-xs text-slate-500">
              {isAmharic ? 'የምስል ጭብጥ: ' : 'Image topic: '}
              Ethiopian public service office environment
            </figcaption>
          </div>
          <div className="flex-1 space-y-5"><h2 className="text-2xl font-bold text-slate-800">{copy.whyTitle}</h2><p className="text-sm leading-relaxed text-slate-600 md:text-base">{copy.whyText}</p><p className="text-sm leading-relaxed text-slate-600 md:text-base">{copy.detail}</p><div className="grid grid-cols-2 gap-4 pt-3"><div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><h3 className="text-2xl font-black text-blue-900">24/7</h3><p className="text-xs font-medium text-blue-700">{copy.online}</p></div><div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><h3 className="text-2xl font-black text-emerald-900">100%</h3><p className="text-xs font-medium text-emerald-700">{copy.secure}</p></div></div></div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2"><div className="space-y-3 rounded-2xl bg-blue-900 p-8 text-white shadow-md"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700/50 text-2xl">🎯</div><h3 className="text-xl font-bold">{copy.visionTitle} <span className="font-normal">(Vision)</span></h3><p className="text-sm leading-relaxed text-blue-100">{copy.vision}</p></div><div className="space-y-3 rounded-2xl bg-slate-900 p-8 text-white shadow-md"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700/50 text-2xl">🚀</div><h3 className="text-xl font-bold">{copy.missionTitle} <span className="font-normal">(Mission)</span></h3><p className="text-sm leading-relaxed text-slate-300">{copy.mission}</p></div></section>

        <section className="space-y-6"><h2 className="text-center text-2xl font-bold text-slate-900">{t.keyServices}</h2><div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">{services.map(([title, description]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="mb-2 font-bold text-blue-700">{title}</h3><p className="text-sm leading-relaxed text-slate-600">{description}</p></article>)}</div></section>
      </div>
    </div>
  );
};

export default About;
