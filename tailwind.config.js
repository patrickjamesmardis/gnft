const dt = require('tailwindcss/defaultTheme');

dt.screens.xl = '1320px';
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    screens: {
      xs: '480px',
      ...dt.screens,
    },
    extends: {},
  },
  plugins: [],
};
