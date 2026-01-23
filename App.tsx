
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
// Firebase Storage referansı kaldırıldı
import { Layout } from './components/Layout';
import { Customers } from './components/Customers';
import { CustomerDetail } from './components/CustomerDetail';
import { Products } from './components/Products';
import { InvoiceBuilder } from './components/InvoiceBuilder';
import { Cash } from './components/Cash';
import { DailyReport } from './components/DailyReport';
import { SuccessModal } from './components/SuccessModal';
import { Customer, Product, Safe, Transaction, TransactionItem, Page, PaymentMethod } from './types';
import { LogOut, AlertCircle, Lock, Mail, RefreshCw, Calculator, Store, ChevronRight, CheckCircle2, ShieldCheck, PlayCircle } from 'lucide-react';
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
    }, [user]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!auth) {
            setError("Firebase bağlantı hatası.");
            setLoading(false);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            setStep('select'); 
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError("E-posta veya şifre hatalı.");
            } else if (err.code === 'auth/too-many-requests') {
                setError("Çok fazla başarısız deneme. Lütfen bekleyin.");
            } else {
                setError("Giriş yapılamadı: " + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (step === 'select') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden font-sans">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2301&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-900/80"></div>
                
                <div className="w-full max-w-5xl animate-[fadeIn_0.6s_cubic-bezier(0.22,1,0.36,1)] relative z-10">
                    <div className="text-center mb-16 space-y-4">
                         <div className="inline-flex items-center justify-center p-2 bg-slate-800/50 backdrop-blur-md rounded-full border border-slate-700/50 mb-4">
                            <span className="px-4 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck size={14} /> Güvenli Oturum Açıldı
                            </span>
                         </div>
                         <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight">
                            Hoş Geldiniz
                         </h1>
                         <p className="text-slate-400 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                            Tekdemir Mobilya Yönetim Sistemi'ne erişim sağlandı. İşlem yapmak istediğiniz departmanı seçerek devam edebilirsiniz.
                         </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                        {/* Accounting Card */}
                        <button 
                            onClick={() => onPanelSelect('accounting')}
                            className="group relative bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 text-left transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(14,165,233,0.3)] overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/30 transition-colors"></div>
                            
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mb-8 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-500">
                                    <Calculator size={32} className="text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-3">Muhasebe & Finans</h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-8 h-12">
                                    Cari hesap yönetimi, faturalandırma, kasa takibi ve detaylı finansal raporlamalar.
                                </p>
                                <div className="flex items-center text-primary font-bold tracking-wide text-sm group-hover:translate-x-2 transition-transform">
                                    PANELİ AÇ <ChevronRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </button>

                        {/* Store Card */}
                        <button 
                            onClick={() => onPanelSelect('store')}
                            className="group relative bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-[2rem] p-10 text-left transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(249,115,22,0.3)] overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/30 transition-colors"></div>
                            
                            <div className="relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mb-8 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-500">
                                    <Store size={32} className="text-white" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-3">Mağaza Yönetimi</h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-8 h-12">
                                    Perakende satış işlemleri, şube stok kontrolü, ürün takibi ve günlük satış raporları.
                                </p>
                                <div className="flex items-center text-orange-500 font-bold tracking-wide text-sm group-hover:translate-x-2 transition-transform">
                                    PANELİ AÇ <ChevronRight size={18} className="ml-2" />
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="mt-16 text-center">
                         <button 
                            onClick={() => { if(auth) signOut(auth); else window.location.reload(); }}
                            className="group text-slate-500 hover:text-white text-sm font-medium inline-flex items-center gap-2 transition-all px-6 py-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10"
                         >
                            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform"/> 
                            {user ? 'Güvenli Çıkış Yap' : 'Giriş Ekranına Dön'}
                         </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
             {/* Dynamic Background */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
             <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>

             <div className="bg-white/5 backdrop-blur-2xl w-full max-w-[420px] rounded-[2rem] shadow-2xl p-8 sm:p-12 relative z-10 border border-white/10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-white/10 mb-6 shadow-xl">
                        <span className="text-2xl font-black text-white">T</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">TEKDEMİR</h1>
                    <p className="text-slate-400 text-sm font-medium tracking-wide">Mobilya Yönetim Sistemi v15</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">E-Posta</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                            </div>
                            <input 
                                type="email" 
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm font-medium" 
                                placeholder="E-posta adresiniz" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Şifre</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                            </div>
                            <input 
                                type="password" 
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-slate-600 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm font-medium" 
                                placeholder="••••••••" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl flex items-start gap-3 animate-[fadeIn_0.3s_ease-out]">
                            <AlertCircle size={16} className="shrink-0 mt-0.5"/> 
                            <div className="flex-1">
                                <p className="font-bold mb-1">Hata Oluştu</p>
                                <p className="opacity-90">{error}</p>
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="w-full py-4 rounded-xl text-white font-bold bg-gradient-to-r from-primary to-blue-600 hover:from-sky-400 hover:to-blue-500 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center"
                    >
                        {loading ? <RefreshCw className="animate-spin mr-2" size={18}/> : null}
                        {loading ? 'Giriş Yapılıyor...' : 'Panele Giriş Yap'}
                    </button>
                </form>
             </div>
             
             <div className="absolute bottom-6 text-center w-full">
                <p className="text-slate-600 text-xs font-medium">© 2024 Tekdemir Yazılım. Tüm hakları saklıdır.</p>
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
    return (transactions || []).filter(t => {
      if (panelMode === 'store') return t.section === 'store';
      return t.section === 'accounting' || !t.section;
    });
  }, [transactions, panelMode]);

  const filteredCustomers = useMemo(() => {
    if (!panelMode) return [];
    return (customers || []).filter(c => {
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
          alert("Veriler sunucudan çekilemedi. İnternet bağlantınızı kontrol ediniz.");
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
    
    // Optimistic
    setCustomers(prev => [...prev, newCustomer]);
    
    try {
        setSyncing(true);
        await api.create('customers', newCustomer, mode);
    } catch(e) {
        console.error(e);
        alert("Kayıt sırasında hata oluştu.");
    } finally {
        setSyncing(false);
    }
    
    return newCustomer;
  };

  const editCustomer = async (updated: Customer) => {
    const mode = getMode();
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    try {
        setSyncing(true);
        await api.update('customers', updated, mode);
    } finally {
        setSyncing(false);
    }
  };

  const deleteCustomer = async (id: number) => {
    const mode = getMode();
    setCustomers(prev => prev.filter(c => c.id !== id));
    try {
        setSyncing(true);
        await api.delete('customers', id, mode);
    } finally {
        setSyncing(false);
    }
  };
  
  const addProduct = async (data: Omit<Product, 'id'>) => {
      const mode = getMode();
      const newProd = { ...data, id: Date.now() };
      setProducts(prev => [...prev, newProd]);
      try {
        setSyncing(true);
        await api.create('products', newProd, mode);
      } finally {
        setSyncing(false);
      }
  };

  const editProduct = async (updated: Product) => {
      const mode = getMode();
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      try {
        setSyncing(true);
        await api.update('products', updated, mode);
      } finally {
        setSyncing(false);
      }
  };

  const deleteProduct = async (id: number) => {
      const mode = getMode();
      setProducts(prev => prev.filter(p => p.id !== id));
      try {
        setSyncing(true);
        await api.delete('products', id, mode);
      } finally {
        setSyncing(false);
      }
  };
  
  const addSafe = async (name: string) => {
      const mode = getMode();
      const newSafe = { id: Date.now(), name, balances: { TL: 0, USD: 0, EUR: 0 } };
      setSafes(prev => [...prev, newSafe]);
      try {
        setSyncing(true);
        await api.create('safes', newSafe, mode);
      } finally {
        setSyncing(false);
      }
  };

  const editSafe = async (updated: Safe) => {
      const mode = getMode();
      setSafes(prev => prev.map(s => s.id === updated.id ? updated : s));
      try {
        setSyncing(true);
        await api.update('safes', updated, mode);
      } finally {
        setSyncing(false);
      }
  };

  const deleteSafe = async (id: number) => {
      const mode = getMode();
      setSafes(prev => prev.filter(s => s.id !== id));
      try {
        setSyncing(true);
        await api.delete('safes', id, mode);
      } finally {
        setSyncing(false);
      }
  };

  const processInvoice = async (customerId: number, date: string, items: TransactionItem[], currency: 'TL' | 'USD' | 'EUR', desc: string, retailDetails?: any, fileData?: { name: string, type: string, base64: string }) => {
    const mode = getMode();
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const type = activePage === 'invoice-sales' ? 'sales' : 'purchase';
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) return;

    setSyncing(true);

    const newId = Date.now();
    const baseTrans: Transaction = {
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
      ...(retailDetails || {}), 
      deliveryNoteUrl: "" 
    };

    const transactionPayload = {
        ...baseTrans,
        fileData: fileData ? {
            fileName: `fatura_${newId}.jpg`, 
            mimeType: fileData.type,
            fileData: fileData.base64 
        } : null
    };

    setTransactions(prev => [...prev, {
        ...baseTrans,
        deliveryNoteUrl: fileData ? `data:${fileData.type};base64,${fileData.base64}` : undefined
    }]);
    
    const currentBal = customer.balances[currency] || 0;
    const newBal = type === 'sales' ? currentBal + total : currentBal - total;
    const updatedCustomer = { ...customer, balances: { ...customer.balances, [currency]: newBal } };
    
    setCustomers(prev => prev.map(c => c.id === customerId ? updatedCustomer : c));

    try {
        await api.create('transactions', transactionPayload, mode);
        await api.update('customers', updatedCustomer, mode);
        setSuccessMessage('Fatura ve dosya başarıyla kaydedildi.');
        setActivePage('customers');
    } catch (error) {
        console.error("Fatura kaydetme hatası:", error);
        alert("Fatura sunucuya kaydedilirken bir hata oluştu.");
    } finally {
        setSyncing(false);
    }
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

     try {
        await api.create('transactions', newTrans, mode);
        await api.update('customers', updatedCustomer, mode);
        await api.update('safes', updatedSafe, mode);
        setSuccessMessage('Ödeme işlemi başarıyla kaydedildi.');
     } catch (e) {
         alert("Ödeme kaydedilirken hata oluştu.");
     } finally {
        setSyncing(false);
     }
  };

  const deleteTransaction = async (id: number) => {
      const mode = getMode();
      
      // Find the transaction BEFORE deleting it from state to handle balances
      const trans = transactions.find(t => t.id === id);
      
      // OPTIMISTIC UPDATE: Remove from state immediately
      // This ensures DailyReport and other views update instantly
      setTransactions(prev => prev.filter(t => t.id !== id));

      if (trans) {
          const currency = trans.currency;
          setSyncing(true);

          // Update Customer Balance
          if(trans.accId) {
              const customer = customers.find(c => c.id === trans.accId);
              if(customer) {
                  let balanceChange = 0;
                  // If we delete a transaction, we reverse its effect on balance
                  if (trans.type === 'sales') balanceChange = -trans.total; // Delete Sales -> Decrease Debt
                  else if (trans.type === 'purchase') balanceChange = trans.total; // Delete Purchase -> Increase Debt (reduce credit)
                  else if (trans.type === 'cash_in') balanceChange = trans.total; // Delete Cash In -> Increase Debt
                  else if (trans.type === 'cash_out') balanceChange = -trans.total; // Delete Cash Out -> Decrease Debt
                  
                  const updatedCustomer = { 
                      ...customer, 
                      balances: { 
                          ...customer.balances, 
                          [currency]: (customer.balances[currency] || 0) + balanceChange 
                      } 
                  };
                  
                  setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
                  // Fire and forget API update for customer
                  api.update('customers', updatedCustomer, mode);
              }
          }

          // Update Safe Balance
          if(trans.safeId && (trans.type === 'cash_in' || trans.type === 'cash_out')) {
               const safe = safes.find(s => s.id === trans.safeId);
               if(safe) {
                   const amount = trans.total;
                   const isRevertIn = trans.type === 'cash_in'; 
                   const currentBal = safe.balances[currency];
                   const newBal = isRevertIn ? currentBal - amount : currentBal + amount;
                   const updatedSafe = { ...safe, balances: { ...safe.balances, [currency]: newBal } };
                   
                   setSafes(prev => prev.map(s => s.id === safe.id ? updatedSafe : s));
                   // Fire and forget API update for safe
                   api.update('safes', updatedSafe, mode);
               }
          }
      }

      try {
        await api.delete('transactions', id, mode);
      } catch(e) {
        console.error("Delete failed on server", e);
        // In a real app, you might want to revert state here or show an error
      } finally {
        setSyncing(false);
      }
  };

  const handleEditTransaction = async (newTrans: Transaction) => {
      const mode = getMode();
      const oldTrans = (transactions || []).find(t => t.id === newTrans.id);
      if (!oldTrans) return;

      setSyncing(true);

      // 1. REVERT OLD TRANSACTION EFFECT
      // ---------------------------------
      if (oldTrans.accId) {
          const customer = customers.find(c => c.id === oldTrans.accId);
          if (customer) {
              let balanceChange = 0;
              // İşlem silinmiş gibi bakiyeyi ters çevir
              if (oldTrans.type === 'sales') balanceChange = -oldTrans.total;
              else if (oldTrans.type === 'purchase') balanceChange = oldTrans.total;
              else if (oldTrans.type === 'cash_in') balanceChange = oldTrans.total; // Tahsilat silinirse borç artar (+)
              else if (oldTrans.type === 'cash_out') balanceChange = -oldTrans.total; // Ödeme silinirse borç azalır (-)

              customer.balances[oldTrans.currency] = (customer.balances[oldTrans.currency] || 0) + balanceChange;
          }
      }

      if (oldTrans.safeId && (oldTrans.type === 'cash_in' || oldTrans.type === 'cash_out')) {
          const safe = safes.find(s => s.id === oldTrans.safeId);
          if (safe) {
              const amount = oldTrans.total;
              // Kasa hareketini ters çevir
              const isRevertIn = oldTrans.type === 'cash_in';
              const newBal = isRevertIn ? (safe.balances[oldTrans.currency] - amount) : (safe.balances[oldTrans.currency] + amount);
              safe.balances[oldTrans.currency] = newBal;
          }
      }

      // 2. APPLY NEW TRANSACTION EFFECT
      // ---------------------------------
      if (newTrans.accId) {
          const customer = customers.find(c => c.id === newTrans.accId); // Same customer obj ref (updated above)
          if (customer) {
              let balanceChange = 0;
              if (newTrans.type === 'sales') balanceChange = newTrans.total; // Satış -> Borç Artar
              else if (newTrans.type === 'purchase') balanceChange = -newTrans.total; // Alış -> Alacak Artar (Borç Azalır)
              else if (newTrans.type === 'cash_in') balanceChange = -newTrans.total; // Tahsilat -> Borç Azalır
              else if (newTrans.type === 'cash_out') balanceChange = newTrans.total; // Ödeme -> Borç Artar (veya Alacak Azalır)

              customer.balances[newTrans.currency] = (customer.balances[newTrans.currency] || 0) + balanceChange;
              
              // Update Customer State & API
              setCustomers(prev => [...prev]); // Trigger re-render with mutated objects
              await api.update('customers', customer, mode);
          }
      }

      if (newTrans.safeId && (newTrans.type === 'cash_in' || newTrans.type === 'cash_out')) {
          const safe = safes.find(s => s.id === newTrans.safeId);
          if (safe) {
              const amount = newTrans.total;
              const isNewIn = newTrans.type === 'cash_in';
              const newBal = isNewIn ? (safe.balances[newTrans.currency] + amount) : (safe.balances[newTrans.currency] - amount);
              safe.balances[newTrans.currency] = newBal;

              // Update Safe State & API
              setSafes(prev => [...prev]);
              await api.update('safes', safe, mode);
          }
      }

      // 3. UPDATE TRANSACTION
      setTransactions(prev => prev.map(t => t.id === newTrans.id ? newTrans : t));
      
      try {
        await api.update('transactions', newTrans, mode);
        setSuccessMessage('İşlem başarıyla güncellendi.');
      } catch(e) {
        alert("Güncelleme sırasında hata oluştu.");
      } finally {
        setSyncing(false);
      }
  };

  const handleCustomerSelect = (id: number) => {
    setSelectedCustId(id);
    setActivePage('customer-detail');
  };
  
  const handleLogout = () => {
      if (auth) signOut(auth);
      setUser(null);
  };

  if (loadingAuth || loadingData) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white relative overflow-hidden font-sans">
             <div className="relative mb-8">
                 <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-700 animate-pulse">
                     <Calculator size={32} className="text-white" />
                 </div>
             </div>
             <h2 className="text-xl font-bold tracking-tight text-white mb-2">
                {loadingData ? 'Veriler Eşitleniyor...' : 'Yükleniyor...'}
             </h2>
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
            activePage === 'customers' ? <Customers customers={customers} transactions={filteredTransactions} onAddCustomer={addCustomer} onEditCustomer={editCustomer} onDeleteCustomer={deleteCustomer} onSelectCustomer={handleCustomerSelect} panelMode={panelMode} /> :
            activePage === 'customer-detail' ? <CustomerDetail 
                customer={customers.find(c => c.id === selectedCustId)!} 
                allCustomers={customers} 
                transactions={filteredTransactions} 
                safes={safes} 
                onBack={() => setActivePage('customers')} 
                onPayment={processPayment} 
                onDeleteTransaction={deleteTransaction} 
                onEditTransaction={handleEditTransaction}
                onSelectCustomer={handleCustomerSelect} 
                onAddCustomer={addCustomer} 
                onDeleteCustomer={deleteCustomer} 
                onEditCustomer={editCustomer}
                panelMode={panelMode}
            /> :
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
