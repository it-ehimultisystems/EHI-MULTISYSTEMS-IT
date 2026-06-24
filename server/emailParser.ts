export interface ParsedBankAlert {
  bankName: string;
  amount: number;
  senderName: string;
  reference: string;
  dateString: string;
  parsedDate: string;
  rawText: string;
  confidence: 'exact' | 'high' | 'medium' | 'low';
  narrationCode?: string;
}

import { extractNarrationFromText } from '../src/lib/helpers';

function cleanAmount(val: string): number {
  return parseFloat(val.replace(/,/g, '').replace(/[^\d.]/g, ''));
}

function cleanSender(val: string): string {
  let cleaned = val.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/\b(LIMITED|LTD|NIG)\b/gi, '').trim();
  return cleaned;
}

function extractDate(val: string): string {
  // basic ISO conversion, assume the original is somewhat valid, fallback to current if unparseable
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString();
    return new Date().toISOString();
  } catch (e) {
    return new Date().toISOString();
  }
}

export function parseBankAlert(text: string): ParsedBankAlert {
  const narrationCode = extractNarrationFromText(text);

  let bankName = 'Unknown';
  let amount = 0;
  let senderName = '';
  let reference = '';
  let dateString = '';
  let confidence: 'exact' | 'high' | 'medium' | 'low' = 'low';

  const t = text.replace(/\n/g, ' ');

  if (/GTBank|Guaranty Trust/i.test(t)) {
    bankName = 'GTBank';
    const amtMatch = t.match(/credit of NGN\s*([\d,.]+)/i) || t.match(/NGN\s*([\d,.]+)\s*has been/i);
    if (amtMatch) amount = cleanAmount(amtMatch[1]);

    const senderMatch = t.match(/(?:By|From|Sender):\s*([^.]+(?:(?=Date:|Narration:|Remarks:|TRF\/)|$))/i);
    if (senderMatch) senderName = senderMatch[1].trim();

    const refMatch = t.match(/(?:Narration|Remarks):\s*([^.]+(?:(?=Date:|By:|From:|Sender:)|$))/i) || t.match(/(TRF\/[^\s.]+)/i);
    if (refMatch) reference = refMatch[1].trim();

    const dateMatch = t.match(/(?:Date|Value Date|Transaction Date):\s*([0-9a-zA-Z-:\s]+)(?:(?=Narration|Remarks|By|From|Sender|\.)|$)/i);
    if (dateMatch) dateString = dateMatch[1].trim();

  } else if (/UBA|United Bank for Africa/i.test(t)) {
    bankName = 'UBA';
    const amtMatch = t.match(/Amount:\s*(?:NGN)?\s*([\d,.]+)/i) || t.match(/amount of NGN\s*([\d,.]+)/i) || t.match(/credited with NGN\s*([\d,.]+)/i);
    if (amtMatch) amount = cleanAmount(amtMatch[1]);

    const senderMatch = t.match(/(?:From|Transferred by):\s*([^.]+(?:(?=Date:|Value Date:|Narration:|Reference:)|$))/i);
    if (senderMatch) senderName = senderMatch[1].trim();

    const refMatch = t.match(/(?:Narration|Reference):\s*([^.]+(?:(?=Date:|Value Date:|From:|Transferred by:)|$))/i);
    if (refMatch) reference = refMatch[1].trim();

    const dateMatch = t.match(/(?:Value Date|Date):\s*([0-9a-zA-Z-:\s]+)(?:(?=Narration|Reference|From|Transferred by|\.)|$)/i);
    if (dateMatch) dateString = dateMatch[1].trim();

  } else if (/Access Bank|Access Diamond/i.test(t)) {
    bankName = 'Access Bank';
    const amtMatch = t.match(/N\s*([\d,.]+)/i) || t.match(/credit alert.*NGN\s*([\d,.]+)/i) || t.match(/credited to.*NGN\s*([\d,.]+)/i);
    if (amtMatch) amount = cleanAmount(amtMatch[1]);

    const senderMatch = t.match(/(?:From|Originator):\s*([^.]+(?:(?=Date:|Narration:)|$))/i);
    if (senderMatch) senderName = senderMatch[1].trim();

  } else if (/Zenith Bank/i.test(t)) {
    bankName = 'Zenith Bank';
    const amtMatch = t.match(/NGN\s*([\d,.]+)/i) || t.match(/Credit Alert.*NGN\s*([\d,.]+)/i);
    if (amtMatch) amount = cleanAmount(amtMatch[1]);

  } else if (/Opay|OPay/i.test(t)) {
    bankName = 'Opay';
    const amtMatch = t.match(/₦\s*([\d,.]+)/i) || t.match(/received\s*₦\s*([\d,.]+)/i);
    if (amtMatch) amount = cleanAmount(amtMatch[1]);

    const senderMatch = t.match(/(?:from|sender)\s*([^.]+(?:(?=Date:|Reference:)|$))/i);
    if (senderMatch) senderName = senderMatch[1].trim();

  } else if (/Wema|ALAT/i.test(t)) {
    bankName = 'Wema Bank';
    const amtMatch = t.match(/₦\s*([\d,.]+)\s*Inflow/i) || t.match(/credited\s*₦\s*([\d,.]+)/i);
    if (amtMatch) amount = cleanAmount(amtMatch[1]);

  }

  if (amount === 0 || isNaN(amount)) {
    throw new Error("Could not extract valid amount from bank alert text.");
  }

  const parsedDate = dateString ? extractDate(dateString) : new Date().toISOString();
  
  senderName = cleanSender(senderName);

  if (narrationCode) {
    confidence = 'exact';
  } else if (amount && senderName && dateString) {
    confidence = 'high';
  } else if (amount && dateString) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    bankName,
    amount,
    senderName,
    reference,
    dateString,
    parsedDate,
    rawText: text,
    confidence,
    ...(narrationCode ? { narrationCode } : {})
  };
}
