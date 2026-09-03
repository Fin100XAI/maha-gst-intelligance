/** @type {import('tailwindcss').Config} */

// Colour families that flip between light and dark are declared as CSS variables
// rather than literal hex, so a theme switch is one block of variable
// reassignments in index.css instead of a `dark:` variant on every element.
// The channel triplets live in index.css; `<alpha-value>` keeps Tailwind's
// slash-opacity syntax (`bg-steel-50/60`) working.
const themed = (family, shades) =>
  Object.fromEntries(shades.map(s => [s, `rgb(var(--c-${family}-${s}) / <alpha-value>)`]))

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
        // Headings, body text, subtle tinted panels and borders. Inverts wholesale
        // under the dark theme: navy-900 is the darkest ink in light and the
        // brightest in dark, so `text-navy-900` stays "the strongest heading colour"
        // in both. Never use it for a solid surface carrying white text — that's
        // what `ink` is for.
        navy: themed('navy', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        // Neutral surfaces, secondary text and borders. Inverts the same way.
        steel: themed('steel', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        // The card/panel ground. `bg-white` is remapped to this same token in
        // index.css, so plain `bg-white` keeps working; `surface` exists for the
        // places a *literal* white slips past that remap — gradient stops such
        // as `via-white`, which are a different utility entirely.
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        // Solid surfaces that always carry white text — primary buttons, active
        // pills, progress fills, the modal scrim. This family does NOT invert:
        // its dark ramp is retuned to stay white-text-legible on a dark page
        // rather than flipped, which is why it can't just be `navy`.
        ink: themed('ink', [500, 600, 700, 800, 900, 950]),
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
        maharisk: {
          low: '#1f8a4c',
          medium: '#d99a15',
          high: '#d9631c',
          critical: '#c41e3a'
        },
        // BMC Intelligence institutional palette — used for the header, landing
        // page and sign-in screen only, so those surfaces read as one shared
        // brand system with the corporation's other intelligence platforms.
        // Fixed in both themes: these bands are dark to begin with.
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
        card: 'var(--shadow-card)',
        panel: 'var(--shadow-panel)'
      }
    }
  },
  plugins: []
}
