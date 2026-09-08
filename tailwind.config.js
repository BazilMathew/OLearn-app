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
        'gpay-bg': '#F8F9FA'
      }
    },
  },
  plugins: [],
}
