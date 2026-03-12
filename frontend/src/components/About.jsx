import React from 'react';

const About = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>ℹ️</span>
              <span>About Spiro Swap</span>
            </h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-green-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Developer Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
              <span>👨‍💻</span>
              <span>Meet the Developer</span>
            </h3>
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Developer Image */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-blue-300 shadow-lg flex-shrink-0">
                <img 
                  src="/hamz.jpg" 
                  alt="Birimengo Ivan" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/150?text=Hamz';
                  }}
                />
              </div>
              
              {/* Developer Info */}
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-xl font-bold text-gray-800">Birimengo Ivan</h4>
                <p className="text-sm text-blue-600 font-medium mb-2">Full Stack Developer</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  A passionate developer and Spiro bike enthusiast who understands the challenges 
                  riders face when searching for swap stations in unfamiliar areas. Ivan built this 
                  app to solve a real problem he encountered himself.
                </p>
              </div>
            </div>
          </div>

          {/* The Vision - Why this app was built */}
          <div className="bg-purple-50 p-5 rounded-xl border-l-4 border-purple-500">
            <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center gap-2">
              <span>💭</span>
              <span>The Vision</span>
            </h3>
            <p className="text-gray-700 leading-relaxed">
              "As a Spiro bike rider myself, I've experienced the anxiety of running low on battery 
              in an unfamiliar place with no idea where to find the nearest swap station. This app 
              was born from that frustration - to create a simple, reliable way for fellow riders 
              to always find a swap station when they need one most."
            </p>
            <p className="text-gray-700 leading-relaxed mt-2 italic">
              — Birimengo Ivan
            </p>
          </div>

          {/* Problem Statement */}
          <div className="bg-red-50 p-5 rounded-xl border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
              <span>❗</span>
              <span>The Problem</span>
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Spiro riders often struggle to find swap stations in unfamiliar areas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>No centralized platform showing all available swap stations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Riders waste time and energy searching for stations with available batteries</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Lack of real-time information about battery availability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>No community feedback system for station reliability</span>
              </li>
            </ul>
          </div>

          {/* The Solution */}
          <div className="bg-green-50 p-5 rounded-xl border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
              <span>✅</span>
              <span>The Solution</span>
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              This app provides a comprehensive solution to help Spiro riders:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><span className="font-medium">Find nearby stations:</span> Instantly locate swap stations near your current location</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><span className="font-medium">Live navigation:</span> Get turn-by-turn directions to your chosen station</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><span className="font-medium">Battery availability:</span> See real-time battery counts at each station</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><span className="font-medium">Community reviews:</span> Read and leave reviews about station experiences</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><span className="font-medium">Station details:</span> Access operating hours, contact info, and addresses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span><span className="font-medium">Search anywhere:</span> Look for stations in any location, not just your current area</span>
              </li>
            </ul>
          </div>

          {/* Community Impact */}
          <div className="bg-yellow-50 p-5 rounded-xl border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <span>🌍</span>
              <span>Community Impact</span>
            </h3>
            <p className="text-gray-700 leading-relaxed">
              What started as a personal project has grown into a community-powered tool that helps 
              hundreds of Spiro riders daily. The app is completely free and will remain so, because 
              it's built by a rider, for riders.
            </p>
          </div>

          {/* Technologies Used */}
          <div className="bg-gray-50 p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>🛠️</span>
              <span>Built With</span>
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">React</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">Node.js</span>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">MongoDB</span>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">Leaflet Maps</span>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs">Express</span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">Tailwind CSS</span>
            </div>
          </div>

          {/* Contact Developer */}
          <div className="bg-blue-50 p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <span>📬</span>
              <span>Get in Touch</span>
            </h3>
            <p className="text-gray-600 leading-relaxed mb-3">
              Have feedback, suggestions, or want to contribute? Reach out to the developer:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-lg">📧</span>
                <span className="text-blue-600">birimengo.ivan@spiroswap.app</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📱</span>
                <span className="text-gray-600">+256 751808507</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📍</span>
                <span className="text-gray-600">Kampala, Uganda</span>
              </div>
            </div>
          </div>

          {/* Version */}
          <div className="text-center text-xs text-gray-400 pt-2 border-t border-gray-200">
            <p>Version 1.0.0 | Community Edition</p>
            <p className="mt-1">Built with ❤️ by Birimengo Ivan for the Spiro community</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;