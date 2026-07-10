import { Image } from '@react-pdf/renderer';
import ehiLogo from '../assets/branding/ehi-logo-bw.png';
import ehiLogoCargo from '../assets/branding/ehi-logo-cargo.png';

export const EHILogoPDF = ({ width = 120, variant = 'default' }: { width?: number; variant?: 'default' | 'cargo' }) => (
  <Image src={variant === 'cargo' ? ehiLogoCargo : ehiLogo} style={{ width, height: width * 0.88 }} />
);
