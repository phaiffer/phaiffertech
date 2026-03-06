import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f4f6fb',
        ink: '#12213f',
        action: '#1f6feb',
        accent: '#16a34a',
        panel: '#ffffff'
      },
      boxShadow: {
        card: '0 8px 30px rgba(18, 33, 63, 0.08)'
      }
    }
  },
  plugins: []
};

export default config;
