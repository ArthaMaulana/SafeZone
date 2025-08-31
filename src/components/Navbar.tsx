// src/components/Navbar.tsx

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import AuthModal from './AuthModal';
import type { User } from '@supabase/supabase-js';

const Navbar = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Auth check error:', error);
          setUser(null);
        } else {
          setUser(user);
          // Check if user is admin
          if (user) {
            const { data: isAdminResult } = await supabase.rpc('is_user_admin');
            setIsAdmin(isAdminResult || false);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        setShowAuthModal(false);
        setShowUserMenu(false);
        // Check admin status on login
        if (session?.user) {
          const { data: isAdminResult } = await supabase.rpc('is_user_admin');
          setIsAdmin(isAdminResult || false);
        }
      } else if (event === 'SIGNED_OUT') {
        setShowUserMenu(false);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      console.log('=== LOGOUT STARTED ===');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      console.log('Logout successful');
      setShowUserMenu(false);
      setUser(null);
      setIsAdmin(false);
      
      // Force page reload to clear all state
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if there's an error, try to clear local state
      setUser(null);
      setIsAdmin(false);
      setShowUserMenu(false);
      window.location.reload();
    }
  };

  return (
    <>
      <nav className="bg-white shadow-md border-b border-gray-200 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and App Name */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <span className="text-2xl">🛡️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SafeZone</h1>
                <p className="text-xs text-gray-500">Laporan Keamanan Lingkungan</p>
              </div>
            </div>

            {/* Authentication Section */}
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm text-gray-600">Loading...</span>
                </div>
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => {
                      console.log('User menu button clicked! Current state:', showUserMenu);
                      console.log('Setting showUserMenu to:', !showUserMenu);
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center space-x-2 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg border border-green-200 transition-colors"
                  >
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500">Online</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>

                  {/* User Menu Dropdown */}
                  {showUserMenu && (
                    <div 
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200 z-50"
                      style={{ 
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        zIndex: 9999,
                        backgroundColor: 'white',
                        border: '2px solid red' // Temporary visual indicator
                      }}
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          {isAdmin ? 'Administrator' : 'Pengguna Terdaftar'}
                        </p>
                      </div>
                      {isAdmin && (
                        <a
                          href="/admin"
                          className="block w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                            </svg>
                            <span>Admin Dashboard</span>
                          </div>
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          console.log('Logout button clicked!');
                          e.preventDefault();
                          e.stopPropagation();
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                          </svg>
                          <span>Logout</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                  </svg>
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Click outside to close user menu */}
        {showUserMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowUserMenu(false)}
          />
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </>
  );
};

export default Navbar;
