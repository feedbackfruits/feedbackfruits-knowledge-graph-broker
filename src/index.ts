import { Operation, isOperation } from 'memux';
import { Annotator, Doc, Quad, Context } from 'feedbackfruits-knowledge-engine';

const Cayley = require('cayley');
const jsonld = require('jsonld');
import { unionBy, differenceBy } from 'lodash';

import * as Config from './config';
import * as Helpers from './helpers';

const cayley = Cayley(Config.CAYLEY_ADDRESS);

export type BrokerConfig = {
  name: string,
};

export type SendFn = (operation: Operation<Doc>) => Promise<void>;

async function traceExistingQuads(quads: Quad[]): Promise<Quad[]> {
  return quads.reduce(async (memo, quad) => {
    const exists = await Helpers.quadExists(quad);
    if (exists) return [ ...(await memo), quad];
    return memo;
  }, Promise.resolve(<Quad[]>[]));
}

function quadIdentity(quad) {
  // return JSON.stringify(quad);
  const { subject, predicate, object, label } = quad;
  return Quad.toNQuads([ quad ]);
  // return `${label}: ${subject} ${predicate} ${object}`;
}

async function init({ name }: BrokerConfig) {
  const receive = (send: SendFn) => async (operation: Operation<Doc>) => {
    if (!isOperation(operation)) throw new Error();
    const { action, data } = operation;

    const flattened = await Doc.flatten(data, Context.context);
    const diffLengths = await Promise.all(flattened.map(async doc => {
      let existingQuads, quads, diff;
      try {
        console.log('Processing data...');
        existingQuads = await Helpers.existingQuadsForDoc(data);
        console.log(`${existingQuads.length} existing quads related to the data.`);
        quads = Helpers.deduplicateQuads(await Doc.toQuads(data));
        console.log(`${quads.length} quads in total related to the data.`);
        diff = Helpers.deduplicateQuads(Helpers.quickDiff(existingQuads, quads));
        console.log(`${diff.length} quads in diff.`);

        if (diff.length === 0) return diff.length;
        console.log('Processing diff:', diff);

        await Helpers.writeQuads(diff);
        return diff.length;
        // let docs;
        // switch(action) {
        //   case 'write':
        //   // docs = Helpers.quadsToDocs(unionBy(existingQuads, diff, quadIdentity));
        //   // break;
        //   // case 'delete':
        //   //   await Helpers.deleteQuads(diff);
        //   //   // docs = Helpers.quadsToDocs(differenceBy(existingQuads, diff, quadIdentity));
        //   // break;
        // }
      } catch(e) {
        console.log(`ERROR! Skipping doc ${doc["@id"]}.`);
        console.error(e);

        if (e.message.match(/quad exists/i)) {
          // existingQuads = await Helpers.existingQuadsForDoc(data);
          // quads = Helpers.deduplicateQuads(await Doc.toQuads(data));
          // diff = Helpers.deduplicateQuads(differenceBy(unionBy(quads, existingQuads, quadIdentity), existingQuads, quadIdentity));

          // console.log('Tracing existing quads in diff of length: ', diff.length);
          // const existing = await traceExistingQuads(diff);
          // if (existing.length !== 0) {
          //   console.log('Errored on quads:', JSON.stringify(existing));
          //   console.log('Determined existing quads:', JSON.stringify(existingQuads));
          //   process.exit(1);
          // } else {
          //   console.log('Something strange is occuring, none of the diff quads seem to exist, but diff processing still failed.');
          //   console.log(Quad.toNQuads(diff));
          //   const waitingPromise = new Promise((resolve) => {
          //     setTimeout(() => resolve(), 20000);
          //   });
          //   await waitingPromise;
          //   process.exit(1);
          // }
        }
      }
    }));

    const diffLength = diffLengths.reduce((memo, length) => memo + length, 0);
    console.log('Total diffLength:', diffLength);
    if (!(diffLength !== 0)) return;

    console.log('Quads processed. Sending updated doc(s)...');

    await send({ action, key: data['@id'], data });
      // await Promise.all(docs.map(data => send({ action, key: data['@id'], data })));
        // console.log('Tracing duplicate quad:');
      // let quads;
      // await Promise.all(quads.map(async quad => {
      //   const exists = await Helpers.quadExists(quad);
      //   if (exists) {
      //     console.log('Errored on quad:', JSON.stringify(quad));
      //     process.exit(1);
      //     // throw new Error('Existing quad: ' + JSON.stringify(quad));
      //   }
      // }));

      return;
    }

  // };

  return Annotator({
    name,
    receive,
    customConfig: Config
  });

}

export default init;

// Start the server when executed directly
declare const require: any;
if (require.main === module) {
  console.log("Running as script.");
  init({
    name: Config.NAME
  }).catch((err) => {
    console.error(err);
    throw err;
  });
}
