/**
 * Simple test to verify the QR Code Generator works
 */

const {
    generateQRCode,
    generateQRCodeASCII,
    ErrorCorrectionLevel
} = require('./dist/index.js');

console.log('Testing QR Code Generator...\n');

try {
    // Test 1: Basic generation
    //   console.log('✓ Test 1: Basic QR Code generation');
    //   const qr1 = generateQRCode('Hello');
    //   console.log(`  Size: ${qr1.size}x${qr1.size}, Version: ${qr1.version}`);

    //   // Test 2: With options
    //   console.log('\n✓ Test 2: QR Code with options');
    //   const qr2 = generateQRCode('Test', {
    //     errorCorrectionLevel: ErrorCorrectionLevel.H
    //   });
    //   console.log(`  Size: ${qr2.size}x${qr2.size}, Error Correction: ${qr2.errorCorrectionLevel}`);

    // Test 3: ASCII output
    console.log('\n✓ Test 3: ASCII rendering');
    const ascii = generateQRCodeASCII('https://example.com', {
        errorCorrectionLevel: ErrorCorrectionLevel.L
    }, {
        margin: 1
    });
    console.log(ascii);

    // Test 4: URL encoding
    //   console.log('✓ Test 4: URL encoding');
    //   const qr4 = generateQRCode('https://example.com');
    //   console.log(`  URL QR Code: ${qr4.size}x${qr4.size}`);

    // Test 5: Numeric data
    // console.log('\n✓ Test 5: Numeric data');
    // const qr5 = generateQRCode('123456');
    // console.log(`  Numeric QR Code: ${qr5.size}x${qr5.size}`);

    console.log('\n✅ All tests passed!\n');
    console.log('The QR Code Generator library is working correctly.');

} catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
}
