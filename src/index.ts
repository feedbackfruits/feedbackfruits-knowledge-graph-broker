require('dotenv').load({ silent: true });

import { createSend, createReceive, Operation, isOperation } from 'memux';

import Doc from './doc';
import { docToQuads, quadsToDocs } from './helpers';

const Cayley = require('cayley');
const { Observable: { empty } } = require('rxjs');
const PQueue = require('p-queue');
const jsonld = require('jsonld');

const {
  NAME = 'feedbackfruits-knowledge-graph-broker',
  CAYLEY_ADDRESS = 'http://localhost:64210',
  KAFKA_ADDRESS = 'tcp://localhost:9092',
  INPUT_TOPIC = 'quad_update_requests',
  OUTPUT_TOPIC = 'quad_updates',
  CONCURRENCY = '100',
} = process.env;

const cayley: any = null;

type Config = {
  name: string,
  url: string,
  input: string,
  output: string,
};

async function init({ name, url, input, output }: Config) {
  const send = await createSend({
    name,
    url,
    topic: output,
    concurrency: parseInt(CONCURRENCY)
  });

  const receive = (operation: Operation<Doc>) => {
    if (!isOperation(operation)) throw new Error();
    const { action, data } = operation;

    const quads = docToQuads(data);

    return new Promise<void>((resolve, reject) => {
      cayley[action](quads, (error, body, response) => {
        if (error) return reject(error);
        if (response.statusCode >= 200 && response.statusCode < 400) {
          return Promise.all(quadsToDocs(cayley.get(data['@id'])).map(data => send({ action, key: data['@id'], data }))).then(() => resolve());
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

init({
  name: NAME,
  url: KAFKA_ADDRESS,
  input: INPUT_TOPIC,
  output: OUTPUT_TOPIC,
}).catch(console.error);
