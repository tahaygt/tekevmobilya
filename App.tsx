import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Customers } from './components/Customers';
import { CustomerDetail } from './components/CustomerDetail';
import { Products } from './components/Products';
import { InvoiceBuilder } from './components/InvoiceBuilder';
import { Cash } from './components/Cash';
import { DailyReport } from './components/DailyReport';
import { Customer, Product, Safe, Transaction, TransactionItem, Page, PaymentMethod } from './types';

// Custom Hook for LocalStorage
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

const App: React.FC = () => {
  // State
  const [activePage, setActivePage] = useState<Page>('customers');
  const [selectedCustId, setSelectedCustId] = useState<number | null>(null);

  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers_v2', []);
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [safes, setSafes] = useLocalStorage<Safe[]>('safes_v2', [
    { id: 1, name: 'Ana Kasa', balances: { TL: 0, USD: 0, EUR: 0 } },
    { id: 2, name: 'Merkez Kasa', balances: { TL: 0, USD: 0, EUR: 0 } }
  ]);
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);

  // --- ACTIONS: CUSTOMERS ---
  const addCustomer = (data: Omit<Customer, 'id' | 'balances'>) => {
    const newCustomer: Customer = { 
        ...data, 
        id: Date.now(), 
        balances: { TL: 0, USD: 0, EUR: 0 } // Initialize multi-currency buckets
    };
    setCustomers([...customers, newCustomer]);
  };

  const editCustomer = (updated: Customer) => {
      setCustomers(customers.map(c => c.id === updated.id ? updated : c));
  };

  const deleteCustomer = (id: number) => {
      setCustomers(customers.filter(c => c.id !== id));
  };

  // --- ACTIONS: PRODUCTS ---
  const addProduct = (data: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...data, id: Date.now() };
    setProducts([...products, newProduct]);
  };

  const editProduct = (updated: Product) => {
      setProducts(products.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProduct = (id: number) => {
      setProducts(products.filter(p => p.id !== id));
  };

  // --- ACTIONS: SAFES ---
  const addSafe = (name: string) => {
    const newSafe: Safe = { id: Date.now(), name, balances: { TL: 0, USD: 0, EUR: 0 } };
    setSafes([...safes, newSafe]);
  };

  const editSafe = (updated: Safe) => {
      setSafes(safes.map(s => s.id === updated.id ? updated : s));
  };

  const deleteSafe = (id: number) => {
      setSafes(safes.filter(s => s.id !== id));
  };

  // --- ACTIONS: TRANSACTIONS & INVOICES ---

  const processInvoice = (customerId: number, date: string, items: TransactionItem[], currency: 'TL' | 'USD' | 'EUR') => {
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const type = activePage === 'invoice-sales' ? 'sales' : 'purchase';
    const customer = customers.find(c => c.id === customerId);
    
    if (!customer) return;

    // Create Transaction
    const newTrans: Transaction = {
      id: Date.now(),
      date,
      type,
      accId: customerId,
      accName: customer.name,
      currency,
      total,
      items
    };
    setTransactions([...transactions, newTrans]);

    // Update Customer Balance (Multi-currency aware)
    const updatedCustomers = customers.map(c => {
      if (c.id === customerId) {
        const currentBal = c.balances[currency] || 0;
        // Sales increases balance (debt to us), Purchase decreases it.
        const newBal = type === 'sales' ? currentBal + total : currentBal - total;
        
        return {
          ...c,
          balances: { ...c.balances, [currency]: newBal }
        };
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

     // Update Customer Balance
     const updatedCustomers = customers.map(c => {
         if (c.id === customer.id) {
             const currentBal = c.balances[currency] || 0;
             // In (Tahsilat) -> Balance down
             // Out (Ödeme) -> Balance up
             const newBal = type === 'in' ? currentBal - amount : currentBal + amount;
             return { ...c, balances: { ...c.balances, [currency]: newBal } };
         }
         return c;
     });
     setCustomers(updatedCustomers);

     // Update Safe Balance
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
              // Reverse the logic used in creation
              if (trans.type === 'sales') balanceChange = -trans.total;
              else if (trans.type === 'purchase') balanceChange = trans.total;
              else if (trans.type === 'cash_in') balanceChange = trans.total; // Was minus, so add back
              else if (trans.type === 'cash_out') balanceChange = -trans.total; // Was plus, so subtract
              
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
               const isRevertIn = trans.type === 'cash_in'; // Was IN (added to safe), so subtract
               
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

  const handleCustomerSelect = (id: number) => {
    setSelectedCustId(id);
    setActivePage('customer-detail');
  };

  // Rendering
  const renderContent = () => {
    switch (activePage) {
      case 'customers':
        return <Customers 
                  customers={customers} 
                  onAddCustomer={addCustomer} 
                  onEditCustomer={editCustomer}
                  onDeleteCustomer={deleteCustomer}
                  onSelectCustomer={handleCustomerSelect} 
                />;
      case 'customer-detail':
        const cust = customers.find(c => c.id === selectedCustId);
        if (!cust) return <div>Cari bulunamadı</div>;
        return <CustomerDetail 
                  customer={cust} 
                  transactions={transactions} 
                  safes={safes} 
                  onBack={() => setActivePage('customers')} 
                  onPayment={processPayment}
                  onDeleteTransaction={deleteTransaction}
                  onEditTransaction={(t) => console.log('Edit', t)}
                />;
      case 'products':
        return <Products 
                  products={products} 
                  onAddProduct={addProduct} 
                  onEditProduct={editProduct}
                  onDeleteProduct={deleteProduct}
                />;
      case 'invoice-sales':
      case 'invoice-purchase':
        return <InvoiceBuilder 
                  type={activePage === 'invoice-sales' ? 'sales' : 'purchase'} 
                  customers={customers} 
                  products={products} 
                  onSave={processInvoice} 
                />;
      case 'cash':
        return <Cash 
                safes={safes} 
                transactions={transactions} 
                onAddSafe={addSafe} 
                onEditSafe={editSafe}
                onDeleteSafe={deleteSafe}
               />;
      case 'report':
        return <DailyReport transactions={transactions} customers={customers} />;
      default:
        return <div>Sayfa bulunamadı</div>;
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {renderContent()}
    </Layout>
  );
};

export default App;