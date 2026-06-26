import { PRICING } from './constants';
import { Transaction, PaymentMode } from './types';

export const fmt = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount).replace('NGN', '₦');
};

export const generatePaymentNarration = (hubCode: string, serial: string | number): string => {
  let code = (hubCode || 'XXX').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3);
  if (code.length < 2) code = code.padEnd(3, 'X');
  const d = new Date();
  const yymmdd = [
    d.getFullYear().toString().slice(2),
    (d.getMonth() + 1).toString().padStart(2, '0'),
    d.getDate().toString().padStart(2, '0')
  ].join('');
  const ser = serial.toString().padStart(3, '0');
  return `EHI-${code}-${yymmdd}-${ser}`;
};

export const extractNarrationFromText = (text: string): string | null => {
  const match = text.match(/EHI-[A-Z]{2,4}-\d{6}-\d{3,4}/i);
  return match ? match[0].toUpperCase() : null;
};

export const uid = (prefix: 'WB' | 'VJ' | 'AC' | 'MK' | 'CG' | 'TR'): string => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${dateStr}-${randomStr}`;
};

export const tnow = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

export function generatePickupPin(): string {
  return String(Math.floor(10000 + Math.random() * 90000));
}
