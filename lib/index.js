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
const memux_1 = require("memux");
const node_fetch_1 = require("node-fetch");
const Cayley = require('cayley');
const { Observable: { empty } } = require('rxjs');
const PQueue = require('p-queue');
const jsonld = require('jsonld');
const Config = require("./config");
const helpers_1 = require("./helpers");
const cayley = Cayley(Config.CAYLEY_ADDRESS);
function getDoc(subject) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Getting doc:', subject);
        const g = cayley.graph;
        const query = `
  var subject = ${JSON.stringify(helpers_1.encodeIRI(subject))};
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
        const url = `${Config.CAYLEY_ADDRESS}/api/v1/query/gizmo`;
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
function init({ name, url, input, output }) {
    return __awaiter(this, void 0, void 0, function* () {
        const ssl = {
            key: Config.KAFKA_PRIVATE_KEY,
            cert: Config.KAFKA_CERT,
            ca: Config.KAFKA_CA,
        };
        const send = yield memux_1.createSend({
            name,
            url,
            topic: output,
            concurrency: Config.CONCURRENCY,
            ssl
        });
        const receive = (operation) => __awaiter(this, void 0, void 0, function* () {
            if (!memux_1.isOperation(operation))
                throw new Error();
            const { action, data } = operation;
            const quads = yield helpers_1.docToQuads(data);
            console.log('Processing quads:', action, data, quads);
            return new Promise((resolve, reject) => {
                if (quads.length === 0)
                    return resolve();
                cayley[action](quads, (error, body, response) => __awaiter(this, void 0, void 0, function* () {
                    console.log('Quads sent to cayley:', error, body);
                    if (error != null)
                        return reject(error);
                    if (response.statusCode >= 200 && response.statusCode < 400) {
                        return Promise.all(helpers_1.quadsToDocs(yield getDoc(data['@id'])).map(data => send({ action, key: data['@id'], data }))).then(() => resolve());
                    }
                    if (response.statusCode === 400) {
                        if ((body.error || body).match(/quad exists/))
                            return resolve();
                        if ((body.error || body).match(/invalid quad/))
                            return resolve();
                    }
                    reject();
                }));
            });
        });
        return memux_1.createReceive({
            name,
            url,
            topic: input,
            receive,
            ssl
        });
    });
}
exports.default = init;
if (require.main === module) {
    console.log("Running as script.");
    console.log('Initializing with config:', Config);
    init({
        name: Config.NAME,
        url: Config.KAFKA_ADDRESS,
        input: Config.INPUT_TOPIC,
        output: Config.OUTPUT_TOPIC,
    }).catch(console.error);
}
