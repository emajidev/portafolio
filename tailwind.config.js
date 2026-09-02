/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        matrix: {
          bg: '#03050a',
          neon: '#00E5FF',
          terminal: '#7DF9FF',
          glow: '#22D3EE',
          dark: '#0a0e16',
          soft: '#EDEDED',
          yes: '#FFD500',
          no: '#FF3B3B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 20px rgba(139, 255, 77, 0.3)',
        'neon-sm': '0 0 10px rgba(139, 255, 77, 0.25)',
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
