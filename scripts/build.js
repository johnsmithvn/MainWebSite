const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Simple alias plugin so imports like "/src/..." work with esbuild
const aliasPlugin = {
  name: 'alias-src',
  setup(build) {
    build.onResolve({ filter: /^\/src\// }, args => ({
      path: path.join(__dirname, '../frontend', args.path.slice(1)),
    }));
  },
};

const pages = [
  'home',
  'select',
  'manga/index',
  'manga/favorites',
  'manga/reader',
  'movie/index',
  'movie/favorites',
  'movie/player',
  'music/index',
  'music/player',
];

const outDir = path.join(__dirname, '../frontend/public/dist');
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
        loader: { '.css': 'css' },
        plugins: [aliasPlugin],
      });
    }
  }
})();
