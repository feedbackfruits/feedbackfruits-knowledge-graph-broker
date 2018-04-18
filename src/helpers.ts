import { Quad, Doc, Helpers, Context } from 'feedbackfruits-knowledge-engine';
import * as jsonld from 'jsonld';
import * as isuri from 'isuri';
import fetch from 'node-fetch';
import * as PQueue from 'p-queue';

import * as Config from './config';

const queue = new PQueue({ concurrency: Config.CONCURRENCY });

import { CAYLEY_ADDRESS } from './config';

export function deduplicateQuads(quads: Quad[]): Quad[] {
  const indexed = quads.reduce((memo, quad) => {
    const hash = JSON.stringify(quad);

    memo[hash] = quad;

    return memo;
  }, {});

  return Object.values(indexed);
}

export async function existingQuadsForDoc(doc: Doc): Promise<Quad[]> {
  const flattened = await Doc.flatten(doc, Context.context);
  const ids = flattened.map(doc => doc["@id"]);
  const quadss = await Promise.all(ids.map(getQuads));
  return deduplicateQuads(quadss.reduce((memo, quads) => [ ...memo, ...quads ], []));
}

export async function quadExists(quad: Quad): Promise<boolean> {
  const { subject, predicate, object, label } = quad;
  const query = `
  g.V("<${subject}>").Has("<${predicate}>", ${Helpers.encodeRDF(object)}).All();
  	`;

  console.log('Quering to check if quad exists with:', query);

  const url = `${CAYLEY_ADDRESS}/api/v1/query/gizmo`;
  console.log('Fetching from url:', url);

  return queue.add<boolean>( () => fetch(url, {
    method: 'post',
    body: query
  })
  .then(res => {
    return res.json();
  })
  .then(({ result }) => {
    console.log('Got result:', result);
    return result instanceof Array &&
      result.length === 1 &&
      typeof result[0]  === "object" &&
      result[0].id === Helpers.iriify(subject);
  }));
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

  return queue.add<Quad[]>( () => fetch(url, {
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
  }));
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
