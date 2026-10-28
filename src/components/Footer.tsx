import React from 'react';
import { ArrowUp, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="main-footer bg-[#1a4480] text-white pt-10 pb-8 px-4 mt-16 no-print border-t-4 border-[#005ea2]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm">
          <div>
            <h3 className="font-bold text-lg mb-3 pb-1 border-b border-blue-400">Discover.</h3>
            <ul className="space-y-1.5 text-blue-100">
              <li><a href="https://www.epa.gov/accessibility" target="_blank" rel="noreferrer" className="hover:underline">Accessibility Statement</a></li>
              <li><a href="https://www.epa.gov/planandbudget" target="_blank" rel="noreferrer" className="hover:underline">Budget &amp; Performance</a></li>
              <li><a href="https://www.epa.gov/contracts" target="_blank" rel="noreferrer" className="hover:underline">Contracting</a></li>
              <li><a href="https://www.epa.gov/grants" target="_blank" rel="noreferrer" className="hover:underline">Grants</a></li>
              <li><a href="https://www.epa.gov/privacy" target="_blank" rel="noreferrer" className="hover:underline">Privacy and Security Notice</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3 pb-1 border-b border-blue-400">Connect.</h3>
            <ul className="space-y-1.5 text-blue-100">
              <li><a href="https://www.data.gov/" target="_blank" rel="noreferrer" className="hover:underline flex items-center">Data.gov <ExternalLink className="w-3 h-3 ml-1 opacity-70" /></a></li>
              <li><a href="https://www.epaoig.gov/" target="_blank" rel="noreferrer" className="hover:underline flex items-center">Inspector General <ExternalLink className="w-3 h-3 ml-1 opacity-70" /></a></li>
              <li><a href="https://www.epa.gov/careers" target="_blank" rel="noreferrer" className="hover:underline">Jobs</a></li>
              <li><a href="https://www.epa.gov/newsroom" target="_blank" rel="noreferrer" className="hover:underline">Newsroom</a></li>
              <li><a href="https://www.regulations.gov/" target="_blank" rel="noreferrer" className="hover:underline flex items-center">Regulations.gov <ExternalLink className="w-3 h-3 ml-1 opacity-70" /></a></li>
              <li><a href="https://www.usa.gov/" target="_blank" rel="noreferrer" className="hover:underline flex items-center">USA.gov <ExternalLink className="w-3 h-3 ml-1 opacity-70" /></a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3 pb-1 border-b border-blue-400">Ask.</h3>
            <ul className="space-y-1.5 text-blue-100">
              <li><a href="https://www.epa.gov/home/forms/contact-epa" target="_blank" rel="noreferrer" className="hover:underline">Contact EPA</a></li>
              <li><a href="https://www.epa.gov/web-policies-and-procedures/epa-disclaimers" target="_blank" rel="noreferrer" className="hover:underline">EPA Disclaimers</a></li>
              <li><a href="https://www.epa.gov/aboutepa/epa-hotlines" target="_blank" rel="noreferrer" className="hover:underline">Hotlines</a></li>
              <li><a href="https://www.epa.gov/foia" target="_blank" rel="noreferrer" className="hover:underline">FOIA Requests</a></li>
              <li><a href="https://www.epa.gov/home/frequent-questions-specific-epa-programstopics" target="_blank" rel="noreferrer" className="hover:underline">Frequent Questions</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3 pb-1 border-b border-blue-400">SDAM Project Info</h3>
            <p className="text-xs text-blue-200 leading-relaxed mb-3">
              The Regional Streamflow Duration Assessment Methods (SDAMs) provide scientific classification of stream reaches into perennial, intermittent, or ephemeral flow durations.
            </p>
            <p className="text-xs text-blue-300">
              Web App Version 3.0.1 (October 2025). Provided on an &quot;as is&quot; basis for water quality scientists, federal and state regulators, and community practitioners.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-blue-800 flex flex-col sm:flex-row items-center justify-between text-xs text-blue-300">
          <p>© US Environmental Protection Agency. All rights reserved.</p>
          <button
            onClick={scrollToTop}
            className="mt-3 sm:mt-0 flex items-center space-x-1.5 text-white bg-[#005ea2] hover:bg-[#162e51] px-3 py-1.5 rounded transition cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
            <span>Back to top</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
