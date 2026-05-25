/**
 * Example usage of the QR Code Generator library
 */

import {
  generateQRCode,
  generateQRCodeSVG,
  generateQRCodeASCII,
  generateQRCodeDataURI,
  ErrorCorrectionLevel,
  QRRenderer
} from './src/index';

// Example 1: Basic QR Code generation
console.log('=== Example 1: Basic QR Code ===');
const basicQR = generateQRCode('Hello, World!');
console.log(`QR Code Size: ${basicQR.size}x${basicQR.size}`);
console.log(`Version: ${basicQR.version}`);
console.log(`Error Correction: ${basicQR.errorCorrectionLevel}`);
console.log();

// Example 2: QR Code with custom options
console.log('=== Example 2: Custom Options ===');
const customQR = generateQRCode('https://github.com', {
  errorCorrectionLevel: ErrorCorrectionLevel.H,
  margin: 4
});
console.log(`Size: ${customQR.size}x${customQR.size}`);
console.log();

// Example 3: ASCII rendering
console.log('=== Example 3: ASCII Art ===');
const ascii = generateQRCodeASCII('SCAN ME', {
  errorCorrectionLevel: ErrorCorrectionLevel.M
}, {
  margin: 2
});
console.log(ascii);

// Example 4: SVG generation
console.log('=== Example 4: SVG Generation ===');
const svg = generateQRCodeSVG('SVG Example', {}, {
  scale: 4,
  margin: 4
});
console.log('SVG Length:', svg.length, 'characters');
console.log('First 100 chars:', svg.substring(0, 100) + '...');
console.log();

// Example 5: Data URI for images
console.log('=== Example 5: Data URI ===');
const dataUri = generateQRCodeDataURI('Data URI Example');
console.log('Data URI Length:', dataUri.length, 'characters');
console.log('First 80 chars:', dataUri.substring(0, 80) + '...');
console.log();

// Example 6: Using renderer directly
console.log('=== Example 6: Direct Renderer Usage ===');
const qrCode = generateQRCode('Renderer Example', {
  errorCorrectionLevel: ErrorCorrectionLevel.Q
});

const array = QRRenderer.toArray(qrCode, { margin: 2 });
console.log(`Array size: ${array.length}x${array[0].length}`);

const canvasInstructions = QRRenderer.toCanvasInstructions(qrCode, {
  scale: 4,
  margin: 4
});
console.log(`Canvas size: ${canvasInstructions.width}x${canvasInstructions.height}`);
console.log(`Number of dark modules: ${canvasInstructions.modules.length}`);
console.log();

// Example 7: Different error correction levels
console.log('=== Example 7: Error Correction Levels ===');
const data = 'Error Correction Test';
const levels = [
  ErrorCorrectionLevel.L,
  ErrorCorrectionLevel.M,
  ErrorCorrectionLevel.Q,
  ErrorCorrectionLevel.H
];

levels.forEach(level => {
  const qr = generateQRCode(data, { errorCorrectionLevel: level });
  console.log(`Level ${level}: Size ${qr.size}x${qr.size}`);
});
console.log();

// Example 8: Numeric data (optimized encoding)
console.log('=== Example 8: Numeric Data ===');
const numericQR = generateQRCode('1234567890', {
  errorCorrectionLevel: ErrorCorrectionLevel.L
});
console.log(`Numeric QR Size: ${numericQR.size}x${numericQR.size}`);
console.log();

// Example 9: URL encoding
console.log('=== Example 9: URL Encoding ===');
const urls = [
  'https://example.com',
  'https://github.com/username/repo',
  'mailto:user@example.com'
];

urls.forEach(url => {
  const qr = generateQRCode(url);
  console.log(`${url} => ${qr.size}x${qr.size} (v${qr.version})`);
});
console.log();

// Example 10: Small ASCII QR Code
console.log('=== Example 10: Compact ASCII QR ===');
const compactASCII = generateQRCodeASCII('HI', {
  errorCorrectionLevel: ErrorCorrectionLevel.L
}, {
  margin: 1
});
console.log(compactASCII);

console.log('=== All examples completed! ===');
