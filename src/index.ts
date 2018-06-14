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
    const expanded = await Doc.expand(flattened, Context.context);

    const diffLengths = await Promise.all(expanded.map(async doc => {
      let existingQuads, quads, diff;
      console.log('Processing data...');
      existingQuads = await Helpers.existingQuadsForDoc(doc);
      console.log(`${existingQuads.length} existing quads related to doc ${doc["@id"]}.`);
      quads = Helpers.deduplicateQuads(await Doc.toQuads(doc));
      console.log(`${quads.length} quads in total related to doc ${doc["@id"]}.`);
      diff = Helpers.deduplicateQuads(Helpers.quickDiff(existingQuads, quads));
      console.log(`${diff.length} quads in diff.`);

      if (diff.length === 0) return diff.length;
      console.log('Processing diff:', diff);

      await Helpers.writeQuads(diff);

      const totalQuads = [ ...existingQuads, ...diff ];
      const updated = await Doc.fromQuads(totalQuads, Context.context);
      const frame = { "@id": data["@id"], "@context": Context.context };
      const [ framed ] = await Doc.frame([ updated ] , frame);

      console.log('Quads processed. Sending updated doc(s)...');

      await send({ action, key: framed['@id'], data: framed });
    }));

    // const diffLength = diffLengths.reduce((memo, length) => memo + (length || 0), 0);
    // console.log('Total diffLength:', diffLength);
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
