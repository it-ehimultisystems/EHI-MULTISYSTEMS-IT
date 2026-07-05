import {
  encoder, INIT, CENTER, LEFT, TEXT_NORMAL, TEXT_DOUBLE_HEIGHT,
  BOLD_ON, BOLD_OFF, REVERSE_ON, REVERSE_OFF, FEED_AND_CUT,
  concatChunks, brandingHeader, fieldRow, divider,
  getAirlineLogoRaster, imageToEscPosRaster, qrAsRaster
} from './escposShared';
import { printViaBluetooth } from './escpos';

export interface CargoTagData {
  id: string; // AWB Tag number / Ref
  name: string; // Consignee / Passenger name
  route: string;
  pieceNo: string; // e.g. "1 of 5"
  weight: number | string;
  airline?: string;
  hubName?: string;
  date?: string;
}

export async function compileSingleTag(item: CargoTagData, width: '58mm' | '80mm'): Promise<Uint8Array> {
  const maxChars = width === '58mm' ? 32 : 48;
  const chunks: Uint8Array[] = [
    new Uint8Array(INIT),
    ...(await brandingHeader())
  ];

  const airlineRaster = await getAirlineLogoRaster(item.airline || '', 120);
  if (airlineRaster) {
    chunks.push(airlineRaster);
    chunks.push(encoder.encode('\n'));
    chunks.push(new Uint8Array(BOLD_ON));
    chunks.push(encoder.encode(`${(item.airline || '').toUpperCase()}\n\n`));
    chunks.push(new Uint8Array(BOLD_OFF));
  } else if (item.airline) {
    chunks.push(new Uint8Array(BOLD_ON));
    chunks.push(encoder.encode(`${item.airline.toUpperCase()}\n\n`));
    chunks.push(new Uint8Array(BOLD_OFF));
  }

  chunks.push(new Uint8Array(CENTER));
  chunks.push(new Uint8Array(BOLD_ON));
  chunks.push(encoder.encode("CARGO ROUTING TAG\n\n"));
  
  if (item.route) {
    chunks.push(new Uint8Array(TEXT_DOUBLE_HEIGHT));
    chunks.push(encoder.encode(`${item.route.toUpperCase()}\n`));
    chunks.push(new Uint8Array(TEXT_NORMAL));
  }
  
  chunks.push(new Uint8Array(TEXT_DOUBLE_HEIGHT));
  chunks.push(encoder.encode(`AWB: ${item.id}\n`));
  chunks.push(new Uint8Array(TEXT_NORMAL));
  chunks.push(encoder.encode('\n'));

  // Use qrAsRaster for the QR code
  const trackingUrl = `https://ehimultisystems.com/track?ref=${encodeURIComponent(item.id)}`;
  chunks.push(await qrAsRaster(trackingUrl, width === '58mm' ? 140 : 180));
  chunks.push(encoder.encode('\n\n'));

    chunks.push(new Uint8Array(LEFT));
  chunks.push(encoder.encode(divider(maxChars, '=')));
  chunks.push(new Uint8Array(CENTER));
  chunks.push(new Uint8Array(TEXT_DOUBLE_HEIGHT), new Uint8Array(BOLD_ON));
  chunks.push(encoder.encode(`PIECE ${item.pieceNo}\n`));
  chunks.push(new Uint8Array(BOLD_OFF), new Uint8Array(TEXT_NORMAL));
  chunks.push(encoder.encode(`WEIGHT: ${item.weight} KG\n`));
  chunks.push(encoder.encode(divider(maxChars, '=')));
  
  chunks.push(new Uint8Array(LEFT));
  if (item.name) chunks.push(encoder.encode(`CONSIGNEE: ${item.name}\n`));
  if (item.airline) chunks.push(encoder.encode(`AIRLINE: ${item.airline}\n`));
  if (item.hubName) chunks.push(encoder.encode(`HUB: ${item.hubName}\n`));
  if (item.date) chunks.push(encoder.encode(`DATE: ${item.date}\n`));
  chunks.push(encoder.encode(divider(maxChars)));

  chunks.push(new Uint8Array(FEED_AND_CUT));
  return concatChunks(chunks);
}

export async function compileCargoTagStream(tx: any, width: '58mm' | '80mm'): Promise<Uint8Array> {
  const piecesCount = tx.pieces || 1;
  const tagChunks: Uint8Array[] = [];
  
  for (let i = 1; i <= piecesCount; i++) {
    const tagData: CargoTagData = {
      id: tx.awbTagNumber || tx.entryRef || tx.id,
      name: tx.consignee || tx.name,
      route: tx.route || '',
      pieceNo: `${i} of ${piecesCount}`,
      weight: Math.round((tx.kg || 0) / piecesCount) || tx.kg || 0,
      airline: tx.airline,
      hubName: tx.hubName,
      date: tx.date || new Date().toLocaleDateString('en-GB'),
    };
    tagChunks.push(await compileSingleTag(tagData, width));
  }
  
  return concatChunks(tagChunks);
}

export async function printBluetoothTag(tx: any, width: '58mm' | '80mm'): Promise<void> {
  const bytes = await compileCargoTagStream(tx, width);
  await printViaBluetooth(bytes);
}
