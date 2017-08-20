import test from 'ava';
import init from '../lib';
import memux from 'memux';
import { NAME, KAFKA_ADDRESS, INPUT_TOPIC, OUTPUT_TOPIC } from '../lib/config';

test('it exists', t => {
  t.not(init, undefined);
});

test('it works', async (t) => {
  try {
    let _resolve, _reject;
    const resultPromise = new Promise((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });

    const receive = (message) => {
      console.log('Received message!', message);
      _resolve(message);
    };

    const send = await memux({
      name: 'dummy-broker',
      url: KAFKA_ADDRESS,
      input: OUTPUT_TOPIC,
      output: INPUT_TOPIC,
      receive,
      options: {
        concurrency: 1
      }
    });

    await init({
      name: NAME,
      url: KAFKA_ADDRESS,
      input: INPUT_TOPIC,
      output: OUTPUT_TOPIC,
    });

    const doc = {
      '@id': 'http://some.domain/testdoc',
      'http://schema.org/name': [ 'bla' ],
    };
    const operation = { action: 'write', key: doc['@id'], data: doc}
    await send(operation);

    let result = await resultPromise;
    return t.deepEqual(result, { ...operation, label: NAME });
  } catch(e) {
    console.error(e);
    throw e;
  }
});
