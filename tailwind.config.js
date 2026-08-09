/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        canvas: '#F4F6FA',
        ink: {
          DEFAULT: '#0F172A',
          soft: '#475569',
          muted: '#64748B',
        },
        line: '#E2E8F0',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 6px 16px -6px rgba(15, 23, 42, 0.08)',
        lift: '0 2px 4px rgba(15, 23, 42, 0.05), 0 16px 32px -12px rgba(15, 23, 42, 0.16)',
        dialog: '0 32px 64px -16px rgba(2, 6, 23, 0.45)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}
