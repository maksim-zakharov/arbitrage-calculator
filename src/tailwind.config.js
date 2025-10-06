export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        success: 'var(--color-success)',
      },
      backgroundColor: {
        success: 'rgb(var(--color-success) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
