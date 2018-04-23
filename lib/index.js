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
            const flattened = yield feedbackfruits_knowledge_engine_1.Doc.flatten(data, feedbackfruits_knowledge_engine_1.Context.context);
            const diffLengths = yield Promise.all(flattened.map((doc) => __awaiter(this, void 0, void 0, function* () {
                let existingQuads, quads, diff;
                try {
                    console.log('Processing data...');
                    existingQuads = yield Helpers.existingQuadsForDoc(data);
                    console.log(`${existingQuads.length} existing quads related to the data.`);
                    quads = Helpers.deduplicateQuads(yield feedbackfruits_knowledge_engine_1.Doc.toQuads(data));
                    console.log(`${quads.length} quads in total related to the data.`);
                    diff = Helpers.deduplicateQuads(Helpers.quickDiff(existingQuads, quads));
                    console.log(`${diff.length} quads in diff.`);
                    if (diff.length === 0)
                        return diff.length;
                    console.log('Processing diff:', diff);
                    yield Helpers.writeQuads(diff);
                    return diff.length;
                }
                catch (e) {
                    console.log(`ERROR! Skipping doc ${doc["@id"]}.`);
                    console.error(e);
                    if (e.message.match(/quad exists/i)) {
                    }
                }
            })));
            const diffLength = diffLengths.reduce((memo, length) => memo + length, 0);
            console.log('Total diffLength:', diffLength);
            if (!(diffLength !== 0))
                return;
            console.log('Quads processed. Sending updated doc(s)...');
            yield send({ action, key: data['@id'], data });
            return;
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
