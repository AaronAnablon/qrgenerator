/**
 * Generate HTML file with QR codes for visual testing
 */

const {
    generateQRCode,
    ErrorCorrectionLevel
} = require('./dist/index.js');
const fs = require('fs');

function qrToSVG(qr, scale = 8) {
    const margin = 4;
    const size = qr.size + (margin * 2);
    const pixelSize = size * scale;
    
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${pixelSize}" height="${pixelSize}" style="shape-rendering: crispEdges;">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;
    
    for (let row = 0; row < qr.size; row++) {
        for (let col = 0; col < qr.size; col++) {
            if (qr.modules[row][col]) {
                svg += `<rect x="${col + margin}" y="${row + margin}" width="1" height="1" fill="black"/>`;
            }
        }
    }
    
    svg += '</svg>';
    return svg;
}

const tests = [
    { name: 'HELLO WORLD', data: 'HELLO WORLD', ecLevel: ErrorCorrectionLevel.L },
    { name: 'Numeric', data: '12345', ecLevel: ErrorCorrectionLevel.L },
    { name: 'Example URL', data: 'https://example.com', ecLevel: ErrorCorrectionLevel.L },
];

let html = `<!DOCTYPE html>
<html>
<head>
    <title>QR Code Test Results</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1000px;
            margin: 20px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .qr-test {
            background: white;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .qr-test h2 {
            margin-top: 0;
            color: #333;
        }
        .qr-info {
            background: #f9f9f9;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 14px;
        }
        .qr-info p {
            margin: 5px 0;
        }
        .qr-code {
            display: inline-block;
            margin: 20px 0;
            border: 10px solid white;
            box-shadow: 0 0 0 1px #ddd;
        }
        .data-display {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            word-break: break-all;
            margin: 10px 0;
        }
        h1 {
            color: #444;
            text-align: center;
        }
        .instructions {
            background: #e3f2fd;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <h1>🔍 QR Code Generator - Test Results</h1>
    
    <div class="instructions">
        <h3>📱 How to Test:</h3>
        <ol>
            <li>Open this file in your browser</li>
            <li>Use your phone's camera or QR code scanner app</li>
            <li>Point it at each QR code below</li>
            <li>Verify it correctly reads the data shown</li>
        </ol>
    </div>
`;

for (const test of tests) {
    try {
        console.log(`Generating QR code for: ${test.name}`);
        const qr = generateQRCode(test.data, { errorCorrectionLevel: test.ecLevel });
        const svg = qrToSVG(qr);
        
        html += `
    <div class="qr-test">
        <h2>${test.name}</h2>
        <div class="qr-info">
            <p><strong>Version:</strong> ${qr.version}</p>
            <p><strong>Size:</strong> ${qr.size}x${qr.size} modules</p>
            <p><strong>Error Correction:</strong> ${qr.errorCorrectionLevel}</p>
        </div>
        <div class="data-display">
            <strong>Data:</strong> ${test.data}
        </div>
        <div class="qr-code">
            ${svg}
        </div>
    </div>
`;
    } catch (error) {
        console.error(`Error generating ${test.name}:`, error.message);
        html += `
    <div class="qr-test" style="border-color: #f44336;">
        <h2>${test.name} ❌</h2>
        <div style="color: #f44336;">
            <p><strong>Error:</strong> ${error.message}</p>
        </div>
    </div>
`;
    }
}

html += `
</body>
</html>`;

fs.writeFileSync('qr-test-results.html', html);
console.log('\n✅ Generated qr-test-results.html');
console.log('Open this file in your browser to see and scan the QR codes.\n');
