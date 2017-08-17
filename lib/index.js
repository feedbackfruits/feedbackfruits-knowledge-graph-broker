"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').load({ silent: true });
const { NAME = 'feedbackfruits-knowledge-graph-broker', CAYLEY_ADDRESS = 'http://cayley:64210', KAFKA_ADDRESS = 'tcp://kafka:9092', INPUT_TOPIC = 'quad_update_requests', OUTPUT_TOPIC = 'quad_updates', CONCURRENCY = 100, } = process.env;
const Cayley = require('cayley');
const { Observable: { empty } } = require('rxjs');
const PQueue = require('p-queue');
const jsonld = require('jsonld');
const helpers_1 = require("./helpers");
const isOperation = (operation) => {
    typeof operation['quad'] === 'string' && operation['op'] === 'string';
    return true;
};
const memux = require('memux');
const cayley = null;
const receive = (operation) => {
    if (!isOperation(operation))
        throw new Error();
    const { op, doc } = operation;
    const quads = helpers_1.docToQuads(doc);
    quads.forEach(quad => {
        cayley[op](quad);
    });
    return Promise.all(helpers_1.quadsToDocs(cayley.get(doc['@id'])).map(doc => send({ doc, op }))).then(() => { });
};
const { send } = memux({
    name: NAME,
    url: KAFKA_ADDRESS,
    input: INPUT_TOPIC,
    output: OUTPUT_TOPIC,
    receive
});
