import { Transaction, UserRole, HubType } from './types';

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
  Onitsha:{ BB: 27000, MB: 15000, SB: 19000 },
  Makurdi:{ BB: 30000, MB: 18000, SB: 21000 },
};

export const AIRLINES = [
  { code: 'AK',  name: 'Arik Air' },
  { code: 'GA',  name: 'Green Africa Airways' },
  { code: 'UN',  name: 'United Nigeria Airlines' },
] as const;

export const DEMO_USERS = {
  'admin@ehimultisystems.com': {
    password: 'Admin1234',
    name: 'Geosan — Super Admin',
    role: 'super_admin' as UserRole,
    hubType: 'Head Office' as HubType,
    hub: 'Lagos HQ',
  },
  'cargo@ehimultisystems.com': {
    password: 'Counter123',
    name: 'Cargo Agent',
    role: 'cargo_agent' as UserRole,
    hubType: 'Cargo Station' as HubType,
    hub: 'Lagos Cargo Station',
  },
  'vj@ehimultisystems.com': {
    password: 'VJAgent123',
    name: 'VJ Counter',
    role: 'vj_agent' as UserRole,
    hubType: 'Cargo Station' as HubType,
    hub: 'Murtala Airport Terminal',
  },
  'marketing@ehimultisystems.com': {
    password: 'Market123',
    name: 'Marketing Agent',
    role: 'marketing_agent' as UserRole,
    hubType: 'Cargo Station' as HubType,
    hub: 'Lagos Market Run',
  },
  'aircargo@ehimultisystems.com': {
    password: 'AirCargo123',
    name: 'Air Cargo Officer',
    role: 'cargo_agent' as UserRole,
    hubType: 'Cargo Station' as HubType,
    hub: 'Murtala Air Cargo Station',
  },
  'driver@ehimultisystems.com': {
    password: 'Driver123',
    name: 'EHI Driver',
    role: 'driver' as UserRole,
    hubType: 'Cargo Station' as HubType,
    hub: 'Lagos Air Cargo Station',
  },
  'accountant@ehimultisystems.com': {
    password: 'Account123',
    name: 'EHI Accountant',
    role: 'accountant' as UserRole,
    hubType: 'Head Office' as HubType,
    hub: 'Lagos HQ',
  },
  'auditor@ehimultisystems.com': {
    password: 'Audit123',
    name: 'EHI Auditor',
    role: 'auditor' as UserRole,
    hubType: 'Head Office' as HubType,
    hub: 'Lagos HQ',
  },
} as const;

export const CORPORATE_CLIENTS = ['Aramex', 'SAHCO', 'GlobaCom', 'ZeemMax', 'EHI', 'Salco', 'Slot', 'Prosper', 'Evergreen', 'Wellcare', 'Other'] as const;

export const CONTENT_TYPES = [
  'Medical',
  'Clothes & Shoes',
  'Documents',
  'Chairs/Furniture',
  'Tyres',
  'Phones/Electronics',
  'Cosmetics',
  'Package/Parcel',
  'Baby Items',
  'SIM Cards',
  'Clearance',
  'Courier',
  'Other'
] as const;

export const EXPENSE_CATEGORIES = [
  'Cars',
  'Carrier',
  'Transport',
  'Bus Hire',
  'Sack & Nylon',
  'Miscellaneous',
] as const;

export const PAYMENT_MODES = ['Cash', 'POS', 'Transfer', 'Debt'] as const;
export const BANKS = ['UBA', 'GTBank', 'Access', 'Zenith', 'First Bank', 'Polaris', 'Keystone', 'Fidelity', 'Sterling', 'Other'] as const;

export const SEED_TRANSACTIONS: Transaction[] = [
  { id: 'VJ-240619-B2E4', name: 'Adamu Bello', detail: 'VQ-201 · +6.5kg', amount: 32500, mode: 'POS', time: '08:32', type: 'baggage', status: 'Delivered' },
  {
    id: 'CG-240619-A1B2',
    name: 'Aramex Logistics',
    detail: 'Arik Air · 14153-14154 · 120pcs · 3450KG · ABV/Abuja · Parcels',
    amount: 845000,
    mode: 'Transfer',
    bank: 'UBA',
    time: '08:45',
    type: 'cargo',
    status: 'In-Transit',
    awb_tag_number: '14153',
    pieces: 120,
    kg: 3450,
    route: 'ABV/Abuja',
    contentType: 'Parcels',
  },
  { id: 'MK-240619-M112', name: 'Madam Lily', detail: 'Abuja · 1SB', amount: 25000, mode: 'Transfer', time: '08:50', type: 'marketing', status: 'Intake', route: 'Abuja', bank: 'UBA' },
  {
    id: 'CG-240619-C3D4',
    name: 'SAHCO',
    detail: 'Green Africa · 22089 · 8pcs · 320KG · PHC/Port Harcourt · Electronics',
    amount: 320000,
    mode: 'Cash',
    time: '09:10',
    type: 'cargo',
    status: 'Arrived',
    awb_tag_number: '22089',
    pieces: 8,
    kg: 320,
    route: 'PHC/Port Harcourt',
    contentType: 'Phones/Electronics',
  },
  { id: 'VJ-240619-D8A2', name: 'Mrs. Chioma Obi', detail: 'VQ-314 · +3.2kg', amount: 16000, mode: 'Cash', time: '09:23', type: 'baggage', status: 'Delivered' },
  { id: 'MK-240619-M115', name: 'Chineye', detail: 'Abuja · 1BB', amount: 40000, mode: 'Cash', time: '09:30', type: 'marketing', status: 'Intake', route: 'Abuja' },
  {
    id: 'CG-240619-E5F6',
    name: 'Globacom',
    detail: 'United Nigeria · 31445 · 12pcs · 450KG · PHC · SIM Cards',
    amount: 420000,
    mode: 'Debt',
    time: '09:55',
    type: 'cargo',
    status: 'Dispatched',
    awb_tag_number: '31445',
    pieces: 12,
    kg: 450,
    route: 'PHC/Port Harcourt',
    contentType: 'SIM Cards',
  },
  { id: 'VJ-240619-F4B1', name: 'Dr. Emeka Nwachukwu', detail: 'VQ-405 · +8.1kg', amount: 40500, mode: 'POS', time: '10:02', type: 'baggage', status: 'Delivered' },
];

export const ALL_STATUSES = ['Intake', 'Departure', 'In-Transit', 'Arrived', 'Delivered', 'Pending', 'Received', 'Dispatched'] as const;
