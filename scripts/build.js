const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");
const glob = require("glob");

// Plugin alias để dùng đường dẫn như "/src/..." và "/shared/..." trong JS import
const aliasPlugin = {
  name: "alias-src",
  setup(build) {
    build.onResolve({ filter: /^\/src\// }, (args) => ({
      path: path.join(__dirname, "../frontend", args.path.slice(1)),
    }));
    
    // Thêm alias cho shared constants
    build.onResolve({ filter: /^\/shared\// }, (args) => ({
      path: path.join(__dirname, "..", args.path.slice(1)),
    }));
  },
};

// 🟢 Bật hoặc tắt chế độ auto scan
const USE_AUTO_SCAN = false;

// 🔵 CHẾ ĐỘ 1 – THÊM TAY:
// 👉 Nếu mày muốn kiểm soát chặt và chỉ build 1 số page
const manualPages = [
  "home",
  "select",
  "manga/index",
  "manga/favorites",
  "manga/reader",
  "movie/index",
  "movie/favorites",
  "movie/player",
  "music/index",
  "music/player",
];

// 🔴 CHẾ ĐỘ 2 – AUTO SCAN:
// 👉 Nếu mày thêm nhiều file liên tục và không muốn cập nhật tay
const scannedPages = glob
  .sync("../frontend/src/pages/**/*.js")
  .map((f) =>
    path
      .relative(path.join(__dirname, "../frontend/src/pages"), f)
      .replace(/\.js$/, "")
  )
  .filter((f) => !f.endsWith(".test")); // Loại bỏ file test nếu có

const pages = USE_AUTO_SCAN ? scannedPages : manualPages;

const outDir = path.join(__dirname, "../frontend/public/dist");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

(async () => {
  for (const p of pages) {
    const entryJs = path.join(__dirname, `../frontend/src/pages/${p}.js`);
    if (fs.existsSync(entryJs)) {
      await esbuild.build({
        entryPoints: [entryJs],
        bundle: true,
        minify: true,
        outfile: path.join(outDir, `${p}.js`),
        plugins: [aliasPlugin],
      });
    }

    const entryCss = path.join(__dirname, `../frontend/src/styles/pages/${p}.css`);
    if (fs.existsSync(entryCss)) {
      await esbuild.build({
        entryPoints: [entryCss],
        bundle: true,
        minify: true,
        outfile: path.join(outDir, `${p}.css`),
        loader: { ".css": "css" },
        plugins: [aliasPlugin],
      });
    }
  }
})();
