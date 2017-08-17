import Quad from './quad';
import Doc from './doc';
import jsonld from 'jsonld';


export const quadsToDocs = (quads: Array<Quad>): Array<Doc> => {
  return Object.values(quads.reduce((memo, quad) => {
    let { subject, predicate, object } = quad;
    // if (predicate === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') predicate = '@id';
    return { ...memo, [subject]: { ...(memo[subject] || { '@id': subject }), [predicate]: [...((memo[subject] && memo[subject][predicate]) || []), object] } };
  }, {}));
};

export const docToQuads = (doc: Doc): Array<Quad> => {
  return [];
};
