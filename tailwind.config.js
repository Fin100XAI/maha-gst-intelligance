/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Inter has no Devanagari glyphs, so Marathi/Hindi text (translated summaries,
        // briefing notes) would otherwise silently fall through to whatever Devanagari
        // font happens to be installed on the OS — inconsistent weight, sometimes missing
        // entirely. Noto Sans Devanagari is listed explicitly so those glyphs render the
        // same way on every machine, matching the rest of the UI's weight and rhythm.
        sans: ['"Inter"', '"Noto Sans Devanagari"', '"Noto Sans"', '"Segoe UI"', 'system-ui', 'sans-serif']
      },
      colors: {
        navy: {
          50: '#eef2f8',
          100: '#d6e0ee',
          200: '#adc1dd',
          300: '#7e9cc6',
          400: '#4f76ac',
          500: '#305a91',
          600: '#204575',
          700: '#17335a',
          800: '#0f2340',
          900: '#0a1830',
          950: '#060f20'
        },
        saffron: {
          50: '#fff8ec',
          100: '#ffedc9',
          200: '#ffd98c',
          300: '#ffc04f',
          400: '#ffa823',
          500: '#f78c0a',
          600: '#db6a05',
          700: '#b64c08',
          800: '#93390d',
          900: '#792f0e'
        },
        steel: {
          50: '#f5f6f8',
          100: '#e8eaee',
          200: '#d3d7de',
          300: '#b0b7c3',
          400: '#8791a3',
          500: '#697289',
          600: '#545c71',
          700: '#454b5c',
          800: '#3b404d',
          900: '#343843'
        },
        maharisk: {
          low: '#1f8a4c',
          medium: '#d99a15',
          high: '#d9631c',
          critical: '#c41e3a'
        }
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15,35,64,0.06), 0 1px 3px 0 rgba(15,35,64,0.08)',
        panel: '0 4px 16px -4px rgba(15,35,64,0.12), 0 2px 4px -2px rgba(15,35,64,0.08)'
      }
    }
  },
  plugins: []
}
