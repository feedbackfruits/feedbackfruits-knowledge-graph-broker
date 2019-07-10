import { Operation, isOperation } from 'memux';
import { Annotator, Doc, Quad, Context } from 'feedbackfruits-knowledge-engine';

import * as Config from './config';
import * as Helpers from './helpers';
import * as Neptune from './neptune';

export type BrokerConfig = {
  name: string,
};

export type SendFn = (operation: Operation<Doc>) => Promise<void>;

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

      const totalQuads = [ ...existingQuads, ...diff ];

      const updated = await Doc.fromQuads(totalQuads, Context.context);
      const frame = { "@id": data["@id"], "@context": Context.context };
      const [ framed ] = await Doc.frame([ updated ] , frame);

      try {
        // Validate before writing diff
        await Doc.validate(framed, Context.context);
      } catch(e) {
        console.error('Broke on validation. Not writing diff or sending doc:', framed["@id"]);
        console.error(e);
        return;
        // throw e;
      }

      // Write diff only if validation passes
      console.log('Processing diff:', diff);
      await Neptune.writeQuads(diff);
      console.log('Quads processed. Sending updated doc(s)...');

      await send({ action, key: framed['@id'], data: framed });
    }));

    return;
  }

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
