require('dotenv').load({ silent: true });

const {
  NAME = 'feedbackfruits-knowledge-graph-broker',
  CAYLEY_ADDRESS = 'http://cayley:64210',
  KAFKA_ADDRESS = 'tcp://kafka:9092',
  INPUT_TOPIC = 'quad_update_requests',
  OUTPUT_TOPIC = 'quad_updates',
  CONCURRENCY = 100,
} = process.env;

// const memux = require('memux');
const Cayley = require('cayley');
const { Observable: { empty } } = require('rxjs');
const PQueue = require('p-queue');
const jsonld = require('jsonld');


import Doc from './doc';
import { docToQuads, quadsToDocs } from './helpers';

type Operation = {
  op: 'write' | 'delete'
  doc: Doc
};

const isOperation = (operation: object): operation is Operation => {
  typeof operation['quad'] === 'string' && operation['op'] === 'string';

  return true;
};

type MemuxConfig = {
  name: string,
  url: string,
  input: string,
  output: string,
  receive: (operation: Operation) => Promise<void>
};

type Memux = (config: MemuxConfig) => {
  send: (operation: Operation) => Promise<void>
};

const memux: Memux = require('memux');
const cayley: any = null;

// import memux from 'memux'
// var x: Quad;
// x.


const receive = (operation: Operation) => {
  if (!isOperation(operation)) throw new Error();
  const { op, doc } = operation;

  const quads = docToQuads(doc);
  quads.forEach(quad => {
    cayley[op](quad);
  });

  return Promise.all(quadsToDocs(cayley.get(doc['@id'])).map(doc => send({ doc, op }))).then(() => {});
};

const { send } = memux({
  name: NAME,
  url: KAFKA_ADDRESS,
  input: INPUT_TOPIC,
  output: OUTPUT_TOPIC,
  receive
});




// const cayley = Cayley(CAYLEY_ADDRESS);
// const queue = new PQueue({
//   concurrency: CONCURRENCY
// });

// source.flatMap(({ action: { type, quad }, progress }) => {
//   return queue.add(() => new Promise((resolve, reject) => {
//     cayley[type]([quad], (error, body, response) => {
//       if (error) return reject(error);
//       if (response.statusCode >= 200 && response.statusCode < 400) return send({ type, quad }).then(resolve);
//
//       if (response.statusCode === 400) {
//         if ((body.error || body).match(/quad exists/)) return resolve();
//         if ((body.error || body).match(/invalid quad/)) return resolve();
//       }
//
//       reject();
//     });
//   })).then(() => progress)
// }).subscribe(sink);
