import { basename } from 'node:path';

import { uploadPublicFile } from '../common/object-storage.js';

type ArtworkTextElement = {
  type: 'text';
  x: number;
  y: number;
  content: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
};

type ArtworkImageElement = {
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  assetUrl: string;
  minimumDpi?: number;
};

type ArtworkElement = ArtworkTextElement | ArtworkImageElement;

type ArtworkSurface = {
  width: number;
  height: number;
  elements: ArtworkElement[];
};

type RenderArtworkParams = {
  productionSku: string;
  orderNumber: string;
  productName: string;
  canvasJson: unknown;
};

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function escapePdfText(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
}

function normalizeHexColor(hex?: string) {
  if (!hex?.startsWith('#') || ![4, 7].includes(hex.length)) {
    return { hex: '#0f172a', rgb: [0.06, 0.09, 0.16] as const };
  }

  const expanded =
    hex.length === 4
      ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
      : hex;

  const r = Number.parseInt(expanded.slice(1, 3), 16) / 255;
  const g = Number.parseInt(expanded.slice(3, 5), 16) / 255;
  const b = Number.parseInt(expanded.slice(5, 7), 16) / 255;

  return {
    hex: expanded,
    rgb: [Number(r.toFixed(3)), Number(g.toFixed(3)), Number(b.toFixed(3))] as const,
  };
}

function normalizeSurface(canvasJson: unknown): ArtworkSurface {
  const payload =
    typeof canvasJson === 'object' && canvasJson && 'surfaces' in canvasJson
      ? (canvasJson as { surfaces?: unknown[] })
      : null;

  const rawSurface =
    payload?.surfaces && payload.surfaces[0] && typeof payload.surfaces[0] === 'object'
      ? (payload.surfaces[0] as {
          width?: number;
          height?: number;
          elements?: unknown[];
        })
      : null;

  const elements: ArtworkElement[] = [];

  if (Array.isArray(rawSurface?.elements)) {
    for (const element of rawSurface.elements) {
      const candidate =
        typeof element === 'object' && element ? (element as Record<string, unknown>) : null;
      if (!candidate || typeof candidate.type !== 'string') {
        continue;
      }

      if (candidate.type === 'text' && typeof candidate.content === 'string') {
        elements.push({
          type: 'text',
          x: typeof candidate.x === 'number' ? candidate.x : 1,
          y: typeof candidate.y === 'number' ? candidate.y : 1,
          content: candidate.content,
          fontFamily:
            typeof candidate.fontFamily === 'string' ? candidate.fontFamily : 'Helvetica',
          fontSize: typeof candidate.fontSize === 'number' ? candidate.fontSize : 42,
          color: typeof candidate.color === 'string' ? candidate.color : '#ffffff',
        });
        continue;
      }

      if (candidate.type === 'image' && typeof candidate.assetUrl === 'string') {
        elements.push({
          type: 'image',
          x: typeof candidate.x === 'number' ? candidate.x : 1,
          y: typeof candidate.y === 'number' ? candidate.y : 1,
          width: typeof candidate.width === 'number' ? candidate.width : 4,
          height: typeof candidate.height === 'number' ? candidate.height : 4,
          assetUrl: candidate.assetUrl,
          minimumDpi:
            typeof candidate.minimumDpi === 'number' ? candidate.minimumDpi : undefined,
        });
      }
    }
  }

  return {
    width: rawSurface?.width && rawSurface.width > 0 ? rawSurface.width : 10,
    height: rawSurface?.height && rawSurface.height > 0 ? rawSurface.height : 10,
    elements,
  };
}

function buildSvgPreview(
  surface: ArtworkSurface,
  productName: string,
  orderNumber: string,
  widthPx: number,
  heightPx: number,
) {
  const previewWidth = Math.min(widthPx, 1600);
  const previewHeight = Math.max(1, Math.round((previewWidth / widthPx) * heightPx));

  const fallbackText: ArtworkTextElement = {
    type: 'text',
    x: surface.width * 0.12,
    y: surface.height * 0.3,
    content: `${productName} · ${orderNumber}`,
    fontFamily: 'Helvetica',
    fontSize: 42,
    color: '#ffffff',
  };

  const textElements = surface.elements.filter(
    (element): element is ArtworkTextElement => element.type === 'text',
  );
  const imageElements = surface.elements.filter(
    (element): element is ArtworkImageElement => element.type === 'image',
  );

  const svgImages = imageElements
    .map((element) => {
      const x = element.x * 300;
      const y = element.y * 300;
      const width = Math.max(220, element.width * 300);
      const height = Math.max(220, element.height * 300);

      return `<g>
  <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="28" fill="rgba(15,23,42,0.18)" stroke="rgba(255,255,255,0.22)" stroke-width="6" />
  <image href="${escapeXml(element.assetUrl)}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />
</g>`;
    })
    .join('');

  const svgText = (textElements.length ? textElements : [fallbackText])
    .map((element) => {
      const color = normalizeHexColor(element.color);
      const x = element.x * 300;
      const y = element.y * 300;
      const fontSize = Math.max(28, Math.round(element.fontSize ?? 42));

      return `<text x="${x}" y="${y}" fill="${color.hex}" font-family="${escapeXml(
        element.fontFamily ?? 'Helvetica',
      )}" font-size="${fontSize}" font-weight="700">${escapeXml(element.content)}</text>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${previewWidth}" height="${previewHeight}" viewBox="0 0 ${widthPx} ${heightPx}">
  <defs>
    <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
      <stop offset="0%" stop-color="#164e63" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>
  <rect width="${widthPx}" height="${heightPx}" rx="48" fill="url(#bg)" />
  <rect x="24" y="24" width="${Math.max(widthPx - 48, 0)}" height="${Math.max(heightPx - 48, 0)}" rx="36" fill="none" stroke="rgba(255,255,255,0.24)" stroke-width="6" />
  <text x="80" y="120" fill="#dbeafe" font-family="Helvetica" font-size="54" font-weight="700">${escapeXml(
    productName,
  )}</text>
  <text x="80" y="188" fill="#94a3b8" font-family="Helvetica" font-size="34">${escapeXml(
    orderNumber,
  )}</text>
  ${svgImages}
  ${svgText}
</svg>`;
}

function buildPdfDocument(
  surface: ArtworkSurface,
  productName: string,
  orderNumber: string,
  pageWidthPts: number,
  pageHeightPts: number,
) {
  const commands = [
    '0.09 0.12 0.17 rg',
    `0 0 ${pageWidthPts.toFixed(2)} ${pageHeightPts.toFixed(2)} re f`,
    '0.86 0.92 0.99 rg',
    'BT',
    '/F1 18 Tf',
    `1 0 0 1 36 ${(pageHeightPts - 36).toFixed(2)} Tm`,
    `(${escapePdfText(productName)}) Tj`,
    'ET',
    '0.62 0.69 0.76 rg',
    'BT',
    '/F1 12 Tf',
    `1 0 0 1 36 ${(pageHeightPts - 58).toFixed(2)} Tm`,
    `(${escapePdfText(orderNumber)}) Tj`,
    'ET',
  ];

  const textElements = surface.elements.filter(
    (element): element is ArtworkTextElement => element.type === 'text',
  );
  const imageElements = surface.elements.filter(
    (element): element is ArtworkImageElement => element.type === 'image',
  );

  const printableTextElements = textElements.length
    ? textElements
    : [
        {
          type: 'text' as const,
          x: surface.width * 0.12,
          y: surface.height * 0.3,
          content: `${productName} · ${orderNumber}`,
          fontFamily: 'Helvetica',
          fontSize: 42,
          color: '#ffffff',
        },
      ];

  for (const element of printableTextElements) {
    const { rgb } = normalizeHexColor(element.color);
    const fontSize = Math.max(14, Math.round((element.fontSize ?? 42) * 0.8));
    const x = Math.max(24, element.x * 72);
    const y = Math.max(24, pageHeightPts - element.y * 72);

    commands.push(
      `${rgb[0]} ${rgb[1]} ${rgb[2]} rg`,
      'BT',
      `/F1 ${fontSize} Tf`,
      `1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`,
      `(${escapePdfText(element.content)}) Tj`,
      'ET',
    );
  }

  imageElements.forEach((element, index) => {
    const x = Math.max(24, element.x * 72);
    const y = Math.max(24, pageHeightPts - element.y * 72);
    const label = `Imagen ${index + 1}: ${basename(element.assetUrl)}`;

    commands.push(
      '0.93 0.95 0.98 rg',
      `${x.toFixed(2)} ${(y - 24).toFixed(2)} 220 18 re f`,
      '0.12 0.16 0.22 rg',
      'BT',
      '/F1 10 Tf',
      `1 0 0 1 ${(x + 8).toFixed(2)} ${(y - 12).toFixed(2)} Tm`,
      `(${escapePdfText(label)}) Tj`,
      'ET',
    );
  });

  const stream = commands.join('\n');
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPts.toFixed(
      2,
    )} ${pageHeightPts.toFixed(2)}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`,
    `4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(body, 'utf8'));
    body += object;
  }

  const xrefOffset = Buffer.byteLength(body, 'utf8');
  body += `xref\n0 ${objects.length + 1}\n`;
  body += '0000000000 65535 f \n';

  for (let index = 1; index < offsets.length; index += 1) {
    body += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }

  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return body;
}

export async function renderArtworkFiles({
  productionSku,
  orderNumber,
  productName,
  canvasJson,
}: RenderArtworkParams) {
  const dpi = 300;
  const surface = normalizeSurface(canvasJson);
  const widthPx = Math.max(1200, Math.round(surface.width * dpi));
  const heightPx = Math.max(1200, Math.round(surface.height * dpi));
  const widthPts = Math.max(144, Number((surface.width * 72).toFixed(2)));
  const heightPts = Math.max(144, Number((surface.height * 72).toFixed(2)));
  const pdfName = `${productionSku}.pdf`;
  const svgName = `${productionSku}-thumb.svg`;

  const svgPreview = buildSvgPreview(surface, productName, orderNumber, widthPx, heightPx);
  const pdfDocument = buildPdfDocument(surface, productName, orderNumber, widthPts, heightPts);

  const [thumbnailUrl, fileUrl] = await Promise.all([
    uploadPublicFile({
      objectPath: `artworks/${svgName}`,
      body: svgPreview,
      contentType: 'image/svg+xml',
    }),
    uploadPublicFile({
      objectPath: `artworks/${pdfName}`,
      body: pdfDocument,
      contentType: 'application/pdf',
    }),
  ]);

  return {
    fileUrl,
    thumbnailUrl,
    outputFormat: 'PDF',
    widthPx,
    heightPx,
    dpi,
  };
}
