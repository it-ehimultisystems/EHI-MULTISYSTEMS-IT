import { Transaction } from './types';

export const PRICING: Record<string, { BB: number; MB: number; SB: number }> = {
  Benin:  { BB: 30000, MB: 18000, SB: 22000 },
  PHC:    { BB: 35000, MB: 20000, SB: 25000 },
  Abuja:  { BB: 40000, MB: 25000, SB: 28000 },
  Jos:    { BB: 32000, MB: 18000, SB: 22000 },
  Kano:   { BB: 42000, MB: 27000, SB: 30000 },
  Enugu:  { BB: 28000, MB: 16000, SB: 20000 },
  Warri:  { BB: 26000, MB: 15000, SB: 19000 },
  Asaba:  { BB: 25000, MB: 14000, SB: 18000 },
  Kaduna: { BB: 38000, MB: 22000, SB: 26000 },
};

export const DEMO_USERS = {
  'admin@ehimultisystems.com': {
    password: 'admin123',
    name: 'Geosan — Admin',
    role: 'admin',
    hub: 'Lagos HQ'
  },
  'cargo@ehimultisystems.com': {
    password: 'counter123',
    name: 'Cargo Counter',
    role: 'cargo_agent',
    hub: 'Lagos Cargo Desk'
  },
  'vj@ehimultisystems.com': {
    password: 'vj123',
    name: 'VJ Counter',
    role: 'vj_agent',
    hub: 'Murtala Airport Terminal'
  },
  'mktg@ehimultisystems.com': {
    password: 'mktg123',
    name: 'Mama Faith — Marketing',
    role: 'marketing_agent',
    hub: 'Lagos Market'
  },
  'air@ehimultisystems.com': {
    password: 'air123',
    name: 'Commercial Ops',
    role: 'air_cargo_agent',
    hub: 'MMA Air Cargo'
  }
} as const;

export const CORPORATE_CLIENTS = ['Aramex', 'SAHCO', 'Globacom', 'ZeemMax', 'FedEx', 'DHL'];
export const CONTENT_TYPES = ['Medical', 'Documents', 'Electronics/Phones', 'Cosmetics', 'Parcels', 'Tyres', 'SIM Cards', 'Clothing', 'Food Items', 'Miscellaneous'];
export const BANKS = ['UBA', 'Zenith', 'GTBank', 'Access', 'FirstBank'];
export const EXPENSE_TYPES = ['Bus Hire', 'Fuel', 'Security', 'Miscellaneous'];

export const SEED_TRANSACTIONS: Transaction[] = [
  { id: 'WB-240619-A3F1', name: 'Madam Uchechi', detail: 'PHC · 2BB 1SB', amount: 95000, mode: 'Transfer', time: '08:14', type: 'cargo', status: 'In-Transit' },
  { id: 'VJ-240619-B2E4', name: 'Adamu Bello', detail: 'VQ-201 · +6.5kg', amount: 32500, mode: 'POS', time: '08:32', type: 'baggage', status: 'Delivered' },
  { id: 'AC-240619-X9Y8', name: 'Aramex', detail: 'AWB 14153-14154 · ABV', amount: 845000, mode: 'Transfer', time: '08:45', type: 'air_cargo', status: 'Received', awbStart: '14153', awbEnd: '14154', pieces: 120, kg: 3450, route: 'Abuja', contentType: 'Parcels', consignee: 'Aramex', bank: 'UBA' },
  { id: 'MK-240619-M112', name: 'Madam Lily', detail: 'Abuja · 1SB', amount: 25000, mode: 'Transfer', time: '08:50', type: 'marketing', status: 'Intake', route: 'Abuja', bank: 'UBA' },
  { id: 'WB-240619-C1D9', name: 'Alhaji Musa Traders', detail: 'Kano · 3BB 2MB', amount: 176000, mode: 'Cash', time: '09:01', type: 'cargo', status: 'Departure' },
  { id: 'VJ-240619-D8A2', name: 'Mrs. Chioma Obi', detail: 'VQ-314 · +3.2kg', amount: 16000, mode: 'Cash', time: '09:23', type: 'baggage', status: 'Delivered' },
  { id: 'MK-240619-M115', name: 'Chineye', detail: 'Abuja · 1BB', amount: 40000, mode: 'Cash', time: '09:30', type: 'marketing', status: 'Intake', route: 'Abuja' },
  { id: 'WB-240619-E5C7', name: 'SunBridge Logistics', detail: 'Abuja · 1BB', amount: 40000, mode: 'Transfer', time: '09:45', type: 'cargo', status: 'Arrived' },
  { id: 'AC-240619-X8Z1', name: 'Globacom', detail: 'AWB 18002 · PHC', amount: 420000, mode: 'Debt', time: '09:55', type: 'air_cargo', status: 'Dispatched', awbStart: '18002', pieces: 12, kg: 450, route: 'PHC', contentType: 'SIM Cards', consignee: 'Globacom' },
  { id: 'VJ-240619-F4B1', name: 'Dr. Emeka Nwachukwu', detail: 'VQ-405 · +8.1kg', amount: 40500, mode: 'POS', time: '10:02', type: 'baggage', status: 'Delivered' },
  { id: 'WB-240619-G7H3', name: 'FastMove Cargo', detail: 'Benin · 4BB 3SB', amount: 186000, mode: 'Transfer', time: '10:28', type: 'cargo', status: 'In-Transit' },
];

export const ALL_STATUSES = ['Intake', 'Departure', 'In-Transit', 'Arrived', 'Delivered', 'Pending', 'Received', 'Dispatched'] as const;
