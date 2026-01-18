
import React, { useState } from 'react';
import { Menu, X, Users, FileText, Truck, Box, Wallet, PieChart } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { id: 'customers', label: 'Cari Hesaplar', icon: Users },
    { id: 'products', label: 'Ürün & Stok', icon: Box },
    { id: 'invoice-sales', label: 'Satış Faturası', icon: FileText },
    { id: 'invoice-purchase', label: 'Alış Faturası', icon: Truck },
    { id: 'cash', label: 'Kasa İşlemleri', icon: Wallet },
    { id: 'report', label: 'Raporlar', icon: PieChart },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 flex flex-col no-print shadow-2xl
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-24 flex flex-col items-center justify-center px-6 border-b border-slate-800 bg-slate-950">
             <h1 className="text-2xl font-black tracking-widest text-white">TEKDEMİR</h1>
             <span className="text-[10px] text-primary tracking-[0.4em] uppercase font-bold mt-1">Koltuk & Mobilya</span>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute right-4 top-8 text-slate-400">
               <X size={24} />
             </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center px-4 py-3.5 text-sm font-medium transition-all rounded-xl group relative overflow-hidden
                ${activePage === item.id || (activePage === 'customer-detail' && item.id === 'customers')
                  ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon size={20} className={`mr-3 transition-colors ${
                  activePage === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'
              }`} />
              <span className="relative z-10">{item.label}</span>
              {activePage === item.id && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"></div>}
            </button>
          ))}
        </nav>
        
        <div className="p-6 text-xs text-slate-600 text-center font-medium border-t border-slate-800 bg-slate-950">
           <div className="opacity-50">Sürüm 14.2</div>
           <div className="mt-1 text-slate-500">Designed by tahaygt</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-10 no-print z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              <Menu size={24} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                {activePage === 'customer-detail' ? 'Cari Hesap Detayı' : navItems.find(n => n.id === activePage)?.label || 'Panel'}
                </h2>
                <p className="text-xs text-slate-400 font-medium hidden sm:block mt-0.5">
                    Yönetim Paneli & Finans Takibi
                </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                 <div className="text-sm font-bold text-slate-700">
                    {new Date().toLocaleDateString('tr-TR', { weekday: 'long' })}
                 </div>
                 <div className="text-xs text-slate-400">
                    {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                 </div>
             </div>
             <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 text-slate-500 font-bold">
                TD
             </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto bg-gray-50/50 p-4 sm:p-8 print:p-0 print:overflow-visible h-full w-full">
          <div className="max-w-7xl mx-auto w-full animate-[fadeIn_0.3s_ease-out]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
