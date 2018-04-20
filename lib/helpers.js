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
const PQueue = require("p-queue");
const Config = require("./config");
const queue = new PQueue({ concurrency: Config.WEB_CONCURRENCY });
const config_1 = require("./config");
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
        const existences = yield nodesExists(ids);
        const existingIds = ids.filter((id, index) => existences[index]);
        const quadss = yield Promise.all(existingIds.map(getQuads));
        return deduplicateQuads(quadss.reduce((memo, quads) => [...memo, ...quads], []));
    });
}
exports.existingQuadsForDoc = existingQuadsForDoc;
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
        const url = `${config_1.CAYLEY_ADDRESS}/api/v1/query/gizmo?limit=10000`;
        return queue.add(() => __awaiter(this, void 0, void 0, function* () {
            const response = yield node_fetch_1.default(url, {
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
function quadExists(quad) {
    return __awaiter(this, void 0, void 0, function* () {
        const { subject, predicate, object, label } = quad;
        const encodedObject = feedbackfruits_knowledge_engine_1.Helpers.isURI(object) ? JSON.stringify(feedbackfruits_knowledge_engine_1.Helpers.iriify(object)) : feedbackfruits_knowledge_engine_1.Helpers.encodeRDF(object);
        const query = `
  g.V("<${subject}>").Has("<${predicate}>", ${encodedObject}).All();
  	`;
        const url = `${config_1.CAYLEY_ADDRESS}/api/v1/query/gizmo?limit=10000`;
        return queue.add(() => node_fetch_1.default(url, {
            method: 'post',
            body: query
        })
            .then(res => {
            return res.json();
        })
            .then(({ result, error }) => {
            if (error)
                throw new Error(error);
            return result instanceof Array &&
                result.length === 1 &&
                typeof result[0] === "object" &&
                result[0].id === feedbackfruits_knowledge_engine_1.Helpers.iriify(subject);
        }));
    });
}
exports.quadExists = quadExists;
function getQuads(subject) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const url = `${config_1.CAYLEY_ADDRESS}/api/v1/query/gizmo?limit=10000`;
        return queue.add(() => __awaiter(this, void 0, void 0, function* () {
            const response = yield node_fetch_1.default(url, {
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
    });
}
exports.getQuads = getQuads;
function splitArray(array, chunkSize = 100) {
    const res = [];
    var i;
    for (i = 0; i < array.length; i += chunkSize) {
        res.push(array.slice(i, i + chunkSize));
    }
    return res;
}
exports.splitArray = splitArray;
function writeQuads(quads) {
    return __awaiter(this, void 0, void 0, function* () {
        const chunked = splitArray(quads, 1000);
        return Promise.all(chunked.map((chunk) => __awaiter(this, void 0, void 0, function* () {
            const nquads = feedbackfruits_knowledge_engine_1.Quad.toNQuads(quads);
            const response = yield node_fetch_1.default(`${config_1.CAYLEY_ADDRESS}/api/v2/write`, {
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
