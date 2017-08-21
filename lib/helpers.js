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
const jsonld = require("jsonld");
const isuri = require("isuri");
const node_fetch_1 = require("node-fetch");
const config_1 = require("./config");
function iriify(str) {
    return `<${str}>`;
}
exports.iriify = iriify;
function encodeIRI(str) {
    console.log('Valid URI?', str, isuri.isValid(str));
    if (isuri.isValid(str))
        return iriify(str);
    return str;
}
exports.encodeIRI = encodeIRI;
function isIRI(str) {
    return /<(.*)>/.test(str);
}
exports.isIRI = isIRI;
function decodeIRI(str) {
    if (isIRI(str))
        return str.slice(1, str.length - 1);
    return str;
}
exports.decodeIRI = decodeIRI;
exports.quadsToDocs = (quads) => {
    return Object.values(quads.reduce((memo, quad) => {
        const { subject, predicate, object } = quad;
        return Object.assign({}, memo, { [decodeIRI(subject)]: Object.assign({}, (memo[decodeIRI(subject)] || { '@id': decodeIRI(subject) }), { [decodeIRI(predicate)]: [
                    ...((memo[decodeIRI(subject)] && memo[decodeIRI(subject)][decodeIRI(predicate)]) || []),
                    object
                ] }) });
    }, {}));
};
exports.docToQuads = (doc) => __awaiter(this, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        jsonld.toRDF(doc, { format: 'application/nquads' }, function (err, nquads) {
            if (err != null)
                return reject(err);
            const lines = nquads.split('\n');
            lines.pop();
            const quads = lines.map(line => {
                const [subject, predicate, object] = line.split(/ (?=["<\.])/);
                return { subject, predicate, object: JSON.parse(object) };
            });
            return resolve(quads);
        });
    });
});
function getDoc(subject) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Getting doc:', subject);
        const query = `
  var subject = ${JSON.stringify(encodeIRI(subject))};
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
            return result;
        });
    });
}
exports.getDoc = getDoc;
