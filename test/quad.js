import test from 'ava';
import { isQuad } from '../lib/quad';

test('isQuad', t => {
  const quad = { subject: '', predicate: '', object: '' };
  t.is(isQuad(quad), true);

  let notQuad;
  t.not(isQuad(notQuad), true);
  notQuad = null;
  t.not(isQuad(notQuad), true);
  notQuad = 1234;
  t.not(isQuad(notQuad), true);
  notQuad = 'test';
  t.not(isQuad(notQuad), true);
  notQuad = {};
  t.not(isQuad(notQuad), true);
  notQuad = () => {};
  t.not(isQuad(notQuad), true);
});
