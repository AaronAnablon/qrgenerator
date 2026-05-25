/**
 * TypeScript Usage Examples
 * This file demonstrates TypeScript-specific features and type safety
 */

import {
  generateQRCode,
  generateQRCodeSVG,
  generateQRCodeASCII,
  ErrorCorrectionLevel,
  QRCode,
  QRCodeOptions,
  QRRenderer,
  EncodingMode
} from './src/index';

// Example 1: Type-safe options
const options: QRCodeOptions = {
  errorCorrectionLevel: ErrorCorrectionLevel.H,
  margin: 4,
  maskPattern: undefined // Auto-select
};

// Example 2: Generate with full type checking
const qrCode: QRCode = generateQRCode('TypeScript!', options);

// Example 3: Type inference works
const autoQR = generateQRCode('Auto-typed');
// TypeScript knows autoQR is of type QRCode

// Example 4: Enum usage with type safety
const levels: ErrorCorrectionLevel[] = [
  ErrorCorrectionLevel.L,
  ErrorCorrectionLevel.M,
  ErrorCorrectionLevel.Q,
  ErrorCorrectionLevel.H
];

// Example 5: Type-safe renderer options
interface SVGOptions {
  scale?: number;
  margin?: number;
}

const svgOptions: SVGOptions = {
  scale: 8,
  margin: 4
};

const svg: string = generateQRCodeSVG('SVG', options, svgOptions);

// Example 6: Working with QR code data
function analyzeQRCode(qr: QRCode): void {
  console.log(`Analyzing QR Code:`);
  console.log(`- Size: ${qr.size}x${qr.size}`);
  console.log(`- Version: ${qr.version}`);
  console.log(`- Error Correction: ${qr.errorCorrectionLevel}`);
  console.log(`- Total modules: ${qr.modules.length * qr.modules[0].length}`);
  
  // Count dark modules
  let darkCount = 0;
  for (const row of qr.modules) {
    for (const module of row) {
      if (module) darkCount++;
    }
  }
  console.log(`- Dark modules: ${darkCount}`);
  console.log(`- Light modules: ${qr.size * qr.size - darkCount}`);
}

// Example 7: Generic function with QR codes
function processQRCode<T>(
  data: string,
  processor: (qr: QRCode) => T
): T {
  const qr = generateQRCode(data);
  return processor(qr);
}

// Usage
const result = processQRCode('Process me', (qr) => {
  return {
    size: qr.size,
    hasData: qr.modules.length > 0
  };
});

// Example 8: Custom QR code renderer with types
class CustomRenderer {
  static toJSON(qr: QRCode): string {
    return JSON.stringify({
      size: qr.size,
      version: qr.version,
      errorCorrection: qr.errorCorrectionLevel,
      modules: qr.modules
    }, null, 2);
  }
  
  static toCompressedString(qr: QRCode): string {
    return qr.modules
      .map(row => row.map(m => m ? '1' : '0').join(''))
      .join('');
  }
}

// Example 9: Error handling with types
function safeGenerateQR(data: string): QRCode | null {
  try {
    return generateQRCode(data);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`QR generation failed: ${error.message}`);
    }
    return null;
  }
}

// Example 10: Builder pattern with types
class QRCodeBuilder {
  private data: string = '';
  private options: QRCodeOptions = {};
  
  withData(data: string): this {
    this.data = data;
    return this;
  }
  
  withErrorCorrection(level: ErrorCorrectionLevel): this {
    this.options.errorCorrectionLevel = level;
    return this;
  }
  
  withMargin(margin: number): this {
    this.options.margin = margin;
    return this;
  }
  
  build(): QRCode {
    if (!this.data) {
      throw new Error('Data is required');
    }
    return generateQRCode(this.data, this.options);
  }
  
  buildSVG(scale: number = 4): string {
    return generateQRCodeSVG(this.data, this.options, { scale });
  }
}

// Usage of builder
const builtQR = new QRCodeBuilder()
  .withData('Built with pattern')
  .withErrorCorrection(ErrorCorrectionLevel.Q)
  .withMargin(2)
  .build();

// Example 11: Type guards
function isValidQRCode(obj: any): obj is QRCode {
  return (
    typeof obj === 'object' &&
    typeof obj.size === 'number' &&
    Array.isArray(obj.modules) &&
    typeof obj.version === 'number' &&
    typeof obj.errorCorrectionLevel === 'string'
  );
}

// Example 12: Readonly QR Code wrapper
class ReadOnlyQRCode {
  readonly size: number;
  readonly version: number;
  readonly errorCorrectionLevel: ErrorCorrectionLevel;
  private readonly _modules: ReadonlyArray<ReadonlyArray<boolean>>;
  
  constructor(qr: QRCode) {
    this.size = qr.size;
    this.version = qr.version;
    this.errorCorrectionLevel = qr.errorCorrectionLevel;
    this._modules = qr.modules.map(row => [...row]);
  }
  
  get modules(): ReadonlyArray<ReadonlyArray<boolean>> {
    return this._modules;
  }
  
  getModule(row: number, col: number): boolean {
    if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
      throw new Error('Coordinates out of bounds');
    }
    return this._modules[row][col];
  }
}

// Run examples
console.log('=== TypeScript Examples ===\n');

analyzeQRCode(qrCode);
console.log('\nGenerated QR Code:', result);

const customJSON = CustomRenderer.toJSON(autoQR);
console.log('\nCustom JSON format (first 200 chars):');
console.log(customJSON.substring(0, 200) + '...');

const safeQR = safeGenerateQR('Safe generation');
if (safeQR) {
  console.log(`\nSafely generated QR: ${safeQR.size}x${safeQR.size}`);
}

console.log('\nBuilder pattern QR:', `${builtQR.size}x${builtQR.size}`);

const readonlyQR = new ReadOnlyQRCode(qrCode);
console.log(`\nReadonly QR module at (0,0): ${readonlyQR.getModule(0, 0)}`);

console.log('\n=== All TypeScript examples completed! ===');

// Type assertions
export type {
  QRCode,
  QRCodeOptions,
  ErrorCorrectionLevel
};
