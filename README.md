# QR Code Generator

A TypeScript library for generating QR codes with no runtime dependencies.

## Features

- TypeScript types included
- Output formats: SVG, ASCII, data URI, and raw module array
- Error correction levels: `L`, `M`, `Q`, `H`
- Automatic mask selection
- QR Code versions supported: `1` to `6`

## Installation

```bash
npm install qr-code-generator
```

## Quick Start

```ts
import { generateQRCode, ErrorCorrectionLevel } from 'qr-code-generator';

const qr = generateQRCode('https://example.com', {
  errorCorrectionLevel: ErrorCorrectionLevel.M
});

console.log(qr.version);
console.log(qr.size);
```

## Next.js Usage

For client-side rendering in Next.js, use a client component:

```tsx
'use client';

import { generateQRCodeSVG } from 'qr-code-generator';

export default function QRPreview() {
  const svg = generateQRCodeSVG('https://example.com');

  return (
    <div
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-label="QR code"
    />
  );
}
```

## API

### `generateQRCode(data, options?)`

Returns a `QRCode` object:

- `size`
- `modules`
- `version`
- `errorCorrectionLevel`

### `generateQRCodeSVG(data, options?, renderOptions?)`

Returns an SVG string.

### `generateQRCodeASCII(data, options?, renderOptions?)`

Returns a terminal-friendly ASCII representation.

### `generateQRCodeDataURI(data, options?, renderOptions?)`

Returns a `data:image/svg+xml;base64,...` URI.

## Build

```bash
npm install
npm run build
```

## License

MIT
