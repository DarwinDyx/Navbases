import React, { useEffect, useRef, useState } from 'react';
import { 
  HiOutlineExclamationTriangle, 
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlineXCircle 
} from "react-icons/hi2";

const ICONS = {
  warning: HiOutlineExclamationTriangle,
  danger: HiOutlineXCircle,
  success: HiOutlineCheckCircle,
  info: HiOutlineInformationCircle,
};

const TYPE_CONFIG = {
  warning: { 
    iconBg: 'bg-yellow-100', 
    iconColor: 'text-yellow-600',
    buttonClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
  },
  danger: { 
    iconBg: 'bg-red-100', 
    iconColor: 'text-red-600',
    buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
  },
  success: {
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    buttonClass: 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
  },
  info: {
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  }
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText,
  cancelButtonText = "Annuler",
  type = 'warning',
  isLoading = false,
  disableConfirm = false,
}) {
  const modalRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);
  
  const Icon = ICONS[type];
  const config = TYPE_CONFIG[type];

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      setShouldRender(true);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      
      // Focus management
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAnimationEnd = () => {
    if (!isOpen) {
      setShouldRender(false);
    }
  };

  if (!shouldRender && !isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-200 ${
        isOpen 
          ? 'bg-gray-900/75 backdrop-blur-sm' 
          : 'bg-gray-900/0 backdrop-blur-0'
      }`}
      onClick={handleBackdropClick}
      onAnimationEnd={handleAnimationEnd}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      tabIndex={-1}
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className={`bg-white rounded-xl shadow-xl transform transition-all ${
          isOpen 
            ? 'scale-100 opacity-100' 
            : 'scale-95 opacity-0'
        } max-w-md w-full`}>
          
          <div className="p-6">
            <div className="flex items-start">
              <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${config.iconBg}`}>
                <Icon className={`h-6 w-6 ${config.iconColor}`} />
              </div>
              
              <div className="ml-4">
                <h3 
                  className="text-lg font-semibold text-gray-900"
                  id="modal-title"
                >
                  {title}
                </h3>
                <div className="mt-2">
                  <div 
                    className="text-sm text-gray-600"
                    id="modal-description"
                  >
                    {typeof message === 'string' ? (
                      <p>{message}</p>
                    ) : (
                      message
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors hover:bg-gray-100 rounded-lg"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelButtonText}
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.buttonClass} ${
                isLoading || disableConfirm ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
              onClick={onConfirm}
              disabled={isLoading || disableConfirm}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Chargement...
                </span>
              ) : confirmButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}