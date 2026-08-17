// Rebuild vendor/tailwind/tailwind.css (run from the Exp04 folder):
//   npx tailwindcss@3.4.17 -c vendor/tailwind/tailwind.config.js -i vendor/tailwind/input.css -o vendor/tailwind/tailwind.css --minify
module.exports = {
  content: ["./exp04-tailwind.html", "./manual/tailwind-*.html"],
  theme: { extend: {} },
  plugins: [],
};
