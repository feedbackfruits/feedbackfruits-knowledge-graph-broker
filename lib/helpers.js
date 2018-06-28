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
const feedbackfruits_knowledge_engine_1 = require("feedbackfruits-knowledge-engine");
const Neptune = require("./neptune");
function quickDiff(existing, other) {
    const existingIndex = existing.reduce((memo, q) => (Object.assign({}, memo, { [feedbackfruits_knowledge_engine_1.Quad.toNQuads([q])]: true })), {});
    return other.filter(q => {
        const exists = feedbackfruits_knowledge_engine_1.Quad.toNQuads([q]) in existingIndex;
        return !exists;
    });
}
exports.quickDiff = quickDiff;
function deduplicateQuads(quads) {
    const indexed = quads.reduce((memo, quad) => {
        const hash = JSON.stringify(quad);
        memo[hash] = quad;
        return memo;
    }, {});
    return Object.values(indexed);
}
exports.deduplicateQuads = deduplicateQuads;
function existingQuadsForDoc(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        const flattened = yield feedbackfruits_knowledge_engine_1.Doc.flatten(doc, feedbackfruits_knowledge_engine_1.Context.context);
        const ids = flattened.map(doc => doc["@id"]);
        const quads = yield Neptune.getQuads(...ids);
        return quads;
    });
}
exports.existingQuadsForDoc = existingQuadsForDoc;
function splitArray(array, chunkSize = 100) {
    const res = [];
    var i;
    for (i = 0; i < array.length; i += chunkSize) {
        res.push(array.slice(i, i + chunkSize));
    }
    return res;
}
exports.splitArray = splitArray;
