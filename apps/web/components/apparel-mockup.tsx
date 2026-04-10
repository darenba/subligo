import { useId } from 'react';

export type ApparelView = 'front' | 'back' | 'profile';

type ApparelMockupProps = {
  tone: string;
  view: ApparelView;
  className?: string;
  mode?: 'stage' | 'thumbnail';
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function tintHex(hex: string, amount: number) {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return hex;
  }

  const next = normalized
    .match(/.{2}/g)
    ?.map((part) => clamp(parseInt(part, 16) + amount, 0, 255))
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('');

  return next ? `#${next}` : hex;
}

export function isLightTone(hex: string) {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return false;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance > 190;
}

const PHOTO_MOCKUP_MAP: Record<ApparelView, string> = {
  front: '/mockups/shirt-front-customink-large.png',
  back: '/mockups/shirt-back-customink-medium.png',
  profile: '/mockups/shirt-profile-subligo-vector.png',
};

function PhotoApparelMockup({
  className = '',
  mode = 'stage',
  tone,
  view,
}: {
  className?: string;
  mode?: 'stage' | 'thumbnail';
  tone: string;
  view: ApparelView;
}) {
  const source = PHOTO_MOCKUP_MAP[view];
  const imageClassName =
    view === 'profile'
      ? mode === 'thumbnail'
        ? 'h-full w-full object-contain object-center scale-[1.05] drop-shadow-[0_28px_44px_rgba(15,20,30,0.18)]'
        : 'h-full w-full object-contain object-center scale-[1.34] drop-shadow-[0_28px_44px_rgba(15,20,30,0.18)]'
      : 'h-full w-full object-contain object-center drop-shadow-[0_28px_44px_rgba(15,20,30,0.18)]';

  return (
    <div className={`relative ${className}`}>
      <img
        alt=""
        aria-hidden="true"
        className={imageClassName}
        src={source}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: tone,
          mixBlendMode: 'multiply',
          opacity: 0.94,
          WebkitMaskImage: `url(${source})`,
          WebkitMaskPosition: 'center',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskSize: 'contain',
          maskImage: `url(${source})`,
          maskPosition: 'center',
          maskRepeat: 'no-repeat',
          maskSize: 'contain',
        }}
      />
    </div>
  );
}

function FlatTeeMockup({
  className = '',
  tone,
  view,
}: {
  className?: string;
  tone: string;
  view: ApparelView;
}) {
  const uniqueId = useId().replace(/:/g, '');
  const lightTone = isLightTone(tone);
  const baseTone = lightTone ? tintHex(tone, -8) : tone;
  const highlightTone = lightTone ? tintHex(tone, 8) : tintHex(tone, 18);
  const shadowTone = lightTone ? tintHex(tone, -24) : tintHex(tone, -18);
  const rimTone = lightTone ? '#d6dbe2' : tintHex(tone, -34);
  const seamTone = lightTone ? 'rgba(15,20,30,0.12)' : 'rgba(255,255,255,0.14)';
  const printBoxTone = lightTone ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.18)';

  if (view === 'profile') {
    return (
      <svg className={className} fill="none" viewBox="0 0 360 720">
        <defs>
          <linearGradient
            id={`${uniqueId}-profile-shirt`}
            x1="88"
            x2="248"
            y1="84"
            y2="642"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor={highlightTone} />
            <stop offset="0.55" stopColor={baseTone} />
            <stop offset="1" stopColor={shadowTone} />
          </linearGradient>
          <radialGradient
            id={`${uniqueId}-profile-glow`}
            cx="0"
            cy="0"
            r="1"
            gradientTransform="matrix(0 220 -110 0 176 176)"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="rgba(255,255,255,0.95)" />
            <stop offset="1" stopColor="transparent" />
          </radialGradient>
          <filter id={`${uniqueId}-profile-shadow`} x="36" y="26" width="292" height="666" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="20" floodColor="#0f141e" floodOpacity="0.12" stdDeviation="18" />
          </filter>
        </defs>

        <g filter={`url(#${uniqueId}-profile-shadow)`}>
          <path
            d="M150 70c28 0 54 10 74 30l36 40c14 16 22 36 22 58v40c0 20-8 40-22 54l-22 22v242c0 40-26 84-88 84-30 0-56-10-76-28V118c20-32 44-48 76-48Z"
            fill={`url(#${uniqueId}-profile-shirt)`}
          />
          <path
            d="M106 114c18-30 40-44 68-44 26 0 52 10 70 28l20 20c10 10 18 22 22 34h-44c-8-16-18-30-28-42-10-10-24-16-40-16-18 0-34 8-48 24l-20 22V114Z"
            fill={lightTone ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.1)'}
          />
          <path
            d="M160 88c22 0 40 8 56 24l18 18c10 10 16 20 18 32h-34c-2-8-8-16-16-24l-18-18c-8-8-16-12-26-12-14 0-24 6-30 18l-14 26h-28l10-22c10-28 34-42 64-42Z"
            fill={rimTone}
            opacity="0.95"
          />
          <path d="M112 160h162" opacity="0.26" stroke={seamTone} strokeLinecap="round" strokeWidth="6" />
          <path d="M116 230h44c36 0 56-18 66-40" opacity="0.42" stroke={seamTone} strokeLinecap="round" strokeWidth="7" />
          <path d="M114 320h80" opacity="0.22" stroke={seamTone} strokeLinecap="round" strokeWidth="8" />
          <path d="M114 406h84" opacity="0.18" stroke={seamTone} strokeLinecap="round" strokeWidth="8" />
          <path d="M114 522h76" opacity="0.14" stroke={seamTone} strokeLinecap="round" strokeWidth="8" />
          <path
            d="M120 560c14 18 30 28 48 32"
            opacity="0.3"
            stroke={lightTone ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.18)'}
            strokeLinecap="round"
            strokeWidth="8"
          />
          <rect
            fill={printBoxTone}
            height="196"
            opacity="0.42"
            rx="34"
            stroke={lightTone ? 'rgba(15,20,30,0.12)' : 'rgba(255,255,255,0.18)'}
            strokeDasharray="10 10"
            width="94"
            x="96"
            y="220"
          />
        </g>
      </svg>
    );
  }

  return (
    <svg className={className} fill="none" viewBox="0 0 620 760">
      <defs>
        <linearGradient id={`${uniqueId}-shirt`} x1="174" x2="448" y1="84" y2="692" gradientUnits="userSpaceOnUse">
          <stop stopColor={highlightTone} />
          <stop offset="0.52" stopColor={baseTone} />
          <stop offset="1" stopColor={shadowTone} />
        </linearGradient>
        <radialGradient
          id={`${uniqueId}-shine`}
          cx="0"
          cy="0"
          r="1"
          gradientTransform="matrix(0 230 -180 0 312 172)"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="rgba(255,255,255,0.98)" />
          <stop offset="1" stopColor="transparent" />
        </radialGradient>
        <filter id={`${uniqueId}-shadow`} x="42" y="26" width="536" height="700" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="24" floodColor="#0f141e" floodOpacity="0.14" stdDeviation="20" />
        </filter>
      </defs>

      <g filter={`url(#${uniqueId}-shadow)`}>
        <path
          d="M220 72c22-16 50-26 90-26 40 0 68 10 90 26l60 46c24 18 42 44 52 74l18 56-70 34-38-74v420c0 38-30 68-68 68H218c-38 0-68-30-68-68V208l-38 74-70-34 18-56c10-30 28-56 52-74l60-46Z"
          fill={`url(#${uniqueId}-shirt)`}
        />
        <path
          d="M196 94c26-30 64-46 114-46 50 0 88 16 114 46l48 38 24 82-78-70-30 12-34-34h-88l-34 34-30-12-78 70 24-82 48-38Z"
          fill={lightTone ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.08)'}
          opacity={view === 'front' ? 0.88 : 0.6}
        />
        {view === 'front' ? (
          <>
            <path d="M252 98c16 30 34 44 58 44s42-14 58-44" stroke={rimTone} strokeLinecap="round" strokeWidth="16" />
            <path d="M170 228c-16 88-12 282 0 400" opacity="0.18" stroke={seamTone} strokeLinecap="round" strokeWidth="8" />
            <path d="M450 228c16 88 12 282 0 400" opacity="0.18" stroke={seamTone} strokeLinecap="round" strokeWidth="8" />
            <path d="M258 214c18 18 34 26 52 26s34-8 52-26" stroke={rimTone} strokeLinecap="round" strokeWidth="9" />
            <path d="M212 338c30 16 62 24 98 24 36 0 68-8 98-24" opacity="0.14" stroke={seamTone} strokeLinecap="round" strokeWidth="8" />
            <path d="M232 506c22 10 48 16 78 16 30 0 56-6 78-16" opacity="0.1" stroke={seamTone} strokeLinecap="round" strokeWidth="8" />
            <rect
              fill={printBoxTone}
              height="154"
              opacity="0.38"
              rx="28"
              stroke={lightTone ? 'rgba(15,20,30,0.12)' : 'rgba(255,255,255,0.2)'}
              strokeDasharray="10 10"
              width="174"
              x="224"
              y="214"
            />
          </>
        ) : (
          <>
            <path d="M242 112c18 12 40 18 68 18 28 0 50-6 68-18" stroke={rimTone} strokeLinecap="round" strokeWidth="10" />
            <path d="M214 172c28 12 60 18 96 18 36 0 68-6 96-18" opacity="0.28" stroke={seamTone} strokeLinecap="round" strokeWidth="8" />
            <path d="M170 244c-10 90-6 252 4 384" opacity="0.18" stroke={seamTone} strokeLinecap="round" strokeWidth="8" />
            <path d="M450 244c10 90 6 252-4 384" opacity="0.18" stroke={seamTone} strokeLinecap="round" strokeWidth="8" />
            <path d="M206 354c32 16 66 24 104 24 38 0 72-8 104-24" opacity="0.16" stroke={seamTone} strokeLinecap="round" strokeWidth="8" />
            <rect
              fill={printBoxTone}
              height="170"
              opacity="0.34"
              rx="28"
              stroke={lightTone ? 'rgba(15,20,30,0.1)' : 'rgba(255,255,255,0.16)'}
              strokeDasharray="10 10"
              width="190"
              x="215"
              y="222"
            />
          </>
        )}

        <path d="M224 690c28 12 56 18 86 18s58-6 86-18" opacity="0.24" stroke={seamTone} strokeLinecap="round" strokeWidth="8" />
        <path
          d="M132 186c16 18 30 42 44 76"
          opacity="0.26"
          stroke={lightTone ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.12)'}
          strokeLinecap="round"
          strokeWidth="8"
        />
        <path
          d="M488 186c-16 18-30 42-44 76"
          opacity="0.26"
          stroke={lightTone ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.12)'}
          strokeLinecap="round"
          strokeWidth="8"
        />
        <path
          d="M170 120c34 18 80 28 140 28 60 0 106-10 140-28"
          fill="none"
          opacity="0.22"
          stroke={`url(#${uniqueId}-shine)`}
          strokeLinecap="round"
          strokeWidth="18"
        />
      </g>
    </svg>
  );
}

export function ApparelMockup({ tone, view, className = '', mode = 'stage' }: ApparelMockupProps) {
  if (PHOTO_MOCKUP_MAP[view]) {
    return <PhotoApparelMockup className={className} mode={mode} tone={tone} view={view} />;
  }

  return <FlatTeeMockup className={className} tone={tone} view={view} />;
}
