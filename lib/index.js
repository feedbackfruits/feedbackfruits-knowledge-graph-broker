"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const memux_1 = require("memux");
const feedbackfruits_knowledge_engine_1 = require("feedbackfruits-knowledge-engine");
const Cayley = require('cayley');
const jsonld = require('jsonld');
const lodash_1 = require("lodash");
const Config = require("./config");
const Helpers = require("./helpers");
const cayley = Cayley(Config.CAYLEY_ADDRESS);
function traceExistingQuads(quads) {
    return __awaiter(this, void 0, void 0, function* () {
        return quads.reduce((memo, quad) => __awaiter(this, void 0, void 0, function* () {
            const exists = yield Helpers.quadExists(quad);
            if (exists)
                return [...(yield memo), quad];
            return memo;
        }), Promise.resolve([]));
    });
}
function quadIdentity(quad) {
    const { subject, predicate, object, label } = quad;
    return feedbackfruits_knowledge_engine_1.Quad.toNQuads([quad]);
}
function init({ name }) {
    return __awaiter(this, void 0, void 0, function* () {
        const receive = (send) => (operation) => __awaiter(this, void 0, void 0, function* () {
            if (!memux_1.isOperation(operation))
                throw new Error();
            const { action, data } = operation;
            let existingQuads, quads, diff;
            try {
                console.log('Processing data...');
                existingQuads = yield Helpers.existingQuadsForDoc(data);
                console.log(`${existingQuads.length} existing quads related to the data.`);
                quads = Helpers.deduplicateQuads(yield feedbackfruits_knowledge_engine_1.Doc.toQuads(data));
                console.log(`${quads.length} quads in total related to the data.`);
                diff = Helpers.deduplicateQuads(lodash_1.differenceBy(lodash_1.unionBy(quads, existingQuads, quadIdentity), existingQuads, quadIdentity));
                console.log(`${diff.length} quads in diff.`);
                if (diff.length === 0)
                    return;
                console.log('Processing diff:', diff);
                let docs;
                switch (action) {
                    case 'write':
                        yield Helpers.writeQuads(diff);
                        break;
                }
                console.log('Quads processed. Sending updated doc(s)...');
                yield send({ action, key: data['@id'], data });
                return;
            }
            catch (e) {
                console.log('ERROR! Skipping doc.');
                console.error(e);
                if (e.message.match(/quad exists/i)) {
                    console.log('Tracing existing quads in diff of length: ', diff.length);
                    const existing = yield traceExistingQuads(diff);
                    if (existing.length !== 0) {
                        console.log('Errored on quads:', JSON.stringify(existing));
                        console.log('Determined existing quads:', JSON.stringify(existingQuads));
                        process.exit(1);
                    }
                    else {
                        console.log('Something strange is occuring, none of the diff quads seem to exist, but diff processing still failed.');
                        console.log(feedbackfruits_knowledge_engine_1.Quad.toNQuads(diff));
                        const waitingPromise = new Promise((resolve) => {
                            setTimeout(() => resolve(), 20000);
                        });
                        yield waitingPromise;
                        process.exit(1);
                    }
                }
                return;
            }
        });
        return feedbackfruits_knowledge_engine_1.Annotator({
            name,
            receive,
            customConfig: Config
        });
    });
}
exports.default = init;
if (require.main === module) {
    console.log("Running as script.");
    init({
        name: Config.NAME
    }).catch((err) => {
        console.error(err);
        throw err;
    });
}
