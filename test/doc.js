import test from 'ava';
import { isDoc } from '../lib/doc';

test('isDoc', t => {
  const doc = { '@id': '' };
  t.is(isDoc(doc), true);

  let notDoc;
  t.not(isDoc(notDoc), true);
  notDoc = null;
  t.not(isDoc(notDoc), true);
  notDoc = 1234;
  t.not(isDoc(notDoc), true);
  notDoc = 'test';
  t.not(isDoc(notDoc), true);
  notDoc = {};
  t.not(isDoc(notDoc), true);
  notDoc = () => {};
  t.not(isDoc(notDoc), true);
});
