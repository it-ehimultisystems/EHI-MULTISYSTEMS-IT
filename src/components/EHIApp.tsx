import { useState, useEffect } from 'react';
import { User, TabView, Transaction, Expense } from '../lib/types';
import { SEED_TRANSACTIONS } from '../lib/constants';
import { randCargo, randBaggage } from '../lib/helpers';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Dashboard } from './views/Dashboard';
import { CargoForm } from './views/CargoForm';
import { ValueJetForm } from './views/ValueJetForm';
import { Scanner } from './views/Scanner';
import { More } from './views/More';
import { MarketingWorkspace } from './views/MarketingWorkspace';
import { AirCargoForm } from './views/AirCargoForm';
import { Toast, ToastProps } from './Toast';

export const EHIApp = ({ user, onLogout }: { user: User; onLogout: () => void }) => {
  const [currentTab, setCurrentTab] = useState<TabView>(user.role === 'marketing_agent' ? 'Mktg' : 'Tower');
  const [transactions, setTransactions] = useState<Transaction[]>(SEED_TRANSACTIONS);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [toast, setToast] = useState<ToastProps | null>(null);

  // Live simulation
  useEffect(() => {
    if (isOffline) return;
    
    const int = setInterval(() => {
      setTransactions(prev => {
        const newTx = Math.random() > 0.5 ? randCargo() : randBaggage();
        return [newTx, ...prev];
      });
    }, 7000);
    
    return () => clearInterval(int);
  }, [isOffline]);

  const handleAddTx = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
    if (isOffline) {
      setPendingSyncCount(prev => prev + 1);
      showToast({ message: 'Saved offline — syncs when reconnected', type: 'warning' });
    }
  };

  const showToast = (props: Omit<ToastProps, 'onClose'>) => {
    setToast({ ...props, onClose: () => setToast(null) });
  };

  const handleToggleWifi = () => {
    setIsOffline(prev => {
      const offline = !prev;
      if (!offline && pendingSyncCount > 0) {
        showToast({ message: `${pendingSyncCount} transaction(s) synced to Supabase`, type: 'success' });
        setPendingSyncCount(0);
      }
      return offline;
    });
  };

  return (
    <div className="flex flex-col h-screen max-w-[430px] mx-auto bg-[var(--color-obsidian)] relative overflow-hidden">
      <Header 
        user={user} 
        isOffline={isOffline} 
        pendingCount={pendingSyncCount} 
        onToggleWifi={handleToggleWifi} 
        onLogout={onLogout} 
      />
      
      <main className="flex-1 overflow-y-auto w-full pb-[60px]">
        {currentTab === 'Tower' && <Dashboard user={user} transactions={transactions} />}
        {currentTab === 'Cargo' && <CargoForm onAddTx={handleAddTx} />}
        {currentTab === 'Mktg' && <MarketingWorkspace user={user} transactions={transactions} expenses={expenses} onAddTx={handleAddTx} onAddExpense={(exp) => setExpenses(prev => [exp, ...prev])} />}
        {currentTab === 'Air Cargo' && <AirCargoForm onAddTx={handleAddTx} />}
        {currentTab === 'VJ POS' && <ValueJetForm onAddTx={handleAddTx} />}
        {currentTab === 'Scan' && <Scanner transactions={transactions} />}
        {currentTab === 'More' && (
          <More 
            user={user} 
            transactions={transactions} 
            onLogout={onLogout} 
            onEOD={() => {
              showToast({ message: 'EOD Report Dispatched — Saved to Drive · Emailed to management', type: 'success' });
            }}
          />
        )}
      </main>

      <BottomNav user={user} currentTab={currentTab} onChangeTab={setCurrentTab} />

      {toast && <Toast {...toast} />}
    </div>
  );
};
