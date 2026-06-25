import { View, Text, Svg, Path } from '@react-pdf/renderer';

export const EHILogoPDF = ({ width = 120 }: { width?: number }) => (
  <View style={{ width, alignItems: 'center' }}>
    <Svg viewBox="0 0 400 200" width={width} height={width * 0.5}>
      <Path d="M 180 140 C 140 140 90 110 70 95 C 110 115 150 160 170 170 Z" fill="#000000" />
      <Path d="M 170 170 C 190 120 250 80 350 70 C 290 90 220 130 180 180 Z" fill="#000000" />
    </Svg>
    <Text style={{ fontSize: width * 0.35, fontWeight: 'heavy', color: '#000000', marginTop: -width * 0.15 }}>EHI</Text>
    <View style={{ backgroundColor: '#000000', paddingHorizontal: width * 0.05, paddingVertical: width * 0.02, marginTop: 2 }}>
      <Text style={{ fontSize: width * 0.065, color: '#FFFFFF', fontWeight: 'bold' }}>MULTISYSTEMS</Text>
    </View>
    <Text style={{ fontSize: width * 0.07, color: '#000000', fontWeight: 'bold', marginTop: 2, letterSpacing: 1 }}>NIGERIA LIMITED</Text>
  </View>
);
