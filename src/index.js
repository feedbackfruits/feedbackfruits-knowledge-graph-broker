const { CAYLEY_PORT, KAFKA_PORT, INPUT_TOPIC, OUTPUT_TOPIC } = process.env;

const memux = require('memux');
const Cayley = require('cayley');
const { Observable: { empty } } = require('rxjs');
const PQueue = require('p-queue');

const { source, sink } = memux({
  name: 'cayley-broker',
  url: KAFKA_PORT,
  input: INPUT_TOPIC,
  output: OUTPUT_TOPIC
});

const cayley = Cayley(CAYLEY_PORT);
const queue = new PQueue({
  concurrency: 4
});

source(({ action, quad }) => {
  if (!['write', 'delete'].includes(action)) return empty();
  return queue.add(() => new Promise((resolve, reject) => {
    cayley[action]([quad], (error, body) => error ? reject(error) : resolve())
  }).then(() => ({ action, quad })));
}).subscribe(sink);
