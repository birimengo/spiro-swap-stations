import React from 'react';

const Disclaimer = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-yellow-500 to-amber-600 text-white p-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>Important Disclaimer</span>
            </h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-yellow-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Disclaimer */}
          <div className="bg-red-50 p-5 rounded-xl border-l-4 border-red-500">
            <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center gap-2">
              <span>📢</span>
              <span>Not Affiliated with Spiro</span>
            </h3>
            <p className="text-gray-700 leading-relaxed font-medium">
              This app is <span className="font-bold text-red-600">not governed or established by Spiro as a company</span>. 
              It is an independent community application created to help Spiro bike users easily find 
              nearby swap stations when in difficulties or unknown places.
            </p>
          </div>

          {/* Community Application */}
          <div className="bg-blue-50 p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <span>🤝</span>
              <span>Community Application</span>
            </h3>
            <p className="text-gray-700 leading-relaxed">
              This is a <span className="font-bold">community-powered application</span> built by Spiro bike users 
              for Spiro bike users. The purpose of this app is to help the community easily navigate 
              to Spiro swap stations, especially when riders are in difficulties or unfamiliar places.
            </p>
          </div>

          {/* Information Accuracy */}
          <div className="bg-yellow-50 p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <span>📊</span>
              <span>Information Accuracy</span>
            </h3>
            <p className="text-gray-700 leading-relaxed">
              Station information, battery availability, and operating hours are provided by community 
              members and may not always be up-to-date. We encourage users to verify information 
              before making trips to swap stations.
            </p>
          </div>

          {/* Limitation of Liability */}
          <div className="bg-orange-50 p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <span>⚖️</span>
              <span>Limitation of Liability</span>
            </h3>
            <p className="text-gray-700 leading-relaxed">
              The creators and contributors of this app are not liable for any inaccuracies, 
              delays, or issues that may arise from using this application. Users rely on this 
              app at their own discretion.
            </p>
          </div>

          {/* No Warranty */}
          <div className="bg-purple-50 p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center gap-2">
              <span>🔧</span>
              <span>No Warranty</span>
            </h3>
            <p className="text-gray-700 leading-relaxed">
              This app is provided "as is" without any warranties, express or implied. 
              We do not guarantee that the app will be error-free or that all station information 
              is accurate at all times.
            </p>
          </div>

          {/* Privacy Note */}
          <div className="bg-gray-50 p-5 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <span>🔒</span>
              <span>Privacy</span>
            </h3>
            <p className="text-gray-600 leading-relaxed">
              This app uses your location to find nearby swap stations. Location data is only used 
              within the app and is not stored or shared with any third parties.
            </p>
          </div>

          {/* Acknowledgment */}
          <div className="bg-green-50 p-4 rounded-xl">
            <p className="text-gray-700 italic">
              By using this application, you acknowledge that you have read and understood this disclaimer 
              and agree to use the app at your own risk.
            </p>
          </div>

          {/* Version */}
          <div className="text-center text-xs text-gray-400 pt-2">
            Last Updated: March 2026 | Version 1.0.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;