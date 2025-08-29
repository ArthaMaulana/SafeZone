// src/components/SuccessModal.tsx
import React, { useEffect, useState } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = "Berhasil!",
  message = "Laporan berhasil dikirim!",
  actionText = "Lihat Laporan",
  onAction
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
      }`}>
        
        {/* Success Icon */}
        <div className="flex items-center justify-center pt-8 pb-4">
          <div className="relative">
            {/* Animated background circle */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                {/* Checkmark SVG with animation */}
                <svg 
                  className="w-8 h-8 text-white animate-bounce" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={3} 
                    d="M5 13l4 4L19 7"
                    className="animate-draw-check"
                  />
                </svg>
              </div>
            </div>
            
            {/* Floating particles */}
            <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute -bottom-1 -left-2 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute top-1 -right-4 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {title}
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onAction && (
              <button
                onClick={handleAction}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {actionText}
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transform hover:scale-105 transition-all duration-200"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Progress bar for auto-close */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-2xl overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-b-2xl animate-progress-bar"
            style={{
              animation: 'progress 5s linear forwards'
            }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes draw-check {
          0% {
            stroke-dasharray: 0 24;
          }
          100% {
            stroke-dasharray: 24 0;
          }
        }
        
        @keyframes progress {
          0% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
        
        .animate-draw-check {
          animation: draw-check 0.6s ease-in-out 0.3s both;
        }
        
        .animate-progress-bar {
          animation: progress 5s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default SuccessModal;
