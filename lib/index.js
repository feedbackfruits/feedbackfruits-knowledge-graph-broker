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
            const expanded = yield feedbackfruits_knowledge_engine_1.Doc.expand(flattened, feedbackfruits_knowledge_engine_1.Context.context);
            const diffLengths = yield Promise.all(expanded.map((doc) => __awaiter(this, void 0, void 0, function* () {
                let existingQuads, quads, diff;
                console.log('Processing data...');
                existingQuads = yield Helpers.existingQuadsForDoc(doc);
                console.log(`${existingQuads.length} existing quads related to doc ${doc["@id"]}.`);
                quads = Helpers.deduplicateQuads(yield feedbackfruits_knowledge_engine_1.Doc.toQuads(doc));
                console.log(`${quads.length} quads in total related to doc ${doc["@id"]}.`);
                diff = Helpers.deduplicateQuads(Helpers.quickDiff(existingQuads, quads));
                console.log(`${diff.length} quads in diff.`);
                if (diff.length === 0)
                    return diff.length;
                const totalQuads = [...existingQuads, ...diff];
                const updated = yield feedbackfruits_knowledge_engine_1.Doc.fromQuads(totalQuads, feedbackfruits_knowledge_engine_1.Context.context);
                const frame = { "@id": data["@id"], "@context": feedbackfruits_knowledge_engine_1.Context.context };
                const [framed] = yield feedbackfruits_knowledge_engine_1.Doc.frame([updated], frame);
                try {
                    yield feedbackfruits_knowledge_engine_1.Doc.validate(framed, feedbackfruits_knowledge_engine_1.Context.context);
                }
                catch (e) {
                    console.error('Broke on validation. Not writing diff or sending doc:', framed["@id"]);
                    console.error(e);
                    return;
                }
                console.log('Processing diff:', diff);
                yield Helpers.writeQuads(diff);
                console.log('Quads processed. Sending updated doc(s)...');
                yield send({ action, key: framed['@id'], data: framed });
            })));
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
