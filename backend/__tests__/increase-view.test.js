const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

jest.mock('../utils/config', () => ({
  getRootPath: jest.fn(() => '/tmp'),
}));

const router = require('../api/increase-view');
const { getDB } = require('../utils/db');

const TEST_DB_KEY = 'TEST_VIEW';

describe('POST /increase-view', () => {
  const dbFile = path.join(__dirname, '../data', `${TEST_DB_KEY}.db`);
  let app;

  beforeAll(() => {
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
    app = express();
    app.use(express.json());
    app.use(router);
  });

  afterAll(() => {
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
  });

  test('increments view count', async () => {
    const body = { path: '1/Naruto', dbkey: TEST_DB_KEY, rootKey: '1' };
    await request(app).post('/increase-view').send(body).expect(200);
    await request(app).post('/increase-view').send(body).expect(200);

    const db = getDB(TEST_DB_KEY);
    const row = db
      .prepare('SELECT count FROM views WHERE root = ? AND path = ?')
      .get('1', '1/Naruto');
    expect(row.count).toBe(2);
  });
});
