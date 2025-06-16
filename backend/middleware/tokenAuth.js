const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '../.env');
let parsedEnv = {};
try {
  parsedEnv = dotenv.parse(fs.readFileSync(envPath, 'utf-8'));
} catch {
  parsedEnv = {};
}

const TOKEN = parsedEnv.API_TOKEN;

module.exports = function(req, res, next) {
  if (!TOKEN) return next();
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  if (token === TOKEN) {
    return next();
  }
  return res.status(401).send('Invalid token');
};
