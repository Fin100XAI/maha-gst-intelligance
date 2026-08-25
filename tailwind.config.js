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
        },
        // BMC Intelligence institutional palette — used for the header, landing
        // page and sign-in screen only, so those surfaces read as one shared
        // brand system with the corporation's other intelligence platforms.
        govt: {
          50: '#eef4ff',
          100: '#dae7ff',
          200: '#bcd3ff',
          300: '#8db4fe',
          400: '#5a8ffa',
          500: '#2f6bef',
          600: '#1d4fd8',
          700: '#1a3faf',
          800: '#1b378a',
          // The corporation's own civic blue — read directly off mcgm.gov.in's
          // top utility bar — used for the header and navbar bands specifically.
          900: '#0051bb',
          950: '#101d45'
        },
        rail: {
          900: '#070d1c',
          800: '#0b1428',
          700: '#101d38',
          600: '#16264a',
          500: '#1d3160',
          400: '#294478'
        },
        intel: {
          50: '#ecfeff',
          100: '#cbf8fb',
          200: '#9deff5',
          300: '#5fdfec',
          400: '#22c4d8',
          500: '#08a3ba',
          600: '#05819a',
          700: '#0a677d',
          800: '#0f5366',
          900: '#124556'
        },
        gold: {
          50: '#fdf9ec',
          100: '#f5ebcc',
          200: '#ecdba0',
          300: '#d6ba5f',
          400: '#d2b040',
          500: '#cda629',
          600: '#c2a01e',
          700: '#9a7d16'
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
