/** Tailwind reads the design tokens; it never redefines them.
 *  docs/03 section 1 is the single source of colour truth. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--surface-page)',
        chart: 'var(--surface-chart)',
        raised: 'var(--surface-raised)',
        sunken: 'var(--surface-sunken)',
        ink: {
          DEFAULT: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
          inverse: 'var(--ink-inverse)',
        },
        line: { DEFAULT: 'var(--border)', strong: 'var(--border-strong)', grid: 'var(--gridline)' },
        /* Brand. Never a status, never a data series -- see tokens.css. */
        navy: { DEFAULT: 'var(--navy)', deep: 'var(--navy-deep)', ink: 'var(--navy-ink)' },
        gold: { DEFAULT: 'var(--gold)', soft: 'var(--gold-soft)', deep: 'var(--gold-deep)' },
        /* The institutional bands ported from maha-gst-intelligance. Chrome
           only -- landing page, officer sign-in, the shell's identity band.
           Never a status, never a data series (see tokens.css). */
        govt: {
          50: 'rgb(var(--govt-50) / <alpha-value>)',
          100: 'rgb(var(--govt-100) / <alpha-value>)',
          200: 'rgb(var(--govt-200) / <alpha-value>)',
          300: 'rgb(var(--govt-300) / <alpha-value>)',
          400: 'rgb(var(--govt-400) / <alpha-value>)',
          500: 'rgb(var(--govt-500) / <alpha-value>)',
          600: 'rgb(var(--govt-600) / <alpha-value>)',
          700: 'rgb(var(--govt-700) / <alpha-value>)',
          800: 'rgb(var(--govt-800) / <alpha-value>)',
          900: 'rgb(var(--govt-900) / <alpha-value>)',
          950: 'rgb(var(--govt-950) / <alpha-value>)',
          accent: 'rgb(var(--govt-accent) / <alpha-value>)',
        },
        govtgold: {
          50: 'rgb(var(--govt-gold-50) / <alpha-value>)',
          100: 'rgb(var(--govt-gold-100) / <alpha-value>)',
          200: 'rgb(var(--govt-gold-200) / <alpha-value>)',
          300: 'rgb(var(--govt-gold-300) / <alpha-value>)',
          400: 'rgb(var(--govt-gold-400) / <alpha-value>)',
          500: 'rgb(var(--govt-gold-500) / <alpha-value>)',
          600: 'rgb(var(--govt-gold-600) / <alpha-value>)',
          700: 'rgb(var(--govt-gold-700) / <alpha-value>)',
        },
        rail: { 700: 'rgb(var(--rail-700) / <alpha-value>)', 900: 'rgb(var(--rail-900) / <alpha-value>)' },
        intel: { 300: 'rgb(var(--intel-300) / <alpha-value>)', 400: 'rgb(var(--intel-400) / <alpha-value>)' },
        saffron: { DEFAULT: 'var(--saffron)', deep: 'var(--saffron-deep)' },
        accent: { DEFAULT: 'var(--accent)', soft: 'var(--accent-soft)' },
        cat: {
          1: 'var(--cat-1)',
          2: 'var(--cat-2)',
          3: 'var(--cat-3)',
          4: 'var(--cat-4)',
        },
        status: {
          good: 'var(--status-good)',
          warning: 'var(--status-warning)',
          serious: 'var(--status-serious)',
          critical: 'var(--status-critical)',
          unknown: 'var(--status-unknown)',
        },
        seq: {
          1: 'var(--seq-1)',
          2: 'var(--seq-2)',
          3: 'var(--seq-3)',
          4: 'var(--seq-4)',
          5: 'var(--seq-5)',
          6: 'var(--seq-6)',
        },
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        xs: ['var(--text-xs)', 'var(--leading)'],
        sm: ['var(--text-sm)', 'var(--leading)'],
        base: ['var(--text-base)', 'var(--leading)'],
        md: ['var(--text-md)', 'var(--leading)'],
        lg: ['var(--text-lg)', '1.3'],
        xl: ['var(--text-xl)', '1.25'],
        '2xl': ['var(--text-2xl)', '1.2'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        DEFAULT: 'var(--shadow)',
        lg: 'var(--shadow-lg)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
        spring: 'var(--ease-spring)',
        DEFAULT: 'var(--ease)',
      },
      transitionDuration: { DEFAULT: 'var(--motion)' },
    },
  },
  plugins: [],
}
