import { Quad, Doc, Helpers, Context } from 'feedbackfruits-knowledge-engine';
import * as jsonld from 'jsonld';
import * as isuri from 'isuri';
import fetch from 'node-fetch';

import * as Cayley from './cayley';
import * as Neptune from './neptune';

export function quickDiff(existing: Quad[], other: Quad[]): Quad[] {
  const existingIndex = existing.reduce((memo, q) => ({ ...memo, [Quad.toNQuads([q])]: true }), {});
  // console.log('Index:', JSON.stringify(existingIndex));
  return other.filter(q => {
    const exists = Quad.toNQuads([q]) in existingIndex;
    // console.log('Quad exists?:', exists);
    return !exists;
  });
}

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
  const quads = await Neptune.getQuads(...ids);
  return quads;
}

export function splitArray(array: any[], chunkSize: number = 100): any[][] {
  const res = [];

  var i;
  for (i = 0; i < array.length; i += chunkSize) {
    res.push(array.slice(i, i + chunkSize));
  }

  return res;
}
