/** @type {import('tailwindcss').Config} */
//
// 2026.8.21 — 색을 CSS 변수로 위임.
//
// 핵심: 값을 rgb(var(--c-x) / <alpha-value>) 형태로 써야 한다.
// 그래야 코드 곳곳의 투명도 수식어(bg-rose-gold/10, border-rose-gold/30 등 40곳 이상)가
// 그대로 동작한다. HEX나 var(--x)를 그냥 쓰면 /10 수식어가 전부 깨진다.
//
// 이렇게 하면 JSX를 한 줄도 고치지 않고 기존 bg-rose-gold, text-mauve,
// border-cream-deeper 클래스가 전부 테마를 따라간다.
// 다만 JSX에 박힌 임의값(text-[#3D2B2B] 같은 것)은 따라오지 않는다 — P3에서 화면 단위로 교체.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)'],
        display: ['var(--font-display)'],
      },
      colors: {
        rose: {
          gold: 'rgb(var(--c-accent) / <alpha-value>)',
          'gold-light': 'rgb(var(--c-accent-light) / <alpha-value>)',
          'gold-dark': 'rgb(var(--c-accent-dark) / <alpha-value>)',
        },
        mauve: {
          DEFAULT: 'rgb(var(--c-secondary) / <alpha-value>)',
          light: 'rgb(var(--c-secondary-light) / <alpha-value>)',
          dark: 'rgb(var(--c-secondary-dark) / <alpha-value>)',
        },
        cream: {
          DEFAULT: 'rgb(var(--c-bg) / <alpha-value>)',
          dark: 'rgb(var(--c-bg-dark) / <alpha-value>)',
          deeper: 'rgb(var(--c-bg-deeper) / <alpha-value>)',
        },
        // 신규 — P3에서 임의값(text-[#3D2B2B]) 대체용
        ink: {
          DEFAULT: 'rgb(var(--c-ink) / <alpha-value>)',
          muted: 'rgb(var(--c-ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--c-ink-faint) / <alpha-value>)',
        },
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        line: 'rgb(var(--c-border) / <alpha-value>)',
        risk: {
          1: 'rgb(var(--c-risk-1) / <alpha-value>)',
          2: 'rgb(var(--c-risk-2) / <alpha-value>)',
          3: 'rgb(var(--c-risk-3) / <alpha-value>)',
          4: 'rgb(var(--c-risk-4) / <alpha-value>)',
          5: 'rgb(var(--c-risk-5) / <alpha-value>)',
        },
      },
      borderRadius: {
        card: 'var(--r-card)',
        btn: 'var(--r-btn)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
      },
      backgroundImage: {
        'rose-gradient': 'var(--g-brand)',
        'cream-gradient': 'var(--g-bg)',
        'card-gradient': 'linear-gradient(135deg, rgb(var(--c-accent) / 0.1) 0%, rgb(var(--c-secondary) / 0.1) 100%)',
      },
    },
  },
  plugins: [],
}
