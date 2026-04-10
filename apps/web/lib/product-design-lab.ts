import type { CatalogProduct } from './catalog';

export type SurfaceKey = 'front' | 'back' | 'left' | 'right' | 'wrap';
export type TextAlign = 'left' | 'center' | 'right';

const PRINT_SURFACE_MAP: Record<string, SurfaceKey> = {
  frontal: 'front',
  front: 'front',
  posterior: 'back',
  back: 'back',
  izquierda: 'left',
  left: 'left',
  derecha: 'right',
  right: 'right',
  wrap: 'wrap',
};

type RelativeBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type RelativeText = {
  x: number;
  y: number;
  maxWidth: number;
};

export function resolveSurfaceName(surface: string): SurfaceKey {
  return PRINT_SURFACE_MAP[surface.toLowerCase()] ?? 'front';
}

export function resolveCanvasSize(
  product: CatalogProduct,
  surface: SurfaceKey,
  widthMeters: number,
  heightMeters: number,
) {
  if (product.pricingModel === 'AREA') {
    return {
      width: Number((widthMeters * 39.37).toFixed(2)),
      height: Number((heightMeters * 39.37).toFixed(2)),
    };
  }

  if (surface === 'wrap') {
    return { width: 9, height: 3.5 };
  }

  if (surface === 'left' || surface === 'right') {
    return { width: 4, height: 4 };
  }

  return { width: 10, height: 12 };
}

function resolveRelativeImageBox(product: CatalogProduct, surface: SurfaceKey): RelativeBox {
  if (product.pricingModel === 'AREA') {
    return { x: 0.18, y: 0.18, width: 0.64, height: 0.38 };
  }

  if (surface === 'wrap') {
    return { x: 0.18, y: 0.24, width: 0.64, height: 0.32 };
  }

  if (surface === 'left') {
    return { x: 0.28, y: 0.23, width: 0.18, height: 0.14 };
  }

  if (surface === 'right') {
    return { x: 0.28, y: 0.23, width: 0.18, height: 0.14 };
  }

  if (surface === 'back') {
    return { x: 0.36, y: 0.28, width: 0.28, height: 0.16 };
  }

  return { x: 0.36, y: 0.28, width: 0.28, height: 0.16 };
}

function resolveRelativeTextBox(product: CatalogProduct, surface: SurfaceKey, align: TextAlign): RelativeText {
  const sharedY =
    product.pricingModel === 'AREA'
      ? 0.74
      : surface === 'wrap'
        ? 0.58
        : surface === 'left' || surface === 'right'
          ? 0.47
          : surface === 'back'
            ? 0.5
            : 0.5;
  const maxWidth =
    product.pricingModel === 'AREA'
      ? 0.72
      : surface === 'left' || surface === 'right'
        ? 0.22
        : 0.3;

  if (surface === 'left') {
    return { x: 0.37, y: 0.45, maxWidth: 0.22 };
  }

  if (surface === 'right') {
    return { x: 0.37, y: 0.45, maxWidth: 0.22 };
  }

  if (align === 'left') {
    return { x: 0.24, y: sharedY, maxWidth };
  }

  if (align === 'right') {
    return { x: 0.76, y: sharedY, maxWidth };
  }

  return { x: 0.5, y: sharedY, maxWidth };
}

export function getDesignLabGeometry(
  product: CatalogProduct,
  surface: SurfaceKey,
  widthMeters: number,
  heightMeters: number,
  align: TextAlign,
) {
  const canvas = resolveCanvasSize(product, surface, widthMeters, heightMeters);
  const relativeImage = resolveRelativeImageBox(product, surface);
  const relativeText = resolveRelativeTextBox(product, surface, align);

  return {
    canvas,
    imageBounds: {
      x: Number((canvas.width * relativeImage.x).toFixed(2)),
      y: Number((canvas.height * relativeImage.y).toFixed(2)),
      width: Number((canvas.width * relativeImage.width).toFixed(2)),
      height: Number((canvas.height * relativeImage.height).toFixed(2)),
    },
    textPosition: {
      x: Number((canvas.width * relativeText.x).toFixed(2)),
      y: Number((canvas.height * relativeText.y).toFixed(2)),
      maxWidth: Number((canvas.width * relativeText.maxWidth).toFixed(2)),
    },
    preview: {
      image: {
        left: `${relativeImage.x * 100}%`,
        top: `${relativeImage.y * 100}%`,
        width: `${relativeImage.width * 100}%`,
        height: `${relativeImage.height * 100}%`,
      },
      text: {
        x: `${relativeText.x * 100}%`,
        y: `${relativeText.y * 100}%`,
        maxWidth: `${relativeText.maxWidth * 100}%`,
      },
    },
  };
}
