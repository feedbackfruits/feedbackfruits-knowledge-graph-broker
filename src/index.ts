import { Operation, isOperation } from 'memux';
import { Annotator, Doc, Quad, Context } from 'feedbackfruits-knowledge-engine';

const Cayley = require('cayley');
const jsonld = require('jsonld');
import { unionBy, differenceBy } from 'lodash';

import * as Config from './config';
import * as Helpers from './helpers';

const cayley = Cayley(Config.CAYLEY_ADDRESS);

export type BrokerConfig = {
  name: string
};

export type SendFn = (operation: Operation<Doc>) => Promise<void>;

function quadIdentity({ label, subject, predicate, object }) {
  return `${label}: ${subject} ${predicate} ${object}`;
}

async function init({ name }: BrokerConfig) {
  const receive = (send: SendFn) => async (operation: Operation<Doc>) => {
    if (!isOperation(operation)) throw new Error();
    const { action, data } = operation;

    let existingQuads, quads, diff;
    try {
      existingQuads = await Helpers.existingQuadsForDoc(data);
      quads = await Doc.toQuads(data);
      diff = differenceBy(unionBy(quads, existingQuads, quadIdentity), existingQuads, quadIdentity);

      // console.log('Processing quads:', action, data, quads);
      console.log('Processing diff:', diff);

      if (diff.length === 0) return;

      let docs;
      switch(action) {
        case 'write':
          await Helpers.writeQuads(diff);
          // docs = Helpers.quadsToDocs(unionBy(existingQuads, diff, quadIdentity));
        break;
        // case 'delete':
        //   await Helpers.deleteQuads(diff);
        //   // docs = Helpers.quadsToDocs(differenceBy(existingQuads, diff, quadIdentity));
        // break;
      }

      console.log('Quads processed. Sending updated doc(s)...');

      await send({ action, key: data['@id'], data });
      // await Promise.all(docs.map(data => send({ action, key: data['@id'], data })));
      return;
    } catch(e) {
      console.log('ERROR! Skipping doc.');
      console.error(e)

      // console.log('Tracing broken quad:');
      // let quads;
      // quads = await Doc.toQuads(data);
      // await Promise.all(quads.map(async quad => {
      //   let nquads, doc;
      //   try {
      //     nquads = Quad.toNQuads([ quad ]);
      //     quads = Quad.fromNQuads(nquads);
      //     doc = await Doc.fromQuads(quads, Context.context);
      //   } catch(e) {
      //     console.log('Errored on quad:', JSON.stringify(quad));
      //   }
      // }));

      return;
    }

  };

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
    name: Config.NAME,
  }).catch((err) => {
    console.error(err);
    throw err;
  });
}
