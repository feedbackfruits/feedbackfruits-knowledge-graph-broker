"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDoc = (doc) => {
    return typeof doc['@id'] === 'string';
};
