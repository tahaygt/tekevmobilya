
import React, { useState } from 'react';
import { Menu, X, Users, FileText, Truck, Box, Wallet, PieChart, Store, LogOut, ChevronRight } from 'lucide-react';

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
    { id: 'report', label: 'Raporlar', icon: PieChart },
  ] : [
    { id: 'invoice-sales', label: 'Perakende Satış', icon: Store },
    { id: 'customers', label: 'Şubeler & Cariler', icon: Users },
    { id: 'products', label: 'Ürün & Stok', icon: Box },
    { id: 'report', label: 'Satış Raporları', icon: PieChart },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] print:h-auto print:overflow-visible font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Modern Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-out shadow-2xl
          md:relative md:translate-x-0 flex flex-col no-print
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Area */}
        <div className="h-28 flex flex-col items-center justify-center relative border-b border-slate-800/50 bg-gradient-to-b from-slate-900 to-slate-900">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-400 to-purple-500"></div>
             <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                TEKDEMİR
             </h1>
             <div className={`mt-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase border border-white/10 shadow-inner
                ${panelMode === 'store' ? 'bg-orange-500/10 text-orange-400' : 'bg-primary/10 text-primary'}
             `}>
                {panelMode === 'store' ? 'MAĞAZA YÖNETİMİ' : 'MUHASEBE & FİNANS'}
             </div>
             
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute right-4 top-8 text-slate-400 hover:text-white">
               <X size={24} />
             </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
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
                  w-full flex items-center px-4 py-3.5 text-sm font-medium transition-all duration-200 rounded-xl group relative overflow-hidden
                  ${isActive 
                    ? (panelMode === 'store' ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-900/20' : 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-blue-900/20')
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}
                `}
              >
                <item.icon size={20} className={`mr-3 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="relative z-10 flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight size={16} className="text-white/70" />}
              </button>
            );
          })}
        </nav>
        
        {/* Bottom Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800/50 space-y-3">
            <button 
                onClick={onSwitchPanel}
                className="w-full py-3 px-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition-all border border-slate-700/50 hover:border-slate-600 flex items-center justify-center font-bold tracking-wide group"
            >
                <Store size={14} className="mr-2 group-hover:text-primary transition-colors" /> PANELE DÖN
            </button>
            <div className="text-[10px] text-slate-600 text-center font-medium pt-2">
               v15.0 &bull; Tekdemir Yazılım
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print:h-auto print:overflow-visible bg-[#f8fafc]">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 sm:px-8 no-print z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <Menu size={24} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center">
                    {activePage === 'customer-detail' ? 'Hesap Detayı' : navItems.find(n => n.id === activePage)?.label || 'Panel'}
                </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="text-right hidden sm:block">
                 <div className="text-sm font-bold text-slate-700">
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long' })}
                 </div>
                 <div className="text-xs text-slate-400 font-medium">
                    {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                 </div>
             </div>
             
             <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

             <button 
                onClick={onLogout}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all shadow-sm hover:shadow-md group
                   ${panelMode === 'store' 
                     ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100' 
                     : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100'}
                `}
                title="Güvenli Çıkış"
             >
                <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden sm:inline">Çıkış</span>
             </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 print:p-0 print:overflow-visible custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full animate-[fadeIn_0.4s_cubic-bezier(0.16,1,0.3,1)] print:max-w-none pb-20">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
