import { Operation, isOperation } from 'memux';
import { Annotator, Doc, Helpers } from 'feedbackfruits-knowledge-engine';

const Cayley = require('cayley');
const jsonld = require('jsonld');
import { unionBy, differenceBy } from 'lodash';

import * as Config from './config';
import { getQuads, writeQuads, deleteQuads } from './helpers';

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

    const existingQuads = await getQuads(data['@id']);
    const quads = await Helpers.docToQuads(data);
    const diff = differenceBy(unionBy(quads, existingQuads, quadIdentity), existingQuads, quadIdentity);

    // console.log('Processing quads:', action, data, quads);
    console.log('Processing diff:', diff);

    if (diff.length === 0) return;

    let docs;
    switch(action) {
      case 'write':
        console.log(await writeQuads(diff));
        docs = Helpers.quadsToDocs(unionBy(existingQuads, diff, quadIdentity));
        // try {
        // } catch(e) {
        //   console.error(e);
        //   if (e.message.match(/quad exists/)) {
        //     // console.log('Found existing quad in: ', quads);
        //     return;
        //   }
        //   throw e;
        // }
      break;
      case 'delete':
      console.log(await deleteQuads(diff));
      docs = Helpers.quadsToDocs(differenceBy(existingQuads, diff, quadIdentity));
      // try {
      // } catch(e) {
      //   console.error(e);
      //   if (e.message.match(/quad does not exists/)) {
      //     // console.log('Found existing quad in: ', quads);
      //     return;
      //   }
      //   throw e;
      // }
      break;
    }

    console.log('Quads processed. Sending updated doc(s)...');

    await Promise.all(docs.map(data => send({ action, key: data['@id'], data })));
    return;
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
