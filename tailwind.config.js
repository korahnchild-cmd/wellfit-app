/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
      },
      colors: {
        rose: {
          gold: '#C8956C',
          'gold-light': '#E8B89A',
          'gold-dark': '#A67450',
        },
        mauve: {
          DEFAULT: '#8B5E83',
          light: '#B08AAA',
          dark: '#6B4464',
        },
        cream: {
          DEFAULT: '#FDFAF6',
          dark: '#F5EFE6',
          deeper: '#EDE3D8',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'rose-gradient': 'linear-gradient(135deg, #C8956C 0%, #8B5E83 100%)',
        'cream-gradient': 'linear-gradient(180deg, #FDFAF6 0%, #F5EFE6 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(200,149,108,0.1) 0%, rgba(139,94,131,0.1) 100%)',
      },
    },
  },
  plugins: [],
}
