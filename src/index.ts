import { createSend, createReceive, Operation, isOperation } from 'memux';
import fetch from 'node-fetch';

const Cayley = require('cayley');
const { Observable: { empty } } = require('rxjs');
const PQueue = require('p-queue');
const jsonld = require('jsonld');

import * as Config from './config';
import Doc from './doc';
import { Quad } from './quad';
import { docToQuads, quadsToDocs, encodeIRI } from './helpers';

const cayley = Cayley(Config.CAYLEY_ADDRESS);

export type DocOperation = Operation<Doc>;

export type BrokerConfig = {
  name: string,
  url: string,
  input: string,
  output: string,
};

async function getDoc(subject): Promise<Quad[]> {
  console.log('Getting doc:', subject);
  const g = cayley.graph;
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

  const url = `${Config.CAYLEY_ADDRESS}/api/v1/query/gizmo`;
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

async function init({ name, url, input, output }: BrokerConfig) {
  const send = await createSend({
    name,
    url,
    topic: output,
    concurrency: parseInt(Config.CONCURRENCY)
  });

  const receive = async (operation: DocOperation) => {
    if (!isOperation(operation)) throw new Error();
    const { action, data } = operation;

    const quads = await docToQuads(data);

    console.log('Processing quads:', action, data, quads);

    return new Promise<void>((resolve, reject) => {
      if (quads.length === 0) return resolve();

      cayley[action](quads, async (error, body, response) => {
        console.log('Quads sent to cayley:', error, body);
        if (error != null) return reject(error);
        if (response.statusCode >= 200 && response.statusCode < 400) {
          return Promise.all(quadsToDocs(await getDoc(data['@id'])).map(data => send({ action, key: data['@id'], data }))).then(() => resolve());
        }

        if (response.statusCode === 400) {
          if ((body.error || body).match(/quad exists/)) return resolve();
          if ((body.error || body).match(/invalid quad/)) return resolve();
        }

        reject();
      });
    });
  };

  return createReceive({
    name,
    url,
    topic: input,
    receive
  });
}

export default init;

// Start the server when executed directly
declare const require: any;
if (require.main === module) {
  console.log("Running as script.");
  console.log('Initializing with config:', Config);
  init({
    name: Config.NAME,
    url: Config.KAFKA_ADDRESS,
    input: Config.INPUT_TOPIC,
    output: Config.OUTPUT_TOPIC,
  }).catch(console.error);
}
