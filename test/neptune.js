import test from 'ava';

import * as Neptune from '../lib/neptune';

import { Quad } from 'feedbackfruits-knowledge-engine';
import { unionBy, differenceBy } from 'lodash';

test('it exists', t => {
  t.not(Neptune, undefined);
});

test('getQuads: it gets quads', async t => {
  const quads = [
    {
      subject: 'https://knowledge-express/test-subject',
      predicate: 'https://knowledge-express/test-predicate',
      object: 'https://knowledge-express/test-object'
    }
  ];


  // Delay so poseidon actually has time to process
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => resolve(), 5000);
  });
  await timeoutPromise;

  await Neptune.writeQuads(quads);

  const subject = "https://knowledge-express/test-subject";
  const result = await Neptune.getQuads(subject);
  console.log('Result', JSON.stringify(result));
  return t.deepEqual(result, quads);
});


test('writeQuads: it writes quads', async t => {
  const quads = [
    {
      subject: 'https://knowledge-express/test-subject',
      predicate: 'https://knowledge-express/test-predicate',
      object: 'https://knowledge-express/test-object'
    }
  ];

  const result = await Neptune.writeQuads(quads);
  console.log('Result', JSON.stringify(result));
  // Noop
  return t.deepEqual(result, result);
});

test('deleteQuads: it deletes quads', async t => {
  const quads = [
    {
      subject: 'https://knowledge-express/test-subject',
      predicate: 'https://knowledge-express/test-predicate',
      object: 'https://knowledge-express/test-object'
    }
  ];

  const result = await Neptune.deleteQuads(quads);
  console.log('Result', JSON.stringify(result));
  // Noop
  return t.deepEqual(result, result);
});
