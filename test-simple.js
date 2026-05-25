/**
 * Simple test with minimal data
 */

const {
    generateQRCode,
    generateQRCodeASCII,
    ErrorCorrectionLevel
} = require('./dist/index.js');

console.log('Testing with simple data...\n');

try {
    // Test with "HELLO WORLD"
    console.log('Test 1: "HELLO WORLD"');
    const ascii1 = generateQRCodeASCII('HELLO WORLD', {
        errorCorrectionLevel: ErrorCorrectionLevel.L
    }, {
        margin: 1
    });
    console.log(ascii1);
    console.log('\n');

    // Test with a number
    console.log('Test 2: "12345"');
    const ascii2 = generateQRCodeASCII('12345', {
        errorCorrectionLevel: ErrorCorrectionLevel.L
    }, {
        margin: 1
    });
    console.log(ascii2);

} catch (error) {
    console.error('Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
}
