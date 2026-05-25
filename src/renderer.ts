import { QRCode } from './types';

/**
 * Renderer utilities for QR codes
 */
export class QRRenderer {
  private static toBase64Utf8(input: string): string {
    const btoaFn = (globalThis as { btoa?: (data: string) => string }).btoa;
    if (typeof btoaFn === 'function') {
      const bytes = new TextEncoder().encode(input);
      let binary = '';
      for (const byte of bytes) {
        binary += String.fromCharCode(byte);
      }
      return btoaFn(binary);
    }

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(input, 'utf8').toString('base64');
    }

    throw new Error('No base64 encoder available in this runtime');
  }

  /**
   * Render QR code as SVG string
   */
  static toSVG(qrCode: QRCode, options: { scale?: number; margin?: number } = {}): string {
    const scale = options.scale ?? 4;
    const margin = options.margin ?? 4;
    const size = qrCode.size + margin * 2;
    const width = size * scale;
    const height = size * scale;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${size} ${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="#ffffff"/>`;
    svg += '<path d="';
    
    for (let row = 0; row < qrCode.size; row++) {
      for (let col = 0; col < qrCode.size; col++) {
        if (qrCode.modules[row][col]) {
          svg += `M${col + margin},${row + margin}h1v1h-1z`;
        }
      }
    }
    
    svg += '" fill="#000000"/>';
    svg += '</svg>';
    
    return svg;
  }
  
  /**
   * Render QR code as ASCII art
   */
  static toASCII(qrCode: QRCode, options: { margin?: number; inverse?: boolean } = {}): string {
    const margin = options.margin ?? 2;
    const inverse = options.inverse || false;
    const darkChar = inverse ? '  ' : '██';
    const lightChar = inverse ? '██' : '  ';
    
    let result = '';
    
    // Top margin
    for (let i = 0; i < margin; i++) {
      result += lightChar.repeat(qrCode.size + margin * 2) + '\n';
    }
    
    // QR code with side margins
    for (let row = 0; row < qrCode.size; row++) {
      result += lightChar.repeat(margin);
      for (let col = 0; col < qrCode.size; col++) {
        result += qrCode.modules[row][col] ? darkChar : lightChar;
      }
      result += lightChar.repeat(margin) + '\n';
    }
    
    // Bottom margin
    for (let i = 0; i < margin; i++) {
      result += lightChar.repeat(qrCode.size + margin * 2) + '\n';
    }
    
    return result;
  }
  
  /**
   * Render QR code as data URI (base64 encoded SVG)
   */
  static toDataURI(qrCode: QRCode, options: { scale?: number; margin?: number } = {}): string {
    const svg = this.toSVG(qrCode, options);
    const base64 = this.toBase64Utf8(svg);
    return `data:image/svg+xml;base64,${base64}`;
  }
  
  /**
   * Render QR code as 2D boolean array
   */
  static toArray(qrCode: QRCode, options: { margin?: number } = {}): boolean[][] {
    const margin = options.margin ?? 0;
    
    if (margin === 0) {
      return qrCode.modules.map(row => [...row]);
    }
    
    const size = qrCode.size + margin * 2;
    const result: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
    
    for (let row = 0; row < qrCode.size; row++) {
      for (let col = 0; col < qrCode.size; col++) {
        result[row + margin][col + margin] = qrCode.modules[row][col];
      }
    }
    
    return result;
  }
  
  /**
   * Get QR code as HTML canvas drawing instructions
   */
  static toCanvasInstructions(qrCode: QRCode, options: { scale?: number; margin?: number } = {}): {
    width: number;
    height: number;
    modules: Array<{ x: number; y: number }>;
  } {
    const scale = options.scale || 4;
    const margin = options.margin ?? 4;
    const size = qrCode.size + margin * 2;
    
    const modules: Array<{ x: number; y: number }> = [];
    
    for (let row = 0; row < qrCode.size; row++) {
      for (let col = 0; col < qrCode.size; col++) {
        if (qrCode.modules[row][col]) {
          modules.push({
            x: (col + margin) * scale,
            y: (row + margin) * scale
          });
        }
      }
    }
    
    return {
      width: size * scale,
      height: size * scale,
      modules
    };
  }
}
