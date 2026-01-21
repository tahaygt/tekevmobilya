
import React from 'react';
import { Check, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Check size={40} className="text-green-600" strokeWidth={3} />
        </div>
        
        <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
          İşlem Başarılı!
        </h3>
        
        <p className="text-slate-500 font-medium leading-relaxed mb-8">
          {message}
        </p>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 hover:shadow-slate-900/20 active:scale-[0.98] transition-all"
        >
          Tamam
        </button>
      </div>
    </div>
  );
};
