require('dotenv').load({ silent: true });

const {
  NAME = 'feedbackfruits-knowledge-graph-broker',
  CAYLEY_ADDRESS = 'http://cayley:64210',
  KAFKA_ADDRESS = 'tcp://kafka:9092',
  INPUT_TOPIC = 'quad_update_requests',
  OUTPUT_TOPIC = 'quad_updates'
} = process.env;

const memux = require('memux');
const Cayley = require('cayley');
const { Observable: { empty } } = require('rxjs');
const PQueue = require('p-queue');

const { source, sink, send } = memux({
  name: NAME,
  url: KAFKA_ADDRESS,
  input: INPUT_TOPIC,
  output: OUTPUT_TOPIC
});

const cayley = Cayley(CAYLEY_ADDRESS);
const queue = new PQueue({
  concurrency: 32
});

source.flatMap(({ action: { type, quad }, progress }) => {
  return queue.add(() => new Promise((resolve, reject) => {
    cayley[type]([quad], (error, body, response) => {
      if (error) return reject(error);
      if (response.statusCode >= 200 && response.statusCode < 400) return send({ type, quad }).then(resolve);

      if (response.statusCode === 400) {
        if ((body.error || body).match(/quad exists/)) return resolve();
        if ((body.error || body).match(/invalid quad/)) return resolve();
      }

      reject();
    });
  })).then(() => progress);
}).subscribe(sink);