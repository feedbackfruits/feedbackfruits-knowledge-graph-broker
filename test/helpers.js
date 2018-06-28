import test from 'ava';

import * as Helpers from '../lib/helpers';

import { Quad } from 'feedbackfruits-knowledge-engine';
import { unionBy, differenceBy } from 'lodash';

test('it exists', t => {
  t.not(Helpers, undefined);
});

test('Helpers.quickDiff: it returns a diff', async t => {
  const quad1 = {
    "subject": "http://bla.com",
    "predicate": "http://bla.com",
    "object": "things",
    "label": ""
  };

  const quad2 = {
    "subject": "http://bla.com",
    "predicate": "http://bla.com",
    "object": "things2",
    "label": ""
  };

  const quad3 = {
    "subject": "http://bla.com",
    "predicate": "http://bla.com",
    "object": "things3",
    "label": ""
  };

  const existing = [ quad1, quad2 ];
  const other = [ quad2, quad3 ];
  const expected = [ quad3 ];

  const res = Helpers.quickDiff(existing, other);
  // console.log('Res:', JSON.stringify(res));
  return t.deepEqual(res, expected);
});

test('Helpers.quickDiff: it returns the same diff as lodash', async t => {
  const quad1 = {
    "subject": "http://bla.com",
    "predicate": "http://bla.com",
    "object": "things",
    "label": ""
  };

  const quad2 = {
    "subject": "http://bla.com",
    "predicate": "http://bla.com",
    "object": "things2",
    "label": ""
  };

  const quad3 = {
    "subject": "http://bla.com",
    "predicate": "http://bla.com",
    "object": "things3",
    "label": ""
  };

  const existing = [ quad1, quad2 ];
  const other = [ quad2, quad3 ];

  function quadIdentity(quad) {
    // return JSON.stringify(quad);
    const { subject, predicate, object, label } = quad;
    return Quad.toNQuads([ quad ]);
    // return `${label}: ${subject} ${predicate} ${object}`;
  }

  const expected = differenceBy(unionBy(other, existing, quadIdentity), existing, quadIdentity)

  const res = Helpers.quickDiff(existing, other);
  // console.log('Res:', JSON.stringify(res));
  return t.deepEqual(res, expected);
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

// test('Helpers.quadExists: it returns true if quad exists', async t => {
//   const quad = {
//     "subject": "https://video.google.com/timedtext?v=2Op3QLzMgSY&lang=en#UDM0MTUuMTlTLVAxLjdT",
//     "predicate": "http://schema.org/text",
//     "object": "\"you know that these languages have things like \"for\"",
//     "label": ""
//   };
//
//   const res = await Helpers.quadExists(quad);
//   return t.deepEqual(res, true);
// });
//
// test('Helpers.quadExists: it returns false if quad does not exist', async t => {
//   const quad = {
//     "subject": "https://fake.com",
//     "predicate": "http://schema.org/fakeThing",
//     "object": "fake news",
//     "label": ""
//   };
//
//   const res = await Helpers.quadExists(quad);
//   return t.deepEqual(res, false);
// });
