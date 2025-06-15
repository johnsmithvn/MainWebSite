const fs = require('fs');
const path = require('path');
const os = require('os');

const { hasImageRecursively } = require('../utils/imageUtils');

describe('hasImageRecursively', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'imgtest-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns true when directory contains an image', () => {
    const imgPath = path.join(tmpDir, 'picture.jpg');
    fs.writeFileSync(imgPath, '');
    expect(hasImageRecursively(tmpDir)).toBe(true);
  });

  test('returns false when directory has no images', () => {
    const sub = path.join(tmpDir, 'sub');
    fs.mkdirSync(sub);
    fs.writeFileSync(path.join(sub, 'text.txt'), 'hello');
    expect(hasImageRecursively(tmpDir)).toBe(false);
  });
});
