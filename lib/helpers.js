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
const node_fetch_1 = require("node-fetch");
const config_1 = require("./config");
function existingQuadsForDoc(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        const flattened = yield feedbackfruits_knowledge_engine_1.Doc.flatten(doc, feedbackfruits_knowledge_engine_1.Context.context);
        const ids = flattened.map(doc => doc["@id"]);
        const quadss = yield Promise.all(ids.map(getQuads));
        return quadss.reduce((memo, quads) => [...memo, ...quads], []);
    });
}
exports.existingQuadsForDoc = existingQuadsForDoc;
function getQuads(subject) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Getting doc:', subject);
        const query = `
  var subject = "<${subject}>";
  g.V(subject)
  	.OutPredicates()
  	.ForEach(function mapPredicates(node) {
        var predicate = node.id;
        return g.V(subject)
          .Out(predicate)
          .ForEach(function emitObject(node) {
            var object = node.id;
            g.Emit({
              subject: subject,
              predicate: predicate,
              object: object
            });
          });
      })`;
        const url = `${config_1.CAYLEY_ADDRESS}/api/v1/query/gizmo`;
        return node_fetch_1.default(url, {
            method: 'post',
            body: query
        })
            .then(res => {
            return res.json();
        })
            .then(({ result }) => {
            console.log('Returning resulting quads:', result);
            return (result || []);
        });
    });
}
exports.getQuads = getQuads;
function writeQuads(quads) {
    const nquads = feedbackfruits_knowledge_engine_1.Quad.toNQuads(quads);
    console.log('Writing p-quads:', nquads);
    return node_fetch_1.default(`${config_1.CAYLEY_ADDRESS}/api/v2/write`, {
        method: 'post',
        body: nquads
    })
        .then(response => response.json())
        .then(result => {
        if ('error' in result)
            throw new Error(result.error);
        return result;
    });
}
exports.writeQuads = writeQuads;
function deleteQuads(quads) {
    const nquads = feedbackfruits_knowledge_engine_1.Quad.toNQuads(quads);
    console.log('Deleting p-quads:', nquads);
    return node_fetch_1.default(`${config_1.CAYLEY_ADDRESS}/api/v2/delete`, {
        method: 'post',
        body: nquads
    })
        .then(response => response.json())
        .then(result => {
        if ('error' in result)
            throw result.error;
        return result;
    });
}
exports.deleteQuads = deleteQuads;
