import React from 'react';

const About = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-8 sm:p-12">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <span className="text-sm font-bold text-blue-600 tracking-wide uppercase">
            E-Kebele Portal • Digital Citizen Services
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2">
            About Ethiopia Digital ID System
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            The Ethiopia Digital ID System is a comprehensive web-based platform designed to modernize and streamline civil registration and national ID issuance processes at the grassroots (Kebele) level.
          </p>
        </div>

        {/* Project Objective */}
        <div className="mb-12 bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            📌 Project Objective
          </h2>
          <p className="mt-2 text-gray-700 leading-relaxed">
            This system transforms the traditional paper-based process of issuing identity cards and registering vital events such as birth, marriage, divorce, and death into an efficient online service. It helps citizens save time and effort while enabling government offices to manage requests more accurately and transparently.
          </p>
        </div>

        {/* Key Services */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            🚀 Key Services Provided
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-xl p-5 hover:shadow-md transition bg-white">
              <h3 className="font-bold text-lg text-blue-700 mb-2">New ID Application</h3>
              <p className="text-gray-600 text-sm">
                Citizens can easily submit requests for a new identification card online from anywhere.
              </p>
            </div>
            <div className="border rounded-xl p-5 hover:shadow-md transition bg-white">
              <h3 className="font-bold text-lg text-blue-700 mb-2">ID Card Renewal</h3>
              <p className="text-gray-600 text-sm">
                Existing identification cards can be renewed through a simple digital application process.
              </p>
            </div>
            <div className="border rounded-xl p-5 hover:shadow-md transition bg-white">
              <h3 className="font-bold text-lg text-blue-700 mb-2">Vital Events Registration</h3>
              <p className="text-gray-600 text-sm">
                Secure registration and status tracking for Birth, Marriage, Divorce, and Death records.
              </p>
            </div>
            <div className="border rounded-xl p-5 hover:shadow-md transition bg-white">
              <h3 className="font-bold text-lg text-blue-700 mb-2">Real-time Tracking</h3>
              <p className="text-gray-600 text-sm">
                Applicants can monitor the progress of their requests in real time (Pending, Approved, Rejected).
              </p>
            </div>
          </div>
        </div>

        {/* Role-Based Access Control (RBAC) */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            👥 Role-Based Access & Responsibilities (RBAC)
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            የስርዓቱን አሰራር የበለጠ ሙሉ፣ ደህንነቱ የተጠበቀ እና ቀልጣፋ ለማድረግ የተዘረጉ የባለድርሻ አካላት ድርሻና ፈቃዶች፦
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Citizen */}
            <div className="border rounded-xl p-5 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-800">1. Citizen / User (ተጠቃሚ/ዜጋ)</h3>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded">citizen</span>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>ማመልከቻዎችን መሙላት እና ሰነድ Upload ማድረግ።</li>
                <li>የመታወቂያ እና የክስተቶች አገልግሎት ክፍያ መክፈል ።</li>
                <li>የማመልከቻውን ሁኔታ (Status) በReal-time Track ማድረግ።</li>
                <li>የራሱን Profile ማየት እና ማስተካከል ብቻ።</li>
              </ul>
            </div>

            {/* Kebele Officer */}
            <div className="border rounded-xl p-5 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-800">2. Kebele Officer (የቀበሌ ሰራተኛ)</h3>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-0.5 rounded">officer</span>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>የተላኩ የዕድሳት፣ የልደት፣ የጋብቻ እና የፍቺ ማመልከቻዎችን Review ማድረግ።</li>
                <li>የቀረቡ ሰነዶችን (የፍርድ ቤት፣ የሆስፒታል ማስረጃ፣ ፎቶ) ማረጋገጥ።</li>
                <li>አፕሊኬሽኑን Approve ወይም Reject ማድረግ (ምክንያቱን በመፃፍ)።</li>
              </ul>
            </div>

            {/* Finance Officer */}
            <div className="border rounded-xl p-5 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-800">3. Finance Officer (የፋይናንስ ሰራተኛ)</h3>
                <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded">finance</span>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>የክፍያ ሂደቶችን በChapa፣ Telebirr ወይም ባንክ በኩል ማረጋገጥ (Payment Verification)።</li>
                <li>ለተጠቃሚዎች የክፍያ ደረሰኝ (Receipt) ማመንጨት።</li>
                <li>የዕለታዊ እና የወርሃዊ ገቢ ሪፖርቶችን ማየት።</li>
              </ul>
            </div>

            {/* System Admin */}
            <div className="border rounded-xl p-5 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg text-gray-800">4. System Administrator (የሲስተም አድሚን)</h3>
                <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-0.5 rounded">admin</span>
              </div>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>የአዲስ ሰራተኞችን (Officers/Finance) Account ማስተዳደር።</li>
                <li>የአገልግሎት ክፍያዎች መጠን ማስተካከል (Setting)።</li>
                <li>System Log እና Audit Trails (ማን ምን እንደሰራ) መከታተል ።</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="text-center pt-8 border-t">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex justify-center items-center gap-2">
            💻 Technology Stack
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            This application is engineered using modern, robust web technologies on the MERN Stack:
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-green-100 text-green-800 font-bold px-4 py-2 rounded-full text-sm">
              MongoDB
            </span>
            <span className="bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-full text-sm">
              Express.js
            </span>
            <span className="bg-blue-100 text-blue-800 font-bold px-4 py-2 rounded-full text-sm">
              React.js
            </span>
            <span className="bg-green-200 text-green-900 font-bold px-4 py-2 rounded-full text-sm">
              Node.js
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-400 border-t pt-4">
          © 2026 Ethiopia Digital ID System. All Rights Reserved.
        </div>

      </div>
    </div>
  );
};

export default About;
