import test from 'ava';
import sinon from 'sinon';

import init from '../lib';
import memux from 'memux';
import { NAME, KAFKA_ADDRESS, INPUT_TOPIC, OUTPUT_TOPIC } from '../lib/config';

const resource = require('./support/resource');
const resourceFlatCompact = require('./support/resource-flat-compact');

test('it exists', t => {
  t.not(init, undefined);
});

test('it works and deduplicates', async (t) => {
  try {
    let _resolve, _reject;
    const resultPromise = new Promise((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });

    const spy = sinon.spy();
    let count = 0;
    const receive = (message) => {
      console.log('Received message!', message);
      if ([].concat(message.data["@type"]).find(type => type === "Resource")) {
        count++;
        count === 1 ? _resolve(message) : spy();
      }
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
    });

    const operation = { action: 'write', key: resource['@id'], data: resource}

    const waitingPromise = new Promise((resolve) => {
      setTimeout(() => resolve(), 2000);
    });

    await send(operation);

    let result = await resultPromise;
    t.deepEqual({ ...result, data: {
      ...result.data,
      caption: result.data.caption.sort(),
      tag: result.data.tag.sort(),
      annotation: result.data.annotation.sort(),
    } }, { ...operation, data: {
      ...resourceFlatCompact,
      caption: resourceFlatCompact.caption.sort(),
      tag: resourceFlatCompact.tag.sort(),
      annotation: resourceFlatCompact.annotation.sort(),
    }, label: NAME });

    await send(operation);
    await waitingPromise;
    return t.is(spy.called, false);
  } catch(e) {
    console.error(e);
    throw e;
  }
});
