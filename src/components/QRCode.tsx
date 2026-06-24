import { QRCodeCanvas } from 'qrcode.react';

export const QRCode = ({ id, size = 150 }: { id: string; size?: number }) => {
  return (
    <QRCodeCanvas 
      value={id} 
      size={size}
      level="H"
      includeMargin={true}
      bgColor="#FFFFFF"
      fgColor="#000000"
    />
  );
};

