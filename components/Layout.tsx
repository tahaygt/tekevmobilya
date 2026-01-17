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
    { id: 'customers', label: 'Müşteri & Tedarikçi', icon: Users },
    { id: 'invoice-sales', label: 'Satış Faturası', icon: FileText },
    { id: 'invoice-purchase', label: 'Alış Faturası', icon: Truck },
    { id: 'products', label: 'Ürün & Stok', icon: Box },
    { id: 'cash', label: 'Kasa', icon: Wallet },
    { id: 'report', label: 'Raporlar', icon: PieChart },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-sidebar text-white transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 flex flex-col no-print border-r border-slate-800
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-20 flex items-center justify-center px-6 bg-slate-950 shadow-lg border-b border-slate-800">
          <div className="text-center">
             <h1 className="text-xl font-bold tracking-widest text-white">TEKEV</h1>
             <span className="text-xs text-slate-400 tracking-[0.3em] uppercase">Mobilya</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden absolute right-4 text-slate-400">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onNavigate(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center px-4 py-3.5 text-sm font-medium transition-all rounded-lg group
                    ${activePage === item.id || (activePage === 'customer-detail' && item.id === 'customers')
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-slate-400 hover:bg-active hover:text-white'}
                  `}
                >
                  <item.icon size={20} className={`mr-3 ${activePage === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-6 text-xs text-slate-600 text-center font-medium">
           v14.5.0 &copy; 2024
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 no-print shadow-sm z-10">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden mr-4 text-slate-500 hover:text-slate-800"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {activePage === 'customer-detail' ? 'Cari Detay' : navItems.find(n => n.id === activePage)?.label || 'Panel'}
            </h2>
          </div>
          <div className="text-sm text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 print:p-0 print:overflow-visible h-full w-full">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};