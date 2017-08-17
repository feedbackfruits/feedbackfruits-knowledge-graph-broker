"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isQuad = (quad) => {
    return typeof quad === 'object' &&
        typeof quad['subject'] === 'string' &&
        typeof quad['predicate'] === 'string' &&
        typeof quad['object'] === 'string';
};
