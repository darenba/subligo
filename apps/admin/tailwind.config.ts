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
        admin: '#0F141E',
        signal: '#58B0DB',
        sand: '#F3EFE6',
        paper: '#FFF8EA',
        brand: '#FCD122',
        accent: '#B88312',
        line: '#D5C7A0',
        lime: '#99C450',
      },
      boxShadow: {
        ambient: '0 24px 80px rgba(15, 20, 30, 0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
