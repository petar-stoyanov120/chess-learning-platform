import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        chess: {
          dark: '#1a1a2e',
          mid: '#16213e',
          accent: '#0f3460',
          gold: '#e94560',
          light: '#f5f5f5',
          green: '#4caf50',
          cream: '#f0d9b5',
          brown: '#b58863',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
