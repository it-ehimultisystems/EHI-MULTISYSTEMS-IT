import { View, Text, Svg, Path, Circle } from '@react-pdf/renderer';

export const AirlineLogoPDF = ({ airline, width = 80 }: { airline: string; width?: number }) => {
  const norm = airline.toLowerCase();

  // AERO
  if (norm.includes('aero')) {
    return (
      <View style={{ width, alignItems: 'center' }}>
        <Text style={{ fontSize: width * 0.4, color: '#000000', fontWeight: 700 }}>aero</Text>
        <Svg viewBox="0 0 200 40" width={width} height={width * 0.2}>
          <Path d="M 50 40 L 70 40 C 100 40 120 10 150 0 L 130 0 C 100 0 80 30 50 40 Z" fill="#000000" />
          <Path d="M 60 30 L 80 30 C 110 30 130 0 160 -10 L 140 -10 C 110 -10 90 20 60 30 Z" fill="#000000" />
        </Svg>
        <Text style={{ fontSize: width * 0.08, color: '#000000', marginTop: 2 }}>The reliable way to fly</Text>
      </View>
    );
  }

  // ARIK
  if (norm.includes('arik')) {
    return (
      <View style={{ width, alignItems: 'center', flexDirection: 'row' }}>
        <Text style={{ fontSize: width * 0.45, color: '#000000', fontWeight: 700 }}>Arik</Text>
        <Svg viewBox="0 0 60 60" width={width * 0.4} height={width * 0.4}>
          <Path d="M 10 10 Q 30 40 35 40 Q 50 20 60 10 Q 40 30 35 55 Q 25 35 10 10 Z" fill="#000000" />
        </Svg>
      </View>
    );
  }

  // VALUEJET
  if (norm.includes('valuejet')) {
    return (
      <View style={{ width, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text style={{ fontSize: width * 0.35, color: '#000000', fontFamily: 'Times-Italic' }}>Value</Text>
          <Text style={{ fontSize: width * 0.35, color: '#000000', fontWeight: 700 }}>Jet</Text>
        </View>
        <Text style={{ fontSize: width * 0.08, color: '#000000', marginTop: 2 }}>A FLYFORVALUE AVIATION COMPANY</Text>
      </View>
    );
  }

  // UNITED NIGERIA
  if (norm.includes('united') || norm.includes('un')) {
    return (
      <View style={{ width, alignItems: 'center' }}>
        <Svg viewBox="0 0 100 50" width={width * 0.6} height={width * 0.3}>
          <Circle cx="50" cy="25" r="20" stroke="#000000" strokeWidth="3" fill="none" />
          <Path d="M 30 25 L 0 25 L 10 15 L 30 15 Z" fill="#000000" />
          <Path d="M 70 25 L 100 25 L 90 15 L 70 15 Z" fill="#000000" />
        </Svg>
        <Text style={{ fontSize: width * 0.25, color: '#000000', fontWeight: 700, marginTop: -width * 0.22, paddingBottom: width * 0.1 }}>un</Text>
        <Text style={{ fontSize: width * 0.1, color: '#000000', fontWeight: 700, marginTop: width * 0.05 }}>UNITED NIGERIA</Text>
      </View>
    );
  }

  // Fallback
  return (
    <View style={{ width, alignItems: 'center' }}>
      <Text style={{ fontSize: width * 0.15, color: '#000000', fontWeight: 700, textAlign: 'center' }}>{airline.toUpperCase()}</Text>
    </View>
  );
};
