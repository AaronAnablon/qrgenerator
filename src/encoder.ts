import { EncodingMode, QRSegment } from './types';

/**
 * Encoder for QR code data
 */
export class QREncoder {
  private static readonly ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
  
  /**
   * Determine the best encoding mode for the input data
   */
  static detectMode(data: string): EncodingMode {
    if (this.isNumeric(data)) {
      return EncodingMode.NUMERIC;
    } else if (this.isAlphanumeric(data)) {
      return EncodingMode.ALPHANUMERIC;
    } else {
      return EncodingMode.BYTE;
    }
  }
  
  /**
   * Check if string contains only numeric characters
   */
  private static isNumeric(data: string): boolean {
    return /^\d+$/.test(data);
  }
  
  /**
   * Check if string contains only alphanumeric characters
   */
  private static isAlphanumeric(data: string): boolean {
    return data.split('').every(char => this.ALPHANUMERIC_CHARS.includes(char));
  }
  
  /**
   * Create a QR segment from input data
   */
  static createSegment(data: string, mode?: EncodingMode): QRSegment {
    const selectedMode = mode || this.detectMode(data);
    
    switch (selectedMode) {
      case EncodingMode.NUMERIC:
        return this.encodeNumeric(data);
      case EncodingMode.ALPHANUMERIC:
        return this.encodeAlphanumeric(data);
      case EncodingMode.BYTE:
        return this.encodeByte(data);
      default:
        throw new Error(`Unsupported encoding mode: ${selectedMode}`);
    }
  }
  
  /**
   * Encode data in numeric mode
   */
  private static encodeNumeric(data: string): QRSegment {
    let bitLength = 0;
    const groups = Math.floor(data.length / 3);
    const remainder = data.length % 3;
    
    bitLength = groups * 10;
    if (remainder === 1) bitLength += 4;
    if (remainder === 2) bitLength += 7;
    
    return {
      mode: EncodingMode.NUMERIC,
      data,
      bitLength
    };
  }
  
  /**
   * Encode data in alphanumeric mode
   */
  private static encodeAlphanumeric(data: string): QRSegment {
    const pairs = Math.floor(data.length / 2);
    const remainder = data.length % 2;
    
    const bitLength = pairs * 11 + (remainder ? 6 : 0);
    
    return {
      mode: EncodingMode.ALPHANUMERIC,
      data,
      bitLength
    };
  }
  
  /**
   * Encode data in byte mode
   */
  private static encodeByte(data: string): QRSegment {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);
    
    return {
      mode: EncodingMode.BYTE,
      data,
      bitLength: bytes.length * 8
    };
  }
  
  /**
   * Convert segment to bit stream
   */
  static segmentToBits(segment: QRSegment, version: number): number[] {
    const bits: number[] = [];
    
    // Add mode indicator
    const modeIndicator = this.getModeIndicator(segment.mode);
    this.appendBits(bits, modeIndicator, 4);
    
    // Add character count indicator
    const charCountBits = this.getCharCountBits(segment.mode, version);
    const charCount = segment.mode === EncodingMode.BYTE
      ? new TextEncoder().encode(segment.data).length
      : segment.data.length;
    this.appendBits(bits, charCount, charCountBits);
    
    // Add data bits
    switch (segment.mode) {
      case EncodingMode.NUMERIC:
        this.encodeNumericData(bits, segment.data);
        break;
      case EncodingMode.ALPHANUMERIC:
        this.encodeAlphanumericData(bits, segment.data);
        break;
      case EncodingMode.BYTE:
        this.encodeByteData(bits, segment.data);
        break;
    }
    
    return bits;
  }
  
  /**
   * Get mode indicator value
   */
  private static getModeIndicator(mode: EncodingMode): number {
    const indicators = {
      [EncodingMode.NUMERIC]: 0b0001,
      [EncodingMode.ALPHANUMERIC]: 0b0010,
      [EncodingMode.BYTE]: 0b0100,
      [EncodingMode.KANJI]: 0b1000
    };
    return indicators[mode];
  }
  
  /**
   * Get character count indicator bit length
   */
  private static getCharCountBits(mode: EncodingMode, version: number): number {
    if (version <= 9) {
      return mode === EncodingMode.NUMERIC ? 10 :
             mode === EncodingMode.ALPHANUMERIC ? 9 : 8;
    } else if (version <= 26) {
      return mode === EncodingMode.NUMERIC ? 12 :
             mode === EncodingMode.ALPHANUMERIC ? 11 : 16;
    } else {
      return mode === EncodingMode.NUMERIC ? 14 :
             mode === EncodingMode.ALPHANUMERIC ? 13 : 16;
    }
  }
  
  /**
   * Encode numeric data to bits
   */
  private static encodeNumericData(bits: number[], data: string): void {
    for (let i = 0; i < data.length; i += 3) {
      const chunk = data.substring(i, i + 3);
      const value = parseInt(chunk, 10);
      const bitCount = chunk.length === 3 ? 10 : chunk.length === 2 ? 7 : 4;
      this.appendBits(bits, value, bitCount);
    }
  }
  
  /**
   * Encode alphanumeric data to bits
   */
  private static encodeAlphanumericData(bits: number[], data: string): void {
    for (let i = 0; i < data.length; i += 2) {
      if (i + 1 < data.length) {
        const value = this.getAlphanumericValue(data[i]) * 45 + 
                     this.getAlphanumericValue(data[i + 1]);
        this.appendBits(bits, value, 11);
      } else {
        this.appendBits(bits, this.getAlphanumericValue(data[i]), 6);
      }
    }
  }
  
  /**
   * Encode byte data to bits
   */
  private static encodeByteData(bits: number[], data: string): void {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);
    
    for (const byte of bytes) {
      this.appendBits(bits, byte, 8);
    }
  }
  
  /**
   * Get alphanumeric character value
   */
  private static getAlphanumericValue(char: string): number {
    const index = this.ALPHANUMERIC_CHARS.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid alphanumeric character: ${char}`);
    }
    return index;
  }
  
  /**
   * Append bits to bit array
   */
  private static appendBits(bits: number[], value: number, bitCount: number): void {
    for (let i = bitCount - 1; i >= 0; i--) {
      bits.push((value >> i) & 1);
    }
  }
  
  /**
   * Convert bit array to byte array
   */
  static bitsToBytes(bits: number[]): number[] {
    const bytes: number[] = [];
    
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8 && i + j < bits.length; j++) {
        byte = (byte << 1) | bits[i + j];
      }
      // Pad last byte if needed
      if (i + 8 > bits.length) {
        byte <<= (8 - (bits.length % 8));
      }
      bytes.push(byte);
    }
    
    return bytes;
  }
}
