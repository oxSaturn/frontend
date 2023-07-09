// see https://nextjs.org/docs/basic-features/eslint#lint-staged
const path = require("path");

const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    .map((f) => path.relative(process.cwd(), f))
    .join(" --file ")}`;

module.exports = {
  "*.{js,jsx,ts,tsx,yml}": [buildEslintCommand, "prettier --write"],
  "*.{ts,tsx}": () => "tsc --noEmit",
};
