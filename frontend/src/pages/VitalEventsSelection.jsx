import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const services = [
  { id: 'marriage', title: 'Marriage Registration', amharicTitle: 'የጋብቻ ምዝገባ', description: 'Submit marriage registration details and supporting documents.', amharicDescription: 'የጋብቻ ምዝገባ መረጃ እና አስፈላጊ ሰነዶችን ያቅርቡ።', icon: '💍', path: '/marriage-registration' },
  { id: 'birth', title: 'Birth Registration', amharicTitle: 'የልደት ምዝገባ', description: 'Register new births quickly with digital documentation.', amharicDescription: 'አዲስ ልደቶችን በዲጂታል ሰነዶች በፍጥነት ይመዝግቡ።', icon: '👶', path: '/birth-registration' },
  { id: 'divorce', title: 'Divorce Registration', amharicTitle: 'የፍቺ ምዝገባ', description: 'Submit divorce records and official court decision files.', amharicDescription: 'የፍቺ መዝገቦችን እና የፍርድ ቤት ሰነዶችን ያቅርቡ።', icon: '📜', path: '/divorce-registration' },
  { id: 'death', title: 'Death Registration', amharicTitle: 'የሞት ምዝገባ', description: 'Register death events and obtain official certificates.', amharicDescription: 'የሞት ክስተቶችን ይመዝግቡ እና ይፋዊ ማረጋገጫ ያግኙ።', icon: '🕊️', path: '/death-registration' }
];

const VitalEventsSelection = () => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{t.selectVital}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-600">{lang === 'en' ? 'Please select the type of event you wish to register.' : 'እባክዎን ለመመዝገብ የሚፈልጉትን የክስተት አይነት ይምረጡ።'}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {services.map((service) => (
            <button key={service.id} type="button" onClick={() => navigate(service.path)} className="flex items-start gap-5 rounded-2xl border border-gray-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg">
              <span className="rounded-full bg-blue-50 p-4 text-4xl" aria-hidden="true">{service.icon}</span>
              <span>
                <strong className="block text-xl text-gray-900">{lang === 'en' ? service.title : service.amharicTitle}</strong>
                <span className="mt-2 block leading-relaxed text-gray-600">{lang === 'en' ? service.description : service.amharicDescription}</span>
                <span className="mt-4 block font-bold text-blue-700">{lang === 'en' ? 'Proceed to Form' : 'ወደ ቅጹ ይቀጥሉ'} →</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
};

export default VitalEventsSelection;
