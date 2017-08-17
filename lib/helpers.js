"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quadsToDocs = (quads) => {
    return Object.values(quads.reduce((memo, quad) => {
        let { subject, predicate, object } = quad;
        return Object.assign({}, memo, { [subject]: Object.assign({}, (memo[subject] || { '@id': subject }), { [predicate]: [...((memo[subject] && memo[subject][predicate]) || []), object] }) });
    }, {}));
};
exports.docToQuads = (doc) => {
    return [];
};
