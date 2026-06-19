export interface User {
  email: string;
  name: string;
  role: 'admin' | 'cargo_agent' | 'vj_agent' | 'marketing_agent' | 'air_cargo_agent';
  hub: string;
}

export type PaymentMode = 'Cash' | 'POS' | 'Transfer' | 'Debt' | 'Debt Paid';

export interface Transaction {
  id: string;
  name: string;
  detail: string;
  amount: number;
  mode: PaymentMode | string;
  time: string;
  type: 'cargo' | 'baggage' | 'marketing' | 'air_cargo';
  status: 'Intake' | 'Departure' | 'In-Transit' | 'Arrived' | 'Delivered' | 'Pending' | 'Received' | 'Dispatched';
  isPending?: boolean;
  route?: string;
  bank?: string;
  // Air Cargo specifics
  awbStart?: string;
  awbEnd?: string;
  consignee?: string;
  pieces?: number;
  kg?: number;
  contentType?: string;
  slotRef?: string;
  remarks?: string;
}

export interface Expense {
  id: string;
  type: string;
  amount: number;
  description: string;
  time: string;
}

export type TabView = 'Tower' | 'Cargo' | 'VJ POS' | 'Air Cargo' | 'Mktg' | 'Scan' | 'More';

export interface AppState {
  user: User | null;
  transactions: Transaction[];
  expenses: Expense[];
  isOffline: boolean;
  pendingSyncCount: number;
  currentTab: TabView;
}
