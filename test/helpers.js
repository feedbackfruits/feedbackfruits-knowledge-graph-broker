import test from 'ava';

import * as Helpers from '../lib/helpers';


test('it exists', t => {
  t.not(Helpers, undefined);
});

test('Helpers.deduplicateQuads: it returns deduplicated quads', async t => {
  const quad = {
    "subject": "https://video.google.com/timedtext?v=2Op3QLzMgSY&lang=en#UDM0MTUuMTlTLVAxLjdT",
    "predicate": "http://schema.org/text",
    "object": "\"you know that these languages have things like \"for\"",
    "label": ""
  };

  const quads = [ quad, quad, quad ];
  const res = Helpers.deduplicateQuads(quads);
  return t.deepEqual(res, [ quad ]);
});

test('Helpers.quadExists: it returns true if quad exists', async t => {
  const quad = {
    "subject": "https://video.google.com/timedtext?v=2Op3QLzMgSY&lang=en#UDM0MTUuMTlTLVAxLjdT",
    "predicate": "http://schema.org/text",
    "object": "\"you know that these languages have things like \"for\"",
    "label": ""
  };

  const res = await Helpers.quadExists(quad);
  return t.deepEqual(res, true);
});


test('Helpers.quadExists: it returns false if quad does not exist', async t => {
  const quad = {
    "subject": "https://fake.com",
    "predicate": "http://schema.org/fakeThing",
    "object": "fake news",
    "label": ""
  };

  const res = await Helpers.quadExists(quad);
  return t.deepEqual(res, false);
});
