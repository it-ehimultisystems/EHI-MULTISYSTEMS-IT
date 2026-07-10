import { View, Text, Image } from '@react-pdf/renderer';

// Previously this matched the airline name against a small hardcoded set
// of locally-bundled logo files -- completely disconnected from the
// dynamic Supabase-backed logo system (listAirlineLogos/airlineLogoUrl)
// that the actual Bluetooth thermal printing already uses. An airline
// added via Airline Logo Manager would print correctly on a receipt but
// never show up in a PDF. Now takes a pre-resolved logoUrl (or null) from
// the caller instead of guessing internally -- see resolveAirlineLogoUrl
// in lib/airlineLogos.ts, which does a real existence check before the
// PDF is built, so this component never depends on how react-pdf's
// <Image> happens to handle a 404 source.
export const AirlineLogoPDF = ({
  airline,
  logoUrl,
  width = 80,
}: {
  airline: string;
  logoUrl?: string | null;
  width?: number;
}) => {
  const boxHeight = width * 0.5;
  const boxStyle = { width, height: boxHeight, alignItems: 'center' as const, justifyContent: 'center' as const };
  const imgStyle = { width, height: boxHeight, objectFit: 'contain' as const };

  if (logoUrl) {
    return (
      <View style={boxStyle}>
        <Image src={logoUrl} style={imgStyle} />
      </View>
    );
  }

  return (
    <View style={boxStyle}>
      <Text style={{ fontSize: width * 0.15, color: '#000000', fontWeight: 700, textAlign: 'center' }}>{airline.toUpperCase()}</Text>
    </View>
  );
};
