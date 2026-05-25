/**
 * QR Code error correction levels
 */
export enum ErrorCorrectionLevel {
  /** Low - 7% of codewords can be restored */
  L = 'L',
  /** Medium - 15% of codewords can be restored */
  M = 'M',
  /** Quartile - 25% of codewords can be restored */
  Q = 'Q',
  /** High - 30% of codewords can be restored */
  H = 'H'
}

/**
 * QR Code encoding modes
 */
export enum EncodingMode {
  NUMERIC = 'numeric',
  ALPHANUMERIC = 'alphanumeric',
  BYTE = 'byte',
  KANJI = 'kanji'
}

/**
 * Options for QR code generation
 */
export interface QRCodeOptions {
  /** Error correction level (default: M) */
  errorCorrectionLevel?: ErrorCorrectionLevel;
  /** Margin size in modules (default: 4) */
  margin?: number;
  /** Mask pattern (0-7, default: auto-select) */
  maskPattern?: number;
}

/**
 * QR Code module (single cell) representation
 */
export interface QRModule {
  value: boolean;
  reserved: boolean;
}

/**
 * Generated QR Code data
 */
export interface QRCode {
  /** Size of the QR code (width and height in modules) */
  size: number;
  /** 2D array of modules (true = dark, false = light) */
  modules: boolean[][];
  /** Version number (currently 1-6) */
  version: number;
  /** Error correction level used */
  errorCorrectionLevel: ErrorCorrectionLevel;
}

/**
 * QR Code segment (encoded data chunk)
 */
export interface QRSegment {
  mode: EncodingMode;
  data: string;
  bitLength: number;
}
