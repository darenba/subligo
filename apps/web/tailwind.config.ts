import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Sora"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#0F141E',
        fog: '#F3EFE6',
        paper: '#FFF8EA',
        accent: '#B88312',
        brand: '#FCD122',
        line: '#D5C7A0',
        lime: '#99C450',
        sky: '#58B0DB',
        plum: '#CF5F9F',
        flame: '#EBA817',
      },
      boxShadow: {
        ambient: '0 24px 80px rgba(15, 20, 30, 0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
