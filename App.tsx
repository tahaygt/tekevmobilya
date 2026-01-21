
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Layout } from './components/Layout';
import { Customers } from './components/Customers';
import { CustomerDetail } from './components/CustomerDetail';
import { Products } from './components/Products';
import { InvoiceBuilder } from './components/InvoiceBuilder';
import { Cash } from './components/Cash';
import { DailyReport } from './components/DailyReport';
import { SuccessModal } from './components/SuccessModal';
import { Customer, Product, Safe, Transaction, TransactionItem, Page, PaymentMethod } from './types';
import { LogOut, AlertCircle, Lock, Mail, RefreshCw, Calculator, Store, ChevronRight, CheckCircle2 } from 'lucide-react';
import { api } from './api';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAIceJz9FEU9K8PYsQn7mQq3unoIynlJe0",
  authDomain: "tekevmobilya-32e6e.firebaseapp.com",
  projectId: "tekevmobilya-32e6e",
  storageBucket: "tekevmobilya-32e6e.firebasestorage.app",
  messagingSenderId: "302573707218",
  appId: "1:302573707218:web:937aa9e1e498444fab720b"
};

let auth: any;
try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization failed.", error);
}

// --- LOGIN SCREEN COMPONENT ---
const LoginScreen: React.FC<{ onPanelSelect: (panel: 'accounting' | 'store') => void, user: User | null }> = ({ onPanelSelect, user }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'auth' | 'select'>(user ? 'select' : 'auth');

    useEffect(() => {
        if (user) setStep('select');
        else setStep('auth');
    }, [user]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!auth) {
            setError("Firebase bağlantısı yapılamadı.");
            setLoading(false);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            setStep('select'); 
        } catch (err: any) {
            console.error(err);
            setError("Giriş yapılamadı: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (step === 'select') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
                <div className="w-full max-w-4xl animate-[fadeIn_0.5s_ease-out]">
                    <div className="text-center mb-12">
                         <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-widest mb-4">PANEL SEÇİMİ</h1>
                         <div className="h-1 w-24 bg-primary mx-auto rounded-full mb-4"></div>
                         <p className="text-slate-400 font-medium">Lütfen işlem yapmak istediğiniz departmanı seçiniz.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <button 
                            onClick={() => onPanelSelect('accounting')}
                            className="group relative bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 text-left"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="bg-primary/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                                    <Calculator size={40} />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">MUHASEBE</h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                    Toptan cari takibi, finansal raporlar, fatura yönetimi ve genel muhasebe işlemleri.
                                </p>
                                <div className="flex items-center text-primary font-bold tracking-wide text-sm group-hover:translate-x-2 transition-transform">
                                    GİRİŞ YAP <ChevronRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </button>

                        <button 
                            onClick={() => onPanelSelect('store')}
                            className="group relative bg-white/5 backdrop-blur-sm hover:bg-white/10 border border-white/10 rounded-3xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-500/20 text-left"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="bg-orange-500/20 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-orange-500 group-hover:scale-110 transition-transform duration-300 border border-orange-500/20">
                                    <Store size={40} />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">MAĞAZA</h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                    Perakende satış, şube yönetimi, stok takibi ve günlük mağaza raporları.
                                </p>
                                <div className="flex items-center text-orange-500 font-bold tracking-wide text-sm group-hover:translate-x-2 transition-transform">
                                    GİRİŞ YAP <ChevronRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="mt-12 text-center">
                         <button 
                            onClick={() => { if(auth) signOut(auth); }}
                            className="text-slate-500 hover:text-white text-sm flex items-center justify-center mx-auto gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
                         >
                            <LogOut size={16}/> Farklı bir hesaba geçiş yap
                         </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
             {/* Decorative Background Elements */}
             <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]"></div>
             <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]"></div>

             <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl p-10 relative z-10 border border-white/50">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black text-slate-900 tracking-wider mb-2">TEKDEMİR</h1>
                    <div className="h-1 w-16 bg-gradient-to-r from-primary to-blue-600 mx-auto rounded-full"></div>
                    <p className="text-slate-500 text-sm mt-3 font-medium uppercase tracking-widest">Yönetim Paneli v15</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">E-Posta Adresi</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                            <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-12 outline-none focus:ring-2 focus:ring-primary focus:bg-white text-sm font-medium transition-all" placeholder="ornek@tekdemir.com" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Güvenlik Şifresi</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                            <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 pl-12 outline-none focus:ring-2 focus:ring-primary focus:bg-white text-sm font-medium transition-all" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                    </div>
                    {error && (
                        <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-center">
                            <AlertCircle size={16} className="mr-2 shrink-0"/> {error}
                        </div>
                    )}
                    <button type="submit" disabled={loading} className="w-full py-4 rounded-xl text-white font-bold bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center">
                        {loading ? <RefreshCw className="animate-spin mr-2"/> : null}
                        {loading ? 'Giriş Yapılıyor...' : 'Panele Giriş Yap'}
                    </button>
                </form>
             </div>
        </div>
    );
};

// --- MAIN APP ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [panelMode, setPanelMode] = useState<'accounting' | 'store' | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // App Data State
  const [activePage, setActivePage] = useState<Page>('customers');
  const [selectedCustId, setSelectedCustId] = useState<number | null>(null);

  // Data States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [safes, setSafes] = useState<Safe[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Auth Listener
  useEffect(() => {
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) setPanelMode(null);
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    } else {
        setLoadingAuth(false);
    }
  }, []);

  // API Call helper to get current mode
  const getMode = () => panelMode || 'accounting';

  // --- FILTERED DATA MEMO ---
  const filteredTransactions = useMemo(() => {
    if (!panelMode) return [];
    return transactions.filter(t => {
      if (panelMode === 'store') return t.section === 'store';
      return t.section === 'accounting' || !t.section;
    });
  }, [transactions, panelMode]);

  const filteredCustomers = useMemo(() => {
    if (!panelMode) return [];
    return customers.filter(c => {
       if (panelMode === 'store') return c.section === 'store';
       return c.section === 'accounting' || !c.section;
    });
  }, [customers, panelMode]);


  const loadData = async (mode: 'accounting' | 'store') => {
      setLoadingData(true);
      try {
          const data = await api.fetchAll(mode);
          if (data) {
              setCustomers(data.customers || []);
              setProducts(data.products || []);
              setTransactions(data.transactions || []);
              if (!data.safes || data.safes.length === 0) {
                   const defaultSafes = [
                       { id: 1, name: 'Ana Kasa', balances: { TL: 0, USD: 0, EUR: 0 } },
                       { id: 2, name: 'Merkez Kasa', balances: { TL: 0, USD: 0, EUR: 0 } }
                   ];
                   setSafes(defaultSafes);
                   // Create defaults in the correct sheet
                   api.create('safes', defaultSafes[0], mode);
                   api.create('safes', defaultSafes[1], mode);
              } else {
                   setSafes(data.safes);
              }
          }
      } catch (err) {
          console.error("Veri çekme hatası:", err);
          alert("Veriler Google Sheets'ten çekilemedi.\nLütfen Google Script dağıtımının 'Herkes (Anyone)' erişimine açık olduğunu kontrol ediniz.");
      } finally {
          setLoadingData(false);
      }
  };

  const handlePanelSelect = (mode: 'accounting' | 'store') => {
      setPanelMode(mode);
      setActivePage(mode === 'store' ? 'invoice-sales' : 'customers'); 
      loadData(mode); 
  };

  const handleSwitchPanel = () => {
      setPanelMode(null);
      setCustomers([]);
      setProducts([]);
      setTransactions([]);
      setSafes([]);
  };

  // --- ACTIONS ---

  const addCustomer = async (data: Omit<Customer, 'id' | 'balances'>): Promise<Customer> => {
    const mode = getMode();
    const newCustomer: Customer = { 
        ...data, 
        id: Date.now(), 
        section: mode,
        balances: { TL: 0, USD: 0, EUR: 0 } 
    };
    setCustomers(prev => [...prev, newCustomer]);
    setSyncing(true);
    await api.create('customers', newCustomer, mode);
    setSyncing(false);
    return newCustomer;
  };

  const editCustomer = async (updated: Customer) => {
    const mode = getMode();
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSyncing(true);
    await api.update('customers', updated, mode);
    setSyncing(false);
  };

  const deleteCustomer = async (id: number) => {
    const mode = getMode();
    setCustomers(prev => prev.filter(c => c.id !== id));
    setSyncing(true);
    await api.delete('customers', id, mode);
    setSyncing(false);
  };
  
  const addProduct = async (data: Omit<Product, 'id'>) => {
      const mode = getMode();
      const newProd = { ...data, id: Date.now() };
      setProducts(prev => [...prev, newProd]);
      setSyncing(true);
      await api.create('products', newProd, mode);
      setSyncing(false);
  };

  const editProduct = async (updated: Product) => {
      const mode = getMode();
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      setSyncing(true);
      await api.update('products', updated, mode);
      setSyncing(false);
  };

  const deleteProduct = async (id: number) => {
      const mode = getMode();
      setProducts(prev => prev.filter(p => p.id !== id));
      setSyncing(true);
      await api.delete('products', id, mode);
      setSyncing(false);
  };
  
  const addSafe = async (name: string) => {
      const mode = getMode();
      const newSafe = { id: Date.now(), name, balances: { TL: 0, USD: 0, EUR: 0 } };
      setSafes(prev => [...prev, newSafe]);
      setSyncing(true);
      await api.create('safes', newSafe, mode);
      setSyncing(false);
  };

  const editSafe = async (updated: Safe) => {
      const mode = getMode();
      setSafes(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSyncing(true);
      await api.update('safes', updated, mode);
      setSyncing(false);
  };

  const deleteSafe = async (id: number) => {
      const mode = getMode();
      setSafes(prev => prev.filter(s => s.id !== id));
      setSyncing(true);
      await api.delete('safes', id, mode);
      setSyncing(false);
  };

  const processInvoice = async (customerId: number, date: string, items: TransactionItem[], currency: 'TL' | 'USD' | 'EUR', desc: string, retailDetails?: any, fileData?: { name: string, type: string, base64: string }) => {
    const mode = getMode();
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const type = activePage === 'invoice-sales' ? 'sales' : 'purchase';
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) return;

    // Transaction ID oluştur
    const newId = Date.now();

    const newTrans: Transaction = {
      id: newId,
      date, 
      type, 
      accId: customerId, 
      accName: customer.name, 
      currency, 
      total, 
      items,
      desc,
      section: mode,
      ...(retailDetails || {})
    };

    setSyncing(true);
    
    // Optimistic Update (Dosya yüklemesi sürerken arayüzde gösterelim)
    setTransactions(prev => [...prev, newTrans]);
    
    const currentBal = customer.balances[currency] || 0;
    const newBal = type === 'sales' ? currentBal + total : currentBal - total;
    const updatedCustomer = { ...customer, balances: { ...customer.balances, [currency]: newBal } };
    
    setCustomers(prev => prev.map(c => c.id === customerId ? updatedCustomer : c));

    // API Calls
    // Eğer dosya varsa, payload içine fileData ekliyoruz. Backend bunu algılayıp Drive'a atacak.
    const transactionPayload = fileData 
        ? { ...newTrans, fileData: { fileName: fileData.name, mimeType: fileData.type, fileData: fileData.base64 } } 
        : newTrans;

    await api.create('transactions', transactionPayload, mode);
    await api.update('customers', updatedCustomer, mode);

    setSyncing(false);
    setActivePage('customers');
    setSuccessMessage('Fatura başarıyla kaydedildi.');
  };

  const processPayment = async (amount: number, type: 'in' | 'out', safeId: number, currency: 'TL'|'USD'|'EUR', method: PaymentMethod, desc: string, date: string, linkedTransactionId?: number) => {
     const mode = getMode();
     if (!selectedCustId) return;
     const customer = customers.find(c => c.id === selectedCustId);
     const safe = safes.find(s => s.id === safeId);
     
     if (!customer || !safe) return;

     const transType = type === 'in' ? 'cash_in' : 'cash_out';

     const newTrans: Transaction = {
         id: Date.now(),
         date: date,
         type: transType,
         accId: customer.id,
         accName: customer.name,
         safeId: safe.id,
         currency,
         total: amount,
         desc,
         method,
         section: mode,
         linkedTransactionId
     };

     setSyncing(true);

     setTransactions(prev => [...prev, newTrans]);
     
     const curCustBal = customer.balances[currency] || 0;
     const newCustBal = type === 'in' ? curCustBal - amount : curCustBal + amount;
     const updatedCustomer = { ...customer, balances: { ...customer.balances, [currency]: newCustBal } };
     setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));

     const curSafeBal = safe.balances[currency] || 0;
     const newSafeBal = type === 'in' ? curSafeBal + amount : curSafeBal - amount;
     const updatedSafe = { ...safe, balances: { ...safe.balances, [currency]: newSafeBal } };
     setSafes(prev => prev.map(s => s.id === safe.id ? updatedSafe : s));

     // API Calls
     await api.create('transactions', newTrans, mode);
     await api.update('customers', updatedCustomer, mode);
     await api.update('safes', updatedSafe, mode);

     setSyncing(false);
     setSuccessMessage('Ödeme işlemi başarıyla kaydedildi.');
  };

  const deleteTransaction = async (id: number) => {
      const mode = getMode();
      const trans = transactions.find(t => t.id === id);
      if(!trans) return;

      if(!window.confirm("Bu işlemi silmek istediğinize emin misiniz? Bakiyeler geri alınacak.")) return;

      const currency = trans.currency;
      setSyncing(true);

      // 1. Revert Customer Balance
      if(trans.accId) {
          const customer = customers.find(c => c.id === trans.accId);
          if(customer) {
              let balanceChange = 0;
              if (trans.type === 'sales') balanceChange = -trans.total;
              else if (trans.type === 'purchase') balanceChange = trans.total;
              else if (trans.type === 'cash_in') balanceChange = trans.total; 
              else if (trans.type === 'cash_out') balanceChange = -trans.total; 
              
              const updatedCustomer = { ...customer, balances: { ...customer.balances, [currency]: (customer.balances[currency]||0) + balanceChange } };
              setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
              api.update('customers', updatedCustomer, mode);
          }
      }

      // 2. Revert Safe Balance
      if(trans.safeId && (trans.type === 'cash_in' || trans.type === 'cash_out')) {
           const safe = safes.find(s => s.id === trans.safeId);
           if(safe) {
               const amount = trans.total;
               const isRevertIn = trans.type === 'cash_in'; 
               const currentBal = safe.balances[currency];
               const newBal = isRevertIn ? currentBal - amount : currentBal + amount;
               const updatedSafe = { ...safe, balances: { ...safe.balances, [currency]: newBal } };
               setSafes(prev => prev.map(s => s.id === safe.id ? updatedSafe : s));
               api.update('safes', updatedSafe, mode);
           }
      }

      setTransactions(prev => prev.filter(t => t.id !== id));
      await api.delete('transactions', id, mode);
      setSyncing(false);
  };

  const handleEditTransaction = async (newTrans: Transaction) => {
      const mode = getMode();
      const oldTrans = transactions.find(t => t.id === newTrans.id);
      if (!oldTrans) return;
      setSyncing(true);
      setTransactions(prev => prev.map(t => t.id === newTrans.id ? newTrans : t));
      await api.update('transactions', newTrans, mode);
      setSyncing(false);
  };

  const handleCustomerSelect = (id: number) => {
    setSelectedCustId(id);
    setActivePage('customer-detail');
  };
  
  const handleLogout = () => {
      if (auth) signOut(auth);
  };

  if (loadingAuth || loadingData) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
             {/* Gradient Background Animation */}
             <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0"></div>
             
             {/* Decorative Elements */}
             <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] animate-pulse z-0"></div>
             <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] animate-pulse delay-700 z-0"></div>

             <div className="relative z-10 flex flex-col items-center">
                 {/* Logo / Spinner Container */}
                 <div className="relative mb-8">
                     <div className="w-24 h-24 rounded-full border-4 border-slate-700/50 border-t-primary animate-spin"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-700">
                             <Calculator size={32} className="text-primary animate-pulse" />
                         </div>
                     </div>
                 </div>
                 
                 <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                    {loadingData ? 'Veriler Eşitleniyor...' : 'Sistem Başlatılıyor...'}
                 </h2>
                 <p className="text-slate-400 text-sm font-medium animate-pulse">
                    Lütfen bekleyiniz, güvenli bağlantı kuruluyor.
                 </p>
             </div>
        </div>
      );
  }

  if (!user || !panelMode) {
      return <LoginScreen onPanelSelect={handlePanelSelect} user={user} />;
  }

  return (
    <div className="relative">
        <SuccessModal 
            isOpen={!!successMessage} 
            message={successMessage || ''} 
            onClose={() => setSuccessMessage(null)} 
        />
        
        {syncing && (
            <div className="fixed top-6 right-6 z-[60] bg-white/90 backdrop-blur shadow-2xl rounded-full px-4 py-2 flex items-center gap-3 text-xs font-bold text-slate-700 animate-in fade-in slide-in-from-top-4 border border-slate-200/50">
                <RefreshCw size={14} className="animate-spin text-primary" /> 
                <span>Buluta Kaydediliyor...</span>
            </div>
        )}
        
        <Layout 
            activePage={activePage} 
            onNavigate={setActivePage} 
            panelMode={panelMode} 
            onSwitchPanel={handleSwitchPanel}
            onLogout={handleLogout}
        >
        {
            activePage === 'customers' ? <Customers customers={customers} onAddCustomer={addCustomer} onEditCustomer={editCustomer} onDeleteCustomer={deleteCustomer} onSelectCustomer={handleCustomerSelect} panelMode={panelMode} /> :
            activePage === 'customer-detail' ? <CustomerDetail customer={customers.find(c => c.id === selectedCustId)!} transactions={filteredTransactions} safes={safes} onBack={() => setActivePage('customers')} onPayment={processPayment} onDeleteTransaction={deleteTransaction} onEditTransaction={handleEditTransaction} /> :
            activePage === 'products' ? <Products products={products} onAddProduct={addProduct} onEditProduct={editProduct} onDeleteProduct={deleteProduct} /> :
            (activePage === 'invoice-sales' || activePage === 'invoice-purchase') ? <InvoiceBuilder type={activePage === 'invoice-sales' ? 'sales' : 'purchase'} customers={filteredCustomers} products={products} onSave={processInvoice} transactions={filteredTransactions} panelMode={panelMode} onAddCustomer={addCustomer} /> :
            activePage === 'cash' ? <Cash safes={safes} transactions={filteredTransactions} onAddSafe={addSafe} onEditSafe={editSafe} onDeleteSafe={deleteSafe} /> :
            <DailyReport transactions={filteredTransactions} customers={customers} panelMode={panelMode} />
        }
        </Layout>
    </div>
  );
};

export default App;
