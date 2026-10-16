/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wa-teal': '#075E54',
        'wa-green': '#128C7E',
        'wa-light-green': '#25D366',
        'wa-bg': '#EFEAE2',
        'gpay-blue': '#1A73E8',
        'gpay-dark-blue': '#0D47A1',
        'gpay-light-blue': '#E8F0FE',
        'gpay-bg': '#F8F9FA',

        // OLearn design tokens: calm warm neutrals with one saffron accent
        canvas: '#F6F1EA',
        surface: '#FFFDF9',
        line: '#E4D9CB',
        ink: {
          DEFAULT: '#2B2620',
          muted: '#5C534A'
        },
        accent: {
          DEFAULT: '#F2A93B',
          deep: '#8A5207',
          soft: '#FCEBCF'
        },
        danger: {
          DEFAULT: '#B4232C',
          soft: '#FBE9E7'
        },
        success: {
          DEFAULT: '#276B43',
          soft: '#E3F2E8'
        }
      },
      // One spacing scale (4 / 8 / 12 / 16 / 24 / 32)
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px'
      },
      borderRadius: {
        card: '24px',
        btn: '20px'
      },
      // Soft SOLID shadows: offset only, no blur
      boxShadow: {
        card: '0 4px 0 0 #E4D9CB',
        'card-pressed': '0 1px 0 0 #E4D9CB'
      },
      // Type hierarchy; nothing below 18px
      fontSize: {
        display: ['32px', { lineHeight: '38px', fontWeight: '800' }],
        title: ['26px', { lineHeight: '32px', fontWeight: '700' }],
        body: ['20px', { lineHeight: '28px' }],
        label: ['18px', { lineHeight: '24px', fontWeight: '600' }]
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Roboto',
          '"Segoe UI"',
          '"Noto Sans"',
          '"Noto Sans Devanagari"',
          '"Noto Sans Malayalam"',
          'sans-serif'
        ]
      }
    },
  },
  plugins: [],
}
