type BrandArtVariant =
  | 'apparel'
  | 'mug'
  | 'tumbler'
  | 'banner'
  | 'signage'
  | 'cap'
  | 'mix';

type BrandProductArtProps = {
  variant: BrandArtVariant;
  className?: string;
  badge?: string;
};

const WRAPPER_CLASS =
  'relative overflow-hidden rounded-[32px] border border-line/70 bg-[#0f141e] shadow-ambient';

function PaintBackdrop() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(88,176,219,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(252,209,34,0.18),transparent_28%),linear-gradient(135deg,#111826,#0f141e_50%,#17243c)]" />
      <div className="absolute inset-y-0 left-[10%] w-24 rotate-[18deg] bg-white/[0.03]" />
      <div className="absolute inset-y-0 left-[48%] w-20 rotate-[18deg] bg-white/[0.02]" />
      <div className="absolute -left-6 bottom-10 h-24 w-24 rounded-full bg-[#58B0DB]" />
      <div className="absolute left-14 bottom-6 h-14 w-14 rounded-full bg-[#FCD122]" />
      <div className="absolute right-8 top-12 h-16 w-16 rounded-full bg-[#CF5F9F]" />
      <div className="absolute right-20 bottom-10 h-10 w-10 rounded-full bg-[#99C450]" />
    </>
  );
}

function Badge({ label }: { label?: string }) {
  if (!label) return null;

  return (
    <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#FCD122] backdrop-blur">
      {label}
    </div>
  );
}

function MiniProfileView() {
  return (
    <svg className="h-[150px] w-full" fill="none" viewBox="0 0 260 320">
      <defs>
        <linearGradient id="brand-profile-shirt" x1="72" x2="180" y1="38" y2="284" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="0.58" stopColor="#f4f4f3" />
          <stop offset="1" stopColor="#dfe3e7" />
        </linearGradient>
      </defs>
      <g>
        <path
          d="M104 28c20 0 38 8 52 22l26 26c12 12 18 26 18 42v20c0 16-6 30-18 42l-14 14v90c0 28-20 56-62 56-22 0-40-8-56-22V72c14-30 30-44 54-44Z"
          fill="url(#brand-profile-shirt)"
        />
        <path
          d="M114 42c16 0 30 6 42 18l14 14c8 8 12 16 14 24h-26c-2-6-6-12-12-18l-14-14c-6-6-12-8-20-8-10 0-18 4-22 14l-10 18H56l8-18c8-20 26-30 50-30Z"
          fill="#d9dee4"
        />
        <path d="M78 110h98" opacity="0.16" stroke="#0f141e" strokeLinecap="round" strokeWidth="5" />
        <path d="M78 154h64" opacity="0.1" stroke="#0f141e" strokeLinecap="round" strokeWidth="6" />
        <path d="M78 202h66" opacity="0.08" stroke="#0f141e" strokeLinecap="round" strokeWidth="6" />
        <rect
          height="96"
          opacity="0.26"
          rx="18"
          stroke="rgba(15,20,30,0.12)"
          strokeDasharray="8 8"
          width="54"
          x="76"
          y="138"
        />
      </g>
    </svg>
  );
}

function ApparelArt() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_28%),linear-gradient(135deg,#111826,#0f141e_50%,#17243c)]" />
      <div className="absolute left-[7%] top-[10%] h-[78%] w-[48%] rounded-[34px] bg-white/[0.06] shadow-[0_30px_50px_rgba(0,0,0,0.22)]">
        <img
          alt=""
          aria-hidden="true"
          className="h-full w-full object-contain object-bottom drop-shadow-[0_34px_44px_rgba(0,0,0,0.28)]"
          src="/mockups/shirt-angle-subligo-vector.png"
        />
      </div>
      <div className="absolute right-[8%] top-[12%] flex w-[30%] flex-col gap-3">
        <div className="rounded-[24px] border border-white/12 bg-white/[0.12] p-3 shadow-[0_20px_34px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="rounded-[20px] border border-white/12 bg-white/80 p-2">
            <img
              alt=""
              aria-hidden="true"
              className="h-[132px] w-full object-contain object-bottom"
              src="/mockups/shirt-front-subligo-vector.png"
            />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/74">
            Frente
          </p>
        </div>
        <div className="rounded-[24px] border border-white/12 bg-white/[0.12] p-3 shadow-[0_20px_34px_rgba(0,0,0,0.18)] backdrop-blur">
          <div className="rounded-[20px] border border-white/12 bg-white/80 p-2">
            <img
              alt=""
              aria-hidden="true"
              className="h-[132px] w-full object-contain object-center"
              src="/mockups/shirt-back-subligo-vector.png"
            />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/74">
            Espalda
          </p>
        </div>
      </div>
      <div className="absolute bottom-6 left-6 rounded-full border border-white/16 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#FCD122]">
        frente / espalda / lateral
      </div>
    </>
  );
}

function MugArt() {
  return (
    <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 800 560">
      <g opacity="0.2">
        <path d="M86 434c8-72 54-118 138-136" stroke="#58B0DB" strokeLinecap="round" strokeWidth="22" />
        <path d="M644 150c40 12 74 46 92 94" stroke="#CF5F9F" strokeLinecap="round" strokeWidth="18" />
      </g>
      <g transform="translate(196 126)">
        <rect fill="#FFFFFF" height="230" rx="28" width="250" x="0" y="48" />
        <rect fill="#E7E8EC" height="22" rx="11" width="250" x="0" y="48" />
        <path d="M250 96h44c28 0 50 22 50 50v40c0 28-22 50-50 50h-44" stroke="#FFFFFF" strokeWidth="34" />
        <circle cx="126" cy="166" fill="#0F141E" r="62" />
        <text fill="#FCD122" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="700" textAnchor="middle" x="126" y="176">
          SubliGo
        </text>
      </g>
      <path d="M146 472c74-28 170-34 248-10" stroke="#FCD122" strokeLinecap="round" strokeWidth="22" />
      <circle cx="628" cy="410" fill="#99C450" r="18" />
    </svg>
  );
}

function TumblerArt() {
  return (
    <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 800 560">
      <g opacity="0.2">
        <path d="M76 426c60-30 128-38 202-20" stroke="#58B0DB" strokeLinecap="round" strokeWidth="20" />
        <path d="M628 168c44 10 90 42 110 86" stroke="#CF5F9F" strokeLinecap="round" strokeWidth="18" />
      </g>
      <g transform="translate(268 68)">
        <path d="M100 8h96l18 70-16 248c-2 30-28 54-58 54h-14c-30 0-56-24-58-54L52 78 100 8Z" fill="#E9EDF1" />
        <path d="M78 78h158l-10 170c-30 10-64 14-98 14-34 0-68-4-98-14L20 78h58Z" fill="#1C2A44" />
        <path d="M90 22h116l8 28H84l6-28Z" fill="#FCD122" />
        <circle cx="132" cy="168" fill="#0F141E" r="54" />
        <text fill="#FCD122" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="700" textAnchor="middle" x="132" y="176">
          SG
        </text>
        <rect fill="#D5DDE7" height="34" rx="12" width="84" x="90" y="328" />
      </g>
      <path d="M164 470c90-42 206-52 324-26" stroke="#FCD122" strokeLinecap="round" strokeWidth="22" />
    </svg>
  );
}

function BannerArt() {
  return (
    <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 800 560">
      <g opacity="0.2">
        <path d="M74 428c72-36 162-46 246-24" stroke="#58B0DB" strokeLinecap="round" strokeWidth="18" />
        <circle cx="662" cy="132" fill="#CF5F9F" r="46" />
      </g>
      <g transform="translate(166 82)">
        <rect fill="#FFFFFF" height="296" rx="24" width="290" x="0" y="26" />
        <rect fill="#0F141E" height="86" rx="20" width="290" x="0" y="26" />
        <rect fill="#FCD122" height="16" rx="8" width="120" x="28" y="138" />
        <rect fill="#1C2A44" height="16" rx="8" width="206" x="28" y="168" />
        <rect fill="#CF5F9F" height="16" rx="8" width="152" x="28" y="198" />
        <rect fill="#99C450" height="16" rx="8" width="172" x="28" y="228" />
        <text fill="#FCD122" fontFamily="Arial, sans-serif" fontSize="30" fontWeight="700" x="28" y="84">
          GRAN FORMATO
        </text>
        <path d="M18 0V366" stroke="#F3EFE6" strokeLinecap="round" strokeWidth="10" />
        <path d="M456 0V366" stroke="#F3EFE6" strokeLinecap="round" strokeWidth="10" />
        <path d="M18 366h438" stroke="#F3EFE6" strokeLinecap="round" strokeWidth="10" />
      </g>
    </svg>
  );
}

function SignageArt() {
  return (
    <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 800 560">
      <g opacity="0.2">
        <path d="M90 438c74-30 160-36 230-18" stroke="#58B0DB" strokeLinecap="round" strokeWidth="18" />
        <path d="M612 138c34 10 70 38 88 76" stroke="#99C450" strokeLinecap="round" strokeWidth="18" />
      </g>
      <g transform="translate(120 112)">
        <rect fill="#FFFFFF" height="240" rx="24" width="140" x="0" y="0" />
        <rect fill="#0F141E" height="72" rx="20" width="140" x="0" y="0" />
        <rect fill="#FCD122" height="16" rx="8" width="78" x="24" y="102" />
        <rect fill="#1C2A44" height="16" rx="8" width="94" x="24" y="132" />
        <rect fill="#CF5F9F" height="16" rx="8" width="64" x="24" y="162" />
      </g>
      <g transform="translate(304 78)">
        <rect fill="#FFFFFF" height="306" rx="28" width="176" x="0" y="0" />
        <rect fill="#0F141E" height="86" rx="22" width="176" x="0" y="0" />
        <text fill="#FCD122" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700" x="24" y="52">
          VINIL
        </text>
        <rect fill="#58B0DB" height="12" rx="6" width="112" x="24" y="120" />
        <rect fill="#FCD122" height="12" rx="6" width="126" x="24" y="146" />
        <rect fill="#99C450" height="12" rx="6" width="102" x="24" y="172" />
      </g>
      <g transform="translate(530 144)">
        <circle cx="44" cy="44" fill="#FFFFFF" r="44" />
        <circle cx="120" cy="78" fill="#FFFFFF" r="28" />
        <circle cx="178" cy="42" fill="#FFFFFF" r="20" />
        <circle cx="44" cy="44" fill="#0F141E" r="28" />
        <text fill="#FCD122" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="700" textAnchor="middle" x="44" y="50">
          SG
        </text>
      </g>
    </svg>
  );
}

function CapArt() {
  return (
    <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 800 560">
      <g opacity="0.18">
        <path d="M92 430c62-28 134-34 206-18" stroke="#58B0DB" strokeLinecap="round" strokeWidth="18" />
        <circle cx="652" cy="142" fill="#CF5F9F" r="40" />
      </g>
      <g transform="translate(180 162)">
        <path
          d="M74 120c0-62 52-112 114-112 76 0 150 36 214 104-14 18-34 28-58 28H74v-20Z"
          fill="#FFFFFF"
        />
        <path
          d="M52 146c42-20 92-30 150-30 96 0 168 18 216 54-32 30-86 48-160 54-108 8-188-22-206-78Z"
          fill="#FCD122"
        />
        <circle cx="198" cy="102" fill="#0F141E" r="36" />
        <text fill="#FCD122" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="700" textAnchor="middle" x="198" y="108">
          SG
        </text>
      </g>
    </svg>
  );
}

function MixArt() {
  return (
    <svg className="absolute inset-0 h-full w-full" fill="none" viewBox="0 0 800 560">
      <g opacity="0.2">
        <path d="M68 432c80-44 176-54 282-30" stroke="#58B0DB" strokeLinecap="round" strokeWidth="22" />
        <path d="M620 140c44 12 90 50 108 98" stroke="#CF5F9F" strokeLinecap="round" strokeWidth="18" />
      </g>
      <g transform="translate(74 166) scale(0.72)">
        <path d="M94 32 154 0l46 36 42-12 68 58-34 54-42-22v216H52V114L10 136 0 84l72-60 22 8Z" fill="#FFFFFF" />
        <circle cx="162" cy="130" fill="#0F141E" r="40" />
        <text fill="#FCD122" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="700" textAnchor="middle" x="162" y="138">
          SG
        </text>
      </g>
      <g transform="translate(278 108) scale(0.72)">
        <rect fill="#FFFFFF" height="230" rx="28" width="250" x="0" y="48" />
        <path d="M250 96h44c28 0 50 22 50 50v40c0 28-22 50-50 50h-44" stroke="#FFFFFF" strokeWidth="34" />
        <circle cx="126" cy="166" fill="#0F141E" r="62" />
        <text fill="#FCD122" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="700" textAnchor="middle" x="126" y="176">
          SubliGo
        </text>
      </g>
      <g transform="translate(506 84) scale(0.62)">
        <path d="M100 8h96l18 70-16 248c-2 30-28 54-58 54h-14c-30 0-56-24-58-54L52 78 100 8Z" fill="#E9EDF1" />
        <path d="M78 78h158l-10 170c-30 10-64 14-98 14-34 0-68-4-98-14L20 78h58Z" fill="#1C2A44" />
        <path d="M90 22h116l8 28H84l6-28Z" fill="#FCD122" />
      </g>
      <g transform="translate(520 264) scale(0.52)">
        <rect fill="#FFFFFF" height="296" rx="24" width="290" x="0" y="26" />
        <rect fill="#0F141E" height="86" rx="20" width="290" x="0" y="26" />
        <rect fill="#FCD122" height="16" rx="8" width="120" x="28" y="138" />
        <rect fill="#1C2A44" height="16" rx="8" width="206" x="28" y="168" />
      </g>
      <path d="M114 478c120-42 280-44 414-8" stroke="#FCD122" strokeLinecap="round" strokeWidth="20" />
    </svg>
  );
}

export function BrandProductArt({ variant, className = '', badge }: BrandProductArtProps) {
  return (
    <div className={`${WRAPPER_CLASS} ${className}`}>
      <PaintBackdrop />
      <Badge label={badge} />
      {variant === 'apparel' ? <ApparelArt /> : null}
      {variant === 'mug' ? <MugArt /> : null}
      {variant === 'tumbler' ? <TumblerArt /> : null}
      {variant === 'banner' ? <BannerArt /> : null}
      {variant === 'signage' ? <SignageArt /> : null}
      {variant === 'cap' ? <CapArt /> : null}
      {variant === 'mix' ? <MixArt /> : null}
    </div>
  );
}

export type { BrandArtVariant };
