/**
 * QR Code Generator Library
 * 
 * A TypeScript library for generating QR codes with support for multiple
 * error correction levels and rendering formats.
 * 
 * @example
 * ```typescript
 * import { generateQRCode, ErrorCorrectionLevel } from 'qr-code-generator';
 * 
 * const qrCode = generateQRCode('Hello, World!', {
 *   errorCorrectionLevel: ErrorCorrectionLevel.M
 * });
 * 
 * console.log(qrCode.size); // QR code size in modules
 * ```
 */

export { ErrorCorrectionLevel, EncodingMode } from './types';
export type { QRCode, QRCodeOptions, QRSegment, QRModule } from './types';
export { QRCodeGenerator } from './generator';
export { QRRenderer } from './renderer';
export { QREncoder } from './encoder';

import { QRCodeGenerator } from './generator';
import { QRRenderer } from './renderer';
import type { QRCode, QRCodeOptions } from './types';

/**
 * Generate a QR code from text data
 * 
 * @param data - The text data to encode
 * @param options - QR code generation options
 * @returns Generated QR code object
 * 
 * @example
 * ```typescript
 * const qrCode = generateQRCode('https://example.com');
 * console.log(qrCode.modules); // 2D array of boolean values
 * ```
 */
export function generateQRCode(data: string, options?: QRCodeOptions): QRCode {
  return QRCodeGenerator.generate(data, options);
}

/**
 * Generate a QR code and render it as SVG
 * 
 * @param data - The text data to encode
 * @param options - QR code generation options
 * @param renderOptions - SVG rendering options
 * @returns SVG string
 * 
 * @example
 * ```typescript
 * const svg = generateQRCodeSVG('Hello, World!', {}, { scale: 4 });
 * ```
 */
export function generateQRCodeSVG(
  data: string,
  options?: QRCodeOptions,
  renderOptions?: { scale?: number; margin?: number }
): string {
  const qrCode = QRCodeGenerator.generate(data, options);
  return QRRenderer.toSVG(qrCode, renderOptions);
}

/**
 * Generate a QR code and render it as ASCII art
 * 
 * @param data - The text data to encode
 * @param options - QR code generation options
 * @param renderOptions - ASCII rendering options
 * @returns ASCII art string
 * 
 * @example
 * ```typescript
 * const ascii = generateQRCodeASCII('Hello!');
 * console.log(ascii);
 * ```
 */
export function generateQRCodeASCII(
  data: string,
  options?: QRCodeOptions,
  renderOptions?: { margin?: number; inverse?: boolean }
): string {
  const qrCode = QRCodeGenerator.generate(data, options);
  return QRRenderer.toASCII(qrCode, renderOptions);
}

/**
 * Generate a QR code and render it as a data URI
 * 
 * @param data - The text data to encode
 * @param options - QR code generation options
 * @param renderOptions - Data URI rendering options
 * @returns Data URI string
 * 
 * @example
 * ```typescript
 * const uri = generateQRCodeDataURI('https://example.com');
 * // Use in HTML: <img src="${uri}" />
 * ```
 */
export function generateQRCodeDataURI(
  data: string,
  options?: QRCodeOptions,
  renderOptions?: { scale?: number; margin?: number }
): string {
  const qrCode = QRCodeGenerator.generate(data, options);
  return QRRenderer.toDataURI(qrCode, renderOptions);
}
