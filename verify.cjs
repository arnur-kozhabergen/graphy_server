'use strict';
const assert = require('node:assert/strict');
const app = require('./graphserver');
const cities = require('./UScities.json');

(async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const results = [];
  const post = (body, headers = {}) => fetch(`${base}/graphql`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  try {
    let response = await fetch(base);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('x-powered-by'), null);
    assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
    results.push('service responds with security headers and no framework banner');

    response = await post({ query: 'query($name:String!){city(name:$name){city state}}', variables: { name: cities[0].city } });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.city.city, cities[0].city);
    results.push('city lookup returns real source data');

    response = await post({ query: 'query($state:String!){cities(state:$state){city state}}', variables: { state: cities[0].state } });
    const byState = (await response.json()).data.cities;
    assert.ok(byState.length > 0);
    assert.ok(byState.every(city => city.state === cities[0].state));
    results.push('state lookup returns only matching cities');

    response = await post({ query: '{city(name:"missing"){city}}' });
    assert.equal((await response.json()).data.city, null);
    results.push('missing city returns null');

    response = await post({ query: '{cities{city state}}' });
    const allCities = (await response.json()).data.cities;
    assert.equal(allCities.length, cities.length);
    assert.deepEqual(allCities[0], { city: cities[0].city, state: cities[0].state });
    results.push('omitted state preserves upstream all-cities query');

    response = await post({ query: '{city{city state}}' });
    assert.equal((await response.json()).data.city, null);
    results.push('omitted name preserves upstream null result');

    response = await post({ query: '{city(name:"x"){city}}' }, { Origin: 'https://untrusted.example' });
    assert.equal(response.status, 403);
    results.push('cross-origin browser POST is rejected');

    response = await fetch(`${base}/graphql`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'query=x' });
    assert.equal(response.status, 415);
    results.push('simple-form CSRF content type is rejected');

    response = await post({ query: 'mutation { deleteEverything }' });
    assert.equal(response.status, 400);
    results.push('mutation is rejected by read-only schema');

    response = await post({ query: 'invalid graphql' });
    assert.equal(response.status, 400);
    results.push('invalid GraphQL does not succeed');

    response = await post({ query: 'x'.repeat(17000) });
    assert.equal(response.status, 413);
    assert.deepEqual(await response.json(), { error: 'Request too large' });
    results.push('oversized request is rejected without a stack trace');

    response = await fetch(`${base}/graphql`, { headers: { Accept: 'text/html' } });
    assert.equal(response.status, 400);
    assert.doesNotMatch(await response.text(), /graphiql-container/);
    results.push('interactive GraphiQL is disabled');
    console.log(JSON.stringify({ passed: results.length, results }, null, 2));
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
