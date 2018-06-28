import { Quad, Helpers } from 'feedbackfruits-knowledge-engine';
import * as PQueue from 'p-queue';
import * as Config from './config';
import * as _Helpers from './helpers';

const queue = new PQueue({ concurrency: Config.WEB_CONCURRENCY });

export async function nodesExists(subjects: string[]): Promise<boolean[]> {
  // console.log('Checking existence of:', JSON.stringify(subjects));
  const iriified = subjects.map(Helpers.iriify);
  const stringified = iriified.map(iri => JSON.stringify(iri));
  const query = `
    subjects = ${JSON.stringify(iriified)}
    subjects.forEach(function(x) {
      res = {}
      res[x] = false
      g.V(x).ForEach(function(y) {
      	res[x] = true
      })
      g.Emit(res)
    })
  `;

  // console.log('Quering to check existence with:', query);

  const url = `${Config.CAYLEY_ADDRESS}/api/v1/query/gizmo?limit=-1`;
  // console.log('Fetching from url:', url);

  return queue.add<boolean[]>( async () => {
    const response = await fetch(url, {
      method: 'post',
      body: query
    });
    const { result } = await response.json();
    return result.map(res => {
      return Object.keys(res || {}).map(key => {
        return res[key];
      })[0];
    })
  });
}

// export async function quadExists(quad: Quad): Promise<boolean> {
//   const { subject, predicate, object, label } = quad;
//   const encodedObject = Helpers.isURI(object) ? JSON.stringify(Helpers.iriify(object)) : Helpers.encodeRDF(object);
//   const query = `
//   g.V("<${subject}>").Has("<${predicate}>", ${encodedObject}).All();
//   	`;
//
//   // console.log('Quering to check if quad exists with:', query);
//
//   const url = `${Config.CAYLEY_ADDRESS}/api/v1/query/gizmo?limit=-1`;
//   // console.log('Fetching from url:', url);
//
//   return queue.add<boolean>( () => fetch(url, {
//     method: 'post',
//     body: query
//   })
//   .then(res => {
//     return res.json();
//   })
//   .then(({ result, error }) => {
//     if (error) throw new Error(error);
//     // console.log('Got result:', result);
//     return result instanceof Array &&
//       result.length === 1 &&
//       typeof result[0]  === "object" &&
//       result[0].id === Helpers.iriify(subject);
//   }));
// }

export async function getQuads(...subjects: string[]): Promise<Quad[]> {
  // console.log('Getting doc:', subject);
  const existences = await nodesExists(subjects);
  const existingIds = subjects.filter((id, index) => existences[index]);
  const quadss = await Promise.all(existingIds.map(subject => {
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

      const url = `${Config.CAYLEY_ADDRESS}/api/v1/query/gizmo?limit=-1`;
      // console.log('Fetching from url:', url, fetch.toString());

      return queue.add<Quad[]>( async () => {
        const response = await fetch(url, {
          method: 'post',
          body: query
        });
        const { result } = await response.json();
        const deiriified = (<Quad[]>(result || [])).map(quad => {
          const { subject, predicate, object, label } = quad;
          return { subject: Helpers.decodeIRI(subject), predicate: Helpers.decodeIRI(predicate), object: Helpers.decodeIRI(object), label };
        });

        return deiriified;
      });
  }));

  return _Helpers.deduplicateQuads(quadss.reduce((memo, quads) => [ ...memo, ...quads ], []));
}

export async function writeQuads(quads: Quad[]) {
  const chunked = _Helpers.splitArray(quads, 1000);

  return Promise.all(chunked.map(async chunk => {
    const nquads = Quad.toNQuads(quads);
    // console.log('Writing p-quads:', nquads);

    // return queue.add<Quad[]>( async () => {
      const response = await fetch(`${Config.CAYLEY_ADDRESS}/api/v2/write`, {
        method: 'post',
        body: nquads
      })
      const { result, error } = await response.json();
      if (error) throw new Error(error);
      return result;
    // });
  }));
}

export function deleteQuads(quads: Quad[]) {
  const nquads = Quad.toNQuads(quads);
  // console.log('Deleting p-quads:', nquads);
  return fetch(`${Config.CAYLEY_ADDRESS}/api/v2/delete`, {
    method: 'post',
    body: nquads
  })
  .then(response => response.json())
  .then(result => {
    if ('error' in result) throw result.error;
    return result;
  });
}
