
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Layout } from './components/Layout';
import { Customers } from './components/Customers';
import { CustomerDetail } from './components/CustomerDetail';
import { Products } from './components/Products';
import { InvoiceBuilder } from './components/InvoiceBuilder';
import { Cash } from './components/Cash';
import { DailyReport } from './components/DailyReport';
import { Customer, Product, Safe, Transaction, TransactionItem, Page, PaymentMethod } from './types';
import { LogOut, AlertCircle, Lock, Mail, RefreshCw, Database } from 'lucide-react';
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
const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
        } catch (err: any) {
            console.error(err);
            setError("Giriş yapılamadı: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-blue-600"></div>
                <div className="text-center mb-8 pt-4">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-widest">TEKDEMİR</h1>
                    <span className="text-xs text-slate-500 tracking-[0.4em] uppercase font-medium">Koltuk Yönetim</span>
                </div>
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Kullanıcı Adı</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-primary focus:bg-white text-sm" placeholder="E-Posta" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Şifre</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-primary focus:bg-white text-sm" placeholder="******" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                    </div>
                    {error && <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg border border-red-100"><AlertCircle size={16}/><span>{error}</span></div>}
                    <button type="submit" disabled={loading} className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex justify-center items-center bg-slate-900 hover:bg-slate-800 ${loading ? 'opacity-70' : ''}`}>
                        {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>
             </div>
        </div>
    );
};

// --- MAIN APP ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [syncing, setSyncing] = useState(false);

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
            setLoadingAuth(false);
            if (currentUser) {
                loadData();
            }
        });
        return () => unsubscribe();
    } else {
        setLoadingAuth(false);
    }
  }, []);

  // --- DATA LOADING ---
  const loadData = async () => {
      setLoadingData(true);
      try {
          const data = await api.fetchAll();
          if (data) {
              setCustomers(data.customers || []);
              setProducts(data.products || []);
              setTransactions(data.transactions || []);
              // Kasalar boş gelirse default ata
              if (!data.safes || data.safes.length === 0) {
                   const defaultSafes = [
                       { id: 1, name: 'Ana Kasa', balances: { TL: 0, USD: 0, EUR: 0 } },
                       { id: 2, name: 'Merkez Kasa', balances: { TL: 0, USD: 0, EUR: 0 } }
                   ];
                   setSafes(defaultSafes);
                   // İlk seferde bunları cloud'a da yazalım
                   api.create('safes', defaultSafes[0]);
                   api.create('safes', defaultSafes[1]);
              } else {
                   setSafes(data.safes);
              }
          }
      } catch (err) {
          console.error("Veri çekme hatası:", err);
          alert("Veriler Google Sheets'ten çekilemedi. Bağlantınızı veya API URL'ini kontrol edin.");
      } finally {
          setLoadingData(false);
      }
  };

  // --- ACTIONS (Optimistic Updates + API Calls) ---

  const addCustomer = async (data: Omit<Customer, 'id' | 'balances'>) => {
    const newCustomer: Customer = { ...data, id: Date.now(), balances: { TL: 0, USD: 0, EUR: 0 } };
    setCustomers(prev => [...prev, newCustomer]);
    setSyncing(true);
    await api.create('customers', newCustomer);
    setSyncing(false);
  };

  const editCustomer = async (updated: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSyncing(true);
    await api.update('customers', updated);
    setSyncing(false);
  };

  const deleteCustomer = async (id: number) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setSyncing(true);
    await api.delete('customers', id);
    setSyncing(false);
  };
  
  const addProduct = async (data: Omit<Product, 'id'>) => {
      const newProd = { ...data, id: Date.now() };
      setProducts(prev => [...prev, newProd]);
      setSyncing(true);
      await api.create('products', newProd);
      setSyncing(false);
  };

  const editProduct = async (updated: Product) => {
      setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
      setSyncing(true);
      await api.update('products', updated);
      setSyncing(false);
  };

  const deleteProduct = async (id: number) => {
      setProducts(prev => prev.filter(p => p.id !== id));
      setSyncing(true);
      await api.delete('products', id);
      setSyncing(false);
  };
  
  const addSafe = async (name: string) => {
      const newSafe = { id: Date.now(), name, balances: { TL: 0, USD: 0, EUR: 0 } };
      setSafes(prev => [...prev, newSafe]);
      setSyncing(true);
      await api.create('safes', newSafe);
      setSyncing(false);
  };

  const editSafe = async (updated: Safe) => {
      setSafes(prev => prev.map(s => s.id === updated.id ? updated : s));
      setSyncing(true);
      await api.update('safes', updated);
      setSyncing(false);
  };

  const deleteSafe = async (id: number) => {
      setSafes(prev => prev.filter(s => s.id !== id));
      setSyncing(true);
      await api.delete('safes', id);
      setSyncing(false);
  };

  // --- COMPLEX TRANSACTIONS ---

  const processInvoice = async (customerId: number, date: string, items: TransactionItem[], currency: 'TL' | 'USD' | 'EUR', desc: string) => {
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const type = activePage === 'invoice-sales' ? 'sales' : 'purchase';
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) return;

    const newTrans: Transaction = {
      id: Date.now(),
      date, 
      type, 
      accId: customerId, 
      accName: customer.name, 
      currency, 
      total, 
      items,
      desc // Added description
    };

    setSyncing(true);

    // 1. Update Transactions
    setTransactions(prev => [...prev, newTrans]);
    api.create('transactions', newTrans); // Async call

    // 2. Update Customer Balance
    const currentBal = customer.balances[currency] || 0;
    const newBal = type === 'sales' ? currentBal + total : currentBal - total;
    const updatedCustomer = { ...customer, balances: { ...customer.balances, [currency]: newBal } };
    
    setCustomers(prev => prev.map(c => c.id === customerId ? updatedCustomer : c));
    await api.update('customers', updatedCustomer);

    setSyncing(false);
    alert('Fatura başarıyla kaydedildi.');
    setActivePage('customers');
  };

  const processPayment = async (amount: number, type: 'in' | 'out', safeId: number, currency: 'TL'|'USD'|'EUR', method: PaymentMethod, desc: string) => {
     if (!selectedCustId) return;
     const customer = customers.find(c => c.id === selectedCustId);
     const safe = safes.find(s => s.id === safeId);
     
     if (!customer || !safe) return;

     const transType = type === 'in' ? 'cash_in' : 'cash_out';

     const newTrans: Transaction = {
         id: Date.now(),
         date: new Date().toISOString().split('T')[0],
         type: transType,
         accId: customer.id,
         accName: customer.name,
         safeId: safe.id,
         currency,
         total: amount,
         desc,
         method
     };

     setSyncing(true);

     // 1. Add Transaction
     setTransactions(prev => [...prev, newTrans]);
     api.create('transactions', newTrans);

     // 2. Update Customer
     const curCustBal = customer.balances[currency] || 0;
     const newCustBal = type === 'in' ? curCustBal - amount : curCustBal + amount;
     const updatedCustomer = { ...customer, balances: { ...customer.balances, [currency]: newCustBal } };
     setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
     api.update('customers', updatedCustomer);

     // 3. Update Safe
     const curSafeBal = safe.balances[currency] || 0;
     const newSafeBal = type === 'in' ? curSafeBal + amount : curSafeBal - amount;
     const updatedSafe = { ...safe, balances: { ...safe.balances, [currency]: newSafeBal } };
     setSafes(prev => prev.map(s => s.id === safe.id ? updatedSafe : s));
     await api.update('safes', updatedSafe);

     setSyncing(false);
  };

  const deleteTransaction = async (id: number) => {
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
              api.update('customers', updatedCustomer);
          }
      }

      // 2. Revert Safe Balance
      if(trans.safeId && (trans.type === 'cash_in' || trans.type === 'cash_out')) {
           const safe = safes.find(s => s.id === trans.safeId);
           if(safe) {
               const amount = trans.total;
               const isRevertIn = trans.type === 'cash_in'; // was Added, so Subtract
               const currentBal = safe.balances[currency];
               const newBal = isRevertIn ? currentBal - amount : currentBal + amount;
               const updatedSafe = { ...safe, balances: { ...safe.balances, [currency]: newBal } };
               setSafes(prev => prev.map(s => s.id === safe.id ? updatedSafe : s));
               api.update('safes', updatedSafe);
           }
      }

      // 3. Delete Transaction
      setTransactions(prev => prev.filter(t => t.id !== id));
      await api.delete('transactions', id);
      setSyncing(false);
  };

  const handleEditTransaction = async (newTrans: Transaction) => {
      const oldTrans = transactions.find(t => t.id === newTrans.id);
      if (!oldTrans) return;

      setSyncing(true);
      // Logic for Edit is complex with API syncing for balances. 
      // For simplicity in this demo, we will calculate everything locally, update state, then PUSH the updated objects to API.
      
      let tempCustomers = [...customers];
      let tempSafes = [...safes];

      // --- A. REVERT OLD ---
      if (oldTrans.accId) {
          const cIndex = tempCustomers.findIndex(c => c.id === oldTrans.accId);
          if (cIndex > -1) {
              const c = tempCustomers[cIndex];
              let change = 0;
              if (oldTrans.type === 'sales' || oldTrans.type === 'cash_out') change = -oldTrans.total;
              else change = oldTrans.total;
              tempCustomers[cIndex] = { ...c, balances: { ...c.balances, [oldTrans.currency]: c.balances[oldTrans.currency] + change } };
          }
      }
      if (oldTrans.safeId && (oldTrans.type === 'cash_in' || oldTrans.type === 'cash_out')) {
           const sIndex = tempSafes.findIndex(s => s.id === oldTrans.safeId);
           if (sIndex > -1) {
               const s = tempSafes[sIndex];
               const change = oldTrans.type === 'cash_in' ? -oldTrans.total : oldTrans.total;
               tempSafes[sIndex] = { ...s, balances: { ...s.balances, [oldTrans.currency]: s.balances[oldTrans.currency] + change } };
           }
      }

      // --- B. APPLY NEW ---
      if (newTrans.accId) {
          const cIndex = tempCustomers.findIndex(c => c.id === newTrans.accId);
          if (cIndex > -1) {
              const c = tempCustomers[cIndex];
              let change = 0;
              if (newTrans.type === 'sales' || newTrans.type === 'cash_out') change = newTrans.total;
              else change = -newTrans.total;
              tempCustomers[cIndex] = { ...c, balances: { ...c.balances, [newTrans.currency]: (c.balances[newTrans.currency] || 0) + change } };
              
              // API CALL for Customer
              api.update('customers', tempCustomers[cIndex]);
          }
      }
      if (newTrans.safeId && (newTrans.type === 'cash_in' || newTrans.type === 'cash_out')) {
          const sIndex = tempSafes.findIndex(s => s.id === newTrans.safeId);
          if (sIndex > -1) {
               const s = tempSafes[sIndex];
               const change = newTrans.type === 'cash_in' ? newTrans.total : -newTrans.total;
               tempSafes[sIndex] = { ...s, balances: { ...s.balances, [newTrans.currency]: (s.balances[newTrans.currency] || 0) + change } };

               // API CALL for Safe
               api.update('safes', tempSafes[sIndex]);
          }
      }

      // API CALL for Transaction
      api.update('transactions', newTrans);

      // Update State
      setCustomers(tempCustomers);
      setSafes(tempSafes);
      setTransactions(prev => prev.map(t => t.id === newTrans.id ? newTrans : t));
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
          <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
              <div className="w-10 h-10 border-4 border-slate-700 border-t-primary rounded-full animate-spin mb-4"></div>
              <div>{loadingData ? 'Veriler Buluttan Çekiliyor...' : 'Yükleniyor...'}</div>
          </div>
      );
  }

  if (!user) {
      return <LoginScreen />;
  }

  return (
    <div className="relative">
        {/* Sync Indicator */}
        {syncing && (
            <div className="fixed top-4 right-4 z-[60] bg-white shadow-lg rounded-full px-3 py-1 flex items-center gap-2 text-xs font-bold text-slate-600 animate-pulse border border-slate-200">
                <RefreshCw size={12} className="animate-spin text-primary" /> Kaydediliyor...
            </div>
        )}
        
        <Layout activePage={activePage} onNavigate={setActivePage}>
        {
            activePage === 'customers' ? <Customers customers={customers} onAddCustomer={addCustomer} onEditCustomer={editCustomer} onDeleteCustomer={deleteCustomer} onSelectCustomer={handleCustomerSelect} /> :
            activePage === 'customer-detail' ? <CustomerDetail customer={customers.find(c => c.id === selectedCustId)!} transactions={transactions} safes={safes} onBack={() => setActivePage('customers')} onPayment={processPayment} onDeleteTransaction={deleteTransaction} onEditTransaction={handleEditTransaction} /> :
            activePage === 'products' ? <Products products={products} onAddProduct={addProduct} onEditProduct={editProduct} onDeleteProduct={deleteProduct} /> :
            (activePage === 'invoice-sales' || activePage === 'invoice-purchase') ? <InvoiceBuilder type={activePage === 'invoice-sales' ? 'sales' : 'purchase'} customers={customers} products={products} onSave={processInvoice} transactions={transactions} /> :
            activePage === 'cash' ? <Cash safes={safes} transactions={transactions} onAddSafe={addSafe} onEditSafe={editSafe} onDeleteSafe={deleteSafe} /> :
            <DailyReport transactions={transactions} customers={customers} />
        }
        </Layout>
        
        <button 
            onClick={handleLogout}
            className="fixed bottom-4 left-4 z-50 bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors no-print"
            title="Güvenli Çıkış"
        >
            <LogOut size={20} />
        </button>
    </div>
  );
};

export default App;
