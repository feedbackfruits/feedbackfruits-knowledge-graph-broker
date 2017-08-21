import { Operation, isOperation } from 'memux';
import { Annotator, Doc } from 'feedbackfruits-knowledge-engine';

const Cayley = require('cayley');
const jsonld = require('jsonld');

import * as Config from './config';
import { Quad } from './quad';
import { docToQuads, quadsToDocs, getDoc } from './helpers';

const cayley = Cayley(Config.CAYLEY_ADDRESS);

export type BrokerConfig = {
  name: string
};

export type SendFn = (operation: Operation<Doc>) => Promise<void>;

async function init({ name }: BrokerConfig) {
  const receive = (send: SendFn) => async (operation: Operation<Doc>) => {
    if (!isOperation(operation)) throw new Error();
    const { action, data } = operation;

    const quads = await docToQuads(data);

    console.log('Processing quads:', action, data, quads);

    return new Promise<void>((resolve, reject) => {
      if (quads.length === 0) return resolve();

      cayley[action](quads, async (error, body, response) => {
        console.log('Quads sent to cayley:', error, body);
        if (error != null) return reject(error);
        if (response.statusCode >= 200 && response.statusCode < 400) {
          return Promise.all(quadsToDocs(await getDoc(data['@id'])).map(data => send({ action, key: data['@id'], data }))).then(() => resolve());
        }

        if (response.statusCode === 400) {
          if ((body.error || body).match(/quad exists/)) return resolve();
          if ((body.error || body).match(/invalid quad/)) return resolve();
        }

        reject();
      });
    });
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
  }).catch(console.error);
}
