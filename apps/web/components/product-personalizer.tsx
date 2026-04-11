'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';

import {
  calculateAreaPrice,
  calculateUnitPrice,
  type DesignSessionPayload,
} from '@printos/shared';
import { BrandProductArt } from '@printos/ui';

import type { CatalogProduct } from '../lib/catalog';
import { useCartStore } from '../lib/cart-store';
import { ApparelMockup, isLightTone } from './apparel-mockup';
import {
  getAvailableColors,
  getAvailableSizes,
  findPreferredVariant,
  formatVariantLabel,
  resolveColorSwatch,
  resolveDefaultColor,
  resolveDefaultSize,
} from '../lib/product-options';
import {
  getDesignLabGeometry,
  resolveSurfaceName,
  type SurfaceKey,
  type TextAlign,
} from '../lib/product-design-lab';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3102/api';
const STORAGE_PREFIX = 'subligo-design-lab';

type ToolTab = 'upload' | 'text' | 'art' | 'details' | 'names';

type UploadedAsset = {
  id: string;
  assetUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
};

type SurfaceDraft = {
  text: string;
  fontSize: number;
  color: string;
  align: TextAlign;
  image: UploadedAsset | null;
};

type DraftState = Record<SurfaceKey, SurfaceDraft>;

const TOOLBAR: Array<{ id: ToolTab; label: string; shortLabel: string }> = [
  { id: 'upload', label: 'Subir archivo', shortLabel: 'Subir' },
  { id: 'text', label: 'Agregar texto', shortLabel: 'Texto' },
  { id: 'art', label: 'Agregar arte', shortLabel: 'Arte' },
  { id: 'details', label: 'Producto', shortLabel: 'Producto' },
  { id: 'names', label: 'Agregar nombres', shortLabel: 'Nombres' },
];

const TEXT_COLORS = ['#0f141e', '#ffffff', '#fcd122', '#58b0db', '#cf5f9f', '#99c450'];

const QUICK_ART = [
  { label: 'Badge SG', type: 'badge' },
  { label: 'Linea de impacto', type: 'line' },
  { label: 'Punto de color', type: 'dot' },
];

function createDefaultDraft(surface: SurfaceKey): SurfaceDraft {
  return {
    text: '',
    fontSize: 22,
    color: '#0f141e',
    align: 'center',
    image: null,
  };
}

function createSurfaceMap(surfaces: SurfaceKey[]) {
  return surfaces.reduce<DraftState>(
    (acc, surface) => {
      acc[surface] = createDefaultDraft(surface);
      return acc;
    },
    {
      front: createDefaultDraft('front'),
      back: createDefaultDraft('back'),
      left: createDefaultDraft('left'),
      right: createDefaultDraft('right'),
      wrap: createDefaultDraft('wrap'),
    },
  );
}

function normalizeInput(value: string) {
  return value.trim().toLowerCase();
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getSurfaceLabel(surface: SurfaceKey) {
  if (surface === 'front') return 'Frente';
  if (surface === 'back') return 'Espalda';
  if (surface === 'left') return 'Lateral';
  if (surface === 'right') return 'Lateral';
  return 'Wrap';
}

function getSurfaceSubtitle({
  active,
  hasWork,
  surface,
}: {
  active: boolean;
  hasWork: boolean;
  surface: SurfaceKey;
}) {
  if (active) return 'ACTIVO';
  if (hasWork) return 'LISTO';
  if (surface === 'left' || surface === 'right') return 'PROXIMO';
  return 'BASE';
}

function ToolGlyph({ tab }: { tab: ToolTab }) {
  const className = 'h-7 w-7';

  if (tab === 'upload') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M12 16V6m0 0 4 4m-4-4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M4 16.5A3.5 3.5 0 0 0 7.5 20h9A3.5 3.5 0 0 0 20 16.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (tab === 'text') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M5 6h14M12 6v12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (tab === 'art') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <rect height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" width="18" x="3" y="5" />
        <path d="m7 15 3-3 2 2 4-4 3 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (tab === 'details') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M7 6h10M7 12h10M7 18h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }

  if (tab === 'names') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24">
        <path d="M6 7h12M6 12h12M6 17h7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
        <path d="M17 17h1.5a1.5 1.5 0 0 1 0 3H17a1.5 1.5 0 0 1 0-3Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <path d="M6 12.5 10 16l8-9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M4 4h16v16H4z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function QuickActionCard({
  title,
  subtitle,
  icon,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-[22px] border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-sm"
      onClick={onClick}
      type="button"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-[16px] border border-slate-200 bg-slate-50 text-[#5670ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        {icon}
      </div>
      <p className="text-base font-semibold text-slate-950">{title}</p>
      <p className="mt-1.5 text-[13px] leading-6 text-slate-600">{subtitle}</p>
    </button>
  );
}

function SurfaceThumbnailPreview({
  product,
  surface,
  color,
}: {
  product: CatalogProduct;
  surface: SurfaceKey;
  color: string;
}) {
  const visual = normalizeInput(`${product.slug} ${product.category}`);
  const isArea = product.pricingModel === 'AREA';
  const isDrinkware = visual.includes('taza') || visual.includes('tumbler');
  const isBanner = visual.includes('banner') || visual.includes('lona');
  const isApparel = !isArea && !isDrinkware && !isBanner;

  if (isApparel) {
    return (
      <div className="surface-thumbnail mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] bg-[#e3e3e4] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <ApparelMockup
          className="h-[72px] w-[72px]"
          mode="thumbnail"
          tone={color}
          view={surface === 'back' ? 'back' : surface === 'left' || surface === 'right' ? 'profile' : 'front'}
        />
      </div>
    );
  }

  if (isDrinkware) {
    return (
      <div className="surface-thumbnail mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] bg-[#e3e3e4] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div className="relative h-11 w-8 rounded-[16px] shadow-[0_8px_20px_rgba(15,20,30,0.18)]" style={{ backgroundColor: color }}>
          <div className="absolute inset-x-1 top-1.5 h-2 rounded-full bg-white/45" />
        </div>
      </div>
    );
  }

  if (isBanner || isArea) {
    return (
      <div className="surface-thumbnail mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] bg-[#dfe0e1] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div className="relative h-12 w-9 rounded-[10px] bg-white shadow-[0_10px_24px_rgba(15,20,30,0.18)]">
          <div className="absolute inset-x-1 top-2 h-1.5 rounded-full bg-[#fcd122]" />
          <div className="absolute inset-x-1 top-6 h-1.5 rounded-full bg-[#1c2740]" />
        </div>
      </div>
    );
  }

  return (
    <div className="surface-thumbnail mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-[22px] bg-[#e3e3e4] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <div className="relative h-11 w-11 rounded-[18px] shadow-[0_8px_20px_rgba(15,20,30,0.16)]" style={{ backgroundColor: color }} />
    </div>
  );
}

function SurfaceRailButton({
  active,
  label,
  subtitle,
  onClick,
  preview,
  disabled = false,
}: {
  active: boolean;
  label: string;
  subtitle: string;
  onClick?: () => void;
  preview: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      className={`surface-button flex w-full flex-col items-center p-3 text-center ${
        active ? 'surface-button-active' : ''
      } ${disabled ? 'opacity-60' : ''}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {preview}
      <p className="text-[15px] font-semibold text-slate-950">{label}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-slate-500">{subtitle}</p>
    </button>
  );
}

function StageMockup({
  product,
  activeSurface,
  draft,
  color,
  sizeLabel,
  stageZoomed,
  estimatedTotal,
  surfaceCount,
  surfaces,
  onSelectSurface,
  widthMeters,
  heightMeters,
}: {
  product: CatalogProduct;
  activeSurface: SurfaceKey;
  draft: SurfaceDraft;
  color: string | null;
  sizeLabel: string | null;
  stageZoomed: boolean;
  estimatedTotal: number;
  surfaceCount: number;
  surfaces: SurfaceKey[];
  onSelectSurface: (surface: SurfaceKey) => void;
  widthMeters: number;
  heightMeters: number;
}) {
  const tone = resolveColorSwatch(color);
  const geometry = getDesignLabGeometry(product, activeSurface, widthMeters, heightMeters, draft.align);
  const visualText = draft.text.trim();
  const visual = normalizeInput(`${product.slug} ${product.category}`);
  const isArea = product.pricingModel === 'AREA';
  const isDrinkware = visual.includes('taza') || visual.includes('tumbler');
  const isBanner = visual.includes('banner') || visual.includes('lona');
  const isApparel = !isArea && !isDrinkware && !isBanner;
  const stageTabs = (isApparel ? ['front', 'back', 'left'] : ['front', 'back']).filter((item) =>
    surfaces.includes(item as SurfaceKey),
  ) as SurfaceKey[];
  const textPreviewStyle: CSSProperties = {
    top: geometry.preview.text.y,
    maxWidth: geometry.preview.text.maxWidth,
    fontSize: `${draft.fontSize}px`,
    color: draft.color,
    textAlign: draft.align,
  };

  textPreviewStyle.left = geometry.preview.text.x;

  if (draft.align === 'left') {
    textPreviewStyle.transform = 'translateY(-50%)';
  } else if (draft.align === 'right') {
    textPreviewStyle.transform = 'translate(-100%, -50%)';
  } else {
    textPreviewStyle.transform = 'translate(-50%, -50%)';
  }

  return (
    <div className="flex h-full min-h-[780px] flex-col bg-[#d7d7d8]">
      <div className="flex items-center justify-between border-b border-black/8 px-5 py-4">
        <div className="flex gap-2">
          {stageTabs.map((surface) => (
            <button
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                activeSurface === surface
                  ? 'bg-brand text-ink shadow-[0_12px_30px_rgba(252,209,34,0.28)]'
                  : 'bg-white/72 text-slate-600 hover:bg-white'
              }`}
              key={surface}
              onClick={() => onSelectSurface(surface)}
              type="button"
            >
              {surface === 'front' ? 'Frente' : surface === 'back' ? 'Espalda' : 'Lateral'}
            </button>
          ))}
        </div>
        <span className="rounded-full bg-[#2d323c] px-4 py-2 text-sm font-semibold text-white">
          {(color ?? 'Base').replace(/^./, (value) => value.toUpperCase())}
          {sizeLabel ? ` / ${sizeLabel}` : ''}
        </span>
      </div>

      <div className="relative flex min-h-[700px] flex-1 items-center justify-center overflow-hidden p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.52),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(15,20,30,0.08),transparent_28%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,transparent,rgba(15,20,30,0.05))]" />
        <div className="absolute bottom-12 left-1/2 h-10 w-[420px] -translate-x-1/2 rounded-full bg-black/12 blur-[28px]" />
        <div className={`relative transition duration-300 ${stageZoomed ? 'scale-[1.08]' : 'scale-100'}`}>
          {isArea ? (
            <div className="relative h-[540px] w-[580px] overflow-hidden rounded-[26px] bg-[#101520] shadow-[0_32px_80px_rgba(0,0,0,0.24)]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_42%)]" />
            </div>
          ) : isDrinkware ? (
            <div className="relative h-[520px] w-[360px]">
              <div
                className="absolute left-1/2 top-10 h-[398px] w-[208px] -translate-x-1/2 rounded-[94px] shadow-[0_36px_70px_rgba(0,0,0,0.22)]"
                style={{ backgroundColor: tone }}
              />
              <div className="absolute left-1/2 top-0 h-16 w-28 -translate-x-1/2 rounded-[28px] bg-[#d8dce3]" />
            </div>
          ) : isBanner ? (
            <div className="relative h-[540px] w-[400px]">
              <div className="absolute left-6 top-2 h-[500px] w-[14px] rounded-full bg-[#7c818b]" />
              <div className="absolute right-6 top-2 h-[500px] w-[14px] rounded-full bg-[#7c818b]" />
              <div className="absolute left-1/2 top-6 h-[460px] w-[312px] -translate-x-1/2 rounded-[14px] bg-white shadow-[0_36px_70px_rgba(0,0,0,0.24)]" />
            </div>
          ) : (
            <div
              className={`relative ${
                activeSurface === 'left' || activeSurface === 'right'
                  ? 'h-[840px] w-[560px] xl:h-[900px] xl:w-[620px]'
                  : 'h-[760px] w-[580px]'
              }`}
            >
              <ApparelMockup
                className="h-full w-full"
                mode="stage"
                tone={tone}
                view={
                  activeSurface === 'back'
                    ? 'back'
                    : activeSurface === 'left' || activeSurface === 'right'
                      ? 'profile'
                      : 'front'
                }
              />
            </div>
          )}

          <div className="pointer-events-none absolute inset-0">
            <div
              className={`absolute rounded-[30px] border-2 border-dashed ${
                isLightTone(tone) ? 'border-slate-400/50' : 'border-white/22'
              }`}
              style={{
                left: geometry.preview.image.left,
                top: geometry.preview.image.top,
                width: geometry.preview.image.width,
                height: geometry.preview.image.height,
              }}
            />

            {draft.image ? (
              <img
                alt={draft.image.originalName}
                className="absolute object-contain drop-shadow-[0_12px_28px_rgba(15,20,30,0.22)]"
                src={draft.image.assetUrl}
                style={{
                  left: geometry.preview.image.left,
                  top: geometry.preview.image.top,
                  width: geometry.preview.image.width,
                  height: geometry.preview.image.height,
                }}
              />
            ) : null}

            {visualText ? (
              <div
                className={`absolute whitespace-pre-line font-semibold drop-shadow-[0_10px_20px_rgba(0,0,0,0.22)] ${
                  isLightTone(tone) && draft.color === '#ffffff' ? 'text-slate-900' : ''
                }`}
                style={textPreviewStyle}
              >
                {visualText}
              </div>
            ) : null}
          </div>

          <div className="absolute bottom-6 left-6 rounded-[28px] border border-black/8 bg-white/94 px-5 py-4 shadow-[0_18px_44px_rgba(0,0,0,0.12)] backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">Preview en vivo</p>
            <p className="mt-2 text-sm font-medium text-slate-700">
              L {estimatedTotal.toFixed(2)} | {surfaceCount} superficie(s)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductPersonalizer({ product }: { product: CatalogProduct }) {
  const addItem = useCartStore((state) => state.addItem);
  const productDescriptor = useMemo(
    () => normalizeInput(`${product.slug} ${product.category} ${product.name}`),
    [product.slug, product.category, product.name],
  );
  const isApparelProduct = useMemo(
    () => product.pricingModel === 'UNIT' && productDescriptor.includes('camiseta'),
    [product.pricingModel, productDescriptor],
  );
  const surfaces = useMemo(() => {
    const base = Array.from(
      new Set(
        (product.surfaces.length ? product.surfaces : ['front']).map((surface) =>
          resolveSurfaceName(surface),
        ),
      ),
    );

    if (isApparelProduct) {
      if (!base.includes('front')) base.unshift('front');
      if (!base.includes('back')) base.push('back');
      if (!base.includes('left')) base.push('left');
    }

    return base;
  }, [isApparelProduct, product.surfaces]);
  const colors = useMemo(() => getAvailableColors(product), [product]);
  const [selectedColor, setSelectedColor] = useState<string | null>(() => resolveDefaultColor(product));
  const [selectedSize, setSelectedSize] = useState<string | null>(() => resolveDefaultSize(product, resolveDefaultColor(product) ?? undefined));
  const [quantity, setQuantity] = useState(1);
  const [widthMeters, setWidthMeters] = useState(2);
  const [heightMeters, setHeightMeters] = useState(1.5);
  const [toolTab, setToolTab] = useState<ToolTab>('upload');
  const [activeSurface, setActiveSurface] = useState<SurfaceKey>(surfaces[0] ?? 'front');
  const [drafts, setDrafts] = useState<DraftState>(() => createSurfaceMap(surfaces));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [nameList, setNameList] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'upload' | 'save' | 'cart' | null>(null);
  const [stageZoomed, setStageZoomed] = useState(false);

  const selectedVariant = useMemo(
    () => findPreferredVariant(product, selectedColor ?? undefined, selectedSize ?? undefined),
    [product, selectedColor, selectedSize],
  );
  const sizeOptions = useMemo(
    () => getAvailableSizes(product, selectedColor ?? undefined),
    [product, selectedColor],
  );
  const currentDraft = drafts[activeSurface];
  const storageKey = `${STORAGE_PREFIX}:${product.slug}`;

  useEffect(() => {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as {
        selectedColor?: string | null;
        selectedSize?: string | null;
        quantity?: number;
        widthMeters?: number;
        heightMeters?: number;
        sessionId?: string | null;
        activeSurface?: SurfaceKey;
        notes?: string;
        nameList?: string;
        drafts?: Partial<DraftState>;
      };

      if (typeof parsed.selectedColor === 'string' || parsed.selectedColor === null) {
        setSelectedColor(parsed.selectedColor ?? resolveDefaultColor(product));
      }
      if (typeof parsed.selectedSize === 'string' || parsed.selectedSize === null) {
        setSelectedSize(parsed.selectedSize ?? resolveDefaultSize(product, parsed.selectedColor ?? undefined));
      }
      if (Number.isFinite(parsed.quantity)) setQuantity(Math.max(1, Number(parsed.quantity)));
      if (Number.isFinite(parsed.widthMeters)) setWidthMeters(Number(parsed.widthMeters));
      if (Number.isFinite(parsed.heightMeters)) setHeightMeters(Number(parsed.heightMeters));
      if (typeof parsed.sessionId === 'string' || parsed.sessionId === null) setSessionId(parsed.sessionId ?? null);
      if (parsed.activeSurface && surfaces.includes(parsed.activeSurface)) setActiveSurface(parsed.activeSurface);
      if (typeof parsed.notes === 'string') setNotes(parsed.notes);
      if (typeof parsed.nameList === 'string') setNameList(parsed.nameList);
      if (parsed.drafts && typeof parsed.drafts === 'object') {
        setDrafts((previous) => {
          const next = { ...previous };
          for (const surface of surfaces) {
            if (parsed.drafts?.[surface]) {
              next[surface] = { ...next[surface], ...parsed.drafts[surface] };
            }
          }
          return next;
        });
      }
    } catch (error) {
      console.error('No se pudo restaurar la sesion local del laboratorio:', error);
    }
  }, [product, storageKey, surfaces]);

  useEffect(() => {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        selectedColor,
        selectedSize,
        quantity,
        widthMeters,
        heightMeters,
        sessionId,
        activeSurface,
        notes,
        nameList,
        drafts,
      }),
    );
  }, [activeSurface, drafts, heightMeters, nameList, notes, quantity, selectedColor, selectedSize, sessionId, storageKey, widthMeters]);

  useEffect(() => {
    if (!sizeOptions.length) {
      setSelectedSize(null);
      return;
    }

    if (selectedSize && sizeOptions.some((item) => normalizeInput(item) === normalizeInput(selectedSize))) {
      return;
    }

    setSelectedSize(sizeOptions[0] ?? null);
  }, [selectedColor, selectedSize, sizeOptions]);

  const designedSurfaces = useMemo(
    () =>
      surfaces.filter((surface) => {
        const draft = drafts[surface];
        return Boolean(draft?.text.trim() || draft?.image);
      }),
    [drafts, surfaces],
  );

  const pricing = useMemo(() => {
    if (product.pricingModel === 'AREA') {
      return calculateAreaPrice({
        widthMeters,
        heightMeters,
        quantity,
        pricePerSquareMeter: product.pricePerSquareMeter ?? 0,
      });
    }

    return calculateUnitPrice({
      quantity,
      unitPrice: product.baseUnitPrice ?? 0,
      personalizationMultiplier: product.personalizationMultiplier,
      surfaces: Math.max(designedSurfaces.length, 1),
    });
  }, [designedSurfaces.length, heightMeters, product, quantity, widthMeters]);

  function updateCurrentDraft(patch: Partial<SurfaceDraft>) {
    setDrafts((previous) => ({
      ...previous,
      [activeSurface]: {
        ...previous[activeSurface],
        ...patch,
      },
    }));
  }

  function buildPayload(): DesignSessionPayload {
    const composedNotes = [notes.trim(), nameList.trim() ? `Nombres / extras:\n${nameList.trim()}` : '']
      .filter(Boolean)
      .join('\n\n');

    return {
      productId: product.id,
      variantId: selectedVariant?.id,
      notes: composedNotes || undefined,
      surfaces: (designedSurfaces.length ? designedSurfaces : [activeSurface]).map((surface) => {
        const draft = drafts[surface];
        const geometry = getDesignLabGeometry(
          product,
          surface,
          widthMeters,
          heightMeters,
          draft.align,
        );
        const elements = [];

        if (draft.text.trim()) {
          elements.push({
            type: 'text' as const,
            id: `${surface}-text`,
            content: draft.text.trim(),
            x: geometry.textPosition.x,
            y: geometry.textPosition.y,
            rotation: 0,
            fontFamily: 'Sora',
            fontSize: draft.fontSize,
            color: draft.color,
            align: draft.align,
          });
        }

        if (draft.image) {
          elements.push({
            type: 'image' as const,
            id: `${surface}-image`,
            assetUrl: draft.image.assetUrl,
            x: geometry.imageBounds.x,
            y: geometry.imageBounds.y,
            width: geometry.imageBounds.width,
            height: geometry.imageBounds.height,
            rotation: 0,
            minimumDpi: 150,
          });
        }

        return {
          surface,
          width: geometry.canvas.width,
          height: geometry.canvas.height,
          printableBounds: {
            x: geometry.imageBounds.x,
            y: geometry.imageBounds.y,
            width: geometry.imageBounds.width,
            height: geometry.imageBounds.height,
          },
          elements,
        };
      }),
    };
  }

  async function persistSession() {
    setBusyAction('save');
    setMessage(null);

    try {
      const payload = buildPayload();
      const target = sessionId ? `${API_BASE}/design/sessions/${sessionId}` : `${API_BASE}/design/sessions`;
      const method = sessionId ? 'PATCH' : 'POST';
      const response = await fetch(target, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const session = (await response.json()) as { id: string };
      setSessionId(session.id);
      setMessage('Diseno guardado y listo para continuar.');
      return session.id;
    } catch (error) {
      console.error('No se pudo guardar el diseno:', error);
      setMessage('No se pudo guardar la sesion del diseno.');
      return null;
    } finally {
      setBusyAction(null);
    }
  }

  async function uploadAsset(file: File) {
    setBusyAction('upload');
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE}/design/assets`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const asset = (await response.json()) as UploadedAsset;
      updateCurrentDraft({ image: asset });
      setToolTab('art');
      setMessage('Arte cargado correctamente.');
    } catch (error) {
      console.error('No se pudo subir el arte:', error);
      setMessage('No se pudo cargar el archivo. Usa PNG, JPG, WEBP o SVG.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAddToCart() {
    setBusyAction('cart');
    setMessage(null);

    try {
      const savedId = sessionId ?? (await persistSession());
      const lineTotal = roundCurrency(pricing.total);
      const unitPrice = roundCurrency(lineTotal / quantity);

      addItem({
        id: crypto.randomUUID(),
        productId: product.id,
        productSlug: product.slug,
        productSku: selectedVariant?.sku ?? product.sku,
        productName: product.name,
        pricingModel: product.pricingModel,
        quantity,
        unitPrice,
        lineTotal,
        designSessionId: savedId ?? undefined,
        variantId: selectedVariant?.id,
        variantName: formatVariantLabel(selectedVariant),
        selectedColor,
        selectedSize,
        widthMeters: product.pricingModel === 'AREA' ? widthMeters : undefined,
        heightMeters: product.pricingModel === 'AREA' ? heightMeters : undefined,
        surfaces: Math.max(designedSurfaces.length, 1),
        configuration: buildPayload(),
      });

      setMessage('Configuracion agregada al carrito.');
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-[34px] border border-line/70 bg-white shadow-ambient">
      <div className="flex flex-col gap-4 border-b border-black/8 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="font-medium text-slate-500">Mis disenos</span>
          <span>/</span>
          <span className="font-semibold text-slate-950">Editor de personalizacion</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <a
            className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-accent/40 hover:text-slate-950"
            href="tel:+50400000000"
          >
            Habla con un asesor
          </a>
          <Link className="inline-flex items-center gap-2 rounded-full border border-line/70 bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-accent/40 hover:text-slate-950" href="/catalogo">
            Cambiar producto
          </Link>
          <Link className="font-medium text-slate-500 transition hover:text-slate-950" href="/checkout">
            Ver checkout
          </Link>
        </div>
      </div>

      <div className="grid xl:grid-cols-[88px_minmax(0,1fr)_132px]">
        <aside className="bg-[#221e1d] p-4 text-white">
          <div className="space-y-3">
            {TOOLBAR.map((item) => (
              <button
                className={`toolbar-button ${toolTab === item.id ? 'toolbar-button-active' : ''}`}
                key={item.id}
                onClick={() => setToolTab(item.id)}
                type="button"
              >
                <ToolGlyph tab={item.id} />
                <span>{item.shortLabel}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="relative border-r border-black/8 bg-[#d7d7d8]">
          <div className="p-4 xl:absolute xl:bottom-4 xl:left-4 xl:top-4 xl:z-20 xl:w-[392px] xl:p-0">
            <div className="rounded-[32px] border border-black/8 bg-white p-5 shadow-[0_30px_70px_rgba(15,20,30,0.12)] xl:flex xl:h-full xl:flex-col xl:overflow-y-auto">
              {colors.length ? (
                <div className="mb-5 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                        Paleta de color
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-950">
                        {selectedColor ? `Base ${selectedColor}` : 'Base del producto'}
                      </p>
                    </div>
                    <span className="rounded-full border border-line/70 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                      {selectedSize ?? 'Sin talla'}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {colors.map((item) => (
                      <button
                        className={`inline-flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-medium transition ${
                          selectedColor === item
                            ? 'border-accent bg-white text-slate-950 shadow-sm'
                            : 'border-line/70 bg-white text-slate-600 hover:border-accent/40'
                        }`}
                        key={`palette-${item}`}
                        onClick={() => setSelectedColor(item)}
                        type="button"
                      >
                        <span
                          className="h-5 w-5 rounded-full border border-slate-300"
                          style={{ backgroundColor: resolveColorSwatch(item) }}
                        />
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {toolTab === 'upload' ? (
                <div>
                  <h2 className="text-[32px] font-semibold tracking-[-0.04em] text-slate-950 xl:text-[34px]">
                    Que quieres hacer primero?
                  </h2>
                  <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                    <QuickActionCard
                      icon={<ToolGlyph tab="upload" />}
                      onClick={() => setToolTab('art')}
                      subtitle="Sube tu logo o ilustracion para empezar rapido."
                      title="Subir archivo"
                    />
                    <QuickActionCard
                      icon={<ToolGlyph tab="text" />}
                      onClick={() => setToolTab('text')}
                      subtitle="Agrega frases, nombres o un llamado comercial."
                      title="Agregar texto"
                    />
                    <QuickActionCard
                      icon={<ToolGlyph tab="art" />}
                      onClick={() => setToolTab('art')}
                      subtitle="Aplica un arte rapido, icono o badge de apoyo."
                      title="Agregar arte"
                    />
                    <QuickActionCard
                      icon={<ToolGlyph tab="details" />}
                      onClick={() => setToolTab('details')}
                      subtitle="Color, talla, cantidad o medidas antes de cotizar."
                      title="Cambiar producto"
                    />
                  </div>
                  <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-lg font-semibold text-slate-950">Trabajar tu diseno ahora es mas simple</p>
                    <ul className="mt-3 space-y-2 text-[13px] leading-6 text-slate-600">
                      <li>Arrastra o sube tu arte en cualquier momento.</li>
                      <li>Edita texto, color y superficie activa sin perder el preview.</li>
                      <li>Guarda la configuracion y llevala al carrito con el detalle real.</li>
                    </ul>
                  </div>
                </div>
              ) : null}

              {toolTab === 'text' ? (
                <div className="space-y-5">
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Agregar texto</h2>
                  <textarea
                    className="min-h-[170px] w-full rounded-[24px] border border-slate-200 px-4 py-4 text-lg outline-none transition focus:border-accent"
                    onChange={(event) => updateCurrentDraft({ text: event.target.value })}
                    placeholder="Escribe el texto principal"
                    value={currentDraft.text}
                  />
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Tamano del texto</span>
                    <input
                      className="w-full"
                      max={42}
                      min={16}
                      onChange={(event) => updateCurrentDraft({ fontSize: Number(event.target.value) })}
                      type="range"
                      value={currentDraft.fontSize}
                    />
                  </label>
                  <div>
                    <span className="text-sm font-medium text-slate-700">Color del texto</span>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TEXT_COLORS.map((item) => (
                        <button
                          className={`h-10 w-10 rounded-full border-2 ${currentDraft.color === item ? 'border-slate-950' : 'border-white shadow-sm'}`}
                          key={item}
                          onClick={() => updateCurrentDraft({ color: item })}
                          style={{ backgroundColor: item }}
                          type="button"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {toolTab === 'art' ? (
                <div className="space-y-5">
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Agregar arte</h2>
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-[26px] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                    <span className="text-base font-semibold text-slate-950">Sube tu arte</span>
                    <span className="mt-2 text-sm text-slate-600">PNG, JPG, WEBP o SVG hasta 10MB.</span>
                    <input
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadAsset(file);
                      }}
                      type="file"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {QUICK_ART.map((item) => (
                      <button
                        className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-accent/40"
                        key={item.type}
                        onClick={() =>
                          updateCurrentDraft({
                            text:
                              item.type === 'badge'
                                ? 'SubliGo'
                                : item.type === 'line'
                                  ? 'Tu mensaje aqui'
                                  : currentDraft.text || 'Tu marca aqui',
                            color:
                              item.type === 'badge'
                                ? '#fcd122'
                                : item.type === 'line'
                                  ? '#58b0db'
                                  : '#cf5f9f',
                          })
                        }
                        type="button"
                      >
                        <p className="font-semibold text-slate-950">{item.label}</p>
                        <p className="mt-2 text-sm text-slate-600">Aplica un recurso rapido sobre la cara activa.</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {toolTab === 'details' ? (
                <div className="space-y-5">
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Producto</h2>
                  <div>
                    <span className="text-sm font-medium text-slate-700">Color base</span>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {colors.map((item) => (
                        <button
                          className={`inline-flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-medium ${selectedColor === item ? 'border-accent bg-white text-slate-950' : 'border-line/70 bg-white text-slate-600'}`}
                          key={item}
                          onClick={() => setSelectedColor(item)}
                          type="button"
                        >
                          <span className="h-5 w-5 rounded-full border border-slate-300" style={{ backgroundColor: resolveColorSwatch(item) }} />
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  {getAvailableSizes(product, selectedColor ?? undefined).length ? (
                    <div>
                      <span className="text-sm font-medium text-slate-700">Talla</span>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {getAvailableSizes(product, selectedColor ?? undefined).map((item) => (
                          <button
                            className={`rounded-full border px-4 py-3 text-sm font-medium ${selectedSize === item ? 'border-accent bg-white text-slate-950' : 'border-line/70 bg-white text-slate-600'}`}
                            key={item}
                            onClick={() => setSelectedSize(item)}
                            type="button"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Cantidad</span>
                    <input className="w-full rounded-[22px] border border-slate-200 px-4 py-3" min={1} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} type="number" value={quantity} />
                  </label>
                  {product.pricingModel === 'AREA' ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Ancho (m)</span>
                        <input className="w-full rounded-[22px] border border-slate-200 px-4 py-3" min={0.2} onChange={(event) => setWidthMeters(Math.max(0.2, Number(event.target.value) || 0.2))} step={0.1} type="number" value={widthMeters} />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-slate-700">Alto (m)</span>
                        <input className="w-full rounded-[22px] border border-slate-200 px-4 py-3" min={0.2} onChange={(event) => setHeightMeters(Math.max(0.2, Number(event.target.value) || 0.2))} step={0.1} type="number" value={heightMeters} />
                      </label>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {toolTab === 'names' ? (
                <div className="space-y-5">
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Agregar nombres</h2>
                  <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-sm font-medium text-slate-600">Activa nombres, tallas o instrucciones por linea.</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                      Ideal para equipos, activaciones y pedidos personalizados por persona.
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Usa una linea por colaborador, por ejemplo: <span className="font-medium text-slate-950">Ana - M - Ventas</span>
                    </p>
                  </div>
                  <textarea
                    className="min-h-[190px] w-full rounded-[24px] border border-slate-200 px-4 py-4 text-base outline-none transition focus:border-accent"
                    onChange={(event) => setNameList(event.target.value)}
                    placeholder={"Ana - M - Ventas\nCarlos - L - Produccion\nMarta - S - Staff"}
                    value={nameList}
                  />
                  <textarea
                    className="min-h-[130px] w-full rounded-[24px] border border-slate-200 px-4 py-4 outline-none transition focus:border-accent"
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Notas para el equipo o para el pedido"
                    value={notes}
                  />
                </div>
              ) : null}

              {message ? (
                <div className="mt-5 rounded-[20px] border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-slate-700">
                  {message}
                </div>
              ) : null}
            </div>
          </div>

          <div className="xl:pl-[400px]">
            <StageMockup
              activeSurface={activeSurface}
              color={selectedColor}
              draft={currentDraft}
              estimatedTotal={pricing.total}
              product={product}
              surfaceCount={Math.max(designedSurfaces.length, 1)}
              sizeLabel={selectedSize}
              stageZoomed={stageZoomed}
              surfaces={surfaces}
              onSelectSurface={setActiveSurface}
              widthMeters={widthMeters}
              heightMeters={heightMeters}
            />
          </div>
        </div>

        <aside className="bg-[#f7f5f1] p-4">
          <div className="space-y-3">
            {surfaces.map((surface) => {
              const hasWork = Boolean(drafts[surface].text.trim() || drafts[surface].image);

              return (
                <SurfaceRailButton
                  active={activeSurface === surface}
                  key={surface}
                  label={getSurfaceLabel(surface)}
                  onClick={() => setActiveSurface(surface)}
                  preview={
                    <SurfaceThumbnailPreview
                      color={resolveColorSwatch(selectedColor)}
                      product={product}
                      surface={surface}
                    />
                  }
                  subtitle={getSurfaceSubtitle({ active: activeSurface === surface, hasWork, surface })}
                />
              );
            })}
            <button
              className="surface-button p-3 text-center"
              onClick={() => setStageZoomed((previous) => !previous)}
              type="button"
            >
              <div className="surface-thumbnail mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-[22px]">
                <svg className="h-7 w-7 text-slate-900" fill="none" viewBox="0 0 24 24">
                  <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.8" />
                  <path
                    d="M15 15l5 5M10.5 7.5v6M7.5 10.5h6"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-950">Zoom</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                {stageZoomed ? 'NORMAL' : 'AMPLIAR'}
              </p>
            </button>
          </div>
        </aside>
      </div>

      <div className="sticky bottom-0 z-10 border-t border-black/8 bg-white/94 p-4 backdrop-blur">
        <div className="sticky-action-bar grid gap-4 overflow-hidden p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[18px] border border-slate-200 bg-[#e6e6e7]">
              {normalizeInput(`${product.slug} ${product.category}`).includes('banner') ? (
                <div className="relative h-11 w-9 rounded-[10px] bg-white shadow-[0_10px_24px_rgba(15,20,30,0.18)]">
                  <div className="absolute inset-x-1 top-2 h-1.5 rounded-full bg-[#fcd122]" />
                  <div className="absolute inset-x-1 top-6 h-1.5 rounded-full bg-[#1c2740]" />
                </div>
              ) : normalizeInput(`${product.slug} ${product.category}`).includes('taza') ||
                normalizeInput(`${product.slug} ${product.category}`).includes('tumbler') ? (
                <div
                  className="relative h-11 w-8 rounded-[16px] shadow-[0_8px_20px_rgba(15,20,30,0.18)]"
                  style={{ backgroundColor: resolveColorSwatch(selectedColor) }}
                >
                  <div className="absolute inset-x-1 top-1.5 h-2 rounded-full bg-white/45" />
                </div>
              ) : (
                <ApparelMockup
                  className="h-[72px] w-[72px]"
                  mode="thumbnail"
                  tone={resolveColorSwatch(selectedColor)}
                  view={
                    activeSurface === 'back'
                      ? 'back'
                      : activeSurface === 'left' || activeSurface === 'right'
                        ? 'profile'
                        : 'front'
                  }
                />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                Resumen del diseno
              </p>
              <p className="mt-1 truncate text-lg font-semibold text-slate-950">
                {getSurfaceLabel(activeSurface)} lista para cotizar
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatVariantLabel(selectedVariant) || 'Configuracion base'}
                {selectedColor ? ` | ${selectedColor}` : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="brand-chip">L {pricing.total.toFixed(2)}</span>
                <span className="brand-chip">{Math.max(designedSurfaces.length, 1)} superficie(s)</span>
                <span className="brand-chip">Preview listo</span>
              </div>
              <p className="sr-only">
                {formatVariantLabel(selectedVariant)}
                {selectedColor ? ` | ${selectedColor}` : ''}
              </p>
            </div>
            </div>

            <Link className="brand-button-secondary shrink-0 whitespace-nowrap px-4 py-2.5 text-sm" href="/catalogo">
              Cambiar o agregar productos
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <button className="brand-button-secondary" disabled={busyAction !== null} onClick={() => void persistSession()} type="button">
              {busyAction === 'save' ? 'Guardando...' : 'Guardar | Compartir'}
            </button>
            <button className="brand-button px-7" disabled={busyAction !== null} onClick={() => void handleAddToCart()} type="button">
              {busyAction === 'cart' ? 'Procesando...' : 'Agregar al carrito'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
