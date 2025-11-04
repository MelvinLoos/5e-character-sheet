/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        fell: ['"IM Fell English SC"', 'serif'],
        garamond: ['"EB Garamond"', 'serif'],
      },
      colors: {
        'sheet-bg': '#fdf6e3',
        'sheet-text': '#3a2d21',
        'sheet-red': '#8c1d1d',
        'sheet-red-dark': '#6a1616',
        'sheet-border': '#5c4d3d',
        'sheet-accent': '#c9b7a2',
        'sheet-input-bg': '#eaddc7',
      },
    },
  },
  plugins: [],
}
