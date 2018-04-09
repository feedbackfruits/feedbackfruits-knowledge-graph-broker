import { Quad, Doc, Helpers, Context } from 'feedbackfruits-knowledge-engine';
import * as jsonld from 'jsonld';
import * as isuri from 'isuri';
import fetch from 'node-fetch';

import { CAYLEY_ADDRESS } from './config';

export async function existingQuadsForDoc(doc: Doc) {
  const flattened = await Doc.flatten(doc, Context.context);
  const ids = flattened.map(doc => doc["@id"]);
  const quadss = await Promise.all(ids.map(getQuads));
  return quadss.reduce((memo, quads) => [ ...memo, ...quads ], []);
}

export async function getQuads(subject): Promise<Quad[]> {
  console.log('Getting doc:', subject);
  const query = `
  var subject = "<${subject}>";
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
        return (result || []) as Quad[];
      })
}

export function writeQuads(quads: Quad[]) {
  const nquads = Quad.toNQuads(quads);
  console.log('Writing p-quads:', nquads);
  return fetch(`${CAYLEY_ADDRESS}/api/v2/write`, {
    method: 'post',
    body: nquads
  })
  .then(response => response.json())
  .then(result => {
    if ('error' in result) throw new Error(result.error);
    return result;
  });
}

export function deleteQuads(quads: Quad[]) {
  const nquads = Quad.toNQuads(quads);
  console.log('Deleting p-quads:', nquads);
  return fetch(`${CAYLEY_ADDRESS}/api/v2/delete`, {
    method: 'post',
    body: nquads
  })
  .then(response => response.json())
  .then(result => {
    if ('error' in result) throw result.error;
    return result;
  });
}
