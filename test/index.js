import test from 'ava';
import { quadsToJsonLD } from '../lib'

test('stub', t => {
  t.is(true, true);
});

test('quadsToJsonLD', t => {
  const quads = [
    { subject: '<http://some.domain/janedoe>', predicate: '<http://schema.org/jobTitle>', object: '"Professor"'},
    { subject: '<http://some.domain/janedoe>', predicate: '<http://schema.org/name>', object: '"Jane Doe"'},
    { subject: '<http://some.domain/janedoe>', predicate: '<http://schema.org/telephone>', object: '"(425) 123-4567"'},
    { subject: '<http://some.domain/janedoe>', predicate: '<http://schema.org/url>', object: '<http://www.janedoe.com>'},
    { subject: '<http://some.domain/janedoe>', predicate: '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', object: '<http://schema.org/Person>'},
  ];

  const result = {
    '<http://some.domain/janedoe>': {
      '<http://schema.org/jobTitle>': [ '"Professor"' ],
      '<http://schema.org/name>': [ '"Jane Doe"' ],
      '<http://schema.org/telephone>': [ '"(425) 123-4567"' ],
      '<http://schema.org/url>': [ '<http://www.janedoe.com>' ],
      '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>': [ '<http://schema.org/Person>' ]
    }
  };

  t.deepEqual(quadsToJsonLD(quads), result);
})
