export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.init();
  }

  // Initialize printer
  init() {
    this.buffer.push(0x1b, 0x40);
  }

  // Text alignment (0 = left, 1 = center, 2 = right)
  align(align: 0 | 1 | 2) {
    this.buffer.push(0x1b, 0x61, align);
  }

  // Set text size (1-8 for width/height multiplier)
  size(width: number, height: number) {
    const w = Math.min(8, Math.max(1, width)) - 1;
    const h = Math.min(8, Math.max(1, height)) - 1;
    this.buffer.push(0x1d, 0x21, (w << 4) | h);
  }

  // Bold text
  bold(on: boolean) {
    this.buffer.push(0x1b, 0x45, on ? 1 : 0);
  }

  // Print text
  text(str: string) {
    for (let i = 0; i < str.length; i++) {
      this.buffer.push(str.charCodeAt(i));
    }
  }

  // Print text with newline
  textLine(str: string) {
    this.text(str);
    this.newLine();
  }

  // Feed n lines
  newLine(n = 1) {
    for (let i = 0; i < n; i++) {
      this.buffer.push(0x0a);
    }
  }

  // Cut paper
  cut() {
    this.buffer.push(0x1d, 0x56, 0x41, 0x00);
  }

  // Get raw bytes
  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

export const printViaBluetooth = async (data: Uint8Array): Promise<void> => {
  try {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      throw new Error(
        "Web Bluetooth is not supported in this browser. Please use Chrome on Android or Desktop.",
      );
    }

    // Request thermal printer device
    // Most BLE ESC/POS printers use a standard UUID or just a generic request
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        "000018f0-0000-1000-8000-00805f9b34fb",
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
      ],
    });

    if (!device.gatt) throw new Error("Bluetooth GATT not found.");

    const server = await device.gatt.connect();

    // We try to find common thermal printer write characteristics
    let writeCharacteristic;
    const services = await server.getPrimaryServices();

    for (const service of services) {
      const characteristics = await service.getCharacteristics();
      for (const characteristic of characteristics) {
        if (
          characteristic.properties.write ||
          characteristic.properties.writeWithoutResponse
        ) {
          writeCharacteristic = characteristic;
          break;
        }
      }
      if (writeCharacteristic) break;
    }

    if (!writeCharacteristic)
      throw new Error(
        "Could not find a writable characteristic for this printer.",
      );

    // Web Bluetooth doesn't expose the negotiated ATT MTU, and Chrome on
    // Android will silently truncate a writeValue() call larger than it
    // instead of throwing. The default ATT MTU is 23 bytes (20 usable
    // payload), so 256-byte chunks were being clipped mid-write on many
    // Android/printer combos, corrupting everything downstream in the
    // stream (this is why the logo image and the fields right after it
    // were the ones coming out garbled). Use the universally-safe chunk
    // size with a short delay between writes so the printer's own buffer
    // isn't overrun even when writeValue resolves before printing finishes.
    const chunkSize = 20;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await writeCharacteristic.writeValue(chunk);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    // Give it a moment to finish printing before disconnecting
    setTimeout(() => {
      if (device.gatt?.connected) {
        device.gatt.disconnect();
      }
    }, 2000);
  } catch (error) {
    console.error("Bluetooth print error:", error);
    throw error;
  }
};
