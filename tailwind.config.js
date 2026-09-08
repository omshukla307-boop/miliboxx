/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  safelist: ['w-14', 'w-56', 'lg:w-14', 'lg:w-56'],
  theme: {
    extend: {
      /*
       * ALL color tokens delegate to CSS custom properties defined in index.css.
       * This means every Tailwind class like `text-text-secondary` or `bg-bg-card`
       * automatically responds to the .dark-mode / .light-mode class on <html>.
       */
      colors: {
        bg: {
          DEFAULT: 'var(--bg)',
          surface:  'var(--bg-surface)',
          card:     'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
          border:   'var(--bg-border)',
        },
        accent: {
          blue:       'var(--accent-blue)',
          'blue-dim': 'var(--accent-blue-dim)',
          'blue-muted':'var(--accent-blue-muted)',
        },
        status: {
          normal:         'var(--status-normal)',
          'normal-dim':   'var(--status-normal-dim)',
          'normal-bg':    'var(--status-normal-bg)',
          warning:        'var(--status-warning)',
          'warning-dim':  'var(--status-warning-dim)',
          'warning-bg':   'var(--status-warning-bg)',
          critical:       'var(--status-critical)',
          'critical-dim': 'var(--status-critical-dim)',
          'critical-bg':  'var(--status-critical-bg)',
          info:           'var(--status-info)',
          'info-bg':      'var(--status-info-bg)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': '0.65rem',
      },
      borderRadius: {
        sm:      '3px',
        DEFAULT: '4px',
        md:      '6px',
        lg:      '8px',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)',
        panel: '0 4px 12px rgba(0,0,0,0.2)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.3 },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(20px)', opacity: 0 },
          '100%': { transform: 'translateX(0)',    opacity: 1 },
        },
        'fade-in': {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'slide-in':  'slide-in-right 0.25s ease-out',
        'fade-in':   'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
