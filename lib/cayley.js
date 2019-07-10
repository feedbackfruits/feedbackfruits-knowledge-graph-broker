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
const p_queue_1 = require("p-queue");
const Config = require("./config");
const _Helpers = require("./helpers");
const queue = new p_queue_1.default({ concurrency: Config.WEB_CONCURRENCY });
function nodesExists(subjects) {
    return __awaiter(this, void 0, void 0, function* () {
        const iriified = subjects.map(feedbackfruits_knowledge_engine_1.Helpers.iriify);
        const stringified = iriified.map(iri => JSON.stringify(iri));
        const query = `
    subjects = ${JSON.stringify(iriified)}
    subjects.forEach(function(x) {
      res = {}
      res[x] = false
      g.V(x).ForEach(function(y) {
      	res[x] = true
      })
      g.Emit(res)
    })
  `;
        const url = `${Config.CAYLEY_ADDRESS}/api/v1/query/gizmo?limit=-1`;
        return queue.add(() => __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(url, {
                method: 'post',
                body: query
            });
            const { result } = yield response.json();
            return result.map(res => {
                return Object.keys(res || {}).map(key => {
                    return res[key];
                })[0];
            });
        }));
    });
}
exports.nodesExists = nodesExists;
function getQuads(...subjects) {
    return __awaiter(this, void 0, void 0, function* () {
        const existences = yield nodesExists(subjects);
        const existingIds = subjects.filter((id, index) => existences[index]);
        const quadss = yield Promise.all(existingIds.map(subject => {
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
            const url = `${Config.CAYLEY_ADDRESS}/api/v1/query/gizmo?limit=-1`;
            return queue.add(() => __awaiter(this, void 0, void 0, function* () {
                const response = yield fetch(url, {
                    method: 'post',
                    body: query
                });
                const { result } = yield response.json();
                const deiriified = (result || []).map(quad => {
                    const { subject, predicate, object, label } = quad;
                    return { subject: feedbackfruits_knowledge_engine_1.Helpers.decodeIRI(subject), predicate: feedbackfruits_knowledge_engine_1.Helpers.decodeIRI(predicate), object: feedbackfruits_knowledge_engine_1.Helpers.decodeIRI(object), label };
                });
                return deiriified;
            }));
        }));
        return _Helpers.deduplicateQuads(quadss.reduce((memo, quads) => [...memo, ...quads], []));
    });
}
exports.getQuads = getQuads;
function writeQuads(quads) {
    return __awaiter(this, void 0, void 0, function* () {
        const chunked = _Helpers.splitArray(quads, 1000);
        return Promise.all(chunked.map((chunk) => __awaiter(this, void 0, void 0, function* () {
            const nquads = feedbackfruits_knowledge_engine_1.Quad.toNQuads(quads);
            const response = yield fetch(`${Config.CAYLEY_ADDRESS}/api/v2/write`, {
                method: 'post',
                body: nquads
            });
            const { result, error } = yield response.json();
            if (error)
                throw new Error(error);
            return result;
        })));
    });
}
exports.writeQuads = writeQuads;
function deleteQuads(quads) {
    const nquads = feedbackfruits_knowledge_engine_1.Quad.toNQuads(quads);
    return fetch(`${Config.CAYLEY_ADDRESS}/api/v2/delete`, {
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
