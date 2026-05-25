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

## Quick Start (Next.js App Router)

Use a Server Component when QR data is known at render time:

```tsx
// app/qr/page.tsx
import { ErrorCorrectionLevel, generateQRCodeDataURI } from 'qr-code-generator';

export default function QRPage() {
  const dataUri = generateQRCodeDataURI('https://example.com', {
    errorCorrectionLevel: ErrorCorrectionLevel.M
  });

  return (
    <img
      src={dataUri}
      alt="QR code for https://example.com"
      width={192}
      height={192}
    />
  );
}
```

## Next.js Best Practices

For user-entered values, use a Client Component and memoize generation:

```tsx
// app/components/qr-preview.tsx
'use client';

import { useMemo, useState } from 'react';
import { ErrorCorrectionLevel, generateQRCodeDataURI } from 'qr-code-generator';

export function QRPreview() {
  const [value, setValue] = useState('https://example.com');

  const dataUri = useMemo(
    () =>
      generateQRCodeDataURI(value || 'https://example.com', {
        errorCorrectionLevel: ErrorCorrectionLevel.M
      }),
    [value]
  );

  return (
    <section>
      <label htmlFor="qr-input">URL</label>
      <input
        id="qr-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://example.com"
      />
      <img src={dataUri} alt={`QR code for ${value || 'https://example.com'}`} width={192} height={192} />
    </section>
  );
}
```

For shared/cached QR generation, use a Route Handler:

```ts
// app/api/qr/route.ts
import { NextRequest } from 'next/server';
import { ErrorCorrectionLevel, generateQRCodeSVG } from 'qr-code-generator';

export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get('text') || 'https://example.com';
  const safeText = text.slice(0, 1024);

  const svg = generateQRCodeSVG(safeText, {
    errorCorrectionLevel: ErrorCorrectionLevel.M
  });

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400'
    }
  });
}
```

## QR Image Examples

These sample outputs are embedded with absolute GitHub raw URLs so they render on both GitHub and npm.

### URL Example (`https://example.com`)

![QR code URL example](https://raw.githubusercontent.com/AaronAnablon/qrgenerator/main/assets/readme/qr-url-example.svg)

### Text Example (`HELLO WORLD`)

![QR code text example](https://raw.githubusercontent.com/AaronAnablon/qrgenerator/main/assets/readme/qr-text-example.svg)

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
