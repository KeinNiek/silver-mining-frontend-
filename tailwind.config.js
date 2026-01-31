/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base/Background colors - all themeable via CSS variables
        silver: {
          50: 'var(--bg-50)',
          100: 'var(--bg-100)',
          200: 'var(--bg-200)',
          300: 'var(--bg-300)',
          400: 'var(--bg-400)',
          500: 'var(--bg-500)',
          600: 'var(--bg-600)',
          700: 'var(--bg-700)',
          800: 'var(--bg-800)',
          900: 'var(--bg-900)',
          950: 'var(--bg-950)',
        },
        // Accent/Copper colors - themeable via CSS variables
        copper: {
          50: 'var(--accent-50)',
          100: 'var(--accent-100)',
          200: 'var(--accent-200)',
          300: 'var(--accent-300)',
          400: 'var(--accent-400)',
          500: 'var(--accent-500)',
          600: 'var(--accent-600)',
          700: 'var(--accent-700)',
          800: 'var(--accent-800)',
          900: 'var(--accent-900)',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px var(--glow-light)' },
          '100%': { boxShadow: '0 0 40px var(--glow-strong)' },
        },
      },
    },
  },
  plugins: [],
};