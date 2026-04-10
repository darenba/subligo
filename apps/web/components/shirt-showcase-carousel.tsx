'use client';

import { useEffect, useState } from 'react';

import { HOME_COPY } from '../lib/home-copy';
import { SHIRT_SHOWCASE_SLIDES } from '../lib/shirt-showcase-slides';

export function ShirtShowcaseCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % SHIRT_SHOWCASE_SLIDES.length);
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full min-h-[600px] overflow-hidden rounded-[34px] border border-white/10 bg-[#171c12] lg:min-h-[640px] xl:min-h-[680px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(252,209,34,0.14),transparent_26%),linear-gradient(145deg,#1b200d,#252d11_46%,#30380d)]" />
      <div className="relative z-10 h-full min-h-[600px] lg:min-h-[640px] xl:min-h-[680px]">
        <div className="absolute left-5 top-5 z-20 rounded-full border border-white/12 bg-black/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/88 backdrop-blur-md lg:left-6 lg:top-6">
          {HOME_COPY.heroVisual.label}
        </div>

        <div className="absolute inset-0 overflow-hidden">
          {SHIRT_SHOWCASE_SLIDES.map((slide, index) => (
            <div
              className={`absolute inset-0 transition-all duration-700 ${
                index === activeIndex
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none translate-y-4 opacity-0'
              }`}
              key={slide.src}
            >
              <div className="absolute inset-0 flex items-end justify-center px-2 pb-6 pt-2 sm:px-3 sm:pb-7 sm:pt-3 lg:px-4 lg:pb-8 lg:pt-4">
                <img
                  alt={slide.alt}
                  className="h-[122%] w-[122%] max-w-none object-contain object-center drop-shadow-[0_34px_48px_rgba(0,0,0,0.42)] sm:h-[124%] sm:w-[124%] lg:h-[128%] lg:w-[128%]"
                  decoding="async"
                  loading={index === 0 ? 'eager' : 'lazy'}
                  src={slide.src}
                  style={{ transform: 'translateY(9%)' }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 overflow-hidden rounded-b-[34px]">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(180deg,rgba(10,14,8,0)_0%,rgba(10,14,8,0.16)_18%,rgba(10,14,8,0.58)_56%,rgba(10,14,8,0.92)_100%)] sm:h-52 lg:h-56 xl:h-60" />

          <div className="relative flex flex-col items-center gap-3 px-4 pb-4 pt-16 sm:px-5 sm:pb-5 sm:pt-20 lg:px-6 lg:pb-6 lg:pt-24">
            <div className="w-full max-w-[320px] self-end rounded-[22px] border border-white/18 bg-[rgba(18,23,13,0.68)] px-4 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.22)] backdrop-blur-lg sm:max-w-[340px] lg:max-w-[352px] lg:px-5 lg:py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d4ff7d]">
                {HOME_COPY.heroVisual.boxTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/90">
                {HOME_COPY.heroVisual.boxText}
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 backdrop-blur-md">
              {SHIRT_SHOWCASE_SLIDES.map((slide, index) => (
                <button
                  aria-label={`Mostrar referencia ${index + 1}`}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeIndex ? 'w-8 bg-brand' : 'w-2.5 bg-white/45 hover:bg-white/65'
                  }`}
                  key={slide.src}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
