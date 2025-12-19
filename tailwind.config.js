/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark", "corporate", "business"],
    darkTheme: "business",
    base: true,
    styled: true,
    utils: true,
  },
}
