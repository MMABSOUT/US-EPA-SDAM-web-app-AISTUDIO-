import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';

export const Header: React.FC = () => {
  const [govBannerOpen, setGovBannerOpen] = useState(false);

  return (
    <header className="no-print">
      {/* Official Government Banner */}
      <section className="bg-gray-100 border-b border-gray-300 text-xs text-gray-700 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-2">
            <img
              src="https://www.epa.gov/themes/epa_theme/images/us_flag_small.png"
              alt="U.S. flag"
              className="w-4 h-auto"
            />
            <span>An official website of the United States government</span>
            <button
              onClick={() => setGovBannerOpen(!govBannerOpen)}
              className="text-[#005ea2] underline hover:text-[#1a4480] flex items-center ml-2 cursor-pointer font-medium"
            >
              Here’s how you know
              {govBannerOpen ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          </div>
        </div>
        {govBannerOpen && (
          <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
            <div className="flex items-start space-x-2">
              <span className="font-bold text-gray-900">.gov</span>
              <div>
                <strong>Official websites use .gov</strong>
                <p className="text-gray-600">A .gov website belongs to an official government organization in the United States.</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Lock className="w-4 h-4 text-emerald-700 mt-0.5" />
              <div>
                <strong>Secure .gov websites use HTTPS</strong>
                <p className="text-gray-600">A lock or https:// means you’ve safely connected to the .gov website. Share sensitive information only on official, secure websites.</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* EPA Primary Header */}
      <div className="bg-[#005ea2] text-white py-3.5 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <a href="https://www.epa.gov/" target="_blank" rel="noreferrer" title="EPA Home" className="flex items-center">
              {/* Official EPA Logo SVG */}
              <svg className="h-8 w-auto fill-current text-white" viewBox="0 0 454.1 154.7" xmlns="http://www.w3.org/2000/svg">
                <path d="m112.8 61.2c-4.8 18.6-22.9 33.3-42.9 33.3-20.1 0-38-14.7-42.9-33.4h.2s9.8 10.3-.2 0c3.1 3.1 6.2 4.4 10.7 4.4s7.7-1.3 10.7-4.4c3.1 3.1 6.3 4.5 10.9 4.4 4.5 0 7.6-1.3 10.7-4.4c3.1 3.1 6.2 4.4 10.7 4.4s7.7-1.3 10.7-4.4c3.1 3.1 6.3 4.5 10.9 4.4 4.3 0 7.4-1.2 10.5-4.3z" />
                <path d="m113.2 51.2c0-24-19.4-43.5-43.3-43.5-24 0-43.5 19.5-43.5 43.5h39.1c-4.8-1.8-8.1-6.3-8.1-11.6 0-7 5.7-12.5 12.5-12.5 7 0 12.7 5.5 12.7 12.5 0 5.2-3.1 9.6-7.6 11.6z" />
                <path d="m72.6 147c.7-36.9 29.7-68.8 66.9-70 0 37.2-30 68-66.9 70z" />
                <path d="m67.1 147c-.7-36.9-29.7-68.8-67.1-70 0 37.2 30.2 68 67.1 70z" />
                <path d="m240 10.8h-87.9v133.1h87.9v-20.4h-60.3v-36h60.3v-21h-60.3v-35h60.3z" />
                <path d="m272.8 66.5h27.1c9.1 0 15.2-8.6 15.1-17.7-.1-9-6.1-17.3-15.1-17.3h-25.3v112.4h-27.8v-133.1h62.3c20.2 0 35 17.8 35.2 38 .2 20.4-14.8 38.7-35.2 38.7h-36.3z" />
                <path d="m315.9 143.9h29.7l12.9-35h54.2l-8.1-21.9h-38.4l18.9-50.7 39.2 107.6h29.7l-53.1-133.1h-33.7z" />
              </svg>
            </a>
            <div className="hidden sm:block border-l border-blue-400 pl-4">
              <span className="text-sm tracking-wide font-sans font-light">United States Environmental Protection Agency</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="bg-[#1a4480] text-blue-100 px-2.5 py-1 rounded text-xs font-semibold">SDAM v3.0.1</span>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="bg-[#1a4480] text-white text-sm py-2 px-4 shadow-sm border-t border-blue-900">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center space-x-6 text-sm font-medium">
          <a href="https://www.epa.gov/streamflow-duration-assessment" target="_blank" rel="noreferrer" className="hover:text-blue-200 transition-colors">
            SDAM Homepage
          </a>
          <a href="https://www.epa.gov/streamflow-duration-assessment/materials-support-application-regional-sdams" target="_blank" rel="noreferrer" className="hover:text-blue-200 transition-colors">
            Training &amp; Manuals
          </a>
          <a href="https://www.epa.gov/environmental-topics" target="_blank" rel="noreferrer" className="hover:text-blue-200 transition-colors hidden md:inline">
            Environmental Topics
          </a>
          <a href="https://www.epa.gov/laws-regulations" target="_blank" rel="noreferrer" className="hover:text-blue-200 transition-colors hidden md:inline">
            Laws &amp; Regulations
          </a>
          <a href="https://www.epa.gov/aboutepa" target="_blank" rel="noreferrer" className="hover:text-blue-200 transition-colors hidden sm:inline">
            About EPA
          </a>
        </div>
      </nav>
    </header>
  );
};
