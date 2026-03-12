import React, { useEffect, useRef } from 'react';

const Navbar = ({ 
  onAdminClick, 
  onLoginClick, 
  onLogoutClick,
  onAboutClick,
  onDisclaimerClick,
  showAdmin, 
  isAuthenticated, 
  user,
  isMobileMenuOpen,
  setIsMobileMenuOpen 
}) => {
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobileMenuOpen && 
        menuRef.current && 
        !menuRef.current.contains(event.target) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  // Handle menu toggle with scroll to top
  const handleMenuToggle = () => {
    // Scroll to top smoothly
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Toggle menu
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-green-600 text-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex justify-between items-center h-12">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-base sm:text-lg font-bold">⚡ Spiro</h1>
          </div>

          {/* Menu Icon - Always visible on all screens */}
          <div className="flex items-center">
            <button
              ref={buttonRef}
              onClick={handleMenuToggle}
              className="p-2 rounded hover:bg-green-700 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Floating Dropdown Menu - Appears when menu icon is clicked */}
        {isMobileMenuOpen && (
          <div 
            ref={menuRef}
            className="fixed mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50"
            style={{ 
              right: '1rem', 
              top: '3.5rem',
              maxHeight: 'calc(100vh - 5rem)',
              overflowY: 'auto'
            }}
          >
            {/* User info if authenticated */}
            {isAuthenticated && (
              <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👤</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="py-1">
              {/* About Button */}
              <button
                onClick={() => {
                  onAboutClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
              >
                <span className="text-lg">ℹ️</span>
                <span>About Spiro</span>
              </button>

              {/* Disclaimer Button */}
              <button
                onClick={() => {
                  onDisclaimerClick();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors border-t border-gray-100"
              >
                <span className="text-lg">⚠️</span>
                <span>Disclaimer</span>
              </button>

              {isAuthenticated ? (
                <>
                  {/* Admin/Map Toggle */}
                  <button
                    onClick={() => {
                      onAdminClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors border-t border-gray-100"
                  >
                    <span className="text-lg">{showAdmin ? '🗺️' : '⚙️'}</span>
                    <span>{showAdmin ? 'Map View' : 'Admin Panel'}</span>
                  </button>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      onLogoutClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors border-t border-gray-100"
                  >
                    <span className="text-lg">🚪</span>
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                /* Login Button for non-authenticated users */
                <button
                  onClick={() => {
                    onLoginClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-3 transition-colors border-t border-gray-100"
                >
                  <span className="text-lg">🔑</span>
                  <span className="font-medium">Admin Login</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;