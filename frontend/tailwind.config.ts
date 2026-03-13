import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        toss: {
          blue: '#3182F6',
          'blue-focus': '#1B64DA',
          bg: '#F2F4F6',
          text: {
            primary: '#191F28',
            secondary: '#6B7684',
            placeholder: '#ADB5BD',
          },
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      borderRadius: {
        'toss-base': '12px',
        'toss-large': '24px',
      },
      boxShadow: {
        'toss': '0 8px 24px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
export default config;
