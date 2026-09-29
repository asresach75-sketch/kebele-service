import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';

const VitalEvents = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const content = {
    am: {
      title: 'የወሳኝ ኩነቶች አገልግሎት ይምረጡ',
      subtitle: 'እባክዎን መመዝገብ የሚፈልጉትን የኩነት አይነት ይምረጡ።',
      marriageTitle: 'የጋብቻ ምዝገባ',
      marriageDesc: 'የጋብቻ ምዝገባ መረጃ እና አስፈላጊ ሰነዶችን ያቅርቡ።',
      birthTitle: 'የልደት ምዝገባ',
      birthDesc: 'አዲስ የተወለዱ ህጻናትን በዲጂታል ሰነዶች በፍጥነት ይመዝግቡ።',
      divorceTitle: 'የፍቺ ምዝገባ',
      divorceDesc: 'የፍቺ መዝገቦችን እና የፍርድ ቤት ሰነዶችን ያቅርቡ።',
      deathTitle: 'የሞት ምዝገባ',
      deathDesc: 'የሞት ኩነቶችን በመመዝገብ ኦፊሴላዊ ማረጋገጫ ያግኙ።',
      continueBtn: 'ወደ ቅጹ ይቀጥሉ →'
    },
    en: {
      title: 'Select Civil Event Service',
      subtitle: 'Please select the type of event you want to register.',
      marriageTitle: 'Marriage Registration',
      marriageDesc: 'Provide marriage registration information and necessary documents.',
      birthTitle: 'Birth Registration',
      birthDesc: 'Quickly record new births with digital documents.',
      divorceTitle: 'Divorce Registration',
      divorceDesc: 'Provide divorce records and court documents.',
      deathTitle: 'Death Registration',
      deathDesc: 'Record death events and get official confirmation.',
      continueBtn: 'Continue to the form →'
    }
  };

  const t = content[lang] || content.en;

  const events = [
    {
      id: 'marriage',
      title: t.marriageTitle,
      desc: t.marriageDesc,
      icon: '💍',
      path: '/vital-events/marriage'
    },
    {
      id: 'birth',
      title: t.birthTitle,
      desc: t.birthDesc,
      icon: '👶',
      path: '/vital-events/birth'
    },
    {
      id: 'divorce',
      title: t.divorceTitle,
      desc: t.divorceDesc,
      icon: '📜',
      path: '/vital-events/divorce'
    },
    {
      id: 'death',
      title: t.deathTitle,
      desc: t.deathDesc,
      icon: '🕊️',
      path: '/vital-events/death'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-800">{t.title}</h1>
          <p className="text-sm text-slate-500">{t.subtitle}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {events.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(item.path)}
              className="group flex cursor-pointer items-start space-x-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex-shrink-0 rounded-full bg-blue-50 p-3 text-2xl">{item.icon}</div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800 transition group-hover:text-blue-600">{item.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{item.desc}</p>
                <div className="pt-2 text-xs font-semibold text-blue-600">
                  <span>{t.continueBtn}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VitalEvents;
