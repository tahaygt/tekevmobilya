
import React, { useState } from 'react';
import { Menu, X, Users, FileText, Truck, Box, Wallet, PieChart, Store, LogOut, ChevronRight, LayoutDashboard, Home } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: any) => void;
  panelMode: 'accounting' | 'store';
  onSwitchPanel: () => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, panelMode, onSwitchPanel, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = panelMode === 'accounting' ? [
    { id: 'customers', label: 'Cari Hesaplar', icon: Users },
    { id: 'products', label: 'Ürün & Stok', icon: Box },
    { id: 'invoice-sales', label: 'Satış Faturası', icon: FileText },
    { id: 'invoice-purchase', label: 'Alış Faturası', icon: Truck },
    { id: 'cash', label: 'Kasa İşlemleri', icon: Wallet },
    { id: 'report', label: 'Finansal Raporlar', icon: PieChart },
  ] : [
    { id: 'invoice-sales', label: 'Perakende Satış', icon: Store }, // Icon changed to Store/Home context
    { id: 'customers', label: 'Şubeler & Cariler', icon: Users },
    { id: 'products', label: 'Ürün & Stok', icon: Box },
    { id: 'report', label: 'Satış Raporları', icon: PieChart },
  ];

  const isStore = panelMode === 'store';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 print:h-auto print:overflow-visible font-sans selection:bg-primary/20">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out shadow-2xl
          md:relative md:translate-x-0 flex flex-col no-print
          ${isStore 
             ? 'bg-[#0B1221] text-white' // Darker Navy/Slate for Store
             : 'bg-slate-900 text-white'}
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Area */}
        <div className="h-32 flex flex-col items-center justify-center relative shrink-0">
             <div className="flex flex-col items-center gap-3">
                 <h1 className="text-3xl font-black tracking-[0.1em] text-white/90">
                    TEKDEMİR
                 </h1>
                 <div className={`px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.15em] uppercase border shadow-sm
                    ${isStore 
                        ? 'bg-[#182030] text-orange-500 border-white/5' 
                        : 'bg-slate-800 text-sky-400 border-slate-700'}
                 `}>
                    {isStore ? 'MAĞAZA YÖNETİMİ' : 'MUHASEBE & FİNANS'}
                 </div>
             </div>
             
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute right-4 top-8 text-white/70 hover:text-white transition-colors">
               <X size={24} />
             </button>
        </div>

        {/* Separator Line */}
        <div className="h-px bg-white/5 mx-6 mb-6"></div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-scroll px-4 space-y-2 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activePage === item.id || (activePage === 'customer-detail' && item.id === 'customers');
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center justify-between px-5 py-4 text-sm font-bold transition-all duration-200 rounded-2xl group relative overflow-hidden
                  ${isActive 
                    ? (isStore 
                        ? 'bg-[#ea580c] text-white shadow-lg shadow-orange-900/20' // Pure Orange Background
                        : 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-lg')
                    : 'text-slate-400 hover:text-white hover:bg-white/5'}
                `}
              >
                <div className="flex items-center relative z-10">
                    <item.icon size={20} className={`mr-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'}`} />
                    <span className="tracking-wide">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={16} className="opacity-80 relative z-10"/>}
              </button>
            );
          })}
        </nav>
        
        {/* Bottom Actions */}
        <div className="p-6 border-t border-white/5 space-y-4 shrink-0 bg-[#080d19]/50">
            <button 
                onClick={onSwitchPanel}
                className="w-full py-3.5 px-4 rounded-xl bg-[#182030] hover:bg-[#232d42] border border-white/5 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-center font-bold tracking-widest group"
            >
                <LayoutDashboard size={16} className={`mr-2 text-slate-500 group-hover:text-white transition-colors`} /> PANELE DÖN
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print:h-auto print:overflow-visible relative bg-[#f8fafc]">
        
        {/* Header - Mağaza Modunda Sade Beyaz */}
        <header className="h-20 bg-white border-b border-slate-200/60 flex items-center justify-between px-8 no-print z-10 sticky top-0 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                {activePage === 'customer-detail' ? 'Hesap Detayı' : navItems.find(n => n.id === activePage)?.label || 'Panel'}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="text-right hidden sm:block">
                 <div className="text-xs font-bold text-slate-900">
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long' })}
                 </div>
                 <div className="text-[11px] text-slate-400 font-medium">
                    {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                 </div>
             </div>
             
             <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

             <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all bg-white border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-100 hover:bg-red-50"
             >
                <LogOut size={14} />
                <span className="hidden sm:inline">Çıkış</span>
             </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-scroll p-4 sm:p-6 lg:p-8 print:p-0 print:overflow-visible custom-scrollbar relative z-0">
          <div className="max-w-7xl mx-auto w-full animate-[fadeIn_0.5s_cubic-bezier(0.16,1,0.3,1)] print:max-w-none pb-24">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
