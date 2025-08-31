// src/components/AuthModal.tsx

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setEmail('');
      setPassword('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Reset error when switching between login/register
  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setError(null);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password,
        });
        
        if (error) {
          setError('Login gagal');
          return;
        }
        
        onSuccess();
        
      } else {
        // Register flow
        const { data, error } = await supabase.auth.signUp({
          email: email,
          password,
        });
        
        if (error) {
          setError('Registrasi gagal');
          return;
        }
        
        onSuccess();
      }
      
    } catch (err) {
      setError('Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const timestamp = Date.now();
      const tempEmail = `guest${timestamp}@test.com`;
      const tempPassword = `guest123456`;
      
      const { error } = await supabase.auth.signUp({
        email: tempEmail,
        password: tempPassword,
      });

      if (error) {
        setError('Mode tamu tidak tersedia. Silakan daftar manual.');
        return;
      }
      
      onSuccess();
      
    } catch (err) {
      setError('Gagal masuk sebagai tamu.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {isLogin ? 'Masuk' : 'Daftar'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Password"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {isLoading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleModeSwitch}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:bg-gray-400"
          >
            Lanjutkan sebagai Tamu
          </button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Mode tamu untuk testing - tidak perlu email/password
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
