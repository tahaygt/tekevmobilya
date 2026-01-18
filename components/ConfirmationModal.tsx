
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Evet, Sil',
  cancelText = 'Vazgeç',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        <div className="absolute top-4 right-4">
          <button 
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 pt-8 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
            <AlertTriangle size={32} strokeWidth={2.5} />
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {title}
          </h3>
          
          <p className="text-sm text-slate-500 leading-relaxed px-2">
            {message}
          </p>
        </div>

        <div className="p-4 bg-slate-50 flex gap-3 border-t border-slate-100">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 ${
              type === 'danger' 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200' 
                : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
