import fetch from 'node-fetch';
import { Quad } from 'feedbackfruits-knowledge-engine';
import * as Config from './config';
import * as DataLoader from 'dataloader';

export type SPARQLUpdate = string;
const updateLoader = new DataLoader(async (updates: SPARQLUpdate[]) => {
  console.log(`Batching ${updates.length} update requests.`);
  const batchedUpdate = updates.join('\n');

  const result = await updateNeptune(batchedUpdate)

  const results = updates.map(x => result.update);
  return results;
}, {
  maxBatchSize: 100,
  cache: false
});

export function parseResult(result: any) {
  let { head: { vars }, results: { bindings } } = result;
  // if (!bindings.length) return [];

  const res = bindings.reduce((memo, binding) => {
    const { subject, predicate, object } = binding;

    const quad = {
      subject: subject.value,
      predicate: predicate.value,
      object: object.value,
    };

    return [ ...memo, quad ];
  }, []);

  return res;

}

export async function queryNeptune(query: string) {
  const url = `${Config.NEPTUNE_ADDRESS}`;
  console.log(`Querying ${url} for ${query}`);
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/sparql-query"
    },
    method: 'post',
    body: query
  });

  const text = await response.text();
  console.log('Neptune query reponse:', response.status, text);
  const json = JSON.parse(text);
  return json;
}

export async function updateNeptune(update: string) {
  const url = `${Config.NEPTUNE_ADDRESS}`;
  console.log(`Updating ${url} for ${update}`);
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/sparql-update"
    },
    method: 'post',
    body: update
  });

  const text = await response.text();
  console.log('Neptune update reponse:', response.status, text);
  return { update: response.status >= 200 && response.status < 400 };
  // const json = JSON.parse(text);
  // return json;
}

export async function getQuads(...subjects: string[]) {
  const query = `
    SELECT *
    WHERE {
      GRAPH ${Config.GRAPH} {
        VALUES (?subject) { ${subjects.map(subject => `( <${subject}> )`).join(' ')} }
        ?subject ?predicate ?object
      }
    }
  `;

  const result = await queryNeptune(query);
  // console.log('Result:', JSON.stringify(result));
  const parsed = parseResult(result);
  // console.log('Parsed:', JSON.stringify(parsed));
  return parsed;
}

export async function writeQuads(quads: Quad[]) {
  const nquads = Quad.toNQuads(quads);

  const update = `
    INSERT DATA {
      GRAPH ${Config.GRAPH} {
        ${nquads}
      }
    }
  `;

  const result = await updateLoader.load(update);
  console.log('Result:', JSON.stringify(result));

  return;
}

export async function deleteQuads(quads: Quad[]) {
  const nquads = Quad.toNQuads(quads);

  const update = `
    DELETE DATA {
      GRAPH ${Config.GRAPH} {
        ${nquads}
      }
    }
  `;

  const result = await updateLoader.load(update);
  console.log('Result:', JSON.stringify(result));

  return;
}
