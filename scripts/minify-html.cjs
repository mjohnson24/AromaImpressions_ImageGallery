#!/usr/bin/env node
// Minify the built HTML (dist/index.html) including inlined CSS/JS
const fs = require("fs");
const path = require("path");
const { minify } = require("html-minifier-terser");

async function run() {
  const distPath = path.join(__dirname, "..", "dist", "index.html");
  if (!fs.existsSync(distPath)) {
    console.error("Minify step: dist/index.html not found. Did you run `npm run build`?");
    process.exit(1);
  }

  const html = fs.readFileSync(distPath, "utf8");
  const result = await minify(html, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeEmptyAttributes: true,
    minifyCSS: true,
    minifyJS: true,
    sortAttributes: true,
    sortClassName: true,
    html5: true,
    keepClosingSlash: false,
    useShortDoctype: true,
  });

  fs.writeFileSync(distPath, result, "utf8");
  console.log("Minified dist/index.html");
}

run().catch((err) => {
  console.error("Minify step failed:", err);
  process.exit(1);
});
