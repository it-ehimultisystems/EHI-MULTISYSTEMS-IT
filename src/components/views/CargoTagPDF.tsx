import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import { EHILogoPDF } from "../EHILogoPDF";
import { AirlineLogoPDF } from "../AirlineLogoPDF";

// Fixed 100mm x 80mm label -- this is a discrete, fixed-size tag (like the
// XP-402B gap/die-cut label printer this was built for), not an
// open-ended continuous roll like the receipt PDFs. Both dimensions are
// therefore fixed, not just the width.
// 100mm = 283.46pt, 80mm = 226.77pt at 72pt/inch.
const PAGE_WIDTH = 283;
const PAGE_HEIGHT = 227;

export interface CargoTagPDFData {
  id: string; // AWB Tag number / Ref
  name: string; // Consignee / Passenger name
  route: string;
  pieceNo: string; // e.g. "1 of 5"
  weight: number | string;
  airline?: string;
  hubName?: string;
  date?: string;
  qrCodeDataUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  goldDivider: {
    height: 2,
    backgroundColor: "#C98E28",
    marginBottom: 6,
  },
  body: {
    flexDirection: "row",
    flex: 1,
  },
  leftCol: {
    flex: 1,
    paddingRight: 8,
  },
  rightCol: {
    width: 92,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  routeLabel: {
    fontSize: 6,
    color: "#6E7B8D",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  routeValue: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: "#084985",
    marginBottom: 6,
  },
  awbBand: {
    backgroundColor: "#084985",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 6,
    borderRadius: 2,
  },
  awbLabel: {
    fontSize: 6,
    color: "#FFBD59",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  awbValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  fieldBlock: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 6,
    color: "#6E7B8D",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  pieceBadge: {
    backgroundColor: "#FFF6E5",
    borderWidth: 1,
    borderColor: "#C98E28",
    borderRadius: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  pieceBadgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#C98E28",
  },
  qrImage: {
    width: 82,
    height: 82,
    marginBottom: 4,
  },
  qrCaption: {
    fontSize: 5.5,
    color: "#6E7B8D",
    textAlign: "center",
  },
  footer: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 3,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 5.5,
    color: "#94A3B8",
  },
});

const CargoTagOnlyPDF = ({ data }: { data: CargoTagPDFData }) => (
  <Document>
    <Page size={[PAGE_WIDTH, PAGE_HEIGHT]} style={styles.page}>
      <View style={styles.headerRow}>
        <EHILogoPDF width={70} />
        {data.airline ? <AirlineLogoPDF airline={data.airline} width={70} /> : null}
      </View>
      <View style={styles.goldDivider} />

      <View style={styles.body}>
        <View style={styles.leftCol}>
          <Text style={styles.routeLabel}>Route</Text>
          <Text style={styles.routeValue}>{data.route?.toUpperCase() || "—"}</Text>

          <View style={styles.awbBand}>
            <Text style={styles.awbLabel}>AWB / Tag</Text>
            <Text style={styles.awbValue}>{data.id}</Text>
          </View>

          <View style={styles.pieceBadge}>
            <Text style={styles.pieceBadgeText}>PIECE {data.pieceNo}</Text>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Weight</Text>
              <Text style={styles.fieldValue}>{data.weight} KG</Text>
            </View>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Hub</Text>
              <Text style={styles.fieldValue}>{data.hubName || "—"}</Text>
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Consignee</Text>
              <Text style={styles.fieldValue}>{data.name || "—"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightCol}>
          {data.qrCodeDataUrl ? (
            <Image src={data.qrCodeDataUrl} style={styles.qrImage} />
          ) : null}
          <Text style={styles.qrCaption}>Scan to track</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>EHI MULTISYSTEMS NIGERIA LIMITED</Text>
        <Text style={styles.footerText}>{data.date || ""}</Text>
      </View>
    </Page>
  </Document>
);

async function buildTagData(data: CargoTagPDFData): Promise<CargoTagPDFData> {
  if (data.qrCodeDataUrl) return data;
  const trackingUrl = `https://ehimultisystems.com/track?ref=${encodeURIComponent(data.id)}`;
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, { margin: 1, width: 240 });
    return { ...data, qrCodeDataUrl };
  } catch (e) {
    console.warn("Failed to generate QR code for tag PDF", e);
    return data;
  }
}

// Opens the tag in a new tab for printing via the browser's native print
// dialog -- this is the recommended path for the XP-402B and similar
// gap/die-cut label printers connected over USB, since it goes through
// the OS's own printer driver rather than raw Bluetooth GATT writes,
// sidestepping the chunking/speed/corruption issues that come with
// talking directly to a Bluetooth ESC/POS characteristic.
export const printCargoTagPDF = async (data: CargoTagPDFData) => {
  const withQr = await buildTagData(data);
  const blob = await pdf(<CargoTagOnlyPDF data={withQr} />).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url);
};

export const downloadCargoTagPDF = async (data: CargoTagPDFData) => {
  const withQr = await buildTagData(data);
  const blob = await pdf(<CargoTagOnlyPDF data={withQr} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `EHI-Tag-${data.id}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
