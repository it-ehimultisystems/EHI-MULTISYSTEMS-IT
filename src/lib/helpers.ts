import { PRICING, SEED_TRANSACTIONS } from './constants';
import { Transaction, PaymentMode } from './types';

export const fmt = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount).replace('NGN', '₦');
};

export const uid = (prefix: 'WB' | 'VJ' | 'AC' | 'MK'): string => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomHex = Math.floor(Math.random() * 65536).toString(16).toUpperCase().padStart(4, '0');
  return `${prefix}-${dateStr}-${randomHex}`;
};

export const tnow = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

const DUMMY_NAMES = ['Mr. Alabi', 'Grace M.', 'Chief Okon', 'Ibrahim Y.', 'Uzor Goods', 'TechHub Ltd'];

export const randCargo = (): Transaction => {
  const dests = Object.keys(PRICING);
  const dest = dests[Math.floor(Math.random() * dests.length)];
  const bb = Math.floor(Math.random() * 3);
  const mb = Math.floor(Math.random() * 3);
  const amt = (bb * PRICING[dest].BB) + (mb * PRICING[dest].MB);
  const details = [];
  if (bb) details.push(`${bb}BB`);
  if (mb) details.push(`${mb}MB`);
  
  return {
    id: uid('WB'),
    name: DUMMY_NAMES[Math.floor(Math.random() * DUMMY_NAMES.length)],
    detail: `${dest} · ${details.join(' ') || '1SB'}`,
    amount: amt || PRICING[dest].SB,
    mode: ['Cash', 'Transfer', 'POS'][Math.floor(Math.random() * 3)] as PaymentMode,
    time: tnow(),
    type: 'cargo',
    status: 'Intake'
  };
};

export const randBaggage = (): Transaction => {
  const kg = Math.floor(Math.random() * 15) + 1;
  return {
    id: uid('VJ'),
    name: DUMMY_NAMES[Math.floor(Math.random() * DUMMY_NAMES.length)],
    detail: `VQ-${Math.floor(Math.random() * 800 + 100)} · +${kg}kg`,
    amount: kg * 5000,
    mode: ['Cash', 'Transfer', 'POS'][Math.floor(Math.random() * 3)] as PaymentMode,
    time: tnow(),
    type: 'baggage',
    status: 'Delivered'
  };
};
