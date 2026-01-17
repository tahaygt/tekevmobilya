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
import { LogOut, AlertCircle, Lock, Mail } from 'lucide-react';

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAIceJz9FEU9K8PYsQn7mQq3unoIynlJe0",
  authDomain: "tekevmobilya-32e6e.firebaseapp.com",
  projectId: "tekevmobilya-32e6e",
  storageBucket: "tekevmobilya-32e6e.firebasestorage.app",
  messagingSenderId: "302573707218",
  appId: "1:302573707218:web:937aa9e1e498444fab720b"
};

// Initialize Firebase safely
let auth: any;
try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization failed. Check your config.", error);
}

// --- UTILS ---
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
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
            setError("Firebase bağlantısı yapılamadı. Config ayarlarını kontrol edin.");
            setLoading(false);
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged in App component will handle the redirect
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError("E-posta veya şifre hatalı.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Geçersiz e-posta formatı.");
            } else if (err.code === 'auth/too-many-requests') {
                 setError("Çok fazla başarısız deneme. Lütfen bekleyin.");
            } else {
                setError("Giriş yapılamadı: " + err.message);
            }
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
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Kullanıcı Adı (E-Posta)</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input 
                                type="email" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm font-medium"
                                placeholder="ornek@tekdemir.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Şifre</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            <input 
                                type="password" 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm font-medium"
                                placeholder="******"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg border border-red-100">
                            <AlertCircle size={16} className="shrink-0" /> 
                            <span>{error}</span>
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex justify-center items-center bg-slate-900 hover:bg-slate-800 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : 'Giriş Yap'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-slate-400">
                        Bu sistem Firebase altyapısı ile korunmaktadır.<br/>
                        Şifreleriniz şifreli olarak saklanır.
                    </p>
                </div>
             </div>
        </div>
    );
};

// --- MAIN APP ---

const App: React.FC = () => {
  // Global State
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // App Data State
  const [activePage, setActivePage] = useState<Page>('customers');
  const [selectedCustId, setSelectedCustId] = useState<number | null>(null);

  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers_v2', []);
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [safes, setSafes] = useLocalStorage<Safe[]>('safes_v2', [
    { id: 1, name: 'Ana Kasa', balances: { TL: 0, USD: 0, EUR: 0 } },
    { id: 2, name: 'Merkez Kasa', balances: { TL: 0, USD: 0, EUR: 0 } }
  ]);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);

  // Listen for Auth State
  useEffect(() => {
    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    } else {
        setLoadingAuth(false);
    }
  }, []);

  // --- ENTITY ACTIONS ---
  const addCustomer = (data: Omit<Customer, 'id' | 'balances'>) => {
    const newCustomer: Customer = { ...data, id: Date.now(), balances: { TL: 0, USD: 0, EUR: 0 } };
    setCustomers([...customers, newCustomer]);
  };
  const editCustomer = (updated: Customer) => setCustomers(customers.map(c => c.id === updated.id ? updated : c));
  const deleteCustomer = (id: number) => setCustomers(customers.filter(c => c.id !== id));
  
  const addProduct = (data: Omit<Product, 'id'>) => setProducts([...products, { ...data, id: Date.now() }]);
  const editProduct = (updated: Product) => setProducts(products.map(p => p.id === updated.id ? updated : p));
  const deleteProduct = (id: number) => setProducts(products.filter(p => p.id !== id));
  
  const addSafe = (name: string) => setSafes([...safes, { id: Date.now(), name, balances: { TL: 0, USD: 0, EUR: 0 } }]);
  const editSafe = (updated: Safe) => setSafes(safes.map(s => s.id === updated.id ? updated : s));
  const deleteSafe = (id: number) => setSafes(safes.filter(s => s.id !== id));

  const processInvoice = (customerId: number, date: string, items: TransactionItem[], currency: 'TL' | 'USD' | 'EUR') => {
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const type = activePage === 'invoice-sales' ? 'sales' : 'purchase';
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) return;

    const newTrans: Transaction = {
      id: Date.now(),
      date, type, accId: customerId, accName: customer.name, currency, total, items
    };
    setTransactions([...transactions, newTrans]);

    const updatedCustomers = customers.map(c => {
      if (c.id === customerId) {
        const currentBal = c.balances[currency] || 0;
        const newBal = type === 'sales' ? currentBal + total : currentBal - total;
        return { ...c, balances: { ...c.balances, [currency]: newBal } };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    alert('Fatura başarıyla kaydedildi.');
    setActivePage('customers');
  };

  const processPayment = (amount: number, type: 'in' | 'out', safeId: number, currency: 'TL'|'USD'|'EUR', method: PaymentMethod, desc: string) => {
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

     setTransactions([...transactions, newTrans]);

     const updatedCustomers = customers.map(c => {
         if (c.id === customer.id) {
             const currentBal = c.balances[currency] || 0;
             const newBal = type === 'in' ? currentBal - amount : currentBal + amount;
             return { ...c, balances: { ...c.balances, [currency]: newBal } };
         }
         return c;
     });
     setCustomers(updatedCustomers);

     const updatedSafes = safes.map(s => {
         if (s.id === safe.id) {
             const currentBal = s.balances[currency] || 0;
             const newBal = type === 'in' ? currentBal + amount : currentBal - amount;
             return { ...s, balances: { ...s.balances, [currency]: newBal } };
         }
         return s;
     });
     setSafes(updatedSafes);
  };

  const deleteTransaction = (id: number) => {
      const trans = transactions.find(t => t.id === id);
      if(!trans) return;

      const currency = trans.currency;

      // Revert balances
      if(trans.accId) {
          const customer = customers.find(c => c.id === trans.accId);
          if(customer) {
              let balanceChange = 0;
              if (trans.type === 'sales') balanceChange = -trans.total;
              else if (trans.type === 'purchase') balanceChange = trans.total;
              else if (trans.type === 'cash_in') balanceChange = trans.total; 
              else if (trans.type === 'cash_out') balanceChange = -trans.total; 
              
              const updatedCustomers = customers.map(c => {
                  if (c.id === customer.id) {
                      const curBal = c.balances[currency] || 0;
                      return { ...c, balances: { ...c.balances, [currency]: curBal + balanceChange } };
                  }
                  return c;
              });
              setCustomers(updatedCustomers);
          }
      }

      if(trans.safeId && (trans.type === 'cash_in' || trans.type === 'cash_out')) {
           const safe = safes.find(s => s.id === trans.safeId);
           if(safe) {
               const amount = trans.total;
               const isRevertIn = trans.type === 'cash_in';
               const currentBal = safe.balances[currency];
               const newBal = isRevertIn ? currentBal - amount : currentBal + amount;
               
               const updatedSafes = safes.map(s => 
                   s.id === safe.id ? { ...s, balances: { ...s.balances, [currency]: newBal } } : s
               );
               setSafes(updatedSafes);
           }
      }

      setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleEditTransaction = (newTrans: Transaction) => {
      const oldTrans = transactions.find(t => t.id === newTrans.id);
      if (!oldTrans) return;

      // --- 1. REVERT OLD TRANSACTION IMPACT ---
      // Clone current arrays to work on
      let updatedCustomers = [...customers];
      let updatedSafes = [...safes];

      // Revert Customer Balance
      if (oldTrans.accId) {
          const cIndex = updatedCustomers.findIndex(c => c.id === oldTrans.accId);
          if (cIndex > -1) {
              const c = updatedCustomers[cIndex];
              // Logic: If it was debt (Sales/Out), we added to balance. So subtract to revert.
              // If it was credit (Purchase/In), we subtracted. So add to revert.
              let change = 0;
              if (oldTrans.type === 'sales' || oldTrans.type === 'cash_out') change = -oldTrans.total;
              else change = oldTrans.total;

              updatedCustomers[cIndex] = {
                  ...c,
                  balances: { ...c.balances, [oldTrans.currency]: c.balances[oldTrans.currency] + change }
              };
          }
      }

      // Revert Safe Balance (only for cash transactions)
      if (oldTrans.safeId && (oldTrans.type === 'cash_in' || oldTrans.type === 'cash_out')) {
           const sIndex = updatedSafes.findIndex(s => s.id === oldTrans.safeId);
           if (sIndex > -1) {
               const s = updatedSafes[sIndex];
               // CashIn: Added to safe. Revert: Subtract.
               // CashOut: Subtracted from safe. Revert: Add.
               const change = oldTrans.type === 'cash_in' ? -oldTrans.total : oldTrans.total;
               updatedSafes[sIndex] = {
                   ...s,
                   balances: { ...s.balances, [oldTrans.currency]: s.balances[oldTrans.currency] + change }
               };
           }
      }

      // --- 2. APPLY NEW TRANSACTION IMPACT ---
      // For invoices (items present), we assume Amount didn't change (UI prevents it), so only desc/date update.
      // But we run the logic generally in case we allow amount edits later or if it's a payment.
      
      // Apply to Customer
      if (newTrans.accId) {
          const cIndex = updatedCustomers.findIndex(c => c.id === newTrans.accId);
          if (cIndex > -1) {
              const c = updatedCustomers[cIndex];
              let change = 0;
              if (newTrans.type === 'sales' || newTrans.type === 'cash_out') change = newTrans.total; // Add debt
              else change = -newTrans.total; // Reduce debt (credit)

              updatedCustomers[cIndex] = {
                  ...c,
                  balances: { ...c.balances, [newTrans.currency]: (c.balances[newTrans.currency] || 0) + change }
              };
          }
      }

      // Apply to Safe
      if (newTrans.safeId && (newTrans.type === 'cash_in' || newTrans.type === 'cash_out')) {
          const sIndex = updatedSafes.findIndex(s => s.id === newTrans.safeId);
          if (sIndex > -1) {
               const s = updatedSafes[sIndex];
               const change = newTrans.type === 'cash_in' ? newTrans.total : -newTrans.total;
               updatedSafes[sIndex] = {
                   ...s,
                   balances: { ...s.balances, [newTrans.currency]: (s.balances[newTrans.currency] || 0) + change }
               };
          }
      }

      // --- 3. UPDATE STATE ---
      setCustomers(updatedCustomers);
      setSafes(updatedSafes);
      setTransactions(transactions.map(t => t.id === newTrans.id ? newTrans : t));
  };

  const handleCustomerSelect = (id: number) => {
    setSelectedCustId(id);
    setActivePage('customer-detail');
  };
  
  const handleLogout = () => {
      if (auth) signOut(auth);
  };

  if (loadingAuth) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-slate-700 border-t-primary rounded-full animate-spin"></div>
          </div>
      );
  }

  if (!user) {
      return <LoginScreen />;
  }

  return (
    <div className="relative">
        <Layout activePage={activePage} onNavigate={setActivePage}>
        {
            activePage === 'customers' ? <Customers customers={customers} onAddCustomer={addCustomer} onEditCustomer={editCustomer} onDeleteCustomer={deleteCustomer} onSelectCustomer={handleCustomerSelect} /> :
            activePage === 'customer-detail' ? <CustomerDetail customer={customers.find(c => c.id === selectedCustId)!} transactions={transactions} safes={safes} onBack={() => setActivePage('customers')} onPayment={processPayment} onDeleteTransaction={deleteTransaction} onEditTransaction={handleEditTransaction} /> :
            activePage === 'products' ? <Products products={products} onAddProduct={addProduct} onEditProduct={editProduct} onDeleteProduct={deleteProduct} /> :
            (activePage === 'invoice-sales' || activePage === 'invoice-purchase') ? <InvoiceBuilder type={activePage === 'invoice-sales' ? 'sales' : 'purchase'} customers={customers} products={products} onSave={processInvoice} /> :
            activePage === 'cash' ? <Cash safes={safes} transactions={transactions} onAddSafe={addSafe} onEditSafe={editSafe} onDeleteSafe={deleteSafe} /> :
            <DailyReport transactions={transactions} customers={customers} />
        }
        </Layout>
        
        {/* Logout Button (Floating) */}
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