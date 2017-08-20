"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDoc = (doc) => {
    return doc != null && typeof doc['@id'] === 'string';
};
