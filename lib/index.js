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
function quadIdentity({ label, subject, predicate, object }) {
    return `${label}: ${subject} ${predicate} ${object}`;
}
function init({ name }) {
    return __awaiter(this, void 0, void 0, function* () {
        const receive = (send) => (operation) => __awaiter(this, void 0, void 0, function* () {
            if (!memux_1.isOperation(operation))
                throw new Error();
            const { action, data } = operation;
            let existingQuads, quads, diff;
            try {
                existingQuads = yield Helpers.existingQuadsForDoc(data);
                quads = yield feedbackfruits_knowledge_engine_1.Doc.toQuads(data);
                diff = lodash_1.differenceBy(lodash_1.unionBy(quads, existingQuads, quadIdentity), existingQuads, quadIdentity);
            }
            catch (e) {
                console.log('An error occured while processing:', JSON.stringify(operation));
                console.error(e);
                return;
            }
            console.log('Processing diff:', diff);
            if (diff.length === 0)
                return;
            let docs;
            switch (action) {
                case 'write':
                    yield Helpers.writeQuads(diff);
                    break;
            }
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
        name: Config.NAME,
    }).catch((err) => {
        console.error(err);
        throw err;
    });
}
