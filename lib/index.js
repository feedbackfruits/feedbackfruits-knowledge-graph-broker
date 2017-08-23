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
const helpers_1 = require("./helpers");
const cayley = Cayley(Config.CAYLEY_ADDRESS);
function init({ name }) {
    return __awaiter(this, void 0, void 0, function* () {
        const receive = (send) => (operation) => __awaiter(this, void 0, void 0, function* () {
            if (!memux_1.isOperation(operation))
                throw new Error();
            const { action, data } = operation;
            const quads = yield feedbackfruits_knowledge_engine_1.Helpers.docToQuads(data);
            console.log('Processing quads:', action, data, quads);
            if (quads.length === 0)
                return;
            switch (action) {
                case 'write':
                    try {
                        console.log(yield helpers_1.writeQuads(quads));
                    }
                    catch (e) {
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
                        console.log(yield helpers_1.deleteQuads(quads));
                    }
                    catch (e) {
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
            yield Promise.all(feedbackfruits_knowledge_engine_1.Helpers.quadsToDocs(yield helpers_1.getDoc(data['@id'])).map(data => send({ action, key: data['@id'], data })));
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
    }).catch(console.error);
}
