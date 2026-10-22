module.exports = {
  content: [
    "./*.html",
    "./about/**/*.html",
    "./contact/**/*.html",
    "./articles/**/*.html",
    "./terms/**/*.html",
    "./privacy/**/*.html",
    "./disclosures/**/*.html",
    "./portal/**/*.html",
    "./js/**/*.js"
  ],
  theme: {
    extend: {
      // Ganetika Style Guide v1.4 design tokens
      colors: {
        'primary-dark': '#0E233D', // Navy Deep
        navy: '#10263E',
        gold: {
          DEFAULT: '#C4984F',
          light: '#E0B96A',
        },
        cream: '#FAF8F5',
        panel: '#F1EEE8',
        ink: '#27272A',
        mist: '#D5DDE8',
        pale: '#B6C2D2',
        rule: '#DDDAD5',
      },
    },
  },
  plugins: [],
}
