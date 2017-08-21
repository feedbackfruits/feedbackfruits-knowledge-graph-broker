import Quad from './quad';
import Doc from './doc';
import * as jsonld from 'jsonld';
import * as isuri from 'isuri';
import fetch from 'node-fetch';

import { CAYLEY_ADDRESS } from './config';

export function iriify(str: string) {
  return `<${str}>`;
}

export function encodeIRI(str: string) {
  console.log('Valid URI?', str, isuri.isValid(str));
  if (isuri.isValid(str)) return iriify(str);
  return str;
}

export function isIRI(str: string) {
  return /<(.*)>/.test(str);
}

export function decodeIRI(str: string) {
  if (isIRI(str)) return str.slice(1, str.length - 1);
  return str;
}

// The result of this function is based on the expected input of
// the jsonld library to produce the quads we want.
export const quadsToDocs = (quads: Array<Quad>): Array<Doc> => {
  return Object.values(quads.reduce((memo, quad) => {
    const { subject, predicate, object } = quad;
    // if (predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') predicate = '@id';
    return {
      ...memo,
      [decodeIRI(subject)]: {
        ...(memo[decodeIRI(subject)] || { '@id': decodeIRI(subject) }),
        [decodeIRI(predicate)]: [
          ...((memo[decodeIRI(subject)] && memo[decodeIRI(subject)][decodeIRI(predicate)]) || []),
          object
        ]
      }
    };
  }, {}));
};

export const docToQuads = async (doc: Doc): Promise<Quad[]> => {
  return new Promise<Quad[]>((resolve, reject) => {
    jsonld.toRDF(doc, { format: 'application/nquads' }, function(err, nquads) {
      if (err != null) return reject(err);
      // console.log('Parsing nquads:', nquads);
      const lines = nquads.split('\n');
      lines.pop() // Remove empty newline
      const quads = lines.map(line => {
        // A line looks like: `<<http://some.domain/janedoe>> <<http://schema.org/jobTitle>> "\\"Professor\\"" .␊
        const [ subject, predicate, object ] = line.split(/ (?=["<\.])/);

        // console.log('Parsing object:', object);
        return { subject, predicate, object: JSON.parse(object) };
      });

      return resolve(quads);
    });
  });
};


export async function getDoc(subject): Promise<Quad[]> {
  console.log('Getting doc:', subject);
  const query = `
  var subject = ${JSON.stringify(encodeIRI(subject))};
  g.V(subject)
  	.OutPredicates()
  	.ForEach(function mapPredicates(node) {
        var predicate = node.id;
        return g.V(subject)
          .Out(predicate)
          .ForEach(function emitObject(node) {
            var object = node.id;
            g.Emit({
              subject: subject,
              predicate: predicate,
              object: object
            });
          });
      })`;

  const url = `${CAYLEY_ADDRESS}/api/v1/query/gizmo`;
  // console.log('Fetching from url:', url, fetch.toString());

  return fetch(url, {
    method: 'post',
    body: query
  })
  .then(res => {
    // console.log('Got response:', res);
    return res.json();
  })
  .then(({ result }) => {
        console.log('Returning resulting quads:', result);
        return result as Quad[];
      })
}
