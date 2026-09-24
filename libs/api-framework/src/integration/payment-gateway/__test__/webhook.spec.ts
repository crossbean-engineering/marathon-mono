import express from 'express';
import request from 'supertest';
import { createOmniRawBodyMiddleware } from '../webhook';

describe('createOmniRawBodyMiddleware', () => {
  it('hands the route the exact raw bytes, not a re-parsed object', async () => {
    const app = express();
    app.post('/webhook', createOmniRawBodyMiddleware(), (req, res) => {
      expect(Buffer.isBuffer(req.body)).toBe(true);
      res.status(200).send(req.body.toString('utf8'));
    });

    const payload = '{"id":"EVT_1","type":"collection.succeeded","data":{}}';

    const response = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .send(payload);

    // Sent back verbatim by the handler above — proves the middleware
    // preserved the exact bytes MojoPay would have signed, rather than
    // JSON.parse-ing and losing the original serialization.
    expect(response.text).toBe(payload);
  });

  it('leaves a sibling route free to use its own JSON body parser, scoped per-route', async () => {
    const app = express();
    // Deliberately scoped to each route, not app.use()'d globally — mounting
    // the raw middleware globally is exactly the mistake the JSDoc on
    // createOmniRawBodyMiddleware warns against.
    app.post('/webhook', createOmniRawBodyMiddleware(), (req, res) => {
      res.status(200).json({ isBuffer: Buffer.isBuffer(req.body) });
    });
    app.post('/other', express.json(), (req, res) => {
      res.status(200).json({ echoed: req.body });
    });

    const other = await request(app).post('/other').send({ foo: 'bar' });
    expect(other.body).toEqual({ echoed: { foo: 'bar' } });

    const webhook = await request(app)
      .post('/webhook')
      .set('Content-Type', 'application/json')
      .send('{"foo":"bar"}');
    expect(webhook.body).toEqual({ isBuffer: true });
  });
});
