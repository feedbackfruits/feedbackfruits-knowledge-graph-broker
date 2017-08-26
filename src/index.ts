import { Operation, isOperation } from 'memux';
import { Annotator, Doc, Helpers } from 'feedbackfruits-knowledge-engine';

const Cayley = require('cayley');
const jsonld = require('jsonld');

import * as Config from './config';
import { getDoc, writeQuads, deleteQuads } from './helpers';

const cayley = Cayley(Config.CAYLEY_ADDRESS);

export type BrokerConfig = {
  name: string
};

export type SendFn = (operation: Operation<Doc>) => Promise<void>;

async function init({ name }: BrokerConfig) {
  const receive = (send: SendFn) => async (operation: Operation<Doc>) => {
    if (!isOperation(operation)) throw new Error();
    const { action, data } = operation;

    const quads = await Helpers.docToQuads(data);

    console.log('Processing quads:', action, data, quads);

    if (quads.length === 0) return;

    switch(action) {
      case 'write':
        try {
          console.log(await writeQuads(quads));
        } catch(e) {
          console.error(e);
          if (e.message.match(/quad exists/)) {
            console.log('Found existing quad in: ', quads);
            return;
          }
          throw e;
        }
      break;
      case 'delete':
      try {
        console.log(await deleteQuads(quads));
      } catch(e) {
        console.error(e);
        if (e.message.match(/quad does not exists/)) {
          console.log('Found existing quad in: ', quads);
          return;
        }
        throw e;
      }
      break;
    }

    console.log('Quads processed. Sending updated doc...');

    await Promise.all(Helpers.quadsToDocs(await getDoc(data['@id'])).map(data => send({ action, key: data['@id'], data })));
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
