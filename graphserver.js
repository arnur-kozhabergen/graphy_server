'use strict';

// Adapted from IBM Developer Skills Network graphy_server (Apache-2.0).
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const fs = require('node:fs');
const path = require('node:path');

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// Public city queries have no sessions, cookies, or mutations.
// Reject cross-origin browser POSTs and require JSON to avoid simple-form CSRF.
app.use('/graphql', (req, res, next) => {
  if (req.method === 'POST') {
    const expectedOrigin = process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`;
    if (req.get('origin') && req.get('origin') !== expectedOrigin) {
      return res.status(403).json({ error: 'Cross-origin requests are not allowed' });
    }
    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'Use application/json' });
    }
  }
  next();
});
app.use(express.json({ limit: '16kb' }));

const cities = JSON.parse(fs.readFileSync(path.join(__dirname, 'UScities.json'), 'utf8'));
const schema = buildSchema(`
  type Query {
    city(name: String): City
    cities(state: String): [City]
  }
  type City { city: String, state: String }
`);
const root = {
  city: ({ name }) => cities.find(city => city.city === name),
  cities: ({ state }) => state ? cities.filter(city => city.state === state) : cities
};

app.get('/', (_req, res) => res.json({ service: 'Graphy city query API', endpoint: '/graphql' }));
app.use('/graphql', graphqlHTTP({ schema, rootValue: root, graphiql: false }));
app.use((err, _req, res, _next) => {
  const status = err.type === 'entity.too.large' ? 413 : 400;
  res.status(status).json({ error: status === 413 ? 'Request too large' : 'Invalid request' });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 4000);
  app.listen(port, process.env.HOST || '0.0.0.0', () => console.log(`Graphy listening on ${port}`));
}
module.exports = app;
