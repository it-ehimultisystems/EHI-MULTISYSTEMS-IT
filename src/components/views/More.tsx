import { AccountingConsole } from './AccountingConsole';
import { Reports } from './Reports';
import { Settings } from './Settings';
import { BankReconciliation } from './BankReconciliation';
import { Fleet } from './Fleet';
import { Forecasting } from './Forecasting';
import { FraudAlerts } from './FraudAlerts';
import { AuditLog } from './AuditLog';
import { APIDashboard } from './APIDashboard';
import { TransactionLedger } from './TransactionLedger';
import { PODLog } from './PODLog';
import { Dispatch } from './Dispatch';
import { EODReconciliation } from './EODReconciliation';
import { SupportTickets } from './SupportTickets';

import { PricingConfiguration } from './PricingConfiguration';
import { AirlineCommissions } from './AirlineCommissions';

import { useState } from 'react';
import { User, TabView, Transaction, Expense } from '../../lib/types';
import { fmt } from '../../lib/helpers';
import {
  FileText,
  Activity,
  Database,
  Shield,
  Settings as SettingsIcon,
  LogOut,
  BarChart,
  Layers,
  Truck,
  Brain,
  ShieldAlert,
  Key,
  DollarSign,
  History,
  MapPin,
  Percent,
  Users,
  Plane,
  CreditCard,
  Terminal,
  ChevronRight
} from 'lucide-react';

import { StaffManagement } from './StaffManagement';

export const More = ({ user, transactions, expenses, onLogout, onEOD, onAddTx, onFullUpdateTx, onAddExpense, onChangeTab, dateRange, onDateRangeChange }: { user: User; transactions: Transaction[]; expenses: Expense[]; onLogout: () => void; onEOD?: () => void; onAddTx: (tx: Transaction) => void; onFullUpdateTx?: (tx: Transaction) => void; onAddExpense: (e: Expense) => void; onChangeTab: (t: TabView) => void; dateRange?: { start: string; end: string }; onDateRangeChange?: (range: { start: string; end: string }) => void; }) => {
  const [eodView, setEodView] = useState(false);
  const [accountingView, setAccountingView] = useState(false);
  const [reportsView, setReportsView] = useState(false);
  const [settingsView, setSettingsView] = useState(false);

  // Premium Enterprise modules views states
  const [bankReconView, setBankReconView] = useState(false);
  const [fleetView, setFleetView] = useState(false);
  const [forecastingView, setForecastingView] = useState(false);
  const [fraudAlertsView, setFraudAlertsView] = useState(false);
  const [auditLogView, setAuditLogView] = useState(false);
  const [apiDashboardView, setApiDashboardView] = useState(false);
  const [ledgerView, setLedgerView] = useState(false);
  const [podLogView, setPodLogView] = useState(false);
  const [dispatchView, setDispatchView] = useState(false);
  const [airlineCommissionsView, setAirlineCommissionsView] = useState(false);
  const [pricingView, setPricingView] = useState(false);
  const [supportView, setSupportView] = useState(false);
  const [staffView, setStaffView] = useState(false);

  // View controllers
  if (eodView) {
    return <EODReconciliation user={user} transactions={transactions} expenses={expenses} onBack={() => setEodView(false)} onEOD={onEOD} />;
  }

  if (accountingView) {
    return <AccountingConsole user={user} transactions={transactions} expenses={expenses} onBack={() => setAccountingView(false)} onAddExpense={onAddExpense} onOpenBankRecon={() => setBankReconView(true)} onFullUpdateTx={onFullUpdateTx} />;
  }

  if (reportsView) {
    return <Reports user={user} transactions={transactions} onBack={() => setReportsView(false)} />;
  }

  if (settingsView) {
    return <Settings user={user} onBack={() => setSettingsView(false)} />;
  }

  if (bankReconView) {
    return <BankReconciliation 
      transactions={transactions} 
      onBack={() => setBankReconView(false)} 
      onConfirm={({ matchedIds }) => {
        if (onFullUpdateTx) {
          matchedIds.forEach(id => {
            const tx = transactions.find(t => t.id === id);
            if (tx) {
              onFullUpdateTx({ ...tx, paymentConfirmed: true, confirmedAt: new Date().toLocaleTimeString('en-NG'), confirmedBy: user.name });
            }
          });
        }
      }}
    />;
  }

  if (fleetView) {
    return <Fleet onBack={() => setFleetView(false)} />;
  }

  if (forecastingView) {
    return <Forecasting onBack={() => setForecastingView(false)} />;
  }

  if (fraudAlertsView) {
    return <FraudAlerts onBack={() => setFraudAlertsView(false)} />;
  }

  if (ledgerView) {
    return <TransactionLedger user={user} transactions={transactions} expenses={expenses} onBack={() => setLedgerView(false)} onUpdateTx={onFullUpdateTx || onAddTx} dateRange={dateRange} onDateRangeChange={onDateRangeChange} />;
  }

  if (auditLogView) {
    return <AuditLog onBack={() => setAuditLogView(false)} />;
  }

  if (apiDashboardView) {
    return <APIDashboard onBack={() => setApiDashboardView(false)} />;
  }

  if (podLogView) {
    return <PODLog onBack={() => setPodLogView(false)} />;
  }

  if (dispatchView) {
    return <Dispatch onBack={() => setDispatchView(false)} />;
  }

  if (airlineCommissionsView) {
    return <AirlineCommissions onBack={() => setAirlineCommissionsView(false)} />;
  }

  if (pricingView) {
    return <PricingConfiguration user={user} onBack={() => setPricingView(false)} />;
  }

  if (supportView) {
    return <SupportTickets user={user} onBack={() => setSupportView(false)} />;
  }

  if (staffView) {
    return <StaffManagement user={user} onBack={() => setStaffView(false)} />;
  }

  // Role checking helpers
  const canAccessAccounting = user.role === 'admin' || user.role === 'super_admin' || user.role === 'accountant';
  const canAccessRecon = user.role === 'super_admin' || user.role === 'accountant';
  const canAccessFleetAndForecast = user.role === 'super_admin' || user.role === 'admin';
  const canAccessFraud = user.role === 'super_admin' || user.role === 'admin' || user.role === 'auditor';
  const canAccessAuditLog = user.role === 'super_admin' || user.role === 'auditor';
  const isSuperAdmin = user.role === 'super_admin';

  const MenuItem = ({
    icon: Icon,
    title,
    onClick,
    disabled = false,
  }: {
    icon: any;
    title: any;
    subtitle?: string; // Kept in prop signature so existing usages don't error immediately, but we ignore it in render
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-transparent flex items-center justify-between py-4 group transition-colors ${
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-[rgba(255,255,255,0.03)] cursor-pointer'
      }`}
    >
      <div className="flex items-center space-x-4">
        <Icon size={20} strokeWidth={1.5} className="text-[#d8cdb4] group-hover:text-[var(--color-accent-amber)] transition-colors shrink-0" />
        <div className="text-[15px] font-sans text-[var(--color-foreground)] transition-colors flex items-center gap-2">
          {title}
        </div>
      </div>
      <ChevronRight size={16} className="text-[var(--color-muted)] opacity-50 group-hover:opacity-100 transition-opacity" />
    </button>
  );

  const SectionLabel = ({ label }: { label: string }) => null; // Hide sections completely

  return (
    <div className="p-4 pb-8 select-none">
      <div className="divide-y divide-[rgba(255,255,255,0.08)] px-2">
        <MenuItem
          icon={FileText}
          title="EOD Daily Close"
          onClick={() => setEodView(true)}
        />
        <MenuItem
          icon={Activity}
          title="Transaction Ledger"
          onClick={() => setLedgerView(true)}
        />
        {(user.role === 'super_admin' || user.role === 'admin') && (
          <MenuItem
            icon={Plane}
            title="ValueJet POS"
            onClick={() => onChangeTab('VJ POS')}
          />
        )}
        <MenuItem
          icon={CreditCard}
          title="Credit & Debit"
          onClick={() => onChangeTab('Credit & Debit')}
          disabled={!canAccessAccounting}
        />
        <MenuItem
          icon={Layers}
          title="Bank Reconciliation"
          onClick={() => { if (canAccessRecon) setBankReconView(true); }}
          disabled={!canAccessRecon}
        />
        <MenuItem
          icon={Database}
          title="Central Accounting ERP"
          onClick={() => { if (canAccessAccounting) setAccountingView(true); }}
          disabled={!canAccessAccounting}
        />
        <MenuItem
          icon={BarChart}
          title="Advanced Reports"
          onClick={() => { if (canAccessAccounting) setReportsView(true); }}
          disabled={!canAccessAccounting}
        />
        <MenuItem
          icon={Percent}
          title="Airline Commissions"
          onClick={() => { if (canAccessAccounting) setAirlineCommissionsView(true); }}
          disabled={!canAccessAccounting}
        />
        <MenuItem
          icon={Brain}
          title="Demand Forecasting AI"
          onClick={() => { if (canAccessFleetAndForecast) setForecastingView(true); }}
          disabled={!canAccessFleetAndForecast}
        />
        <MenuItem
          icon={ShieldAlert}
          title="Fraud & Anomalies Feed"
          onClick={() => { if (canAccessFraud) setFraudAlertsView(true); }}
          disabled={!canAccessFraud}
        />
        <MenuItem
          icon={History}
          title="Revision Audit Log"
          onClick={() => { if (canAccessAuditLog) setAuditLogView(true); }}
          disabled={!canAccessAuditLog}
        />
        <MenuItem
          icon={Truck}
          title="Fleet Management"
          onClick={() => { if (canAccessFleetAndForecast) setFleetView(true); }}
          disabled={!canAccessFleetAndForecast}
        />
        <MenuItem
          icon={Shield}
          title="Proof of Delivery Log"
          onClick={() => { if (canAccessFraud) setPodLogView(true); }}
          disabled={!canAccessFraud}
        />
        <MenuItem
          icon={MapPin}
          title="Dispatch & Fleet Tracking"
          onClick={() => { if (canAccessFleetAndForecast) setDispatchView(true); }}
          disabled={!canAccessFleetAndForecast}
        />
        <MenuItem
          icon={Terminal}
          title="IT Debug Console"
          onClick={() => onChangeTab('IT Debug')}
          disabled={!isSuperAdmin}
        />
        <MenuItem
          icon={Key}
          title="Partners API Keys & Webhooks"
          onClick={() => { if (isSuperAdmin) setApiDashboardView(true); }}
          disabled={!isSuperAdmin}
        />
        <MenuItem
          icon={DollarSign}
          title="Pricing & Rates Configuration"
          onClick={() => { if (isSuperAdmin) setPricingView(true); }}
          disabled={!isSuperAdmin}
        />
        <MenuItem
          icon={SettingsIcon}
          title="Platform Settings"
          onClick={() => { if (isSuperAdmin) setSettingsView(true); }}
          disabled={!isSuperAdmin}
        />
        {(user.role === 'super_admin' || user.role === 'admin') && (
          <MenuItem
            icon={Users}
            title="Staff Management"
            onClick={() => setStaffView(true)}
          />
        )}
        <MenuItem
          icon={ShieldAlert}
          title="Help Desk & Issue Resolution"
          onClick={() => setSupportView(true)}
        />

        <button
          onClick={onLogout}
          className="w-full bg-transparent flex items-center justify-between py-4 group transition-colors hover:bg-[rgba(239,68,68,0.05)] cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <LogOut size={20} strokeWidth={1.5} className="text-[#ef4444] transition-colors shrink-0" />
            <div className="text-[15px] font-sans text-[#ef4444] transition-colors flex items-center gap-2">
              Sign out
            </div>
          </div>
        </button>
      </div>

    </div>
  );
};
