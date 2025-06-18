const fs = require('fs');
const path = require('path');

function loadRoutes(app) {
  const mapping = {
    '/api': 'api',
    '/api/manga': 'api/manga',
    '/api/movie': 'api/movie',
    '/api/music': 'api/music',
  };

  for (const [prefix, dir] of Object.entries(mapping)) {
    const absDir = path.join(__dirname, dir);
    if (!fs.existsSync(absDir)) continue;
    const files = fs
      .readdirSync(absDir)
      .filter((f) => f.endsWith(".js"))
      .sort();

    for (const file of files) {
      const mod = require(path.join(absDir, file));
      app.use(prefix, mod);
    }
  }
}

module.exports = loadRoutes;
